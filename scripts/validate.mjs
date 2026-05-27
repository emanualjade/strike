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
const knownSkillNames = new Set();
const standaloneUtilitySkillNames = new Set(["handoff"]);

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

function validateGitHubMarketplace() {
  validatePortableMarketplace(".github/plugin/marketplace.json", {
    descriptionInMetadata: true,
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

  const outputHeading = skillText.match(/^## Output\s*$/m);
  if (outputHeading) {
    const outputStart = outputHeading.index + outputHeading[0].length;
    const outputRest = skillText.slice(outputStart);
    const nextHeading = outputRest.search(/^##\s+/m);
    const outputText = nextHeading === -1 ? outputRest : outputRest.slice(0, nextHeading);
    if (
      /Reset context first:\s*yes/.test(outputText) ||
      /Next Strike skill:/.test(outputText) ||
      /(^|\n)\s*Arguments:\s*/.test(outputText)
    ) {
      fail(
        `${rel(skillFile)}: Output section must render user-facing next prompts instead of raw handoff fields`,
      );
    }
  }

  if (!standaloneUtilitySkillNames.has(skillName)) {
    if (!skillText.includes("## Host Invocation")) {
      fail(`${rel(skillFile)}: missing Host Invocation section`);
    }
    if (!skillText.includes("references/invocation.md")) {
      fail(`${rel(skillFile)}: must reference plugin host invocation guidance`);
    }
  }

  const concreteClaudeInvocations = [...skillText.matchAll(/\/strike:[a-z0-9-]+/g)].map((match) => match[0]);
  if (concreteClaudeInvocations.length > 0) {
    fail(
      `${rel(skillFile)}: concrete /strike:<skill> commands are Claude-specific; use canonical Next Strike skill handoffs (${[
        ...new Set(concreteClaudeInvocations),
      ].join(", ")})`,
    );
  }
  if (/(^|\n)\s*\/clear(\s|$)/.test(skillText) || skillText.includes("`/clear`")) {
    fail(`${rel(skillFile)}: /clear is host-specific; use Reset context first: yes plus references/invocation.md rendering`);
  }

  const openaiMetadataPath = path.join(skillPath, "agents/openai.yaml");
  if (!fs.existsSync(openaiMetadataPath)) {
    fail(`${rel(skillPath)}: missing agents/openai.yaml`);
  } else {
    const openaiMetadata = fs.readFileSync(openaiMetadataPath, "utf8");
    if (skillName === "auto-strike") {
      if (/disable-model-invocation:\s*true/.test(skillText)) {
        fail(`${rel(skillFile)}: auto-strike must stay Codex-invocable; do not disable model invocation`);
      }
      if (!/allow_implicit_invocation:\s*true/.test(openaiMetadata)) {
        fail(`${rel(openaiMetadataPath)}: auto-strike must allow Codex invocation`);
      }
      if (!/display_name:\s*["']?Auto Strike["']?/.test(openaiMetadata)) {
        fail(`${rel(openaiMetadataPath)}: auto-strike must provide Codex interface metadata`);
      }
    } else if (!/allow_implicit_invocation:\s*false/.test(openaiMetadata)) {
      fail(`${rel(openaiMetadataPath)}: expected allow_implicit_invocation: false`);
    }
  }
}

function validatePlugin(pluginPath) {
  const pluginName = path.basename(pluginPath);
  const relativePluginPath = rel(pluginPath);
  const copilotManifestPath = path.join(relativePluginPath, "plugin.json");
  const codexManifestPath = path.join(relativePluginPath, ".codex-plugin/plugin.json");
  const claudeManifestPath = path.join(relativePluginPath, ".claude-plugin/plugin.json");
  const copilot = readJson(copilotManifestPath);
  const codex = readJson(codexManifestPath);
  const claude = readJson(claudeManifestPath);

  for (const [host, manifest, manifestPath] of [
    ["copilot", copilot, copilotManifestPath],
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
    }
  }

  const manifestVersions = [copilot, codex, claude]
    .filter(Boolean)
    .map((manifest) => manifest.version);
  if (new Set(manifestVersions).size > 1) {
    fail(`${relativePluginPath}: Copilot, Codex, and Claude manifest versions should match`);
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

  for (const skillDirectory of skillDirectories) {
    knownSkillNames.add(path.basename(skillDirectory));
  }

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

  const stageContractsPath = "plugins/strike/references/stage-contracts.md";
  if (!exists(stageContractsPath)) {
    fail(`${stageContractsPath}: missing shared stage contracts`);
    return;
  }

  const stageContracts = fs.readFileSync(path.join(root, stageContractsPath), "utf8");
  const concreteClaudeInvocations = [...stageContracts.matchAll(/\/strike:[a-z0-9-]+/g)].map((match) => match[0]);
  if (concreteClaudeInvocations.length > 0) {
    fail(
      `${stageContractsPath}: stage contracts must stay host-neutral (${[
        ...new Set(concreteClaudeInvocations),
      ].join(", ")})`,
    );
  }
  if (/(^|\n)\s*\/clear(\s|$)/.test(stageContracts) || stageContracts.includes("`/clear`")) {
    fail(`${stageContractsPath}: /clear is host-specific; use Reset context first: yes plus references/invocation.md rendering`);
  }
}

function validateRuntimeReferenceBoundary() {
  const allowedRuntimeReferences = [
    /^plugins\/strike\/references\/board-model\.md$/,
    /^plugins\/strike\/references\/invocation\.md$/,
    /^plugins\/strike\/references\/slug-policy\.md$/,
    /^plugins\/strike\/references\/stage-contracts\.md$/,
    /^plugins\/strike\/references\/scripts\/[a-z0-9-]+\.mjs$/,
    /^plugins\/strike\/references\/customization\/entry-points\.json$/,
    /^plugins\/strike\/references\/customization\/messages\/[a-z0-9-]+\.(md|txt)$/,
    /^plugins\/strike\/references\/customization\/templates\/[a-z0-9-]+\.md$/,
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

function validateSkillHandoffs() {
  for (const pluginDirectory of fs
    .readdirSync(path.join(root, "plugins"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => path.join(root, "plugins", entry.name))) {
    const skillsPath = path.join(pluginDirectory, "skills");
    if (!fs.existsSync(skillsPath)) continue;
    for (const entry of fs.readdirSync(skillsPath, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
      const skillFile = path.join(skillsPath, entry.name, "SKILL.md");
      if (!fs.existsSync(skillFile)) continue;
      const skillText = fs.readFileSync(skillFile, "utf8");
      for (const match of skillText.matchAll(/Next Strike skill:\s*([a-z0-9-]+)/g)) {
        if (!knownSkillNames.has(match[1])) {
          fail(`${rel(skillFile)}: unknown handoff skill ${match[1]}`);
        }
      }
    }
  }
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
validateGitHubMarketplace();
validatePlugins();
validateVersionAlignment();
validateSharedReferences();
validateSkillHandoffs();
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
