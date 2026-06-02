#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publishMode = process.argv.includes("--publish");
const errors = [];
const warnings = [];
const pluginVersions = new Map();
const marketplaceVersions = [];
const strikeEntrypointSkillNames = new Set(["new-initiative", "go"]);

function rel(filePath) {
  return path.relative(root, filePath) || ".";
}

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function walkFiles(relativeDir) {
  const absoluteDir = path.join(root, relativeDir);
  if (!fs.existsSync(absoluteDir)) {
    return [];
  }

  const files = [];
  for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
    const relativePath = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(relativePath));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }
  return files;
}

function readJson(relativePath) {
  const filePath = path.join(root, relativePath);
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`${relativePath}: ${error.message}`);
    return null;
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isKebabName(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 64 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
  );
}

function isSemver(value) {
  return typeof value === "string" && /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(value);
}

function expectPath(relativePath, context) {
  if (!exists(relativePath)) {
    fail(`${context}: missing ${relativePath}`);
  }
}

function resolveFrom(baseRelativePath, manifestPath) {
  if (typeof manifestPath !== "string" || !manifestPath.startsWith("./")) {
    return null;
  }
  return path.join(baseRelativePath, manifestPath.slice(2));
}

function validatePathField(baseRelativePath, manifest, field, context) {
  if (manifest[field] === undefined) {
    return;
  }
  if (isPlainObject(manifest[field])) {
    return;
  }
  if (Array.isArray(manifest[field])) {
    for (const [index, manifestPath] of manifest[field].entries()) {
      if (isPlainObject(manifestPath)) {
        continue;
      }
      validateSinglePathField(baseRelativePath, manifestPath, `${context}.${field}[${index}]`);
    }
    return;
  }
  validateSinglePathField(baseRelativePath, manifest[field], `${context}.${field}`);
}

function validateSinglePathField(baseRelativePath, manifestPath, context) {
  const resolved = resolveFrom(baseRelativePath, manifestPath);
  if (!resolved) {
    fail(`${context}: must be a relative path starting with ./`);
    return;
  }
  expectPath(resolved, context);
}

function validateLocalSourcePath(sourcePath, context) {
  if (typeof sourcePath !== "string") {
    fail(`${context}: source path must be a string`);
    return;
  }
  const relativePath = sourcePath.startsWith("./") ? sourcePath.slice(2) : sourcePath;
  if (relativePath.startsWith("../") || path.isAbsolute(relativePath)) {
    fail(`${context}: local source path must stay inside the marketplace root`);
    return;
  }
  expectPath(relativePath, context);
}

function validateCodexSource(source, context) {
  if (typeof source === "string") {
    validateLocalSourcePath(source, context);
    return;
  }
  if (!isPlainObject(source)) {
    fail(`${context}: source must be a string or object`);
    return;
  }

  if (source.source === "local") {
    validateLocalSourcePath(source.path, context);
    return;
  }
  if (source.source === "url") {
    if (typeof source.url !== "string" || source.url.length === 0) {
      fail(`${context}: url source requires url`);
    }
    return;
  }
  if (source.source === "git-subdir") {
    if (typeof source.url !== "string" || source.url.length === 0) {
      fail(`${context}: git-subdir source requires url`);
    }
    if (typeof source.path !== "string" || source.path.length === 0) {
      fail(`${context}: git-subdir source requires path`);
    }
    return;
  }

  fail(`${context}: unsupported Codex source type ${JSON.stringify(source.source)}`);
}

function validatePortableSource(source, context) {
  if (typeof source === "string") {
    validateLocalSourcePath(source, context);
    return;
  }
  if (!isPlainObject(source)) {
    fail(`${context}: source must be a string or object`);
    return;
  }

  if (source.source === "github") {
    if (typeof source.repo !== "string" || source.repo.length === 0) {
      fail(`${context}: github source requires repo`);
    }
    return;
  }
  if (source.source === "url") {
    if (typeof source.url !== "string" || source.url.length === 0) {
      fail(`${context}: url source requires url`);
    }
    return;
  }
  if (source.source === "git-subdir") {
    if (typeof source.url !== "string" || source.url.length === 0) {
      fail(`${context}: git-subdir source requires url`);
    }
    if (typeof source.path !== "string" || source.path.length === 0) {
      fail(`${context}: git-subdir source requires path`);
    }
    return;
  }
  if (source.source === "npm") {
    if (typeof source.package !== "string" || source.package.length === 0) {
      fail(`${context}: npm source requires package`);
    }
    return;
  }

  fail(`${context}: unsupported portable source type ${JSON.stringify(source.source)}`);
}

function validateCodexMarketplace() {
  const marketplacePath = ".agents/plugins/marketplace.json";
  const marketplace = readJson(marketplacePath);
  if (!marketplace) return;

  if (!isKebabName(marketplace.name)) {
    fail(`${marketplacePath}: name must be kebab-case and non-placeholder`);
  }

  if (!Array.isArray(marketplace.plugins)) {
    fail(`${marketplacePath}: plugins must be an array`);
    return;
  }

  for (const entry of marketplace.plugins) {
    if (!isPlainObject(entry)) {
      fail(`${marketplacePath}: each plugin entry must be an object`);
      continue;
    }
    if (!isKebabName(entry.name)) {
      fail(`${marketplacePath}: plugin entry name must be kebab-case`);
    }
    validateCodexSource(entry.source, `${marketplacePath}.${entry.name}`);
    if (!isPlainObject(entry.policy)) {
      fail(`${marketplacePath}: ${entry.name} must include policy`);
    } else {
      if (!["AVAILABLE", "NOT_AVAILABLE", "INSTALLED_BY_DEFAULT"].includes(entry.policy.installation)) {
        fail(`${marketplacePath}: ${entry.name} has invalid policy.installation`);
      }
      if (!["ON_INSTALL", "ON_USE"].includes(entry.policy.authentication)) {
        fail(`${marketplacePath}: ${entry.name} has invalid policy.authentication`);
      }
    }
    if (typeof entry.category !== "string" || entry.category.length === 0) {
      fail(`${marketplacePath}: ${entry.name} must include category`);
    }
  }
}

function validateClaudeMarketplace() {
  validatePortableMarketplace(".claude-plugin/marketplace.json", {
    descriptionInMetadata: false,
  });
}

function validatePortableMarketplace(marketplacePath, options) {
  const marketplace = readJson(marketplacePath);
  if (!marketplace) return;

  if (!isKebabName(marketplace.name)) {
    fail(`${marketplacePath}: name must be kebab-case`);
  }

  if (!isPlainObject(marketplace.owner) || typeof marketplace.owner.name !== "string") {
    fail(`${marketplacePath}: owner.name is required`);
  }

  const version = options.descriptionInMetadata ? marketplace.metadata?.version : marketplace.version;
  if (!isSemver(version)) {
    fail(`${marketplacePath}: version must be semver (repo policy for release alignment)`);
  }

  if (!Array.isArray(marketplace.plugins)) {
    fail(`${marketplacePath}: plugins must be an array`);
    return;
  }

  for (const entry of marketplace.plugins) {
    if (!isPlainObject(entry)) {
      fail(`${marketplacePath}: each plugin entry must be an object`);
      continue;
    }
    if (!isKebabName(entry.name)) {
      fail(`${marketplacePath}: plugin entry name must be kebab-case`);
    }
    validatePortableSource(entry.source, `${marketplacePath}.${entry.name}`);
    if (!isSemver(entry.version)) {
      fail(`${marketplacePath}: ${entry.name} version must be semver (repo policy for release alignment)`);
    } else {
      marketplaceVersions.push({
        marketplacePath,
        pluginName: entry.name,
        version: entry.version,
      });
    }
  }
}

function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    return null;
  }

  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (/^\s/.test(line)) continue;
    const fieldMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!fieldMatch) continue;
    let value = fieldMatch[2].trim();
    value = value.replace(/^["']|["']$/g, "");
    fields[fieldMatch[1]] = value;
  }
  return fields;
}

function validateSkill(skillPath) {
  const skillName = path.basename(skillPath);
  const skillFile = path.join(skillPath, "SKILL.md");

  if (!fs.existsSync(skillFile)) {
    fail(`${rel(skillPath)}: missing SKILL.md`);
    return;
  }

  const skillText = fs.readFileSync(skillFile, "utf8");
  const frontmatter = parseFrontmatter(skillText);
  if (!frontmatter) {
    fail(`${rel(skillFile)}: missing YAML frontmatter`);
    return;
  }

  if (!isKebabName(frontmatter.name)) {
    fail(`${rel(skillFile)}: frontmatter name must be kebab-case`);
  } else if (frontmatter.name !== skillName) {
    fail(`${rel(skillFile)}: frontmatter name must match folder name ${skillName}`);
  }

  if (!frontmatter.description || frontmatter.description.includes("TODO")) {
    fail(`${rel(skillFile)}: frontmatter description is required and must not be a placeholder`);
  } else if (frontmatter.description.length > 1024) {
    fail(`${rel(skillFile)}: frontmatter description should stay under 1024 characters`);
  }

  if (frontmatter["allowed-tools"]?.includes(",")) {
    fail(`${rel(skillFile)}: allowed-tools must be space-separated for Agent Skills portability`);
  }

  const fenceCount = [...skillText.matchAll(/^\s*```/gm)].length;
  if (fenceCount % 2 !== 0) {
    fail(`${rel(skillFile)}: Markdown code fences must be balanced`);
  }

  const concreteClaudeInvocations = [...skillText.matchAll(/\/strike:[a-z0-9-]+/g)].map((match) => match[0]);
  if (concreteClaudeInvocations.length > 0) {
    fail(
      `${rel(skillFile)}: concrete /strike:<skill> commands are Claude-specific; keep host invocation syntax in README/docs (${[
        ...new Set(concreteClaudeInvocations),
      ].join(", ")})`,
    );
  }
  if (/(^|\n)\s*\/clear(\s|$)/.test(skillText) || skillText.includes("`/clear`")) {
    fail(`${rel(skillFile)}: /clear is host-specific; keep host invocation syntax in README/docs`);
  }

  const openaiMetadataPath = path.join(skillPath, "agents/openai.yaml");
  if (!fs.existsSync(openaiMetadataPath)) {
    fail(`${rel(skillPath)}: missing agents/openai.yaml`);
  } else {
    const openaiMetadata = fs.readFileSync(openaiMetadataPath, "utf8");
    if (strikeEntrypointSkillNames.has(skillName)) {
      if (!/disable-model-invocation:\s*true/.test(skillText)) {
        fail(`${rel(skillFile)}: ${skillName} must be explicit user-invocation only`);
      }
      if (!/allow_implicit_invocation:\s*true/.test(openaiMetadata)) {
        fail(`${rel(openaiMetadataPath)}: ${skillName} must allow implicit Codex invocation`);
      }
      const requiredInterfaceFields = ["display_name", "short_description", "default_prompt"];
      const missingInterfaceFields = requiredInterfaceFields.filter(
        (field) => !new RegExp(`^\\s*${field}:\\s*["']?\\S`, "m").test(openaiMetadata),
      );
      if (missingInterfaceFields.length > 0) {
        fail(`${rel(openaiMetadataPath)}: ${skillName} must provide Codex interface metadata`);
      }
      if (!/display_name:\s*["']?Strike:/m.test(openaiMetadata)) {
        fail(`${rel(openaiMetadataPath)}: ${skillName} display_name must make Strike visible`);
      }
      if (!new RegExp(`default_prompt:\\s*["']?\\$strike:${skillName}\\b`, "m").test(openaiMetadata)) {
        fail(`${rel(openaiMetadataPath)}: ${skillName} default_prompt must use $strike:${skillName}`);
      }
    } else if (!/allow_implicit_invocation:\s*false/.test(openaiMetadata)) {
      fail(`${rel(openaiMetadataPath)}: expected allow_implicit_invocation: false`);
    }
  }
}

function validatePlugin(pluginPath) {
  const pluginName = path.basename(pluginPath);
  const relativePluginPath = rel(pluginPath);
  const codexManifestPath = path.join(relativePluginPath, ".codex-plugin/plugin.json");
  const claudeManifestPath = path.join(relativePluginPath, ".claude-plugin/plugin.json");
  const codex = readJson(codexManifestPath);
  const claude = readJson(claudeManifestPath);

  for (const [host, manifest, manifestPath] of [
    ["codex", codex, codexManifestPath],
    ["claude", claude, claudeManifestPath],
  ]) {
    if (!manifest) continue;
    if (manifest.name !== pluginName) {
      fail(`${manifestPath}: name must match plugin folder ${pluginName}`);
    }
    if (!isSemver(manifest.version)) {
      fail(`${manifestPath}: version must be semver (repo policy for release alignment)`);
    }
    if (typeof manifest.description !== "string" || manifest.description.includes("TODO")) {
      fail(`${manifestPath}: description is required and must not be a placeholder`);
    }
    if (manifest.license !== "MIT") {
      fail(`${manifestPath}: license must be MIT`);
    }
    validatePathField(relativePluginPath, manifest, "skills", `${host} manifest`);
    validatePathField(relativePluginPath, manifest, "agents", `${host} manifest`);
    validatePathField(relativePluginPath, manifest, "commands", `${host} manifest`);
    validatePathField(relativePluginPath, manifest, "hooks", `${host} manifest`);
    validatePathField(relativePluginPath, manifest, "mcpServers", `${host} manifest`);
    validatePathField(relativePluginPath, manifest, "lspServers", `${host} manifest`);
    validatePathField(relativePluginPath, manifest, "outputStyles", `${host} manifest`);
    if (host === "codex") {
      validatePathField(relativePluginPath, manifest, "apps", `${host} manifest`);
      if (
        Array.isArray(manifest.interface?.defaultPrompt) &&
        manifest.interface.defaultPrompt.length > 3
      ) {
        fail(`${manifestPath}: interface.defaultPrompt must contain at most 3 prompts`);
      }
    }
  }

  const manifestVersions = [codex, claude]
    .filter(Boolean)
    .map((manifest) => manifest.version);
  if (new Set(manifestVersions).size > 1) {
    fail(`${relativePluginPath}: Codex and Claude manifest versions should match`);
  }
  if (manifestVersions.length > 0 && new Set(manifestVersions).size === 1) {
    pluginVersions.set(pluginName, manifestVersions[0]);
  }

  const skillsPath = path.join(pluginPath, "skills");
  if (!fs.existsSync(skillsPath)) {
    fail(`${relativePluginPath}: missing skills directory`);
    return;
  }

  const skillDirectories = fs
    .readdirSync(skillsPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => path.join(skillsPath, entry.name));

  if (skillDirectories.length === 0) {
    const message = `${rel(skillsPath)}: no production skills have been added yet`;
    if (publishMode) {
      fail(`${message}; publishing an empty plugin is blocked`);
    } else {
      warn(message);
    }
  }

  for (const skillDirectory of skillDirectories) {
    validateSkill(skillDirectory);
  }
}

function validatePlugins() {
  const pluginsPath = path.join(root, "plugins");
  if (!fs.existsSync(pluginsPath)) {
    fail("plugins: missing plugin directory");
    return;
  }

  const pluginDirectories = fs
    .readdirSync(pluginsPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => path.join(pluginsPath, entry.name));

  if (pluginDirectories.length === 0) {
    fail("plugins: expected at least one plugin");
    return;
  }

  for (const pluginDirectory of pluginDirectories) {
    validatePlugin(pluginDirectory);
  }
}

function validateVersionAlignment() {
  for (const { marketplacePath, pluginName, version } of marketplaceVersions) {
    const pluginVersion = pluginVersions.get(pluginName);
    if (pluginVersion && version !== pluginVersion) {
      fail(`${marketplacePath}: ${pluginName} version ${version} must match plugin manifest version ${pluginVersion}`);
    }
  }
}

function validateSharedReferences() {
  validateRuntimeReferenceBoundary();
}

function validateRuntimeReferenceBoundary() {
  const allowedRuntimeReferences = [
    /^plugins\/strike\/references\/language\.md$/,
    /^plugins\/strike\/references\/slug-policy\.md$/,
    /^plugins\/strike\/references\/verification-evidence\.md$/,
    /^plugins\/strike\/references\/scripts\/[a-z0-9-]+\.mjs$/,
  ];

  for (const relativePath of walkFiles("plugins/strike/references")) {
    const normalizedPath = relativePath.split(path.sep).join("/");
    if (!allowedRuntimeReferences.some((pattern) => pattern.test(normalizedPath))) {
      fail(`${normalizedPath}: plugin references are runtime-loaded assets; move dev docs to docs/ or add an explicit runtime allowlist entry`);
    }
  }
}

function validateLicense() {
  if (!exists("LICENSE")) {
    fail("LICENSE: missing MIT license file");
  } else {
    const licenseText = fs.readFileSync(path.join(root, "LICENSE"), "utf8");
    if (!licenseText.startsWith("MIT License")) {
      fail("LICENSE: expected MIT License text");
    }
  }

  const packageJson = readJson("package.json");
  if (packageJson && packageJson.license !== "MIT") {
    fail("package.json: license must be MIT");
  }
}

function validateStrikeWorkflow() {
  const skillPath = "plugins/strike/skills/go/SKILL.md";
  const helperPath = "plugins/strike/skills/go/scripts/state.mjs";

  if (!exists(skillPath) || !exists(helperPath)) {
    return;
  }

  const skillText = fs.readFileSync(path.join(root, skillPath), "utf8");
  const helperText = fs.readFileSync(path.join(root, helperPath), "utf8");
  const workflowSkills = [
    ...skillText.matchAll(/^- `([a-z0-9-]+)\/SKILL\.md` - /gm),
  ].map((match) => match[1]);

  if (workflowSkills.length === 0) {
    fail(`${skillPath}: expected a workflow skill list using skill-name/SKILL.md entries`);
    return;
  }
  if (workflowSkills.length !== new Set(workflowSkills).size) {
    fail(`${skillPath}: workflow skill list contains duplicate entries`);
  }

  const helperSkills = [...helperText.matchAll(/\["([a-z0-9-]+)",\s*\[/g)].map(
    (match) => match[1],
  );
  const helperSkillSet = new Set(helperSkills);
  const workflowSkillSet = new Set(workflowSkills);

  if (helperSkills.length !== helperSkillSet.size) {
    fail(`${helperPath}: workflow templates contain duplicate skill entries`);
  }

  for (const skill of workflowSkills) {
    expectPath(`plugins/strike/skills/${skill}/SKILL.md`, `${skillPath} workflow`);
    if (!helperSkillSet.has(skill)) {
      fail(`${helperPath}: workflow templates missing ${skill}`);
    }
    if (!helperText.includes(`case "${skill}":`)) {
      fail(`${helperPath}: artifact resolver missing ${skill}`);
    }
  }

  for (const skill of helperSkills) {
    if (!workflowSkillSet.has(skill)) {
      fail(`${helperPath}: workflow templates include ${skill}, but ${skillPath} does not`);
    }
  }
}

function requireText(text, needle, context) {
  if (!text.includes(needle)) {
    fail(`${context}: missing ${needle}`);
  }
}

function validateStrikeContract() {
  const strikePath = "plugins/strike/skills/go/SKILL.md";
  const helperPath = "plugins/strike/skills/go/scripts/state.mjs";
  const refinePath = "plugins/strike/skills/refine-idea/SKILL.md";
  const researchInitiativePath = "plugins/strike/skills/research-initiative/SKILL.md";
  const grillPath = "plugins/strike/skills/grill-idea/SKILL.md";
  const createMainPath = "plugins/strike/skills/create-main-spec/SKILL.md";
  const createDevPath = "plugins/strike/skills/create-development-phases/SKILL.md";
  const createPhasePath = "plugins/strike/skills/create-phase-spec/SKILL.md";
  const researchPath = "plugins/strike/skills/research-slice/SKILL.md";
  const createSlicesPath = "plugins/strike/skills/create-phase-slices/SKILL.md";
  const planPath = "plugins/strike/skills/plan-slice/SKILL.md";
  const verifyPath = "plugins/strike/skills/verify-slice-plan/SKILL.md";
  const buildPath = "plugins/strike/skills/build-slice/SKILL.md";
  const verifyBuildPath = "plugins/strike/skills/verify-slice-build/SKILL.md";
  const fixPath = "plugins/strike/skills/fix/SKILL.md";
  const verifyPhasePath = "plugins/strike/skills/verify-phase/SKILL.md";
  const verifyMainPath = "plugins/strike/skills/verify-main-spec/SKILL.md";
  const verificationEvidencePath = "plugins/strike/references/verification-evidence.md";
  const dogfoodPath = "docs/dogfood.md";

  if (![strikePath, helperPath, refinePath, researchInitiativePath, grillPath, createMainPath, createDevPath, createPhasePath, researchPath, createSlicesPath, planPath, verifyPath, buildPath, verifyBuildPath, fixPath, verifyPhasePath, verifyMainPath, verificationEvidencePath, dogfoodPath].every(exists)) {
    return;
  }

  const strikeText = fs.readFileSync(path.join(root, strikePath), "utf8");
  const helperText = fs.readFileSync(path.join(root, helperPath), "utf8");
  const refineText = fs.readFileSync(path.join(root, refinePath), "utf8");
  const researchInitiativeText = fs.readFileSync(path.join(root, researchInitiativePath), "utf8");
  const grillText = fs.readFileSync(path.join(root, grillPath), "utf8");
  const createMainText = fs.readFileSync(path.join(root, createMainPath), "utf8");
  const createDevText = fs.readFileSync(path.join(root, createDevPath), "utf8");
  const createPhaseText = fs.readFileSync(path.join(root, createPhasePath), "utf8");
  const researchText = fs.readFileSync(path.join(root, researchPath), "utf8");
  const createSlicesText = fs.readFileSync(path.join(root, createSlicesPath), "utf8");
  const planText = fs.readFileSync(path.join(root, planPath), "utf8");
  const verifyText = fs.readFileSync(path.join(root, verifyPath), "utf8");
  const buildText = fs.readFileSync(path.join(root, buildPath), "utf8");
  const verifyBuildText = fs.readFileSync(path.join(root, verifyBuildPath), "utf8");
  const fixText = fs.readFileSync(path.join(root, fixPath), "utf8");
  const verifyPhaseText = fs.readFileSync(path.join(root, verifyPhasePath), "utf8");
  const verifyMainText = fs.readFileSync(path.join(root, verifyMainPath), "utf8");
  const verificationEvidenceText = fs.readFileSync(path.join(root, verificationEvidencePath), "utf8");
  const dogfoodText = fs.readFileSync(path.join(root, dogfoodPath), "utf8");

  const strikeWorkflowSkillTexts = {
    [strikePath]: strikeText,
    [refinePath]: refineText,
    [researchInitiativePath]: researchInitiativeText,
    [grillPath]: grillText,
    [createMainPath]: createMainText,
    [createDevPath]: createDevText,
    [createPhasePath]: createPhaseText,
    [researchPath]: researchText,
    [createSlicesPath]: createSlicesText,
    [planPath]: planText,
    [verifyPath]: verifyText,
    [buildPath]: buildText,
    [verifyBuildPath]: verifyBuildText,
    [fixPath]: fixText,
    [verifyPhasePath]: verifyPhaseText,
    [verifyMainPath]: verifyMainText,
  };
  const forbiddenGitInspectionPatterns = [
    /\bgit\s+(?:diff|status)\b/,
    /\bstatus\s+--short\b/,
  ];
  for (const [sourcePath, text] of Object.entries(strikeWorkflowSkillTexts)) {
    for (const pattern of forbiddenGitInspectionPatterns) {
      if (pattern.test(text)) {
        fail(`${sourcePath}: Strike workflow skills should not prescribe git inspection commands`);
      }
    }
  }

  const researchListIndex = strikeText.indexOf("`research-slice/SKILL.md`");
  const planListIndex = strikeText.indexOf("`plan-slice/SKILL.md`");
  if (researchListIndex === -1 || planListIndex === -1 || researchListIndex > planListIndex) {
    fail(`${strikePath}: research-slice must appear before plan-slice in the workflow list`);
  }
  const refineListIndex = strikeText.indexOf("`refine-idea/SKILL.md`");
  const initiativeResearchListIndex = strikeText.indexOf("`research-initiative/SKILL.md`");
  const grillListIndex = strikeText.indexOf("`grill-idea/SKILL.md`");
  if (
    refineListIndex === -1 ||
    initiativeResearchListIndex === -1 ||
    grillListIndex === -1 ||
    refineListIndex > initiativeResearchListIndex ||
    initiativeResearchListIndex > grillListIndex
  ) {
    fail(`${strikePath}: research-initiative must appear between refine-idea and grill-idea in the workflow list`);
  }

  const helperResearchIndex = helperText.indexOf('["research-slice", ["researchComplete"]]');
  const helperPlanIndex = helperText.indexOf('["plan-slice", ["planCreated"]]');
  if (helperResearchIndex === -1 || helperPlanIndex === -1 || helperResearchIndex > helperPlanIndex) {
    fail(`${helperPath}: research-slice must appear before plan-slice in the slice workflow`);
  }
  const helperRefineIndex = helperText.indexOf('["refine-idea", ["ideaRefined"]]');
  const helperInitiativeResearchIndex = helperText.indexOf(
    '["research-initiative", ["initiativeResearchComplete"]]',
  );
  const helperGrillIndex = helperText.indexOf('["grill-idea", ["decisionsResolved"]]');
  if (
    helperRefineIndex === -1 ||
    helperInitiativeResearchIndex === -1 ||
    helperGrillIndex === -1 ||
    helperRefineIndex > helperInitiativeResearchIndex ||
    helperInitiativeResearchIndex > helperGrillIndex
  ) {
    fail(`${helperPath}: research-initiative must appear between refine-idea and grill-idea in the initiative workflow`);
  }
  requireText(helperText, 'case "research-initiative":', helperPath);
  requireText(helperText, "requireResearchScopeCheckpoint", helperPath);
  requireText(helperText, "requireReadyForGrill", helperPath);
  requireText(helperText, "requireResearchReports", helperPath);
  requireText(helperText, "requireResearchAudits", helperPath);
  requireText(helperText, "researchAuditsById", helperPath);
  requireText(helperText, "safeResearchAuditPath", helperPath);
  requireText(helperText, "normalizeState", helperPath);
  requireText(helperText, 'command === "sync-helper"', helperPath);
  requireText(helperText, "isStrikeStateHelper", helperPath);
  requireText(helperText, "Ready to research: yes", helperPath);
  requireText(helperText, "Ready for grill: yes", helperPath);
  requireText(helperText, "No material research needed: yes", helperPath);
  requireText(helperText, "<research-item-id>.md", helperPath);
  requireText(helperText, "audits/<research-item-id>.md", helperPath);
  requireText(helperText, "initiativeResearchComplete", helperPath);
  requireText(helperText, 'case "research-slice":', helperPath);
  requireText(helperText, 'command === "reopen-check"', helperPath);
  requireText(helperText, 'command === "reopen-phase-check"', helperPath);
  requireText(helperText, 'command === "reopen-slice-check"', helperPath);
  requireText(helperText, "reopenPhaseCheck", helperPath);
  requireText(helperText, "reopenSliceCheck", helperPath);
  requireText(helperText, "reopenCurrentScopeDependents", helperPath);
  requireText(helperText, "INITIATIVE_UPSTREAM_CHECKS", helperPath);
  requireText(helperText, "research.md", helperPath);
  requireText(helperText, "build.md", helperPath);
  requireText(strikeText, "## Route-Back Handling", strikePath);
  requireText(strikeText, "## Failed Verification Loop", strikePath);
  requireText(strikeText, "fix/SKILL.md", strikePath);
  requireText(strikeText, "Fix Needed: yes", strikePath);
  requireText(strikeText, "Fixed: no` and `Route Back` says `Needed: yes", strikePath);
  requireText(strikeText, "Must Fix", strikePath);
  requireText(strikeText, "Follow-Up", strikePath);
  requireText(strikeText, "Accepted Risk", strikePath);
  requireText(strikeText, "reopen-check researchComplete", strikePath);
  requireText(strikeText, "reopen-phase-check", strikePath);
  requireText(strikeText, "reopen-slice-check", strikePath);
  requireText(strikeText, "Built: yes", strikePath);
  requireText(strikeText, "allSlicesVerified", strikePath);
  requireText(strikeText, "allPhasesVerified", strikePath);
  requireText(strikeText, "Do not complete `ideaRefined` unless `idea.md` contains `## User Checkpoint`", strikePath);
  requireText(strikeText, "Do not complete `initiativeResearchComplete` unless `research/scope.md`", strikePath);
  requireText(strikeText, "each approved research item has a non-empty report file and a non-empty audit", strikePath);
  requireText(strikeText, "Must Fix count: 0", strikePath);
  requireText(strikeText, "No material research needed: yes", strikePath);
  requireText(strikeText, "sync-helper", strikePath);
  requireText(strikeText, "Do not complete `decisionsResolved` unless `decisions.md` contains", strikePath);
  requireText(strikeText, "## Decision Review", strikePath);
  requireText(strikeText, "`Verdict: pass` or `Verdict: accepted-risk`", strikePath);
  requireText(strikeText, "`research-initiative`: pass `idea.md`", strikePath);
  requireText(strikeText, "missing or weak initiative research -> `reopen-check initiativeResearchComplete`", strikePath);
  requireText(strikeText, "supporting-artifacts/", strikePath);
  requireText(strikeText, "`research-slice`: pass `main-spec.md`, `research/index.md`, relevant\n  initiative research reports and audits", strikePath);
  requireText(strikeText, "`plan-slice`: pass `main-spec.md`, `research/index.md`, relevant initiative\n  research reports and audits", strikePath);
  requireText(strikeText, "`verify-slice-plan`: pass the slice artifacts plus `research/index.md`,\n  relevant initiative research reports and audits", strikePath);
  requireText(strikeText, "It is not\nhidden source of truth", strikePath);
  requireText(strikeText, "pass `plan.md`, `plan-verification.md`, relevant\n  `supporting-artifacts/` named in the plan", strikePath);
  requireText(strikeText, "write `plan.md` with a focused", strikePath);
  requireText(strikeText, "`Verification Evidence Plan`; complete", strikePath);
  requireText(strikeText, "Split Recommendation` is\n`Needed: yes`", strikePath);
  requireText(strikeText, "read that skill's `SKILL.md` from\nthe installed Strike plugin", strikePath);
  requireText(strikeText, "add/update planned automated tests, run focused\n  verification evidence checks", strikePath);
  requireText(strikeText, "use existing repo precedent before patching\n  technical symptoms or integration/dataflow behavior", strikePath);
  requireText(strikeText, "confirm grouped verification evidence", strikePath);
  requireText(strikeText, "## Slice Git Checkpoint", strikePath);
  requireText(strikeText, "After `buildVerified` is complete for a slice, commit and push that slice", strikePath);
  requireText(strikeText, "After completing `buildVerified`, complete the slice git checkpoint", strikePath);
  requireText(strikeText, "Do not prescribe extra git inspection commands", strikePath);
  requireText(strikeText, "then commit and push that completed slice before moving on", strikePath);

  requireText(helperText, "requireUserCheckpoint", helperPath);
  requireText(helperText, "requireDecisionReview", helperPath);
  requireText(helperText, "Ready to continue: yes", helperPath);
  requireText(helperText, "non-empty User response", helperPath);

  requireText(verificationEvidenceText, "Environment:", verificationEvidencePath);
  requireText(verificationEvidenceText, "E2E tests and Browser Clickthrough must stay in their proper environments", verificationEvidencePath);
  requireText(verificationEvidenceText, "tests in the repo's test/E2E environment", verificationEvidencePath);
  requireText(verificationEvidenceText, "browser clickthrough in the dev/local\n  app environment", verificationEvidencePath);
  requireText(verificationEvidenceText, "Do not modify env files, DB targets, or runtime mode", verificationEvidencePath);
  requireText(verificationEvidenceText, "A failed first browser route, URL form, or browser tool is not enough", verificationEvidencePath);
  requireText(verificationEvidenceText, "try another available\nbrowser surface before failing verification", verificationEvidencePath);
  requireText(dogfoodText, "## Browser Checks", dogfoodPath);
  requireText(dogfoodText, "### Nested Browser Harnesses", dogfoodPath);
  requireText(dogfoodText, "This observer check helps classify the failure; it\ndoes not replace target-agent browser evidence", dogfoodPath);
  requireText(dogfoodText, "target browser evidence: failed / missing", dogfoodPath);
  requireText(dogfoodText, "The target workflow remains unverified until the target agent completes the\nBrowser Clickthrough itself", dogfoodPath);
  requireText(dogfoodText, "keep observer browser checks separate from target evidence", dogfoodPath);
  requireText(dogfoodText, "## Browser Evidence", dogfoodPath);

  requireText(refineText, "Initiate a user checkpoint before finishing", refinePath);
  requireText(refineText, "Existing artifacts can inform\n  the refined idea, but they do not replace hearing from the user", refinePath);
  requireText(refineText, "## User Checkpoint", refinePath);
  requireText(refineText, "Ready to continue: yes / no", refinePath);
  requireText(refineText, "## Research Candidates", refinePath);
  requireText(refineText, "the research scope needed before Grill", refinePath);
  requireText(refineText, "Do not treat provided docs, prior schemas, planning files, or silence", refinePath);

  for (const heading of [
    "## Research Scope",
    "## Evidence Rules",
    "## Research Pass",
    "## Research Audit",
    "### `scope.md`",
    "### Per-item reports",
    "### Per-item audits",
    "### `index.md`",
  ]) {
    requireText(researchInitiativeText, heading, researchInitiativePath);
  }
  requireText(researchInitiativeText, "allowed-tools: Read Write Edit Bash Grep Glob WebFetch WebSearch Agent", researchInitiativePath);
  requireText(researchInitiativeText, "Initiate a user checkpoint before running the full research", researchInitiativePath);
  requireText(researchInitiativeText, "Do not combine distinct provider/model capabilities", researchInitiativePath);
  requireText(researchInitiativeText, "official or primary sources", researchInitiativePath);
  requireText(researchInitiativeText, "For OpenAI APIs and models", researchInitiativePath);
  requireText(researchInitiativeText, "use a separate research pass for each approved item", researchInitiativePath);
  requireText(researchInitiativeText, "Audit each per-item report before `research/index.md`", researchInitiativePath);
  requireText(researchInitiativeText, "Do not tell the research worker to rely on a later\naudit", researchInitiativePath);
  requireText(researchInitiativeText, "Use this audit prompt shape", researchInitiativePath);
  requireText(researchInitiativeText, "Audit: pass / needs-fix / accepted-risk", researchInitiativePath);
  requireText(researchInitiativeText, "research/audits/", researchInitiativePath);
  requireText(researchInitiativeText, "## Research Audit", researchInitiativePath);
  requireText(researchInitiativeText, "Must Fix count:", researchInitiativePath);
  requireText(researchInitiativeText, "Ready to research: yes / no", researchInitiativePath);
  requireText(researchInitiativeText, "Ready for grill: yes / no", researchInitiativePath);
  requireText(researchInitiativeText, "Do not complete this gate until `scope.md` records a user response", researchInitiativePath);
  requireText(researchInitiativeText, "Do not compress multiple material dependencies into one report", researchInitiativePath);
  requireText(researchInitiativeText, "no unresolved audit\n  `Must Fix` findings", researchInitiativePath);
  requireText(researchInitiativeText, "write `Ready for\n  grill: no`", researchInitiativePath);

  requireText(grillText, "## Decision Depth", grillPath);
  requireText(grillText, "## Core Loop", grillPath);
  requireText(grillText, "Walk the consequential decision tree until shared understanding", grillPath);
  requireText(grillText, "Facts: agent resolves. Tradeoffs: agent recommends. Choices: user decides", grillPath);
  requireText(grillText, "Do not ask the user factual questions you can answer yourself", grillPath);
  requireText(grillText, "Do not silently decide product, scope, risk", grillPath);
  requireText(grillText, "## Decision Tree", grillPath);
  requireText(grillText, "## Decision Review", grillPath);
  requireText(grillText, "Decision review prompt", grillPath);
  requireText(grillText, "## Pressure Points", grillPath);
  requireText(grillText, "## Decision Checkpoint", grillPath);
  requireText(grillText, "`lean`", grillPath);
  requireText(grillText, "`standard`", grillPath);
  requireText(grillText, "`deep`", grillPath);
  requireText(grillText, "auth, security, privacy", grillPath);
  requireText(grillText, "core noun before qualifiers", grillPath);
  requireText(grillText, "concrete scenarios for abstract decisions", grillPath);
  requireText(grillText, "current truth", grillPath);
  requireText(grillText, "Spec-Owned Details", grillPath);
  requireText(grillText, "Do not infer user answers from silence", grillPath);
  requireText(grillText, "Do not silently draft around a consequential fork", grillPath);
  requireText(grillText, "Do not move to the final checkpoint while consequential decision nodes remain", grillPath);
  requireText(grillText, "run a read-only decision review", grillPath);
  requireText(grillText, "Do not complete Grill without `## Decision Review`", grillPath);
  requireText(grillText, "Do not let decision review replace user questioning", grillPath);
  requireText(grillText, "Initiate a user checkpoint before finishing", grillPath);
  requireText(grillText, "Existing artifacts can inform\n  the decision record, but they do not replace hearing from the user", grillPath);
  requireText(grillText, "## User Checkpoint", grillPath);
  requireText(grillText, "Ready to continue: yes / no", grillPath);
  requireText(grillText, "Validation / browser or live checks", grillPath);
  requireText(grillText, "research/index.md", grillPath);
  requireText(grillText, "Research constraints:", grillPath);
  requireText(grillText, "Substantial missing research belongs back in `research-initiative`", grillPath);
  requireText(grillText, "## Supporting Artifacts", grillPath);
  requireText(grillText, "supporting-artifacts/", grillPath);
  requireText(grillText, "Do not let supporting artifacts become hidden source of truth", grillPath);

  requireText(createMainText, "## Quality Bar", createMainPath);
  requireText(createMainText, "## Research Inputs", createMainPath);
  requireText(createMainText, "## Supporting Artifacts", createMainPath);
  requireText(createMainText, "supporting-artifacts/", createMainPath);
  requireText(createMainText, "research/index.md", createMainPath);
  requireText(createMainText, "fresh context window", createMainPath);
  requireText(createMainText, "without re-interviewing the user", createMainPath);
  requireText(createMainText, "Do not create a development plan, phases, slices", createMainPath);
  requireText(createMainText, "Out of scope, with why", createMainPath);
  requireText(createMainText, "Needs user decision", createMainPath);
  requireText(createMainText, "Repo-Verifiable", createMainPath);
  requireText(createMainText, "Live / Human", createMainPath);
  requireText(createMainText, "Engineering Pressure Points", createMainPath);
  requireText(createMainText, "Security, Privacy, Permissions, And Data Integrity", createMainPath);
  requireText(createMainText, "Development Handoff", createMainPath);
  requireText(createMainText, "do not revive rejected options", createMainPath);
  requireText(createMainText, "not overstate weak evidence", createMainPath);
  requireText(createMainText, "Do not omit material initiative research constraints", createMainPath);
  requireText(createMainText, "Do not let supporting artifacts remain hidden context", createMainPath);
  requireText(createMainText, "core noun before qualifiers", createMainPath);
  requireText(createMainText, "if the chat transcript is gone", createMainPath);

  requireText(createDevText, "initiative research constraints", createDevPath);
  requireText(createDevText, "supporting artifacts", createDevPath);
  requireText(createDevText, "observable, reviewable, or\nverifiable", createDevPath);
  requireText(createDevText, "fuzzy acceptance", createDevPath);
  requireText(createDevText, "One phase\nis correct when splitting would create fake work", createDevPath);
  requireText(createDevText, "horizontal phases", createDevPath);
  requireText(createDevText, "foundation phase is allowed only", createDevPath);
  requireText(createDevText, "smallest ordered phase list", createDevPath);
  requireText(createDevText, "canonical phase IDs", createDevPath);
  requireText(createDevText, "prove the most important uncertainty", createDevPath);
  requireText(createDevText, "likely surfaces or watchouts", createDevPath);
  requireText(createDevText, "Ask only when the spec cannot be phased", createDevPath);
  requireText(createDevText, "## Phase Map", createDevPath);
  requireText(createDevText, "Why Separate", createDevPath);
  requireText(createDevText, "Phase-Spec Focus", createDevPath);
  requireText(createDevText, "Do not create phase specs, slice files", createDevPath);
  requireText(createDevText, "without\n  re-slicing the initiative", createDevPath);

  requireText(createPhaseText, "initiative research constraints", createPhasePath);
  requireText(createPhaseText, "supporting-artifacts/", createPhasePath);
  requireText(createPhaseText, "## Quality Bar", createPhasePath);
  requireText(createPhaseText, "`create-phase-slices` can split this one phase", createPhasePath);
  requireText(createPhaseText, "without rediscovering the main spec", createPhasePath);
  requireText(createPhaseText, "phase-specific information", createPhasePath);
  requireText(createPhaseText, "Out of scope, with why", createPhasePath);
  requireText(createPhaseText, "Needs user decision", createPhasePath);
  requireText(createPhaseText, "repo-verifiable checks and live/human checks", createPhasePath);
  requireText(createPhaseText, "PROJECT_LANGUAGE.md", createPhasePath);
  requireText(createPhaseText, "core noun before qualifiers", createPhasePath);
  requireText(createPhaseText, "Likely Surfaces / Blast Radius", createPhasePath);
  requireText(createPhaseText, "Research / Watchouts", createPhasePath);
  requireText(createPhaseText, "Phase Boundary Check", createPhasePath);
  requireText(createPhaseText, "Too broad / small / stale / horizontal", createPhasePath);
  requireText(createPhaseText, "Slice Handoff", createPhasePath);
  requireText(createPhaseText, "Do not create slices, slice acceptance criteria", createPhasePath);
  requireText(createPhaseText, "if the chat transcript is gone", createPhasePath);

  for (const heading of [
    "## Decision",
    "## Findings",
    "## Slice Size Check",
    "## Domain Notes",
    "## Questions Or Blockers",
    "## Ready For Planning",
  ]) {
    requireText(researchText, heading, researchPath);
  }
  requireText(researchText, "Ready for planning: yes / no", researchPath);
  requireText(researchText, "official docs", researchPath);
  requireText(researchText, "source-backed evidence", researchPath);
  requireText(researchText, "Label weak evidence as weak", researchPath);
  requireText(researchText, "money, accounting", researchPath);
  requireText(researchText, "Use this when `Needed: no`", researchPath);
  requireText(researchText, "Before doing slice-specific research, read `research/index.md`", researchPath);
  requireText(researchText, "relevant per-item reports and audit files", researchPath);
  requireText(researchText, "accepted-risk initiative research as inherited baseline evidence", researchPath);
  requireText(researchText, "Do not redo initiative-level provider/model/API", researchPath);
  requireText(researchText, "changes, narrows, or confirms the initiative research", researchPath);
  requireText(researchText, "supporting-artifacts/", researchPath);
  requireText(researchText, "Do not write the slice plan", researchPath);
  requireText(researchText, "Do not silently redo missing initiative-level research", researchPath);
  requireText(researchText, "as short as possible", researchPath);
  requireText(researchText, "Less verbose is\nbetter", researchPath);
  requireText(researchText, "Record implications, not a diary", researchPath);
  requireText(researchText, "Do not paste raw notes, long excerpts", researchPath);
  requireText(researchText, "Too broad: yes / no", researchPath);
  requireText(researchText, "edit the\n  current slice into the first smaller slice", researchPath);

  requireText(createSlicesText, "Read relevant initiative research constraints", createSlicesPath);
  requireText(createSlicesText, "supporting-artifacts/", createSlicesPath);
  requireText(createSlicesText, "A vertical slice is one observable behavior path", createSlicesPath);
  requireText(createSlicesText, "Work on one phase at a time", createSlicesPath);
  requireText(createSlicesText, "route back to the\nowning phase step", createSlicesPath);
  requireText(createSlicesText, "Good vertical slice examples", createSlicesPath);
  requireText(createSlicesText, "Usually bad slice shapes", createSlicesPath);
  requireText(createSlicesText, "| XS | 1 file; tiny config, function, copy, or style change. |", createSlicesPath);
  requireText(createSlicesText, "| M | 3-7 files; one complete vertical behavior path or tightly coupled behavior cluster. |", createSlicesPath);
  requireText(createSlicesText, "| XL | 12+ files; usually too large for one slice. |", createSlicesPath);
  requireText(createSlicesText, "more than 7 likely files", createSlicesPath);
  requireText(createSlicesText, "more than 4 acceptance criteria", createSlicesPath);
  requireText(createSlicesText, "UI plus route/API plus state/data plus tests", createSlicesPath);
  requireText(createSlicesText, "Do not label a slice `M` while accepting `L/XL` signals from independent", createSlicesPath);
  requireText(createSlicesText, "Non-vertical slices are allowed only when they reduce risk", createSlicesPath);
  requireText(createSlicesText, "## Quality Bar", createSlicesPath);
  requireText(createSlicesText, "without re-slicing the phase", createSlicesPath);
  requireText(createSlicesText, "A fresh context should be able to open any `slice.md`", createSlicesPath);
  requireText(createSlicesText, "One slice is correct when splitting would create fake work", createSlicesPath);
  requireText(createSlicesText, "edge/flow notes", createSlicesPath);
  requireText(createSlicesText, "state, permissions, data\n  integrity, integrations, UI/device, operations, and recovery", createSlicesPath);
  requireText(createSlicesText, "create one directory per slice and write\n`slice.md` inside it", createSlicesPath);
  requireText(createSlicesText, "Do not create a shared `slices.md`, `index.md`, or\ndependency-map file", createSlicesPath);
  requireText(createSlicesText, "Vertical / Non-vertical", createSlicesPath);
  requireText(createSlicesText, "## Verification Intent", createSlicesPath);
  requireText(createSlicesText, "## Edge / Flow Notes", createSlicesPath);
  requireText(createSlicesText, "## Risks / Watchouts", createSlicesPath);
  requireText(createSlicesText, "Keep implementation planning, execution tasks", createSlicesPath);
  requireText(createSlicesText, "## Why Not Split", createSlicesPath);
  requireText(createSlicesText, "## Non-Vertical Justification", createSlicesPath);
  requireText(createSlicesText, "Do not create shared slice indexes", createSlicesPath);

  requireText(planText, "## Initiative Research Used", planPath);
  requireText(planText, "## Supporting Artifacts Used", planPath);
  requireText(planText, "Use initiative research as inherited constraints", planPath);
  requireText(planText, "Read the slice stub, `research/index.md`, relevant initiative research\n  reports and audits", planPath);
  requireText(planText, "Treat passing or accepted-risk initiative research as baseline\n  evidence", planPath);
  requireText(planText, "relevant per-item report and audit before adding new\n  tactical research", planPath);
  requireText(planText, "do not redo initiative-level research unless the slice has a narrower", planPath);
  requireText(planText, "official or primary sources when the\nfact is external, current, or high-stakes", planPath);
  requireText(planText, "supporting-artifacts/", planPath);
  requireText(planText, "slice research", planPath);
  requireText(planText, "current slice's `research.md`", planPath);
  requireText(planText, "current slice's `plan.md`", planPath);
  requireText(planText, "If research\nwas marked unnecessary", planPath);
  requireText(planText, "Ready for planning: no", planPath);
  requireText(planText, "Preserve the slice outcome, acceptance criteria", planPath);
  requireText(planText, "Do tactical research as needed", planPath);
  requireText(planText, "implementation, verification, or risk", planPath);
  requireText(planText, "Classify the kind of work the slice is about to do", planPath);
  requireText(planText, "For each relevant work category, inspect how the repo already structures", planPath);
  requireText(planText, "verification evidence categories", planPath);
  requireText(planText, "same class of problem before proposing a new pattern", planPath);
  requireText(planText, "core noun before qualifiers lens", planPath);
  requireText(planText, "adjective-noun siblings", planPath);
  requireText(planText, "simplest safe approach", planPath);
  requireText(planText, "not a step-by-step coding script", planPath);
  requireText(planText, "## Research Used", planPath);
  requireText(planText, "## Implementation Research Additions", planPath);
  requireText(planText, "## Repo Pattern Scan", planPath);
  requireText(planText, "Work categories:", planPath);
  requireText(planText, "Existing examples reviewed:", planPath);
  requireText(planText, "Chosen precedents:", planPath);
  requireText(planText, "Pattern decisions:", planPath);
  requireText(planText, "Networking / provider integration:", planPath);
  requireText(planText, "Upload / file / asset storage:", planPath);
  requireText(planText, "Testing / E2E / browser verification:", planPath);
  requireText(planText, "using the same\ncompact style", planPath);
  requireText(planText, "changes, narrows, or\nconfirms initiative research", planPath);
  requireText(planText, "Do not paste raw notes, long excerpts", planPath);
  requireText(planText, "## Slice Boundary", planPath);
  requireText(planText, "Acceptance criteria covered:", planPath);
  requireText(planText, "Out of scope:", planPath);
  requireText(planText, "references/verification-evidence.md", planPath);
  requireText(planText, "## Verification Evidence Plan", planPath);
  requireText(planText, "### Static / Build Checks", planPath);
  requireText(planText, "### Unit / Component / Integration Tests", planPath);
  requireText(planText, "### E2E Tests", planPath);
  requireText(planText, "### Browser Clickthrough", planPath);
  requireText(planText, "### Visual Evidence", planPath);
  requireText(planText, "### Skipped / Not Applicable", planPath);
  requireText(planText, "Environment:", planPath);
  requireText(planText, "DB/runtime:", planPath);
  requireText(planText, "Fixtures/data setup:", planPath);
  requireText(planText, "Representative data:", planPath);
  requireText(planText, "Controls/actions:", planPath);
  requireText(planText, "Similar repo precedent:", planPath);
  requireText(planText, "Do not default to a full test suite", planPath);
  requireText(planText, "Browser Clickthrough should use the dev/local app environment", planPath);
  requireText(planText, "test environment clickthrough as\n  equivalent proof", planPath);
  requireText(planText, "Do not write the implementation approach until `Repo Pattern Scan` classifies", planPath);
  requireText(planText, "## Split Recommendation", planPath);
  requireText(planText, "Needed: yes / no", planPath);
  requireText(planText, "bloated plan", planPath);
  requireText(planText, "edit the current slice into the first smaller slice", planPath);
  requireText(planText, "stable repo paths, commands, constraints", planPath);
  requireText(planText, "tighten it before calling it build-ready", planPath);

  requireText(verifyText, "## Research Gate", verifyPath);
  requireText(verifyText, "## Issues", verifyPath);
  requireText(verifyText, "### Must Fix", verifyPath);
  requireText(verifyText, "### Follow-Up", verifyPath);
  requireText(verifyText, "### Accepted Risk", verifyPath);
  requireText(verifyText, "Fix Needed: yes / no", verifyPath);
  requireText(verifyText, "## Route Back", verifyPath);
  requireText(verifyText, "Ready for planning: yes", verifyPath);
  requireText(verifyText, "current slice's `research.md`", verifyPath);
  requireText(verifyText, "current slice's `plan.md`", verifyPath);
  requireText(verifyText, "current phase's `phase-spec.md`", verifyPath);
  requireText(verifyText, "supporting-artifacts/", verifyPath);
  requireText(verifyText, "plan's `Slice Boundary`", verifyPath);
  requireText(verifyText, "## Supporting Artifacts", verifyPath);
  requireText(verifyText, "supporting artifact usage", verifyPath);
  requireText(verifyText, "relevant `supporting-artifacts/` notes are\n  ignored by the plan", verifyPath);
  requireText(verifyText, "out-of-scope boundaries", verifyPath);
  requireText(verifyText, "verification intent", verifyPath);
  requireText(verifyText, "core\n  noun before qualifiers lens", verifyPath);
  requireText(verifyText, "adjective-noun siblings", verifyPath);
  requireText(verifyText, "concrete `Verification Evidence Plan`", verifyPath);
  requireText(verifyText, "tests use the repo's test/E2E environment while Browser Clickthrough uses the\n  dev/local app environment", verifyPath);
  requireText(verifyText, "verification environments are missing, swapped", verifyPath);
  requireText(verifyText, "default full-suite command", verifyPath);
  requireText(verifyText, "research `Slice Size Check`", verifyPath);
  requireText(verifyText, "If it says `Too broad: yes`", verifyPath);
  requireText(verifyText, "plan-verification.md", verifyPath);
  requireText(verifyText, "read-only review subagents", verifyPath);
  requireText(verifyText, "host does not support subagents", verifyPath);
  requireText(verifyText, "inline lenses", verifyPath);
  requireText(verifyText, "implementation-plan", verifyPath);
  requireText(verifyText, "grouped verification\n  evidence plan", verifyPath);
  requireText(verifyText, "similar-precedent awareness", verifyPath);
  requireText(verifyText, "`Repo Pattern Scan` classifies", verifyPath);
  requireText(verifyText, "repo pattern scan classification", verifyPath);
  requireText(verifyText, "`Repo Pattern Scan` is missing", verifyPath);
  requireText(verifyText, "lacks a repo-precedent\n  scan", verifyPath);
  requireText(verifyText, "Always run this subagent", verifyPath);
  requireText(verifyText, "Always consider `canonical-implementation`", verifyPath);
  requireText(verifyText, "official docs", verifyPath);
  requireText(verifyText, "Stripe, Shopify, Amazon", verifyPath);
  requireText(verifyText, "state-data-integrity", verifyPath);
  requireText(verifyText, "security-privacy", verifyPath);
  requireText(verifyText, "integration-risk", verifyPath);
  requireText(verifyText, "ui-regression", verifyPath);
  requireText(verifyText, "user-flows", verifyPath);
  requireText(verifyText, "accessibility", verifyPath);
  requireText(verifyText, "Suggested Category: Must Fix / Follow-Up / Accepted Risk", verifyPath);
  requireText(verifyText, "Command: None / reopen-check", verifyPath);
  requireText(verifyText, "Phase: None / <phase-id>", verifyPath);
  requireText(verifyText, "Slice: None / <slice-id>", verifyPath);
  requireText(verifyText, "Check: None / researchComplete / planCreated", verifyPath);
  requireText(verifyText, "Do not edit `plan.md`", verifyPath);
  requireText(verifyText, "complete-check planVerified", verifyPath);
  requireText(verifyText, "researchComplete", verifyPath);
  requireText(verifyText, "planCreated", verifyPath);
  requireText(verifyText, "research says `Too broad: yes`", verifyPath);
  requireText(verifyText, "cohesive and verifiable in one focused build loop", verifyPath);
  requireText(verifyText, "independent outcomes, cannot\n  be verified in one focused loop", verifyPath);
  requireText(verifyText, "Give every `Must Fix` item a stable short issue ID", verifyPath);
  requireText(verifyText, "set `Fix Needed: no`", verifyPath);
  requireText(verifyText, "route back to `researchComplete`", verifyPath);
  requireText(verifyText, "rerun research and planning", verifyPath);

  requireText(buildText, "verified slice plan from the current slice's `plan.md`", buildPath);
  requireText(buildText, "supporting-artifacts/", buildPath);
  requireText(buildText, "current slice's `plan-verification.md`", buildPath);
  requireText(buildText, "optional slice, research, or phase-spec context only", buildPath);
  requireText(buildText, "Treat `plan.md` as the primary build handoff", buildPath);
  requireText(buildText, "If `plan-verification.md` does not say `Ready: yes`, write `Built: no`", buildPath);
  requireText(buildText, "route back to `verify-slice-plan` and do not edit implementation files", buildPath);
  requireText(buildText, "plan's `Repo Pattern Scan`, `Slice Boundary`, `Surfaces`, `Approach`,\n  `Verification Evidence Plan`, and `Verification`", buildPath);
  requireText(buildText, "smallest complete path", buildPath);
  requireText(buildText, "Follow the repo structures and precedents selected in the plan's\n  `Repo Pattern Scan`", buildPath);
  requireText(buildText, "search for existing repo examples of the same class of problem", buildPath);
  requireText(buildText, "Add or update the focused Unit / Component / Integration Tests and E2E Tests", buildPath);
  requireText(buildText, "Run automated tests in the planned test/E2E environment", buildPath);
  requireText(buildText, "Do not switch Browser Clickthrough to a test DB or test\n  environment", buildPath);
  requireText(buildText, "Do not declare Browser Clickthrough blocked after one failed browser URL", buildPath);
  requireText(buildText, "retry with alternate local\n  URL forms and another available browser surface", buildPath);
  requireText(buildText, "Do not default to a full suite", buildPath);
  requireText(buildText, "important\n  implementation notes", buildPath);
  requireText(buildText, "Use engineering judgment for ordinary implementation details", buildPath);
  requireText(buildText, "Do not route back for ordinary implementation choices", buildPath);
  requireText(buildText, "current slice's `build.md`", buildPath);
  requireText(buildText, "Built: yes / no", buildPath);
  requireText(buildText, "## Verification Evidence", buildPath);
  requireText(buildText, "### Static / Build Checks", buildPath);
  requireText(buildText, "### Unit / Component / Integration Tests", buildPath);
  requireText(buildText, "### E2E Tests", buildPath);
  requireText(buildText, "### Browser Clickthrough", buildPath);
  requireText(buildText, "### Visual Evidence", buildPath);
  requireText(buildText, "### Skipped / Not Applicable", buildPath);
  requireText(buildText, "DB/runtime:", buildPath);
  requireText(buildText, "Fixtures/data setup:", buildPath);
  requireText(buildText, "Similar repo precedent used:", buildPath);
  requireText(buildText, "Command: None / reopen-check", buildPath);
  requireText(buildText, "Phase: None / <phase-id>", buildPath);
  requireText(buildText, "Slice: None / <slice-id>", buildPath);
  requireText(buildText, "Check: None / planCreated / planVerified", buildPath);
  requireText(buildText, "complete-check implemented", buildPath);
  requireText(buildText, "verified plan cannot be followed without expanding or redesigning", buildPath);
  requireText(buildText, "write `Built: no` and route back to the\n  owning workflow step so Strike can continue", buildPath);
  requireText(buildText, "Do not re-evaluate whether the slice is well-shaped", buildPath);
  requireText(buildText, "Read upstream artifacts only when they are needed", buildPath);
  requireText(buildText, "Keep environments separate too", buildPath);
  requireText(buildText, "Do not treat a failing command, provider response, workflow error, payload\n  limit", buildPath);

  requireText(verifyBuildText, "current slice's `slice.md`", verifyBuildPath);
  requireText(verifyBuildText, "supporting-artifacts/", verifyBuildPath);
  requireText(verifyBuildText, "current slice's `research.md`", verifyBuildPath);
  requireText(verifyBuildText, "current slice's `plan.md`", verifyBuildPath);
  requireText(verifyBuildText, "current slice's `plan-verification.md`", verifyBuildPath);
  requireText(verifyBuildText, "current slice's `build.md`", verifyBuildPath);
  requireText(verifyBuildText, "current phase's `phase-spec.md`", verifyBuildPath);
  requireText(verifyBuildText, "build-verification.md", verifyBuildPath);
  requireText(verifyBuildText, "Built: yes", verifyBuildPath);
  requireText(verifyBuildText, "Confirm planned Unit / Component / Integration Tests and E2E Tests", verifyBuildPath);
  requireText(verifyBuildText, "Confirm automated tests ran in the repo's test/E2E environment", verifyBuildPath);
  requireText(verifyBuildText, "Do not default to a full test suite", verifyBuildPath);
  requireText(verifyBuildText, "read-only review subagents", verifyBuildPath);
  requireText(verifyBuildText, "host does not support subagents", verifyBuildPath);
  requireText(verifyBuildText, "inline lenses", verifyBuildPath);
  requireText(verifyBuildText, "canonical-implementation", verifyBuildPath);
  requireText(verifyBuildText, "code-quality", verifyBuildPath);
  requireText(verifyBuildText, "clear homes for UI, API/actions", verifyBuildPath);
  requireText(verifyBuildText, "purpose names instead of vague buckets", verifyBuildPath);
  requireText(verifyBuildText, "core noun before qualifiers for files, types", verifyBuildPath);
  requireText(verifyBuildText, "small modules without hidden side effects", verifyBuildPath);
  requireText(verifyBuildText, "centralized and documented env access", verifyBuildPath);
  requireText(verifyBuildText, "useful debug evidence without leaking sensitive data", verifyBuildPath);
  requireText(verifyBuildText, "loading,\n  empty, success, failure, recovery, accessibility, and responsive states", verifyBuildPath);
  requireText(verifyBuildText, "technical symptoms, workflow errors, provider responses, payload\n  limits", verifyBuildPath);
  requireText(verifyBuildText, "functionality", verifyBuildPath);
  requireText(verifyBuildText, "spec-coverage", verifyBuildPath);
  requireText(verifyBuildText, "edge-cases", verifyBuildPath);
  requireText(verifyBuildText, "ui-regression", verifyBuildPath);
  requireText(verifyBuildText, "user-flows", verifyBuildPath);
  requireText(verifyBuildText, "state-data-integrity", verifyBuildPath);
  requireText(verifyBuildText, "security-privacy", verifyBuildPath);
  requireText(verifyBuildText, "integration-risk", verifyBuildPath);
  requireText(verifyBuildText, "accessibility", verifyBuildPath);
  requireText(verifyBuildText, "Suggested Category: Must Fix / Follow-Up / Accepted Risk", verifyBuildPath);
  requireText(verifyBuildText, "run an actual Browser Clickthrough after the slice\nbuild", verifyBuildPath);
  requireText(verifyBuildText, "Browser Clickthrough means using the feature", verifyBuildPath);
  requireText(verifyBuildText, "Browser Clickthrough should run against the dev/local app environment", verifyBuildPath);
  requireText(verifyBuildText, "Do not accept a single failed browser route, URL form, navigation timeout", verifyBuildPath);
  requireText(verifyBuildText, "try another available browser surface before writing\n`Verified: no`", verifyBuildPath);
  requireText(verifyBuildText, "Opening a route shell, logging in, navigating near the feature", verifyBuildPath);
  requireText(verifyBuildText, "automated tests and Browser Clickthrough are separate gates", verifyBuildPath);
  requireText(verifyBuildText, "tests\nbelong in the repo's test/E2E environment", verifyBuildPath);
  requireText(verifyBuildText, "## Issues", verifyBuildPath);
  requireText(verifyBuildText, "## Verification Evidence", verifyBuildPath);
  requireText(verifyBuildText, "### Static / Build Checks", verifyBuildPath);
  requireText(verifyBuildText, "### Unit / Component / Integration Tests", verifyBuildPath);
  requireText(verifyBuildText, "### E2E Tests", verifyBuildPath);
  requireText(verifyBuildText, "### Browser Clickthrough", verifyBuildPath);
  requireText(verifyBuildText, "### Visual Evidence", verifyBuildPath);
  requireText(verifyBuildText, "### Skipped / Not Applicable", verifyBuildPath);
  requireText(verifyBuildText, "DB/runtime:", verifyBuildPath);
  requireText(verifyBuildText, "Fixtures/data setup:", verifyBuildPath);
  requireText(verifyBuildText, "### Must Fix", verifyBuildPath);
  requireText(verifyBuildText, "### Follow-Up", verifyBuildPath);
  requireText(verifyBuildText, "### Accepted Risk", verifyBuildPath);
  requireText(verifyBuildText, "Verified: yes / no", verifyBuildPath);
  requireText(verifyBuildText, "Fix Needed: yes / no", verifyBuildPath);
  requireText(verifyBuildText, "Command: None / reopen-check", verifyBuildPath);
  requireText(verifyBuildText, "Phase: None / <phase-id>", verifyBuildPath);
  requireText(verifyBuildText, "Slice: None / <slice-id>", verifyBuildPath);
  requireText(verifyBuildText, "Check: None / researchComplete / planCreated / planVerified / implemented", verifyBuildPath);
  requireText(verifyBuildText, "Do not edit implementation files", verifyBuildPath);
  requireText(verifyBuildText, "Browser Clickthrough was moved to a test DB/environment", verifyBuildPath);
  requireText(verifyBuildText, "patched\n  without checking existing repo precedent", verifyBuildPath);
  requireText(verifyBuildText, "Give every `Must Fix` item a stable short issue ID", verifyBuildPath);
  requireText(verifyBuildText, "complete-check buildVerified", verifyBuildPath);
  requireText(strikeText, "build-verification.md", strikePath);
  requireText(strikeText, "Verified: yes", strikePath);
  requireText(strikeText, "finish-initiative", strikePath);
  requireText(strikeText, "oversized slice discovered before build", strikePath);
  requireText(strikeText, "preserve the original slice ID as the first\nsmaller slice", strikePath);

  requireText(fixText, "failed Strike verification pass", fixPath);
  requireText(fixText, "## Source Verification", fixPath);
  requireText(fixText, "## Issues Addressed", fixPath);
  requireText(fixText, "## Repo Precedent", fixPath);
  requireText(fixText, "Closest existing pattern:", fixPath);
  requireText(fixText, "Ready for re-verification: yes / no", fixPath);
  requireText(fixText, "## Route Back", fixPath);
  requireText(fixText, "Command: None / reopen-check / reopen-phase-check / reopen-slice-check", fixPath);
  requireText(fixText, "Phase: None / <phase-id>", fixPath);
  requireText(fixText, "Slice: None / <slice-id>", fixPath);
  requireText(fixText, "Check: None / <state-check>", fixPath);
  requireText(fixText, "Use one of three outcomes", fixPath);
  requireText(fixText, "use the exact helper command Strike should run", fixPath);
  requireText(fixText, "same verifier must run again", fixPath);
  requireText(fixText, "Must Fix", fixPath);
  requireText(fixText, "same class of problem. Use error terms, provider names", fixPath);
  requireText(fixText, "payload limit", fixPath);

  requireText(verifyPhaseText, "current phase's `phase-spec.md`", verifyPhasePath);
  requireText(verifyPhaseText, "supporting-artifacts/", verifyPhasePath);
  requireText(verifyPhaseText, "each slice's `slice.md`", verifyPhasePath);
  requireText(verifyPhaseText, "each slice's `research.md`", verifyPhasePath);
  requireText(verifyPhaseText, "each slice's `plan.md`", verifyPhasePath);
  requireText(verifyPhaseText, "each slice's `plan-verification.md`", verifyPhasePath);
  requireText(verifyPhaseText, "each slice's `build.md`", verifyPhasePath);
  requireText(verifyPhaseText, "each slice's `build-verification.md`", verifyPhasePath);
  requireText(verifyPhaseText, "current phase's `verification.md`", verifyPhasePath);
  requireText(verifyPhaseText, "Verified: yes", verifyPhasePath);
  requireText(verifyPhaseText, "read-only review subagents", verifyPhasePath);
  requireText(verifyPhaseText, "host does not support subagents", verifyPhasePath);
  requireText(verifyPhaseText, "inline lenses", verifyPhasePath);
  requireText(verifyPhaseText, "Do not rerun a full slice code review", verifyPhasePath);
  requireText(verifyPhaseText, "phase-spec-coverage", verifyPhasePath);
  requireText(verifyPhaseText, "cross-slice-integration", verifyPhasePath);
  requireText(verifyPhaseText, "phase-user-flows", verifyPhasePath);
  requireText(verifyPhaseText, "phase-state-data-integrity", verifyPhasePath);
  requireText(verifyPhaseText, "phase-security-privacy", verifyPhasePath);
  requireText(verifyPhaseText, "phase-integration-risk", verifyPhasePath);
  requireText(verifyPhaseText, "Suggested Category: Must Fix / Follow-Up / Accepted Risk", verifyPhasePath);
  requireText(verifyPhaseText, "only when a user-facing flow spans\nmultiple slices", verifyPhasePath);
  requireText(verifyPhaseText, "Browser Clickthrough means using the feature", verifyPhasePath);
  requireText(verifyPhaseText, "supporting evidence only. They are not Browser Clickthrough", verifyPhasePath);
  requireText(verifyPhaseText, "did not include actual Browser Clickthrough", verifyPhasePath);
  requireText(verifyPhaseText, "Environment scope:", verifyPhasePath);
  requireText(verifyPhaseText, "using a test DB/environment\n  for dev/local Browser Clickthrough", verifyPhasePath);
  requireText(verifyPhaseText, "## Issues", verifyPhasePath);
  requireText(verifyPhaseText, "### Must Fix", verifyPhasePath);
  requireText(verifyPhaseText, "### Follow-Up", verifyPhasePath);
  requireText(verifyPhaseText, "### Accepted Risk", verifyPhasePath);
  requireText(verifyPhaseText, "Ready: yes / no", verifyPhasePath);
  requireText(verifyPhaseText, "Fix Needed: yes / no", verifyPhasePath);
  requireText(verifyPhaseText, "Slice: None / <slice-id>", verifyPhasePath);
  requireText(verifyPhaseText, "Command: None / reopen-check / reopen-slice-check", verifyPhasePath);
  requireText(verifyPhaseText, "Check: None / phaseSpecCreated / slicesCreated / researchComplete / planCreated / planVerified / implemented / buildVerified", verifyPhasePath);
  requireText(verifyPhaseText, "Do not edit slice artifacts or implementation files", verifyPhasePath);
  requireText(verifyPhaseText, "Give every `Must Fix` item a stable short issue ID", verifyPhasePath);
  requireText(verifyPhaseText, "complete-check allSlicesVerified", verifyPhasePath);

  requireText(verifyMainText, "current initiative's `main-spec.md`", verifyMainPath);
  requireText(verifyMainText, "research/index.md", verifyMainPath);
  requireText(verifyMainText, "supporting-artifacts/", verifyMainPath);
  requireText(verifyMainText, "initiativeResearchComplete", verifyMainPath);
  requireText(verifyMainText, "current initiative's `development-plan.md`", verifyMainPath);
  requireText(verifyMainText, "each phase's `phase.md`", verifyMainPath);
  requireText(verifyMainText, "each phase's `phase-spec.md`", verifyMainPath);
  requireText(verifyMainText, "each phase's `verification.md`", verifyMainPath);
  requireText(verifyMainText, "current initiative's `verification.md`", verifyMainPath);
  requireText(verifyMainText, "read-only review subagents", verifyMainPath);
  requireText(verifyMainText, "host does not support subagents", verifyMainPath);
  requireText(verifyMainText, "inline lenses", verifyMainPath);
  requireText(verifyMainText, "Do not rerun full phase or slice audits", verifyMainPath);
  requireText(verifyMainText, "main-spec-coverage", verifyMainPath);
  requireText(verifyMainText, "cross-phase-integration", verifyMainPath);
  requireText(verifyMainText, "readiness-risk", verifyMainPath);
  requireText(verifyMainText, "final-user-flows", verifyMainPath);
  requireText(verifyMainText, "final-state-data-integrity", verifyMainPath);
  requireText(verifyMainText, "final-security-privacy", verifyMainPath);
  requireText(verifyMainText, "final-integration-risk", verifyMainPath);
  requireText(verifyMainText, "Suggested Category: Must Fix / Follow-Up / Accepted Risk", verifyMainPath);
  requireText(verifyMainText, "include final smoke evidence for both the\n  new/changed path and one preserved existing path", verifyMainPath);
  requireText(verifyMainText, "one final Browser Clickthrough or\nrepresentative user-flow check across the accepted scope", verifyMainPath);
  requireText(verifyMainText, "User-flow checks are not only browser checks", verifyMainPath);
  requireText(verifyMainText, "smoke-test the changed/new path and at least\none preserved existing path", verifyMainPath);
  requireText(verifyMainText, "visual screenshot check after representative\ndata exists", verifyMainPath);
  requireText(verifyMainText, "page is visibly loaded and styled", verifyMainPath);
  requireText(verifyMainText, "primary workflow area is visible", verifyMainPath);
  requireText(verifyMainText, "do not overlap\n  or clip", verifyMainPath);
  requireText(verifyMainText, "visually connected to the right\n  labels", verifyMainPath);
  requireText(verifyMainText, "## Visual Screenshot Check", verifyMainPath);
  requireText(verifyMainText, "Status: passed / failed / Not applicable", verifyMainPath);
  requireText(verifyMainText, "Do not write `Passed: no`", verifyMainPath);
  requireText(verifyMainText, "Screenshot:", verifyMainPath);
  requireText(verifyMainText, "Viewport:", verifyMainPath);
  requireText(verifyMainText, "Browser Clickthrough means using the accepted feature", verifyMainPath);
  requireText(verifyMainText, "supporting evidence only. They are not Browser Clickthrough", verifyMainPath);
  requireText(verifyMainText, "actual Browser Clickthrough or representative user-flow\n  exercise", verifyMainPath);
  requireText(verifyMainText, "Environment scope:", verifyMainPath);
  requireText(verifyMainText, "using a test\n  DB/environment for dev/local Browser Clickthrough", verifyMainPath);
  requireText(verifyMainText, "## Issues", verifyMainPath);
  requireText(verifyMainText, "### Must Fix", verifyMainPath);
  requireText(verifyMainText, "### Follow-Up", verifyMainPath);
  requireText(verifyMainText, "### Accepted Risk", verifyMainPath);
  requireText(verifyMainText, "Ready: yes / no", verifyMainPath);
  requireText(verifyMainText, "Fix Needed: yes / no", verifyMainPath);
  requireText(verifyMainText, "Phase: None / <phase-id>", verifyMainPath);
  requireText(verifyMainText, "Slice: None / <slice-id>", verifyMainPath);
  requireText(verifyMainText, "Command: None / reopen-check / reopen-phase-check / reopen-slice-check", verifyMainPath);
  requireText(verifyMainText, "Check: None / ideaRefined / initiativeResearchComplete / decisionsResolved / specCreated / phasesCreated / phaseSpecCreated / slicesCreated / researchComplete / planCreated / planVerified / implemented / buildVerified / allSlicesVerified", verifyMainPath);
  requireText(verifyMainText, "Do not edit phase, slice, or implementation artifacts", verifyMainPath);
  requireText(verifyMainText, "Give every `Must Fix` item a stable short issue ID", verifyMainPath);
  requireText(verifyMainText, "complete-check allPhasesVerified", verifyMainPath);

  const goPath = "plugins/strike/skills/go/SKILL.md";
  const goText = fs.readFileSync(path.join(root, goPath), "utf8");
  requireText(goText, "Do not batch multiple `complete-check` commands together", goPath);
  requireText(goText, "Complete only that one returned check", goPath);

  const newInitiativePath = "plugins/strike/skills/new-initiative/SKILL.md";
  const newInitiativeText = fs.readFileSync(path.join(root, newInitiativePath), "utf8");
  requireText(newInitiativeText, "Do not batch multiple `complete-check` commands together", newInitiativePath);
}

function validateCodexShortcutHandoffs() {
  for (const relativePath of walkFiles("plugins/strike")) {
    if (!/\.(md|sh|txt|yaml|yml|json)$/.test(relativePath)) {
      continue;
    }
    const text = fs.readFileSync(path.join(root, relativePath), "utf8");
    if (/Use the Strike [a-z0-9-]+ skill/.test(text)) {
      fail(`${relativePath}: Codex handoffs should use $ skill shortcuts, not long-form "Use the Strike ..." prompts`);
    }
    if (/next_codex=Use the Strike/.test(text)) {
      fail(`${relativePath}: generated Codex handoff should use $<skill> syntax`);
    }
    if (/\bCodex form\s*:/.test(text)) {
      fail(`${relativePath}: label rendered commands as "Next prompt", not "Codex form"`);
    }
  }
}

validateCodexMarketplace();
validateClaudeMarketplace();
validatePlugins();
validateVersionAlignment();
validateSharedReferences();
validateStrikeWorkflow();
validateStrikeContract();
validateCodexShortcutHandoffs();
validateLicense();

for (const warning of warnings) {
  console.warn(`warning: ${warning}`);
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`error: ${error}`);
  }
  process.exit(1);
}

console.log("Validated Strike repo structure.");
