#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SCRIPT_FILE = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(SCRIPT_FILE);
const LOCAL_CUSTOMIZATION_REFERENCE_ROOT = path.resolve(SCRIPT_DIR, "references", "customization");
const PLUGIN_CUSTOMIZATION_REFERENCE_ROOT = path.resolve(SCRIPT_DIR, "..", "customization");
const CUSTOMIZATION_REFERENCE_ROOT = fs.existsSync(path.join(LOCAL_CUSTOMIZATION_REFERENCE_ROOT, "entry-points.json"))
  ? LOCAL_CUSTOMIZATION_REFERENCE_ROOT
  : PLUGIN_CUSTOMIZATION_REFERENCE_ROOT;
const CUSTOMIZATION_REFERENCE = readReferenceJson("entry-points.json");
const ENTRY_POINT_DETAILS = CUSTOMIZATION_REFERENCE.entryPoints ?? {};

export const CUSTOMIZE_ROOT = "strike/customize";
export const CUSTOMIZE_SYSTEM_ROOT = `${CUSTOMIZE_ROOT}/system`;
export const CUSTOMIZE_USER_ROOT = `${CUSTOMIZE_ROOT}/user`;
export const FILE_MAX_BYTES = 16 * 1024;
export const TOTAL_MAX_BYTES = 64 * 1024;
export const SUPPORTED_SKILLS = CUSTOMIZATION_REFERENCE.supportedSkills ?? [];
export const REVIEW_LENS_DIR = "reviews";

validateCustomizationReference();

const ENTRY_POINTS = ["global", ...SUPPORTED_SKILLS];
const CANONICAL_FILES = ENTRY_POINTS.map((entryPoint) => canonicalPath(entryPoint));
const LEGACY_ACCEPT_CUSTOMIZATION = "accept/accept.md";

function usage({ includeInternal = false } = {}) {
  return renderTemplate("messages/usage.txt", {
    supported_skills: SUPPORTED_SKILLS.join(", "),
    internal_usage: includeInternal ? "Internal mode for the customize skill: review-instructions-packet <global|skill|all>" : "",
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
    path: `${CUSTOMIZE_USER_ROOT}/${info.relativePath}`,
    content: info.normalizedContent,
  }).trimEnd();
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

function customizeUserRoot(repoRoot) {
  return path.join(repoRoot, CUSTOMIZE_USER_ROOT);
}

function pathFor(repoRoot, relativePath) {
  return path.join(customizeUserRoot(repoRoot), relativePath);
}

function canonicalPath(entryPoint) {
  return `${entryPoint}/${entryPoint}.md`;
}

function skillPath(skill) {
  return canonicalPath(skill);
}

function supportsReviewFiles(entryPoint) {
  return ENTRY_POINT_DETAILS[entryPoint]?.reviewFiles === true;
}

function reviewLensDirectory(entryPoint) {
  return `${entryPoint}/${REVIEW_LENS_DIR}`;
}

function isReviewLensFileName(fileName) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(fileName);
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

function inspectPath(absolutePath) {
  try {
    return fs.lstatSync(absolutePath);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") {
      return null;
    }
    throw error;
  }
}

function skippedFileReason(info) {
  if (info.symlink) {
    return "expected a normal file but found a symlink";
  }
  if (info.notFile) {
    return "expected a file";
  }
  if (info.readError) {
    return `could not read file (${info.readError})`;
  }
  return "";
}

function checkFileProblem(info) {
  if (info.symlink) {
    return "expected a normal file but found a symlink";
  }
  if (info.notFile) {
    return "expected a file";
  }
  if (info.readError) {
    return `could not read file (${info.readError})`;
  }
  return "";
}

function readFileInfo(repoRoot, relativePath) {
  const absolutePath = pathFor(repoRoot, relativePath);
  const stat = inspectPath(absolutePath);
  if (!stat) {
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

  if (stat.isSymbolicLink()) {
    return {
      relativePath,
      absolutePath,
      exists: true,
      bytes: stat.size,
      content: "",
      normalizedContent: "",
      hasUserContent: false,
      symlink: true,
      notFile: true,
    };
  }

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

  let content = "";
  try {
    content = fs.readFileSync(absolutePath, "utf8");
  } catch (error) {
    return {
      relativePath,
      absolutePath,
      exists: true,
      bytes: stat.size,
      content: "",
      normalizedContent: "",
      hasUserContent: false,
      readError: error.code || error.message,
    };
  }
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

function legacyAcceptCustomizationWarnings(repoRoot) {
  const info = readFileInfo(repoRoot, LEGACY_ACCEPT_CUSTOMIZATION);
  if (!info.exists) {
    return [];
  }
  if (info.hasUserContent || info.symlink || info.notFile || info.readError) {
    return [`${CUSTOMIZE_USER_ROOT}/${LEGACY_ACCEPT_CUSTOMIZATION}: legacy accept customization is ignored; move any needed guidance to ${CUSTOMIZE_USER_ROOT}/readiness-review/readiness-review.md`];
  }
  return [];
}

function reviewLensWarningIsError(warning) {
  return (
    warning.includes(": expected a directory") ||
    warning.includes(": expected a normal directory") ||
    warning.includes(": could not read directory") ||
    warning.includes(": skipped because expected a file") ||
    warning.includes(": skipped because expected a normal file") ||
    warning.includes(": skipped because could not read file")
  );
}

function discoverReviewLensFiles(repoRoot, entryPoint) {
  if (!supportsReviewFiles(entryPoint)) {
    return {
      files: [],
      warnings: [],
    };
  }

  const relativeDirectory = reviewLensDirectory(entryPoint);
  const absoluteDirectory = pathFor(repoRoot, relativeDirectory);
  const directoryStat = inspectPath(absoluteDirectory);
  if (!directoryStat) {
    return {
      files: [],
      warnings: [],
    };
  }

  if (directoryStat.isSymbolicLink()) {
    return {
      files: [],
      warnings: [`${CUSTOMIZE_USER_ROOT}/${relativeDirectory}: expected a normal directory but found a symlink`],
    };
  }

  if (!directoryStat.isDirectory()) {
    return {
      files: [],
      warnings: [`${CUSTOMIZE_USER_ROOT}/${relativeDirectory}: expected a directory`],
    };
  }

  const files = [];
  const warnings = [];
  let entries = [];
  try {
    entries = fs.readdirSync(absoluteDirectory, { withFileTypes: true })
      .sort((left, right) => left.name.localeCompare(right.name));
  } catch (error) {
    return {
      files: [],
      warnings: [`${CUSTOMIZE_USER_ROOT}/${relativeDirectory}: could not read directory (${error.code || error.message})`],
    };
  }

  for (const entry of entries) {
    if (entry.name.startsWith(".") || !entry.name.endsWith(".md")) {
      continue;
    }
    const relativePath = `${relativeDirectory}/${entry.name}`;
    if (!isReviewLensFileName(entry.name)) {
      warnings.push(`${CUSTOMIZE_USER_ROOT}/${relativePath}: skipped because review lens filenames must be lowercase kebab-case .md files`);
      continue;
    }
    const info = readFileInfo(repoRoot, relativePath);
    const problem = skippedFileReason(info);
    if (problem) {
      warnings.push(`${CUSTOMIZE_USER_ROOT}/${relativePath}: skipped because ${problem}`);
      continue;
    }
    files.push(info);
  }

  return { files, warnings };
}

function previewPaths(repoRoot, skill) {
  const paths = [canonicalPath("global"), skillPath(skill)];
  const { files } = discoverReviewLensFiles(repoRoot, skill);
  for (const info of files) {
    paths.push(info.relativePath);
  }
  return paths;
}

function reviewInstructionPaths(repoRoot, target) {
  ensureSupportedReviewTarget(target);
  if (target === "global") {
    return [canonicalPath("global")];
  }
  if (target === "all") {
    const paths = [...CANONICAL_FILES];
    for (const skill of SUPPORTED_SKILLS) {
      const { files } = discoverReviewLensFiles(repoRoot, skill);
      for (const info of files) {
        paths.push(info.relativePath);
      }
    }
    return paths;
  }

  return [
    canonicalPath("global"),
    skillPath(target),
    ...discoverReviewLensFiles(repoRoot, target).files.map((info) => info.relativePath),
  ];
}

function list(repoRoot) {
  if (!fs.existsSync(customizeUserRoot(repoRoot))) {
    process.stdout.write(renderTemplate("messages/list-missing-root.md", {
      customization_root: CUSTOMIZE_USER_ROOT,
    }));
    return;
  }

  if (!fs.statSync(customizeUserRoot(repoRoot)).isDirectory()) {
    process.stdout.write(renderTemplate("messages/list-blocked-root.md", {
      customization_root: CUSTOMIZE_USER_ROOT,
    }));
    return;
  }

  const lines = [];
  for (const relativePath of CANONICAL_FILES) {
    const info = readFileInfo(repoRoot, relativePath);
    let state = "missing";
    if (info.exists && info.symlink) {
      state = "symlink";
    } else if (info.exists && info.notFile) {
      state = "not a file";
    } else if (info.exists && info.readError) {
      state = `unreadable (${info.readError})`;
    } else if (info.exists && info.hasUserContent) {
      state = "has user content";
    } else if (info.exists) {
      state = "blank";
    }
    lines.push(`${CUSTOMIZE_USER_ROOT}/${relativePath}: ${state}`);
  }
  for (const skill of SUPPORTED_SKILLS.filter(supportsReviewFiles)) {
    const lensResult = discoverReviewLensFiles(repoRoot, skill);
    for (const warning of lensResult.warnings) {
      lines.push(warning);
    }
    if (lensResult.files.length === 0 && lensResult.warnings.length === 0) {
      lines.push(`${CUSTOMIZE_USER_ROOT}/${reviewLensDirectory(skill)}/*.md: none`);
      continue;
    }
    for (const info of lensResult.files) {
      const state = info.hasUserContent ? "has user content" : "blank";
      lines.push(`${CUSTOMIZE_USER_ROOT}/${info.relativePath}: ${state}`);
    }
  }
  lines.push(...legacyAcceptCustomizationWarnings(repoRoot));
  process.stdout.write(renderTemplate("messages/list.md", {
    customization_root: CUSTOMIZE_USER_ROOT,
    entries: bulletList(lines),
  }));
}

function checkSetup(repoRoot) {
  const errors = [];
  const warnings = [];

  if (!fs.existsSync(customizeUserRoot(repoRoot))) {
    process.stdout.write(renderTemplate("messages/check-setup-missing-root.md", {}));
    return 0;
  }

  const userRootStat = inspectPath(customizeUserRoot(repoRoot));
  if (userRootStat?.isSymbolicLink()) {
    errors.push(`${CUSTOMIZE_USER_ROOT}: expected a normal directory but found a symlink`);
  } else if (!userRootStat?.isDirectory()) {
    errors.push(`${CUSTOMIZE_USER_ROOT}: expected a directory`);
  }

  for (const entryPoint of ENTRY_POINTS) {
    const entryPath = pathFor(repoRoot, entryPoint);
    const entryStat = inspectPath(entryPath);
    if (entryStat?.isSymbolicLink()) {
      errors.push(`${CUSTOMIZE_USER_ROOT}/${entryPoint}: expected a normal directory but found a symlink`);
    } else if (entryStat && !entryStat.isDirectory()) {
      errors.push(`${CUSTOMIZE_USER_ROOT}/${entryPoint}: expected a directory`);
    }
  }

  for (const relativePath of CANONICAL_FILES) {
    const info = readFileInfo(repoRoot, relativePath);
    if (!info.exists) {
      warnings.push(`${CUSTOMIZE_USER_ROOT}/${relativePath}: missing; run the Strike init skill to create it`);
      continue;
    }
    const problem = checkFileProblem(info);
    if (problem) {
      errors.push(`${CUSTOMIZE_USER_ROOT}/${relativePath}: ${problem}`);
      continue;
    }
    if (info.bytes > FILE_MAX_BYTES) {
      errors.push(`${CUSTOMIZE_USER_ROOT}/${relativePath}: file is ${info.bytes} bytes; max is ${FILE_MAX_BYTES}`);
    }
  }

  for (const skill of SUPPORTED_SKILLS.filter(supportsReviewFiles)) {
    const lensResult = discoverReviewLensFiles(repoRoot, skill);
    for (const warning of lensResult.warnings) {
      if (reviewLensWarningIsError(warning)) {
        errors.push(warning);
      } else {
        warnings.push(warning);
      }
    }
    for (const info of lensResult.files) {
      if (info.bytes > FILE_MAX_BYTES) {
        errors.push(`${CUSTOMIZE_USER_ROOT}/${info.relativePath}: file is ${info.bytes} bytes; max is ${FILE_MAX_BYTES}`);
      }
    }
  }

  const globalInfo = readFileInfo(repoRoot, canonicalPath("global"));
  for (const skill of SUPPORTED_SKILLS) {
    const skillInfo = readFileInfo(repoRoot, skillPath(skill));
    if (!globalInfo.exists || checkFileProblem(globalInfo) || !skillInfo.exists || checkFileProblem(skillInfo)) {
      continue;
    }
    let totalBytes = globalInfo.bytes + skillInfo.bytes;
    for (const info of discoverReviewLensFiles(repoRoot, skill).files) {
      totalBytes += info.bytes;
    }
    if (totalBytes > TOTAL_MAX_BYTES) {
      errors.push(`${CUSTOMIZE_USER_ROOT}/${canonicalPath("global")} plus ${CUSTOMIZE_USER_ROOT}/${skillPath(skill)} and review lenses total ${totalBytes} bytes; max is ${TOTAL_MAX_BYTES}`);
    }
  }

  process.stdout.write(renderTemplate("messages/check-setup.md", {
    result: errors.length === 0 ? "pass" : "fail",
    errors: bulletList(errors),
    warnings: bulletList([...warnings, ...legacyAcceptCustomizationWarnings(repoRoot)]),
  }));

  return errors.length > 0 ? 1 : 0;
}

function reviewInstructionsPacket(repoRoot, target) {
  ensureSupportedReviewTarget(target);
  const loaded = [];
  const warnings = [];
  let totalBytes = 0;

  const lensWarningSkills = target === "all"
    ? SUPPORTED_SKILLS.filter(supportsReviewFiles)
    : supportsReviewFiles(target) ? [target] : [];
  for (const skill of lensWarningSkills) {
    warnings.push(...discoverReviewLensFiles(repoRoot, skill).warnings);
  }

  for (const relativePath of reviewInstructionPaths(repoRoot, target)) {
    const info = readFileInfo(repoRoot, relativePath);
    if (!info.exists) {
      warnings.push(`${CUSTOMIZE_USER_ROOT}/${relativePath}: missing; run the Strike init skill to create it`);
      continue;
    }
    const problem = checkFileProblem(info);
    if (problem) {
      warnings.push(`${CUSTOMIZE_USER_ROOT}/${relativePath}: ${problem}`);
      continue;
    }
    if (!info.hasUserContent) {
      loaded.push({ ...info, reviewStatus: "blank" });
      continue;
    }
    if (info.bytes > FILE_MAX_BYTES) {
      warnings.push(`${CUSTOMIZE_USER_ROOT}/${relativePath}: skipped because file is ${info.bytes} bytes; max is ${FILE_MAX_BYTES}`);
      continue;
    }
    if (totalBytes + info.bytes > TOTAL_MAX_BYTES) {
      warnings.push(`${CUSTOMIZE_USER_ROOT}/${relativePath}: skipped because total review content would exceed ${TOTAL_MAX_BYTES} bytes`);
      continue;
    }
    loaded.push({ ...info, reviewStatus: "loaded" });
    totalBytes += info.bytes;
  }

  const dataRecords = loaded.map((info) => JSON.stringify({
    path: `${CUSTOMIZE_USER_ROOT}/${info.relativePath}`,
    status: info.reviewStatus,
    content: info.reviewStatus === "blank" ? "" : info.normalizedContent,
  }));

  process.stdout.write(renderTemplate("messages/review.md", {
    target,
    customization_root: CUSTOMIZE_ROOT,
    included_files: bulletList(loaded.map((info) => `${CUSTOMIZE_USER_ROOT}/${info.relativePath}: ${info.reviewStatus}`)),
    warnings: bulletList(warnings),
    data_records: dataRecords.join("\n"),
  }));
}

function preview(repoRoot, skill) {
  ensureSupportedSkill(skill);
  const filesToLoad = previewPaths(repoRoot, skill);
  const loaded = [];
  const warnings = supportsReviewFiles(skill)
    ? [...discoverReviewLensFiles(repoRoot, skill).warnings]
    : [];
  let totalBytes = 0;

  for (const relativePath of filesToLoad) {
    const info = readFileInfo(repoRoot, relativePath);
    if (!info.exists) {
      continue;
    }
    const problem = skippedFileReason(info);
    if (problem) {
      warnings.push(`${CUSTOMIZE_USER_ROOT}/${relativePath}: skipped because ${problem}`);
      continue;
    }
    if (!info.hasUserContent) {
      continue;
    }
    if (info.bytes > FILE_MAX_BYTES) {
      warnings.push(`${CUSTOMIZE_USER_ROOT}/${relativePath}: skipped because file is ${info.bytes} bytes; max is ${FILE_MAX_BYTES}`);
      continue;
    }
    if (totalBytes + info.bytes > TOTAL_MAX_BYTES) {
      warnings.push(`${CUSTOMIZE_USER_ROOT}/${relativePath}: skipped because total loaded customization would exceed ${TOTAL_MAX_BYTES} bytes`);
      continue;
    }
    loaded.push(info);
    totalBytes += info.bytes;
  }

  if (loaded.length === 0 && warnings.length === 0) {
    return;
  }

  if (loaded.length === 0) {
    process.stdout.write(renderTemplate("messages/preview-warning.md", {
      skill,
      warnings: bulletList(warnings),
    }));
    return;
  }

  process.stdout.write(renderTemplate("messages/preview.md", {
    warning_block: warnings.length > 0 ? `\n## Customization Warnings\n\n${bulletList(warnings)}\n` : "",
    customization_blocks: loaded.map(customizationBlock).join("\n\n"),
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

  if (["list", "check-setup"].includes(command) && (skill || extraArgs.length > 0)) {
    throw new Error(`${command} does not accept positional arguments.\n${usage()}`);
  }
  if (command === "preview") {
    if (!skill) {
      throw new Error(`preview requires a skill.\n${usage()}`);
    }
    if (extraArgs.length > 0) {
      throw new Error(`preview accepts exactly one skill.\n${usage()}`);
    }
  }
  if (command === "review-instructions-packet") {
    if (!skill) {
      throw new Error(`review-instructions-packet requires a review target.\n${usage({ includeInternal: true })}`);
    }
    if (extraArgs.length > 0) {
      throw new Error(`review-instructions-packet accepts exactly one target.\n${usage({ includeInternal: true })}`);
    }
  }

  const repoRoot = resolveRepoRoot(options.repoRoot);
  switch (command) {
    case "list":
      list(repoRoot);
      return 0;
    case "check-setup":
      return checkSetup(repoRoot);
    case "preview":
      preview(repoRoot, skill);
      return 0;
    case "review-instructions-packet":
      reviewInstructionsPacket(repoRoot, skill);
      return 0;
    default:
      throw new Error(`Unknown command: ${command}\n${usage()}`);
  }
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
