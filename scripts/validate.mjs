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
    /^plugins\/strike\/references\/slice-boundaries\.md$/,
    /^plugins\/strike\/references\/verification-evidence\.md$/,
    /^plugins\/strike\/references\/research-library\.md$/,
    /^plugins\/strike\/references\/review-agents\/[a-z0-9-]+\.md$/,
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

function requireAbsentText(text, needle, context) {
  if (text.includes(needle)) {
    fail(`${context}: should not include ${needle}`);
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
  const researchPhasePath = "plugins/strike/skills/research-phase/SKILL.md";
  const createSlicesPath = "plugins/strike/skills/create-phase-slices/SKILL.md";
  const planPath = "plugins/strike/skills/plan-slice/SKILL.md";
  const verifyPath = "plugins/strike/skills/verify-slice-plan/SKILL.md";
  const buildPath = "plugins/strike/skills/build-slice/SKILL.md";
  const verifyBuildPath = "plugins/strike/skills/verify-slice-build/SKILL.md";
  const fixPath = "plugins/strike/skills/fix/SKILL.md";
  const verifyPhasePath = "plugins/strike/skills/verify-phase/SKILL.md";
  const verifyMainPath = "plugins/strike/skills/verify-main-spec/SKILL.md";
  const sliceBoundariesPath = "plugins/strike/references/slice-boundaries.md";
  const verificationEvidencePath = "plugins/strike/references/verification-evidence.md";
  const researchLibraryPath = "plugins/strike/references/research-library.md";
  const reviewOutputDisciplinePath = "plugins/strike/references/review-agents/output-discipline.md";
  const planReadinessAuditPath = "plugins/strike/references/review-agents/plan-implementation-readiness-audit.md";
  const canonicalReadinessAuditPath = "plugins/strike/references/review-agents/canonical-readiness-audit.md";
  const builtAcceptanceAuditPath = "plugins/strike/references/review-agents/built-slice-acceptance-audit.md";
  const builtCodeAuditPath = "plugins/strike/references/review-agents/built-slice-code-audit.md";
  const builtCommonIssuesAuditPath = "plugins/strike/references/review-agents/built-slice-common-issues-audit.md";
  const phaseSpecCoverageAuditPath = "plugins/strike/references/review-agents/phase-spec-coverage.md";
  const crossSliceIntegrationAuditPath = "plugins/strike/references/review-agents/cross-slice-integration.md";
  const mainSpecCoverageAuditPath = "plugins/strike/references/review-agents/main-spec-coverage.md";
  const crossPhaseIntegrationAuditPath = "plugins/strike/references/review-agents/cross-phase-integration.md";
  const readinessRiskAuditPath = "plugins/strike/references/review-agents/readiness-risk.md";
  const canonicalImplementationAuditPath = "plugins/strike/references/review-agents/canonical-implementation.md";
  const stateDataIntegrityAuditPath = "plugins/strike/references/review-agents/state-data-integrity.md";
  const securityPrivacyAuditPath = "plugins/strike/references/review-agents/security-privacy.md";
  const integrationRiskAuditPath = "plugins/strike/references/review-agents/integration-risk.md";
  const uiRegressionAuditPath = "plugins/strike/references/review-agents/ui-regression.md";
  const userFlowsAuditPath = "plugins/strike/references/review-agents/user-flows.md";
  const accessibilityAuditPath = "plugins/strike/references/review-agents/accessibility.md";
  const pluginReadmePath = "plugins/strike/README.md";
  const dogfoodPath = "docs/dogfood.md";
  const releasePath = "docs/release.md";
  const hostSmokePath = "scripts/host-smoke.mjs";

  const contractPaths = [
    strikePath,
    helperPath,
    refinePath,
    researchInitiativePath,
    grillPath,
    createMainPath,
    createDevPath,
    createPhasePath,
    researchPhasePath,
    createSlicesPath,
    planPath,
    verifyPath,
    buildPath,
    verifyBuildPath,
    fixPath,
    verifyPhasePath,
    verifyMainPath,
    sliceBoundariesPath,
    verificationEvidencePath,
    researchLibraryPath,
    reviewOutputDisciplinePath,
    planReadinessAuditPath,
    canonicalReadinessAuditPath,
    builtAcceptanceAuditPath,
    builtCodeAuditPath,
    builtCommonIssuesAuditPath,
    phaseSpecCoverageAuditPath,
    crossSliceIntegrationAuditPath,
    mainSpecCoverageAuditPath,
    crossPhaseIntegrationAuditPath,
    readinessRiskAuditPath,
    canonicalImplementationAuditPath,
    stateDataIntegrityAuditPath,
    securityPrivacyAuditPath,
    integrationRiskAuditPath,
    uiRegressionAuditPath,
    userFlowsAuditPath,
    accessibilityAuditPath,
    pluginReadmePath,
    dogfoodPath,
    releasePath,
    hostSmokePath,
  ];
  const missingContractPaths = contractPaths.filter((contractPath) => !exists(contractPath));
  if (missingContractPaths.length > 0) {
    fail(`validateStrikeContract missing required paths: ${missingContractPaths.join(", ")}`);
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
  const researchPhaseText = fs.readFileSync(path.join(root, researchPhasePath), "utf8");
  const createSlicesText = fs.readFileSync(path.join(root, createSlicesPath), "utf8");
  const planText = fs.readFileSync(path.join(root, planPath), "utf8");
  const verifyText = fs.readFileSync(path.join(root, verifyPath), "utf8");
  const buildText = fs.readFileSync(path.join(root, buildPath), "utf8");
  const verifyBuildText = fs.readFileSync(path.join(root, verifyBuildPath), "utf8");
  const fixText = fs.readFileSync(path.join(root, fixPath), "utf8");
  const verifyPhaseText = fs.readFileSync(path.join(root, verifyPhasePath), "utf8");
  const verifyMainText = fs.readFileSync(path.join(root, verifyMainPath), "utf8");
  const sliceBoundariesText = fs.readFileSync(path.join(root, sliceBoundariesPath), "utf8");
  const verificationEvidenceText = fs.readFileSync(path.join(root, verificationEvidencePath), "utf8");
  const researchLibraryText = fs.readFileSync(path.join(root, researchLibraryPath), "utf8");
  const reviewOutputDisciplineText = fs.readFileSync(path.join(root, reviewOutputDisciplinePath), "utf8");
  const planReadinessAuditText = fs.readFileSync(path.join(root, planReadinessAuditPath), "utf8");
  const canonicalReadinessAuditText = fs.readFileSync(path.join(root, canonicalReadinessAuditPath), "utf8");
  const builtAcceptanceAuditText = fs.readFileSync(path.join(root, builtAcceptanceAuditPath), "utf8");
  const builtCodeAuditText = fs.readFileSync(path.join(root, builtCodeAuditPath), "utf8");
  const builtCommonIssuesAuditText = fs.readFileSync(path.join(root, builtCommonIssuesAuditPath), "utf8");
  const phaseSpecCoverageAuditText = fs.readFileSync(path.join(root, phaseSpecCoverageAuditPath), "utf8");
  const crossSliceIntegrationAuditText = fs.readFileSync(path.join(root, crossSliceIntegrationAuditPath), "utf8");
  const mainSpecCoverageAuditText = fs.readFileSync(path.join(root, mainSpecCoverageAuditPath), "utf8");
  const crossPhaseIntegrationAuditText = fs.readFileSync(path.join(root, crossPhaseIntegrationAuditPath), "utf8");
  const readinessRiskAuditText = fs.readFileSync(path.join(root, readinessRiskAuditPath), "utf8");
  const canonicalImplementationAuditText = fs.readFileSync(path.join(root, canonicalImplementationAuditPath), "utf8");
  const stateDataIntegrityAuditText = fs.readFileSync(path.join(root, stateDataIntegrityAuditPath), "utf8");
  const securityPrivacyAuditText = fs.readFileSync(path.join(root, securityPrivacyAuditPath), "utf8");
  const integrationRiskAuditText = fs.readFileSync(path.join(root, integrationRiskAuditPath), "utf8");
  const uiRegressionAuditText = fs.readFileSync(path.join(root, uiRegressionAuditPath), "utf8");
  const userFlowsAuditText = fs.readFileSync(path.join(root, userFlowsAuditPath), "utf8");
  const accessibilityAuditText = fs.readFileSync(path.join(root, accessibilityAuditPath), "utf8");
  const pluginReadmeText = fs.readFileSync(path.join(root, pluginReadmePath), "utf8");
  const dogfoodText = fs.readFileSync(path.join(root, dogfoodPath), "utf8");
  const releaseText = fs.readFileSync(path.join(root, releasePath), "utf8");
  const hostSmokeText = fs.readFileSync(path.join(root, hostSmokePath), "utf8");

  const strikeWorkflowSkillTexts = {
    [strikePath]: strikeText,
    [refinePath]: refineText,
    [researchInitiativePath]: researchInitiativeText,
    [grillPath]: grillText,
    [createMainPath]: createMainText,
    [createDevPath]: createDevText,
    [createPhasePath]: createPhaseText,
    [researchPhasePath]: researchPhaseText,
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

  const phaseSpecListIndex = strikeText.indexOf("`create-phase-spec/SKILL.md`");
  const phaseResearchListIndex = strikeText.indexOf("`research-phase/SKILL.md`");
  const createSlicesListIndex = strikeText.indexOf("`create-phase-slices/SKILL.md`");
  const planListIndex = strikeText.indexOf("`plan-slice/SKILL.md`");
  if (
    phaseSpecListIndex === -1 ||
    phaseResearchListIndex === -1 ||
    createSlicesListIndex === -1 ||
    phaseSpecListIndex > phaseResearchListIndex ||
    phaseResearchListIndex > createSlicesListIndex
  ) {
    fail(`${strikePath}: research-phase must appear between create-phase-spec and create-phase-slices in the workflow list`);
  }
  if (planListIndex === -1) {
    fail(`${strikePath}: plan-slice must appear in the workflow list`);
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

  const helperPhaseSpecIndex = helperText.indexOf('["create-phase-spec", ["phaseSpecCreated"]]');
  const helperPhaseResearchIndex = helperText.indexOf('["research-phase", ["phaseResearchComplete"]]');
  const helperSlicesIndex = helperText.indexOf('["create-phase-slices", ["slicesCreated"]]');
  const helperPlanIndex = helperText.indexOf('["plan-slice", ["planCreated"]]');
  if (
    helperPhaseSpecIndex === -1 ||
    helperPhaseResearchIndex === -1 ||
    helperSlicesIndex === -1 ||
    helperPhaseSpecIndex > helperPhaseResearchIndex ||
    helperPhaseResearchIndex > helperSlicesIndex
  ) {
    fail(`${helperPath}: research-phase must appear between create-phase-spec and create-phase-slices in the phase workflow`);
  }
  if (helperPlanIndex === -1) {
    fail(`${helperPath}: plan-slice must appear in the slice workflow`);
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
  requireText(helperText, "STATE_VERSION = 2", helperPath);
  requireText(helperText, "INITIATIVE_STATE_VERSION = 2", helperPath);
  requireText(helperText, "normalizeState", helperPath);
  requireText(helperText, "createStateIndex", helperPath);
  requireText(helperText, "hydrateState", helperPath);
  requireText(helperText, "hydrateInitiativeById", helperPath);
  requireText(helperText, "initiativeStateRelativePath", helperPath);
  requireText(helperText, "initiativeStatePath", helperPath);
  requireText(helperText, "validateSplitInitiativeEntry", helperPath);
  requireText(helperText, "Initiative state id mismatch", helperPath);
  requireText(helperText, "statePath: initiativeStateRelativePath", helperPath);
  requireText(helperText, 'readState(statePath, { hydrate: "none" })', helperPath);
  requireText(helperText, "if (!isDetailedInitiative(initiative))", helperPath);
  requireText(helperText, 'command === "sync-helper"', helperPath);
  requireText(helperText, "createGuidanceFiles(paths.implementationDisciplinePath", helperPath);
  requireText(helperText, "createReviewLensFiles(paths.reviewLensesPath)", helperPath);
  requireText(helperText, "isStrikeStateHelper", helperPath);
  requireText(helperText, "Ready to research: yes", helperPath);
  requireText(helperText, "Ready for grill: yes", helperPath);
  requireText(helperText, 'markdownSection(text, "Ready For Grill")', helperPath);
  requireText(helperText, "No material research needed: yes", helperPath);
  requireText(helperText, "<research-item-id>.md", helperPath);
  requireText(helperText, "audits/<research-item-id>.md", helperPath);
  requireText(helperText, "initiativeResearchComplete", helperPath);
  requireText(helperText, '["research-phase", ["phaseResearchComplete"]]', helperPath);
  requireText(helperText, "requireReadyForSlicing", helperPath);
  requireText(helperText, "requirePhaseResearchAudit", helperPath);
  requireText(helperText, "requireSlicePlanReady", helperPath);
  requireText(helperText, "requireSliceBuildReady", helperPath);
  requireText(helperText, "markStaleArtifactsAfterReopen", helperPath);
  requireText(helperText, "Stale: yes", helperPath);
  requireText(helperText, "Fix Needed: no", helperPath);
  requireText(helperText, "Route Back with Needed: no", helperPath);
  requireText(helperText, "required post-browser review status when applicable", helperPath);
  requireText(helperText, "function routeBackField(text)", helperPath);
  requireText(helperText, 'latestFieldValue(routeBack, "Needed", "yes|no")', helperPath);
  requireText(helperText, "markdownLastSectionAfter", helperPath);
  requireText(helperText, "Ready for slicing: yes", helperPath);
  requireText(helperText, 'markdownSection(text, "Ready For Slicing")', helperPath);
  requireText(helperText, "research-audit.md", helperPath);
  requireText(helperText, 'case "research-phase":', helperPath);
  requireAbsentText(helperText, '["research-slice", ["researchComplete"]]', helperPath);
  requireAbsentText(helperText, 'case "research-slice":', helperPath);
  requireText(helperText, 'command === "reopen-check"', helperPath);
  requireText(helperText, 'command === "reopen-phase-check"', helperPath);
  requireText(helperText, 'command === "reopen-slice-check"', helperPath);
  requireText(helperText, "reopenPhaseCheck", helperPath);
  requireText(helperText, "reopenSliceCheck", helperPath);
  requireText(helperText, "reopenCurrentScopeDependents", helperPath);
  requireText(helperText, "INITIATIVE_UPSTREAM_CHECKS", helperPath);
  requireText(helperText, "research.md", helperPath);
  requireText(helperText, "build.md", helperPath);
  requireText(strikeText, "## Failed Verification And Route-Back", strikePath);
  requireText(strikeText, "fix/SKILL.md", strikePath);
  requireText(strikeText, "Fix Needed: yes", strikePath);
  requireText(strikeText, "Must Fix", strikePath);
  requireText(strikeText, "Follow-Up", strikePath);
  requireText(strikeText, "Accepted Risk", strikePath);
  requireText(strikeText, "reopen-phase-check", strikePath);
  requireText(strikeText, "reopen-slice-check", strikePath);
  requireText(strikeText, "allPhasesVerified", strikePath);
  requireText(strikeText, "sync-helper", strikePath);
  requireText(strikeText, "authoritative for initiative lifecycle", strikePath);
  requireText(strikeText, "strike/initiatives/<initiative-id>/state.json", strikePath);
  requireText(strikeText, "state files store progress facts", strikePath);
  requireText(pluginReadmeText, "`strike/state.json` keeps a compact initiative index", pluginReadmePath);
  requireText(pluginReadmeText, "authoritative for\ninitiative lifecycle status", pluginReadmePath);
  requireText(pluginReadmeText, "`strike/initiatives/<initiative-id>/state.json`", pluginReadmePath);
  requireText(pluginReadmeText, "durable cross-initiative research library", pluginReadmePath);
  requireText(strikeText, "supporting-artifacts/", strikePath);
  requireText(strikeText, "It is not hidden source of truth", strikePath);
  requireText(strikeText, "For `Type: split`, edit the current slice into the first replacement slice", strikePath);
  requireText(strikeText, "fold each absorbed slice's stub into the current slice's", strikePath);
  requireText(strikeText, "from the installed Strike plugin and follow it directly", strikePath);
  requireText(strikeText, "## Slice Git Checkpoint", strikePath);
  requireText(strikeText, "After `buildVerified` is complete for a slice, commit and push that slice", strikePath);
  requireText(strikeText, "boundaries are normal workflow handoffs too", strikePath);
  requireText(strikeText, "they hand control back to this `go` orchestrator inside the same run", strikePath);
  requireText(strikeText, "Do\nnot report back to the user merely because one slice completed", strikePath);
  requireText(strikeText, "A completed slice checkpoint is a waypoint, not a pause", strikePath);
  requireText(strikeText, "Do not prescribe extra git inspection commands", strikePath);

  requireText(helperText, "requireUserCheckpoint", helperPath);
  requireText(helperText, "requireDecisionReview", helperPath);
  requireText(helperText, "markdownLastSection", helperPath);
  requireText(helperText, "reviewFields", helperPath);
  requireText(helperText, "latestFieldValue", helperPath);
  requireText(helperText, "lastRegexMatch", helperPath);
  requireText(helperText, "requireReviewedVerificationArtifact", helperPath);
  requireText(helperText, "Review results returned: yes", helperPath);
  requireText(helperText, "Ready to continue: yes", helperPath);
  requireText(helperText, "non-empty User response", helperPath);
  requireText(hostSmokeText, "Review results returned: yes\nVerdict: pass\nMust Fix count: 0", hostSmokePath);
  requireText(hostSmokeText, "references/slice-boundaries.md", hostSmokePath);

  requireText(verificationEvidenceText, "Environment:", verificationEvidencePath);
  requireText(verificationEvidenceText, "E2E tests and Browser Clickthrough must stay in their proper environments", verificationEvidencePath);
  requireText(verificationEvidenceText, "tests in the repo's test/E2E environment", verificationEvidencePath);
  requireText(verificationEvidenceText, "browser clickthrough in the dev/local\n  app environment", verificationEvidencePath);
  requireText(verificationEvidenceText, "Do not modify env files, DB targets, or runtime mode", verificationEvidencePath);
  requireText(verificationEvidenceText, "A failed first browser route, URL form, or browser tool is not enough", verificationEvidencePath);
  requireText(verificationEvidenceText, "try another available\nbrowser surface before failing verification", verificationEvidencePath);
  requireText(verificationEvidenceText, "keyboard, focus, accessibility, or alternate-input actions attempted", verificationEvidencePath);
  requireText(verificationEvidenceText, "Do not add custom app key\nhandlers solely to satisfy an automation quirk", verificationEvidencePath);
  requireText(dogfoodText, "## Browser Checks", dogfoodPath);
  requireText(dogfoodText, "## Run Modes", dogfoodPath);
  requireText(dogfoodText, "Local source workflow check", dogfoodPath);
  requireText(dogfoodText, "do not\nrefresh or upgrade the installed plugin", dogfoodPath);
  requireText(dogfoodText, "invoke skills from this checkout explicitly", dogfoodPath);
  requireText(dogfoodText, "Installed-plugin behavior proven: no", dogfoodPath);
  requireText(dogfoodText, "phase research/audit, slices, plan", dogfoodPath);
  requireText(dogfoodText, "### Nested Browser Harnesses", dogfoodPath);
  requireText(dogfoodText, "This observer check helps classify the failure; it\ndoes not replace target-agent browser evidence", dogfoodPath);
  requireText(dogfoodText, "target browser evidence: failed / missing", dogfoodPath);
  requireText(dogfoodText, "The target workflow remains unverified until the target agent completes the\nBrowser Clickthrough itself", dogfoodPath);
  requireText(dogfoodText, "keep observer browser checks separate from target evidence", dogfoodPath);
  requireText(dogfoodText, "## Browser Evidence", dogfoodPath);
  requireText(releaseText, "pnpm run release:validate", releasePath);
  requireText(releaseText, "Claude plugin/marketplace validators", releasePath);

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
  requireText(researchInitiativeText, "Use a separate research pass for each approved\n   item", researchInitiativePath);
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
  requireText(researchInitiativeText, "audit file with `Review results returned: yes`, `Verdict: pass` or\n  `Verdict: accepted-risk`, and `Must Fix count: 0`", researchInitiativePath);
  requireText(researchInitiativeText, "no unresolved audit `Must Fix` findings", researchInitiativePath);
  requireText(researchInitiativeText, "references/research-library.md", researchInitiativePath);
  requireText(researchInitiativeText, "scope the audit to the delta and the leaned-on claims", researchInitiativePath);
  requireText(researchInitiativeText, "Write durable findings back into library entries", researchInitiativePath);
  requireText(researchInitiativeText, "Do not re-research what a current library entry already covers", researchInitiativePath);
  requireText(researchInitiativeText, "write `Ready for\n  grill: no`", researchInitiativePath);
  requireAbsentText(researchInitiativeText, "when the host supports subagents", researchInitiativePath);
  requireAbsentText(researchInitiativeText, "when supported", researchInitiativePath);
  requireAbsentText(researchInitiativeText, "subagents are unavailable", researchInitiativePath);
  requireAbsentText(researchInitiativeText, "inline audit pass", researchInitiativePath);

  requireText(grillText, "## Decision Depth", grillPath);
  requireText(grillText, "## Core Loop", grillPath);
  requireText(grillText, "Interview the user relentlessly", grillPath);
  requireText(grillText, "This is a conversation first and an artifact second", grillPath);
  requireText(grillText, "it does not mean waiting until the end to write\ndown decisions", grillPath);
  requireText(grillText, "Ask one question at a time", grillPath);
  requireText(grillText, "stay in this loop until the decision tree is exhausted", grillPath);
  requireText(grillText, "With every user question, explain why it matters", grillPath);
  requireText(grillText, "give your recommended", grillPath);
  requireText(grillText, "questions are needed, ask dozens across turns", grillPath);
  requireText(grillText, "Do not treat one answer", grillPath);
  requireText(grillText, "proof that the tree is done", grillPath);
  requireText(grillText, "Facts: agent resolves. Tradeoffs: agent recommends. Choices: user decides", grillPath);
  requireText(grillText, "Do not ask the user factual questions you can answer yourself", grillPath);
  requireText(grillText, "Do not silently decide product, scope, risk", grillPath);
  requireText(grillText, "## What To Grill", grillPath);
  requireText(grillText, "## Decision Tree", grillPath);
  requireText(grillText, "## Decision Review", grillPath);
  requireText(grillText, "Review results returned: yes / no", grillPath);
  requireText(grillText, "Review results returned: yes", grillPath);
  requireText(grillText, "Decision review prompt", grillPath);
  requireText(grillText, "`lean`", grillPath);
  requireText(grillText, "`standard`", grillPath);
  requireText(grillText, "`deep`", grillPath);
  requireText(grillText, "auth, security, privacy", grillPath);
  requireText(grillText, "core noun", grillPath);
  requireText(grillText, "before qualifiers", grillPath);
  requireText(grillText, "concrete scenarios for abstract decisions", grillPath);
  requireText(grillText, "current truth", grillPath);
  requireText(grillText, "update that file before asking the next question", grillPath);
  requireText(grillText, "Do not rely on chat\nmemory for decisions that belong in the output file", grillPath);
  requireText(grillText, "Spec-Owned Details", grillPath);
  requireText(grillText, "Do not infer user answers from silence", grillPath);
  requireText(grillText, "do not defer decision recording until the\n  final review or checkpoint", grillPath);
  requireText(grillText, "Do not silently draft around a consequential fork", grillPath);
  requireText(grillText, "Do not move to the final checkpoint while consequential decision nodes remain", grillPath);
  requireText(grillText, "run a read-only decision review", grillPath);
  requireText(grillText, "Do not complete Grill without `## Decision Review`", grillPath);
  requireText(grillText, "Do not let decision review replace user questioning", grillPath);
  requireText(grillText, "Then ask whether", grillPath);
  requireText(grillText, "ready to continue or wants to discuss more", grillPath);
  requireText(grillText, "Existing artifacts can inform the decision record", grillPath);
  requireText(grillText, "## User Checkpoint", grillPath);
  requireText(grillText, "Ready to continue: yes / no", grillPath);
  requireText(grillText, "validation, browser checks, live checks", grillPath);
  requireText(grillText, "research/index.md", grillPath);
  requireText(grillText, "research belongs back in `research-initiative`", grillPath);
  requireText(grillText, "## Supporting Artifacts", grillPath);
  requireText(grillText, "supporting-artifacts/", grillPath);
  requireText(grillText, "hidden source of truth", grillPath);

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
  requireText(createPhaseText, "## Phase Research Needs", createPhasePath);
  requireText(createPhaseText, "Use light official/source/repo checks only when needed", createPhasePath);
  requireText(createPhaseText, "Leave proper\n  implementation research to `research-phase`", createPhasePath);
  requireText(createPhaseText, "Phase Boundary Check", createPhasePath);
  requireText(createPhaseText, "Too broad / small / stale / horizontal", createPhasePath);
  requireText(createPhaseText, "Slice Handoff", createPhasePath);
  requireText(createPhaseText, "Do not create slices, slice acceptance criteria", createPhasePath);
  requireText(createPhaseText, "if the chat transcript is gone", createPhasePath);

  for (const heading of [
    "## Research Basis",
    "## Additional Phase Research",
    "## Findings",
    "## Repo Patterns",
    "## Slice Boundary Implications",
    "## Questions Or Blockers",
    "## Research Audit",
    "## Ready For Slicing",
  ]) {
    requireText(researchPhaseText, heading, researchPhasePath);
  }
  requireText(researchPhaseText, "Ready for slicing: yes / no", researchPhasePath);
  requireText(researchPhaseText, "Start from the research library and initiative research", researchPhasePath);
  requireText(researchPhaseText, "references/research-library.md", researchPhasePath);
  requireText(researchPhaseText, "back into library entries", researchPhasePath);
  requireText(researchPhaseText, "Do not duplicate research already covered", researchPhasePath);
  requireText(researchPhaseText, "phase-specific implementation gaps", researchPhasePath);
  requireText(researchPhaseText, "official canonical, idiomatic, recommended way", researchPhasePath);
  requireText(researchPhaseText, "specific third-party APIs, packages, plugins, SDKs, models", researchPhasePath);
  requireText(researchPhaseText, "how should we use this\n  exact API/plugin/feature correctly here?", researchPhasePath);
  requireText(researchPhaseText, "recommended usage patterns, integration flows, lifecycle expectations", researchPhasePath);
  requireText(researchPhaseText, "payments, refunds, coupons, invoices, accounting", researchPhasePath);
  requireText(researchPhaseText, "specific domain rule or official provider guidance", researchPhasePath);
  requireText(researchPhaseText, "## Phase Research Audit", researchPhasePath);
  requireText(researchPhaseText, "Read-only audit this phase research", researchPhasePath);
  requireText(researchPhaseText, "research-audit.md", researchPhasePath);
  requireText(researchPhaseText, "Verdict: pass / needs-fix / accepted-risk", researchPhasePath);
  requireText(researchPhaseText, "Review results returned: yes / no", researchPhasePath);
  requireText(researchPhaseText, "Must Fix count:", researchPhasePath);
  requireText(researchPhaseText, "Do not write `Ready for slicing: yes` unless `research-audit.md` exists", researchPhasePath);
  requireText(researchPhaseText, "`Review results returned: yes`", researchPhasePath);
  requireText(researchPhaseText, "legacy slice research files", researchPhasePath);
  requireText(researchPhaseText, "official or primary\n  sources", researchPhasePath);
  requireText(researchPhaseText, "inspect actual files", researchPhasePath);
  requireText(researchPhaseText, "no additional phase-specific research is needed", researchPhasePath);
  requireText(researchPhaseText, "Do not create slices, slice plans", researchPhasePath);
  requireText(researchPhaseText, "Do not silently redo initiative-level research", researchPhasePath);
  requireText(researchPhaseText, "Record implications for slicing", researchPhasePath);
  requireAbsentText(researchPhaseText, "when the host supports subagents", researchPhasePath);
  requireAbsentText(researchPhaseText, "when supported", researchPhasePath);
  requireAbsentText(researchPhaseText, "subagents are unavailable", researchPhasePath);
  requireAbsentText(researchPhaseText, "inline audit pass", researchPhasePath);

  requireText(createSlicesText, "phase research audit from the current phase's `research-audit.md`", createSlicesPath);
  requireText(createSlicesText, "Read the current phase's `research-audit.md`", createSlicesPath);
  requireText(createSlicesText, "does not show all required audit fields", createSlicesPath);
  requireText(createSlicesText, "Required fields are:\n  `Review results returned: yes`, `Verdict: pass` or\n  `Verdict: accepted-risk`, and `Must Fix count: 0`", createSlicesPath);
  requireText(createSlicesText, "# Slice Boundary Blocker", createSlicesPath);
  requireText(createSlicesText, "Check: phaseResearchComplete", createSlicesPath);
  requireText(createSlicesText, "Use phase research and its audit as the inherited implementation research", createSlicesPath);
  requireText(createSlicesText, "Read relevant initiative research constraints", createSlicesPath);
  requireText(createSlicesText, "supporting-artifacts/", createSlicesPath);
  requireText(createSlicesText, "references/slice-boundaries.md", createSlicesPath);
  requireText(createSlicesText, "canonical Strike standard", createSlicesPath);
  requireText(sliceBoundariesText, "A vertical slice proves one user or system capability", sliceBoundariesPath);
  requireText(createSlicesText, "Work on one phase at a time", createSlicesPath);
  requireText(createSlicesText, "route back to the\nowning phase step", createSlicesPath);
  requireText(createSlicesText, "fewest verification\n  loops", createSlicesPath);
  requireText(createSlicesText, "check adjacent slices for merge signals", createSlicesPath);
  requireText(createSlicesText, "Prefer fewer cohesive slices over many thin ones", createSlicesPath);
  requireText(sliceBoundariesText, "Good vertical slice examples", sliceBoundariesPath);
  requireText(sliceBoundariesText, "Usually bad slice shapes", sliceBoundariesPath);
  requireText(sliceBoundariesText, "## Complex Interaction Fields", sliceBoundariesPath);
  requireText(sliceBoundariesText, "small feature with its own meaningful\nstate, data, or interaction contract", sliceBoundariesPath);
  requireText(sliceBoundariesText, "Do not split merely because a field has a small interaction detail", sliceBoundariesPath);
  requireText(sliceBoundariesText, "| XS | Tiny local change, such as config, copy, style, or one small function. |", sliceBoundariesPath);
  requireText(sliceBoundariesText, "| M | The default shape: one cohesive capability or behavior path across the needed surfaces; often a handful of files. |", sliceBoundariesPath);
  requireText(sliceBoundariesText, "## Slice Economics", sliceBoundariesPath);
  requireText(sliceBoundariesText, "Slice\ncount, not slice size, is the main cost multiplier", sliceBoundariesPath);
  requireText(sliceBoundariesText, "fewest verification loops that each remain one honest\nverification story", sliceBoundariesPath);
  requireText(sliceBoundariesText, "Default to M or L slices", sliceBoundariesPath);
  requireText(sliceBoundariesText, "## Merge Signals", sliceBoundariesPath);
  requireText(sliceBoundariesText, "| XL | Multiple capabilities, independent flows, or a change too broad to verify as one coherent unit. Split or route back", sliceBoundariesPath);
  requireText(sliceBoundariesText, "## Why Not Split", sliceBoundariesPath);
  requireText(sliceBoundariesText, "split options considered", sliceBoundariesPath);
  requireText(sliceBoundariesText, "scope guardrails", sliceBoundariesPath);
  requireText(sliceBoundariesText, "more outcomes than one coherent verification story can honestly cover", sliceBoundariesPath);
  requireText(sliceBoundariesText, "separate verification stories", sliceBoundariesPath);
  requireText(sliceBoundariesText, "Crossing layers is not a challenge signal", sliceBoundariesPath);
  requireText(sliceBoundariesText, "When a slice looks overly broad", sliceBoundariesPath);
  requireText(sliceBoundariesText, "Keep them tightly scoped to the risk or enabling capability", sliceBoundariesPath);
  requireText(sliceBoundariesText, "## Ready Slice Stubs", sliceBoundariesPath);
  requireText(createSlicesText, "without re-slicing the phase", createSlicesPath);
  requireText(sliceBoundariesText, "A fresh context should be able to open any `slice.md`", sliceBoundariesPath);
  requireText(sliceBoundariesText, "One slice is correct when splitting would create fake work", sliceBoundariesPath);
  requireText(createSlicesText, "edge/flow notes", createSlicesPath);
  requireText(createSlicesText, "state, permissions, data\n  integrity, integrations, UI/device, operations, and recovery", createSlicesPath);
  requireText(createSlicesText, "create one directory per slice and write\n`slice.md` inside it", createSlicesPath);
  requireText(createSlicesText, "Do not create a shared `slices.md`, `index.md`, or\ndependency-map file", createSlicesPath);
  requireText(createSlicesText, "Vertical / Non-vertical", createSlicesPath);
  requireText(createSlicesText, "## Verification Intent", createSlicesPath);
  requireText(createSlicesText, "## Edge / Flow Notes", createSlicesPath);
  requireText(createSlicesText, "## Risks / Watchouts", createSlicesPath);
  requireText(createSlicesText, "Keep implementation planning, execution tasks", createSlicesPath);
  requireText(sliceBoundariesText, "## Why Not Split", sliceBoundariesPath);
  requireText(sliceBoundariesText, "## Non-Vertical Justification", sliceBoundariesPath);
  requireText(createSlicesText, "Do not create shared slice indexes", createSlicesPath);

  requireText(planText, "## Planning Dialogue", planPath);
  requireText(planText, "Look for existing patterns related to what we are building", planPath);
  requireText(planText, "at least 2 distinct steps\nback", planPath);
  requireText(planText, "Ensure what you are planning for is complete", planPath);
  requireText(planText, "table-stakes requirements", planPath);
  requireText(planText, "Use initiative research as inherited constraints", planPath);
  requireText(planText, "Read the slice stub, phase spec, phase research, phase research audit", planPath);
  requireText(planText, "Required user-provided customization from the consuming repo's Strike", planPath);
  requireText(planText, "user implementation-discipline guidance", planPath);
  requireText(planText, "strike/user-guidance/implementation-discipline/global.md", planPath);
  requireText(planText, "strike/user-guidance/implementation-discipline/plan-slice.md", planPath);
  requireText(planText, "Read required user-provided customization", planPath);
  requireText(planText, "Treat passing or accepted-risk initiative research as baseline evidence", planPath);
  requireText(planText, "relevant per-item report and audit before adding new tactical", planPath);
  requireText(planText, "Prefer official or\n  primary sources when the fact is external, current, or high-stakes", planPath);
  requireText(planText, "supporting-artifacts/", planPath);
  requireText(planText, "phase research", planPath);
  requireText(planText, "current phase's `research.md`", planPath);
  requireText(planText, "current phase's `research-audit.md`", planPath);
  requireText(planText, "If phase `research-audit.md` does not show all required audit fields", planPath);
  requireText(planText, "Required fields are:\n  `Review results returned: yes`, `Verdict: pass` or\n  `Verdict: accepted-risk`, and `Must Fix count: 0`", planPath);
  requireText(planText, "current slice's `plan.md`", planPath);
  requireText(planText, "Ready for slicing: no", planPath);
  requireText(planText, "Do narrow tactical research as needed", planPath);
  requireText(planText, "planning reveals a slice-specific\n  detail", planPath);
  requireText(planText, "same class of problem before proposing a new pattern", planPath);
  requireText(planText, "core noun before qualifiers lens", planPath);
  requireText(planText, "adjective-noun siblings", planPath);
  requireText(planText, "Do not paste raw notes, long excerpts", planPath);
  requireText(planText, "## Development Plan", planPath);
  requireText(planText, "## Research And Artifacts Used", planPath);
  requireText(planText, "## Codebase Patterns", planPath);
  requireText(planText, "## System Touchpoints", planPath);
  requireText(planText, "## Blast Radius", planPath);
  requireText(planText, "## Verification Plan", planPath);
  requireText(planText, "## Why This Plan", planPath);
  requireText(planText, "likely files, surfaces, important sequencing", planPath);
  requireText(planText, "small code-shaped details", planPath);
  requireText(planText, "Name the existing files, flows, helpers", planPath);
  requireText(planText, "Do not list irrelevant surfaces just to fill", planPath);
  requireText(planText, "what could be affected outside the immediate slice", planPath);
  requireText(planText, "references/verification-evidence.md", planPath);
  requireText(planText, "references/slice-boundaries.md", planPath);
  requireText(planText, "static/build checks, focused unit/component/integration tests", planPath);
  requireText(planText, "Browser Clickthrough, Visual Evidence", planPath);
  requireText(planText, "repo's test/E2E environment", planPath);
  requireText(planText, "dev/local app environment", planPath);
  requireText(planText, "plan proportionate Browser Clickthrough or Visual", planPath);
  requireText(planText, "name the later integrated\n  clickthrough that must cover it", planPath);
  requireText(planText, "complete, clean, simple, maintainable, robust", planPath);
  requireText(planText, "Do not edit implementation files during this step", planPath);
  requireText(planText, "small code snippets, schema shapes, type sketches", planPath);
  requireText(planText, "Do not default to a full test suite", planPath);
  requireText(planText, "write durable findings back to the library", planPath);
  requireText(planText, "test environment clickthrough as\n  equivalent proof", planPath);
  requireText(planText, "## Route Back", planPath);
  requireText(planText, "Command: None / reopen-phase-check / reopen-check", planPath);
  requireText(planText, "## Boundary Recommendation", planPath);
  requireText(planText, "Needed: yes / no", planPath);
  requireText(planText, "Type: None / split / merge", planPath);
  requireText(planText, "Absorbed slices:", planPath);
  requireText(planText, "Work from the accepted slice boundary", planPath);
  requireText(planText, "planning reveals that a clean, complete", planPath);
  requireText(planText, "Merge only\n  absorbs later slices with no completed checks", planPath);
  requireText(planText, "Strike can edit the current slice into\n  the first replacement slice", planPath);
  requireText(planText, "unregister them with `remove-slice`", planPath);
  requireText(planText, "stable repo paths, commands, constraints", planPath);
  requireText(planText, "tighten it before calling it build-ready", planPath);
  requireText(planText, "Declare the plan verification tier from what this plan actually touches", planPath);
  requireText(planText, "When unsure about any trigger, answer `yes`", planPath);
  requireText(planText, "## Plan Verification Tier", planPath);
  requireText(planText, "Tier: standard / deep", planPath);
  requireText(planText, "Third-party surface: yes / no", planPath);
  requireText(planText, "Solved domain: yes / no", planPath);
  requireText(planText, "Schema or data risk: yes / no", planPath);
  requireText(planText, "Novel pattern: yes / no", planPath);
  requireText(planText, "Planner uncertainty: yes / no", planPath);
  requireText(planText, "Declare the verification tier honestly", planPath);

  requireText(verifyText, "## Research Basis", verifyPath);
  requireText(verifyText, "## Issues", verifyPath);
  requireText(verifyText, "### Must Fix", verifyPath);
  requireText(verifyText, "### Follow-Up", verifyPath);
  requireText(verifyText, "### Accepted Risk", verifyPath);
  requireText(verifyText, "Fix Needed: yes / no", verifyPath);
  requireText(verifyText, "## Route Back", verifyPath);
  requireText(verifyText, "Ready for slicing: yes", verifyPath);
  requireText(verifyText, "Required verification packet:", verifyPath);
  requireText(verifyText, "strike/initiatives/<initiative-id>/phases/<phase-id>/slices/<slice-id>/slice.md", verifyPath);
  requireText(verifyText, "strike/initiatives/<initiative-id>/phases/<phase-id>/slices/<slice-id>/plan.md", verifyPath);
  requireText(verifyText, "strike/initiatives/<initiative-id>/phases/<phase-id>/phase-spec.md", verifyPath);
  requireText(verifyText, "strike/initiatives/<initiative-id>/phases/<phase-id>/research.md", verifyPath);
  requireText(verifyText, "strike/initiatives/<initiative-id>/phases/<phase-id>/research-audit.md", verifyPath);
  requireText(verifyText, "optional context when needed:", verifyPath);
  requireText(verifyText, "focused repo paths", verifyPath);
  requireText(verifyText, "strike/initiatives/<initiative-id>/supporting-artifacts/", verifyPath);
  requireText(verifyText, "Required user-provided customization from the consuming repo's Strike", verifyPath);
  requireText(verifyText, "strike/user-guidance/review-lenses/global.md", verifyPath);
  requireText(verifyText, "strike/user-guidance/review-lenses/verify-slice-plan.md", verifyPath);
  requireText(verifyText, "strike/user-guidance/implementation-discipline/global.md", verifyPath);
  requireText(verifyText, "strike/user-guidance/implementation-discipline/verify-slice-plan.md", verifyPath);
  requireText(verifyText, "Read the required verification packet:", verifyPath);
  requireText(verifyText, "Read required user-provided customization", verifyPath);
  requireText(verifyText, "Load optional context only when needed", verifyPath);
  requireText(verifyText, "read `strike/initiatives/<initiative-id>/supporting-artifacts/` when the", verifyPath);
  requireText(verifyText, "inspect focused repo paths when local pattern claims", verifyPath);
  requireText(verifyText, "Confirm the research basis", verifyPath);
  requireText(verifyText, "Standard-tier plans normally skip this verifier", verifyPath);
  requireText(verifyText, "Run the required plan review batch described below in parallel", verifyPath);
  requireText(verifyText, "Synthesize packet evidence, optional context, and review-agent findings", verifyPath);
  requireText(verifyText, "Review results returned: yes / no", verifyPath);
  requireText(verifyText, "Review results returned: yes", verifyPath);
  requireText(verifyText, "Decide build readiness", verifyPath);
  requireText(planReadinessAuditText, "plan's `Development Plan`", planReadinessAuditPath);
  requireText(verifyText, "## Supporting Artifacts", verifyPath);
  requireText(planReadinessAuditText, "optional supporting artifacts", planReadinessAuditPath);
  requireText(verifyText, "Relevant `supporting-artifacts/` notes are represented by the plan", verifyPath);
  requireText(planReadinessAuditText, "out-of-scope boundaries", planReadinessAuditPath);
  requireText(planReadinessAuditText, "verification intent", planReadinessAuditPath);
  requireText(planReadinessAuditText, "core noun before qualifiers lens", planReadinessAuditPath);
  requireText(planReadinessAuditText, "adjective-noun siblings", planReadinessAuditPath);
  requireText(planReadinessAuditText, "concrete `Verification Plan`", planReadinessAuditPath);
  requireText(planReadinessAuditText, "using these categories: Static / Build Checks, Unit / Component / Integration", planReadinessAuditPath);
  requireText(planReadinessAuditText, "Tests, E2E Tests, Browser Clickthrough, Visual Evidence, and Skipped / Not", planReadinessAuditPath);
  requireText(planReadinessAuditText, "Applicable. Check that it separates automated tests from Browser Clickthrough", planReadinessAuditPath);
  requireText(planReadinessAuditText, "`Codebase Patterns` names", planReadinessAuditPath);
  requireText(planReadinessAuditText, "`System Touchpoints` covers", planReadinessAuditPath);
  requireText(planReadinessAuditText, "`Blast Radius` explains", planReadinessAuditPath);
  requireText(verifyText, "automated tests belong in the repo's test/E2E environment", verifyPath);
  requireText(verifyText, "Verification environments are correct", verifyPath);
  requireText(planReadinessAuditText, "vague default full-suite commands", planReadinessAuditPath);
  requireText(verifyText, "plan-verification.md", verifyPath);
  requireText(verifyText, "references/slice-boundaries.md", verifyPath);
  requireText(verifyText, "Review agents are read-only", verifyPath);
  requireText(verifyText, "references/review-agents/output-discipline.md", verifyPath);
  requireText(verifyText, "includes that output\ncontract in each review-agent prompt", verifyPath);
  requireText(verifyText, "### 1. Run Required Plan Audits In Parallel", verifyPath);
  requireText(verifyText, "Run the required read-only base audit, plus the canonical audit when its\ntrigger applies, in one parallel batch", verifyPath);
  requireText(verifyText, "any applicable user review-lens agents in the same parallel batch", verifyPath);
  requireText(verifyText, "When\n   launching a built-in SUBAGENT, include the named bundled\n   `references/review-agents/` file in that subagent's prompt as its required\n   audit rubric", verifyPath);
  requireText(verifyText, "SUBAGENT: `plan-implementation-readiness-audit`", verifyPath);
  requireText(verifyText, "references/review-agents/plan-implementation-readiness-audit.md", verifyPath);
  requireText(verifyText, "SUBAGENT: `canonical-readiness-audit`", verifyPath);
  requireText(verifyText, "references/review-agents/canonical-readiness-audit.md", verifyPath);
  requireText(verifyText, "official, idiomatic, recommended way", verifyPath);
  requireText(verifyText, "plausible\n  invented APIs, custom systems, handmade types", verifyPath);
  requireText(verifyText, "required whenever the slice or plan\n  touches a mature solved domain", verifyPath);
  requireText(verifyText, "in a way that has no\n  existing repo precedent", verifyPath);
  requireText(verifyText, "A newly added dependency is always a no-precedent\n  surface", verifyPath);
  requireText(verifyText, "record the skip and its\n  reason in the artifact, naming the precedent file(s)", verifyPath);
  requireText(verifyText, "Canonical audit: run / skipped", verifyPath);
  requireText(verifyText, "The `canonical-readiness-audit` ran whenever the plan touches a", verifyPath);
  requireText(verifyText, "This is still a\n  plan audit, not a code audit", verifyPath);
  requireText(verifyText, "### 2. Add User Review Lenses To The Same Parallel Batch", verifyPath);
  requireText(verifyText, "USER REVIEW LENSES: relevant user review-lens audits from:", verifyPath);
  requireText(verifyText, "User review lenses are user-provided customization", verifyPath);
  requireText(verifyText, "add it to the same parallel review batch", verifyPath);
  requireText(planReadinessAuditText, "Plan Implementation Readiness Audit", planReadinessAuditPath);
  requireText(canonicalReadinessAuditText, "Canonical Readiness Audit", canonicalReadinessAuditPath);
  requireText(canonicalReadinessAuditText, "official, idiomatic, recommended way", canonicalReadinessAuditPath);
  requireText(canonicalReadinessAuditText, "do not accept a reasonable-sounding implementation as\n  canonical", canonicalReadinessAuditPath);
  requireText(canonicalReadinessAuditText, "generated/package types", canonicalReadinessAuditPath);
  requireText(canonicalReadinessAuditText, "mark it `Must Fix`", canonicalReadinessAuditPath);
  requireText(canonicalReadinessAuditText, "## Trigger", canonicalReadinessAuditPath);
  requireText(canonicalReadinessAuditText, "required, not optional", canonicalReadinessAuditPath);
  requireText(canonicalReadinessAuditText, "Treat audited\ninitiative/phase research and audited library entries as trusted baseline", canonicalReadinessAuditPath);
  requireText(canonicalReadinessAuditText, "Actually fetch and read the official docs and\npackage/generated types for the claims the plan adds beyond that baseline", canonicalReadinessAuditPath);
  requireText(planReadinessAuditText, "Static / Build Checks, Unit / Component / Integration\n  Tests, E2E Tests, Browser Clickthrough, Visual Evidence", planReadinessAuditPath);
  requireText(planReadinessAuditText, "similar-precedent evidence", planReadinessAuditPath);
  requireText(planReadinessAuditText, "repo-pattern-based home", planReadinessAuditPath);
  requireText(planReadinessAuditText, "solved-problem surfaces: enumerate every third-party API, package, SDK", planReadinessAuditPath);
  requireText(planReadinessAuditText, "security and privacy", planReadinessAuditPath);
  requireText(planReadinessAuditText, "state and data", planReadinessAuditPath);
  requireText(planReadinessAuditText, "UI and accessibility", planReadinessAuditPath);
  requireText(planReadinessAuditText, "without over-engineering", planReadinessAuditPath);
  requireText(verifyText, "`Codebase Patterns` names relevant repo examples", verifyPath);
  requireText(verifyText, "`System Touchpoints` and `Blast Radius` cover", verifyPath);
  requireText(verifyText, "includes a repo-precedent scan", verifyPath);
  requireAbsentText(verifyText, "### 2. Add Risk-Based Audits To The Same Parallel Batch", verifyPath);
  requireAbsentText(verifyText, "SUBAGENT: `canonical-implementation`", verifyPath);
  requireAbsentText(verifyText, "references/review-agents/state-data-integrity.md", verifyPath);
  requireAbsentText(verifyText, "references/review-agents/security-privacy.md", verifyPath);
  requireAbsentText(verifyText, "references/review-agents/integration-risk.md", verifyPath);
  requireAbsentText(verifyText, "references/review-agents/ui-regression.md", verifyPath);
  requireAbsentText(verifyText, "references/review-agents/user-flows.md", verifyPath);
  requireAbsentText(verifyText, "references/review-agents/accessibility.md", verifyPath);
  requireText(verifyText, "### 3. Synthesize Review Results", verifyPath);
  requireText(verifyText, "Require every\nreview agent to follow the bundled output discipline", verifyPath);
  requireText(verifyText, "return every `Must Fix`", verifyPath);
  requireText(verifyText, "avoid low-value\nnits", verifyPath);
  requireText(reviewOutputDisciplineText, "Review Agent Output Discipline", reviewOutputDisciplinePath);
  requireText(researchLibraryText, "Research Library", researchLibraryPath);
  requireText(researchLibraryText, "what do we know about this surface, period", researchLibraryPath);
  requireText(researchLibraryText, "Claims name their sources", researchLibraryPath);
  requireText(researchLibraryText, "Replace a stale claim instead", researchLibraryPath);
  requireText(researchLibraryText, "Verify only the claims the current work will lean on", researchLibraryPath);
  requireText(researchLibraryText, "Do not date-stamp", researchLibraryPath);
  requireText(reviewOutputDisciplineText, "Suggested Category: Must Fix / Follow-Up / Accepted Risk", reviewOutputDisciplinePath);
  requireText(reviewOutputDisciplineText, "Findings: None", reviewOutputDisciplinePath);
  requireText(reviewOutputDisciplineText, "Return every `Must Fix` finding", reviewOutputDisciplinePath);
  requireText(reviewOutputDisciplineText, "Return only material `Follow-Up` findings", reviewOutputDisciplinePath);
  requireText(reviewOutputDisciplineText, "Group repeated examples under one finding", reviewOutputDisciplinePath);
  requireText(reviewOutputDisciplineText, "Do not report low-value nits", reviewOutputDisciplinePath);
  requireText(reviewOutputDisciplineText, "Do not restate the rubric", reviewOutputDisciplinePath);
  requireText(reviewOutputDisciplineText, "Evidence must be concrete", reviewOutputDisciplinePath);
  requireText(verifyText, "Command: None / reopen-check", verifyPath);
  requireText(verifyText, "Phase: None / <phase-id>", verifyPath);
  requireText(verifyText, "Slice: None / <slice-id>", verifyPath);
  requireText(verifyText, "Check: None / phaseResearchComplete / slicesCreated / planCreated", verifyPath);
  requireText(verifyText, "### Verifier Conduct", verifyPath);
  requireText(verifyText, "Do not edit `plan.md`", verifyPath);
  requireText(verifyText, "Do not build the slice", verifyPath);
  requireText(verifyText, "Do not verify the slice build", verifyPath);
  requireText(verifyText, "### `Ready: yes` Requires", verifyPath);
  requireText(verifyText, "Phase research is present", verifyPath);
  requireText(verifyText, "says `Ready for slicing: yes`", verifyPath);
  requireText(verifyText, "Phase research audit is present", verifyPath);
  requireText(verifyText, "`Review results returned: yes`, `Verdict: pass` or\n  `Verdict: accepted-risk`, and `Must Fix count: 0`", verifyPath);
  requireText(verifyText, "The plan's `Research And Artifacts Used` identifies relevant initiative", verifyPath);
  requireText(verifyText, "Slice-specific research deltas are narrow", verifyPath);
  requireText(verifyText, "The plan is complete, cohesive, buildable, and contained within the accepted\n  slice", verifyPath);
  requireText(verifyText, "accepted slice boundary follows `references/slice-boundaries.md`", verifyPath);
  requireText(verifyText, "Relevant implementation discipline guidance is applied", verifyPath);
  requireText(verifyText, "`Codebase Patterns` names relevant repo examples", verifyPath);
  requireText(verifyText, "`System Touchpoints` and `Blast Radius` cover", verifyPath);
  requireText(verifyText, "Relevant `supporting-artifacts/` notes are represented by the plan", verifyPath);
  requireText(verifyText, "includes a repo-precedent scan", verifyPath);
  requireText(verifyText, "`Verification Plan` is concrete", verifyPath);
  requireText(verifyText, "Verification environments are correct", verifyPath);
  requireText(verifyText, "Browser-visible work has a proportionate Browser Clickthrough or Visual", verifyPath);
  requireText(verifyText, "names the\n  later integrated clickthrough that must cover it", verifyPath);
  requireText(verifyText, "E2E Tests name specs to add/update", verifyPath);
  requireText(verifyText, "No accepted-scope `Must Fix` issue remains", verifyPath);
  requireText(verifyText, "All required review agents and applicable user review lenses have returned", verifyPath);
  requireText(verifyText, "### Research And Boundary Blockers", verifyPath);
  requireText(verifyText, "complete-check planVerified", verifyPath);
  requireText(verifyText, "phaseResearchComplete", verifyPath);
  requireText(verifyText, "planCreated", verifyPath);
  requireText(verifyText, "independent outcomes, lacks one clear verification story", verifyPath);
  requireText(verifyText, "Give every `Must Fix` item a stable short issue ID", verifyPath);
  requireText(verifyText, "set `Fix Needed: no`", verifyPath);
  requireText(verifyText, "Route broad missing research back to `phaseResearchComplete`", verifyPath);
  requireText(verifyText, "Route back only when a real decision", verifyPath);
  requireText(verifyText, "### Fix Or Route Back", verifyPath);
  requireText(verifyText, "### Completion", verifyPath);

  requireText(buildText, "verified slice plan from the current slice's `plan.md`", buildPath);
  requireText(buildText, "supporting-artifacts/", buildPath);
  requireText(buildText, "current slice's `plan-verification.md`", buildPath);
  requireText(buildText, "optional slice, phase research/audit, or phase-spec context only", buildPath);
  requireText(buildText, "Required user-provided customization from the consuming repo's Strike", buildPath);
  requireText(buildText, "user implementation-discipline guidance", buildPath);
  requireText(buildText, "strike/user-guidance/implementation-discipline/global.md", buildPath);
  requireText(buildText, "strike/user-guidance/implementation-discipline/build-slice.md", buildPath);
  requireText(buildText, "Treat `plan.md` as the primary build handoff", buildPath);
  requireText(buildText, "Read required user-provided customization and apply the relevant guidance", buildPath);
  requireText(buildText, "Confirm the plan is verified. For a standard-tier plan, workflow state", buildPath);
  requireText(buildText, "if `plan-verification.md` does not say `Ready: yes`,\n  write `Built: no`", buildPath);
  requireText(buildText, "route back to `verify-slice-plan` and do not edit\n  implementation files", buildPath);
  requireText(buildText, "plan's `Development Plan`, `Research And Artifacts Used`,\n  `Codebase Patterns`, `System Touchpoints`, `Blast Radius`, `Verification Plan`", buildPath);
  requireText(buildText, "smallest complete path", buildPath);
  requireText(buildText, "Start from the repo structures and precedents selected in the plan's\n  `Codebase Patterns`", buildPath);
  requireText(buildText, "search for existing repo examples of the same class of problem", buildPath);
  requireText(buildText, "Add or update the focused Unit / Component / Integration Tests and E2E Tests", buildPath);
  requireText(buildText, "Run automated tests in the planned test/E2E environment", buildPath);
  requireText(buildText, "so `verify-slice-build` can run final\n  Browser Clickthrough", buildPath);
  requireText(buildText, "final Browser Clickthrough and\n  Visual Evidence are owned by `verify-slice-build`", buildPath);
  requireText(buildText, "Do not claim final browser verification from `build-slice`", buildPath);
  requireText(buildText, "Do not default to a full suite", buildPath);
  requireText(buildText, "important\n  implementation notes", buildPath);
  requireText(buildText, "the verified plan as the route", buildPath);
  requireText(buildText, "Record every deviation from the plan as a plan amendment", buildPath);
  requireText(buildText, "## Plan Amendments", buildPath);
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
  requireText(buildText, "route back only when adaptation cannot honestly stay\n  inside the contract", buildPath);
  requireText(buildText, "amendments would replace the plan rather than repair the\n  route", buildPath);
  requireText(buildText, "Read upstream artifacts only when they are needed", buildPath);
  requireText(buildText, "Keep environments separate too", buildPath);
  requireText(buildText, "Do not treat a failing command, provider response, workflow error, payload\n  limit", buildPath);
  requireText(buildText, "Declare the build verification tier in `build.md` from the actually-changed\n  code", buildPath);
  requireText(buildText, "## Build Verification Tier", buildPath);
  requireText(buildText, "Tier: standard / deep", buildPath);
  requireText(buildText, "Plan amendments: yes / no", buildPath);
  requireText(buildText, "Builder uncertainty: yes / no", buildPath);
  requireText(buildText, "When unsure about any trigger, answer `yes`", buildPath);
  requireText(buildText, "write it back to `strike/research/`", buildPath);
  requireText(fixText, "write it back to\n  `strike/research/`", fixPath);
  requireText(verifyBuildText, "When browser proof teaches a durable automation or tooling lesson", verifyBuildPath);

  requireText(verifyBuildText, "Required verification packet:", verifyBuildPath);
  requireText(verifyBuildText, "- `build.md`", verifyBuildPath);
  requireText(verifyBuildText, "- `plan.md`", verifyBuildPath);
  requireText(verifyBuildText, "- `slice.md`", verifyBuildPath);
  requireText(verifyBuildText, "optional context when needed:", verifyBuildPath);
  requireText(verifyBuildText, "- `plan-verification.md`", verifyBuildPath);
  requireText(verifyBuildText, "phase `research.md`", verifyBuildPath);
  requireText(verifyBuildText, "phase `research-audit.md`", verifyBuildPath);
  requireText(verifyBuildText, "- `phase-spec.md`", verifyBuildPath);
  requireText(verifyBuildText, "Required user-provided customization from the consuming repo's Strike", verifyBuildPath);
  requireText(verifyBuildText, "strike/user-guidance/review-lenses/global.md", verifyBuildPath);
  requireText(verifyBuildText, "strike/user-guidance/review-lenses/verify-slice-build.md", verifyBuildPath);
  requireText(verifyBuildText, "strike/user-guidance/implementation-discipline/global.md", verifyBuildPath);
  requireText(verifyBuildText, "strike/user-guidance/implementation-discipline/verify-slice-build.md", verifyBuildPath);
  requireText(verifyBuildText, "Bundled Strike review-agent instructions", verifyBuildPath);
  requireText(verifyBuildText, "references/review-agents/built-slice-acceptance-audit.md", verifyBuildPath);
  requireText(verifyBuildText, "references/review-agents/built-slice-code-audit.md", verifyBuildPath);
  requireText(verifyBuildText, "references/review-agents/built-slice-common-issues-audit.md", verifyBuildPath);
  requireText(verifyBuildText, "references/review-agents/canonical-implementation.md", verifyBuildPath);
  requireText(verifyBuildText, "references/review-agents/state-data-integrity.md", verifyBuildPath);
  requireText(verifyBuildText, "references/review-agents/security-privacy.md", verifyBuildPath);
  requireText(verifyBuildText, "references/review-agents/integration-risk.md", verifyBuildPath);
  requireText(verifyBuildText, "references/review-agents/ui-regression.md", verifyBuildPath);
  requireText(verifyBuildText, "references/review-agents/user-flows.md", verifyBuildPath);
  requireText(verifyBuildText, "references/review-agents/accessibility.md", verifyBuildPath);
  requireText(verifyBuildText, "Read the required verification packet: `build.md`, `plan.md`, and\n   `slice.md`", verifyBuildPath);
  requireText(verifyBuildText, "Confirm the slice is eligible for build verification", verifyBuildPath);
  requireText(verifyBuildText, "workflow state or `plan-verification.md` shows the plan was ready", verifyBuildPath);
  requireText(verifyBuildText, "Read required user-provided customization", verifyBuildPath);
  requireText(verifyBuildText, "Load optional context only when needed", verifyBuildPath);
  requireText(verifyBuildText, "read deeper into `plan-verification.md` when state is unclear", verifyBuildPath);
  requireText(verifyBuildText, "read phase `research.md` and `research-audit.md`", verifyBuildPath);
  requireText(verifyBuildText, "read `phase-spec.md` when phase scope, boundaries, acceptance intent", verifyBuildPath);
  requireText(verifyBuildText, "build-verification.md", verifyBuildPath);
  requireText(verifyBuildText, "Built: yes", verifyBuildPath);
  requireText(verifyBuildText, "Run the pre-browser verification batch in parallel", verifyBuildPath);
  requireText(verifyBuildText, "SUBAGENT: `built-slice-acceptance-audit`", verifyBuildPath);
  requireText(verifyBuildText, "SUBAGENT: `built-slice-code-audit`", verifyBuildPath);
  requireText(verifyBuildText, "SUBAGENT: `built-slice-common-issues-audit`", verifyBuildPath);
  requireText(verifyBuildText, "USER REVIEW LENSES: relevant user review-lens audits from required user\n     guidance", verifyBuildPath);
  requireText(verifyBuildText, "Before launching a built-in SUBAGENT, the verifier loads the named bundled\n   `references/review-agents/` rubric", verifyBuildPath);
  requireText(verifyBuildText, "automated slice checks in the repo's test runtime/server with test\n     DB/fixtures only", verifyBuildPath);
  requireText(verifyBuildText, "Synthesize the pre-browser batch into a compact gate", verifyBuildPath);
  requireText(verifyBuildText, "use the verification evidence categories shown in this skill", verifyBuildPath);
  requireText(verifyBuildText, "use focused commands instead of defaulting to a full suite", verifyBuildPath);
  requireText(verifyBuildText, "list only blocking issue IDs in the gate summary", verifyBuildPath);
  requireText(verifyBuildText, "set `Ready for browser: yes` only when no accepted-scope `Must Fix`", verifyBuildPath);
  requireText(verifyBuildText, "when `Ready for browser: no`, stop before Browser Checks", verifyBuildPath);
  requireText(verifyBuildText, "Run Browser Checks for browser-visible work", verifyBuildPath);
  requireText(verifyBuildText, "use the dev/local app environment and dev/local DB only", verifyBuildPath);
  requireText(verifyBuildText, "actually use the feature", verifyBuildPath);
  requireText(verifyBuildText, "Review agents are read-only", verifyBuildPath);
  requireText(verifyBuildText, "references/review-agents/output-discipline.md", verifyBuildPath);
  requireText(verifyBuildText, "includes that output\ncontract in each review-agent prompt", verifyBuildPath);
  requireText(verifyBuildText, "### 1. Run Required Review Agents In Parallel", verifyBuildPath);
  requireText(verifyBuildText, "Run these required review agents in the same pre-browser batch", verifyBuildPath);
  requireText(verifyBuildText, "Review results returned: yes / no", verifyBuildPath);
  requireText(verifyBuildText, "Review results returned: yes", verifyBuildPath);
  requireText(verifyBuildText, "USER REVIEW LENSES: relevant user review-lens audits from:", verifyBuildPath);
  requireText(verifyBuildText, "User review lenses are user-provided customization", verifyBuildPath);
  requireText(verifyBuildText, "relevant user review-lens audits", verifyBuildPath);
  requireText(verifyBuildText, "add it to the same parallel pre-browser batch", verifyBuildPath);
  requireText(verifyBuildText, "### 2. Add Risk-Based Audits To The Same Parallel Batch", verifyBuildPath);
  requireText(verifyBuildText, "Use these bundled lenses as a library", verifyBuildPath);
  requireText(verifyBuildText, "primary risk center of this slice, not merely touched", verifyBuildPath);
  requireText(verifyBuildText, "compose a custom", verifyBuildPath);
  requireText(verifyBuildText, "base audits only", verifyBuildPath);
  requireText(verifyBuildText, "as that SUBAGENT's required audit rubric", verifyBuildPath);
  requireText(verifyBuildText, "### 3. Synthesize Review Results", verifyBuildPath);
  requireText(verifyBuildText, "review-agent findings", verifyBuildPath);
  requireText(verifyBuildText, "follow the bundled output discipline", verifyBuildPath);
  requireText(verifyBuildText, "return every `Must Fix`", verifyBuildPath);
  requireText(verifyBuildText, "avoid low-value nits", verifyBuildPath);
  requireText(verifyBuildText, "Write a compact `Pre-Browser Verification Batch` gate before any browser work", verifyBuildPath);
  requireText(verifyBuildText, "blocking issue IDs", verifyBuildPath);
  requireText(verifyBuildText, "If\nthe gate says `Ready for browser: no`, stop before Browser Checks", verifyBuildPath);
  requireText(verifyBuildText, "### 4. Run Browser Checks", verifyBuildPath);
  requireText(verifyBuildText, "run Browser Checks only after `Ready for browser:\nyes`", verifyBuildPath);
  requireText(verifyBuildText, "Browser Proof Needed", verifyBuildPath);
  requireText(verifyBuildText, "general quality and local\n  correctness", verifyBuildPath);
  requireText(verifyBuildText, "recurring\n  slice-level failure patterns", verifyBuildPath);
  requireText(builtAcceptanceAuditText, "Built Slice Acceptance Audit", builtAcceptanceAuditPath);
  requireText(builtAcceptanceAuditText, "Browser Proof Needed", builtAcceptanceAuditPath);
  requireText(builtAcceptanceAuditText, "final browser proof checklist", builtAcceptanceAuditPath);
  requireText(builtAcceptanceAuditText, "plan amendments: if `build.md` records plan amendments", builtAcceptanceAuditPath);
  requireText(builtAcceptanceAuditText, "Follow `references/review-agents/output-discipline.md`", builtAcceptanceAuditPath);
  requireText(builtCodeAuditText, "Built Slice Code Audit", builtCodeAuditPath);
  requireText(builtCodeAuditText, "code correctness and maintainability", builtCodeAuditPath);
  requireText(builtCodeAuditText, "repo structure and utilities", builtCodeAuditPath);
  requireText(builtCodeAuditText, "robustness and edge cases", builtCodeAuditPath);
  requireText(builtCodeAuditText, "blast radius and regressions", builtCodeAuditPath);
  requireText(builtCodeAuditText, "Follow `references/review-agents/output-discipline.md`", builtCodeAuditPath);
  requireText(builtCommonIssuesAuditText, "Built Slice Common Issues Audit", builtCommonIssuesAuditPath);
  requireText(builtCommonIssuesAuditText, "proper use of types", builtCommonIssuesAuditPath);
  requireText(builtCommonIssuesAuditText, "package-exported types", builtCommonIssuesAuditPath);
  requireText(builtCommonIssuesAuditText, "error handling integrity", builtCommonIssuesAuditPath);
  requireText(builtCommonIssuesAuditText, "inspect the relevant package/SDK/ORM validation error types", builtCommonIssuesAuditPath);
  requireText(builtCommonIssuesAuditText, "ephemeral UI/action state isolation", builtCommonIssuesAuditPath);
  requireText(builtCommonIssuesAuditText, "react-hook-form", builtCommonIssuesAuditPath);
  requireText(builtCommonIssuesAuditText, "post-submit data consistency", builtCommonIssuesAuditPath);
  requireText(builtCommonIssuesAuditText, "design-system component reuse", builtCommonIssuesAuditPath);
  requireText(builtCommonIssuesAuditText, "Follow `references/review-agents/output-discipline.md`", builtCommonIssuesAuditPath);
  requireText(phaseSpecCoverageAuditText, "Phase Spec Coverage Review", phaseSpecCoverageAuditPath);
  requireText(phaseSpecCoverageAuditText, "assembled phase work", phaseSpecCoverageAuditPath);
  requireText(phaseSpecCoverageAuditText, "phase-level proof", phaseSpecCoverageAuditPath);
  requireText(phaseSpecCoverageAuditText, "Follow `references/review-agents/output-discipline.md`", phaseSpecCoverageAuditPath);
  requireText(crossSliceIntegrationAuditText, "Cross-Slice Integration Review", crossSliceIntegrationAuditPath);
  requireText(crossSliceIntegrationAuditText, "handoffs and sequencing", crossSliceIntegrationAuditPath);
  requireText(crossSliceIntegrationAuditText, "shared assumptions", crossSliceIntegrationAuditPath);
  requireText(crossSliceIntegrationAuditText, "Follow `references/review-agents/output-discipline.md`", crossSliceIntegrationAuditPath);
  requireText(mainSpecCoverageAuditText, "Main Spec Coverage Review", mainSpecCoverageAuditPath);
  requireText(mainSpecCoverageAuditText, "assembled initiative work", mainSpecCoverageAuditPath);
  requireText(mainSpecCoverageAuditText, "final proof", mainSpecCoverageAuditPath);
  requireText(mainSpecCoverageAuditText, "Follow `references/review-agents/output-discipline.md`", mainSpecCoverageAuditPath);
  requireText(crossPhaseIntegrationAuditText, "Cross-Phase Integration Review", crossPhaseIntegrationAuditPath);
  requireText(crossPhaseIntegrationAuditText, "phase handoffs and sequencing", crossPhaseIntegrationAuditPath);
  requireText(crossPhaseIntegrationAuditText, "shared assumptions", crossPhaseIntegrationAuditPath);
  requireText(crossPhaseIntegrationAuditText, "Follow `references/review-agents/output-discipline.md`", crossPhaseIntegrationAuditPath);
  requireText(readinessRiskAuditText, "Final Readiness Risk Review", readinessRiskAuditPath);
  requireText(readinessRiskAuditText, "unresolved findings", readinessRiskAuditPath);
  requireText(readinessRiskAuditText, "residual risk fit", readinessRiskAuditPath);
  requireText(readinessRiskAuditText, "Follow `references/review-agents/output-discipline.md`", readinessRiskAuditPath);
  requireText(canonicalImplementationAuditText, "Canonical Implementation Review", canonicalImplementationAuditPath);
  requireText(canonicalImplementationAuditText, "official docs or primary sources", canonicalImplementationAuditPath);
  requireText(canonicalImplementationAuditText, "Treat audited initiative/phase research and\naudited library entries as trusted baseline", canonicalImplementationAuditPath);
  requireText(canonicalImplementationAuditText, "## Trigger", canonicalImplementationAuditPath);
  requireText(canonicalImplementationAuditText, "required, not optional", canonicalImplementationAuditPath);
  requireText(canonicalImplementationAuditText, "Stripe, Shopify, or Amazon", canonicalImplementationAuditPath);
  requireText(canonicalImplementationAuditText, "Follow `references/review-agents/output-discipline.md`", canonicalImplementationAuditPath);
  requireText(stateDataIntegrityAuditText, "State Data Integrity Review", stateDataIntegrityAuditPath);
  requireText(stateDataIntegrityAuditText, "source of truth", stateDataIntegrityAuditPath);
  requireText(stateDataIntegrityAuditText, "durable references", stateDataIntegrityAuditPath);
  requireText(securityPrivacyAuditText, "Security Privacy Review", securityPrivacyAuditPath);
  requireText(securityPrivacyAuditText, "access control", securityPrivacyAuditPath);
  requireText(securityPrivacyAuditText, "data exposure", securityPrivacyAuditPath);
  requireText(integrationRiskAuditText, "Integration Risk Review", integrationRiskAuditPath);
  requireText(integrationRiskAuditText, "integration contract", integrationRiskAuditPath);
  requireText(integrationRiskAuditText, "durable handoff", integrationRiskAuditPath);
  requireText(uiRegressionAuditText, "UI Regression Review", uiRegressionAuditPath);
  requireText(uiRegressionAuditText, "design-system fit", uiRegressionAuditPath);
  requireText(uiRegressionAuditText, "state isolation", uiRegressionAuditPath);
  requireText(userFlowsAuditText, "User Flows Review", userFlowsAuditPath);
  requireText(userFlowsAuditText, "flow completeness", userFlowsAuditPath);
  requireText(userFlowsAuditText, "E2E and Browser Clickthrough", userFlowsAuditPath);
  requireText(accessibilityAuditText, "Accessibility Review", accessibilityAuditPath);
  requireText(accessibilityAuditText, "keyboard and focus", accessibilityAuditPath);
  requireText(accessibilityAuditText, "screen-reader", accessibilityAuditPath);
  for (const [auditPath, auditText] of [
    [planReadinessAuditPath, planReadinessAuditText],
    [phaseSpecCoverageAuditPath, phaseSpecCoverageAuditText],
    [crossSliceIntegrationAuditPath, crossSliceIntegrationAuditText],
    [stateDataIntegrityAuditPath, stateDataIntegrityAuditText],
    [securityPrivacyAuditPath, securityPrivacyAuditText],
    [integrationRiskAuditPath, integrationRiskAuditText],
    [uiRegressionAuditPath, uiRegressionAuditText],
    [userFlowsAuditPath, userFlowsAuditText],
    [accessibilityAuditPath, accessibilityAuditText],
  ]) {
    requireText(auditText, "Follow `references/review-agents/output-discipline.md`", auditPath);
  }
  requireText(verifyBuildText, "risk-based additional audits selected by the verifier", verifyBuildPath);
  requireText(verifyBuildText, "SUBAGENT: `canonical-implementation`: required whenever the changed code", verifyBuildPath);
  requireText(verifyBuildText, "The `canonical-implementation` audit ran whenever the changed code touches a", verifyBuildPath);
  requireText(verifyBuildText, "Read the `Build Verification Tier` declaration in `build.md`", verifyBuildPath);
  requireText(verifyBuildText, "Treat the tier as `deep` when the\n   declaration is missing", verifyBuildPath);
  requireText(verifyBuildText, "Build verification tier: standard / deep", verifyBuildPath);
  requireText(verifyBuildText, "Tier declaration: consistent / missing / contradicted (escalated to deep)", verifyBuildPath);
  requireText(verifyBuildText, "Risk-based audits are deep-tier work", verifyBuildPath);
  requireText(verifyBuildText, "escalate to the deep batch and record the misdeclaration", verifyBuildPath);
  requireText(verifyBuildText, "Canonical skip reason: None / no solved-problem surface touched / precedented: <repo file paths> / standard tier", verifyBuildPath);
  requireText(verifyBuildText, "Browser Checks run\nin either tier", verifyBuildPath);
  requireText(verifyBuildText, "canonical-implementation", verifyBuildPath);
  requireText(verifyBuildText, "ui-regression", verifyBuildPath);
  requireText(verifyBuildText, "user-flows", verifyBuildPath);
  requireText(verifyBuildText, "state-data-integrity", verifyBuildPath);
  requireText(verifyBuildText, "security-privacy", verifyBuildPath);
  requireText(verifyBuildText, "integration-risk", verifyBuildPath);
  requireText(verifyBuildText, "accessibility", verifyBuildPath);
  requireText(reviewOutputDisciplineText, "Suggested Category: Must Fix / Follow-Up / Accepted Risk", reviewOutputDisciplinePath);
  requireText(verifyBuildText, "verify by using the accepted feature in the browser", verifyBuildPath);
  requireText(verifyBuildText, "dev/local app environment and dev/local DB/runtime", verifyBuildPath);
  requireText(verifyBuildText, "click the feature controls/actions", verifyBuildPath);
  requireText(verifyBuildText, "This is an execution check", verifyBuildPath);
  requireText(verifyBuildText, "screenshots without using the feature does not satisfy Browser Clickthrough", verifyBuildPath);
  requireText(verifyBuildText, "Automated tests and Browser Clickthrough are separate gates", verifyBuildPath);
  requireText(verifyBuildText, "If the feature cannot be used successfully, write `Verified: no`", verifyBuildPath);
  requireText(verifyBuildText, "Treat the browser as available", verifyBuildPath);
  requireText(verifyBuildText, "Do not switch to a test DB/environment", verifyBuildPath);
  requireText(verifyBuildText, "## Issues", verifyBuildPath);
  requireText(verifyBuildText, "## Pre-Browser Verification Batch", verifyBuildPath);
  requireText(verifyBuildText, "Automated checks: pass / issues / blocked", verifyBuildPath);
  requireText(verifyBuildText, "Required audits: pass / issues / blocked", verifyBuildPath);
  requireText(verifyBuildText, "Risk-based audits: pass / issues / blocked / not run", verifyBuildPath);
  requireText(verifyBuildText, "User review lenses: pass / issues / blocked / not run", verifyBuildPath);
  requireText(verifyBuildText, "Browser proof needed:", verifyBuildPath);
  requireText(verifyBuildText, "Blocking issue IDs:", verifyBuildPath);
  requireText(verifyBuildText, "Ready for browser: yes / no", verifyBuildPath);
  requireText(verifyBuildText, "## Browser Proof Checklist", verifyBuildPath);
  requireText(verifyBuildText, "Concerns from acceptance audit:", verifyBuildPath);
  requireText(verifyBuildText, "## Verification Evidence", verifyBuildPath);
  requireText(verifyBuildText, "### Static / Build Checks", verifyBuildPath);
  requireText(verifyBuildText, "### Unit / Component / Integration Tests", verifyBuildPath);
  requireText(verifyBuildText, "### E2E Tests", verifyBuildPath);
  requireText(verifyBuildText, "### Browser Clickthrough", verifyBuildPath);
  requireText(verifyBuildText, "### Visual Evidence", verifyBuildPath);
  requireText(verifyBuildText, "### Skipped / Not Applicable", verifyBuildPath);
  requireText(verifyBuildText, "DB/runtime:", verifyBuildPath);
  requireText(verifyBuildText, "Fixtures/data setup:", verifyBuildPath);
  requireText(verifyBuildText, "Required audits:", verifyBuildPath);
  requireText(verifyBuildText, "Risk-based audits:", verifyBuildPath);
  requireText(verifyBuildText, "Risk-based audit selection:", verifyBuildPath);
  requireText(verifyBuildText, "Canonical audit: pass / issues / blocked / skipped", verifyBuildPath);
  requireText(verifyBuildText, "### Must Fix", verifyBuildPath);
  requireText(verifyBuildText, "### Follow-Up", verifyBuildPath);
  requireText(verifyBuildText, "### Accepted Risk", verifyBuildPath);
  requireText(verifyBuildText, "Verified: yes / no", verifyBuildPath);
  requireText(verifyBuildText, "Fix Needed: yes / no", verifyBuildPath);
  requireText(verifyBuildText, "Command: None / reopen-check / reopen-phase-check", verifyBuildPath);
  requireText(verifyBuildText, "Phase: None / <phase-id>", verifyBuildPath);
  requireText(verifyBuildText, "Slice: None / <slice-id>", verifyBuildPath);
  requireText(verifyBuildText, "Check: None / phaseResearchComplete / planCreated / planVerified / implemented", verifyBuildPath);
  requireText(verifyBuildText, "### Verifier Conduct", verifyBuildPath);
  requireText(verifyBuildText, "Do not edit implementation files", verifyBuildPath);
  requireText(verifyBuildText, "### `Verified: yes` Requires", verifyBuildPath);
  requireText(verifyBuildText, "`build.md` says `Built: yes`", verifyBuildPath);
  requireText(verifyBuildText, "Do not collapse evidence into a generic \"checks\" bucket", verifyBuildPath);
  requireText(verifyBuildText, "Automated tests ran in the repo's test/E2E environment", verifyBuildPath);
  requireText(verifyBuildText, "Browser Clickthrough\n  ran in the dev/local app environment and dev/local DB/runtime", verifyBuildPath);
  requireText(verifyBuildText, "feature\n  controls/actions clicked", verifyBuildPath);
  requireText(verifyBuildText, "E2E Tests were added, updated, or run", verifyBuildPath);
  requireText(verifyBuildText, "checked existing repo precedent for the same class\n  of problem", verifyBuildPath);
  requireText(verifyBuildText, "No accepted-scope `Must Fix` issue remains", verifyBuildPath);
  requireText(verifyBuildText, "The pre-browser gate is clean", verifyBuildPath);
  requireText(verifyBuildText, "Every plan amendment recorded in `build.md` stays inside the accepted", verifyBuildPath);
  requireText(verifyBuildText, "amendments\n  replace the plan rather than repair the route", verifyBuildPath);
  requireText(verifyBuildText, "All required review agents, the canonical audit when triggered, selected", verifyBuildPath);
  requireText(verifyBuildText, "Do\nnot add custom app key handlers solely to satisfy an automation quirk", verifyBuildPath);
  requireText(verifyBuildText, "### Browser Blockers", verifyBuildPath);
  requireText(verifyBuildText, "Do not run Browser Checks when the pre-browser gate has accepted-scope", verifyBuildPath);
  requireText(verifyBuildText, "keep browser evidence not run because the pre-browser\n  gate failed", verifyBuildPath);
  requireText(verifyBuildText, "### Fix Or Route Back", verifyBuildPath);
  requireText(verifyBuildText, "When the changed code touches a plan-tier trigger surface", verifyBuildPath);
  requireText(verifyBuildText, "record the misdeclared tier", verifyBuildPath);
  requireText(verifyBuildText, "If the fix would edit phase `research.md` or `research-audit.md`, route back", verifyBuildPath);
  requireText(verifyBuildText, "route with `Command: reopen-phase-check`", verifyBuildPath);
  requireText(verifyBuildText, "`Check: phaseResearchComplete`", verifyBuildPath);
  requireText(verifyBuildText, "Give every `Must Fix` item a stable short issue ID", verifyBuildPath);
  requireText(verifyBuildText, "### Completion", verifyBuildPath);
  requireText(verifyBuildText, "complete-check buildVerified", verifyBuildPath);
  requireText(verifyBuildText, "Do not start another slice from inside `verify-slice-build`", verifyBuildPath);
  requireText(verifyBuildText, "hand control back to `go` inside the same run", verifyBuildPath);
  requireText(verifyBuildText, "This is not an instruction to report back to\n  the user and wait", verifyBuildPath);
  requireText(strikeText, "finish-initiative", strikePath);
  requireText(strikeText, "node strike/scripts/state.mjs remove-slice <phase-id> <slice-id>", strikePath);
  requireText(strikeText, "## The Helper Is The Law", strikePath);
  requireText(strikeText, "`gateHints` entry describing what each missing check's artifact", strikePath);
  requireText(strikeText, "Trust the hints and the\nerrors; do not guess at gates", strikePath);
  requireText(strikeText, "## Boundary Changes", strikePath);
  requireText(strikeText, "## Continuation", strikePath);
  requireText(strikeText, "again before doing another workflow step", strikePath);
  requireText(strikeText, "If `fix` writes `Fixed: no` without route-back", strikePath);
  requireText(helperText, "GATE_HINTS", helperPath);
  requireText(strikeText, "durable cross-initiative research library", strikePath);
  requireText(strikeText, "slice ID as the first smaller slice whenever possible", strikePath);
  requireText(strikeText, "When merging, keep the active slice's ID as the surviving slice", strikePath);

  requireText(fixText, "failed Strike verification pass", fixPath);
  requireText(fixText, "## Source Verification", fixPath);
  requireText(fixText, "## Issues Addressed", fixPath);
  requireText(fixText, "## Repo Precedent", fixPath);
  requireText(fixText, "Closest existing pattern:", fixPath);
  requireText(fixText, "Ready for re-verification: yes / no", fixPath);
  requireText(fixText, "under the same contract as\n  `build-slice`", fixPath);
  requireText(fixText, "## Route Back", fixPath);
  requireText(fixText, "Required user-provided customization from the consuming repo's Strike", fixPath);
  requireText(fixText, "user implementation-discipline guidance", fixPath);
  requireText(fixText, "strike/user-guidance/implementation-discipline/global.md", fixPath);
  requireText(fixText, "strike/user-guidance/implementation-discipline/fix.md", fixPath);
  requireText(fixText, "Read required user-provided customization and apply relevant guidance", fixPath);
  requireText(fixText, "Command: None / reopen-check / reopen-phase-check / reopen-slice-check", fixPath);
  requireText(fixText, "Phase: None / <phase-id>", fixPath);
  requireText(fixText, "Slice: None / <slice-id>", fixPath);
  requireText(fixText, "Check: None / <state-check>", fixPath);
  requireText(fixText, "Use one of three outcomes", fixPath);
  requireText(fixText, "use the exact helper command Strike should run", fixPath);
  requireText(fixText, "same verifier must run again", fixPath);
  requireText(fixText, "audited phase `research.md` or\n  `research-audit.md`", fixPath);
  requireText(fixText, "`phaseResearchComplete` so Strike reruns the phase research step and its audit", fixPath);
  requireText(fixText, "Must Fix", fixPath);
  requireText(fixText, "same class of problem. Use error terms, provider names", fixPath);
  requireText(fixText, "payload limit", fixPath);

  requireText(verifyPhaseText, "current phase's `phase-spec.md`", verifyPhasePath);
  requireText(verifyPhaseText, "current phase's `research.md`", verifyPhasePath);
  requireText(verifyPhaseText, "current phase's `research-audit.md`", verifyPhasePath);
  requireText(verifyPhaseText, "Required verification packet:", verifyPhasePath);
  requireText(verifyPhaseText, "optional context when needed:", verifyPhasePath);
  requireText(verifyPhaseText, "supporting-artifacts/", verifyPhasePath);
  requireText(verifyPhaseText, "each slice's `slice.md`", verifyPhasePath);
  requireText(verifyPhaseText, "each slice's `plan.md`", verifyPhasePath);
  requireText(verifyPhaseText, "each slice's `plan-verification.md`", verifyPhasePath);
  requireText(verifyPhaseText, "each slice's `build.md`", verifyPhasePath);
  requireText(verifyPhaseText, "each slice's `build-verification.md`", verifyPhasePath);
  requireText(verifyPhaseText, "Bundled Strike review-agent instructions", verifyPhasePath);
  requireText(verifyPhaseText, "references/review-agents/phase-spec-coverage.md", verifyPhasePath);
  requireText(verifyPhaseText, "references/review-agents/cross-slice-integration.md", verifyPhasePath);
  requireText(verifyPhaseText, "references/review-agents/state-data-integrity.md", verifyPhasePath);
  requireText(verifyPhaseText, "references/review-agents/security-privacy.md", verifyPhasePath);
  requireText(verifyPhaseText, "references/review-agents/integration-risk.md", verifyPhasePath);
  requireText(verifyPhaseText, "references/review-agents/user-flows.md", verifyPhasePath);
  requireText(verifyPhaseText, "Treat passed slice verification as the normal source of slice-local\n   confidence", verifyPhasePath);
  requireText(verifyPhaseText, "Read deeper slice artifacts only when evidence is missing, thin", verifyPhasePath);
  requireAbsentText(verifyPhaseText, "Read every slice artifact", verifyPhasePath);
  requireText(verifyPhaseText, "Required user-provided customization from the consuming repo's Strike", verifyPhasePath);
  requireText(verifyPhaseText, "strike/user-guidance/review-lenses/global.md", verifyPhasePath);
  requireText(verifyPhaseText, "strike/user-guidance/review-lenses/verify-phase.md", verifyPhasePath);
  requireText(verifyPhaseText, "strike/user-guidance/implementation-discipline/global.md", verifyPhasePath);
  requireText(verifyPhaseText, "strike/user-guidance/implementation-discipline/verify-phase.md", verifyPhasePath);
  requireText(verifyPhaseText, "Read required user-provided customization", verifyPhasePath);
  requireText(verifyPhaseText, "current phase's `verification.md`", verifyPhasePath);
  requireText(verifyPhaseText, "Verified: yes", verifyPhasePath);
  requireText(verifyPhaseText, "Review agents are read-only", verifyPhasePath);
  requireText(verifyPhaseText, "references/review-agents/output-discipline.md", verifyPhasePath);
  requireText(verifyPhaseText, "includes that output\ncontract in each review-agent prompt", verifyPhasePath);
  requireText(verifyPhaseText, "### 1. Run Required Review Agents In Parallel", verifyPhasePath);
  requireText(verifyPhaseText, "Run these required review agents in parallel", verifyPhasePath);
  requireText(verifyPhaseText, "Review results returned: yes / no", verifyPhasePath);
  requireText(verifyPhaseText, "Review results returned: yes", verifyPhasePath);
  requireText(verifyPhaseText, "SUBAGENT: `phase-spec-coverage`", verifyPhasePath);
  requireText(verifyPhaseText, "SUBAGENT: `cross-slice-integration`", verifyPhasePath);
  requireText(verifyPhaseText, "USER REVIEW LENSES: relevant user review-lens audits from:", verifyPhasePath);
  requireText(verifyPhaseText, "User review lenses are user-provided customization", verifyPhasePath);
  requireText(verifyPhaseText, "add it to the same parallel review batch", verifyPhasePath);
  requireAbsentText(verifyPhaseText, "host does not support subagents", verifyPhasePath);
  requireAbsentText(verifyPhaseText, "inline lenses", verifyPhasePath);
  requireText(verifyPhaseText, "Do not rerun a full slice code review", verifyPhasePath);
  requireText(verifyPhaseText, "### 2. Add Conditional Review Lenses To The Same Parallel Batch", verifyPhasePath);
  requireText(verifyPhaseText, "Only add these review lenses when completed phase evidence justifies them", verifyPhasePath);
  requireText(verifyPhaseText, "Use\nthe named bundled `references/review-agents/` file as the conditional\nSUBAGENT's required audit rubric", verifyPhasePath);
  requireText(verifyPhaseText, "SUBAGENT: `user-flows`", verifyPhasePath);
  requireText(verifyPhaseText, "SUBAGENT: `state-data-integrity`", verifyPhasePath);
  requireText(verifyPhaseText, "SUBAGENT: `security-privacy`", verifyPhasePath);
  requireText(verifyPhaseText, "SUBAGENT: `integration-risk`", verifyPhasePath);
  requireText(verifyPhaseText, "### 3. Synthesize Review Results", verifyPhasePath);
  requireText(verifyPhaseText, "review-agent findings", verifyPhasePath);
  requireText(verifyPhaseText, "follow the bundled output discipline", verifyPhasePath);
  requireText(verifyPhaseText, "avoid low-value nits", verifyPhasePath);
  requireText(verifyPhaseText, "only when a user-facing flow spans\nmultiple slices", verifyPhasePath);
  requireText(verifyPhaseText, "Browser Clickthrough means using the feature", verifyPhasePath);
  requireText(verifyPhaseText, "supporting evidence only. They are not Browser Clickthrough", verifyPhasePath);
  requireText(verifyPhaseText, "did not include actual Browser Clickthrough", verifyPhasePath);
  requireText(verifyPhaseText, "Environment scope:", verifyPhasePath);
  requireText(verifyPhaseText, "using a test DB/environment\n  for dev/local Browser Clickthrough", verifyPhasePath);
  requireText(verifyPhaseText, "Do not mark `Ready: yes` until all required review agents", verifyPhasePath);
  requireText(verifyPhaseText, "## Issues", verifyPhasePath);
  requireText(verifyPhaseText, "### Must Fix", verifyPhasePath);
  requireText(verifyPhaseText, "### Follow-Up", verifyPhasePath);
  requireText(verifyPhaseText, "### Accepted Risk", verifyPhasePath);
  requireText(verifyPhaseText, "Ready: yes / no", verifyPhasePath);
  requireText(verifyPhaseText, "Fix Needed: yes / no", verifyPhasePath);
  requireText(verifyPhaseText, "Slice: None / <slice-id>", verifyPhasePath);
  requireText(verifyPhaseText, "Command: None / reopen-check / reopen-slice-check", verifyPhasePath);
  requireText(verifyPhaseText, "Check: None / phaseSpecCreated / phaseResearchComplete / slicesCreated / planCreated / planVerified / implemented / buildVerified", verifyPhasePath);
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
  requireText(verifyMainText, "Required user-provided customization from the consuming repo's Strike", verifyMainPath);
  requireText(verifyMainText, "strike/user-guidance/review-lenses/global.md", verifyMainPath);
  requireText(verifyMainText, "strike/user-guidance/review-lenses/verify-main-spec.md", verifyMainPath);
  requireText(verifyMainText, "strike/user-guidance/implementation-discipline/global.md", verifyMainPath);
  requireText(verifyMainText, "strike/user-guidance/implementation-discipline/verify-main-spec.md", verifyMainPath);
  requireText(verifyMainText, "Bundled Strike review-agent instructions", verifyMainPath);
  requireText(verifyMainText, "references/review-agents/main-spec-coverage.md", verifyMainPath);
  requireText(verifyMainText, "references/review-agents/cross-phase-integration.md", verifyMainPath);
  requireText(verifyMainText, "references/review-agents/readiness-risk.md", verifyMainPath);
  requireText(verifyMainText, "Read required user-provided customization", verifyMainPath);
  requireText(verifyMainText, "current initiative's `verification.md`", verifyMainPath);
  requireText(verifyMainText, "read-only review subagents", verifyMainPath);
  requireAbsentText(verifyMainText, "host does not support subagents", verifyMainPath);
  requireAbsentText(verifyMainText, "inline lenses", verifyMainPath);
  requireText(verifyMainText, "Do not rerun full phase or slice audits", verifyMainPath);
  requireText(verifyMainText, "Review results returned: yes / no", verifyMainPath);
  requireText(verifyMainText, "Review results returned: yes", verifyMainPath);
  requireText(verifyMainText, "main-spec-coverage", verifyMainPath);
  requireText(verifyMainText, "cross-phase-integration", verifyMainPath);
  requireText(verifyMainText, "readiness-risk", verifyMainPath);
  requireText(verifyMainText, "SUBAGENT: `user-flows`", verifyMainPath);
  requireText(verifyMainText, "SUBAGENT: `state-data-integrity`", verifyMainPath);
  requireText(verifyMainText, "SUBAGENT: `security-privacy`", verifyMainPath);
  requireText(verifyMainText, "SUBAGENT: `integration-risk`", verifyMainPath);
  requireText(verifyMainText, "includes that output\ncontract in each review-agent prompt", verifyMainPath);
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
  requireText(verifyMainText, "Do not mark `Ready: yes` until all required review agents", verifyMainPath);
  requireText(verifyMainText, "## Issues", verifyMainPath);
  requireText(verifyMainText, "### Must Fix", verifyMainPath);
  requireText(verifyMainText, "### Follow-Up", verifyMainPath);
  requireText(verifyMainText, "### Accepted Risk", verifyMainPath);
  requireText(verifyMainText, "Ready: yes / no", verifyMainPath);
  requireText(verifyMainText, "Fix Needed: yes / no", verifyMainPath);
  requireText(verifyMainText, "Phase: None / <phase-id>", verifyMainPath);
  requireText(verifyMainText, "Slice: None / <slice-id>", verifyMainPath);
  requireText(verifyMainText, "Command: None / reopen-check / reopen-phase-check / reopen-slice-check", verifyMainPath);
  requireText(verifyMainText, "Check: None / ideaRefined / initiativeResearchComplete / decisionsResolved / specCreated / phasesCreated / phaseSpecCreated / phaseResearchComplete / slicesCreated / planCreated / planVerified / implemented / buildVerified / allSlicesVerified", verifyMainPath);
  requireText(verifyMainText, "Do not edit phase, slice, or implementation artifacts", verifyMainPath);
  requireText(verifyMainText, "Give every `Must Fix` item a stable short issue ID", verifyMainPath);
  requireText(verifyMainText, "complete-check allPhasesVerified", verifyMainPath);

  const goPath = "plugins/strike/skills/go/SKILL.md";
  const goText = fs.readFileSync(path.join(root, goPath), "utf8");
  requireText(goText, "complete the first check in `missing`", goPath);
  requireText(goText, "The completion receipt is not a\nworkflow position", goPath);
  requireText(goText, "read implementation discipline `global.md` plus\ntheir own stage file", goPath);
  requireText(goText, "Verifiers also read review-lenses `global.md` plus their own stage file", goPath);
  requireText(goText, "## Plan Verification Tier", goPath);
  requireText(goText, "run `complete-check planVerified` directly", goPath);

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
