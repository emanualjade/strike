#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT_FILE = fileURLToPath(import.meta.url);
const WORKSPACE_ROOT = "auto-strike";
const VALID_MODES = new Set(["brainstorm", "grill", "idea", "decisions", "spec", "slice", "build", "review", "readiness"]);
const MODES_EXPECTING_SPEC = new Set(["slice", "build", "review", "readiness"]);
const MODES_EXPECTING_SLICE = new Set(["build", "review", "readiness"]);
const MODES_EXPECTING_SLICE_PREP = new Set(["build", "review", "readiness"]);
const MODES_EXPECTING_EVIDENCE = new Set(["review", "readiness"]);
const MODES_REQUIRING_GRILL_CHECKPOINT = new Set(["spec", "slice", "build", "review", "readiness"]);
const VALID_DECISION_DEPTH_LEVELS = new Set(["lean", "standard", "deep"]);
const PHASE_LEDGER_ORDER = ["brainstorm", "grill", "spec", "slice", "build", "review", "validate"];
const PHASE_LEDGER_BY_MODE = {
  spec: ["brainstorm", "grill", "spec"],
  slice: ["brainstorm", "grill", "spec", "slice"],
  build: ["brainstorm", "grill", "spec", "slice", "build"],
  review: ["brainstorm", "grill", "spec", "slice", "build", "review"],
  readiness: ["brainstorm", "grill", "spec", "slice", "build", "review", "validate"],
};
const PHASE_LEDGER_COMPLETE_STATUSES = new Set(["done", "complete", "completed", "compressed", "skipped", "replaced"]);
const PHASE_LEDGER_ACTIVE_STATUSES = new Set([...PHASE_LEDGER_COMPLETE_STATUSES, "in-progress", "active", "blocked", "paused"]);
const ACTIVE_WORK_DOC_FILES = new Set([
  "idea.md",
  "grill.md",
  "spec.md",
  "feature-spec.md",
  "readiness.md",
]);
const SLICE_DOC_PATTERN = /\/slices\/slice-\d+[^/]*\.md$/i;
const SLICE_SIZE_PATTERN = /^(XS|S|M|L|XL)$/i;
const BROAD_SLICE_TITLE_PATTERN = /\b(and|full|complete|mvp)\b|setup\s+(front[- ]?end|back[- ]?end|backend|frontend)|front[- ]?end\s+(and|\/|\+|&)\s+back[- ]?end|back[- ]?end\s+(and|\/|\+|&)\s+front[- ]?end/i;
const NON_VERTICAL_SLICE_PATTERN = /\b(non[- ]vertical|foundation|migration|spike|refactor|baseline|harness|scaffold|setup)\b/i;

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
  "implementation-plan": {
    title: "Implementation Plan",
    focus: [
      "Whether slice-specific research used official docs, current repo versions, and nearby codebase precedent where needed.",
      "Whether the plan names exact files/surfaces, concern boundaries, verification commands, and rollback or recovery notes.",
      "Whether the plan is the smallest complete vertical implementation path with clear size, dependency order, working-state guarantee, and non-vertical justification when needed.",
      "Missing edge cases, UI states, data/state risks, dependencies, or integration details that should be resolved before coding.",
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
  "ui-regression": {
    title: "UI Regression",
    focus: [
      "New DOM or component structure against existing CSS selectors, inherited styles, and layout constraints.",
      "Desktop/mobile layout, long text, small containers, overflow, spacing, hit targets, and controls that collapse or overlap.",
      "Changed interaction states such as editing, disabled, loading, empty, error, success, hover, focus, and keyboard flows.",
      "Browser or user-flow evidence for UI behavior; explicit static fallback review only when host/browser access is actually blocked.",
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
  "state-data-integrity": {
    title: "State And Data Integrity",
    focus: [
      "State transitions, persistence, serialization, migrations, schema/model changes, and rollback safety.",
      "Duplicate, stale, partial, missing, concurrent, destructive, and recovery cases.",
      "Boundary validation, ownership rules, data retention, and user-visible errors for invalid state.",
      "Focused tests or checks that prove important state and data cases, not only the happy path.",
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
  "implementation": "implementation-plan",
  "plan": "implementation-plan",
  "plan-review": "implementation-plan",
  "slice-plan": "implementation-plan",
  "quality": "code-quality",
  "visual": "ui-regression",
  "visual-regression": "ui-regression",
  "frontend": "ui-regression",
  "frontend-visual": "ui-regression",
  "a11y": "accessibility",
  "ui": "accessibility",
  "security": "security-privacy",
  "privacy": "security-privacy",
  "integrations": "integration-risk",
  "data": "state-data-integrity",
  "state": "state-data-integrity",
  "persistence": "state-data-integrity",
};

const UI_EXTENSIONS = new Set([
  ".astro",
  ".css",
  ".html",
  ".jsx",
  ".less",
  ".mdx",
  ".sass",
  ".scss",
  ".svelte",
  ".tsx",
  ".vue",
]);

const UI_PATH_SEGMENTS = new Set([
  "app",
  "components",
  "layouts",
  "pages",
  "routes",
  "screens",
  "ui",
  "views",
]);

const UI_SCRIPT_EXTENSIONS = new Set([".js", ".ts"]);
const DATA_EXTENSIONS = new Set([".prisma", ".sql"]);
const DATA_PATH_PATTERN = /(^|\/)(data|database|db|migrations?|models?|repositories|schema|state|stores?|storage)(\/|$)/i;
const SECURITY_PATH_PATTERN = /(^|\/)(auth|billing|payments?|permissions?|privacy|roles?|secrets?|sessions?|stripe|tokens?)(\/|$)|(^|\/)\.env(\.|$)|(^|\/)(\.env|env)(\/|$)/i;
const INTEGRATION_PATH_PATTERN = /(^|\/)(adapters?|ai|api|clients?|email|integrations?|llm|media|payments?|providers?|queues?|server|services?|uploads?|webhooks?)(\/|$)/i;
const ROUTE_HANDLER_PATTERN = /(^|\/)(api|routes?|server|actions)(\/|$)|(^|\/)(route|handler|controller)\.[cm]?[jt]s$/i;

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
  function walk(currentDir) {
    if (files.length >= limit) return;
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const absolutePath = path.join(currentDir, entry.name);
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
  const directMarkers = ["index.md", "todo.md", "language.md"];
  if (directMarkers.some((marker) => inspectPath(path.join(rootPath, marker))?.isFile())) {
    return true;
  }
  const initiativesPath = path.join(rootPath, "initiatives");
  if (inspectPath(initiativesPath)?.isDirectory()) {
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
      reason: "Workspace contains recognizable Auto Strike files or initiative layout.",
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

function hasSection(text, heading) {
  const pattern = new RegExp(`^##\\s+${escapeRegExp(heading)}\\s*$`, "im");
  return pattern.test(normalizeText(text));
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

function stripInlineMarkdownReferences(value) {
  return String(value ?? "")
    .replace(/`[^`]*`/g, "")
    .replace(/\[[^\]]+\]\([^)]+\)/g, "");
}

function isPlaceholder(value) {
  const text = String(value ?? "").trim();
  if (!text) return false;
  const withoutLinks = stripInlineMarkdownReferences(text);
  if (/^\[(?![ xX]\])[^]\n]+\]$/.test(withoutLinks)) return true;
  if (/^<[^>\n]+>$/.test(withoutLinks)) return true;
  return /(^|[\s/])\[(?![ xX]\])[^]\n]{2,}\](?=$|[\s/.:_-])/i.test(withoutLinks) ||
    /(^|[\s/])<[^>\n]{2,}>(?=$|[\s/.:_-])/i.test(withoutLinks);
}

function isNoneItem(value) {
  return /^none\.?$/i.test(String(value ?? "").trim());
}

function parseLabeledItems(items, label) {
  const pattern = new RegExp(`^${escapeRegExp(label)}\\s*:\\s*(.+)$`, "i");
  return items
    .map((value) => value.match(pattern))
    .filter(Boolean)
    .map((match) => stripMarkdownShell(match?.[1] ?? ""))
    .filter(Boolean);
}

function parseLabeledItem(items, label) {
  const values = parseLabeledItems(items, label);
  const useful = values.map(usefulValue).filter(Boolean);
  return useful.at(-1) ?? values.at(-1) ?? null;
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

function usefulValue(value) {
  if (!value || isPlaceholder(value) || isNoneItem(value)) return null;
  return value;
}

function parseActiveWork(indexText) {
  const text = extractSection(indexText, "Active Work");
  const items = markdownListItems(text);
  const duplicateLabels = ["Initiative", "Feature", "Doc", "Slice", "Active slice", "Current slice", "Current mode", "Mode", "State", "Next", "Blocked by"]
    .filter((label) => parseLabeledItems(items, label).length > 1);
  const initiativeRaw = usefulValue(parseLabeledItem(items, "Initiative"));
  const featureRaw = usefulValue(parseLabeledItem(items, "Feature"));
  const docRaw = usefulValue(parseLabeledItem(items, "Doc"));
  const sliceRaw = usefulValue(parseLabeledItem(items, "Slice")) ?? parseActiveSlice(items);
  const currentModeRaw = usefulValue(parseLabeledItem(items, "Current mode")) ?? usefulValue(parseLabeledItem(items, "Mode"));
  const state = usefulValue(parseLabeledItem(items, "State"));
  const next = usefulValue(parseLabeledItem(items, "Next"));
  const blockedBy = usefulValue(parseLabeledItem(items, "Blocked by"));
  return {
    text,
    initiativeRaw,
    initiativePath: initiativeRaw ? extractInlinePath(initiativeRaw) : null,
    featureRaw,
    featurePath: featureRaw ? extractInlinePath(featureRaw) : null,
    docRaw,
    docPath: docRaw ? extractInlinePath(docRaw) : null,
    sliceRaw,
    slicePath: sliceRaw ? extractInlinePath(sliceRaw) : null,
    currentModeRaw,
    state,
    next,
    blockedBy,
    duplicateLabels,
  };
}

function modeFromActiveDoc(docPath) {
  if (!docPath || isPlaceholder(docPath)) return null;
  const normalized = normalizeEvidencePath(docPath);
  const basename = path.posix.basename(normalized).toLowerCase();
  if (basename === "idea.md") return "brainstorm";
  if (basename === "grill.md") return "grill";
  if (basename === "readiness.md") return "readiness";
  if (normalized.endsWith("/slices/index.md")) return "slice";
  if (SLICE_DOC_PATTERN.test(normalized)) return "build";
  if (basename === "spec.md" || basename === "feature-spec.md") return "spec";
  return null;
}

function parseIndex(indexText) {
  if (!indexText) {
    return {
      present: false,
      activeInitiativeRaw: null,
      activeInitiativePath: null,
      activeFeatureRaw: null,
      activeFeaturePath: null,
      currentMode: null,
      currentModeExplicit: false,
      activeSliceRaw: null,
      activeWork: {
        text: "",
        initiativeRaw: null,
        initiativePath: null,
        featureRaw: null,
        featurePath: null,
        docRaw: null,
        docPath: null,
        sliceRaw: null,
        slicePath: null,
        currentModeRaw: null,
        state: null,
        next: null,
        blockedBy: null,
        duplicateLabels: [],
      },
      nextBestAction: null,
      keyDocs: [],
      openDecisions: [],
      verification: [],
      projectState: "",
    };
  }

  const activeWork = parseActiveWork(indexText);
  const currentModeRaw = activeWork.currentModeRaw;
  const currentModeExplicit = Boolean(currentModeRaw && !isPlaceholder(currentModeRaw));
  const currentMode = currentModeRaw && !isPlaceholder(currentModeRaw)
    ? currentModeRaw.toLowerCase().split(/\s+/)[0].replace(/[^a-z-]/g, "")
    : modeFromActiveDoc(activeWork.docPath);
  const activeSliceRaw = activeWork.slicePath ??
    (activeWork.docPath && SLICE_DOC_PATTERN.test(activeWork.docPath) ? activeWork.docPath : null);

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
    activeInitiativeRaw: activeWork.initiativeRaw,
    activeInitiativePath: activeWork.initiativePath,
    activeFeatureRaw: activeWork.featureRaw,
    activeFeaturePath: activeWork.featurePath,
    currentMode,
    currentModeExplicit,
    activeSliceRaw: activeSliceRaw && !isPlaceholder(activeSliceRaw) ? activeSliceRaw : null,
    activeWork,
    nextBestAction: activeWork.next,
    keyDocs,
    openDecisions,
    verification,
    projectState: extractSection(indexText, "Project State"),
  };
}

function parseTableCells(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return null;
  const cells = trimmed
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => stripMarkdownShell(cell.trim()));
  if (cells.length < 4) return null;
  if (cells.every((cell) => /^:?-{3,}:?$/.test(cell))) return null;
  if (/^phase$/i.test(cells[0])) return null;
  return cells;
}

function normalizeLedgerPhase(value) {
  const text = stripMarkdownShell(value)
    .toLowerCase()
    .replace(/[^a-z]+/g, " ")
    .trim();
  if (!text) return null;
  if (/\bbrainstorm\b|\bidea\b/.test(text)) return "brainstorm";
  if (/\bgrill\b|\bpressure test\b/.test(text)) return "grill";
  if (/\bspec\b|\bspecification\b/.test(text)) return "spec";
  if (/\bslice\b|\bslicing\b/.test(text)) return "slice";
  if (/\bbuild\b|\bimplement\b|\bimplementation\b/.test(text)) return "build";
  if (/\breview\b|\breviewer\b/.test(text)) return "review";
  if (/\bvalidate\b|\bvalidation\b|\bverify\b|\bverification\b|\breadiness\b/.test(text)) return "validate";
  return null;
}

function normalizeLedgerStatus(value) {
  const text = stripMarkdownShell(value)
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return null;
  if (/^(in[- ]?progress|active|doing|started|current)\b/.test(text)) return "in-progress";
  if (/^(done|complete|completed|passed)\b/.test(text)) return "done";
  if (/^compress(?:ed)?\b/.test(text)) return "compressed";
  if (/^skipp?ed\b/.test(text)) return "skipped";
  if (/^replaced\b/.test(text)) return "replaced";
  if (/^block(?:ed)?\b/.test(text)) return "blocked";
  if (/^paus(?:ed)?\b/.test(text)) return "paused";
  if (/^pending\b/.test(text)) return "pending";
  return text;
}

function phaseLedgerRowRank(row) {
  if (!row?.status || row.status === "pending") return 0;
  if (["blocked", "paused"].includes(row.status)) return 1;
  if (row.status === "in-progress" || PHASE_LEDGER_COMPLETE_STATUSES.has(row.status)) return 2;
  return 1;
}

function choosePhaseLedgerRow(previous, next) {
  if (!previous) return next;
  const previousRank = phaseLedgerRowRank(previous);
  const nextRank = phaseLedgerRowRank(next);
  if (nextRank > previousRank) return next;
  if (nextRank < previousRank) return previous;
  return next;
}

function parsePhaseLedger(sectionText) {
  const rows = new Map();
  const occurrences = new Map();
  for (const line of normalizeText(sectionText).split("\n")) {
    const cells = parseTableCells(line);
    if (!cells) continue;
    const phase = normalizeLedgerPhase(cells[0]);
    if (!phase || !PHASE_LEDGER_ORDER.includes(phase)) continue;
    const row = {
      phase,
      statusRaw: cells[1] ?? "",
      status: normalizeLedgerStatus(cells[1] ?? ""),
      artifact: cells[2] ?? "",
      reason: cells.slice(3).join(" | "),
      raw: line.trim(),
    };
    rows.set(phase, choosePhaseLedgerRow(rows.get(phase), row));
    occurrences.set(phase, [...(occurrences.get(phase) ?? []), row]);
  }
  const duplicates = Object.fromEntries(
    [...occurrences.entries()]
      .filter(([, phaseRows]) => phaseRows.length > 1)
      .map(([phase, phaseRows]) => [phase, phaseRows.map((row) => row.raw)]),
  );
  return { rows, duplicates };
}

function findPhaseLedger(repoRoot, indexText, markdownFiles, activeInitiative) {
  const candidates = [];
  if (activeInitiative.path) {
    candidates.push(`${activeInitiative.path}/idea.md`);
    candidates.push(`${activeInitiative.path}/spec.md`);
    candidates.push(`${activeInitiative.path}/grill.md`);
  }
  candidates.push(`${WORKSPACE_ROOT}/index.md`);
  if (activeInitiative.path) {
    candidates.push(...markdownFiles.filter((sourcePath) => sourcePath.startsWith(`${activeInitiative.path}/`)));
  }

  for (const candidate of [...new Set(candidates)]) {
    const text = candidate === `${WORKSPACE_ROOT}/index.md`
      ? indexText
      : readFileIfPresent(path.join(repoRoot, candidate));
    if (!text) continue;
    const section = extractSection(text, "Phase Ledger");
    if (!sectionHasSubstance(section)) continue;
    const phaseLedger = parsePhaseLedger(section);
    return {
      present: true,
      path: candidate,
      rows: Object.fromEntries(phaseLedger.rows),
      duplicates: phaseLedger.duplicates,
    };
  }

  return {
    present: false,
    path: activeInitiative.ideaPath ?? activeInitiative.path ?? `${WORKSPACE_ROOT}/index.md`,
    rows: {},
    duplicates: {},
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

function evidenceSectionLines(repoRoot, relativePath) {
  const text = readFileIfPresent(path.join(repoRoot, relativePath));
  if (!text) return [];
  const evidence = extractSection(text, "Evidence");
  return normalizeText(evidence || text).split("\n");
}

function evidenceListItems(repoRoot, evidenceLocations, labels) {
  const items = [];
  const labelPattern = new RegExp(`^(${labels.map(escapeRegExp).join("|")})\\s*:\\s*(.*)$`, "i");
  for (const relativePath of evidenceLocations) {
    let inList = false;
    for (const line of evidenceSectionLines(repoRoot, relativePath)) {
      const trimmed = line.trim();
      const label = trimmed.match(labelPattern);
      if (label) {
        inList = true;
        for (const value of label[2].split(",")) {
          const item = value.trim();
          if (item) items.push(item);
        }
        continue;
      }
      if (/^[A-Z][A-Za-z /-]{0,40}:\s*$/.test(trimmed)) {
        inList = false;
        continue;
      }
      if (!inList) continue;
      const bullet = trimmed.match(/^[-*]\s+(.+)$/);
      if (bullet) {
        items.push(bullet[1].trim());
      }
    }
  }
  return [...new Set(items)];
}

function evidenceChangedPaths(repoRoot, evidenceLocations) {
  const changedPaths = [];
  for (const item of evidenceListItems(repoRoot, evidenceLocations, ["changed", "files changed", "modified", "touched"])) {
    addChangedPath(repoRoot, changedPaths, item);
  }
  return [...new Set(changedPaths)];
}

function evidenceVerifiedItems(repoRoot, evidenceLocations) {
  return evidenceListItems(repoRoot, evidenceLocations, ["verified", "verification", "checks"]);
}

function evidenceReviewedItems(repoRoot, evidenceLocations) {
  return evidenceListItems(repoRoot, evidenceLocations, ["reviewed", "review lenses", "reviews"]);
}

function evidenceSkippedItems(repoRoot, evidenceLocations) {
  return evidenceListItems(repoRoot, evidenceLocations, ["skipped", "skipped checks", "not run"]);
}

function addChangedPath(repoRoot, changedPaths, value) {
  const candidate = extractInlinePath(value);
  if (!candidate || isPlaceholder(candidate) || isNoneItem(candidate)) return;
  const resolved = resolveRepoReferencePath(repoRoot, candidate);
  if (resolved?.safe) {
    changedPaths.push(resolved.relativePath);
  }
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
    if (cleaned.startsWith("initiatives/") || cleaned.startsWith("research/") || cleaned.startsWith("extras/")) {
      cleaned = `${WORKSPACE_ROOT}/${cleaned}`;
    } else if (!cleaned.includes("/")) {
      cleaned = `${WORKSPACE_ROOT}/initiatives/${cleaned}`;
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
    value.startsWith("initiatives/") ||
    value.startsWith("research/") ||
    value.startsWith("extras/") ||
    value.includes("/");
}

function isInitiativePath(sourcePath) {
  return new RegExp(`^${escapeRegExp(WORKSPACE_ROOT)}/initiatives/[^/]+$`).test(normalizeEvidencePath(sourcePath));
}

function isFeaturePath(sourcePath) {
  return new RegExp(`^${escapeRegExp(WORKSPACE_ROOT)}/initiatives/[^/]+/features/[^/]+$`).test(normalizeEvidencePath(sourcePath));
}

function isFeatureShorthand(sourcePath) {
  const value = String(sourcePath ?? "").trim().replace(/^`|`$/g, "");
  return Boolean(value) && !value.includes("/") && !isPlaceholder(value) && !isNoneItem(value);
}

function inferInitiativePath(index) {
  const candidates = [
    index.activeInitiativePath,
    index.activeFeaturePath,
    index.activeWork?.docPath,
    index.activeSliceRaw,
  ].filter(Boolean).map(normalizeEvidencePath);
  for (const candidate of candidates) {
    const match = candidate.match(new RegExp(`^${escapeRegExp(WORKSPACE_ROOT)}/initiatives/[^/]+`));
    if (match) return match[0];
  }
  return null;
}

function activeInitiativeState(repoRoot, index) {
  const resolved = resolveWorkspacePath(repoRoot, index.activeInitiativePath ?? inferInitiativePath(index));
  if (!resolved || !resolved.safe || !resolved.exists || !inspectPath(resolved.absolutePath)?.isDirectory()) {
    return {
      raw: index.activeInitiativePath,
      path: null,
      inferredPath: resolved?.safe ? resolved.relativePath : null,
      exists: Boolean(resolved?.exists),
      ideaPath: null,
      ideaExists: false,
      decisionsPath: null,
      decisionsExists: false,
      grillPath: null,
      grillExists: false,
      specPath: null,
      specExists: false,
      featuresPath: null,
      featureDirs: [],
      readinessPath: null,
      readinessExists: false,
    };
  }

  const ideaPath = path.join(resolved.absolutePath, "idea.md");
  const decisionsPath = path.join(resolved.absolutePath, "decisions.md");
  const grillPath = path.join(resolved.absolutePath, "grill.md");
  const specPath = path.join(resolved.absolutePath, "spec.md");
  const featuresPath = path.join(resolved.absolutePath, "features");
  const readinessPath = path.join(resolved.absolutePath, "readiness.md");
  const featureDirs = inspectPath(featuresPath)?.isDirectory()
    ? fs.readdirSync(featuresPath, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => posix(path.join(resolved.relativePath, "features", entry.name)))
      .sort()
    : [];

  return {
    raw: index.activeInitiativePath,
    path: resolved.relativePath,
    inferredPath: resolved.relativePath,
    exists: true,
    ideaPath: displayPath(ideaPath, repoRoot),
    ideaExists: Boolean(inspectPath(ideaPath)?.isFile()),
    decisionsPath: displayPath(decisionsPath, repoRoot),
    decisionsExists: Boolean(inspectPath(decisionsPath)?.isFile()),
    grillPath: displayPath(grillPath, repoRoot),
    grillExists: Boolean(inspectPath(grillPath)?.isFile()),
    specPath: displayPath(specPath, repoRoot),
    specExists: Boolean(inspectPath(specPath)?.isFile()),
    featuresPath: displayPath(featuresPath, repoRoot),
    featureDirs,
    readinessPath: displayPath(readinessPath, repoRoot),
    readinessExists: Boolean(inspectPath(readinessPath)?.isFile()),
  };
}

function resolveActiveFeaturePath(repoRoot, rawPath, activeInitiative) {
  if (!rawPath || isPlaceholder(rawPath) || isNoneItem(rawPath)) return null;
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
  if (!cleaned.includes("/") && activeInitiative.path) {
    const relativePath = posix(path.join(activeInitiative.path, "features", cleaned));
    return {
      raw: rawPath,
      safe: true,
      relativePath,
      absolutePath: path.join(repoRoot, relativePath),
      exists: fs.existsSync(path.join(repoRoot, relativePath)),
    };
  }
  return resolveWorkspacePath(repoRoot, cleaned);
}

function activeFeatureState(repoRoot, index, activeInitiative) {
  const resolved = resolveActiveFeaturePath(repoRoot, index.activeFeaturePath, activeInitiative);
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

  const specPath = path.join(resolved.absolutePath, "feature-spec.md");
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

function activeSliceState(repoRoot, index, activeFeature) {
  const raw = index.activeSliceRaw;
  if (!raw || isPlaceholder(raw)) {
    return {
      raw: null,
      path: null,
      exists: false,
    };
  }

  const direct = resolveRepoReferencePath(repoRoot, extractInlinePath(raw));
  if (direct?.safe && inspectPath(direct.absolutePath)?.isFile()) {
    return {
      raw,
      path: direct.relativePath,
      exists: true,
    };
  }

  const cleaned = String(raw).trim().replace(/^`|`$/g, "").replace(/^\.\/+/, "");
  if (activeFeature.path && !cleaned.includes("/")) {
    const relativePath = posix(path.join(activeFeature.path, "slices", cleaned));
    const absolutePath = path.join(repoRoot, relativePath);
    return {
      raw,
      path: relativePath,
      exists: Boolean(inspectPath(absolutePath)?.isFile()),
    };
  }

  return {
    raw,
    path: direct?.safe ? direct.relativePath : cleaned,
    exists: Boolean(direct?.exists),
  };
}

function activeFeatureSliceDocs(activeFeature) {
  return activeFeature.sliceFiles.filter((sourcePath) => SLICE_DOC_PATTERN.test(sourcePath));
}

function activeFeatureSliceIndexPath(activeFeature) {
  return activeFeature.path ? `${activeFeature.path}/slices/index.md` : null;
}

function featureStateFromPath(repoRoot, featurePath, raw = featurePath) {
  const normalized = normalizeEvidencePath(featurePath);
  const absolutePath = path.join(repoRoot, normalized);
  if (!isFeaturePath(normalized) || !inspectPath(absolutePath)?.isDirectory()) return null;
  const specPath = path.join(absolutePath, "feature-spec.md");
  const slicesPath = path.join(absolutePath, "slices");
  const readinessPath = path.join(absolutePath, "readiness.md");
  const sliceFiles = inspectPath(slicesPath)?.isDirectory()
    ? fs.readdirSync(slicesPath, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => posix(path.join(normalized, "slices", entry.name)))
      .sort()
    : [];
  return {
    raw,
    path: normalized,
    inferredPath: normalized,
    exists: true,
    specPath: displayPath(specPath, repoRoot),
    specExists: Boolean(inspectPath(specPath)?.isFile()),
    slicesPath: displayPath(slicesPath, repoRoot),
    sliceFiles,
    readinessPath: displayPath(readinessPath, repoRoot),
    readinessExists: Boolean(inspectPath(readinessPath)?.isFile()),
  };
}

function inferredFeatureFromActiveSlice(repoRoot, activeSlice) {
  if (!activeSlice.path) return null;
  const normalized = normalizeEvidencePath(activeSlice.path);
  const match = normalized.match(new RegExp(`^(${escapeRegExp(WORKSPACE_ROOT)}/initiatives/[^/]+/features/[^/]+)/slices/slice-\\d+[^/]*\\.md$`, "i"));
  return match ? featureStateFromPath(repoRoot, match[1]) : null;
}

function selectReviewEvidenceLocations(evidenceLocations, activeInitiative, activeFeature, activeSlice) {
  if (activeSlice.path && evidenceLocations.includes(activeSlice.path)) {
    return {
      scope: "active-slice",
      usedFallback: false,
      locations: [activeSlice.path],
    };
  }

  if (activeFeature.path) {
    const featurePrefix = `${activeFeature.path}/`;
    const featureLocations = evidenceLocations.filter((relativePath) => {
      return relativePath === activeFeature.path || relativePath.startsWith(featurePrefix);
    });
    if (featureLocations.length > 0) {
      return {
        scope: "active-feature",
        usedFallback: Boolean(activeSlice.path),
        locations: featureLocations,
      };
    }
  }

  if (activeInitiative.path) {
    const initiativePrefix = `${activeInitiative.path}/`;
    const initiativeLocations = evidenceLocations.filter((relativePath) => {
      return relativePath === activeInitiative.path || relativePath.startsWith(initiativePrefix);
    });
    if (initiativeLocations.length > 0) {
      return {
        scope: "active-initiative",
        usedFallback: Boolean(activeSlice.path || activeFeature.path),
        locations: initiativeLocations,
      };
    }
  }

  return {
    scope: "workspace",
    usedFallback: true,
    locations: evidenceLocations,
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
  const languagePath = path.join(workspacePath, "language.md");
  const languageText = readFileIfPresent(languagePath);
  const index = parseIndex(indexText);
  const todo = parseTodo(todoText);
  const activeInitiative = activeInitiativeState(repoRoot, index);
  const activeFeature = activeFeatureState(repoRoot, index, activeInitiative);
  const activeSlice = activeSliceState(repoRoot, index, activeFeature);
  const phaseLedger = findPhaseLedger(repoRoot, indexText, markdownFiles, activeInitiative);
  const initiativeDecisionsText = activeInitiative.decisionsPath
    ? readFileIfPresent(path.join(repoRoot, activeInitiative.decisionsPath))
    : null;
  const evidenceLocations = findEvidenceLocations(repoRoot, workspacePath, markdownFiles);
  const changedPaths = evidenceChangedPaths(repoRoot, evidenceLocations);
  const reviewEvidence = selectReviewEvidenceLocations(evidenceLocations, activeInitiative, activeFeature, activeSlice);
  const reviewChangedPaths = evidenceChangedPaths(repoRoot, reviewEvidence.locations);
  const reviewVerifiedItems = evidenceVerifiedItems(repoRoot, reviewEvidence.locations);
  const reviewReviewedItems = evidenceReviewedItems(repoRoot, reviewEvidence.locations);
  const reviewSkippedItems = evidenceSkippedItems(repoRoot, reviewEvidence.locations);

  return {
    repoRoot,
    workspace: ownership,
    index,
    todo,
    language: {
      present: Boolean(languageText),
      path: `${WORKSPACE_ROOT}/language.md`,
      headings: parseDecisionHeadings(languageText),
      substantive: markdownDocHasSubstance(languageText),
    },
    decisions: {
      present: Boolean(initiativeDecisionsText),
      path: activeInitiative.decisionsPath,
      headings: parseDecisionHeadings(initiativeDecisionsText),
      substantive: markdownDocHasSubstance(initiativeDecisionsText),
    },
    docs: markdownFiles,
    activeInitiative,
    activeFeature,
    activeSlice,
    phaseLedger,
    evidence: {
      locations: evidenceLocations,
      changedPaths,
      verifiedItems: evidenceVerifiedItems(repoRoot, evidenceLocations),
      reviewedItems: evidenceReviewedItems(repoRoot, evidenceLocations),
      skippedItems: evidenceSkippedItems(repoRoot, evidenceLocations),
      reviewScope: {
        ...reviewEvidence,
        changedPaths: reviewChangedPaths,
        verifiedItems: reviewVerifiedItems,
        reviewedItems: reviewReviewedItems,
        skippedItems: reviewSkippedItems,
      },
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

function runGitLines(repoRoot, args) {
  try {
    const output = execFileSync("git", ["-C", repoRoot, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return null;
  }
}

function gitRoot(repoRoot) {
  const lines = runGitLines(repoRoot, ["rev-parse", "--show-toplevel"]);
  if (!lines || lines.length === 0) return null;
  return fs.realpathSync(lines[0]);
}

function repoRelativeGitPath(repoRoot, gitRootPath, gitRelativePath) {
  const absolutePath = path.resolve(gitRootPath, gitRelativePath);
  const relativePath = path.relative(repoRoot, absolutePath);
  if (!relativePath || relativePath.startsWith("..") || path.isAbsolute(relativePath)) return null;
  return posix(relativePath);
}

function gitChangedPaths(repoRoot) {
  const rootPath = gitRoot(repoRoot);
  if (!rootPath) {
    return {
      available: false,
      paths: [],
    };
  }

  const paths = new Set();
  const commands = [
    ["diff", "--name-only", "--diff-filter=ACDMRTUXB"],
    ["diff", "--cached", "--name-only", "--diff-filter=ACDMRTUXB"],
    ["ls-files", "--others", "--exclude-standard"],
  ];

  for (const args of commands) {
    const lines = runGitLines(rootPath, args) ?? [];
    for (const line of lines) {
      const relativePath = repoRelativeGitPath(repoRoot, rootPath, line);
      if (relativePath && isImplementationPath(relativePath)) {
        paths.add(relativePath);
      }
    }
  }

  return {
    available: true,
    paths: [...paths].sort(),
  };
}

function normalizeEvidencePath(sourcePath) {
  return posix(String(sourcePath ?? "").replace(/^\.\/+/, "").replace(/\/+$/, ""));
}

function evidenceCoversGitPath(evidencePath, gitPath) {
  const normalizedEvidence = normalizeEvidencePath(evidencePath);
  const normalizedGit = normalizeEvidencePath(gitPath);
  return normalizedEvidence === normalizedGit || normalizedGit.startsWith(`${normalizedEvidence}/`);
}

function changedEvidenceDriftMessages(state) {
  const reviewScope = state.evidence.reviewScope;
  if (reviewScope.changedPaths.length === 0) return [];

  const gitState = gitChangedPaths(state.repoRoot);
  if (!gitState.available) return [];

  const evidencePaths = reviewScope.changedPaths
    .filter(isImplementationPath)
    .map(normalizeEvidencePath);
  const messagePath = reviewScope.locations[0] ?? WORKSPACE_ROOT;
  const messages = [];
  const missingFromEvidence = gitState.paths.filter((gitPath) => {
    return !evidencePaths.some((evidencePath) => evidenceCoversGitPath(evidencePath, gitPath));
  });
  if (missingFromEvidence.length > 0) {
    messages.push(message("warning", "changed-evidence-may-be-stale", messagePath, `Git reports changed implementation files not listed in active Changed evidence. Confirm they are unrelated user work or update Changed before review: ${missingFromEvidence.slice(0, 8).join(", ")}${missingFromEvidence.length > 8 ? ", ..." : ""}`));
  }

  const gitPathSet = new Set(gitState.paths);
  const unresolvedEvidence = evidencePaths.filter((sourcePath) => {
    return !fs.existsSync(path.join(state.repoRoot, sourcePath)) &&
      !gitPathSet.has(sourcePath);
  });
  if (unresolvedEvidence.length > 0) {
    messages.push(message("warning", "stale-changed-evidence-path", messagePath, `Active Changed evidence references implementation paths that do not exist and are not reported by Git as changed: ${unresolvedEvidence.slice(0, 8).join(", ")}${unresolvedEvidence.length > 8 ? ", ..." : ""}`));
  }

  return messages;
}

function sectionHasSubstance(sectionText) {
  const lines = normalizeText(sectionText)
    .split("\n")
    .map((line) => line
      .replace(/^[-*]\s+/, "")
      .replace(/^\d+\.\s+/, "")
      .replace(/^\[[ xX]\]\s+/, "")
      .replace(/^`|`$/g, "")
      .trim())
    .filter(Boolean);

  if (lines.length === 0) return false;
  return lines.some((line) => {
    const stripped = line
      .replace(/[.[\]()`*_:-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!stripped) return false;
    return !/^(todo|tbd|pending|pending review|none|n\/a|na|not yet|not started|placeholder|fill in|to be added|draft)$/i.test(stripped);
  });
}

function markdownDocHasSubstance(markdownText) {
  const body = normalizeText(markdownText)
    .split("\n")
    .filter((line) => !/^\s*#{1,6}\s+/.test(line))
    .filter((line) => !/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(line))
    .join("\n");
  return sectionHasSubstance(body);
}

function planNamesSurface(planText) {
  return /`?[\w.-]+\/[\w./-]+\.[A-Za-z0-9]+`?/.test(planText) ||
    /\b(file|files|surface|surfaces|route|routes|component|components|module|modules|script|scripts|page|pages|handler|handlers|endpoint|endpoints|schema|model|models)\b/i.test(planText);
}

function planNamesVerification(planText) {
  return /\b(verify|verified|verification|test|tests|check|checks|smoke|lint|build|browser|visual|run|pnpm|node|pytest|cargo|go test)\b/i.test(planText);
}

function planReviewHasOutcome(planReviewText) {
  return /\b(pass|passed|blocker|blockers|warning|warnings|finding|findings|accepted|approved|skip|skipped|review|reviewed|reviewer|no blockers?|fixed|resolved)\b/i.test(planReviewText);
}

function sliceTitle(sliceText) {
  const match = normalizeText(sliceText).match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "";
}

function firstMeaningfulLine(sectionText) {
  return normalizeText(sectionText)
    .split("\n")
    .map((line) => line
      .replace(/^[-*]\s+/, "")
      .replace(/^\[[ xX]\]\s+/, "")
      .replace(/^Size\s*:\s*/i, "")
      .trim())
    .find(Boolean) ?? "";
}

function sliceSize(sliceText) {
  const sizeSection = extractSection(sliceText, "Size");
  const fromSection = firstMeaningfulLine(sizeSection).match(SLICE_SIZE_PATTERN);
  if (fromSection) return fromSection[1].toUpperCase();
  const inline = normalizeText(sliceText).match(/^[-*]\s+Size\s*:\s*(XS|S|M|L|XL)\b/im);
  return inline ? inline[1].toUpperCase() : null;
}

function countSectionItems(sectionText) {
  const items = markdownListItems(sectionText);
  if (items.length > 0) return items.length;
  return normalizeText(sectionText)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !isPlaceholder(line) && !isNoneItem(line)).length;
}

function acceptanceCriteriaCount(sliceText) {
  if (!hasSection(sliceText, "Acceptance Criteria")) return 0;
  return countSectionItems(extractSection(sliceText, "Acceptance Criteria"));
}

function checkboxCount(sectionText) {
  return normalizeText(sectionText)
    .split("\n")
    .filter((line) => /^[-*]\s+\[[ xX]\]\s+/.test(line.trim()))
    .length;
}

function executionTasksAreValid(sliceText) {
  if (!hasSection(sliceText, "Execution Tasks")) return false;
  const tasks = extractSection(sliceText, "Execution Tasks");
  return checkboxCount(tasks) >= 4 &&
    /\b(research|docs?|precedent|patterns?)\b/i.test(tasks) &&
    /\bplan\b/i.test(tasks) &&
    /\breview(?:er|ed|ing)?\b/i.test(tasks) &&
    /\b(verify|verification|test|tests|checks?|browser|user-flow)\b/i.test(tasks);
}

function likelySurfaceCount(sliceText) {
  if (!hasSection(sliceText, "Likely Surfaces")) return 0;
  const section = extractSection(sliceText, "Likely Surfaces");
  const itemCount = countSectionItems(section);
  const backtickPathCount = new Set(
    [...section.matchAll(/`([^`]+\.[A-Za-z0-9]+)`/g)]
      .map((match) => match[1])
      .filter((sourcePath) => !isPlaceholder(sourcePath) && !isNoneItem(sourcePath)),
  ).size;
  return Math.max(itemCount, backtickPathCount);
}

function sectionHasExplicitNone(sectionText) {
  return normalizeText(sectionText)
    .split(/\n|,/)
    .map((item) => item.replace(/^[-*]\s+/, "").replace(/^\[[ xX]\]\s+/, "").trim())
    .some(isNoneItem);
}

function sectionHasWeakPlanningText(sectionText) {
  const text = normalizeText(sectionText);
  return !text ||
    isPlaceholder(stripInlineMarkdownReferences(text)) ||
    /\b(todo|tbd|pending|not yet|not started|placeholder|fill in|unknown|unclear)\b/i.test(text);
}

function dependencySectionIsValid(sliceText) {
  if (!hasSection(sliceText, "Depends On")) return false;
  const dependsOn = extractSection(sliceText, "Depends On");
  if (sectionHasExplicitNone(dependsOn)) return true;
  return sectionHasSubstance(dependsOn) && !sectionHasWeakPlanningText(dependsOn);
}

function needsNonVerticalJustification(sliceText, title) {
  return hasSection(sliceText, "Non-Vertical Justification") ||
    /\bnon[- ]vertical\b/i.test(sliceText) ||
    NON_VERTICAL_SLICE_PATTERN.test(title);
}

function nonVerticalJustificationIsValid(sliceText) {
  if (!hasSection(sliceText, "Non-Vertical Justification")) return false;
  const justification = extractSection(sliceText, "Non-Vertical Justification");
  return sectionHasSubstance(justification) &&
    !sectionHasWeakPlanningText(justification) &&
    /\b(unblocks?|enables?|next\s+vertical|vertical\s+slice|follow[- ]up|slice\s*\d+|slice-\d+)\b/i.test(justification);
}

function hasSliceMap(sliceIndexText) {
  if (!hasSection(sliceIndexText, "Slice Map")) return false;
  const sliceMap = extractSection(sliceIndexText, "Slice Map");
  return sectionHasSubstance(sliceMap) &&
    /\bDepends On\b/i.test(sliceMap) &&
    /\bUnblocks\b/i.test(sliceMap) &&
    /\bVerification\b/i.test(sliceMap);
}

function hasSliceCheckpoint(sliceIndexText) {
  const normalized = normalizeText(sliceIndexText);
  const match = normalized.match(/^##\s+Checkpoint\b.*$/im);
  if (!match || match.index === undefined) return false;
  const rest = normalized.slice(match.index + match[0].length);
  const nextHeading = rest.search(/^##\s+/m);
  const checkpoint = (nextHeading === -1 ? rest : rest.slice(0, nextHeading)).trim();
  return sectionHasSubstance(checkpoint);
}

function slicePlanningMessages(state) {
  const messages = [];
  if (!state.index.currentMode || !["slice", "build", "review", "readiness"].includes(state.index.currentMode)) return messages;

  const activeFeature = state.activeFeature.exists
    ? state.activeFeature
    : inferredFeatureFromActiveSlice(state.repoRoot, state.activeSlice);
  if (!activeFeature?.exists) return messages;

  const sliceDocs = activeFeatureSliceDocs(activeFeature);
  const sliceIndexPath = activeFeatureSliceIndexPath(activeFeature);
  const sliceIndexText = sliceIndexPath ? readFileIfPresent(path.join(state.repoRoot, sliceIndexPath)) : null;

  if (sliceDocs.length > 1 && !hasSliceMap(sliceIndexText ?? "")) {
    messages.push(message("warning", "missing-slice-map", sliceIndexPath ?? state.activeFeature.slicesPath, "Multi-slice work should include a lightweight Slice Map with Slice, Size, Depends On, Unblocks, Risk, and Verification."));
  }

  if (sliceDocs.length > 2 && !hasSliceCheckpoint(sliceIndexText ?? "")) {
    messages.push(message("warning", "missing-slice-checkpoint", sliceIndexPath ?? state.activeFeature.slicesPath, "Multi-slice work should add a checkpoint after 2-3 slices or at a milestone boundary."));
  }

  for (const slicePath of sliceDocs) {
    const sliceText = readFileIfPresent(path.join(state.repoRoot, slicePath));
    if (!sliceText) continue;
    const title = sliceTitle(sliceText);
    const size = sliceSize(sliceText);
    const criteriaCount = acceptanceCriteriaCount(sliceText);
    const surfaceCount = likelySurfaceCount(sliceText);

    if (!dependencySectionIsValid(sliceText)) {
      messages.push(message("warning", "missing-slice-dependency", slicePath, "Slice should include a concrete Depends On section; use None when it has no prerequisite."));
    }

    if (!executionTasksAreValid(sliceText)) {
      messages.push(message("warning", "missing-slice-execution-tasks", slicePath, "Slice should include Execution Tasks as a checkbox work packet covering research, plan, plan review, and verification."));
    }

    if (size === "L" || size === "XL") {
      messages.push(message("warning", "oversized-slice", slicePath, `Slice size is ${size}; challenge and split it unless a recorded rationale proves this is the smallest safe slice.`));
    }

    if (criteriaCount > 3) {
      messages.push(message("warning", "too-many-slice-acceptance-criteria", slicePath, `Slice has ${criteriaCount} acceptance criteria; split it unless they describe one small behavior path.`));
    }

    if (surfaceCount > 5) {
      messages.push(message("warning", "too-many-slice-surfaces", slicePath, `Slice lists ${surfaceCount} likely surfaces; split it or record why the larger blast radius is necessary.`));
    }

    if (BROAD_SLICE_TITLE_PATTERN.test(title)) {
      messages.push(message("warning", "batched-slice-title", slicePath, "Slice title looks batched or MVP-sized; split it if the title hides multiple tasks or independent subsystems."));
    }

    if (needsNonVerticalJustification(sliceText, title) && !nonVerticalJustificationIsValid(sliceText)) {
      messages.push(message("warning", "weak-non-vertical-slice-justification", slicePath, "Possible non-vertical slice should explain why vertical-first is worse and name the next vertical slice it unlocks."));
    }
  }

  return messages;
}

function activeWorkValueHasSubstance(value) {
  return sectionHasSubstance(value) && !sectionHasWeakPlanningText(value);
}

function activeWorkPointerIsValid(index) {
  const work = index.activeWork;
  if (!work || !sectionHasSubstance(work.text)) return false;
  return activeWorkValueHasSubstance(work.initiativePath) &&
    activeWorkValueHasSubstance(work.currentModeRaw) &&
    activeWorkValueHasSubstance(work.docPath) &&
    activeWorkValueHasSubstance(work.next);
}

function activeWorkDocIsValid(text) {
  if (!text) return false;
  const phaseTasks = extractSection(text, "Phase Tasks");
  const exitEvidence = extractSection(text, "Exit Evidence");
  return checkboxCount(phaseTasks) >= 2 &&
    sectionHasSubstance(exitEvidence) &&
    !sectionHasWeakPlanningText(exitEvidence);
}

function activeWorkDocNeedsTaskPacket(docPath) {
  if (!docPath || isPlaceholder(docPath)) return false;
  const basename = path.posix.basename(normalizeEvidencePath(docPath)).toLowerCase();
  return ACTIVE_WORK_DOC_FILES.has(basename);
}

function activeWorkMessages(state) {
  const messages = [];
  if (!state.index.present) return messages;

  const duplicateLabels = state.index.activeWork?.duplicateLabels ?? [];
  if (duplicateLabels.length > 0) {
    messages.push(message("warning", "duplicate-active-work-field", `${WORKSPACE_ROOT}/index.md`, `Active Work has duplicate field lines (${duplicateLabels.join(", ")}). Replace old values in place so resume state is unambiguous.`));
  }

  if (!activeWorkPointerIsValid(state.index)) {
    messages.push(message("warning", "missing-active-work", `${WORKSPACE_ROOT}/index.md`, "Index should include Active Work with an initiative, explicit Current mode, active doc, and next action so fresh context can resume without reading every phase."));
  }

  const docPath = state.index.activeWork?.docPath;
  if (!docPath || isPlaceholder(docPath)) {
    return messages;
  }

  const resolved = resolveRepoReferencePath(state.repoRoot, docPath);
  if (!resolved?.safe) {
    messages.push(message("error", "unsafe-active-work-doc", docPath, "Active Work doc path is unsafe."));
  } else if (!resolved.exists) {
    messages.push(message("warning", "missing-active-work-doc", resolved.relativePath, "Active Work points to a doc that does not exist."));
  } else if (activeWorkDocNeedsTaskPacket(resolved.relativePath)) {
    const activeDocText = readFileIfPresent(resolved.absolutePath);
    if (!activeWorkDocIsValid(activeDocText)) {
      messages.push(message("warning", "weak-active-work-doc", resolved.relativePath, "Active phase doc should include checkbox Phase Tasks and concrete Exit Evidence."));
    }
  }

  return messages;
}

function mentionsSpecArtifactCreation(text) {
  return /\b(write|create|draft|fill|produce|complete)\b.{0,80}\b(?:initiative\s+)?spec\b/i.test(text) ||
    /\b(write|create|draft|fill|produce|complete)\b.{0,80}\bfeature[- ]spec\b/i.test(text) ||
    /\b(?:initiative\s+)?spec\b.{0,80}\b(write|create|draft|fill|produce|complete)\b/i.test(text) ||
    /\bfeature[- ]spec\b.{0,80}\b(write|create|draft|fill|produce|complete)\b/i.test(text);
}

function mentionsSliceArtifactCreation(text) {
  return /\bslice\s+the\s+build\b/i.test(text) ||
    /\bslice-\d+[-\w]*\.md\b/i.test(text) ||
    /\b(write|create|draft|fill|produce|plan|generate)\b.{0,80}\b(slice\s+map|slice\s+plan|slice\s+docs?|slices?)\b/i.test(text) ||
    /\b(slice\s+map|slice\s+plan|slice\s+docs?|slices?)\b.{0,80}\b(write|create|draft|fill|produce|plan|generate)\b/i.test(text) ||
    /\benter\s+slice\s+mode\b|\bmove\s+to\s+slice\s+mode\b/i.test(text);
}

function mentionsBuildStart(text) {
  return /\b(start|begin|enter|move\s+to)\s+(?:the\s+)?build\b/i.test(text) ||
    /\b(build|implement|code)\s+(?:the\s+)?(?:first\s+)?slice\b/i.test(text) ||
    /\b(?:then|and)\s+(?:implement|code)\b/i.test(text) ||
    /\bbegin\s+(?:implementation|coding)\b/i.test(text);
}

function phaseBoundaryBatchingMessages(state) {
  if (!state.index.present) return [];

  const next = normalizeText(state.index.activeWork?.next ?? "");
  if (!sectionHasSubstance(next)) return [];

  const createsSpec = mentionsSpecArtifactCreation(next);
  const createsSlices = mentionsSliceArtifactCreation(next);
  const startsBuild = mentionsBuildStart(next);
  const messages = [];

  if (createsSpec && createsSlices) {
    messages.push(message("warning", "batched-phase-next-action", `${WORKSPACE_ROOT}/index.md`, "Active Work Next batches spec and slice work. Close the current phase, then stop with the immediate next mode; do not promise or record spec + slicing in one next action."));
  }
  if (createsSlices && startsBuild) {
    messages.push(message("warning", "batched-phase-next-action", `${WORKSPACE_ROOT}/index.md`, "Active Work Next batches slice artifact creation and build/implementation. Finish the current phase or slice closeout, then stop with the immediate next mode/action; do not write slice docs and implement them in the same next action."));
  }

  return messages;
}

function phaseLedgerRequiredPhases(state) {
  const mode = state.index.currentMode;
  if (state.index.currentModeExplicit && mode && PHASE_LEDGER_BY_MODE[mode]) {
    return PHASE_LEDGER_BY_MODE[mode];
  }
  if (state.evidence.reviewScope.reviewedItems.length > 0) {
    return PHASE_LEDGER_BY_MODE.review;
  }
  if (state.evidence.reviewScope.changedPaths.length > 0 || state.evidence.reviewScope.verifiedItems.length > 0) {
    return PHASE_LEDGER_BY_MODE.build;
  }
  if (state.activeFeature.exists || state.activeFeature.sliceFiles.length > 0) {
    return PHASE_LEDGER_BY_MODE.slice;
  }
  return [];
}

function phaseLedgerValueIsWeak(value) {
  return !sectionHasSubstance(value) || sectionHasWeakPlanningText(value);
}

function phaseLedgerMessages(state) {
  const requiredPhases = phaseLedgerRequiredPhases(state);
  if (requiredPhases.length === 0) return [];

  const ledgerPath = state.phaseLedger.path ?? state.activeInitiative.ideaPath ?? `${WORKSPACE_ROOT}/index.md`;
  if (!state.phaseLedger.present) {
    return [
      message("warning", "missing-phase-ledger", ledgerPath, "Active initiative has reached slice/build/review work without a Phase Ledger. Record each phase as done, compressed, or skipped with artifact and reason so phases are not silently skipped."),
    ];
  }

  const messages = [];
  const duplicatePhases = Object.keys(state.phaseLedger.duplicates ?? {});
  if (duplicatePhases.length > 0) {
    messages.push(message("warning", "duplicate-phase-ledger-row", state.phaseLedger.path, `Phase Ledger has duplicate phase rows (${duplicatePhases.join(", ")}). Keep one row per phase and update it in place so phase state is not ambiguous.`));
  }

  const weak = [];
  const currentPhase = requiredPhases.at(-1);
  for (const phase of requiredPhases) {
    const row = state.phaseLedger.rows[phase];
    if (!row) {
      weak.push(`${phase}: missing row`);
      continue;
    }
    const validStatuses = phase === currentPhase ? PHASE_LEDGER_ACTIVE_STATUSES : PHASE_LEDGER_COMPLETE_STATUSES;
    if (!row.status || !validStatuses.has(row.status)) {
      weak.push(`${phase}: weak status`);
    }
    if (phaseLedgerValueIsWeak(row.artifact)) {
      weak.push(`${phase}: weak artifact`);
    }
    if (phaseLedgerValueIsWeak(row.reason)) {
      weak.push(`${phase}: weak reason`);
    }
  }

  if (weak.length > 0) {
    messages.push(message("warning", "weak-phase-ledger", state.phaseLedger.path, `Phase Ledger should show completed or intentionally compressed/skipped prior phases with artifact and reason. Weak entries: ${weak.slice(0, 8).join("; ")}${weak.length > 8 ? "; ..." : ""}.`));
  }
  return messages;
}

function hasImplementationEvidence(state) {
  return state.evidence.reviewScope.changedPaths.some(isImplementationPath) ||
    state.evidence.reviewScope.verifiedItems.length > 0 ||
    state.evidence.reviewScope.reviewedItems.length > 0;
}

function activeWorkFreshnessMessages(state) {
  const messages = [];
  if (!state.index.present || !hasImplementationEvidence(state)) return messages;

  const mode = state.index.currentMode;
  const activeText = normalizeText([
    state.index.activeWork?.state,
    state.index.activeWork?.next,
    state.index.activeWork?.blockedBy,
  ].filter(Boolean).join("\n"));

  if (["brainstorm", "grill", "spec"].includes(mode) || /\b(brainstorm|grill|spec)\b/i.test(activeText)) {
    messages.push(message("warning", "stale-active-work-mode", `${WORKSPACE_ROOT}/index.md`, "Implementation evidence exists, but Active Work still points at an early phase. Update index.md to the real active mode, feature, slice, state, and next action before claiming progress."));
  }

  if (!state.activeFeature.exists && state.activeInitiative.featureDirs.length > 0) {
    messages.push(message("warning", "stale-active-feature-pointer", `${WORKSPACE_ROOT}/index.md`, "Implementation evidence exists and feature folders exist, but Active Work does not point to an existing active feature."));
  }

  const sliceDocs = state.docs.filter((sourcePath) => SLICE_DOC_PATTERN.test(sourcePath));
  if (!state.activeSlice.path && sliceDocs.length > 0) {
    messages.push(message("warning", "stale-active-slice-pointer", `${WORKSPACE_ROOT}/index.md`, "Implementation evidence exists and slice docs exist, but Active Work does not name the active slice."));
  }

  if (state.index.verification.some((item) => /\b(no code written|none yet|not run|pending)\b/i.test(item))) {
    messages.push(message("warning", "stale-index-verification", `${WORKSPACE_ROOT}/index.md`, "Implementation evidence exists, but index.md Verification still says no checks or no code. Update it to the current verification truth."));
  }

  if (state.index.openDecisions.length > 0) {
    messages.push(message("warning", "open-decisions-after-implementation", `${WORKSPACE_ROOT}/index.md`, "Implementation evidence exists while index.md still lists open decisions. Resolve them, record accepted assumptions, or move back to grill/spec before continuing build."));
  }

  return messages;
}

function currentTruthMessages(state) {
  const messages = [];
  if (!["recognized", "empty"].includes(state.workspace.status)) return messages;

  if (!state.language.present) {
    messages.push(message("warning", "missing-root-language", `${WORKSPACE_ROOT}/language.md`, "Root language.md is mandatory. Create it as the shared glossary/domain model, even if it starts with no durable terms recorded yet."));
  } else if (!state.language.substantive) {
    messages.push(message("warning", "weak-root-language", state.language.path, "Root language.md exists but has no substantive glossary/domain-model content or explicit empty-state note."));
  }

  if (!state.activeInitiative.exists) return messages;

  if (!state.activeInitiative.decisionsExists) {
    messages.push(message("warning", "missing-initiative-decisions", state.activeInitiative.decisionsPath, "Each active initiative needs decisions.md, even if it starts with an explicit no-consequential-decisions-yet note."));
  } else if (!state.decisions.substantive) {
    messages.push(message("warning", "weak-initiative-decisions", state.activeInitiative.decisionsPath, "Initiative decisions.md exists but has no substantive current-truth decision content or explicit empty-state note."));
  }

  if (!state.activeInitiative.specExists) {
    messages.push(message("warning", "missing-initiative-spec", state.activeInitiative.specPath, "Each active initiative needs spec.md, even when minimal, before feature specs, slicing, or build work proceed."));
  } else {
    const specText = readFileIfPresent(path.join(state.repoRoot, state.activeInitiative.specPath));
    if (!markdownDocHasSubstance(specText)) {
      messages.push(message("warning", "weak-initiative-spec", state.activeInitiative.specPath, "Initiative spec.md exists but has no substantive current-truth overview, feature map, scope, or explicit draft note."));
    }
  }

  return messages;
}

function activeGrillDocState(state) {
  const candidates = [];
  const activeDoc = state.index.activeWork?.docPath;
  if (activeDoc && path.posix.basename(normalizeEvidencePath(activeDoc)).toLowerCase() === "grill.md") {
    candidates.push(activeDoc);
  }
  if (state.activeInitiative.path) {
    candidates.push(`${state.activeInitiative.path}/grill.md`);
  }
  candidates.push(...state.docs.filter((sourcePath) => path.posix.basename(sourcePath).toLowerCase() === "grill.md"));

  for (const candidate of [...new Set(candidates)]) {
    const resolved = resolveRepoReferencePath(state.repoRoot, candidate);
    if (resolved?.safe && resolved.exists) return resolved;
  }
  return null;
}

function decisionDepthLevel(grillText) {
  const section = extractSection(grillText, "Decision Depth");
  const match = section.match(/^Level:\s*(.+)$/im);
  if (!match) return null;
  return stripMarkdownShell(match[1])
    .split(/\s+-\s+|\s+--\s+|\s+:\s+/)[0]
    .trim()
    .toLowerCase();
}

function grillDecisionDepthMessages(state) {
  const shouldCheck = state.index.currentMode === "grill" ||
    (hasReachedSpecOrLater(state) && !grillWasExplicitlyOptedOut(state));
  if (!shouldCheck) return [];

  const grillDoc = activeGrillDocState(state);
  if (!grillDoc) return [];

  const grillText = readFileIfPresent(grillDoc.absolutePath);
  const section = extractSection(grillText, "Decision Depth");
  if (!sectionHasSubstance(section)) {
    return [
      message("warning", "missing-grill-decision-depth", grillDoc.relativePath, "Active grill doc should record Decision Depth so fresh context knows how hard to pressure-test decisions before spec."),
    ];
  }

  const level = decisionDepthLevel(grillText);
  if (!level || !VALID_DECISION_DEPTH_LEVELS.has(level)) {
    return [
      message("warning", "unknown-grill-decision-depth", grillDoc.relativePath, "Decision Depth should include a line exactly like `Level: Lean`, `Level: Standard`, or `Level: Deep`."),
    ];
  }

  return [];
}

function phaseLedgerRowText(row) {
  if (!row) return "";
  return normalizeText([row.statusRaw, row.artifact, row.reason, row.raw].filter(Boolean).join("\n"));
}

function rowShowsExplicitUserOptOut(row) {
  const text = phaseLedgerRowText(row);
  return /\b(user|human)\b.*\b(opt(?:ed)?\s*out|skip(?:ped)?|move\s+along|no\s+questions?|proceed\s+without\s+questions?|use\s+judgment)\b/i.test(text) ||
    /\b(skip(?:ped)?|compress(?:ed)?)\b.*\b(user|human)\b/i.test(text) ||
    /\b(explicit(?:ly)?\s+(?:opted\s+out|skipped|asked\s+to\s+move\s+along))\b/i.test(text);
}

function rowShowsExplicitAnswers(row) {
  const text = phaseLedgerRowText(row);
  return /\b(explicit(?:ly)?\s+(?:answered|stated|provided|confirmed)|explicit user (?:wording|answers?|decisions?)|user (?:already )?(?:answered|stated|confirmed|provided)|prompt explicitly)\b/i.test(text);
}

function rowShowsPriorArtifact(row) {
  const text = phaseLedgerRowText(row);
  return /\b(prior|existing|previous|earlier|already completed)\b.*\b(artifact|docs?|documents?|decisions?|spec|grill|brainstorm|auto strike|repo context)\b/i.test(text) ||
    /\b(recorded in|carried from)\b.*\b(artifact|docs?|documents?|decisions?|spec|grill|brainstorm)\b/i.test(text);
}

function rowShowsNotApplicable(row) {
  return /\b(not applicable|does not apply|n\/a|irrelevant)\b/i.test(phaseLedgerRowText(row));
}

function rowShowsInternalInference(row) {
  return /\b(agent|model|assistant)\b.*\b(inferred|assumed|interpreted|decided)\b|\b(internal|privately)\b.*\b(inferred|assumed|interpreted|decided)\b|\bprompt (?:implied|suggested)\b/i.test(phaseLedgerRowText(row));
}

function rowShowsQuestionToolFailure(row) {
  return /\b(AskUserQuestion|question tool|question ui|answer questions\?|tool (?:failed|failure|error|unavailable)|failed question|denied question|question denied|timeout|timed out|no answer|missing answer)\b/i.test(phaseLedgerRowText(row));
}

function grillWasExplicitlyOptedOut(state) {
  const grillRow = state.phaseLedger.rows?.grill;
  if (!grillRow) return false;
  return ["compressed", "skipped", "replaced"].includes(grillRow.status) && rowShowsExplicitUserOptOut(grillRow);
}

function phaseBypassMessages(state) {
  if (!hasReachedSpecOrLater(state) || !state.phaseLedger.present) return [];

  const messages = [];
  for (const phase of ["brainstorm", "grill"]) {
    const row = state.phaseLedger.rows?.[phase];
    if (!row) continue;
    if (rowShowsQuestionToolFailure(row) && PHASE_LEDGER_COMPLETE_STATUSES.has(row.status)) {
      messages.push(message("warning", "phase-completed-after-question-tool-failure", state.phaseLedger.path, `${phase} is recorded as complete/compressed/skipped after a failed or unavailable question mechanism. Ask in plain text and wait for the user instead of treating tool failure as permission to proceed.`));
      continue;
    }

    if (rowShowsInternalInference(row)) {
      messages.push(message("warning", "phase-completed-by-inference", state.phaseLedger.path, `${phase} is recorded as complete using agent inference. Run the phase with the user, cite explicit user answers/prior artifacts, or record explicit permission to skip.`));
      continue;
    }

    if (row.status === "compressed" && !rowShowsExplicitUserOptOut(row) && !rowShowsExplicitAnswers(row) && !rowShowsPriorArtifact(row)) {
      messages.push(message("warning", "phase-compressed-without-permission", state.phaseLedger.path, `${phase} is compressed without explicit user opt-out, explicit prior answers, or prior-artifact evidence.`));
    }

    if (row.status === "skipped" && !rowShowsExplicitUserOptOut(row) && !rowShowsNotApplicable(row)) {
      messages.push(message("warning", "phase-skipped-without-permission", state.phaseLedger.path, `${phase} is skipped without explicit user opt-out, move-along request, or not-applicable reason.`));
    }
  }
  return messages;
}

function activeInitiativeSliceDocs(state) {
  if (!state.activeInitiative.path) return [];
  const prefix = `${state.activeInitiative.path}/features/`;
  return state.docs
    .filter((sourcePath) => sourcePath.startsWith(prefix) && /\/slices\/.+\.md$/i.test(sourcePath))
    .sort();
}

function specPhaseIsComplete(state) {
  const row = state.phaseLedger.rows?.spec;
  return Boolean(row?.status && PHASE_LEDGER_COMPLETE_STATUSES.has(row.status));
}

function detailedSlicePlanningInText(text) {
  const normalized = normalizeText(text);
  if (hasSection(normalized, "Slice Map")) return true;
  if (/\|\s*Slice\s*\|\s*Size\s*\|\s*Depends On\s*\|/i.test(normalized)) return true;
  if (/^#{1,3}\s+Slice\s+\d+\b/im.test(normalized) &&
      (hasSection(normalized, "Acceptance Criteria") || hasSection(normalized, "Execution Tasks") || hasSection(normalized, "Likely Surfaces"))) {
    return true;
  }
  const slicePlanningSections = [
    "Size",
    "Acceptance Criteria",
    "Depends On",
    "Likely Surfaces",
    "Execution Tasks",
    "Implementation Research",
    "Plan Review",
  ].filter((heading) => hasSection(normalized, heading)).length;
  return /\bslice\b/i.test(normalized) && slicePlanningSections >= 3;
}

function sliceHandoffIsTooDetailed(text) {
  const handoff = extractSection(text, "Slice Handoff");
  if (!sectionHasSubstance(handoff)) return false;
  const normalized = normalizeText(handoff);
  if (/\bslices\/index\.md\b/i.test(normalized)) return true;
  if (/\bslices\/slice-[\w.-]+\.md\b/i.test(normalized)) return true;
  if (/\bSlice\s+\d+\b/i.test(normalized)) return true;
  if (/\bslice-\d+[-\w]*\b/i.test(normalized)) return true;
  return false;
}

function specDocsForState(state) {
  if (!state.activeInitiative.path) return [];
  return state.docs.filter((sourcePath) => {
    if (!sourcePath.startsWith(`${state.activeInitiative.path}/`)) return false;
    return sourcePath.endsWith("/spec.md") || sourcePath.endsWith("/feature-spec.md");
  });
}

function specSliceBoundaryMessages(state) {
  const messages = [];
  if (!state.activeInitiative.exists) return messages;

  const inSpecMode = state.index.currentMode === "spec";
  const specComplete = specPhaseIsComplete(state);
  const sliceDocs = activeInitiativeSliceDocs(state);
  const specDocs = specDocsForState(state);
  if ((inSpecMode || !specComplete) && sliceDocs.length > 0) {
    messages.push(message("warning", "spec-phase-created-slice-artifacts", sliceDocs[0], "Spec phase should not create Slice Maps or slice files. Finish spec review and exit evidence first, then intentionally enter slice mode before writing slices."));
  }

  if (inSpecMode || !specComplete) {
    for (const sourcePath of specDocs) {
      const text = readFileIfPresent(path.join(state.repoRoot, sourcePath));
      if (text && detailedSlicePlanningInText(text)) {
        messages.push(message("warning", "detailed-slice-planning-in-spec", sourcePath, "Spec may include a concise Slice Handoff, but detailed Slice Maps, slice acceptance criteria, or slice execution tasks belong in slice mode after spec exit evidence."));
      }
    }
  }

  for (const sourcePath of specDocs) {
    const text = readFileIfPresent(path.join(state.repoRoot, sourcePath));
    if (text && sliceHandoffIsTooDetailed(text)) {
      messages.push(message("warning", "slice-handoff-too-detailed", sourcePath, "Slice Handoff should stay concise. Numbered slice lists, future slices/index.md links, slice files, acceptance criteria, and execution tasks belong in slice mode."));
    }
  }

  return messages;
}

function reachedSliceOrLater(state) {
  if (["slice", "build", "review", "readiness"].includes(state.index.currentMode)) return true;
  if (state.activeFeature.sliceFiles.length > 0 || state.activeSlice.path) return true;
  return ["slice", "build", "review", "validate"].some((phase) => {
    const row = state.phaseLedger.rows?.[phase];
    return row && PHASE_LEDGER_ACTIVE_STATUSES.has(row.status);
  });
}

function reachedBuildOrLater(state) {
  if (["build", "review", "readiness"].includes(state.index.currentMode)) return true;
  if (hasImplementationEvidence(state)) return true;
  return ["build", "review", "validate"].some((phase) => {
    const row = state.phaseLedger.rows?.[phase];
    return row && PHASE_LEDGER_ACTIVE_STATUSES.has(row.status);
  });
}

function phaseExitGateMessages(state) {
  const messages = [];

  if (reachedSliceOrLater(state)) {
    for (const sourcePath of specDocsForState(state)) {
      const text = readFileIfPresent(path.join(state.repoRoot, sourcePath));
      if (!text) continue;
      if (!sectionHasSubstance(extractSection(text, "Spec Review"))) {
        messages.push(message("warning", "missing-spec-review", sourcePath, "Spec work reached slicing/building without a substantive Spec Review. Review scope, rules, checks, risks, and missing decisions before slicing."));
      }
      if (!sectionHasSubstance(extractSection(text, "Exit Evidence"))) {
        messages.push(message("warning", "missing-spec-exit-evidence", sourcePath, "Spec work reached slicing/building without Exit Evidence. Record why the spec can be sliced without guessing before creating slice artifacts."));
      }
    }
  }

  if (reachedBuildOrLater(state)) {
    const activeFeature = state.activeFeature.exists
      ? state.activeFeature
      : inferredFeatureFromActiveSlice(state.repoRoot, state.activeSlice);
    const sliceIndexPath = activeFeature?.exists ? activeFeatureSliceIndexPath(activeFeature) : null;
    if (sliceIndexPath) {
      const text = readFileIfPresent(path.join(state.repoRoot, sliceIndexPath));
      if (text && !sectionHasSubstance(extractSection(text, "Slice Review"))) {
        messages.push(message("warning", "missing-slice-phase-review", sliceIndexPath, "Build started without a substantive Slice Review in slices/index.md. Review slice size, dependency order, risk placement, working-state guarantee, and verification coverage before build."));
      }
      if (text && !sectionHasSubstance(extractSection(text, "Exit Evidence"))) {
        messages.push(message("warning", "missing-slice-phase-exit-evidence", sliceIndexPath, "Build started without Slice Exit Evidence. Record why the feature can enter build one slice at a time before marking build in progress."));
      }
    }
  }

  return messages;
}

function hasReachedSpecOrLater(state) {
  const mode = state.index.currentMode;
  if (mode && MODES_REQUIRING_GRILL_CHECKPOINT.has(mode)) return true;
  if (state.activeFeature.exists || state.activeFeature.sliceFiles.length > 0 || hasImplementationEvidence(state)) return true;
  return ["spec", "slice", "build", "review", "validate"].some((phase) => {
    const row = state.phaseLedger.rows?.[phase];
    return row && PHASE_LEDGER_ACTIVE_STATUSES.has(row.status);
  });
}

function decisionCheckpointSignalChecks(sectionText) {
  const text = normalizeText(sectionText);
  return [
    ["scope/size", /\b(scope|size|first[- ]version|non[- ]goals?)\b/i.test(text)],
    ["stack/dependencies", /\b(stack|dependenc(?:y|ies)|package|runtime|framework|architecture)\b/i.test(text)],
    ["data/state", /\b(data|persist(?:ence)?|state|model|schema|storage)\b/i.test(text)],
    ["auth/permissions", /\b(auth|identity|session|permission|ownership|privacy)\b/i.test(text)],
    ["validation", /\b(validation|verify|verification|browser|live|success|checks?)\b/i.test(text)],
    ["confirmed/assumed/deferred decisions", /\b(user[- ]confirmed|confirmed|explicit|accepted assumptions?|assumptions?|deferred|opt[- ]out|opted out)\b/i.test(text)],
  ];
}

function decisionCheckpointIsValid(sectionText) {
  const text = normalizeText(sectionText);
  if (!sectionHasSubstance(text) || sectionHasWeakPlanningText(text)) return false;
  return decisionCheckpointSignalChecks(text).filter(([, present]) => present).length >= 5;
}

function grillCheckpointMessages(state) {
  if (!state.activeInitiative.exists || !hasReachedSpecOrLater(state) || grillWasExplicitlyOptedOut(state)) {
    return [];
  }

  if (!state.activeInitiative.grillExists) {
    return [
      message("warning", "missing-initiative-grill", state.activeInitiative.grillPath, "Initiative has reached spec/slice/build work without grill.md. Run a proper grill session with the user or record an explicit user opt-out before hardening scope, stack, dependencies, persistence, identity, or feature split."),
    ];
  }

  const grillText = readFileIfPresent(path.join(state.repoRoot, state.activeInitiative.grillPath));
  const checkpoint = extractSection(grillText ?? "", "Decision Checkpoint");
  if (!sectionHasSubstance(checkpoint)) {
    return [
      message("warning", "missing-grill-decision-checkpoint", state.activeInitiative.grillPath, "Grill should record a Decision Checkpoint before spec/slice/build so vague kickoff language and consequential assumptions are explicit."),
    ];
  }

  if (!decisionCheckpointIsValid(checkpoint)) {
    const missingSignals = decisionCheckpointSignalChecks(checkpoint)
      .filter(([, present]) => !present)
      .map(([label]) => label);
    return [
      message("warning", "weak-grill-decision-checkpoint", state.activeInitiative.grillPath, `Decision Checkpoint should cover at least five core signals. Missing/weak signals: ${missingSignals.join(", ") || "none detected; remove placeholder or unresolved wording"}.`),
    ];
  }

  return [];
}

function autoStrikeDocReferences(text) {
  return [...new Set([...normalizeText(text).matchAll(/\bauto-strike\/[A-Za-z0-9._~/-]+\.md\b/g)]
    .map((match) => match[0])
    .filter((sourcePath) => !isPlaceholder(sourcePath) && !isNoneItem(sourcePath)))];
}

function referencedAutoStrikeDocMessages(state) {
  const messages = [];
  const seen = new Set();
  for (const sourcePath of state.docs) {
    const text = readFileIfPresent(path.join(state.repoRoot, sourcePath));
    if (!text) continue;
    for (const referencePath of autoStrikeDocReferences(text)) {
      const key = `${sourcePath}\0${referencePath}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const resolved = resolveRepoReferencePath(state.repoRoot, referencePath);
      if (resolved?.safe && !resolved.exists) {
        messages.push(message("warning", "missing-referenced-auto-strike-doc", sourcePath, `Auto Strike doc references ${resolved.relativePath}, but that file does not exist. Create it, update the reference, or record that it is intentionally not part of this run.`));
      }
    }
  }
  return messages;
}

function uncheckedCheckboxItems(sectionText) {
  return normalizeText(sectionText)
    .split("\n")
    .map((line) => line.trim())
    .map((line) => line.match(/^[-*]\s+\[\s\]\s+(.+)$/)?.[1]?.trim())
    .filter(Boolean);
}

function sliceDocHasBuildEvidence(repoRoot, sourcePath) {
  const changed = evidenceListItems(repoRoot, [sourcePath], ["changed", "files changed", "modified", "touched"]);
  const verified = evidenceListItems(repoRoot, [sourcePath], ["verified", "verification", "checks"]);
  return changed.length > 0 && verified.length > 0;
}

function staleSliceTaskChecklistMessages(state) {
  const messages = [];
  for (const sourcePath of state.evidence.locations.filter((location) => SLICE_DOC_PATTERN.test(location))) {
    if (!sliceDocHasBuildEvidence(state.repoRoot, sourcePath)) continue;
    const text = readFileIfPresent(path.join(state.repoRoot, sourcePath));
    const tasks = extractSection(text ?? "", "Execution Tasks");
    const unchecked = uncheckedCheckboxItems(tasks);
    if (unchecked.length === 0) continue;
    messages.push(message("warning", "stale-slice-task-checklist", sourcePath, `Slice has Changed and Verified evidence but unfinished Execution Tasks: ${unchecked.slice(0, 5).join("; ")}${unchecked.length > 5 ? "; ..." : ""}. Mark completed work or move remaining tasks to follow-up/blocker evidence.`));
  }
  return messages;
}

function checkpointSections(text) {
  const normalized = normalizeText(text);
  const matches = [...normalized.matchAll(/^##\s+Checkpoint\b.*$/gim)];
  return matches.map((match, index) => {
    const start = match.index ?? 0;
    const nextStart = matches[index + 1]?.index ?? normalized.length;
    const heading = match[0];
    const bodyStart = start + heading.length;
    return {
      heading,
      body: normalized.slice(bodyStart, nextStart),
    };
  });
}

function checkpointDueIndex(heading) {
  const normalized = String(heading ?? "").replace(/[–—]/g, "-");
  const match = normalized.match(/\bafter\s+(?:slices?|tasks?)\s+(\d+)(?:\s*-\s*(\d+))?\b/i);
  if (!match) return null;
  return Number.parseInt(match[2] ?? match[1], 10);
}

function checkpointIsDue(heading, completedSliceIndices) {
  const dueIndex = checkpointDueIndex(heading);
  if (!Number.isInteger(dueIndex)) return true;
  return completedSliceIndices.some((sliceIndex) => sliceIndex >= dueIndex);
}

function staleFeatureCheckpointMessages(state) {
  const messages = [];
  const completedSlicesByFeature = new Map();

  for (const sourcePath of state.evidence.locations) {
    const match = sourcePath.match(new RegExp(`^(${escapeRegExp(WORKSPACE_ROOT)}/initiatives/[^/]+/features/[^/]+)/slices/slice-(\\d+)[^/]*\\.md$`));
    if (!match) continue;
    if (!sliceDocHasBuildEvidence(state.repoRoot, sourcePath)) continue;
    const featurePath = match[1];
    const sliceIndex = Number.parseInt(match[2], 10);
    const completed = completedSlicesByFeature.get(featurePath) ?? [];
    completed.push(sliceIndex);
    completedSlicesByFeature.set(featurePath, completed);
  }

  for (const sourcePath of state.docs.filter((docPath) => docPath.endsWith("/slices/index.md"))) {
    const featurePath = sourcePath.replace(/\/slices\/index\.md$/, "");
    const completedSliceIndices = completedSlicesByFeature.get(featurePath) ?? [];
    if (completedSliceIndices.length === 0) continue;
    const text = readFileIfPresent(path.join(state.repoRoot, sourcePath));
    const unchecked = checkpointSections(text ?? "")
      .filter((section) => checkpointIsDue(section.heading, completedSliceIndices))
      .flatMap((section) => uncheckedCheckboxItems(section.body));
    if (unchecked.length === 0) continue;
    messages.push(message("warning", "stale-slice-checkpoint-checklist", sourcePath, `A due slice checkpoint has unfinished items: ${unchecked.slice(0, 5).join("; ")}${unchecked.length > 5 ? "; ..." : ""}. Update the checkpoint or record why it remains open.`));
  }
  return messages;
}

function activeSlicePrepMessages(repoRoot, activeSlice, currentMode) {
  if (!activeSlice.path || !activeSlice.exists) return [];
  const sliceText = readFileIfPresent(path.join(repoRoot, activeSlice.path));
  if (!sliceText) return [];

  const messages = [];
  const implementationResearch = extractSection(sliceText, "Implementation Research");
  const plan = extractSection(sliceText, "Plan");
  const planReview = extractSection(sliceText, "Plan Review");
  const modeText = currentMode ? ` in ${currentMode} mode` : "";

  if (!sectionHasSubstance(implementationResearch)) {
    messages.push(message("warning", "weak-slice-implementation-research", activeSlice.path, `Active slice is${modeText} but Implementation Research is missing or placeholder-only. Record relevant docs, local precedent, or why no extra research was needed.`));
  }

  if (!sectionHasSubstance(plan) || !planNamesSurface(plan) || !planNamesVerification(plan)) {
    messages.push(message("warning", "weak-slice-plan", activeSlice.path, `Active slice is${modeText} but Plan is missing, placeholder-only, or does not name likely files/surfaces and verification checks.`));
  }

  if (!sectionHasSubstance(planReview) || !planReviewHasOutcome(planReview)) {
    messages.push(message("warning", "weak-slice-plan-review", activeSlice.path, `Active slice is${modeText} but Plan Review is missing, pending, or lacks a concrete review outcome. Record main-agent review, critical reviewer findings, or accepted skip rationale.`));
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
  } else if (cleaned.startsWith("initiatives/") || cleaned.startsWith("research/") || cleaned.startsWith("extras/")) {
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
  const explicitReviewMode = ["review", "readiness"].includes(index.currentMode ?? "");
  const reviewScope = state.evidence.reviewScope;
  const hasImplementationReviewEvidence = reviewScope.changedPaths.some(isImplementationPath) ||
    reviewScope.reviewedItems.length > 0;

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

  messages.push(...activeWorkMessages(state));
  messages.push(...phaseBoundaryBatchingMessages(state));
  messages.push(...activeWorkFreshnessMessages(state));
  messages.push(...currentTruthMessages(state));
  messages.push(...phaseLedgerMessages(state));
  messages.push(...phaseBypassMessages(state));
  messages.push(...specSliceBoundaryMessages(state));
  messages.push(...phaseExitGateMessages(state));
  messages.push(...grillDecisionDepthMessages(state));
  messages.push(...grillCheckpointMessages(state));
  messages.push(...referencedAutoStrikeDocMessages(state));

  if (index.activeInitiativePath && isExplicitWorkspacePath(index.activeInitiativePath)) {
    const resolved = resolveWorkspacePath(state.repoRoot, index.activeInitiativePath);
    if (!resolved?.safe) {
      messages.push(message("error", "unsafe-active-initiative", index.activeInitiativePath, "Active initiative path is unsafe."));
    } else if (!isInitiativePath(resolved.relativePath)) {
      messages.push(message("error", "invalid-active-initiative-path", resolved.relativePath, "Active initiative must point to auto-strike/initiatives/<initiative-slug>."));
    } else if (!resolved.exists) {
      messages.push(message("error", "missing-active-initiative", resolved.relativePath, "Index declares an active initiative path that does not exist."));
    }
  }

  if (index.activeFeaturePath && isExplicitWorkspacePath(index.activeFeaturePath)) {
    const resolved = resolveWorkspacePath(state.repoRoot, index.activeFeaturePath);
    if (!resolved?.safe) {
      messages.push(message("error", "unsafe-active-feature", index.activeFeaturePath, "Active feature path is unsafe."));
    } else if (!isFeaturePath(resolved.relativePath)) {
      messages.push(message("error", "invalid-active-feature-path", resolved.relativePath, "Active feature must point to auto-strike/initiatives/<initiative-slug>/features/<feature-slug>."));
    } else if (!resolved.exists) {
      messages.push(message("error", "missing-active-feature", resolved.relativePath, "Index declares an active feature path that does not exist."));
    }
  }

  if (index.activeFeaturePath && isFeatureShorthand(index.activeFeaturePath) && !state.activeInitiative.exists) {
    messages.push(message("warning", "feature-shorthand-without-active-initiative", `${WORKSPACE_ROOT}/index.md`, "Feature shorthand can only resolve when Active Work names an existing active initiative."));
  }

  if (state.activeSlice.path && activeFeature.exists && !normalizeEvidencePath(state.activeSlice.path).startsWith(`${activeFeature.path}/slices/`)) {
    messages.push(message("error", "invalid-active-slice-path", state.activeSlice.path, "Active slice must live under the active feature's slices/ directory."));
  }

  if (index.currentMode && ["slice", "build", "review"].includes(index.currentMode) && !activeFeature.exists) {
    messages.push(message("warning", "missing-active-feature", activeFeature.inferredPath ?? `${WORKSPACE_ROOT}/index.md`, "Slice/build/review mode should name an existing active feature inside the active initiative."));
  }

  if (index.currentMode && MODES_EXPECTING_SPEC.has(index.currentMode) && activeFeature.exists && !activeFeature.specExists) {
    messages.push(message("warning", "missing-active-feature-spec", activeFeature.specPath, "Current mode usually expects an active feature-spec.md, but none was found."));
  }

  if (index.currentMode && MODES_EXPECTING_SLICE.has(index.currentMode) && activeFeature.exists && activeFeature.sliceFiles.length === 0) {
    messages.push(message("warning", "missing-active-slice", activeFeature.slicesPath, "Current mode usually expects active slice docs, but none were found."));
  }

  messages.push(...slicePlanningMessages(state));
  messages.push(...staleSliceTaskChecklistMessages(state));
  messages.push(...staleFeatureCheckpointMessages(state));

  const explicitSlicePrepMode = index.currentModeExplicit && index.currentMode && MODES_EXPECTING_SLICE_PREP.has(index.currentMode);
  const implementationEvidenceExists = state.evidence.reviewScope.changedPaths.length > 0 ||
    state.evidence.reviewScope.verifiedItems.length > 0;
  if (explicitSlicePrepMode || implementationEvidenceExists) {
    messages.push(...activeSlicePrepMessages(state.repoRoot, state.activeSlice, explicitSlicePrepMode ? index.currentMode : null));
  }

  if (index.currentMode && MODES_EXPECTING_EVIDENCE.has(index.currentMode) && state.evidence.locations.length === 0) {
    messages.push(message("warning", "missing-evidence", WORKSPACE_ROOT, "Review/readiness mode should have evidence or skipped-check rationale, but none was found."));
  }

  if ((explicitReviewMode || hasImplementationReviewEvidence) && state.evidence.locations.length > 0) {
    const plan = recommendedReviewPlan(state);
    if (state.activeSlice.path && !state.evidence.locations.includes(state.activeSlice.path)) {
      messages.push(message("warning", "missing-active-slice-evidence", state.activeSlice.path, "Active slice has reviewable implementation evidence elsewhere but does not contain evidence itself; review context may fall back to broader feature evidence."));
    }
    if (activeFeature.exists && !["active-slice", "active-feature"].includes(state.evidence.reviewScope.scope)) {
      messages.push(message("warning", "missing-active-feature-evidence", activeFeature.path, "Review context is using broader initiative/workspace evidence because no active feature evidence was found."));
    }
    if (state.evidence.reviewScope.changedPaths.length === 0) {
      messages.push(message("warning", "missing-review-changed-evidence", state.evidence.reviewScope.locations[0] ?? WORKSPACE_ROOT, "Review context has no active Changed list, so reviewer packets may miss implementation files."));
    }
    messages.push(...changedEvidenceDriftMessages(state));
    if (state.evidence.reviewScope.verifiedItems.length === 0) {
      messages.push(message("warning", "missing-review-verified-evidence", state.evidence.reviewScope.locations[0] ?? WORKSPACE_ROOT, "Review context has no active Verified list, so reviewer packets may miss verification evidence."));
    }
    if (state.evidence.reviewScope.changedPaths.length > 0 && state.evidence.reviewScope.verifiedItems.length > 0 && state.evidence.reviewScope.reviewedItems.length === 0) {
      messages.push(message("warning", "missing-reviewed-lens-evidence", state.evidence.reviewScope.locations[0] ?? WORKSPACE_ROOT, "Review/readiness evidence has Changed and Verified lists but no Reviewed list, so it is unclear which review lenses were applied."));
    }
    messages.push(...requiredReviewLensMessages(state, plan));
    messages.push(...verificationCapabilityMessages(state, plan));
    messages.push(...sliceCloseoutSummaryMessages(state));
    if (plan.surfaces.ui.length > 0 && !hasUiReviewCoverage(state.evidence.reviewScope)) {
      messages.push(message("warning", "missing-ui-browser-review-evidence", state.evidence.reviewScope.locations[0] ?? WORKSPACE_ROOT, "UI/browser/user-visible files changed but active evidence has no browser or user-flow check evidence, nor a blocked-browser rationale showing host/manual browser options checked, blocker, replacement evidence, and residual risk."));
    }
    if (needsFreshReviewAgentEvidence(state.evidence.reviewScope) && !hasFreshReviewAgentEvidence(state.evidence.reviewScope)) {
      messages.push(message("warning", "missing-fresh-review-agent-evidence", state.evidence.reviewScope.locations[0] ?? WORKSPACE_ROOT, "Completed meaningful slice review should show a fresh read-only review agent/fresh-context review, or an explicit rationale that review agents were unavailable."));
    }
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

function pathExtension(sourcePath) {
  return path.posix.extname(String(sourcePath ?? "").toLowerCase());
}

function pathSegments(sourcePath) {
  return String(sourcePath ?? "")
    .toLowerCase()
    .split("/")
    .filter(Boolean);
}

function readRepoText(repoRoot, sourcePath) {
  if (!repoRoot || !sourcePath || path.isAbsolute(sourcePath) || String(sourcePath).split(/[\\/]+/).includes("..")) {
    return "";
  }
  return readFileIfPresent(path.join(repoRoot, sourcePath)) ?? "";
}

function isUiChangedPath(sourcePath, repoRoot) {
  const extension = pathExtension(sourcePath);
  if (UI_EXTENSIONS.has(extension)) return true;
  if (!UI_SCRIPT_EXTENSIONS.has(extension)) return false;
  if (pathSegments(sourcePath).some((segment) => UI_PATH_SEGMENTS.has(segment))) return true;
  const text = readRepoText(repoRoot, sourcePath);
  return /\b(document|window)\s*\.|\b(querySelector|addEventListener|classList|innerHTML|localStorage|sessionStorage|customElements)\b|from\s+["']react["']|React\.createElement|return\s*\(?\s*<[A-Za-z]/.test(text);
}

function isDataChangedPath(sourcePath) {
  return DATA_EXTENSIONS.has(pathExtension(sourcePath)) || DATA_PATH_PATTERN.test(String(sourcePath ?? ""));
}

function isSecurityChangedPath(sourcePath) {
  return SECURITY_PATH_PATTERN.test(String(sourcePath ?? ""));
}

function isIntegrationChangedPath(sourcePath) {
  return INTEGRATION_PATH_PATTERN.test(String(sourcePath ?? "")) || ROUTE_HANDLER_PATTERN.test(String(sourcePath ?? ""));
}

function isImplementationPath(sourcePath) {
  return !String(sourcePath ?? "").startsWith(`${WORKSPACE_ROOT}/`);
}

function classifyChangedPaths(changedPaths, repoRoot) {
  const implementation = changedPaths.filter(isImplementationPath);
  return {
    implementation,
    ui: implementation.filter((sourcePath) => isUiChangedPath(sourcePath, repoRoot)),
    data: implementation.filter(isDataChangedPath),
    security: implementation.filter(isSecurityChangedPath),
    integration: implementation.filter(isIntegrationChangedPath),
  };
}

function lensEntry(lens, reason) {
  return {
    lens,
    title: LENSES[lens].title,
    reason,
  };
}

function addLens(target, seen, lens, reason) {
  if (seen.has(lens)) return;
  seen.add(lens);
  target.push(lensEntry(lens, reason));
}

function recommendedReviewPlan(state) {
  const changedPaths = state.evidence.reviewScope.changedPaths;
  const surfaces = classifyChangedPaths(changedPaths, state.repoRoot);
  const required = [];
  const optional = [];
  const requiredSeen = new Set();
  const optionalSeen = new Set();

  addLens(required, requiredSeen, "functionality", "Baseline slice review: prove the changed behavior works end to end.");
  addLens(required, requiredSeen, "spec-coverage", "Baseline slice review: compare implementation against the active spec, slice, and non-goals.");
  addLens(required, requiredSeen, "code-quality", "Baseline slice review: check maintainability, blast radius, naming, tests, and boundaries.");

  if (surfaces.ui.length > 0) {
    addLens(required, requiredSeen, "ui-regression", "UI files changed; check visual/layout regressions, selector scope, responsive states, and interaction states.");
    addLens(required, requiredSeen, "user-flows", "UI files changed; check happy, invalid, cancel, retry, keyboard, mobile, and recovery flows.");
    addLens(optional, optionalSeen, "accessibility", "UI changed; run this separately when accessibility risk is meaningful or browser evidence is available.");
  }

  if (surfaces.data.length > 0) {
    addLens(required, requiredSeen, "state-data-integrity", "Data, state, schema, storage, or persistence paths changed.");
    addLens(required, requiredSeen, "edge-cases", "State/data changes need duplicate, stale, missing, invalid, concurrent, and destructive cases checked.");
  }

  if (surfaces.security.length > 0) {
    addLens(required, requiredSeen, "security-privacy", "Security, privacy, auth, permissions, payments, tokens, or secrets paths changed.");
  }

  if (surfaces.integration.length > 0) {
    addLens(required, requiredSeen, "integration-risk", "API, external service, upload, provider, webhook, queue, or server boundary paths changed.");
  }

  if (surfaces.implementation.length > 0 && surfaces.data.length === 0) {
    addLens(optional, optionalSeen, "edge-cases", "Implementation changed; use when inputs, states, destructive actions, or failure paths carry risk.");
  }

  const notes = [];
  if (changedPaths.length === 0) {
    notes.push("No active Changed list was found; review-context may miss implementation files until slice evidence is updated.");
  }
  if (surfaces.ui.length > 0) {
    notes.push("For UI/browser/user-visible changes, include browser or user-flow evidence. Use host/manual browser tooling when available; if browser access is actually blocked, record the blocker and a static UI regression fallback.");
  }
  if (reviewScopeNeedsCapabilityRecord(state.evidence.reviewScope, surfaces)) {
    notes.push("Record Verification Capability for skipped checks or UI/auth/integration work: repo checks, host/manual browser or user-flow options, install constraints, blockers, replacement evidence, and residual risk.");
  }

  return {
    evidenceScope: state.evidence.reviewScope.scope,
    changedPaths,
    surfaces,
    required,
    optional: optional.filter((item) => !requiredSeen.has(item.lens)),
    notes,
  };
}

function reviewScopeNeedsCapabilityRecord(reviewScope, surfaces) {
  return reviewScope.skippedItems.length > 0 ||
    surfaces.ui.length > 0 ||
    surfaces.security.length > 0 ||
    surfaces.integration.length > 0;
}

function normalizedEvidenceText(value) {
  return String(value ?? "").toLowerCase();
}

function reviewItemMentionsLens(value, lens) {
  const text = normalizedEvidenceText(value);
  if (text.includes(lens)) return true;
  return Object.entries(LENS_ALIASES).some(([alias, canonical]) => canonical === lens && text.includes(alias));
}

function reviewItemHasConcreteOutcome(value) {
  const text = String(value ?? "");
  if (!sectionHasSubstance(text)) return false;
  if (/\b(todo|tbd|pending|not yet|not started|placeholder|fill in)\b/i.test(text)) return false;
  return /\b(pass(?:ed)?|fail(?:ed)?|blockers?|warnings?|findings?|accepted|approved|defer(?:red)?|skip(?:ped)?|no\s+blockers?|fixed|resolved)\b/i.test(text);
}

function skippedItemHasConcreteReason(value) {
  const text = String(value ?? "");
  if (!sectionHasSubstance(text)) return false;
  if (/\b(todo|tbd|pending|not yet|not started|placeholder|fill in)\b/i.test(text)) return false;
  return /\s[-:;]\s+\S+/.test(text) && text.trim().length >= 20;
}

function hasReviewedLens(reviewScope, lens) {
  return reviewScope.reviewedItems.some((item) => reviewItemMentionsLens(item, lens) && reviewItemHasConcreteOutcome(item));
}

function hasSkippedLensRationale(reviewScope, lens) {
  return reviewScope.skippedItems.some((item) => reviewItemMentionsLens(item, lens) && skippedItemHasConcreteReason(item));
}

function requiredReviewLensMessages(state, plan = recommendedReviewPlan(state)) {
  const reviewScope = state.evidence.reviewScope;
  if (reviewScope.changedPaths.length === 0 || reviewScope.verifiedItems.length === 0) return [];

  const messages = [];
  const messagePath = reviewScope.locations[0] ?? WORKSPACE_ROOT;
  for (const item of plan.required) {
    if (hasReviewedLens(reviewScope, item.lens) || hasSkippedLensRationale(reviewScope, item.lens)) continue;
    messages.push(message("warning", "missing-required-review-lens", messagePath, `Review plan requires ${item.lens}, but active evidence does not include a concrete Reviewed outcome or Skipped rationale for that lens.`));
  }
  return messages;
}

function hasBrowserReviewEvidenceItem(item) {
  const text = String(item ?? "");
  if (/\b(curl|httpie|wget|api|GET|POST|PUT|PATCH|DELETE)\b/i.test(text) && !/\b(browser|visual|screenshot|viewport|responsive|mobile|desktop|playwright|chrom(e|ium)|safari|firefox)\b/i.test(text)) {
    return false;
  }
  return /\b(browser|visual|screenshot|viewport|responsive|mobile|desktop|playwright|chrom(e|ium)|safari|firefox)\b/i.test(text);
}

function hasBlockedBrowserFallback(item) {
  const text = String(item ?? "");
  const mentionsBrowserSurface = /\b(browser|visual|screenshot|viewport|responsive|mobile|desktop|rendered|layout|playwright|chrom(e|ium)|safari|firefox)\b/i.test(text);
  if (!mentionsBrowserSurface) return false;
  const hasRealBlocker = /\b(blocked|unavailable|not available|cannot|can't|could not|unable|no access|no host browser|no browser tool|browser tool unavailable|browser access unavailable|gui unavailable|headless unavailable|server could not start|auth blocked|environment restriction)\b/i.test(text);
  if (!hasRealBlocker) return false;
  const checkedHostOrManualOption = /\b(host browser|host\/manual|manual browser|browser tool|codex browser|chrome|computer use|gui access|checked host|checked manual|checked browser|inspected host|looked for host|looked for manual)\b/i.test(text);
  if (!checkedHostOrManualOption) return false;
  const namesReplacementEvidence = /\b(replacement evidence|replacement|fallback|static review|static ui|smoke|syntax|api flow|manual code review)\b/i.test(text);
  if (!namesReplacementEvidence) return false;
  const namesResidualRisk = /\b(residual risk|risk left open|remaining risk|open risk)\b/i.test(text);
  if (!namesResidualRisk) return false;
  return !/\b(no browser automation dependency|no playwright|no browser dependency|package installs? (?:are|is) out of scope|no .*dependency exists in this repo)\b/i.test(text);
}

function hasUiReviewCoverage(reviewScope) {
  return reviewScope.verifiedItems.some(hasBrowserReviewEvidenceItem) ||
    reviewScope.reviewedItems.some(hasBrowserReviewEvidenceItem) ||
    reviewScope.skippedItems.some(hasBlockedBrowserFallback);
}

function verificationCapabilitySectionIsValid(sliceText) {
  if (!hasSection(sliceText, "Verification Capability")) return false;
  const section = extractSection(sliceText, "Verification Capability");
  if (!sectionHasSubstance(section)) return false;
  const text = normalizeText(section);
  const namesRepoChecks = /\b(repo|script|scripts|command|commands|check|checks|test|tests|lint|build|typecheck|node|pnpm|curl|api)\b/i.test(text);
  const namesHostOrManualChecks = /\b(host|manual|browser|chrome|chromium|safari|firefox|computer use|codex browser|playwright|cypress|viewport|responsive|user[- ]flow|api|curl)\b/i.test(text);
  const namesConstraintsOrFallback = /\b(blocked|blocker|available|unavailable|not available|allowed|not allowed|constraint|constraints|install|package|fallback|replacement|residual risk|skipped|none|n\/a)\b/i.test(text);
  return namesRepoChecks && namesHostOrManualChecks && namesConstraintsOrFallback;
}

function needsVerificationCapability(reviewScope, plan) {
  return reviewScopeNeedsCapabilityRecord(reviewScope, plan.surfaces);
}

function verificationCapabilityMessages(state, plan) {
  const reviewScope = state.evidence.reviewScope;
  if (!needsVerificationCapability(reviewScope, plan)) return [];
  if (!state.activeSlice.path || !state.activeSlice.exists) return [];

  const sliceText = readFileIfPresent(path.join(state.repoRoot, state.activeSlice.path));
  if (verificationCapabilitySectionIsValid(sliceText ?? "")) return [];

  return [
    message("warning", "missing-verification-capability", state.activeSlice.path, "Active review evidence has skipped checks or UI/auth/integration surfaces, but the slice lacks concrete Verification Capability. Record repo checks, host/manual browser or user-flow options, install constraints, blocked checks, and replacement evidence before accepting fallback verification."),
  ];
}

function reviewedItemsLookComplete(reviewedItems) {
  if (!reviewedItems.some(reviewItemHasConcreteOutcome)) return false;
  return !reviewedItems.some((item) => {
    const text = String(item ?? "");
    if (/\b(no remaining blockers?|no blockers?|blockers? resolved|fixed blockers?)\b/i.test(text)) return false;
    return /\b(blocker|blocking|failed?|unresolved|open finding|open issue)\b/i.test(text);
  });
}

function sliceEvidenceLooksComplete(reviewScope) {
  return reviewScope.scope === "active-slice" &&
    reviewScope.changedPaths.length > 0 &&
    reviewScope.verifiedItems.length > 0 &&
    reviewedItemsLookComplete(reviewScope.reviewedItems);
}

function closeoutSummarySectionIsValid(sliceText) {
  if (!hasSection(sliceText, "Closeout Summary")) return false;
  const section = extractSection(sliceText, "Closeout Summary");
  if (!sectionHasSubstance(section)) return false;
  if (/\[[^\]]+\]/.test(section)) return false;
  if (markdownListItems(section).length < 5) return false;
  return /\bImplemented\s+Slice\b/i.test(section) &&
    /^Built:\s*$/im.test(section) &&
    /^Validation passed:\s*$/im.test(section) &&
    /^Review:\s*$/im.test(section) &&
    /^(Skipped \/ residual risk|Skipped|Residual risk):\s*$/im.test(section) &&
    /^Docs:\s*$/im.test(section) &&
    /^Next:\s*$/im.test(section);
}

function sliceCloseoutSummaryMessages(state) {
  const reviewScope = state.evidence.reviewScope;
  if (!sliceEvidenceLooksComplete(reviewScope)) return [];
  if (!state.activeSlice.path || !state.activeSlice.exists) return [];

  const sliceText = readFileIfPresent(path.join(state.repoRoot, state.activeSlice.path));
  if (closeoutSummarySectionIsValid(sliceText ?? "")) return [];

  return [
    message("warning", "missing-slice-closeout-summary", state.activeSlice.path, "Active slice has Changed, Verified, and Reviewed evidence but lacks a substantive Closeout Summary. Add a compact user-facing receipt with built work, validation, review status, skipped/residual risk, docs, and next action."),
  ];
}

function hasFreshReviewAgentEvidence(reviewScope) {
  const reviewText = [
    ...reviewScope.reviewedItems,
    ...reviewScope.skippedItems,
  ].join("\n");
  return /\b(subagent|sub-agent|review agent|fresh[- ]context|fresh eyes|fresh reviewer|independent reviewer|read-only reviewer|read-only review)\b/i.test(reviewText);
}

function needsFreshReviewAgentEvidence(reviewScope) {
  return reviewScope.changedPaths.some(isImplementationPath) &&
    reviewScope.verifiedItems.length > 0 &&
    reviewScope.reviewedItems.length > 0;
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
      "You are a read-only review agent. Return findings to the main agent for synthesis and evaluation.",
      "Do not edit files, fix issues, change docs, change package files, run formatters that write files, commit, change scope, or present conclusions directly to the user.",
      "Read the source paths before judging when they are available.",
      "For UI, browser behavior, auth/session, routing, forms, responsive layout, or user-visible state, perform or request browser/user-flow checks and report what was actually verified. A repo missing Playwright or another browser package is not, by itself, a browser-check blocker.",
    ],
    focus: LENSES[lens].focus,
    sourcePaths: reviewSourcePathGroups(validation),
    state: validation,
  };
}

export function reviewPlan(options = {}) {
  const validation = validateAutoStrike(options);
  return {
    ...recommendedReviewPlan(validation),
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
    `- Initiative: ${state.activeInitiative.path ?? state.index.activeInitiativeRaw ?? "None"}`,
    `- Feature: ${state.activeFeature.path ?? state.index.activeFeatureRaw ?? "None"}`,
    `- Mode: ${state.index.currentMode ?? "Unknown"}`,
    `- Active doc: ${state.index.activeWork.docPath ?? "Unknown"}`,
    `- Active state: ${state.index.activeWork.state ?? "Unknown"}`,
    `- Slice: ${state.index.activeSliceRaw ?? (state.activeFeature.sliceFiles[0] ?? "None")}`,
    `- Phase ledger: ${state.phaseLedger.present ? state.phaseLedger.path : "Missing"}`,
    `- Language: ${state.language.present ? state.language.path : "Missing"}`,
    `- Initiative decisions: ${state.activeInitiative.decisionsExists ? state.activeInitiative.decisionsPath : "Missing"}`,
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

function renderReviewPlanMarkdown(plan) {
  const lines = [
    "# Auto Strike Review Plan",
    "",
    `- Evidence scope: ${plan.evidenceScope}`,
    `- Changed paths: ${plan.changedPaths.length}`,
    "",
    "## Required Lenses",
    ...plan.required.map((item) => `- ${item.lens} - ${item.reason}`),
    "",
    "## Optional Lenses",
    ...(plan.optional.length > 0 ? plan.optional.map((item) => `- ${item.lens} - ${item.reason}`) : ["- None"]),
    "",
    "## Surface Triggers",
    ...renderSurfaceTriggers(plan.surfaces),
    "",
    "## Notes",
    ...bulletLines(plan.notes),
    "",
    "## Suggested Review Packets",
    ...plan.required.map((item) => `- review-context --lens ${item.lens}`),
  ];
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
    `- Active initiative: ${state.activeInitiative.path ?? state.index.activeInitiativeRaw ?? "None"}`,
    `- Active feature: ${state.activeFeature.path ?? state.index.activeFeatureRaw ?? "None"}`,
    `- Current mode: ${state.index.currentMode ?? "Unknown"}`,
    `- Active doc: ${state.index.activeWork.docPath ?? "Unknown"}`,
    `- Active state: ${state.index.activeWork.state ?? "Unknown"}`,
    `- Declared next best action: ${state.index.nextBestAction ?? "None"}`,
    `- Evidence scope: ${state.evidence.reviewScope.scope}${state.evidence.reviewScope.usedFallback ? " (fallback)" : ""}`,
    "",
    "## Source Paths",
    ...renderSourcePathGroups(packet.sourcePaths),
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
    "- Include browser-observed behavior for UI/user-flow findings when relevant.",
    "- Mark non-blocking suggestions separately from blockers.",
    "- Return results to the main agent for synthesis and evaluation.",
  ];
  return `${lines.join("\n").trimEnd()}\n`;
}

function renderSourcePathGroups(groups) {
  const lines = [];
  for (const group of groups) {
    if (!group.paths || group.paths.length === 0) continue;
    lines.push(`### ${group.title}`);
    lines.push(...bulletLines(group.paths));
    lines.push("");
  }
  return lines.length > 0 ? lines.slice(0, -1) : ["- None"];
}

function renderSurfaceTriggers(surfaces) {
  const labels = [
    ["ui", "UI"],
    ["data", "State/Data"],
    ["security", "Security/Privacy"],
    ["integration", "Integration/API"],
  ];
  const lines = [];
  for (const [key, label] of labels) {
    if (!surfaces[key] || surfaces[key].length === 0) continue;
    lines.push(`### ${label}`);
    lines.push(...bulletLines(surfaces[key]));
    lines.push("");
  }
  return lines.length > 0 ? lines.slice(0, -1) : ["- None"];
}

function reviewSourcePathGroups(state) {
  const activeDocs = filterExistingSourcePaths(state, [
    `${WORKSPACE_ROOT}/index.md`,
    state.activeInitiative.ideaExists ? state.activeInitiative.ideaPath : null,
    state.activeInitiative.decisionsExists ? state.activeInitiative.decisionsPath : null,
    state.activeInitiative.grillExists ? state.activeInitiative.grillPath : null,
    state.activeInitiative.specExists ? state.activeInitiative.specPath : null,
    state.activeFeature.specExists ? state.activeFeature.specPath : null,
    state.activeSlice.exists ? state.activeSlice.path : null,
    state.activeFeature.readinessExists ? state.activeFeature.readinessPath : null,
    state.activeInitiative.readinessExists ? state.activeInitiative.readinessPath : null,
  ]);
  const usedPaths = new Set(activeDocs);

  const changedFiles = filterExistingSourcePaths(state, state.evidence.reviewScope.changedPaths.filter((sourcePath) => {
    return !sourcePath.startsWith(`${WORKSPACE_ROOT}/`);
  })).filter((sourcePath) => !usedPaths.has(sourcePath));
  for (const sourcePath of changedFiles) usedPaths.add(sourcePath);

  const workspaceDocs = filterExistingSourcePaths(state, [
    `${WORKSPACE_ROOT}/todo.md`,
    `${WORKSPACE_ROOT}/language.md`,
    ...state.evidence.reviewScope.changedPaths.filter((sourcePath) => sourcePath.startsWith(`${WORKSPACE_ROOT}/`)),
  ]).filter((sourcePath) => !usedPaths.has(sourcePath));
  for (const sourcePath of workspaceDocs) usedPaths.add(sourcePath);

  const contextDocs = filterExistingSourcePaths(state, [
    ...state.index.keyDocs.map((item) => resolveRepoReferencePath(state.repoRoot, item.path))
      .filter((item) => item?.exists)
      .map((item) => item.relativePath),
    ...state.activeFeature.sliceFiles.filter((sourcePath) => sourcePath !== state.activeSlice.path),
  ]).filter((sourcePath) => !usedPaths.has(sourcePath));

  return [
    { title: "Active Docs", paths: activeDocs },
    { title: "Changed Files From Active Evidence", paths: changedFiles },
    { title: "Workspace Docs", paths: workspaceDocs },
    { title: "Context Docs", paths: contextDocs },
  ].map((group) => ({
    ...group,
    paths: [...new Set(group.paths)],
  }));
}

function filterExistingSourcePaths(state, paths) {
  return paths.filter(Boolean).filter((sourcePath) => {
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
    "Usage: auto-strike.mjs <inspect|validate|review-plan|review-context> [--repo-root <path>] [--json]",
    "",
    "Commands:",
    "  inspect                         Report observed Auto Strike workspace state.",
    "  validate                        Warn about contradictions and missing evidence.",
    "  review-plan                     Recommend review lenses from active Changed evidence.",
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

  if (command === "review-plan") {
    const result = reviewPlan(options);
    printResult(options, result, renderReviewPlanMarkdown);
    return result.state.summary.errors > 0 ? 1 : 0;
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
