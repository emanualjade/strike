#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SCRIPT_FILE = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(SCRIPT_FILE);
const PLUGIN_ROOT = path.resolve(SCRIPT_DIR, "..", "..", "..");
const CUSTOMIZATION_REFERENCE_ROOT = path.join(PLUGIN_ROOT, "references", "customization");
const RUNTIME_SCRIPT = path.join(PLUGIN_ROOT, "references", "scripts", "customize.mjs");

const CUSTOMIZE_ROOT = "strike/customize";
const CUSTOMIZE_SYSTEM_ROOT = `${CUSTOMIZE_ROOT}/system`;
const CUSTOMIZE_USER_ROOT = `${CUSTOMIZE_ROOT}/user`;
const LEGACY_ACCEPT_CUSTOMIZATION = `${CUSTOMIZE_USER_ROOT}/accept/accept.md`;

const CUSTOMIZATION_REFERENCE = readReferenceJson("entry-points.json");
const ENTRY_POINT_DETAILS = CUSTOMIZATION_REFERENCE.entryPoints ?? {};
const SUPPORTED_SKILLS = CUSTOMIZATION_REFERENCE.supportedSkills ?? [];
const ENTRY_POINTS = ["global", ...SUPPORTED_SKILLS];

function readReferenceJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(CUSTOMIZATION_REFERENCE_ROOT, relativePath), "utf8"));
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateCustomizationReference() {
  if (!Array.isArray(SUPPORTED_SKILLS) || SUPPORTED_SKILLS.length === 0) {
    throw new Error("Customization reference must define supportedSkills.");
  }
  if (!isPlainObject(ENTRY_POINT_DETAILS)) {
    throw new Error("Customization reference must define entryPoints.");
  }

  for (const entryPoint of ENTRY_POINTS) {
    const details = ENTRY_POINT_DETAILS[entryPoint];
    if (!isPlainObject(details)) {
      throw new Error(`Customization reference is missing entry point: ${entryPoint}`);
    }
    if (typeof details.title !== "string" || typeof details.target !== "string") {
      throw new Error(`Customization reference ${entryPoint} must define title and target.`);
    }
    if (!Array.isArray(details.ideas) || typeof details.boundary !== "string") {
      throw new Error(`Customization reference ${entryPoint} must define ideas and boundary.`);
    }
  }
}

function bulletList(items) {
  if (items.length === 0) {
    return "- None";
  }
  return items.map((item) => `- ${item}`).join("\n");
}

function stripHtmlComments(text) {
  return String(text ?? "").replace(/<!--[\s\S]*?-->/g, "");
}

function hasUserContent(text) {
  return stripHtmlComments(text).replace(/\r\n/g, "\n").trim().length > 0;
}

function readTemplate(name) {
  return fs.readFileSync(path.join(CUSTOMIZATION_REFERENCE_ROOT, name), "utf8");
}

function renderTemplate(name, values) {
  let rendered = readTemplate(name);
  for (const [key, value] of Object.entries(values)) {
    rendered = rendered.split(`{{${key}}}`).join(String(value ?? ""));
  }

  const unreplaced = rendered.match(/{{[a-z_]+}}/g);
  if (unreplaced) {
    throw new Error(`Template ${name} has unreplaced placeholders: ${[...new Set(unreplaced)].join(", ")}`);
  }

  return `${rendered.trimEnd()}\n`;
}

function resolveRepoRoot(repoRootOption) {
  if (repoRootOption) {
    const resolved = path.resolve(repoRootOption);
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
      throw new Error(`Repo root does not exist: ${repoRootOption}`);
    }
    return fs.realpathSync(resolved);
  }

  return fs.realpathSync(process.cwd());
}

function displayPath(filePath, repoRoot) {
  return path.relative(repoRoot, filePath).split(path.sep).join("/");
}

function inspectPath(absolutePath) {
  try {
    const stat = fs.lstatSync(absolutePath);
    return { stat, symlink: stat.isSymbolicLink() };
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") {
      return null;
    }
    throw error;
  }
}

function ensureNotSymlink(absolutePath, repoRoot) {
  const info = inspectPath(absolutePath);
  if (info?.symlink) {
    throw new Error(`${displayPath(absolutePath, repoRoot)}: expected a normal path but found a symlink`);
  }
  return info;
}

function ensureDirectory(repoRoot, relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  const info = ensureNotSymlink(absolutePath, repoRoot);
  if (info) {
    if (!info.stat.isDirectory()) {
      throw new Error(`${displayPath(absolutePath, repoRoot)}: expected a directory but found a file`);
    }
    return false;
  }

  fs.mkdirSync(absolutePath, { recursive: true });
  return true;
}

function ensureAbsoluteDirectory(absolutePath, repoRoot) {
  const info = ensureNotSymlink(absolutePath, repoRoot);
  if (info) {
    if (!info.stat.isDirectory()) {
      throw new Error(`${displayPath(absolutePath, repoRoot)}: expected a directory but found a file`);
    }
    return false;
  }

  fs.mkdirSync(absolutePath, { recursive: true });
  return true;
}

function copyDirectory(sourceRoot, destinationRoot, repoRoot, copied) {
  ensureAbsoluteDirectory(destinationRoot, repoRoot);
  for (const entry of fs.readdirSync(sourceRoot, { withFileTypes: true })) {
    const sourcePath = path.join(sourceRoot, entry.name);
    const destinationPath = path.join(destinationRoot, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destinationPath, repoRoot, copied);
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }
    const destinationInfo = ensureNotSymlink(destinationPath, repoRoot);
    if (destinationInfo && !destinationInfo.stat.isFile()) {
      throw new Error(`${displayPath(destinationPath, repoRoot)}: expected a file but found a directory`);
    }
    fs.copyFileSync(sourcePath, destinationPath);
    copied.push(displayPath(destinationPath, repoRoot));
  }
}

function canonicalPath(entryPoint) {
  return `${entryPoint}/${entryPoint}.md`;
}

function howToPath(entryPoint) {
  return `${entryPoint}/how-to-customize-${entryPoint}.md`;
}

function howToContent(entryPoint) {
  const details = ENTRY_POINT_DETAILS[entryPoint];
  if (!details) {
    throw new Error(`Missing how-to details for ${entryPoint}`);
  }

  const reviewLenses = details.reviewFiles === true
    ? [
        "Review lenses:",
        "",
        "- Optional files under `reviews/*.md` are loaded as read-only review",
        "  perspectives for this entry point.",
        "- Use lowercase kebab-case filenames such as",
        "  `reviews/accessibility.md` or `reviews/edge-cases.md`.",
        "- A review lens should return findings and evidence to the active Strike",
        "  skill. It should not edit implementation files, change board state,",
        "  commit, or expand the active skill's write scope.",
      ].join("\n")
    : "";

  return renderTemplate("templates/how-to.md", {
    title: details.title,
    entry_point: entryPoint,
    target: details.target,
    ideas: bulletList(details.ideas),
    boundary: details.boundary,
    review_lenses: reviewLenses,
  });
}

function pathFor(repoRoot, relativePath) {
  return path.join(repoRoot, CUSTOMIZE_USER_ROOT, relativePath);
}

function customizeSystemRoot(repoRoot) {
  return path.join(repoRoot, CUSTOMIZE_SYSTEM_ROOT);
}

function ensureInitDirectories(repoRoot) {
  ensureDirectory(repoRoot, "strike");
  ensureDirectory(repoRoot, CUSTOMIZE_ROOT);
  ensureDirectory(repoRoot, CUSTOMIZE_SYSTEM_ROOT);
  ensureDirectory(repoRoot, CUSTOMIZE_USER_ROOT);
  for (const entryPoint of ENTRY_POINTS) {
    ensureDirectory(repoRoot, `${CUSTOMIZE_USER_ROOT}/${entryPoint}`);
    if (ENTRY_POINT_DETAILS[entryPoint]?.reviewFiles === true) {
      ensureDirectory(repoRoot, `${CUSTOMIZE_USER_ROOT}/${entryPoint}/reviews`);
    }
  }
}

function installSystemRuntime(repoRoot) {
  const copied = [];
  const systemRoot = customizeSystemRoot(repoRoot);
  ensureAbsoluteDirectory(systemRoot, repoRoot);

  const systemScript = path.join(systemRoot, "customize.mjs");
  const systemScriptInfo = ensureNotSymlink(systemScript, repoRoot);
  if (systemScriptInfo && !systemScriptInfo.stat.isFile()) {
    throw new Error(`${displayPath(systemScript, repoRoot)}: expected a file but found a directory`);
  }
  fs.copyFileSync(RUNTIME_SCRIPT, systemScript);
  copied.push(displayPath(systemScript, repoRoot));

  const systemReferencesRoot = path.join(systemRoot, "references", "customization");
  ensureAbsoluteDirectory(path.dirname(systemReferencesRoot), repoRoot);
  const systemReferencesInfo = ensureNotSymlink(systemReferencesRoot, repoRoot);
  if (systemReferencesInfo) {
    if (!systemReferencesInfo.stat.isDirectory()) {
      throw new Error(`${displayPath(systemReferencesRoot, repoRoot)}: expected a directory but found a file`);
    }
    fs.rmSync(systemReferencesRoot, { recursive: true, force: true });
  }
  copyDirectory(CUSTOMIZATION_REFERENCE_ROOT, systemReferencesRoot, repoRoot, copied);

  const manifestPath = path.join(systemRoot, "manifest.json");
  const manifestInfo = ensureNotSymlink(manifestPath, repoRoot);
  if (manifestInfo && !manifestInfo.stat.isFile()) {
    throw new Error(`${displayPath(manifestPath, repoRoot)}: expected a file but found a directory`);
  }
  const manifest = {
    managedBy: "strike",
    runtime: "customize",
    layoutVersion: 1,
    userRoot: CUSTOMIZE_USER_ROOT,
    systemRoot: CUSTOMIZE_SYSTEM_ROOT,
    managedFiles: copied.map((filePath) => filePath.split(path.sep).join("/")),
  };
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  copied.push(displayPath(manifestPath, repoRoot));

  return copied;
}

function initFileSpecs() {
  const specs = [];
  for (const entryPoint of ENTRY_POINTS) {
    specs.push([canonicalPath(entryPoint), ""]);
    specs.push([howToPath(entryPoint), howToContent(entryPoint)]);
  }
  return specs;
}

function legacyCustomizationWarnings(repoRoot) {
  const legacyPath = path.join(repoRoot, LEGACY_ACCEPT_CUSTOMIZATION);
  const info = inspectPath(legacyPath);
  if (!info) {
    return [];
  }
  const warning = `${LEGACY_ACCEPT_CUSTOMIZATION}: legacy accept customization is ignored; move any needed guidance to ${CUSTOMIZE_USER_ROOT}/readiness-review/readiness-review.md`;
  if (info.symlink || !info.stat.isFile()) {
    return [warning];
  }
  try {
    return hasUserContent(fs.readFileSync(legacyPath, "utf8")) ? [warning] : [];
  } catch {
    return [warning];
  }
}

function initialize(repoRoot) {
  const created = [];
  const existing = [];
  const warnings = [];

  ensureInitDirectories(repoRoot);
  const systemFiles = installSystemRuntime(repoRoot);
  for (const [relativePath, content] of initFileSpecs()) {
    const absolutePath = pathFor(repoRoot, relativePath);
    const existingInfo = ensureNotSymlink(absolutePath, repoRoot);
    if (existingInfo) {
      if (!existingInfo.stat.isFile()) {
        throw new Error(`${displayPath(absolutePath, repoRoot)}: expected a file but found a directory`);
      }
      existing.push(displayPath(absolutePath, repoRoot));
      continue;
    }
    fs.writeFileSync(absolutePath, content, "utf8");
    created.push(displayPath(absolutePath, repoRoot));
  }

  warnings.push(...legacyCustomizationWarnings(repoRoot));

  process.stdout.write(renderTemplate("messages/init.md", {
    customization_root: CUSTOMIZE_ROOT,
    user_root: CUSTOMIZE_USER_ROOT,
    system_root: CUSTOMIZE_SYSTEM_ROOT,
    system_files: bulletList(systemFiles),
    created_files: bulletList(created),
    existing_files: bulletList(existing),
    warnings: bulletList(warnings),
  }));
}

function usage() {
  return "Usage: init.mjs [--repo-root <path>]";
}

function parseArgs(argv) {
  const options = {
    repoRoot: "",
    positional: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--repo-root") {
      index += 1;
      if (index >= argv.length) {
        throw new Error("--repo-root requires a value.");
      }
      options.repoRoot = argv[index];
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg.startsWith("--")) {
      throw new Error(`Unknown argument: ${arg}`);
    } else {
      options.positional.push(arg);
    }
  }

  return options;
}

export function runCli(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }
  if (options.positional.length > 0) {
    throw new Error(`init.mjs does not accept positional arguments.\n${usage()}`);
  }

  validateCustomizationReference();
  initialize(resolveRepoRoot(options.repoRoot));
  return 0;
}

const invokedFile = process.argv[1] ? fs.realpathSync(path.resolve(process.argv[1])) : "";

if (fs.realpathSync(SCRIPT_FILE) === invokedFile) {
  try {
    const status = runCli();
    process.exitCode = status;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 2;
  }
}
