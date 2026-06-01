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
const autoStrikeEntrypointSkillNames = new Set(["auto-strike-new-initiative", "auto-strike-go"]);

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
    if (autoStrikeEntrypointSkillNames.has(skillName)) {
      if (!/disable-model-invocation:\s*true/.test(skillText)) {
        fail(`${rel(skillFile)}: ${skillName} must be explicit user-invocation only`);
      }
      if (!/allow_implicit_invocation:\s*true/.test(openaiMetadata)) {
        fail(`${rel(openaiMetadataPath)}: ${skillName} must allow implicit Codex invocation`);
      }
      if (!/display_name:\s*["']?Auto Strike/.test(openaiMetadata)) {
        fail(`${rel(openaiMetadataPath)}: ${skillName} must provide Codex interface metadata`);
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

function validateAutoStrikeWorkflow() {
  const skillPath = "plugins/strike/skills/auto-strike-go/SKILL.md";
  const helperPath = "plugins/strike/skills/auto-strike-go/scripts/state.mjs";

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

function validateAutoStrikeContract() {
  const autoStrikePath = "plugins/strike/skills/auto-strike-go/SKILL.md";
  const helperPath = "plugins/strike/skills/auto-strike-go/scripts/state.mjs";
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

  if (![autoStrikePath, helperPath, grillPath, createMainPath, createDevPath, createPhasePath, researchPath, createSlicesPath, planPath, verifyPath, buildPath, verifyBuildPath, fixPath, verifyPhasePath, verifyMainPath].every(exists)) {
    return;
  }

  const autoStrikeText = fs.readFileSync(path.join(root, autoStrikePath), "utf8");
  const helperText = fs.readFileSync(path.join(root, helperPath), "utf8");
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

  const autoStrikeWorkflowSkillTexts = {
    [autoStrikePath]: autoStrikeText,
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
  for (const [sourcePath, text] of Object.entries(autoStrikeWorkflowSkillTexts)) {
    for (const pattern of forbiddenGitInspectionPatterns) {
      if (pattern.test(text)) {
        fail(`${sourcePath}: Auto Strike workflow skills should not prescribe git inspection commands`);
      }
    }
  }

  const researchListIndex = autoStrikeText.indexOf("`research-slice/SKILL.md`");
  const planListIndex = autoStrikeText.indexOf("`plan-slice/SKILL.md`");
  if (researchListIndex === -1 || planListIndex === -1 || researchListIndex > planListIndex) {
    fail(`${autoStrikePath}: research-slice must appear before plan-slice in the workflow list`);
  }

  const helperResearchIndex = helperText.indexOf('["research-slice", ["researchComplete"]]');
  const helperPlanIndex = helperText.indexOf('["plan-slice", ["planCreated"]]');
  if (helperResearchIndex === -1 || helperPlanIndex === -1 || helperResearchIndex > helperPlanIndex) {
    fail(`${helperPath}: research-slice must appear before plan-slice in the slice workflow`);
  }
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
  requireText(autoStrikeText, "## Route-Back Handling", autoStrikePath);
  requireText(autoStrikeText, "## Failed Verification Loop", autoStrikePath);
  requireText(autoStrikeText, "fix/SKILL.md", autoStrikePath);
  requireText(autoStrikeText, "Fix Needed: yes", autoStrikePath);
  requireText(autoStrikeText, "Fixed: no` and `Route Back` says `Needed: yes", autoStrikePath);
  requireText(autoStrikeText, "Must Fix", autoStrikePath);
  requireText(autoStrikeText, "Follow-Up", autoStrikePath);
  requireText(autoStrikeText, "Accepted Risk", autoStrikePath);
  requireText(autoStrikeText, "reopen-check researchComplete", autoStrikePath);
  requireText(autoStrikeText, "reopen-phase-check", autoStrikePath);
  requireText(autoStrikeText, "reopen-slice-check", autoStrikePath);
  requireText(autoStrikeText, "Built: yes", autoStrikePath);
  requireText(autoStrikeText, "allSlicesVerified", autoStrikePath);
  requireText(autoStrikeText, "allPhasesVerified", autoStrikePath);
  requireText(autoStrikeText, "pass `plan.md`, `plan-verification.md`, and repo files named\n  by the plan", autoStrikePath);
  requireText(autoStrikeText, "write `plan.md` with a focused `Test Plan`", autoStrikePath);
  requireText(autoStrikeText, "Split Recommendation` is\n`Needed: yes`", autoStrikePath);
  requireText(autoStrikeText, "read that skill's `SKILL.md` from\nthe installed Strike plugin", autoStrikePath);
  requireText(autoStrikeText, "add/update planned tests, run focused checks", autoStrikePath);
  requireText(autoStrikeText, "confirm focused test evidence", autoStrikePath);
  requireText(autoStrikeText, "## Slice Git Checkpoint", autoStrikePath);
  requireText(autoStrikeText, "After `buildVerified` is complete for a slice, commit and push that slice", autoStrikePath);
  requireText(autoStrikeText, "After completing `buildVerified`, complete the slice git checkpoint", autoStrikePath);
  requireText(autoStrikeText, "Do not prescribe extra git inspection commands", autoStrikePath);
  requireText(autoStrikeText, "then commit and push that\n  completed slice before moving on", autoStrikePath);

  requireText(grillText, "## Decision Depth", grillPath);
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
  requireText(grillText, "Validation / browser or live checks", grillPath);

  requireText(createMainText, "## Quality Bar", createMainPath);
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
  requireText(createMainText, "core noun before qualifiers", createMainPath);
  requireText(createMainText, "if the chat transcript is gone", createMainPath);

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
  requireText(researchText, "Do not write the slice plan", researchPath);
  requireText(researchText, "as short as possible", researchPath);
  requireText(researchText, "Less verbose is\nbetter", researchPath);
  requireText(researchText, "Record implications, not a diary", researchPath);
  requireText(researchText, "Do not paste raw notes, long excerpts", researchPath);
  requireText(researchText, "Too broad: yes / no", researchPath);
  requireText(researchText, "edit the\n  current slice into the first smaller slice", researchPath);

  requireText(createSlicesText, "A vertical slice is one observable behavior path", createSlicesPath);
  requireText(createSlicesText, "Work on one phase at a time", createSlicesPath);
  requireText(createSlicesText, "route back to the\nowning phase step", createSlicesPath);
  requireText(createSlicesText, "Good vertical slice examples", createSlicesPath);
  requireText(createSlicesText, "Usually bad slice shapes", createSlicesPath);
  requireText(createSlicesText, "| XS | 1 file; tiny config, function, copy, or style change. |", createSlicesPath);
  requireText(createSlicesText, "| M | 3-5 files; one complete vertical behavior path. |", createSlicesPath);
  requireText(createSlicesText, "| XL | 8+ files; too large for one slice. |", createSlicesPath);
  requireText(createSlicesText, "more than 5 likely files", createSlicesPath);
  requireText(createSlicesText, "more than 3 acceptance criteria", createSlicesPath);
  requireText(createSlicesText, "UI plus route/API plus state/data plus tests", createSlicesPath);
  requireText(createSlicesText, "Do not label a slice `M` while accepting `L/XL` signals", createSlicesPath);
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

  requireText(planText, "slice research", planPath);
  requireText(planText, "current slice's `research.md`", planPath);
  requireText(planText, "current slice's `plan.md`", planPath);
  requireText(planText, "If research\nwas marked unnecessary", planPath);
  requireText(planText, "Ready for planning: no", planPath);
  requireText(planText, "Preserve the slice outcome, acceptance criteria", planPath);
  requireText(planText, "Do tactical research as needed", planPath);
  requireText(planText, "implementation, verification, or risk", planPath);
  requireText(planText, "focused test work", planPath);
  requireText(planText, "core noun before qualifiers lens", planPath);
  requireText(planText, "adjective-noun siblings", planPath);
  requireText(planText, "simplest safe approach", planPath);
  requireText(planText, "not a step-by-step coding script", planPath);
  requireText(planText, "## Research Used", planPath);
  requireText(planText, "## Implementation Research Additions", planPath);
  requireText(planText, "using the same\ncompact style", planPath);
  requireText(planText, "Do not paste raw notes, long\nexcerpts", planPath);
  requireText(planText, "## Slice Boundary", planPath);
  requireText(planText, "Acceptance criteria covered:", planPath);
  requireText(planText, "Out of scope:", planPath);
  requireText(planText, "## Test Plan", planPath);
  requireText(planText, "Tests to add/update:", planPath);
  requireText(planText, "Focused commands:", planPath);
  requireText(planText, "No-test reason:", planPath);
  requireText(planText, "Do not default to a full test suite", planPath);
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
  requireText(verifyText, "plan's `Slice Boundary`", verifyPath);
  requireText(verifyText, "out-of-scope boundaries", verifyPath);
  requireText(verifyText, "verification intent", verifyPath);
  requireText(verifyText, "core\n  noun before qualifiers lens", verifyPath);
  requireText(verifyText, "adjective-noun siblings", verifyPath);
  requireText(verifyText, "concrete `Test Plan`", verifyPath);
  requireText(verifyText, "default full-suite command", verifyPath);
  requireText(verifyText, "research `Slice Size Check`", verifyPath);
  requireText(verifyText, "If it says `Too broad: yes`", verifyPath);
  requireText(verifyText, "plan-verification.md", verifyPath);
  requireText(verifyText, "read-only review subagents", verifyPath);
  requireText(verifyText, "host does not support subagents", verifyPath);
  requireText(verifyText, "inline lenses", verifyPath);
  requireText(verifyText, "implementation-plan", verifyPath);
  requireText(verifyText, "focused test plan, verification plan", verifyPath);
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
  requireText(verifyText, "small enough for one focused build loop", verifyPath);
  requireText(verifyText, "slice should be split before build", verifyPath);
  requireText(verifyText, "Give every `Must Fix` item a stable short issue ID", verifyPath);
  requireText(verifyText, "set `Fix Needed: no`, and route back to\n  `researchComplete`", verifyPath);
  requireText(verifyText, "rerun research and planning", verifyPath);

  requireText(buildText, "verified slice plan from the current slice's `plan.md`", buildPath);
  requireText(buildText, "current slice's `plan-verification.md`", buildPath);
  requireText(buildText, "optional slice, research, or phase-spec context only", buildPath);
  requireText(buildText, "Treat `plan.md` as the primary build handoff", buildPath);
  requireText(buildText, "If `plan-verification.md` does not say `Ready: yes`, write `Built: no`", buildPath);
  requireText(buildText, "route back to `verify-slice-plan` and do not edit implementation files", buildPath);
  requireText(buildText, "plan's `Slice Boundary`, `Surfaces`, `Approach`, `Test Plan`, and\n  `Verification`", buildPath);
  requireText(buildText, "smallest complete path", buildPath);
  requireText(buildText, "Add or update the focused tests named in the plan", buildPath);
  requireText(buildText, "Do not default to a\n  full suite", buildPath);
  requireText(buildText, "important implementation notes", buildPath);
  requireText(buildText, "Use engineering judgment for ordinary implementation details", buildPath);
  requireText(buildText, "Do not route back for ordinary implementation choices", buildPath);
  requireText(buildText, "current slice's `build.md`", buildPath);
  requireText(buildText, "Built: yes / no", buildPath);
  requireText(buildText, "## Tests", buildPath);
  requireText(buildText, "Added or updated:", buildPath);
  requireText(buildText, "Focused commands:", buildPath);
  requireText(buildText, "Not run / skipped:", buildPath);
  requireText(buildText, "Command: None / reopen-check", buildPath);
  requireText(buildText, "Phase: None / <phase-id>", buildPath);
  requireText(buildText, "Slice: None / <slice-id>", buildPath);
  requireText(buildText, "Check: None / planCreated / planVerified", buildPath);
  requireText(buildText, "complete-check implemented", buildPath);
  requireText(buildText, "verified plan cannot be followed without expanding or redesigning", buildPath);
  requireText(buildText, "write `Built: no` and route back to the\n  owning workflow step so Auto Strike can continue", buildPath);
  requireText(buildText, "Do not re-evaluate whether the slice is well-shaped", buildPath);
  requireText(buildText, "Read upstream artifacts only when they are needed", buildPath);

  requireText(verifyBuildText, "current slice's `slice.md`", verifyBuildPath);
  requireText(verifyBuildText, "current slice's `research.md`", verifyBuildPath);
  requireText(verifyBuildText, "current slice's `plan.md`", verifyBuildPath);
  requireText(verifyBuildText, "current slice's `plan-verification.md`", verifyBuildPath);
  requireText(verifyBuildText, "current slice's `build.md`", verifyBuildPath);
  requireText(verifyBuildText, "current phase's `phase-spec.md`", verifyBuildPath);
  requireText(verifyBuildText, "build-verification.md", verifyBuildPath);
  requireText(verifyBuildText, "Built: yes", verifyBuildPath);
  requireText(verifyBuildText, "Confirm planned tests were added", verifyBuildPath);
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
  requireText(verifyBuildText, "run an actual browser or user-flow check after the\nslice build", verifyBuildPath);
  requireText(verifyBuildText, "host browser tools or Playwright CLI", verifyBuildPath);
  requireText(verifyBuildText, "they are not browser verification", verifyBuildPath);
  requireText(verifyBuildText, "Report code-verified rather than browser-verified", verifyBuildPath);
  requireText(verifyBuildText, "replacement evidence is\nstrong enough", verifyBuildPath);
  requireText(verifyBuildText, "residual user-facing risk is explicitly listed under\n`Accepted Risk`", verifyBuildPath);
  requireText(verifyBuildText, "## Issues", verifyBuildPath);
  requireText(verifyBuildText, "## Tests", verifyBuildPath);
  requireText(verifyBuildText, "Focused commands:", verifyBuildPath);
  requireText(verifyBuildText, "Not run / skipped:", verifyBuildPath);
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
  requireText(verifyBuildText, "Give every `Must Fix` item a stable short issue ID", verifyBuildPath);
  requireText(verifyBuildText, "complete-check buildVerified", verifyBuildPath);
  requireText(autoStrikeText, "build-verification.md", autoStrikePath);
  requireText(autoStrikeText, "Verified: yes", autoStrikePath);
  requireText(autoStrikeText, "finish-initiative", autoStrikePath);
  requireText(autoStrikeText, "oversized slice discovered before build", autoStrikePath);
  requireText(autoStrikeText, "preserve the original slice ID as the first\nsmaller slice", autoStrikePath);

  requireText(fixText, "failed Auto Strike verification pass", fixPath);
  requireText(fixText, "## Source Verification", fixPath);
  requireText(fixText, "## Issues Addressed", fixPath);
  requireText(fixText, "Ready for re-verification: yes / no", fixPath);
  requireText(fixText, "## Route Back", fixPath);
  requireText(fixText, "Command: None / reopen-check / reopen-phase-check / reopen-slice-check", fixPath);
  requireText(fixText, "Phase: None / <phase-id>", fixPath);
  requireText(fixText, "Slice: None / <slice-id>", fixPath);
  requireText(fixText, "Check: None / <state-check>", fixPath);
  requireText(fixText, "Use one of three outcomes", fixPath);
  requireText(fixText, "use the exact helper command Auto Strike should run", fixPath);
  requireText(fixText, "same verifier must run again", fixPath);
  requireText(fixText, "Must Fix", fixPath);

  requireText(verifyPhaseText, "current phase's `phase-spec.md`", verifyPhasePath);
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
  requireText(verifyPhaseText, "host browser tools or Playwright CLI", verifyPhasePath);
  requireText(verifyPhaseText, "they are not browser verification", verifyPhasePath);
  requireText(verifyPhaseText, "Report code-verified rather than browser-verified", verifyPhasePath);
  requireText(verifyPhaseText, "replacement evidence is\nstrong enough", verifyPhasePath);
  requireText(verifyPhaseText, "residual user-facing risk is explicitly listed under\n`Accepted Risk`", verifyPhasePath);
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
  requireText(verifyMainText, "one final browser or user-flow check\nacross the accepted scope", verifyMainPath);
  requireText(verifyMainText, "visual screenshot check after representative\ndata exists", verifyMainPath);
  requireText(verifyMainText, "page is visibly loaded and styled", verifyMainPath);
  requireText(verifyMainText, "primary workflow area is visible", verifyMainPath);
  requireText(verifyMainText, "do not overlap\n  or clip", verifyMainPath);
  requireText(verifyMainText, "visually connected to the right\n  labels", verifyMainPath);
  requireText(verifyMainText, "## Visual Screenshot Check", verifyMainPath);
  requireText(verifyMainText, "Passed: yes / no / blocked", verifyMainPath);
  requireText(verifyMainText, "Screenshot:", verifyMainPath);
  requireText(verifyMainText, "Viewport:", verifyMainPath);
  requireText(verifyMainText, "host browser tools or Playwright CLI", verifyMainPath);
  requireText(verifyMainText, "they are not browser verification", verifyMainPath);
  requireText(verifyMainText, "Report code-verified rather than browser-verified", verifyMainPath);
  requireText(verifyMainText, "replacement\nevidence is strong enough", verifyMainPath);
  requireText(verifyMainText, "residual user-facing risk is explicitly listed\nunder `Accepted Risk`", verifyMainPath);
  requireText(verifyMainText, "## Issues", verifyMainPath);
  requireText(verifyMainText, "### Must Fix", verifyMainPath);
  requireText(verifyMainText, "### Follow-Up", verifyMainPath);
  requireText(verifyMainText, "### Accepted Risk", verifyMainPath);
  requireText(verifyMainText, "Ready: yes / no", verifyMainPath);
  requireText(verifyMainText, "Fix Needed: yes / no", verifyMainPath);
  requireText(verifyMainText, "Phase: None / <phase-id>", verifyMainPath);
  requireText(verifyMainText, "Slice: None / <slice-id>", verifyMainPath);
  requireText(verifyMainText, "Command: None / reopen-check / reopen-phase-check / reopen-slice-check", verifyMainPath);
  requireText(verifyMainText, "Check: None / ideaRefined / decisionsResolved / specCreated / phasesCreated / phaseSpecCreated / slicesCreated / researchComplete / planCreated / planVerified / implemented / buildVerified / allSlicesVerified", verifyMainPath);
  requireText(verifyMainText, "Do not edit phase, slice, or implementation artifacts", verifyMainPath);
  requireText(verifyMainText, "Give every `Must Fix` item a stable short issue ID", verifyMainPath);
  requireText(verifyMainText, "complete-check allPhasesVerified", verifyMainPath);
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
validateAutoStrikeWorkflow();
validateAutoStrikeContract();
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
