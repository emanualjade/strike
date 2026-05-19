#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT_FILE = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(SCRIPT_FILE);
const CUSTOMIZATION_REFERENCE_ROOT = path.resolve(SCRIPT_DIR, "..", "customization");
const CUSTOMIZATION_REFERENCE = readReferenceJson("entry-points.json");
const ENTRY_POINT_DETAILS = CUSTOMIZATION_REFERENCE.entryPoints ?? {};

export const CUSTOMIZE_ROOT = "strike/customize";
export const FILE_MAX_BYTES = 16 * 1024;
export const TOTAL_MAX_BYTES = 64 * 1024;
export const SUPPORTED_SKILLS = CUSTOMIZATION_REFERENCE.supportedSkills ?? [];

validateCustomizationReference();

const ENTRY_POINTS = ["global", ...SUPPORTED_SKILLS];
const CANONICAL_FILES = ENTRY_POINTS.map((entryPoint) => canonicalPath(entryPoint));
const HOW_TO_FILES = new Map(
  ENTRY_POINTS.map((entryPoint) => [howToPath(entryPoint), howToContent(entryPoint)]),
);

function usage({ includeInternal = false } = {}) {
  return renderTemplate("messages/usage.txt", {
    supported_skills: SUPPORTED_SKILLS.join(", "),
    internal_usage: includeInternal ? "Internal mode for the customize skill: review-packet <global|skill|all>" : "",
  }).trimEnd();
}

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

  for (const entryPoint of ["global", ...SUPPORTED_SKILLS]) {
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
    if (entryPoint !== "global" && !Array.isArray(details.loadMeaning)) {
      throw new Error(`Customization reference ${entryPoint} must define loadMeaning.`);
    }
  }
}

export function stripHtmlComments(text) {
  return String(text ?? "").replace(/<!--[\s\S]*?-->/g, "");
}

function normalizeContent(text) {
  return stripHtmlComments(text).replace(/\r\n/g, "\n").trim();
}

function bulletList(items) {
  if (items.length === 0) {
    return "- None";
  }
  return items.map((item) => `- ${item}`).join("\n");
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

function customizationBlock(info) {
  return renderTemplate("templates/user-customization-block.md", {
    path: `${CUSTOMIZE_ROOT}/${info.relativePath}`,
    content: info.normalizedContent,
  }).trimEnd();
}

function displayPath(filePath, repoRoot) {
  return path.relative(repoRoot, filePath).split(path.sep).join("/");
}

function resolveRepoRoot(repoRootOption) {
  if (repoRootOption) {
    const resolved = path.resolve(repoRootOption);
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
      throw new Error(`Repo root does not exist: ${repoRootOption}`);
    }
    return fs.realpathSync(resolved);
  }

  try {
    const gitRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (gitRoot) {
      return fs.realpathSync(gitRoot);
    }
  } catch {
    // Fall through to the current working directory.
  }

  return fs.realpathSync(process.cwd());
}

function customizeRoot(repoRoot) {
  return path.join(repoRoot, CUSTOMIZE_ROOT);
}

function pathFor(repoRoot, relativePath) {
  return path.join(customizeRoot(repoRoot), relativePath);
}

function canonicalPath(entryPoint) {
  return `${entryPoint}/${entryPoint}.md`;
}

function howToPath(entryPoint) {
  return `${entryPoint}/how-to-customize-${entryPoint}.md`;
}

function skillPath(skill) {
  return canonicalPath(skill);
}

function howToContent(entryPoint) {
  const details = ENTRY_POINT_DETAILS[entryPoint];
  if (!details) {
    throw new Error(`Missing how-to details for ${entryPoint}`);
  }

  return renderTemplate("templates/how-to.md", {
    title: details.title,
    entry_point: entryPoint,
    target: details.target,
    ideas: bulletList(details.ideas),
    boundary: details.boundary,
  });
}

function ensureSupportedSkill(skill) {
  if (!SUPPORTED_SKILLS.includes(skill)) {
    throw new Error(`Unsupported customization skill: ${skill || "(missing)"}. Supported skills: ${SUPPORTED_SKILLS.join(", ")}`);
  }
}

function ensureSupportedReviewTarget(target) {
  if (target === "all" || target === "global" || SUPPORTED_SKILLS.includes(target)) {
    return;
  }
  throw new Error(`Unsupported customization review target: ${target || "(missing)"}. Supported targets: global, ${SUPPORTED_SKILLS.join(", ")}, all`);
}

function readFileInfo(repoRoot, relativePath) {
  const absolutePath = pathFor(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return {
      relativePath,
      absolutePath,
      exists: false,
      bytes: 0,
      content: "",
      normalizedContent: "",
      hasUserContent: false,
    };
  }

  const stat = fs.statSync(absolutePath);
  if (!stat.isFile()) {
    return {
      relativePath,
      absolutePath,
      exists: true,
      bytes: stat.size,
      content: "",
      normalizedContent: "",
      hasUserContent: false,
      notFile: true,
    };
  }

  const content = fs.readFileSync(absolutePath, "utf8");
  const normalizedContent = normalizeContent(content);
  return {
    relativePath,
    absolutePath,
    exists: true,
    bytes: stat.size,
    content,
    normalizedContent,
    hasUserContent: normalizedContent.length > 0,
  };
}

function ensureDirectory(repoRoot, relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (fs.existsSync(absolutePath)) {
    const stat = fs.statSync(absolutePath);
    if (!stat.isDirectory()) {
      throw new Error(`${displayPath(absolutePath, repoRoot)}: expected a directory but found a file`);
    }
    return false;
  }

  fs.mkdirSync(absolutePath, { recursive: true });
  return true;
}

function ensureInitDirectories(repoRoot) {
  ensureDirectory(repoRoot, "strike");
  ensureDirectory(repoRoot, CUSTOMIZE_ROOT);
  for (const entryPoint of ENTRY_POINTS) {
    ensureDirectory(repoRoot, `${CUSTOMIZE_ROOT}/${entryPoint}`);
  }
}

function initFileSpecs() {
  const specs = [];
  for (const entryPoint of ENTRY_POINTS) {
    specs.push([canonicalPath(entryPoint), ""]);
    specs.push([howToPath(entryPoint), HOW_TO_FILES.get(howToPath(entryPoint))]);
  }
  return specs;
}

function init(repoRoot) {
  const created = [];
  const existing = [];

  ensureInitDirectories(repoRoot);
  for (const [relativePath, content] of initFileSpecs()) {
    const absolutePath = pathFor(repoRoot, relativePath);
    if (fs.existsSync(absolutePath)) {
      const stat = fs.statSync(absolutePath);
      if (!stat.isFile()) {
        throw new Error(`${displayPath(absolutePath, repoRoot)}: expected a file but found a directory`);
      }
      existing.push(displayPath(absolutePath, repoRoot));
      continue;
    }
    fs.writeFileSync(absolutePath, content, "utf8");
    created.push(displayPath(absolutePath, repoRoot));
  }

  process.stdout.write(renderTemplate("messages/init.md", {
    customization_root: CUSTOMIZE_ROOT,
    created_files: bulletList(created),
    existing_files: bulletList(existing),
  }));
}

function list(repoRoot) {
  if (!fs.existsSync(customizeRoot(repoRoot))) {
    process.stdout.write(renderTemplate("messages/list-missing-root.md", {
      customization_root: CUSTOMIZE_ROOT,
    }));
    return;
  }

  if (!fs.statSync(customizeRoot(repoRoot)).isDirectory()) {
    process.stdout.write(renderTemplate("messages/list-blocked-root.md", {
      customization_root: CUSTOMIZE_ROOT,
    }));
    return;
  }

  const lines = [];
  for (const relativePath of CANONICAL_FILES) {
    const info = readFileInfo(repoRoot, relativePath);
    let state = "missing";
    if (info.exists && info.notFile) {
      state = "not a file";
    } else if (info.exists && info.hasUserContent) {
      state = "has user content";
    } else if (info.exists) {
      state = "blank";
    }
    lines.push(`${CUSTOMIZE_ROOT}/${relativePath}: ${state}`);
  }
  process.stdout.write(renderTemplate("messages/list.md", {
    customization_root: CUSTOMIZE_ROOT,
    entries: bulletList(lines),
  }));
}

function check(repoRoot) {
  const errors = [];
  const warnings = [];

  if (!fs.existsSync(customizeRoot(repoRoot))) {
    process.stdout.write(renderTemplate("messages/check-missing-root.md", {}));
    return 0;
  }

  if (!fs.statSync(customizeRoot(repoRoot)).isDirectory()) {
    errors.push(`${CUSTOMIZE_ROOT}: expected a directory`);
  }

  for (const entryPoint of ENTRY_POINTS) {
    const entryPath = pathFor(repoRoot, entryPoint);
    if (fs.existsSync(entryPath) && !fs.statSync(entryPath).isDirectory()) {
      errors.push(`${CUSTOMIZE_ROOT}/${entryPoint}: expected a directory`);
    }
  }

  for (const relativePath of CANONICAL_FILES) {
    const info = readFileInfo(repoRoot, relativePath);
    if (!info.exists) {
      warnings.push(`${CUSTOMIZE_ROOT}/${relativePath}: missing; run customize init to create it`);
      continue;
    }
    if (info.notFile) {
      errors.push(`${CUSTOMIZE_ROOT}/${relativePath}: expected a file`);
      continue;
    }
    if (info.bytes > FILE_MAX_BYTES) {
      errors.push(`${CUSTOMIZE_ROOT}/${relativePath}: file is ${info.bytes} bytes; max is ${FILE_MAX_BYTES}`);
    }
  }

  const globalInfo = readFileInfo(repoRoot, canonicalPath("global"));
  for (const skill of SUPPORTED_SKILLS) {
    const skillInfo = readFileInfo(repoRoot, skillPath(skill));
    if (!globalInfo.exists || globalInfo.notFile || !skillInfo.exists || skillInfo.notFile) {
      continue;
    }
    const pairBytes = globalInfo.bytes + skillInfo.bytes;
    if (pairBytes > TOTAL_MAX_BYTES) {
      errors.push(`${CUSTOMIZE_ROOT}/${canonicalPath("global")} plus ${CUSTOMIZE_ROOT}/${skillPath(skill)} total ${pairBytes} bytes; max is ${TOTAL_MAX_BYTES}`);
    }
  }

  process.stdout.write(renderTemplate("messages/check.md", {
    result: errors.length === 0 ? "pass" : "fail",
    errors: bulletList(errors),
    warnings: bulletList(warnings),
  }));

  return errors.length > 0 ? 1 : 0;
}

function reviewPaths(target) {
  ensureSupportedReviewTarget(target);
  if (target === "global") {
    return [canonicalPath("global")];
  }
  if (target === "all") {
    return CANONICAL_FILES;
  }
  return [canonicalPath("global"), skillPath(target)];
}

function reviewPacket(repoRoot, target) {
  ensureSupportedReviewTarget(target);
  const loaded = [];
  const warnings = [];
  let totalBytes = 0;

  for (const relativePath of reviewPaths(target)) {
    const info = readFileInfo(repoRoot, relativePath);
    if (!info.exists) {
      warnings.push(`${CUSTOMIZE_ROOT}/${relativePath}: missing; run customize init to create it`);
      continue;
    }
    if (info.notFile) {
      warnings.push(`${CUSTOMIZE_ROOT}/${relativePath}: expected a file`);
      continue;
    }
    if (!info.hasUserContent) {
      loaded.push({ ...info, reviewStatus: "blank" });
      continue;
    }
    if (info.bytes > FILE_MAX_BYTES) {
      warnings.push(`${CUSTOMIZE_ROOT}/${relativePath}: skipped because file is ${info.bytes} bytes; max is ${FILE_MAX_BYTES}`);
      continue;
    }
    if (totalBytes + info.bytes > TOTAL_MAX_BYTES) {
      warnings.push(`${CUSTOMIZE_ROOT}/${relativePath}: skipped because total review content would exceed ${TOTAL_MAX_BYTES} bytes`);
      continue;
    }
    loaded.push({ ...info, reviewStatus: "loaded" });
    totalBytes += info.bytes;
  }

  const dataRecords = loaded.map((info) => JSON.stringify({
    path: `${CUSTOMIZE_ROOT}/${info.relativePath}`,
    status: info.reviewStatus,
    content: info.reviewStatus === "blank" ? "" : info.normalizedContent,
  }));

  process.stdout.write(renderTemplate("messages/review.md", {
    target,
    customization_root: CUSTOMIZE_ROOT,
    included_files: bulletList(loaded.map((info) => `${CUSTOMIZE_ROOT}/${info.relativePath}: ${info.reviewStatus}`)),
    warnings: bulletList(warnings),
    data_records: dataRecords.join("\n"),
  }));
}

function load(repoRoot, skill) {
  ensureSupportedSkill(skill);
  const filesToLoad = [canonicalPath("global"), skillPath(skill)];
  const loaded = [];
  const warnings = [];
  let totalBytes = 0;

  for (const relativePath of filesToLoad) {
    const info = readFileInfo(repoRoot, relativePath);
    if (!info.exists || info.notFile || !info.hasUserContent) {
      continue;
    }
    if (info.bytes > FILE_MAX_BYTES) {
      warnings.push(`${CUSTOMIZE_ROOT}/${relativePath}: skipped because file is ${info.bytes} bytes; max is ${FILE_MAX_BYTES}`);
      continue;
    }
    if (totalBytes + info.bytes > TOTAL_MAX_BYTES) {
      warnings.push(`${CUSTOMIZE_ROOT}/${relativePath}: skipped because total loaded customization would exceed ${TOTAL_MAX_BYTES} bytes`);
      continue;
    }
    loaded.push(info);
    totalBytes += info.bytes;
  }

  if (loaded.length === 0 && warnings.length === 0) {
    process.stdout.write(renderTemplate("messages/load-empty.md", {
      skill,
      customization_root: CUSTOMIZE_ROOT,
    }));
    return;
  }

  process.stdout.write(renderTemplate("messages/load.md", {
    skill,
    customization_root: CUSTOMIZE_ROOT,
    status: `${loaded.length} customization file${loaded.length === 1 ? "" : "s"} loaded.`,
    skill_meaning: bulletList(ENTRY_POINT_DETAILS[skill].loadMeaning),
    included_files: bulletList(loaded.map((info) => `${CUSTOMIZE_ROOT}/${info.relativePath}`)),
    warnings: bulletList(warnings),
    customization_blocks: loaded.map(customizationBlock).join("\n\n") || "No user customization content was loaded.",
  }));
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

  const [command, skill, ...extraArgs] = options.positional;
  if (!command) {
    throw new Error(usage());
  }

  if (["init", "list", "check"].includes(command) && (skill || extraArgs.length > 0)) {
    throw new Error(`${command} does not accept positional arguments.\n${usage()}`);
  }
  if (command === "load") {
    if (!skill) {
      throw new Error(`load requires a skill.\n${usage()}`);
    }
    if (extraArgs.length > 0) {
      throw new Error(`load accepts exactly one skill.\n${usage()}`);
    }
  }
  if (command === "review-packet") {
    if (!skill) {
      throw new Error(`review-packet requires a review target.\n${usage({ includeInternal: true })}`);
    }
    if (extraArgs.length > 0) {
      throw new Error(`review-packet accepts exactly one target.\n${usage({ includeInternal: true })}`);
    }
  }

  const repoRoot = resolveRepoRoot(options.repoRoot);
  switch (command) {
    case "init":
      init(repoRoot);
      return 0;
    case "list":
      list(repoRoot);
      return 0;
    case "check":
      return check(repoRoot);
    case "load":
      load(repoRoot, skill);
      return 0;
    case "review-packet":
      reviewPacket(repoRoot, skill);
      return 0;
    default:
      throw new Error(`Unknown command: ${command}\n${usage()}`);
  }
}

const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";

if (SCRIPT_FILE === invokedFile) {
  try {
    const status = runCli();
    process.exitCode = status;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 2;
  }
}
