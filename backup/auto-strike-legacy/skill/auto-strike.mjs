#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SCRIPT_FILE = fileURLToPath(import.meta.url);
const WORKSPACE_ROOT = "auto-strike";
const LANGUAGE_FILE = "UBIQUITOUS_LANGUAGE.md";
const VALID_MODES = new Set(["brainstorm", "grill", "spec", "slice", "build", "review", "readiness"]);
const MODES_EXPECTING_SPEC = new Set(["slice", "build", "review", "readiness"]);
const MODES_EXPECTING_SLICE = new Set(["build", "review", "readiness"]);
const MODES_EXPECTING_SLICE_PREP = new Set(["build", "review", "readiness"]);
const MODES_EXPECTING_EVIDENCE = new Set(["review", "readiness"]);
const RECOVERY_BLOCKING_MODES = new Set(["build", "review", "readiness"]);
const RECOVERY_POINTER_REQUIRED_MODES = new Set(["build", "readiness"]);
const MODES_REQUIRING_GRILL_CHECKPOINT = new Set(["spec", "slice", "build", "review", "readiness"]);
const VALID_DECISION_DEPTH_LEVELS = new Set(["lean", "standard", "deep"]);
const MODE_LEDGER_ORDER = ["brainstorm", "grill", "spec", "slice", "build", "review", "readiness"];
const MODE_LEDGER_BY_MODE = {
  spec: ["brainstorm", "grill", "spec"],
  slice: ["brainstorm", "grill", "spec", "slice"],
  build: ["brainstorm", "grill", "spec", "slice", "build"],
  review: ["brainstorm", "grill", "spec", "slice", "build", "review"],
  readiness: ["brainstorm", "grill", "spec", "slice", "build", "review", "readiness"],
};
const MODE_LEDGER_COMPLETE_STATUSES = new Set(["done", "complete", "completed", "compressed", "skipped", "replaced"]);
const MODE_LEDGER_ACTIVE_STATUSES = new Set([...MODE_LEDGER_COMPLETE_STATUSES, "in-progress", "active", "blocked", "paused"]);
const ACTIVE_WORK_DOC_FILES = new Set([
  "idea.md",
  "grill.md",
  "spec.md",
  "phase-spec.md",
  "feature-spec.md",
  "readiness.md",
]);
const SLICE_DOC_PATTERN = /\/slices\/slice-\d+[^/]*\.md$/i;
const SLICE_SIZE_PATTERN = /^(XS|S|M|L|XL)$/i;
const HARD_BATCHED_SLICE_TITLE_PATTERN = /\b(full|complete|mvp)\b|setup\s+(front[- ]?end|back[- ]?end|backend|frontend)|front[- ]?end\s+(and|\/|\+|&)\s+back[- ]?end|back[- ]?end\s+(and|\/|\+|&)\s+front[- ]?end/i;
const AND_SLICE_TITLE_PATTERN = /\band\b/i;
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
      "Mobile or constrained-device flows when the phase has a UI.",
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
      "Gaps that block the user from running or opening the phase.",
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
const STRIPE_SCOPE_PATTERN = /\b(stripe|checkout session|checkout\.sessions?|payment\s*intent|paymentintent|payment_intent|subscription|invoice|billing portal|customer portal|webhook signing secret|stripe webhook|payment method|payment_method|setup intent|setupintent|refund|dispute|charge|stripe tax|test clock)\b/i;
const STRIPE_CONNECT_SCOPE_PATTERN = /\b(stripe connect|connected accounts?|connect account|account links?|account sessions?|express account|custom account|standard account|destination charges?|direct charges?|separate charges?|transfers?|payouts?|application fees?|platform account|stripe-account)\b/i;
const STRIPE_CLI_PATTERN = /\bstripe\s+(?:--version|listen|trigger|logs|customers?|payment_intents?|checkout|subscriptions?|invoices?|accounts?|account_links?|account_sessions?|transfers?|payouts?|refunds?|events?|products?|prices?)\b|\bstripe\b.{0,80}\b(?:cli|sandbox|test mode|listen|trigger|webhook|payment_intent|checkout session|connected account|account link|transfer|payout|application fee)\b/i;
const STRIPE_SANDBOX_PATTERN = /\b(sandbox|test mode|test account|test key|test card|test clock|pk_test|sk_test|whsec_|evt_|pi_|cs_test_|cus_|sub_|in_|price_|prod_|acct_|tr_|po_|re_|ch_)\b/i;
const STRIPE_CONNECT_SKILL_PATTERN = /\bstripe-connect\b/i;

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
  const directMarkers = ["index.md", "todo.md"];
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
    .replace(/^\[[^\]]+\]\(([^)]+)\)$/, "$1")
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
  const markdownLink = text.match(/\[[^\]]+\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/);
  if (markdownLink) return markdownLink[1].trim();
  const codeMatch = text.match(/`([^`]+)`/);
  if (codeMatch) return codeMatch[1].trim();
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
  const duplicateLabels = ["Initiative", "Phase", "Feature", "Doc", "Slice", "Active slice", "Current slice", "Current mode", "Mode", "State", "Next", "Blocked by"]
    .filter((label) => parseLabeledItems(items, label).length > 1);
  const initiativeRaw = usefulValue(parseLabeledItem(items, "Initiative"));
  const phaseLabelRaw = usefulValue(parseLabeledItem(items, "Phase"));
  const legacyFeatureRaw = usefulValue(parseLabeledItem(items, "Feature"));
  const phaseRaw = phaseLabelRaw ?? legacyFeatureRaw;
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
    phaseRaw,
    phasePath: phaseRaw ? extractInlinePath(phaseRaw) : null,
    phaseLabelRaw,
    legacyFeatureRaw,
    legacyFeaturePath: legacyFeatureRaw ? extractInlinePath(legacyFeatureRaw) : null,
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
  if (basename === "spec.md" || basename === "phase-spec.md" || basename === "feature-spec.md") return "spec";
  return null;
}

function parseIndex(indexText) {
  if (!indexText) {
    return {
      present: false,
      activeInitiativeRaw: null,
      activeInitiativePath: null,
      activePhaseRaw: null,
      activePhasePath: null,
      currentMode: null,
      currentModeExplicit: false,
      activeSliceRaw: null,
      activeWork: {
        text: "",
        initiativeRaw: null,
        initiativePath: null,
        phaseRaw: null,
        phasePath: null,
        phaseLabelRaw: null,
        legacyFeatureRaw: null,
        legacyFeaturePath: null,
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
  const docSlicePath = activeWork.docPath && SLICE_DOC_PATTERN.test(normalizeEvidencePath(activeWork.docPath))
    ? activeWork.docPath
    : null;
  const slicePathLooksExplicit = activeWork.slicePath && isExplicitWorkspacePath(activeWork.slicePath);
  const activeSliceRaw = docSlicePath && !slicePathLooksExplicit
    ? docSlicePath
    : activeWork.slicePath ?? docSlicePath;

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
    activePhaseRaw: activeWork.phaseRaw,
    activePhasePath: activeWork.phasePath,
    activeFeatureRaw: activeWork.legacyFeatureRaw,
    activeFeaturePath: activeWork.legacyFeaturePath,
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
  if (/\bvalidate\b|\bvalidation\b|\bverify\b|\bverification\b|\breadiness\b/.test(text)) return "readiness";
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

function modeLedgerRowRank(row) {
  if (!row?.status || row.status === "pending") return 0;
  if (["blocked", "paused"].includes(row.status)) return 1;
  if (row.status === "in-progress" || MODE_LEDGER_COMPLETE_STATUSES.has(row.status)) return 2;
  return 1;
}

function chooseModeLedgerRow(previous, next) {
  if (!previous) return next;
  const previousRank = modeLedgerRowRank(previous);
  const nextRank = modeLedgerRowRank(next);
  if (nextRank > previousRank) return next;
  if (nextRank < previousRank) return previous;
  return next;
}

function parseModeLedger(sectionText) {
  const rows = new Map();
  const occurrences = new Map();
  for (const line of normalizeText(sectionText).split("\n")) {
    const cells = parseTableCells(line);
    if (!cells) continue;
    const phase = normalizeLedgerPhase(cells[0]);
    if (!phase || !MODE_LEDGER_ORDER.includes(phase)) continue;
    const row = {
      phase,
      statusRaw: cells[1] ?? "",
      status: normalizeLedgerStatus(cells[1] ?? ""),
      artifact: cells[2] ?? "",
      reason: cells.slice(3).join(" | "),
      raw: line.trim(),
    };
    rows.set(phase, chooseModeLedgerRow(rows.get(phase), row));
    occurrences.set(phase, [...(occurrences.get(phase) ?? []), row]);
  }
  const duplicates = Object.fromEntries(
    [...occurrences.entries()]
      .filter(([, phaseRows]) => phaseRows.length > 1)
      .map(([phase, phaseRows]) => [phase, phaseRows.map((row) => row.raw)]),
  );
  return { rows, duplicates };
}

function findModeLedger(repoRoot, indexText, markdownFiles, activeInitiative) {
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
    let section = extractSection(text, "Mode Ledger");
    let legacyName = false;
    if (!sectionHasSubstance(section)) {
      section = extractSection(text, "Phase Ledger");
      legacyName = sectionHasSubstance(section);
    }
    if (!sectionHasSubstance(section)) continue;
    const modeLedger = parseModeLedger(section);
    return {
      present: true,
      path: candidate,
      legacyName,
      rows: Object.fromEntries(modeLedger.rows),
      duplicates: modeLedger.duplicates,
    };
  }

  return {
    present: false,
    path: activeInitiative.ideaPath ?? activeInitiative.path ?? `${WORKSPACE_ROOT}/index.md`,
    legacyName: false,
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
    checkedItems,
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

function evidenceItemClaimsBlockedOrNotRun(value) {
  return /\b(skip|skipped|not performed|not run|not verified|not checked|pending|not yet|not started|unable|unavailable|blocked|not available|cannot|can't|could not|fallback|replacement evidence|static review|source review|code review)\b/i.test(String(value ?? ""));
}

function hasPositiveVerificationEvidenceItem(value) {
  return sectionHasSubstance(value) && !evidenceItemClaimsBlockedOrNotRun(value);
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

function isPhasePath(sourcePath) {
  return new RegExp(`^${escapeRegExp(WORKSPACE_ROOT)}/initiatives/[^/]+/phases/[^/]+$`).test(normalizeEvidencePath(sourcePath));
}

function isLegacyFeaturePath(sourcePath) {
  return new RegExp(`^${escapeRegExp(WORKSPACE_ROOT)}/initiatives/[^/]+/features/[^/]+$`).test(normalizeEvidencePath(sourcePath));
}

function isPhaseShorthand(sourcePath) {
  const value = String(sourcePath ?? "").trim().replace(/^`|`$/g, "");
  return Boolean(value) && !value.includes("/") && !isPlaceholder(value) && !isNoneItem(value);
}

function inferInitiativePath(index) {
  const candidates = [
    index.activeInitiativePath,
    index.activePhasePath,
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
      phasesPath: null,
      phaseDirs: [],
      legacyFeaturesPath: null,
      legacyFeatureDirs: [],
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
  const phasesPath = path.join(resolved.absolutePath, "phases");
  const legacyFeaturesPath = path.join(resolved.absolutePath, "features");
  const readinessPath = path.join(resolved.absolutePath, "readiness.md");
  const phaseDirs = inspectPath(phasesPath)?.isDirectory()
    ? fs.readdirSync(phasesPath, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => posix(path.join(resolved.relativePath, "phases", entry.name)))
      .sort()
    : [];
  const legacyFeatureDirs = inspectPath(legacyFeaturesPath)?.isDirectory()
    ? fs.readdirSync(legacyFeaturesPath, { withFileTypes: true })
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
    phasesPath: displayPath(phasesPath, repoRoot),
    phaseDirs,
    legacyFeaturesPath: displayPath(legacyFeaturesPath, repoRoot),
    legacyFeatureDirs,
    featuresPath: displayPath(phasesPath, repoRoot),
    featureDirs: phaseDirs,
    readinessPath: displayPath(readinessPath, repoRoot),
    readinessExists: Boolean(inspectPath(readinessPath)?.isFile()),
  };
}

function resolveActivePhasePath(repoRoot, rawPath, activeInitiative) {
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
    const relativePath = posix(path.join(activeInitiative.path, "phases", cleaned));
    const legacyRelativePath = posix(path.join(activeInitiative.path, "features", cleaned));
    const absolutePath = path.join(repoRoot, relativePath);
    const legacyAbsolutePath = path.join(repoRoot, legacyRelativePath);
    if (!fs.existsSync(absolutePath) && fs.existsSync(legacyAbsolutePath)) {
      return {
        raw: rawPath,
        safe: true,
        relativePath: legacyRelativePath,
        absolutePath: legacyAbsolutePath,
        exists: true,
        legacyFeaturePath: true,
      };
    }
    return {
      raw: rawPath,
      safe: true,
      relativePath,
      absolutePath,
      exists: fs.existsSync(absolutePath),
      legacyFeaturePath: false,
    };
  }
  if ((cleaned.startsWith("phases/") || cleaned.startsWith("features/")) && activeInitiative.path) {
    const relativePath = posix(path.join(activeInitiative.path, cleaned));
    const absolutePath = path.join(repoRoot, relativePath);
    return {
      raw: rawPath,
      safe: true,
      relativePath,
      absolutePath,
      exists: fs.existsSync(absolutePath),
      legacyFeaturePath: cleaned.startsWith("features/"),
    };
  }
  return resolveWorkspacePath(repoRoot, cleaned);
}

function activePhaseState(repoRoot, index, activeInitiative) {
  const resolved = resolveActivePhasePath(repoRoot, index.activePhasePath, activeInitiative);
  if (!resolved || !resolved.safe || !resolved.exists || !inspectPath(resolved.absolutePath)?.isDirectory()) {
    return {
      raw: index.activePhasePath,
      path: null,
      inferredPath: resolved?.safe ? resolved.relativePath : null,
      exists: Boolean(resolved?.exists),
      specPath: null,
      specExists: false,
      slicesPath: null,
      sliceFiles: [],
      readinessPath: null,
      readinessExists: false,
      legacyFeaturePath: Boolean(resolved?.legacyFeaturePath),
    };
  }

  const legacyFeaturePath = Boolean(resolved.legacyFeaturePath) || isLegacyFeaturePath(resolved.relativePath);
  const specPath = path.join(resolved.absolutePath, legacyFeaturePath ? "feature-spec.md" : "phase-spec.md");
  const slicesPath = path.join(resolved.absolutePath, "slices");
  const readinessPath = path.join(resolved.absolutePath, "readiness.md");
  const sliceFiles = inspectPath(slicesPath)?.isDirectory()
    ? fs.readdirSync(slicesPath, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => posix(path.join(resolved.relativePath, "slices", entry.name)))
      .sort()
    : [];

  return {
    raw: index.activePhasePath,
    path: resolved.relativePath,
    inferredPath: resolved.relativePath,
    exists: true,
    specPath: displayPath(specPath, repoRoot),
    specExists: Boolean(inspectPath(specPath)?.isFile()),
    slicesPath: displayPath(slicesPath, repoRoot),
    sliceFiles,
    readinessPath: displayPath(readinessPath, repoRoot),
    readinessExists: Boolean(inspectPath(readinessPath)?.isFile()),
    legacyFeaturePath,
  };
}

function activeSliceState(repoRoot, index, activePhase) {
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
  if (activePhase.path && !cleaned.includes("/")) {
    const relativePath = posix(path.join(activePhase.path, "slices", cleaned));
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

function activePhaseSliceDocs(activePhase) {
  return activePhase.sliceFiles.filter((sourcePath) => SLICE_DOC_PATTERN.test(sourcePath));
}

function activePhaseSliceIndexPath(activePhase) {
  return activePhase.path ? `${activePhase.path}/slices/index.md` : null;
}

function phaseStateFromPath(repoRoot, phasePath, raw = phasePath) {
  const normalized = normalizeEvidencePath(phasePath);
  const absolutePath = path.join(repoRoot, normalized);
  const legacyFeaturePath = isLegacyFeaturePath(normalized);
  if ((!isPhasePath(normalized) && !legacyFeaturePath) || !inspectPath(absolutePath)?.isDirectory()) return null;
  const specPath = path.join(absolutePath, legacyFeaturePath ? "feature-spec.md" : "phase-spec.md");
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
    legacyFeaturePath,
  };
}

function inferredPhaseFromActiveSlice(repoRoot, activeSlice) {
  if (!activeSlice.path) return null;
  const normalized = normalizeEvidencePath(activeSlice.path);
  const match = normalized.match(new RegExp(`^(${escapeRegExp(WORKSPACE_ROOT)}/initiatives/[^/]+/(?:phases|features)/[^/]+)/slices/slice-\\d+[^/]*\\.md$`, "i"));
  return match ? phaseStateFromPath(repoRoot, match[1]) : null;
}

function selectReviewEvidenceLocations(evidenceLocations, activeInitiative, activePhase, activeSlice) {
  if (activeSlice.path && evidenceLocations.includes(activeSlice.path)) {
    return {
      scope: "active-slice",
      usedFallback: false,
      locations: [activeSlice.path],
    };
  }

  if (activePhase.path) {
    const phasePrefix = `${activePhase.path}/`;
    const phaseLocations = evidenceLocations.filter((relativePath) => {
      return relativePath === activePhase.path || relativePath.startsWith(phasePrefix);
    });
    if (phaseLocations.length > 0) {
      return {
        scope: "active-phase",
        usedFallback: Boolean(activeSlice.path),
        locations: phaseLocations,
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
        usedFallback: Boolean(activeSlice.path || activePhase.path),
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
  const languagePath = path.join(repoRoot, LANGUAGE_FILE);
  const languageText = readFileIfPresent(languagePath);
  const index = parseIndex(indexText);
  const todo = parseTodo(todoText);
  const activeInitiative = activeInitiativeState(repoRoot, index);
  const activePhase = activePhaseState(repoRoot, index, activeInitiative);
  const activeSlice = activeSliceState(repoRoot, index, activePhase);
  const modeLedger = findModeLedger(repoRoot, indexText, markdownFiles, activeInitiative);
  const initiativeDecisionsText = activeInitiative.decisionsPath
    ? readFileIfPresent(path.join(repoRoot, activeInitiative.decisionsPath))
    : null;
  const evidenceLocations = findEvidenceLocations(repoRoot, workspacePath, markdownFiles);
  const changedPaths = evidenceChangedPaths(repoRoot, evidenceLocations);
  const reviewEvidence = selectReviewEvidenceLocations(evidenceLocations, activeInitiative, activePhase, activeSlice);
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
      present: languageText !== null,
      path: LANGUAGE_FILE,
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
    activePhase,
    activeFeature: activePhase,
    activeSlice,
    modeLedger,
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

function normalizeEvidencePath(sourcePath) {
  return posix(String(sourcePath ?? "").replace(/^\.\/+/, "").replace(/\/+$/, ""));
}

function changedEvidenceDriftMessages(state) {
  const reviewScope = state.evidence.reviewScope;
  if (reviewScope.changedPaths.length === 0) return [];

  const evidencePaths = reviewScope.changedPaths
    .filter(isImplementationPath)
    .map(normalizeEvidencePath);
  const messagePath = reviewScope.locations[0] ?? WORKSPACE_ROOT;
  const messages = [];

  const unresolvedEvidence = evidencePaths.filter((sourcePath) => {
    return !fs.existsSync(path.join(state.repoRoot, sourcePath));
  });
  if (unresolvedEvidence.length > 0) {
    messages.push(message("warning", "stale-changed-evidence-path", messagePath, `Active Changed evidence references implementation paths that do not exist: ${unresolvedEvidence.slice(0, 8).join(", ")}${unresolvedEvidence.length > 8 ? ", ..." : ""}`));
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
  if (!text || isPlaceholder(stripInlineMarkdownReferences(text))) return true;
  return text
    .split("\n")
    .map((line) => stripInlineMarkdownReferences(line)
      .replace(/^[-*]\s+/, "")
      .replace(/^\[[ xX]\]\s+/, "")
      .trim())
    .filter(Boolean)
    .some((line) => {
      if (/^(todo|tbd|pending|not yet|not started|placeholder|unknown|unclear|fill in)\.?$/i.test(line)) return true;
      return /\b(to be filled|fill this in|fill in later|placeholder only|placeholder text)\b/i.test(line);
    });
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

function sliceHasBatchingRationale(sliceText) {
  const rationale = extractSection(sliceText, "Why This Slice Exists");
  return sectionHasSubstance(rationale) && !sectionHasWeakPlanningText(rationale);
}

function whyNotSplitIsValid(sliceText, { strong = false } = {}) {
  if (!hasSection(sliceText, "Why Not Split")) return false;
  const section = extractSection(sliceText, "Why Not Split");
  if (!sectionHasSubstance(section) || sectionHasWeakPlanningText(section)) return false;
  if (!strong) return true;
  return /\b(one behavior|cannot work smaller|can't work smaller|smallest safe|atomic|same state transition|tightly coupled|split(?:ting)? would|must land together)\b/i.test(section);
}

function sliceBroadStackSignals(sliceText) {
  const text = normalizeText([
    extractSection(sliceText, "In Scope"),
    extractSection(sliceText, "Likely Surfaces"),
  ].join("\n"));
  return {
    ui: /\b(ui|frontend|component|page|pages|screen|view|views|form|forms|layout|html|css|tsx|jsx)\b|\.html\b|\.css\b|\.tsx\b|\.jsx\b|routes\/pages/i.test(text),
    route: /\b(route|routes|api|endpoint|handler|controller|server action|server)\b|\/routes\//i.test(text),
    state: /\b(state|store|storage|data|database|db|model|schema|migration|repository|persistence)\b|data\.json/i.test(text),
    test: /\b(test|tests|spec|smoke|e2e|playwright|cypress)\b|\/tests?\//i.test(text),
  };
}

function sliceTouchesUiRouteStateAndTests(sliceText) {
  const signals = sliceBroadStackSignals(sliceText);
  return signals.ui && signals.route && signals.state && signals.test;
}

function sliceTitleLooksBatched(title, sliceText, size, criteriaCount, surfaceCount) {
  if (HARD_BATCHED_SLICE_TITLE_PATTERN.test(title)) return true;
  if (!AND_SLICE_TITLE_PATTERN.test(title)) return false;
  if (size === "L" || size === "XL" || criteriaCount > 3 || surfaceCount > 5) return true;
  return !sliceHasBatchingRationale(sliceText);
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

  const activePhase = state.activePhase.exists
    ? state.activePhase
    : inferredPhaseFromActiveSlice(state.repoRoot, state.activeSlice);
  if (!activePhase?.exists) return messages;

  const sliceDocs = activePhaseSliceDocs(activePhase);
  const sliceIndexPath = activePhaseSliceIndexPath(activePhase);
  const sliceIndexText = sliceIndexPath ? readFileIfPresent(path.join(state.repoRoot, sliceIndexPath)) : null;

  if (sliceDocs.length > 1 && !hasSliceMap(sliceIndexText ?? "")) {
    messages.push(message("warning", "missing-slice-map", sliceIndexPath ?? state.activePhase.slicesPath, "Multi-slice work should include a lightweight Slice Map with Slice, Size, Depends On, Unblocks, Risk, and Verification."));
  }

  if (sliceDocs.length > 2 && !hasSliceCheckpoint(sliceIndexText ?? "")) {
    messages.push(message("warning", "missing-slice-checkpoint", sliceIndexPath ?? state.activePhase.slicesPath, "Multi-slice work should add a checkpoint after 2-3 slices or at a milestone boundary."));
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
      if (!whyNotSplitIsValid(sliceText)) {
        messages.push(message("warning", "missing-why-not-split", slicePath, "L/XL slices require ## Why Not Split."));
      }
    }

    if (criteriaCount > 3) {
      messages.push(message("warning", "too-many-slice-acceptance-criteria", slicePath, `Slice has ${criteriaCount} acceptance criteria; split it unless they describe one small behavior path.`));
    }

    if (surfaceCount > 5) {
      messages.push(message("warning", "too-many-slice-surfaces", slicePath, `Slice lists ${surfaceCount} likely surfaces; split it or record why the larger blast radius is necessary.`));
    }

    if (sliceTouchesUiRouteStateAndTests(sliceText) && !whyNotSplitIsValid(sliceText, { strong: true })) {
      messages.push(message("warning", "broad-stack-slice-needs-split", slicePath, "Slice touches UI + route/API + state/data + tests. Split it unless ## Why Not Split proves one behavior cannot work smaller."));
    }

    if (sliceTitleLooksBatched(title, sliceText, size, criteriaCount, surfaceCount)) {
      messages.push(message("warning", "batched-slice-title", slicePath, "Slice title looks batched or MVP-sized; split it unless the slice is still one small behavior path with a clear rationale."));
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
  const activeDocOrSlice = activeWorkValueHasSubstance(work.docPath) ||
    activeWorkValueHasSubstance(work.slicePath);
  return activeWorkValueHasSubstance(work.initiativePath) &&
    activeWorkValueHasSubstance(work.currentModeRaw) &&
    activeDocOrSlice &&
    activeWorkValueHasSubstance(work.next);
}

function activeWorkDocIsValid(text) {
  if (!text) return false;
  const modeTasks = extractSection(text, "Mode Tasks") || extractSection(text, "Phase Tasks");
  const exitEvidence = extractSection(text, "Exit Evidence");
  return checkboxCount(modeTasks) >= 2 &&
    sectionHasSubstance(exitEvidence) &&
    !sectionHasWeakPlanningText(exitEvidence);
}

function activeWorkDocNeedsTaskPacket(docPath) {
  if (!docPath || isPlaceholder(docPath)) return false;
  const basename = path.posix.basename(normalizeEvidencePath(docPath)).toLowerCase();
  return ACTIVE_WORK_DOC_FILES.has(basename);
}

function isRecoveryBlockingMode(mode) {
  return RECOVERY_BLOCKING_MODES.has(mode ?? "");
}

function isRecoveryPointerRequiredMode(mode) {
  return RECOVERY_POINTER_REQUIRED_MODES.has(mode ?? "");
}

function activeWorkMessages(state) {
  const messages = [];
  if (!state.index.present) return messages;
  const recoveryBlocking = isRecoveryBlockingMode(state.index.currentMode);
  const pointerRequired = isRecoveryPointerRequiredMode(state.index.currentMode);

  const duplicateLabels = state.index.activeWork?.duplicateLabels ?? [];
  if (duplicateLabels.length > 0) {
    messages.push(message("warning", "duplicate-active-work-field", `${WORKSPACE_ROOT}/index.md`, `Active Work has duplicate field lines (${duplicateLabels.join(", ")}). Replace old values in place so resume state is unambiguous.`));
  }

  if (!activeWorkPointerIsValid(state.index)) {
    messages.push(message("warning", "missing-active-work", `${WORKSPACE_ROOT}/index.md`, "Index should include Active Work with an initiative, explicit Current mode, active doc, and next action so fresh context can resume without reading every delivery phase."));
  }

  const docPath = state.index.activeWork?.docPath;
  if (!docPath || isPlaceholder(docPath)) {
    const slicePath = state.index.activeWork?.slicePath;
    const resolvedSlice = slicePath && !isPlaceholder(slicePath)
      ? resolveRepoReferencePath(state.repoRoot, slicePath)
      : null;
    const hasExistingSlicePointer = resolvedSlice?.safe && resolvedSlice.exists;
    if (pointerRequired && !hasExistingSlicePointer) {
      messages.push(message("error", "missing-active-work-doc", `${WORKSPACE_ROOT}/index.md`, "Build/readiness mode needs an existing active doc or slice. Read references/recovery.md and repair Auto Strike state before continuing code work."));
    }
    return messages;
  }

  const resolved = resolveRepoReferencePath(state.repoRoot, docPath);
  if (!resolved?.safe) {
    messages.push(message("error", "unsafe-active-work-doc", docPath, "Active Work doc path is unsafe."));
  } else if (!resolved.exists) {
    const severity = recoveryBlocking ? "error" : "warning";
    const suffix = recoveryBlocking ? " Read references/recovery.md and repair Auto Strike state before continuing code work." : "";
    messages.push(message(severity, "missing-active-work-doc", resolved.relativePath, `Active Work points to a doc that does not exist.${suffix}`));
  } else if (activeWorkDocNeedsTaskPacket(resolved.relativePath)) {
    const activeDocText = readFileIfPresent(resolved.absolutePath);
    if (!activeWorkDocIsValid(activeDocText)) {
      messages.push(message("warning", "weak-active-work-doc", resolved.relativePath, "Active mode doc should include checkbox Mode Tasks and concrete Exit Evidence."));
    }
  }

  return messages;
}

function mentionsSpecArtifactCreation(text) {
  return /\b(write|create|draft|fill|produce|complete)\b.{0,80}\b(?:initiative\s+)?spec\b/i.test(text) ||
    /\b(write|create|draft|fill|produce|complete)\b.{0,80}\bphase[- ]spec\b/i.test(text) ||
    /\b(?:initiative\s+)?spec\b.{0,80}\b(write|create|draft|fill|produce|complete)\b/i.test(text) ||
    /\bphase[- ]spec\b.{0,80}\b(write|create|draft|fill|produce|complete)\b/i.test(text);
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

function modeBoundaryBatchingMessages(state) {
  if (!state.index.present) return [];

  const next = normalizeText(state.index.activeWork?.next ?? "");
  if (!sectionHasSubstance(next)) return [];

  const createsSpec = mentionsSpecArtifactCreation(next);
  const createsSlices = mentionsSliceArtifactCreation(next);
  const startsBuild = mentionsBuildStart(next);
  const messages = [];

  if (createsSpec && createsSlices) {
    messages.push(message("warning", "batched-mode-next-action", `${WORKSPACE_ROOT}/index.md`, "Active Work Next batches spec and slice work. Close the current mode, then stop with the immediate next mode; do not promise or record spec + slicing in one next action."));
  }
  if (createsSlices && startsBuild) {
    messages.push(message("warning", "batched-mode-next-action", `${WORKSPACE_ROOT}/index.md`, "Active Work Next batches slice artifact creation and build/implementation. Finish the current mode or slice closeout, then stop with the immediate next mode/action; do not write slice docs and implement them in the same next action."));
  }

  return messages;
}

function modeLedgerRequiredModes(state) {
  const mode = state.index.currentMode;
  if (state.index.currentModeExplicit && mode && MODE_LEDGER_BY_MODE[mode]) {
    return MODE_LEDGER_BY_MODE[mode];
  }
  if (state.evidence.reviewScope.reviewedItems.length > 0) {
    return MODE_LEDGER_BY_MODE.review;
  }
  if (state.evidence.reviewScope.changedPaths.length > 0 || state.evidence.reviewScope.verifiedItems.length > 0) {
    return MODE_LEDGER_BY_MODE.build;
  }
  if (state.activePhase.exists || state.activePhase.sliceFiles.length > 0) {
    return MODE_LEDGER_BY_MODE.slice;
  }
  return [];
}

function modeLedgerValueIsWeak(value) {
  return !sectionHasSubstance(value) || sectionHasWeakPlanningText(value);
}

function modeLedgerMessages(state) {
  const requiredModes = modeLedgerRequiredModes(state);
  if (requiredModes.length === 0) return [];

  const ledgerPath = state.modeLedger.path ?? state.activeInitiative.ideaPath ?? `${WORKSPACE_ROOT}/index.md`;
  if (!state.modeLedger.present) {
    return [
      message("warning", "missing-mode-ledger", ledgerPath, "Active initiative has reached slice/build/review/readiness work without a Mode Ledger. Record each mode as done, compressed, or skipped with artifact and reason so workflow modes are not silently skipped."),
    ];
  }

  const messages = [];
  const duplicateModes = Object.keys(state.modeLedger.duplicates ?? {});
  if (duplicateModes.length > 0) {
    messages.push(message("warning", "duplicate-mode-ledger-row", state.modeLedger.path, `Mode Ledger has duplicate mode rows (${duplicateModes.join(", ")}). Keep one row per mode and update it in place so workflow state is not ambiguous.`));
  }

  const weak = [];
  const currentMode = requiredModes.at(-1);
  for (const mode of requiredModes) {
    const row = state.modeLedger.rows[mode];
    if (!row) {
      weak.push(`${mode}: missing row`);
      continue;
    }
    const validStatuses = mode === currentMode ? MODE_LEDGER_ACTIVE_STATUSES : MODE_LEDGER_COMPLETE_STATUSES;
    if (!row.status || !validStatuses.has(row.status)) {
      weak.push(`${mode}: weak status`);
    }
    if (modeLedgerValueIsWeak(row.artifact)) {
      weak.push(`${mode}: weak artifact`);
    }
    if (modeLedgerValueIsWeak(row.reason)) {
      weak.push(`${mode}: weak reason`);
    }
  }

  if (weak.length > 0) {
    messages.push(message("warning", "weak-mode-ledger", state.modeLedger.path, `Mode Ledger should show completed or intentionally compressed/skipped prior modes with artifact and reason. Weak entries: ${weak.slice(0, 8).join("; ")}${weak.length > 8 ? "; ..." : ""}.`));
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
    messages.push(message("warning", "stale-active-work-mode", `${WORKSPACE_ROOT}/index.md`, "Implementation evidence exists, but Active Work still points at an early workflow mode. Update index.md to the real active mode, phase, slice, state, and next action before claiming progress."));
  }

  if (!state.activePhase.exists && state.activeInitiative.phaseDirs.length > 0) {
    messages.push(message("warning", "stale-active-phase-pointer", `${WORKSPACE_ROOT}/index.md`, "Implementation evidence exists and phase folders exist, but Active Work does not point to an existing active phase."));
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

function readinessIsClosed(state) {
  if (!state.activeInitiative.readinessExists && !state.activePhase.readinessExists) return false;
  const readinessRow = state.modeLedger.rows?.readiness;
  if (readinessRow?.status && MODE_LEDGER_COMPLETE_STATUSES.has(readinessRow.status)) return true;
  const text = normalizeText([
    state.index.activeWork?.currentModeRaw,
    state.index.activeWork?.state,
    state.index.activeWork?.next,
  ].filter(Boolean).join("\n"));
  return state.index.currentMode === "readiness" && /\b(closed|complete(?:d)?|done|ready to use|ready)\b/i.test(text);
}

function finalIndexStateMessages(state) {
  if (!state.index.present || !readinessIsClosed(state)) return [];
  const messages = [];
  const indexPath = `${WORKSPACE_ROOT}/index.md`;
  const text = normalizeText([
    state.index.activeWork?.text,
    state.index.keyDocs.map((item) => item.raw).join("\n"),
    state.index.verification.join("\n"),
    state.index.projectState,
  ].filter(Boolean).join("\n"));

  if (state.index.currentMode !== "readiness") {
    messages.push(message("warning", "stale-final-index-mode", indexPath, "Readiness is closed, but index.md Current mode is not readiness."));
  }

  if (/\b(active build target|build in progress|planned later|planned \(later|planned \(slice|future slice|later slices?|planned next slice|will be built)\b/i.test(text)) {
    messages.push(message("warning", "stale-final-index-state", indexPath, "Readiness is closed, but index.md still contains active-build, planned-later, or future-slice language."));
  }

  return messages;
}

function currentTruthMessages(state) {
  const messages = [];
  if (!["recognized", "empty"].includes(state.workspace.status)) return messages;

  if (state.language.present && !state.language.substantive) {
    messages.push(message("warning", "weak-root-language", state.language.path, "UBIQUITOUS_LANGUAGE.md exists but has no substantive glossary/domain-language content."));
  }

  if (!state.activeInitiative.exists) return messages;

  if (!state.activeInitiative.decisionsExists) {
    messages.push(message("warning", "missing-initiative-decisions", state.activeInitiative.decisionsPath, "Each active initiative needs decisions.md, even if it starts with an explicit no-consequential-decisions-yet note."));
  } else if (!state.decisions.substantive) {
    messages.push(message("warning", "weak-initiative-decisions", state.activeInitiative.decisionsPath, "Initiative decisions.md exists but has no substantive current-truth decision content or explicit empty-state note."));
  }

  if (!state.activeInitiative.specExists) {
    messages.push(message("warning", "missing-initiative-spec", state.activeInitiative.specPath, "Each active initiative needs spec.md, even when minimal, before phase specs, slicing, or build work proceed."));
  } else {
    const specText = readFileIfPresent(path.join(state.repoRoot, state.activeInitiative.specPath));
    if (!markdownDocHasSubstance(specText)) {
      messages.push(message("warning", "weak-initiative-spec", state.activeInitiative.specPath, "Initiative spec.md exists but has no substantive current-truth overview, phase map, scope, or explicit draft note."));
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

function modeLedgerRowText(row) {
  if (!row) return "";
  return normalizeText([row.statusRaw, row.artifact, row.reason, row.raw].filter(Boolean).join("\n"));
}

function rowShowsExplicitUserOptOut(row) {
  const text = modeLedgerRowText(row);
  return /\b(user|human)\b.*\b(opt(?:ed)?\s*out|skip(?:ped)?|move\s+along|no\s+questions?|proceed\s+without\s+questions?|use\s+judgment)\b/i.test(text) ||
    /\b(skip(?:ped)?|compress(?:ed)?)\b.*\b(user|human)\b/i.test(text) ||
    /\b(explicit(?:ly)?\s+(?:opted\s+out|skipped|asked\s+to\s+move\s+along))\b/i.test(text);
}

function rowShowsExplicitAnswers(row) {
  const text = modeLedgerRowText(row);
  return /\b(explicit(?:ly)?\s+(?:answered|stated|provided|confirmed)|explicit user (?:wording|answers?|decisions?)|user (?:already )?(?:answered|stated|confirmed|provided)|prompt explicitly)\b/i.test(text);
}

function rowShowsPriorArtifact(row) {
  const text = modeLedgerRowText(row);
  return /\b(prior|existing|previous|earlier|already completed)\b.*\b(artifact|docs?|documents?|decisions?|spec|grill|brainstorm|auto strike|repo context)\b/i.test(text) ||
    /\b(recorded in|carried from)\b.*\b(artifact|docs?|documents?|decisions?|spec|grill|brainstorm)\b/i.test(text);
}

function rowShowsNotApplicable(row) {
  return /\b(not applicable|does not apply|n\/a|irrelevant)\b/i.test(modeLedgerRowText(row));
}

function rowShowsInternalInference(row) {
  return /\b(agent|model|assistant)\b.*\b(inferred|assumed|interpreted|decided)\b|\b(internal|privately)\b.*\b(inferred|assumed|interpreted|decided)\b|\bprompt (?:implied|suggested)\b/i.test(modeLedgerRowText(row));
}

function rowShowsQuestionToolFailure(row) {
  return /\b(AskUserQuestion|question tool|question ui|answer questions\?|tool (?:failed|failure|error|unavailable)|failed question|denied question|question denied|timeout|timed out|no answer|missing answer)\b/i.test(modeLedgerRowText(row));
}

function grillWasExplicitlyOptedOut(state) {
  const grillRow = state.modeLedger.rows?.grill;
  if (!grillRow) return false;
  return ["compressed", "skipped", "replaced"].includes(grillRow.status) && rowShowsExplicitUserOptOut(grillRow);
}

function modeBypassMessages(state) {
  if (!hasReachedSpecOrLater(state) || !state.modeLedger.present) return [];

  const messages = [];
  for (const mode of ["brainstorm", "grill"]) {
    const row = state.modeLedger.rows?.[mode];
    if (!row) continue;
    if (rowShowsQuestionToolFailure(row) && MODE_LEDGER_COMPLETE_STATUSES.has(row.status)) {
      messages.push(message("warning", "mode-completed-after-question-tool-failure", state.modeLedger.path, `${mode} mode is recorded as complete/compressed/skipped after a failed or unavailable question mechanism. Ask in plain text and wait for the user instead of treating tool failure as permission to proceed.`));
      continue;
    }

    if (rowShowsInternalInference(row)) {
      messages.push(message("warning", "mode-completed-by-inference", state.modeLedger.path, `${mode} mode is recorded as complete using agent inference. Run the mode with the user, cite explicit user answers/prior artifacts, or record explicit permission to skip.`));
      continue;
    }

    if (row.status === "compressed" && !rowShowsExplicitUserOptOut(row) && !rowShowsExplicitAnswers(row) && !rowShowsPriorArtifact(row)) {
      messages.push(message("warning", "mode-compressed-without-permission", state.modeLedger.path, `${mode} mode is compressed without explicit user opt-out, explicit prior answers, or prior-artifact evidence.`));
    }

    if (row.status === "skipped" && !rowShowsExplicitUserOptOut(row) && !rowShowsNotApplicable(row)) {
      messages.push(message("warning", "mode-skipped-without-permission", state.modeLedger.path, `${mode} mode is skipped without explicit user opt-out, move-along request, or not-applicable reason.`));
    }
  }
  return messages;
}

function activeInitiativeSliceDocs(state) {
  if (!state.activeInitiative.path) return [];
  const prefixes = [
    `${state.activeInitiative.path}/phases/`,
    `${state.activeInitiative.path}/features/`,
  ];
  return state.docs
    .filter((sourcePath) => prefixes.some((prefix) => sourcePath.startsWith(prefix)) && /\/slices\/.+\.md$/i.test(sourcePath))
    .sort();
}

function specModeIsComplete(state) {
  const row = state.modeLedger.rows?.spec;
  return Boolean(row?.status && MODE_LEDGER_COMPLETE_STATUSES.has(row.status));
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
    return sourcePath.endsWith("/spec.md") ||
      sourcePath.endsWith("/phase-spec.md") ||
      sourcePath.endsWith("/feature-spec.md");
  });
}

function specSliceBoundaryMessages(state) {
  const messages = [];
  if (!state.activeInitiative.exists) return messages;

  const inSpecMode = state.index.currentMode === "spec";
  const specComplete = specModeIsComplete(state);
  const sliceDocs = activeInitiativeSliceDocs(state);
  const specDocs = specDocsForState(state);
  if ((inSpecMode || !specComplete) && sliceDocs.length > 0) {
    messages.push(message("warning", "spec-mode-created-slice-artifacts", sliceDocs[0], "Spec mode should not create Slice Maps or slice files. Finish spec review and exit evidence first, then intentionally enter slice mode before writing slices."));
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
  if (state.activePhase.sliceFiles.length > 0 || state.activeSlice.path) return true;
  return ["slice", "build", "review", "readiness"].some((phase) => {
    const row = state.modeLedger.rows?.[phase];
    return row && MODE_LEDGER_ACTIVE_STATUSES.has(row.status);
  });
}

function reachedBuildOrLater(state) {
  if (["build", "review", "readiness"].includes(state.index.currentMode)) return true;
  if (hasImplementationEvidence(state)) return true;
  return ["build", "review", "readiness"].some((phase) => {
    const row = state.modeLedger.rows?.[phase];
    return row && MODE_LEDGER_ACTIVE_STATUSES.has(row.status);
  });
}

function modeExitGateMessages(state) {
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
    const activePhase = state.activePhase.exists
      ? state.activePhase
      : inferredPhaseFromActiveSlice(state.repoRoot, state.activeSlice);
    const sliceIndexPath = activePhase?.exists ? activePhaseSliceIndexPath(activePhase) : null;
    if (sliceIndexPath) {
      const text = readFileIfPresent(path.join(state.repoRoot, sliceIndexPath));
      if (text && !sectionHasSubstance(extractSection(text, "Slice Review"))) {
        messages.push(message("warning", "missing-slice-review", sliceIndexPath, "Build started without a substantive Slice Review in slices/index.md. Review slice size, dependency order, risk placement, working-state guarantee, and verification coverage before build."));
      }
      if (text && !sectionHasSubstance(extractSection(text, "Exit Evidence"))) {
        messages.push(message("warning", "missing-slice-exit-evidence", sliceIndexPath, "Build started without Slice Exit Evidence. Record why the phase can enter build one slice at a time before marking build in progress."));
      }
    }
  }

  return messages;
}

function hasReachedSpecOrLater(state) {
  const mode = state.index.currentMode;
  if (mode && MODES_REQUIRING_GRILL_CHECKPOINT.has(mode)) return true;
  if (state.activePhase.exists || state.activePhase.sliceFiles.length > 0 || hasImplementationEvidence(state)) return true;
  return ["spec", "slice", "build", "review", "readiness"].some((phase) => {
    const row = state.modeLedger.rows?.[phase];
    return row && MODE_LEDGER_ACTIVE_STATUSES.has(row.status);
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
      message("warning", "missing-initiative-grill", state.activeInitiative.grillPath, "Initiative has reached spec/slice/build/review/readiness work without grill.md. Run a proper grill session with the user or record an explicit user opt-out before hardening scope, stack, dependencies, persistence, identity, or delivery-phase split."),
    ];
  }

  const grillText = readFileIfPresent(path.join(state.repoRoot, state.activeInitiative.grillPath));
  const checkpoint = extractSection(grillText ?? "", "Decision Checkpoint");
  if (!sectionHasSubstance(checkpoint)) {
    return [
      message("warning", "missing-grill-decision-checkpoint", state.activeInitiative.grillPath, "Grill should record a Decision Checkpoint before spec/slice/build/review/readiness so vague kickoff language and consequential assumptions are explicit."),
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

function stackToolingConstraintMessages(state) {
  if (state.workspace.status !== "recognized") return [];

  const docs = state.docs
    .map((sourcePath) => ({
      sourcePath,
      text: readFileIfPresent(path.join(state.repoRoot, sourcePath)) ?? "",
    }))
    .filter((doc) => doc.text.trim().length > 0);

  const combined = normalizeText(docs.map((doc) => doc.text).join("\n\n"));
  const hasPnpmConstraint =
    /\bpnpm[-\s]*(?:only|required|exclusive|constraint|policy)\b/i.test(combined) ||
    /\buse\s+`?pnpm`?\b/i.test(combined) ||
    /\bno\s+`?npm`?\s*(?:or|\/|,)\s*`?npx`?\b/i.test(combined) ||
    /\bno\s+`?npm`?\b/i.test(combined) ||
    /\bno\s+`?npx`?\b/i.test(combined);

  if (!hasPnpmConstraint) return [];

  const nonPnpmRuntimePattern = /\b(?:decision|chosen|choose|choosing|selected|select|stack|runtime|language|use|using|built\s+on|build\s+with)\b[^\n.]{0,160}\b(?:python|python3|pip|uv|ruby|rails|go|golang|cargo|rust|deno|bun)\b/i;
  const conflict = docs.find((doc) => nonPnpmRuntimePattern.test(normalizeText(doc.text)));
  if (!conflict) return [];

  return [
    message("warning", "possible-tooling-constraint-runtime-conflict", conflict.sourcePath, "Docs name pnpm/no-npm as a tooling constraint while stack/runtime text points outside that toolchain. Do not use another runtime as a no-install workaround; get explicit user approval or revise the stack."),
  ];
}

function stripeScopeText(state) {
  const activeDocs = [
    `${WORKSPACE_ROOT}/index.md`,
    state.activeInitiative.ideaPath,
    state.activeInitiative.decisionsPath,
    state.activeInitiative.grillPath,
    state.activeInitiative.specPath,
    state.activePhase.specPath,
    state.activeSlice.path,
    state.activePhase.readinessPath,
    state.activeInitiative.readinessPath,
  ];
  const changedPaths = state.evidence.reviewScope.changedPaths.filter(isImplementationPath);
  const evidenceText = [
    ...state.evidence.reviewScope.verifiedItems,
    ...state.evidence.reviewScope.reviewedItems,
    ...state.evidence.reviewScope.skippedItems,
    ...state.index.verification,
  ].join("\n");
  const sourceText = [...new Set([...activeDocs, ...changedPaths])]
    .filter(Boolean)
    .map((sourcePath) => `${sourcePath}\n${readRepoText(state.repoRoot, sourcePath)}`)
    .join("\n\n");
  return normalizeText([
    state.index.activeWork?.text,
    state.index.keyDocs.map((item) => item.raw).join("\n"),
    evidenceText,
    sourceText,
  ].filter(Boolean).join("\n\n"));
}

function hasStripeCliSandboxEvidence(state) {
  const evidenceText = normalizeText([
    ...state.evidence.reviewScope.verifiedItems,
    ...state.index.verification,
  ].join("\n"));
  return STRIPE_CLI_PATTERN.test(evidenceText) && STRIPE_SANDBOX_PATTERN.test(evidenceText);
}

function stripeVerificationShouldBlock(state) {
  if (state.index.currentMode === "readiness") return true;
  if (state.index.currentMode === "review") return true;
  return Boolean(state.activeSlice.path && state.activeSlice.exists &&
    sliceHasCompletedCloseout(state.repoRoot, state.activeSlice.path));
}

function stripeMessages(state) {
  const text = stripeScopeText(state);
  const hasStripe = STRIPE_SCOPE_PATTERN.test(text);
  const hasConnect = STRIPE_CONNECT_SCOPE_PATTERN.test(text);
  if (!hasStripe && !hasConnect) return [];

  const messages = [];
  const messagePath = state.activeSlice.path ??
    state.activePhase.path ??
    state.activeInitiative.path ??
    `${WORKSPACE_ROOT}/index.md`;

  if (hasConnect && !STRIPE_CONNECT_SKILL_PATTERN.test(text)) {
    messages.push(message("warning", "missing-stripe-connect-skill-research", messagePath, "Stripe Connect work should start from the installed stripe-connect skill when available. Record that skill's implications in research, decisions, spec, or slice planning, or record why it was unavailable."));
  }

  const hasStripeImplementationEvidence = state.evidence.reviewScope.changedPaths.some(isImplementationPath) ||
    state.evidence.reviewScope.verifiedItems.length > 0 ||
    state.evidence.reviewScope.reviewedItems.length > 0;
  if (!hasStripeImplementationEvidence && !["build", "review", "readiness"].includes(state.index.currentMode ?? "")) {
    return messages;
  }

  if (!hasStripeCliSandboxEvidence(state)) {
    const severity = stripeVerificationShouldBlock(state) ? "error" : "warning";
    messages.push(message(severity, "missing-stripe-cli-sandbox-evidence", messagePath, "Stripe implementation needs Stripe CLI sandbox evidence before it can be called done. Record commands such as stripe --version, stripe listen/trigger or relevant Stripe object creation/retrieval, sandbox/test-mode object IDs, webhook events when applicable, and blockers/residual risk if CLI verification cannot run."));
  }

  return messages;
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

function checkedCheckboxItems(sectionText) {
  return normalizeText(sectionText)
    .split("\n")
    .map((line) => line.trim())
    .map((line) => line.match(/^[-*]\s+\[[xX]\]\s+(.+)$/)?.[1]?.trim())
    .filter(Boolean);
}

function sliceDocHasBuildEvidence(repoRoot, sourcePath) {
  const changed = evidenceListItems(repoRoot, [sourcePath], ["changed", "files changed", "modified", "touched"]);
  const verified = evidenceListItems(repoRoot, [sourcePath], ["verified", "verification", "checks"]);
  return changed.length > 0 && verified.some(hasPositiveVerificationEvidenceItem);
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

function sliceIndex(sourcePath) {
  const match = path.posix.basename(String(sourcePath ?? "")).match(/^slice-(\d+)\b/i);
  return match ? Number.parseInt(match[1], 10) : null;
}

function activeWorkShowsExplicitSliceContinuation(state) {
  const text = normalizeText([
    state.index.activeWork?.state,
    state.index.activeWork?.next,
  ].filter(Boolean).join("\n"));
  return /\b(user|human)\b.{0,80}\b(explicit(?:ly)?\s+)?(?:asked|said|approved|confirmed|told)\b.{0,80}\b(continue|proceed|go|keep going|next slice)\b/i.test(text) ||
    /\bexplicit(?:ly)?\s+(?:continuing|continue|continued|proceed(?:ing)?|go(?:ing)?)\s+(?:across|to)\s+(?:the\s+)?next\s+slice\b/i.test(text);
}

function sliceHasCompletedCloseout(repoRoot, sourcePath) {
  const text = readFileIfPresent(path.join(repoRoot, sourcePath));
  return closeoutSummarySectionIsValid(text ?? "");
}

function prematureNextSliceActivationMessages(state) {
  const activePath = state.activeSlice.path;
  if (!activePath || !SLICE_DOC_PATTERN.test(activePath)) return [];
  const activeIndex = sliceIndex(activePath);
  if (activeIndex === null || activeIndex === 0) return [];
  if (sliceDocHasBuildEvidence(state.repoRoot, activePath) || activeWorkShowsExplicitSliceContinuation(state)) return [];

  const activePhase = state.activePhase.exists
    ? state.activePhase
    : inferredPhaseFromActiveSlice(state.repoRoot, state.activeSlice);
  if (!activePhase?.exists) return [];
  const priorCompleted = activePhaseSliceDocs(activePhase)
    .filter((sourcePath) => {
      const index = sliceIndex(sourcePath);
      return index !== null && index < activeIndex && sliceHasCompletedCloseout(state.repoRoot, sourcePath);
    });

  if (priorCompleted.length === 0) return [];
  return [
    message("warning", "premature-next-slice-activation", activePath, "Active Work points at a next slice after a completed prior slice, but there is no active-slice build evidence or recorded explicit user continuation. Keep the completed slice active and name the next slice only in Closeout Summary unless the user said to continue."),
  ];
}

function completedSliceEvidenceMessages(state) {
  const messages = [];
  for (const sourcePath of state.docs.filter((docPath) => SLICE_DOC_PATTERN.test(docPath))) {
    const text = readFileIfPresent(path.join(state.repoRoot, sourcePath));
    if (!text || !closeoutSummarySectionIsValid(text)) continue;
    const changed = evidenceChangedPaths(state.repoRoot, [sourcePath]);
    const verified = evidenceVerifiedItems(state.repoRoot, [sourcePath]);
    const reviewed = evidenceReviewedItems(state.repoRoot, [sourcePath]);
    const missing = [];
    if (changed.length === 0) missing.push("Changed");
    if (verified.length === 0) missing.push("Verified");
    if (reviewed.length === 0) missing.push("Reviewed");
    if (missing.length === 0) continue;
    messages.push(message("warning", "completed-slice-missing-evidence", sourcePath, `Slice has a Closeout Summary but missing ${missing.join(", ")} evidence. Add a compact ## Evidence section before closeout so review packets and helper checks can scope the work.`));
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

function stalePhaseCheckpointMessages(state) {
  const messages = [];
  const completedSlicesByPhase = new Map();

  for (const sourcePath of state.evidence.locations) {
    const match = sourcePath.match(new RegExp(`^(${escapeRegExp(WORKSPACE_ROOT)}/initiatives/[^/]+/(?:phases|features)/[^/]+)/slices/slice-(\\d+)[^/]*\\.md$`));
    if (!match) continue;
    if (!sliceDocHasBuildEvidence(state.repoRoot, sourcePath)) continue;
    const phasePath = match[1];
    const sliceIndex = Number.parseInt(match[2], 10);
    const completed = completedSlicesByPhase.get(phasePath) ?? [];
    completed.push(sliceIndex);
    completedSlicesByPhase.set(phasePath, completed);
  }

  for (const sourcePath of state.docs.filter((docPath) => docPath.endsWith("/slices/index.md"))) {
    const phasePath = sourcePath.replace(/\/slices\/index\.md$/, "");
    const completedSliceIndices = completedSlicesByPhase.get(phasePath) ?? [];
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

const CHECK_CLAIM_CATEGORIES = [
  {
    name: "browser/user-flow",
    pattern: /\b(browser|visual|screenshot|viewport|responsive|mobile|desktop|two[- ](?:tab|window)|user[- ]flow|manual flow|manual browser|console|network|playwright|chrom(?:e|ium)|safari|firefox|gui)\b/i,
  },
  {
    name: "api/curl",
    pattern: /\b(curl|api|http|route|endpoint|GET|POST|PUT|PATCH|DELETE)\b/i,
  },
  {
    name: "test/build",
    pattern: /\b(test|tests|smoke|lint|build|typecheck|validate|pnpm|node)\b/i,
  },
];

const PLAYWRIGHT_CLI_PATTERN = /\bplaywright[-\s]?cli\b/i;
const BROWSER_SURFACE_PATTERN = /\b(browser|visual|screenshot|viewport|responsive|mobile|desktop|two[- ](?:tab|window)|user[- ]flow|manual flow|manual browser|console|network|playwright|chrom(?:e|ium)|safari|firefox|gui)\b/i;

function checkClaimCategories(item) {
  const text = String(item ?? "");
  if (skippedEvidenceSaysNoneRequired(text)) return [];
  return CHECK_CLAIM_CATEGORIES
    .filter((category) => category.pattern.test(text))
    .map((category) => category.name);
}

function skippedEvidenceSaysNoneRequired(text) {
  return /\bnone\b.{0,40}\b(required|skipped|missing|blocked)\b/i.test(text) ||
    /\b(no|none)\s+(required\s+)?checks?\s+(?:were\s+)?skipped\b/i.test(text);
}

function positiveBrowserEvidenceItem(item) {
  const text = String(item ?? "");
  if (!hasBrowserReviewEvidenceItem(text)) return false;
  return hasPositiveVerificationEvidenceItem(text);
}

function claimsCompletedBrowserVerification(item) {
  const text = String(item ?? "");
  if (!sectionHasSubstance(text)) return false;
  if (evidenceItemClaimsBlockedOrNotRun(text)) return false;
  if (/\b(any required|required .*checks?)\b/i.test(text)) return false;
  const doneWord = /\b(pass(?:ed)?|works?|verify|verified|checked|done|complete(?:d)?|walk(?:ed)?(?:through)?|exercised)\b/i;
  return BROWSER_SURFACE_PATTERN.test(text) && doneWord.test(text);
}

function checkedCheckpointClaims(state) {
  const claims = [];
  const completedSlicesByPhase = new Map();

  for (const sourcePath of state.evidence.locations) {
    const match = sourcePath.match(new RegExp(`^(${escapeRegExp(WORKSPACE_ROOT)}/initiatives/[^/]+/(?:phases|features)/[^/]+)/slices/slice-(\\d+)[^/]*\\.md$`));
    if (!match) continue;
    if (!sliceDocHasBuildEvidence(state.repoRoot, sourcePath)) continue;
    const phasePath = match[1];
    const sliceIndex = Number.parseInt(match[2], 10);
    const completed = completedSlicesByPhase.get(phasePath) ?? [];
    completed.push({ index: sliceIndex, path: sourcePath });
    completedSlicesByPhase.set(phasePath, completed);
  }

  for (const sourcePath of state.docs.filter((docPath) => docPath.endsWith("/slices/index.md"))) {
    const phasePath = sourcePath.replace(/\/slices\/index\.md$/, "");
    const completedSlices = completedSlicesByPhase.get(phasePath) ?? [];
    const completedSliceIndices = completedSlices.map((slice) => slice.index);
    const text = readFileIfPresent(path.join(state.repoRoot, sourcePath));
    for (const section of checkpointSections(text ?? "")) {
      if (!checkpointIsDue(section.heading, completedSliceIndices)) continue;
      for (const item of checkedCheckboxItems(section.body)) {
        claims.push({ path: sourcePath, item, evidenceLocations: completedSlices.map((slice) => slice.path) });
      }
    }
  }

  return claims;
}

function positiveEvidenceItems(repoRoot, locations, labels) {
  return evidenceListItems(repoRoot, locations, labels).filter(hasPositiveVerificationEvidenceItem);
}

function evidenceHasCategory(items, categoryName) {
  return items.some((item) => checkClaimCategories(item).includes(categoryName));
}

function completedCheckEvidenceContradictionMessages(state) {
  const claims = [];
  if (state.todo.present) {
    for (const item of state.todo.checkedItems) {
      claims.push({
        path: `${WORKSPACE_ROOT}/todo.md`,
        item,
        evidenceLocations: state.evidence.reviewScope.locations.length > 0
          ? state.evidence.reviewScope.locations
          : state.evidence.locations,
      });
    }
  }
  for (const sourcePath of state.evidence.locations.filter((location) => SLICE_DOC_PATTERN.test(location))) {
    const text = readFileIfPresent(path.join(state.repoRoot, sourcePath));
    const tasks = extractSection(text ?? "", "Execution Tasks");
    for (const item of checkedCheckboxItems(tasks)) {
      claims.push({ path: sourcePath, item, evidenceLocations: [sourcePath] });
    }
  }
  claims.push(...checkedCheckpointClaims(state));

  const messages = [];

  for (const claim of claims) {
    const categories = checkClaimCategories(claim.item);
    if (categories.length === 0) continue;
    const evidenceLocations = claim.evidenceLocations?.length > 0 ? claim.evidenceLocations : state.evidence.locations;
    const skippedItems = evidenceListItems(state.repoRoot, evidenceLocations, ["skipped", "skipped checks", "not run"]);
    const verifiedItems = positiveEvidenceItems(state.repoRoot, evidenceLocations, ["verified", "verification", "checks"]);
    const reviewedItems = positiveEvidenceItems(state.repoRoot, evidenceLocations, ["reviewed", "review lenses", "reviews"]);
    const skippedCategories = skippedItems.flatMap((item) =>
      checkClaimCategories(item).map((category) => ({ category, item }))
    );
    const hasAnyVerifiedEvidence = verifiedItems.length > 0;
    const hasBrowserEvidence = [...verifiedItems, ...reviewedItems].some(positiveBrowserEvidenceItem);

    const conflictingSkip = skippedCategories.find((skipped) =>
      categories.includes(skipped.category) &&
      (skipped.category !== "browser/user-flow" || claimsCompletedBrowserVerification(claim.item))
    );
    if (conflictingSkip) {
      messages.push(message("warning", "completed-check-conflicts-with-skipped-evidence", claim.path, `Checked item claims ${conflictingSkip.category} work is done, but evidence records it as skipped: "${claim.item}" conflicts with "${conflictingSkip.item}".`));
      continue;
    }

    if (categories.includes("browser/user-flow") && !hasBrowserEvidence && claimsCompletedBrowserVerification(claim.item)) {
      messages.push(message("warning", "completed-browser-check-missing-evidence", claim.path, `Checked item claims browser/user-flow work is done, but no browser verification evidence was found: "${claim.item}".`));
      continue;
    }

    const nonBrowserCategories = categories.filter((category) => category !== "browser/user-flow");
    const missingCategory = nonBrowserCategories.find((category) => !evidenceHasCategory(verifiedItems, category));
    if (!hasAnyVerifiedEvidence || missingCategory) {
      messages.push(message("warning", "completed-check-missing-verified-evidence", claim.path, `Checked item claims ${missingCategory ?? "verification"} work is done, but matching Verified evidence was not found: "${claim.item}".`));
    }
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
    messages.push(message("warning", "weak-slice-plan-review", activeSlice.path, `Active slice is${modeText} but Plan Review is missing, pending, or lacks a concrete review outcome. Record read-only review subagent findings and the main-agent assessment.`));
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
  const { workspace, index, activePhase } = state;
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
  messages.push(...modeBoundaryBatchingMessages(state));
  messages.push(...activeWorkFreshnessMessages(state));
  messages.push(...finalIndexStateMessages(state));
  messages.push(...currentTruthMessages(state));
  messages.push(...modeLedgerMessages(state));
  messages.push(...modeBypassMessages(state));
  messages.push(...specSliceBoundaryMessages(state));
  messages.push(...modeExitGateMessages(state));
  messages.push(...grillDecisionDepthMessages(state));
  messages.push(...grillCheckpointMessages(state));
  messages.push(...stackToolingConstraintMessages(state));
  messages.push(...stripeMessages(state));
  messages.push(...referencedAutoStrikeDocMessages(state));

  if (index.activeWork?.legacyFeatureRaw) {
    messages.push(message("warning", "legacy-active-feature-label", `${WORKSPACE_ROOT}/index.md`, "Active Work uses the legacy Feature field. Use Phase instead so the delivery layer matches the initiative -> phases -> slices model."));
  }

  if (state.modeLedger.legacyName) {
    messages.push(message("warning", "legacy-phase-ledger-name", state.modeLedger.path, "Use ## Mode Ledger instead of the legacy ## Phase Ledger heading so workflow modes are not confused with delivery phases."));
  }

  if (state.activeInitiative.legacyFeatureDirs.length > 0) {
    messages.push(message("warning", "legacy-feature-directories", state.activeInitiative.legacyFeaturesPath, "Legacy features/ directories are still supported for this release, but new Auto Strike work should use phases/<phase-slug>/phase-spec.md."));
  }

  if (activePhase.legacyFeaturePath) {
    messages.push(message("warning", "legacy-active-feature-path", activePhase.path ?? activePhase.inferredPath, "Active phase resolved through the legacy features/<slug>/feature-spec.md shape. Prefer phases/<phase-slug>/phase-spec.md for new work."));
  }

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

  if (index.activePhasePath && isExplicitWorkspacePath(index.activePhasePath)) {
    const resolved = resolveWorkspacePath(state.repoRoot, index.activePhasePath);
    if (!resolved?.safe) {
      messages.push(message("error", "unsafe-active-phase", index.activePhasePath, "Active phase path is unsafe."));
    } else if (!isPhasePath(resolved.relativePath) && !isLegacyFeaturePath(resolved.relativePath)) {
      messages.push(message("error", "invalid-active-phase-path", resolved.relativePath, "Active phase must point to auto-strike/initiatives/<initiative-slug>/phases/<phase-slug>."));
    } else if (!resolved.exists) {
      messages.push(message("error", "missing-active-phase", resolved.relativePath, "Index declares an active phase path that does not exist."));
    }
  }

  if (index.activePhasePath && isPhaseShorthand(index.activePhasePath) && !state.activeInitiative.exists) {
    messages.push(message("warning", "phase-shorthand-without-active-initiative", `${WORKSPACE_ROOT}/index.md`, "Phase shorthand can only resolve when Active Work names an existing active initiative."));
  }

  if (state.activeSlice.path && activePhase.exists && !normalizeEvidencePath(state.activeSlice.path).startsWith(`${activePhase.path}/slices/`)) {
    messages.push(message("error", "invalid-active-slice-path", state.activeSlice.path, "Active slice must live under the active phase's slices/ directory."));
  }

  if (index.currentMode && ["slice", "build", "review", "readiness"].includes(index.currentMode) && !activePhase.exists) {
    const severity = isRecoveryBlockingMode(index.currentMode) ? "error" : "warning";
    const suffix = severity === "error" ? " Read references/recovery.md and repair Auto Strike state before continuing code work." : "";
    messages.push(message(severity, "missing-active-phase", activePhase.inferredPath ?? `${WORKSPACE_ROOT}/index.md`, `Slice/build/review/readiness mode should name an existing active phase inside the active initiative.${suffix}`));
  }

  if (index.currentMode && MODES_EXPECTING_SPEC.has(index.currentMode) && activePhase.exists && !activePhase.specExists) {
    messages.push(message("warning", "missing-active-phase-spec", activePhase.specPath, "Current mode usually expects an active phase-spec.md, but none was found."));
  }

  if (index.currentMode && MODES_EXPECTING_SLICE.has(index.currentMode) && activePhase.exists && activePhase.sliceFiles.length === 0) {
    const severity = isRecoveryPointerRequiredMode(index.currentMode) ? "error" : "warning";
    const messageText = severity === "error"
      ? "Build/readiness mode needs an existing active slice doc. Read references/recovery.md and repair Auto Strike state before continuing code work."
      : "Review mode usually expects active slice docs, but none were found.";
    messages.push(message(severity, "missing-active-slice", activePhase.slicesPath, messageText));
  }

  messages.push(...slicePlanningMessages(state));
  messages.push(...staleSliceTaskChecklistMessages(state));
  messages.push(...completedSliceEvidenceMessages(state));
  messages.push(...prematureNextSliceActivationMessages(state));
  messages.push(...stalePhaseCheckpointMessages(state));
  messages.push(...completedCheckEvidenceContradictionMessages(state));

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
      messages.push(message("warning", "missing-active-slice-evidence", state.activeSlice.path, "Active slice has reviewable implementation evidence elsewhere but does not contain evidence itself; review context may fall back to broader phase evidence."));
    }
    if (activePhase.exists && !["active-slice", "active-phase"].includes(state.evidence.reviewScope.scope)) {
      messages.push(message("warning", "missing-active-phase-evidence", activePhase.path, "Review context is using broader initiative/workspace evidence because no active phase evidence was found."));
    }
    if (state.evidence.reviewScope.changedPaths.length === 0) {
      messages.push(message("warning", "missing-review-changed-evidence", state.evidence.reviewScope.locations[0] ?? WORKSPACE_ROOT, "Review context has no active Changed list, so reviewer packets may miss implementation files."));
    }
    messages.push(...changedEvidenceDriftMessages(state));
    if (!state.evidence.reviewScope.verifiedItems.some(hasPositiveVerificationEvidenceItem)) {
      messages.push(message("warning", "missing-review-verified-evidence", state.evidence.reviewScope.locations[0] ?? WORKSPACE_ROOT, "Review context has no active positive Verified evidence, so reviewer packets may miss checks that actually ran."));
    }
    if (state.evidence.reviewScope.changedPaths.length > 0 && state.evidence.reviewScope.verifiedItems.length > 0 && state.evidence.reviewScope.reviewedItems.length === 0) {
      messages.push(message("warning", "missing-reviewed-lens-evidence", state.evidence.reviewScope.locations[0] ?? WORKSPACE_ROOT, "Review/readiness evidence has Changed and Verified lists but no Reviewed list, so it is unclear which review lenses were applied."));
    }
    messages.push(...requiredReviewLensMessages(state, plan));
    messages.push(...verificationCapabilityMessages(state, plan));
    messages.push(...sliceCloseoutSummaryMessages(state));
    if (plan.surfaces.ui.length > 0 && hasBlockedUiBrowserFallback(state.evidence.reviewScope) && !hasPositiveUiBrowserCoverage(state.evidence.reviewScope)) {
      messages.push(message("warning", "ui-browser-verification-blocked", state.evidence.reviewScope.locations[0] ?? WORKSPACE_ROOT, "UI/browser/user-visible files changed, but playwright-cli verification was blocked. Treat this as code-verified, not browser-verified."));
    } else if (plan.surfaces.ui.length > 0 && !hasUiReviewCoverage(state.evidence.reviewScope)) {
      messages.push(message("warning", "missing-ui-browser-review-evidence", state.evidence.reviewScope.locations[0] ?? WORKSPACE_ROOT, "UI/browser/user-visible files changed but active evidence has no playwright-cli browser check, nor a blocked-playwright-cli rationale with replacement evidence and residual risk."));
    }
    const activeSliceClosed = state.activeSlice.path && state.activeSlice.exists &&
      sliceHasCompletedCloseout(state.repoRoot, state.activeSlice.path);
    if (needsReviewSubagentEvidence(state.evidence.reviewScope, { explicitReviewMode, activeSliceClosed }) && !hasReviewSubagentEvidence(state.evidence.reviewScope)) {
      messages.push(message("error", "missing-review-subagent-evidence", state.evidence.reviewScope.locations[0] ?? WORKSPACE_ROOT, "You MUST run a read-only review subagent. A main-agent self-review is never sufficient on its own. Return to review mode for this slice before continuing."));
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
  const text = readRepoText(repoRoot, sourcePath);
  if (/\b(document|window)\s*\.|\b(querySelector|addEventListener|classList|innerHTML|localStorage|sessionStorage|customElements)\b|from\s+["']react["']|React\.createElement|return\s*\(?\s*<[A-Za-z]/.test(text)) {
    return true;
  }
  return pathSegments(sourcePath).some((segment) => UI_PATH_SEGMENTS.has(segment)) &&
    /\b(component|render|view|page|screen|className|aria-|role=|href=|onClick|button|form|input|select|textarea)\b/i.test(text);
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
    notes.push("For UI/browser/user-visible changes, record Browser Verification Capability and include playwright-cli evidence. If playwright-cli is blocked, record that the UI is code-verified, not browser-verified, plus replacement evidence and residual risk.");
  }
  if (reviewScopeNeedsCapabilityRecord(state.evidence.reviewScope, surfaces)) {
    notes.push("Record Browser Verification Capability for UI work, and verification capability for other skipped checks or auth/integration work: repo checks, playwright-cli status, install constraints, blockers, replacement evidence, and residual risk.");
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
  if (reviewScope.changedPaths.length === 0 || !reviewScope.verifiedItems.some(hasPositiveVerificationEvidenceItem)) return [];

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
  if (/\b(curl|httpie|wget|api|GET|POST|PUT|PATCH|DELETE)\b/i.test(text) && !PLAYWRIGHT_CLI_PATTERN.test(text)) {
    return false;
  }
  return PLAYWRIGHT_CLI_PATTERN.test(text);
}

function hasBlockedBrowserFallback(item) {
  const text = String(item ?? "");
  if (!PLAYWRIGHT_CLI_PATTERN.test(text)) return false;
  const hasRealBlocker = /\b(blocked|unavailable|not available|cannot|can't|could not|unable|no access|not found|not installed|not on path|server could not start|auth blocked|environment restriction)\b/i.test(text);
  if (!hasRealBlocker) return false;
  const namesReplacementEvidence = /\b(replacement evidence|replacement|fallback|static review|static ui|smoke|syntax|api flow|manual code review)\b/i.test(text);
  if (!namesReplacementEvidence) return false;
  const namesResidualRisk = /\b(residual risk|risk left open|remaining risk|open risk)\b/i.test(text);
  if (!namesResidualRisk) return false;
  return true;
}

function hasUiReviewCoverage(reviewScope) {
  return hasPositiveUiBrowserCoverage(reviewScope) || hasBlockedUiBrowserFallback(reviewScope);
}

function hasPositiveUiBrowserCoverage(reviewScope) {
  return reviewScope.verifiedItems.some(positiveBrowserEvidenceItem) ||
    reviewScope.reviewedItems.some(positiveBrowserEvidenceItem);
}

function hasBlockedUiBrowserFallback(reviewScope) {
  return reviewScope.skippedItems.some(hasBlockedBrowserFallback);
}

function sectionLabelHasValue(section, labelPattern, options = {}) {
  const { allowNone = false } = options;
  return normalizeText(section)
    .split("\n")
    .map((line) => line.trim().replace(/^[-*]\s+/, ""))
    .some((line) => {
      const match = line.match(/^([^:]+):\s*(.*)$/);
      if (!match || !labelPattern.test(match[1])) return false;
      const value = match[2].trim();
      if (!value || isPlaceholder(value)) return false;
      if (allowNone && isNoneItem(value.replace(/[.;]$/, ""))) return true;
      return sectionHasSubstance(value);
    });
}

function browserVerificationCapabilitySectionIsValid(sliceText) {
  if (!hasSection(sliceText, "Browser Verification Capability")) return false;
  const section = extractSection(sliceText, "Browser Verification Capability");
  if (!sectionHasSubstance(section)) return false;
  const namesApplies = sectionLabelHasValue(section, /\b(applies)\b/i);
  const namesPlaywrightCli = sectionLabelHasValue(section, /\b(playwright[-\s]?cli)\b/i);
  const namesTarget = sectionLabelHasValue(section, /\b(target|url|route)\b/i, { allowNone: true });
  const namesFlows = sectionLabelHasValue(section, /\b(viewports?|flows?|flow)\b/i, { allowNone: true });
  const namesBlockedOrStatus = sectionLabelHasValue(section, /\b(if blocked|blocked|status)\b/i);
  return namesApplies && namesPlaywrightCli && namesTarget && namesFlows && namesBlockedOrStatus;
}

function verificationCapabilitySectionIsValid(sliceText) {
  if (browserVerificationCapabilitySectionIsValid(sliceText)) return true;
  if (!hasSection(sliceText, "Verification Capability")) return false;
  const section = extractSection(sliceText, "Verification Capability");
  if (!sectionHasSubstance(section)) return false;
  const text = normalizeText(section);
  const namesRepoChecks = /\b(repo|script|scripts|command|commands|check|checks|test|tests|lint|build|typecheck|node|pnpm|curl|api)\b/i.test(text);
  const namesHostOrManualChecks = /\b(playwright[-\s]?cli|viewport|responsive|user[- ]flow|api|curl)\b/i.test(text);
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
  if (plan.surfaces.ui.length > 0) {
    if (browserVerificationCapabilitySectionIsValid(sliceText ?? "")) return [];
    return [
      message("warning", "missing-browser-verification-capability", state.activeSlice.path, "UI/user-flow evidence needs a Browser Verification Capability record: playwright-cli status, target URL/route, viewports/flows, and verified or blocked/replacement/residual-risk status."),
    ];
  }
  if (verificationCapabilitySectionIsValid(sliceText ?? "")) return [];

  return [
    message("warning", "missing-verification-capability", state.activeSlice.path, "Active review evidence has skipped checks or auth/integration surfaces, but the slice lacks concrete Verification Capability. Record repo checks, playwright-cli status when relevant, install constraints, blocked checks, and replacement evidence before accepting fallback verification."),
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
    reviewScope.verifiedItems.some(hasPositiveVerificationEvidenceItem) &&
    reviewedItemsLookComplete(reviewScope.reviewedItems);
}

function closeoutSummarySectionIsValid(sliceText) {
  if (!hasSection(sliceText, "Closeout Summary")) return false;
  const section = extractSection(sliceText, "Closeout Summary");
  if (!sectionHasSubstance(section)) return false;
  if (/\[[^\]]+\]/.test(section)) return false;
  if (markdownListItems(section).length < 5) return false;
  return closeoutSummaryMissingLabels(section).length === 0;
}

function closeoutSummaryMissingLabels(section) {
  const required = [
    ["implemented", /\bImplemented\b/i],
    ["Built", /^Built:\s*$/im],
    ["Validation passed", /^Validation(?:\s+passed)?:\s*$/im],
    ["Review", /^Review:\s*$/im],
    ["Skipped / residual risk", /^(Skipped\s*(?:\/|or)?\s*residual risk|Skipped|Residual risk):\s*$/im],
    ["Docs", /^Docs:\s*$/im],
    ["Next", /^Next:\s*$/im],
  ];
  return required
    .filter(([, pattern]) => !pattern.test(section))
    .map(([label]) => label);
}

function sliceCloseoutSummaryMessages(state) {
  const reviewScope = state.evidence.reviewScope;
  if (!sliceEvidenceLooksComplete(reviewScope)) return [];
  if (!state.activeSlice.path || !state.activeSlice.exists) return [];

  const sliceText = readFileIfPresent(path.join(state.repoRoot, state.activeSlice.path));
  if (closeoutSummarySectionIsValid(sliceText ?? "")) return [];
  const section = extractSection(sliceText ?? "", "Closeout Summary");
  const missingLabels = sectionHasSubstance(section) ? closeoutSummaryMissingLabels(section) : [];
  const missingSuffix = missingLabels.length > 0 ? ` Missing: ${missingLabels.join(", ")}.` : "";

  return [
    message("warning", "missing-slice-closeout-summary", state.activeSlice.path, `Active slice has Changed, Verified, and Reviewed evidence but lacks a substantive Closeout Summary. Add a compact user-facing receipt with built work, validation, review status, skipped/residual risk, docs, and next action.${missingSuffix}`),
  ];
}

function hasReviewSubagentEvidence(reviewScope) {
  return reviewScope.reviewedItems.some((item) =>
    /\bread[- ]only\b/i.test(item) &&
    /\breview sub-?agent\b/i.test(item) &&
    reviewItemHasConcreteOutcome(item) &&
    !/\b(skip|skipped|unavailable|not available|cannot|can't|could not|unable|main[- ]agent self[- ]review|main agent review|self[- ]review by main agent|replacement evidence)\b/i.test(item)
  );
}

function needsReviewSubagentEvidence(reviewScope, options = {}) {
  return reviewScope.changedPaths.some(isImplementationPath) &&
    reviewScope.verifiedItems.some(hasPositiveVerificationEvidenceItem) &&
    (options.explicitReviewMode || options.activeSliceClosed || reviewScope.reviewedItems.length > 0);
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
      "You are a read-only review subagent. Return findings to the main agent for synthesis and evaluation.",
      "Do not edit files, fix issues, change docs, change package files, run formatters that write files, commit, change scope, or present conclusions directly to the user.",
      "Read the source paths before judging when they are available.",
      "For UI/user-flow slices, use playwright-cli for browser verification; curl, static HTML, other browser tools, and code review are not browser verification.",
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
    `- Phase: ${state.activePhase.path ?? state.index.activePhaseRaw ?? "None"}`,
    `- Mode: ${state.index.currentMode ?? "Unknown"}`,
    `- Active doc: ${state.index.activeWork.docPath ?? "Unknown"}`,
    `- Active state: ${state.index.activeWork.state ?? "Unknown"}`,
    `- Slice: ${state.index.activeSliceRaw ?? (state.activePhase.sliceFiles[0] ?? "None")}`,
    `- Mode ledger: ${state.modeLedger.present ? state.modeLedger.path : "Missing"}`,
    `- Language: ${state.language.present ? state.language.path : "Missing"}`,
    `- Initiative decisions: ${state.activeInitiative.decisionsExists ? state.activeInitiative.decisionsPath : "Missing"}`,
    `- Next declared: ${state.index.nextBestAction ?? "None"}`,
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
    `- Active phase: ${state.activePhase.path ?? state.index.activePhaseRaw ?? "None"}`,
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
    state.activePhase.specExists ? state.activePhase.specPath : null,
    state.activeSlice.exists ? state.activeSlice.path : null,
    state.activePhase.readinessExists ? state.activePhase.readinessPath : null,
    state.activeInitiative.readinessExists ? state.activeInitiative.readinessPath : null,
  ]);
  const usedPaths = new Set(activeDocs);

  const changedFiles = filterExistingSourcePaths(state, state.evidence.reviewScope.changedPaths.filter((sourcePath) => {
    return !sourcePath.startsWith(`${WORKSPACE_ROOT}/`);
  })).filter((sourcePath) => !usedPaths.has(sourcePath));
  for (const sourcePath of changedFiles) usedPaths.add(sourcePath);

  const workspaceDocs = filterExistingSourcePaths(state, [
    `${WORKSPACE_ROOT}/todo.md`,
    LANGUAGE_FILE,
    ...state.evidence.reviewScope.changedPaths.filter((sourcePath) => sourcePath.startsWith(`${WORKSPACE_ROOT}/`)),
  ]).filter((sourcePath) => !usedPaths.has(sourcePath));
  for (const sourcePath of workspaceDocs) usedPaths.add(sourcePath);

  const contextDocs = filterExistingSourcePaths(state, [
    ...state.index.keyDocs.map((item) => resolveRepoReferencePath(state.repoRoot, item.path))
      .filter((item) => item?.exists)
      .map((item) => item.relativePath),
    ...state.activePhase.sliceFiles.filter((sourcePath) => sourcePath !== state.activeSlice.path),
  ]).filter((sourcePath) => !usedPaths.has(sourcePath));

  return [
    { title: "Active Docs", paths: activeDocs },
    { title: "Changed Files From Active Evidence", paths: changedFiles },
    { title: "Workspace And Language Docs", paths: workspaceDocs },
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
    return 0;
  }

  if (command === "review-context") {
    const result = reviewContext(options);
    printResult(options, result, renderReviewContextMarkdown);
    return 0;
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
