#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT_FILE = fileURLToPath(import.meta.url);
const WORKSPACE_ROOT = "auto-strike";
const VALID_MODES = new Set(["idea", "decisions", "spec", "slice", "build", "review", "readiness"]);
const MODES_EXPECTING_SPEC = new Set(["slice", "build", "review", "readiness"]);
const MODES_EXPECTING_SLICE = new Set(["build", "review", "readiness"]);
const MODES_EXPECTING_EVIDENCE = new Set(["review", "readiness"]);
const TINY_PATH_PATTERN = /\btiny(?:\s+change)?\b/i;

const LENSES = {
  "edge-cases": {
    title: "Edge Cases",
    focus: [
      "Missing, malformed, too large, duplicate, unsupported, or hostile inputs.",
      "Empty, loading, success, failure, retry, partial, stale, and illegal states.",
      "Race conditions, idempotency, destructive actions, rollback, and safe failure modes.",
      "Which cases are built, verified, deferred, accepted, or need a user decision.",
    ],
  },
  "user-flows": {
    title: "User Stories And Flows",
    focus: [
      "Primary happy paths and first-time user flows.",
      "Returning, interrupted, resumed, invalid, duplicate, cancel, retry, and recovery flows.",
      "Whether the UI/API/CLI exposes the right state and next action.",
      "Mobile or constrained-device flows when the feature has a UI.",
    ],
  },
  "spec-coverage": {
    title: "Spec Coverage",
    focus: [
      "Whether implementation and slices match the active spec, non-goals, and success checks.",
      "Missing product rules, domain language, permissions, state rules, or failure paths.",
      "Scope drift into Soon/Later work or unapproved architecture-shaping decisions.",
      "Repo-verifiable and live/human checks that still need evidence.",
    ],
  },
  functionality: {
    title: "Functionality",
    focus: [
      "Whether the built behavior works end to end for the core MVP path.",
      "Validation, errors, recovery, persistence, integration behavior, and state transitions.",
      "Regressions in existing behavior or adjacent workflows.",
      "Gaps that block the user from running or opening the feature.",
    ],
  },
  "code-quality": {
    title: "Code Quality",
    focus: [
      "Concern boundaries between UI, API/server actions, data access, domain logic, adapters, validation, tests, and scripts.",
      "Names, module size, duplication, side effects, dependency choices, and blast radius.",
      "Environment variables, secrets, logging, observability, and maintainability.",
      "Focused tests/checks appropriate to the surfaces changed.",
    ],
  },
  accessibility: {
    title: "Accessibility And UI Quality",
    focus: [
      "Keyboard navigation, focus, labels, semantics, contrast, and visible recovery paths.",
      "Desktop/mobile layout, long text, loading, empty, success, and failure states.",
      "Whether UI text and controls match the workflow and product language.",
      "Visual regressions or layout instability that need browser evidence.",
    ],
  },
  "security-privacy": {
    title: "Security And Privacy",
    focus: [
      "Auth, permissions, ownership, cross-tenant access, and destructive behavior.",
      "Secrets handling, PII exposure, logging, retention, and compliance-sensitive choices.",
      "Input validation, hostile input, upload/media/AI risks, and data integrity boundaries.",
      "Provider, webhook, retry, idempotency, and cost/rate-limit risks when relevant.",
    ],
  },
  "integration-risk": {
    title: "Integration Risk",
    focus: [
      "External API, SDK, webhook, queue, upload, media, AI, payment, email, or analytics boundaries.",
      "Timeout, rate limit, provider outage, partial response, version mismatch, and retry behavior.",
      "Vendor-specific code isolation and replacement boundaries.",
      "Sandbox/mock/live checks and skipped-check risk.",
    ],
  },
};

const LENS_ALIASES = {
  "happy-paths": "user-flows",
  "user-stories": "user-flows",
  "failure-flows": "user-flows",
  "failure-recovery": "user-flows",
  "spec": "spec-coverage",
  "coverage": "spec-coverage",
  "quality": "code-quality",
  "a11y": "accessibility",
  "ui": "accessibility",
  "security": "security-privacy",
  "privacy": "security-privacy",
  "integrations": "integration-risk",
};

function normalizeText(value) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .trim();
}

function posix(relativePath) {
  return relativePath.split(path.sep).join("/");
}

function displayPath(filePath, repoRoot) {
  return posix(path.relative(repoRoot, filePath) || ".");
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

function readFileIfPresent(filePath) {
  try {
    const stat = fs.lstatSync(filePath);
    if (!stat.isFile()) return null;
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") return null;
    throw error;
  }
}

function inspectPath(filePath) {
  try {
    return fs.lstatSync(filePath);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") return null;
    throw error;
  }
}

function walkMarkdownFiles(rootPath, repoRoot, limit = 300) {
  const files = [];
  function walk(currentPath) {
    if (files.length >= limit) return;
    for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const absolutePath = path.join(currentPath, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        walk(absolutePath);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(displayPath(absolutePath, repoRoot));
      }
    }
  }
  walk(rootPath);
  return files.sort();
}

function listWorkspaceEntries(rootPath) {
  try {
    return fs.readdirSync(rootPath, { withFileTypes: true });
  } catch {
    return [];
  }
}

function isRecognizableWorkspace(rootPath) {
  const directMarkers = ["index.md", "todo.md", "language.md", "decisions.md"];
  if (directMarkers.some((marker) => inspectPath(path.join(rootPath, marker))?.isFile())) {
    return true;
  }
  const featuresPath = path.join(rootPath, "features");
  if (inspectPath(featuresPath)?.isDirectory()) {
    return true;
  }
  return false;
}

function workspaceOwnership(repoRoot) {
  const rootPath = path.join(repoRoot, WORKSPACE_ROOT);
  const stat = inspectPath(rootPath);
  if (!stat) {
    return {
      status: "absent",
      path: WORKSPACE_ROOT,
      recognized: false,
      reason: "Workspace does not exist.",
    };
  }
  if (stat.isSymbolicLink()) {
    return {
      status: "blocked-symlink",
      path: WORKSPACE_ROOT,
      recognized: false,
      reason: "Workspace path is a symlink.",
    };
  }
  if (!stat.isDirectory()) {
    return {
      status: "blocked-file",
      path: WORKSPACE_ROOT,
      recognized: false,
      reason: "Workspace path exists but is not a directory.",
    };
  }

  const entries = listWorkspaceEntries(rootPath);
  if (entries.length === 0) {
    return {
      status: "empty",
      path: WORKSPACE_ROOT,
      recognized: false,
      reason: "Workspace directory exists but is empty.",
    };
  }
  if (isRecognizableWorkspace(rootPath)) {
    return {
      status: "recognized",
      path: WORKSPACE_ROOT,
      recognized: true,
      reason: "Workspace contains recognizable Auto Strike files or feature layout.",
    };
  }
  return {
    status: "unrelated",
    path: WORKSPACE_ROOT,
    recognized: false,
    reason: "Workspace directory exists but does not contain recognizable Auto Strike files.",
  };
}

function extractSection(text, heading) {
  const normalized = normalizeText(text);
  const pattern = new RegExp(`^##\\s+${escapeRegExp(heading)}\\s*$`, "im");
  const match = normalized.match(pattern);
  if (!match || match.index === undefined) return "";
  const start = match.index + match[0].length;
  const rest = normalized.slice(start);
  const nextHeading = rest.search(/^##\s+/m);
  return (nextHeading === -1 ? rest : rest.slice(0, nextHeading)).trim();
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function markdownListItems(sectionText) {
  return normalizeText(sectionText)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s+/.test(line))
    .map((line) => line.replace(/^[-*]\s+/, "").trim())
    .filter(Boolean);
}

function stripMarkdownShell(value) {
  return String(value ?? "")
    .replace(/^`([^`]+)`$/, "$1")
    .replace(/^\[([^\]]+)\]\([^)]+\)$/, "$1")
    .trim();
}

function isPlaceholder(value) {
  return /[\[\]<>]/.test(String(value ?? ""));
}

function isNoneItem(value) {
  return /^none\.?$/i.test(String(value ?? "").trim());
}

function parseLabeledItem(items, label) {
  const pattern = new RegExp(`^${escapeRegExp(label)}\\s*:\\s*(.+)$`, "i");
  const item = items.find((value) => pattern.test(value));
  if (!item) return null;
  const match = item.match(pattern);
  return stripMarkdownShell(match?.[1] ?? "");
}

function parseCurrentPath(items) {
  return parseLabeledItem(items, "Current path") ?? parseLabeledItem(items, "Path");
}

function parseActiveSlice(items) {
  return parseLabeledItem(items, "Active slice") ?? parseLabeledItem(items, "Current slice");
}

function extractInlinePath(value) {
  const text = String(value ?? "").trim();
  const codeMatch = text.match(/`([^`]+)`/);
  if (codeMatch) return codeMatch[1].trim();
  const markdownLink = text.match(/\[([^\]]+)\]\([^)]+\)/);
  if (markdownLink) return markdownLink[1].trim();
  const leading = text.split(/\s+-\s+|\s+--\s+|\s+:\s+/)[0]?.trim();
  return stripMarkdownShell(leading);
}

function parseIndex(indexText) {
  if (!indexText) {
    return {
      present: false,
      activeFeatureRaw: null,
      activeFeaturePath: null,
      currentPath: null,
      currentMode: null,
      activeSliceRaw: null,
      nextBestAction: null,
      keyDocs: [],
      openDecisions: [],
      verification: [],
      projectState: "",
    };
  }

  const activeItems = markdownListItems(extractSection(indexText, "Active Feature"));
  const activeFeatureRaw = activeItems.find((item) => {
    return !/^(current mode|next best action|current path|path|active slice|current slice)\s*:/i.test(item);
  }) ?? null;
  const currentModeRaw = parseLabeledItem(activeItems, "Current mode");
  const currentMode = currentModeRaw && !isPlaceholder(currentModeRaw)
    ? currentModeRaw.toLowerCase().split(/\s+/)[0].replace(/[^a-z-]/g, "")
    : null;
  const currentPath = parseCurrentPath(activeItems);
  const activeSliceRaw = parseActiveSlice(activeItems);
  const nextBestAction = parseLabeledItem(activeItems, "Next best action");

  const keyDocs = markdownListItems(extractSection(indexText, "Key Docs"))
    .map((item) => ({
      raw: item,
      path: extractInlinePath(item),
    }))
    .filter((item) => item.path && !isPlaceholder(item.path) && !isNoneItem(item.path));

  const openDecisions = markdownListItems(extractSection(indexText, "Open Decisions"))
    .filter((item) => !isNoneItem(item) && !isPlaceholder(item));

  const verification = markdownListItems(extractSection(indexText, "Verification"))
    .filter((item) => !isPlaceholder(item) && !isNoneItem(item));

  return {
    present: true,
    activeFeatureRaw: activeFeatureRaw && !isPlaceholder(activeFeatureRaw)
      ? stripMarkdownShell(activeFeatureRaw)
      : null,
    activeFeaturePath: activeFeatureRaw && !isPlaceholder(activeFeatureRaw)
      ? extractInlinePath(activeFeatureRaw)
      : null,
    currentPath: currentPath && !isPlaceholder(currentPath) ? currentPath : null,
    currentMode,
    activeSliceRaw: activeSliceRaw && !isPlaceholder(activeSliceRaw) ? activeSliceRaw : null,
    nextBestAction: nextBestAction && !isPlaceholder(nextBestAction) ? nextBestAction : null,
    keyDocs,
    openDecisions,
    verification,
    projectState: extractSection(indexText, "Project State"),
  };
}

function parseTodo(todoText) {
  if (!todoText) {
    return {
      present: false,
      checked: 0,
      unchecked: 0,
      otherItems: 0,
      firstUnchecked: [],
      checkedItems: [],
    };
  }
  const lines = normalizeText(todoText).split("\n");
  const checkedItems = [];
  const uncheckedItems = [];
  let otherItems = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    const checkbox = trimmed.match(/^[-*]\s+\[([ xX])\]\s+(.+)$/);
    if (checkbox) {
      if (checkbox[1].trim().toLowerCase() === "x") {
        checkedItems.push(checkbox[2].trim());
      } else {
        uncheckedItems.push(checkbox[2].trim());
      }
    } else if (/^[-*]\s+/.test(trimmed)) {
      otherItems += 1;
    }
  }
  return {
    present: true,
    checked: checkedItems.length,
    unchecked: uncheckedItems.length,
    otherItems,
    firstUnchecked: uncheckedItems.slice(0, 5),
    checkedItems: checkedItems.slice(0, 10),
  };
}

function parseDecisionHeadings(decisionsText) {
  if (!decisionsText) return [];
  return [...normalizeText(decisionsText).matchAll(/^##\s+(.+)$/gm)]
    .map((match) => match[1].trim())
    .filter((heading) => heading && !isPlaceholder(heading));
}

function findEvidenceLocations(repoRoot, workspacePath, markdownFiles) {
  const locations = [];
  for (const relativePath of markdownFiles) {
    const text = readFileIfPresent(path.join(repoRoot, relativePath));
    if (!text) continue;
    if (/^##\s+Evidence\b/im.test(text) || /^Verified:\s*$/im.test(text)) {
      locations.push(relativePath);
    }
  }
  return locations;
}

function resolveWorkspacePath(repoRoot, rawPath) {
  if (!rawPath || isPlaceholder(rawPath)) return null;
  let cleaned = String(rawPath).trim().replace(/^`|`$/g, "");
  cleaned = cleaned.replace(/^\.\/+/, "");
  if (path.isAbsolute(cleaned) || cleaned.split(/[\\/]+/).includes("..")) {
    return {
      raw: rawPath,
      safe: false,
      relativePath: cleaned,
      absolutePath: null,
      exists: false,
    };
  }
  if (!cleaned.startsWith(`${WORKSPACE_ROOT}/`)) {
    if (cleaned.startsWith("features/") || cleaned.startsWith("architecture/") || cleaned.startsWith("models/")) {
      cleaned = `${WORKSPACE_ROOT}/${cleaned}`;
    } else if (!cleaned.includes("/")) {
      cleaned = `${WORKSPACE_ROOT}/features/${cleaned}`;
    }
  }
  const absolutePath = path.join(repoRoot, cleaned);
  return {
    raw: rawPath,
    safe: true,
    relativePath: posix(cleaned),
    absolutePath,
    exists: fs.existsSync(absolutePath),
  };
}

function isExplicitWorkspacePath(rawPath) {
  const value = String(rawPath ?? "").trim().replace(/^`|`$/g, "");
  return value.startsWith(WORKSPACE_ROOT) ||
    value.startsWith("features/") ||
    value.startsWith("architecture/") ||
    value.startsWith("models/") ||
    value.includes("/");
}

function activeFeatureState(repoRoot, index) {
  const resolved = resolveWorkspacePath(repoRoot, index.activeFeaturePath);
  if (!resolved || !resolved.safe || !resolved.exists || !inspectPath(resolved.absolutePath)?.isDirectory()) {
    return {
      raw: index.activeFeaturePath,
      path: null,
      inferredPath: resolved?.safe ? resolved.relativePath : null,
      exists: Boolean(resolved?.exists),
      specPath: null,
      specExists: false,
      slicesPath: null,
      sliceFiles: [],
      readinessPath: null,
      readinessExists: false,
    };
  }

  const specPath = path.join(resolved.absolutePath, "spec.md");
  const slicesPath = path.join(resolved.absolutePath, "slices");
  const readinessPath = path.join(resolved.absolutePath, "readiness.md");
  const sliceFiles = inspectPath(slicesPath)?.isDirectory()
    ? fs.readdirSync(slicesPath, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => posix(path.join(resolved.relativePath, "slices", entry.name)))
      .sort()
    : [];

  return {
    raw: index.activeFeaturePath,
    path: resolved.relativePath,
    inferredPath: resolved.relativePath,
    exists: true,
    specPath: displayPath(specPath, repoRoot),
    specExists: Boolean(inspectPath(specPath)?.isFile()),
    slicesPath: displayPath(slicesPath, repoRoot),
    sliceFiles,
    readinessPath: displayPath(readinessPath, repoRoot),
    readinessExists: Boolean(inspectPath(readinessPath)?.isFile()),
  };
}

export function inspectAutoStrike(options = {}) {
  const repoRoot = resolveRepoRoot(options.repoRoot);
  const workspacePath = path.join(repoRoot, WORKSPACE_ROOT);
  const ownership = workspaceOwnership(repoRoot);
  const markdownFiles = ownership.status === "recognized" || ownership.status === "empty"
    ? walkMarkdownFiles(workspacePath, repoRoot)
    : [];
  const indexText = readFileIfPresent(path.join(workspacePath, "index.md"));
  const todoText = readFileIfPresent(path.join(workspacePath, "todo.md"));
  const decisionsText = readFileIfPresent(path.join(workspacePath, "decisions.md"));
  const index = parseIndex(indexText);
  const todo = parseTodo(todoText);
  const activeFeature = activeFeatureState(repoRoot, index);
  const evidenceLocations = findEvidenceLocations(repoRoot, workspacePath, markdownFiles);

  return {
    repoRoot,
    workspace: ownership,
    index,
    todo,
    decisions: {
      present: Boolean(decisionsText),
      headings: parseDecisionHeadings(decisionsText),
    },
    docs: markdownFiles,
    activeFeature,
    evidence: {
      locations: evidenceLocations,
    },
  };
}

function message(severity, code, pathValue, text) {
  return {
    severity,
    code,
    path: pathValue,
    message: text,
  };
}

function keyDocMessages(repoRoot, keyDocs) {
  const messages = [];
  for (const keyDoc of keyDocs) {
    const resolved = resolveRepoReferencePath(repoRoot, keyDoc.path);
    if (!resolved?.safe) {
      messages.push(message("error", "unsafe-reference", keyDoc.path, "Key Docs contains an unsafe path reference."));
    } else if (!resolved.exists) {
      messages.push(message("error", "missing-key-doc", resolved.relativePath, "Key Docs references a path that does not exist."));
    }
  }
  return messages;
}

function resolveRepoReferencePath(repoRoot, rawPath) {
  if (!rawPath || isPlaceholder(rawPath)) return null;
  const cleaned = String(rawPath).trim().replace(/^`|`$/g, "").replace(/^\.\/+/, "");
  if (path.isAbsolute(cleaned) || cleaned.split(/[\\/]+/).includes("..")) {
    return {
      raw: rawPath,
      safe: false,
      relativePath: cleaned,
      absolutePath: null,
      exists: false,
    };
  }

  const candidates = [];
  if (cleaned.startsWith(`${WORKSPACE_ROOT}/`)) {
    candidates.push(cleaned);
  } else if (cleaned.startsWith("features/") || cleaned.startsWith("architecture/") || cleaned.startsWith("models/")) {
    candidates.push(`${WORKSPACE_ROOT}/${cleaned}`, cleaned);
  } else {
    candidates.push(cleaned);
  }

  for (const candidate of candidates) {
    const absolutePath = path.join(repoRoot, candidate);
    if (fs.existsSync(absolutePath)) {
      return {
        raw: rawPath,
        safe: true,
        relativePath: posix(candidate),
        absolutePath,
        exists: true,
      };
    }
  }

  const fallback = candidates[0];
  return {
    raw: rawPath,
    safe: true,
    relativePath: posix(fallback),
    absolutePath: path.join(repoRoot, fallback),
    exists: false,
  };
}

export function validateAutoStrike(options = {}) {
  const state = inspectAutoStrike(options);
  const messages = [];
  const { workspace, index, activeFeature } = state;
  const tinyPath = TINY_PATH_PATTERN.test(index.currentPath ?? "");

  if (workspace.status === "absent") {
    messages.push(message("note", "workspace-absent", WORKSPACE_ROOT, "Auto Strike workspace does not exist yet."));
    return { ...state, messages, summary: summarizeMessages(messages) };
  }
  if (workspace.status === "blocked-file") {
    messages.push(message("error", "workspace-blocked-file", WORKSPACE_ROOT, "Auto Strike workspace path exists but is not a directory."));
  }
  if (workspace.status === "blocked-symlink") {
    messages.push(message("error", "workspace-blocked-symlink", WORKSPACE_ROOT, "Auto Strike workspace path is a symlink."));
  }
  if (workspace.status === "unrelated") {
    messages.push(message("error", "workspace-unrelated", WORKSPACE_ROOT, "Auto Strike workspace path exists but does not look like Auto Strike state."));
  }
  if (workspace.status === "empty") {
    messages.push(message("note", "workspace-empty", WORKSPACE_ROOT, "Auto Strike workspace directory is empty."));
  }
  if (workspace.status === "recognized" && !index.present) {
    messages.push(message("warning", "missing-index", `${WORKSPACE_ROOT}/index.md`, "Recognized workspace is missing index.md resume map."));
  }

  messages.push(...keyDocMessages(state.repoRoot, index.keyDocs));

  if (index.currentMode && !VALID_MODES.has(index.currentMode)) {
    messages.push(message("warning", "unknown-mode", `${WORKSPACE_ROOT}/index.md`, `Current mode is not one of: ${[...VALID_MODES].join(", ")}.`));
  }

  if (index.activeFeaturePath && isExplicitWorkspacePath(index.activeFeaturePath)) {
    const resolved = resolveWorkspacePath(state.repoRoot, index.activeFeaturePath);
    if (!resolved?.safe) {
      messages.push(message("error", "unsafe-active-feature", index.activeFeaturePath, "Active feature path is unsafe."));
    } else if (!resolved.exists) {
      messages.push(message("error", "missing-active-feature", resolved.relativePath, "Index declares an active feature path that does not exist."));
    }
  }

  if (!tinyPath && index.currentMode && MODES_EXPECTING_SPEC.has(index.currentMode) && activeFeature.exists && !activeFeature.specExists) {
    messages.push(message("warning", "missing-active-spec", activeFeature.specPath, "Current mode usually expects an active feature spec, but none was found."));
  }

  if (!tinyPath && index.currentMode && MODES_EXPECTING_SLICE.has(index.currentMode) && activeFeature.exists && activeFeature.sliceFiles.length === 0) {
    messages.push(message("warning", "missing-active-slice", activeFeature.slicesPath, "Current mode usually expects active slice docs, but none were found."));
  }

  if (!tinyPath && index.currentMode && MODES_EXPECTING_EVIDENCE.has(index.currentMode) && state.evidence.locations.length === 0) {
    messages.push(message("warning", "missing-evidence", WORKSPACE_ROOT, "Review/readiness mode should have evidence or skipped-check rationale, but none was found."));
  }

  if (index.currentMode && ["build", "review", "readiness"].includes(index.currentMode) && index.openDecisions.length > 0) {
    messages.push(message("warning", "open-decisions-during-build", `${WORKSPACE_ROOT}/index.md`, "Open decisions remain while work is in build/review/readiness mode."));
  }

  return {
    ...state,
    messages,
    summary: summarizeMessages(messages),
  };
}

function summarizeMessages(messages) {
  return {
    errors: messages.filter((item) => item.severity === "error").length,
    warnings: messages.filter((item) => item.severity === "warning").length,
    notes: messages.filter((item) => item.severity === "note").length,
  };
}

function resolveLens(lens) {
  const normalized = String(lens ?? "").trim().toLowerCase();
  const canonical = LENSES[normalized] ? normalized : LENS_ALIASES[normalized];
  if (!canonical || !LENSES[canonical]) {
    throw new Error(`Unknown review lens: ${lens}. Supported lenses: ${Object.keys(LENSES).join(", ")}`);
  }
  return canonical;
}

export function reviewContext(options = {}) {
  const lens = resolveLens(options.lens);
  const validation = validateAutoStrike(options);
  return {
    lens,
    title: LENSES[lens].title,
    instructions: [
      "You are a review agent. Return findings to the main agent for synthesis and evaluation.",
      "Do not edit files, change scope, commit, or present conclusions directly to the user.",
      "Read the source paths before judging when they are available.",
    ],
    focus: LENSES[lens].focus,
    state: validation,
  };
}

function renderInspectMarkdown(state) {
  const lines = [
    "# Auto Strike Inspect",
    "",
    `Repo: ${state.repoRoot}`,
    `Workspace: ${state.workspace.status} - ${state.workspace.reason}`,
    "",
    "## Active",
    `- Feature: ${state.activeFeature.path ?? state.index.activeFeatureRaw ?? "None"}`,
    `- Path: ${state.index.currentPath ?? "Unknown"}`,
    `- Mode: ${state.index.currentMode ?? "Unknown"}`,
    `- Slice: ${state.index.activeSliceRaw ?? (state.activeFeature.sliceFiles[0] ?? "None")}`,
    `- Next best action declared: ${state.index.nextBestAction ?? "None"}`,
    "",
    "## Docs",
    ...bulletLines(state.docs),
    "",
    "## Decisions",
    ...bulletLines(state.index.openDecisions.length > 0 ? state.index.openDecisions : ["None open in index.md"]),
    "",
    "## Todo",
    `- Checked: ${state.todo.checked}`,
    `- Unchecked: ${state.todo.unchecked}`,
    ...state.todo.firstUnchecked.map((item) => `- Next unchecked: ${item}`),
    "",
    "## Evidence",
    ...bulletLines(state.evidence.locations),
    "",
    "## Verification",
    ...bulletLines(state.index.verification),
  ];
  return `${lines.join("\n").trimEnd()}\n`;
}

function renderValidateMarkdown(result) {
  const lines = [
    "# Auto Strike Validate",
    "",
    `Errors: ${result.summary.errors}`,
    `Warnings: ${result.summary.warnings}`,
    `Notes: ${result.summary.notes}`,
    "",
  ];
  if (result.messages.length === 0) {
    lines.push("- No issues found.");
  } else {
    for (const item of result.messages) {
      lines.push(`- ${item.severity.toUpperCase()} ${item.code} (${item.path}): ${item.message}`);
    }
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

function renderReviewContextMarkdown(packet) {
  const state = packet.state;
  const lines = [
    `# Auto Strike Review Context: ${packet.title}`,
    "",
    ...packet.instructions.map((item) => `- ${item}`),
    "",
    "## Current State",
    `- Workspace: ${state.workspace.status} - ${state.workspace.reason}`,
    `- Active feature: ${state.activeFeature.path ?? state.index.activeFeatureRaw ?? "None"}`,
    `- Current path: ${state.index.currentPath ?? "Unknown"}`,
    `- Current mode: ${state.index.currentMode ?? "Unknown"}`,
    `- Declared next best action: ${state.index.nextBestAction ?? "None"}`,
    "",
    "## Source Paths",
    ...bulletLines(compactSourcePaths(state)),
    "",
    "## Validation Findings",
    ...bulletLines(state.messages.map((item) => `${item.severity.toUpperCase()} ${item.code} (${item.path}): ${item.message}`)),
    "",
    "## Lens Focus",
    ...bulletLines(packet.focus),
    "",
    "## Return Format",
    "- Findings first, ordered by severity.",
    "- Include file/path evidence when available.",
    "- Mark non-blocking suggestions separately from blockers.",
    "- Return results to the main agent for synthesis and evaluation.",
  ];
  return `${lines.join("\n").trimEnd()}\n`;
}

function compactSourcePaths(state) {
  const paths = [
    `${WORKSPACE_ROOT}/index.md`,
    ...state.index.keyDocs.map((item) => resolveRepoReferencePath(state.repoRoot, item.path))
      .filter((item) => item?.exists)
      .map((item) => item.relativePath),
    state.activeFeature.specExists ? state.activeFeature.specPath : null,
    ...state.activeFeature.sliceFiles,
    state.activeFeature.readinessExists ? state.activeFeature.readinessPath : null,
    `${WORKSPACE_ROOT}/decisions.md`,
    `${WORKSPACE_ROOT}/language.md`,
  ].filter(Boolean);
  return [...new Set(paths)].filter((sourcePath) => {
    return state.docs.includes(sourcePath) || fs.existsSync(path.join(state.repoRoot, sourcePath));
  });
}

function bulletLines(items) {
  if (!items || items.length === 0) return ["- None"];
  return items.map((item) => `- ${item}`);
}

function parseCliArgs(argv) {
  const args = [...argv];
  let command = args.shift();
  const options = {
    repoRoot: null,
    json: false,
    lens: null,
  };

  if (command === "--help" || command === "-h") {
    command = null;
    options.help = true;
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    switch (arg) {
      case "--repo-root":
        index += 1;
        if (index >= args.length) throw new Error("--repo-root requires a value.");
        options.repoRoot = args[index];
        break;
      case "--json":
        options.json = true;
        break;
      case "--lens":
        index += 1;
        if (index >= args.length) throw new Error("--lens requires a value.");
        options.lens = args[index];
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return {
    command,
    options,
  };
}

function usage() {
  return [
    "Usage: auto-strike.mjs <inspect|validate|review-context> [--repo-root <path>] [--json]",
    "",
    "Commands:",
    "  inspect                         Report observed Auto Strike workspace state.",
    "  validate                        Warn about contradictions and missing evidence.",
    "  review-context --lens <lens>    Produce a focused review packet.",
    "",
    `Review lenses: ${Object.keys(LENSES).join(", ")}`,
  ].join("\n");
}

export function runCli(argv = process.argv.slice(2)) {
  const { command, options } = parseCliArgs(argv);
  if (!command || options.help) {
    console.log(usage());
    return 0;
  }

  if (command === "inspect") {
    const result = inspectAutoStrike(options);
    printResult(options, result, renderInspectMarkdown);
    return 0;
  }

  if (command === "validate") {
    const result = validateAutoStrike(options);
    printResult(options, result, renderValidateMarkdown);
    return result.summary.errors > 0 ? 1 : 0;
  }

  if (command === "review-context") {
    const result = reviewContext(options);
    printResult(options, result, renderReviewContextMarkdown);
    return result.state.summary.errors > 0 ? 1 : 0;
  }

  throw new Error(`Unknown command: ${command}`);
}

function printResult(options, result, markdownRenderer) {
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    process.stdout.write(markdownRenderer(result));
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_FILE) {
  try {
    process.exitCode = runCli();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
