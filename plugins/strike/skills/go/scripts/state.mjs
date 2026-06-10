#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SCRIPT_FILE = fileURLToPath(import.meta.url);
const DEFAULT_STATE_PATH = "strike/state.json";
const WORKSPACE_ROOT = "strike";
const STATE_VERSION = 2;
const INITIATIVE_STATE_VERSION = 2;
const LANGUAGE_FILE = "PROJECT_LANGUAGE.md";
const USER_GUIDANCE_DIR = "user-guidance";
const IMPLEMENTATION_DISCIPLINE_DIR = "implementation-discipline";
const REVIEW_LENSES_DIR = "review-lenses";
const IMPLEMENTATION_DISCIPLINE_TEMPLATES = new Map([
  [
    "global.md",
    `# Global Implementation Discipline

User/project-specific coding guidance for every Strike implementation
stage. Use this file for rare always-on implementation preferences.
Stage-specific guidance belongs in the matching stage file.

## Guidance

- None yet.
`,
  ],
  [
    "plan-slice.md",
    `# Plan Slice Implementation Discipline

Add user/project-specific coding guidance for slice planning.

## Guidance

- None yet.
`,
  ],
  [
    "build-slice.md",
    `# Build Slice Implementation Discipline

Add user/project-specific coding guidance for slice implementation.

## Guidance

- None yet.
`,
  ],
  [
    "fix.md",
    `# Fix Implementation Discipline

Add user/project-specific coding guidance for fixing failed verification items.

## Guidance

- None yet.
`,
  ],
  [
    "verify-slice-plan.md",
    `# Verify Slice Plan Implementation Discipline

Add user/project-specific implementation guidance for slice plan verification.

## Guidance

- None yet.
`,
  ],
  [
    "verify-slice-build.md",
    `# Verify Slice Build Implementation Discipline

Add user/project-specific implementation guidance for slice build verification.

## Guidance

- None yet.
`,
  ],
  [
    "verify-phase.md",
    `# Verify Phase Implementation Discipline

Add user/project-specific implementation guidance for phase verification.

## Guidance

- None yet.
`,
  ],
  [
    "verify-main-spec.md",
    `# Verify Main Spec Implementation Discipline

Add user/project-specific implementation guidance for final main spec
verification.

## Guidance

- None yet.
`,
  ],
]);
const REVIEW_LENS_TEMPLATES = new Map([
  [
    "global.md",
    `# Global Review Lenses

User/project-specific review lenses that apply to every Strike verifier.
Use this file for rare always-on review requirements. Stage-specific guidance
belongs in the matching verifier file.

Built-in Strike review lenses still apply. User review lenses are additive; they
do not disable built-in gates.

## Additional Lenses

- None yet.
`,
  ],
  [
    "verify-slice-plan.md",
    `# Verify Slice Plan Review Lenses

Add extra user/project-specific read-only review lenses for slice plan
verification.

Built-in Strike review lenses still apply. User review lenses are additive; they
do not disable built-in gates.

## Additional Lenses

- None yet.
`,
  ],
  [
    "verify-slice-build.md",
    `# Verify Slice Build Review Lenses

Add extra user/project-specific read-only review lenses for slice build
verification.

Built-in Strike review lenses still apply. User review lenses are additive; they
do not disable built-in gates.

## Additional Lenses

- None yet.
`,
  ],
  [
    "verify-phase.md",
    `# Verify Phase Review Lenses

Add extra user/project-specific read-only review lenses for phase verification.

Built-in Strike review lenses still apply. User review lenses are additive; they
do not disable built-in gates.

## Additional Lenses

- None yet.
`,
  ],
  [
    "verify-main-spec.md",
    `# Verify Main Spec Review Lenses

Add extra user/project-specific read-only review lenses for final main spec
verification.

Built-in Strike review lenses still apply. User review lenses are additive; they
do not disable built-in gates.

## Additional Lenses

- None yet.
`,
  ],
]);

export const INITIATIVE_WORKFLOW = [
  ["refine-idea", ["ideaRefined"]],
  ["research-initiative", ["initiativeResearchComplete"]],
  ["grill-idea", ["decisionsResolved"]],
  ["create-main-spec", ["specCreated"]],
  ["create-development-phases", ["phasesCreated"]],
  ["verify-main-spec", ["allPhasesVerified"]],
];

export const PHASE_WORKFLOW = [
  ["create-phase-spec", ["phaseSpecCreated"]],
  ["research-phase", ["phaseResearchComplete"]],
  ["create-phase-slices", ["slicesCreated"]],
  ["verify-phase", ["allSlicesVerified"]],
];

export const SLICE_WORKFLOW = [
  ["plan-slice", ["planCreated"]],
  ["verify-slice-plan", ["planVerified"]],
  ["build-slice", ["implemented"]],
  ["verify-slice-build", ["buildVerified"]],
];

export const GATE_HINTS = {
  ideaRefined:
    "idea.md must have ## User Checkpoint with a non-empty User response and Ready to continue: yes.",
  initiativeResearchComplete:
    "research/scope.md needs a user checkpoint with Ready to research: yes; research/index.md needs Ready for grill: yes; every approved item needs a non-empty report and an audit with Review results returned: yes, Verdict pass or accepted-risk, and Must Fix count: 0.",
  decisionsResolved:
    "decisions.md needs ## Decision Review with Review results returned: yes, Verdict pass or accepted-risk, and Must Fix count: 0, followed by a later ## User Checkpoint with a non-empty User response and Ready to continue: yes.",
  specCreated: "main-spec.md must exist with content.",
  phasesCreated:
    "development-plan.md and each phase stub must exist, and every planned phase must be registered with add-phase.",
  phaseSpecCreated: "the phase's phase-spec.md must exist with content.",
  phaseResearchComplete:
    "the phase's research.md must say Ready for slicing: yes and research-audit.md must say Review results returned: yes, Verdict pass or accepted-risk, and Must Fix count: 0.",
  slicesCreated:
    "each planned slice needs a slice.md stub and must be registered with add-slice.",
  planCreated:
    "plan.md must say Boundary Recommendation Needed: no (legacy Split Recommendation accepted) and Route Back Needed: no.",
  planVerified:
    "plan-verification.md must say Review results returned: yes, Ready: yes, Fix Needed: no, and Route Back Needed: no.",
  implemented:
    "build.md must say Built: yes, must not say Fix Needed: yes, and Route Back must say Needed: no.",
  buildVerified:
    "build-verification.md must say Review results returned: yes, Verified: yes, Fix Needed: no, Route Back Needed: no, and Post-browser visual/browser lenses: pass or not run.",
  allSlicesVerified:
    "the phase verification.md must say Review results returned: yes, Ready: yes, Fix Needed: no, and Route Back Needed: no.",
  allPhasesVerified:
    "the initiative verification.md must say Review results returned: yes, Ready: yes, Fix Needed: no, and Route Back Needed: no.",
};

const INITIATIVE_FINAL_SKILLS = new Set(["verify-main-spec"]);
const PHASE_FINAL_SKILLS = new Set(["verify-phase"]);
const INITIATIVE_UPSTREAM_CHECKS = new Set([
  "ideaRefined",
  "initiativeResearchComplete",
  "decisionsResolved",
  "specCreated",
  "phasesCreated",
]);
const PHASE_UPSTREAM_CHECKS = new Set(["phaseSpecCreated", "phaseResearchComplete", "slicesCreated"]);

export function workflowFromTemplate(template) {
  return template.map(([skill, checks]) => ({
    skill,
    verified: Object.fromEntries(checks.map((check) => [check, false])),
  }));
}

export function createInitiative(id, name = id) {
  validateId(id, "Initiative id");
  return {
    id,
    name,
    status: "active",
    initiativeWorkflow: workflowFromTemplate(INITIATIVE_WORKFLOW),
    phases: [],
  };
}

export function createInitialState(id, name = id) {
  return {
    version: STATE_VERSION,
    activeInitiativeId: id,
    initiatives: [createInitiative(id, name)],
  };
}

export function normalizeState(state) {
  if (!state || typeof state !== "object") return state;
  if (!Array.isArray(state.initiatives)) return state;

  state.version = STATE_VERSION;
  for (const initiative of state.initiatives) {
    if (!initiative || typeof initiative !== "object") {
      throw new Error("Initiative entry must be an object.");
    }
    validateId(initiative.id, "Initiative id");
    if (initiative.statePath !== undefined) {
      validateSplitInitiativeEntry(initiative);
    }
  }

  let active = state.initiatives.find((initiative) => initiative.status === "active");
  if (!active && state.activeInitiativeId) {
    const candidate = state.initiatives.find((initiative) => initiative.id === state.activeInitiativeId);
    if (candidate && candidate.status !== "complete") {
      candidate.status = "active";
      active = candidate;
    }
  }
  state.activeInitiativeId = active?.id ?? null;

  for (const initiative of state.initiatives) {
    if (isDetailedInitiative(initiative)) {
      normalizeInitiative(initiative);
    } else if (initiative && typeof initiative === "object") {
      initiative.status ??= "paused";
      initiative.name ??= initiative.id;
    }
  }

  return state;
}

function isDetailedInitiative(initiative) {
  return Array.isArray(initiative?.initiativeWorkflow) || Array.isArray(initiative?.phases);
}

function normalizeInitiative(initiative) {
  if (!initiative || typeof initiative !== "object") return initiative;
  initiative.status ??= "paused";
  initiative.name ??= initiative.id;
  initiative.initiativeWorkflow = normalizeWorkflow(
    initiative.initiativeWorkflow,
    INITIATIVE_WORKFLOW,
  );

  for (const phase of initiative.phases ?? []) {
    phase.phaseWorkflow = normalizeWorkflow(phase.phaseWorkflow, PHASE_WORKFLOW);
    for (const slice of phase.slices ?? []) {
      slice.sliceWorkflow = normalizeWorkflow(slice.sliceWorkflow, SLICE_WORKFLOW);
    }
    if (workflowHasIncompleteCheck(phase.phaseWorkflow, PHASE_UPSTREAM_CHECKS)) {
      for (const slice of phase.slices ?? []) {
        resetWorkflow(slice.sliceWorkflow);
      }
    }
    if ((phase.slices ?? []).some((slice) => !workflowComplete(slice.sliceWorkflow))) {
      reopenWorkflowKey(phase.phaseWorkflow, "allSlicesVerified");
    }
  }

  if (workflowHasIncompleteCheck(initiative.initiativeWorkflow, INITIATIVE_UPSTREAM_CHECKS)) {
    for (const phase of initiative.phases ?? []) {
      resetWorkflow(phase.phaseWorkflow);
      for (const slice of phase.slices ?? []) {
        resetWorkflow(slice.sliceWorkflow);
      }
    }
  }
  if ((initiative.phases ?? []).some((phase) => !workflowComplete(phase.phaseWorkflow))) {
    reopenWorkflowKey(initiative.initiativeWorkflow, "allPhasesVerified");
  }

  initiative.phases ??= [];
  return initiative;
}

export function createStateIndex(state) {
  normalizeState(state);
  const active = getActiveInitiative(state);
  return {
    version: STATE_VERSION,
    activeInitiativeId: active?.id ?? null,
    initiatives: (state.initiatives ?? []).map((initiative) => initiativeSummary(initiative)),
  };
}

function initiativeSummary(initiative) {
  return {
    id: initiative.id,
    name: initiative.name ?? initiative.id,
    status: initiative.status ?? "paused",
    statePath: initiativeStateRelativePath(initiative.id),
  };
}

function initiativeStateDocument(initiative) {
  normalizeInitiative(initiative);
  return {
    version: INITIATIVE_STATE_VERSION,
    id: initiative.id,
    name: initiative.name ?? initiative.id,
    initiativeWorkflow: initiative.initiativeWorkflow,
    phases: initiative.phases ?? [],
  };
}

function normalizeWorkflow(workflow, template) {
  const bySkill = new Map();
  for (const item of workflow ?? []) {
    if (typeof item?.skill === "string" && !bySkill.has(item.skill)) {
      bySkill.set(item.skill, item);
    }
  }

  let downstreamBlocked = false;
  return template.map(([skill, checks]) => {
    const existingVerified = bySkill.get(skill)?.verified;
    const verified =
      existingVerified && typeof existingVerified === "object" && !Array.isArray(existingVerified)
        ? existingVerified
        : {};
    const normalizedVerified = {};
    let itemComplete = true;
    for (const check of checks) {
      const complete = !downstreamBlocked && verified[check] === true;
      normalizedVerified[check] = complete;
      if (!complete) {
        itemComplete = false;
      }
    }
    if (!itemComplete) {
      downstreamBlocked = true;
    }
    return {
      skill,
      verified: normalizedVerified,
    };
  });
}

function workflowHasIncompleteCheck(workflow, checkNames) {
  for (const item of workflow ?? []) {
    for (const [check, complete] of Object.entries(item.verified ?? {})) {
      if (checkNames.has(check) && complete !== true) {
        return true;
      }
    }
  }
  return false;
}

function workflowComplete(workflow) {
  for (const item of workflow ?? []) {
    for (const complete of Object.values(item.verified ?? {})) {
      if (complete !== true) {
        return false;
      }
    }
  }
  return true;
}

export function getActiveInitiative(state) {
  normalizeState(state);
  const initiatives = Array.isArray(state?.initiatives) ? state.initiatives : [];
  return initiatives.find((initiative) => initiative.status === "active") ?? null;
}

export function listInitiatives(state) {
  normalizeState(state);
  const initiatives = Array.isArray(state?.initiatives) ? state.initiatives : [];
  return initiatives.map((initiative) => initiativeSummary(initiative));
}

export function addInitiative(state, id, name = id) {
  normalizeState(state);
  state.initiatives ??= [];
  if (state.initiatives.some((initiative) => initiative.id === id)) {
    throw new Error(`Initiative already exists: ${id}`);
  }

  pauseActiveInitiatives(state);
  const initiative = createInitiative(id, name);
  state.initiatives.push(initiative);
  return initiative;
}

export function setActiveInitiative(state, id) {
  normalizeState(state);
  validateId(id, "Initiative id");
  const initiative = (state.initiatives ?? []).find((item) => item.id === id);
  if (!initiative) {
    throw new Error(`Initiative not found: ${id}`);
  }

  pauseActiveInitiatives(state);
  initiative.status = "active";
  return initiative;
}

export function finishInitiative(state, id = null) {
  normalizeState(state);
  const initiative = id
    ? (state.initiatives ?? []).find((item) => item.id === id)
    : getActiveInitiative(state);
  if (!initiative) {
    throw new Error(id ? `Initiative not found: ${id}` : "Cannot finish initiative: no active initiative.");
  }
  if (!initiativeVerificationComplete(initiative)) {
    throw new Error("Cannot finish initiative until allPhasesVerified is complete.");
  }

  initiative.status = "complete";
  return initiative;
}

function initiativeVerificationComplete(initiative) {
  const finalItem = (initiative.initiativeWorkflow ?? []).find((item) => item.skill === "verify-main-spec");
  return finalItem?.verified?.allPhasesVerified === true;
}

function pauseActiveInitiatives(state) {
  for (const initiative of state.initiatives ?? []) {
    if (initiative.status === "active") {
      initiative.status = "paused";
    }
  }
}

export function getNextStep(state) {
  normalizeState(state);
  const initiative = getActiveInitiative(state);
  if (!initiative) {
    return { status: "idle", reason: "No active initiative." };
  }

  const initiativeScope = { initiativeId: initiative.id };
  const initiativeWork = firstIncomplete(
    initiative.initiativeWorkflow,
    INITIATIVE_FINAL_SKILLS,
    initiativeScope,
  );
  if (initiativeWork) return withArtifacts(initiativeWork);

  for (const phase of initiative.phases ?? []) {
    const phaseScope = { initiativeId: initiative.id, phaseId: phase.id };
    const phaseWork = firstIncomplete(phase.phaseWorkflow, PHASE_FINAL_SKILLS, phaseScope);
    if (phaseWork) return withArtifacts(phaseWork);

    for (const slice of phase.slices ?? []) {
      const sliceScope = { initiativeId: initiative.id, phaseId: phase.id, sliceId: slice.id };
      const sliceWork = firstIncomplete(slice.sliceWorkflow, new Set(), sliceScope);
      if (sliceWork) return withArtifacts(sliceWork);
    }

    const phaseFinal = firstIncomplete(phase.phaseWorkflow, null, phaseScope, PHASE_FINAL_SKILLS);
    if (phaseFinal) return withArtifacts(phaseFinal);
  }

  const initiativeFinal = firstIncomplete(
    initiative.initiativeWorkflow,
    null,
    initiativeScope,
    INITIATIVE_FINAL_SKILLS,
  );
  if (initiativeFinal) return withArtifacts(initiativeFinal);

  return { status: "complete", initiativeId: initiative.id };
}

export function completeCheck(state, verificationKey, options = {}) {
  const current = getNextStep(state);
  if (current.status !== "active") {
    throw new Error(`Cannot complete verification: next-step status is ${current.status}.`);
  }

  const item = findCurrentWorkflowItem(state, current);
  const verified = item.verified;
  if (!verified || typeof verified !== "object" || Array.isArray(verified)) {
    throw new Error(`Current workflow item ${item.skill} has invalid verified data.`);
  }

  const validKeys = Object.keys(verified);
  if (!validKeys.includes(verificationKey)) {
    throw new Error(
      `Unknown verification key "${verificationKey}" for ${item.skill}. Valid keys: ${validKeys.join(", ")}`,
    );
  }
  if (verified[verificationKey] === true) {
    throw new Error(`Verification key "${verificationKey}" is already complete for ${item.skill}.`);
  }

  validateCompletionPreconditions(state, current, verificationKey, options);
  verified[verificationKey] = true;
  const next = getNextStep(state);
  if (next.status === "complete") {
    const initiative = (state.initiatives ?? []).find((entry) => entry.id === next.initiativeId);
    if (initiative) {
      initiative.status = "complete";
    }
  }
  return completionReceipt(current, verificationKey);
}

function completionReceipt(current, verificationKey) {
  const receipt = {
    status: "recorded",
    initiativeId: current.initiativeId,
    skill: current.skill,
    completedCheck: verificationKey,
    runNext: "node strike/scripts/state.mjs next-step",
  };

  if (current.phaseId) {
    receipt.phaseId = current.phaseId;
  }
  if (current.sliceId) {
    receipt.sliceId = current.sliceId;
  }

  return receipt;
}

function validateCompletionPreconditions(state, current, verificationKey, options = {}) {
  if (verificationKey === "ideaRefined") {
    requireUserCheckpoint(
      "ideaRefined",
      artifactFilePath(options.statePath, current.initiativeId, "idea.md"),
    );
  }

  if (verificationKey === "initiativeResearchComplete") {
    const scopePath = artifactFilePath(options.statePath, current.initiativeId, "research", "scope.md");
    const indexPath = artifactFilePath(options.statePath, current.initiativeId, "research", "index.md");
    requireResearchScopeCheckpoint(
      "initiativeResearchComplete",
      scopePath,
    );
    requireReadyForGrill(
      "initiativeResearchComplete",
      indexPath,
    );
    requireResearchReports("initiativeResearchComplete", scopePath, indexPath);
    requireResearchAudits("initiativeResearchComplete", scopePath, indexPath);
  }

  if (verificationKey === "decisionsResolved") {
    const decisionsPath = artifactFilePath(options.statePath, current.initiativeId, "decisions.md");
    requireUserCheckpoint("decisionsResolved", decisionsPath);
    requireDecisionReview("decisionsResolved", decisionsPath);
  }

  if (verificationKey === "specCreated") {
    requireContentArtifacts("specCreated", [
      artifactFilePath(options.statePath, current.initiativeId, "main-spec.md"),
    ]);
  }

  if (verificationKey === "phaseSpecCreated") {
    requireContentArtifacts("phaseSpecCreated", [
      artifactFilePath(options.statePath, current.initiativeId, "phases", current.phaseId, "phase-spec.md"),
    ]);
  }

  if (verificationKey === "planCreated") {
    requireSlicePlanReady(
      "planCreated",
      artifactFilePath(
        options.statePath,
        current.initiativeId,
        "phases",
        current.phaseId,
        "slices",
        current.sliceId,
        "plan.md",
      ),
    );
  }

  if (verificationKey === "planVerified") {
    requireReviewedVerificationArtifact(
      "planVerified",
      artifactFilePath(
        options.statePath,
        current.initiativeId,
        "phases",
        current.phaseId,
        "slices",
        current.sliceId,
        "plan-verification.md",
      ),
      "Ready",
    );
  }

  if (verificationKey === "buildVerified") {
    requireReviewedVerificationArtifact(
      "buildVerified",
      artifactFilePath(
        options.statePath,
        current.initiativeId,
        "phases",
        current.phaseId,
        "slices",
        current.sliceId,
        "build-verification.md",
      ),
      "Verified",
    );
  }

  if (verificationKey === "phaseResearchComplete") {
    const researchPath = artifactFilePath(options.statePath, current.initiativeId, "phases", current.phaseId, "research.md");
    const auditPath = artifactFilePath(options.statePath, current.initiativeId, "phases", current.phaseId, "research-audit.md");
    requireReadyForSlicing(
      "phaseResearchComplete",
      researchPath,
    );
    requirePhaseResearchAudit("phaseResearchComplete", researchPath, auditPath);
  }

  if (verificationKey === "implemented") {
    requireSliceBuildReady(
      "implemented",
      artifactFilePath(
        options.statePath,
        current.initiativeId,
        "phases",
        current.phaseId,
        "slices",
        current.sliceId,
        "build.md",
      ),
    );
  }

  if (verificationKey === "allSlicesVerified") {
    requireReviewedVerificationArtifact(
      "allSlicesVerified",
      artifactFilePath(
        options.statePath,
        current.initiativeId,
        "phases",
        current.phaseId,
        "verification.md",
      ),
      "Ready",
    );
  }

  if (verificationKey === "allPhasesVerified") {
    requireReviewedVerificationArtifact(
      "allPhasesVerified",
      artifactFilePath(options.statePath, current.initiativeId, "verification.md"),
      "Ready",
    );
  }

  if (verificationKey === "phasesCreated") {
    const initiative = (state.initiatives ?? []).find((item) => item.id === current.initiativeId);
    if (!initiative || (initiative.phases ?? []).length === 0) {
      throw new Error("Cannot complete phasesCreated until at least one phase has been added with add-phase.");
    }

    const unregisteredPhaseIds = unregisteredArtifactIds(
      phaseArtifactIds(options.statePath, current.initiativeId),
      (initiative.phases ?? []).map((phase) => phase.id),
    );
    if (unregisteredPhaseIds.length > 0) {
      throw new Error(
        `Cannot complete phasesCreated until these phase directories are registered with add-phase: ${unregisteredPhaseIds.join(", ")}.`,
      );
    }

    requireContentArtifacts("phasesCreated", [
      artifactFilePath(options.statePath, current.initiativeId, "development-plan.md"),
      ...(initiative.phases ?? []).map((phase) =>
        artifactFilePath(options.statePath, current.initiativeId, "phases", phase.id, "phase.md"),
      ),
    ]);
  }

  if (verificationKey === "slicesCreated") {
    const initiative = (state.initiatives ?? []).find((item) => item.id === current.initiativeId);
    const phase = (initiative?.phases ?? []).find((item) => item.id === current.phaseId);
    if (!phase || (phase.slices ?? []).length === 0) {
      throw new Error("Cannot complete slicesCreated until at least one slice has been added with add-slice.");
    }

    const unregisteredSliceIds = unregisteredArtifactIds(
      sliceArtifactIds(options.statePath, current.initiativeId, current.phaseId),
      (phase.slices ?? []).map((slice) => slice.id),
    );
    if (unregisteredSliceIds.length > 0) {
      throw new Error(
        `Cannot complete slicesCreated until these slice directories are registered with add-slice: ${unregisteredSliceIds.join(", ")}.`,
      );
    }

    requireContentArtifacts(
      "slicesCreated",
      (phase.slices ?? []).map((slice) =>
        artifactFilePath(
          options.statePath,
          current.initiativeId,
          "phases",
          current.phaseId,
          "slices",
          slice.id,
          "slice.md",
        ),
      ),
    );
  }
}

function unregisteredArtifactIds(artifactIds, registeredIds) {
  const registered = new Set(registeredIds);
  return artifactIds.filter((id) => !registered.has(id));
}

function requireContentArtifacts(verificationKey, artifactPaths) {
  const missing = artifactPaths.filter((artifactPath) => !hasFileContent(artifactPath));
  if (missing.length > 0) {
    throw new Error(
      `Cannot complete ${verificationKey} until these artifacts exist and contain content: ${missing.join(", ")}.`,
    );
  }
}

function requireUserCheckpoint(verificationKey, artifactPath) {
  if (!hasFileContent(artifactPath)) {
    throw new Error(
      `Cannot complete ${verificationKey} until ${artifactPath} exists and contains a user checkpoint.`,
    );
  }

  const text = fs.readFileSync(artifactPath, "utf8");
  const checkpoint = markdownLastSection(text, "User Checkpoint");
  const hasReadyYes = latestFieldValue(checkpoint?.body ?? "", "Ready to continue", "yes|no") === "yes";
  const hasUserResponse = /^User response:[^\S\r\n]*\S.+$/mi.test(checkpoint?.body ?? "");

  if (!checkpoint || !hasReadyYes || !hasUserResponse) {
    throw new Error(
      `Cannot complete ${verificationKey} until ${artifactPath} has ## User Checkpoint, a non-empty User response, and Ready to continue: yes.`,
    );
  }
}

function requireDecisionReview(verificationKey, artifactPath) {
  if (!hasFileContent(artifactPath)) {
    throw new Error(
      `Cannot complete ${verificationKey} until ${artifactPath} exists and contains a decision review.`,
    );
  }

  const text = fs.readFileSync(artifactPath, "utf8");
  const finalReview = markdownLastSection(text, "Decision Review");
  const fields = reviewFields(finalReview?.body ?? "");

  if (
    !finalReview ||
    !fields.reviewReturned ||
    (fields.verdict !== "pass" && fields.verdict !== "accepted-risk") ||
    fields.mustFixCount !== 0
  ) {
    throw new Error(
      `Cannot complete ${verificationKey} until ${artifactPath} has ## Decision Review with Review results returned: yes, Verdict: pass or accepted-risk, and Must Fix count: 0.`,
    );
  }

  const postReviewCheckpoint = markdownLastSectionAfter(text, "User Checkpoint", finalReview.index);
  const hasPostReviewCheckpoint =
    postReviewCheckpoint &&
    latestFieldValue(postReviewCheckpoint, "Ready to continue", "yes|no") === "yes" &&
    /^User response:[^\S\r\n]*\S.+$/mi.test(postReviewCheckpoint);

  if (!hasPostReviewCheckpoint) {
    throw new Error(
      `Cannot complete ${verificationKey} until ${artifactPath} has a post-review ## User Checkpoint with a non-empty User response and Ready to continue: yes after the final passing ## Decision Review.`,
    );
  }
}

function requireSlicePlanReady(verificationKey, artifactPath) {
  if (!hasFileContent(artifactPath)) {
    throw new Error(
      `Cannot complete ${verificationKey} until ${artifactPath} exists and contains a slice plan.`,
    );
  }

  const text = fs.readFileSync(artifactPath, "utf8");
  const boundaryRecommendation =
    markdownSection(text, "Boundary Recommendation") ??
    markdownSection(text, "Split Recommendation");
  const boundaryNeeded = boundaryRecommendation
    ? latestFieldValue(boundaryRecommendation, "Needed", "yes|no")
    : null;
  const routeBack = routeBackField(text);
  if (boundaryNeeded !== "no") {
    throw new Error(
      `Cannot complete ${verificationKey} until ${artifactPath} has Boundary Recommendation (or legacy Split Recommendation) with Needed: no.`,
    );
  }
  if (routeBack !== "no") {
    throw new Error(
      `Cannot complete ${verificationKey} until ${artifactPath} has Route Back with Needed: no.`,
    );
  }
}

function requireSliceBuildReady(verificationKey, artifactPath) {
  if (!hasFileContent(artifactPath)) {
    throw new Error(
      `Cannot complete ${verificationKey} until ${artifactPath} exists and contains build evidence.`,
    );
  }

  const text = fs.readFileSync(artifactPath, "utf8");
  const builtYes = latestFieldValue(text, "Built", "yes|no") === "yes";
  const fixNeededYes = latestFieldValue(text, "Fix Needed", "yes|no") === "yes";
  const routeBack = routeBackField(text);
  if (!builtYes || routeBack !== "no" || fixNeededYes) {
    throw new Error(
      `Cannot complete ${verificationKey} until ${artifactPath} says Built: yes, has Route Back with Needed: no, and has no fix needed.`,
    );
  }
}

function requireReviewedVerificationArtifact(verificationKey, artifactPath, resultField) {
  if (!hasFileContent(artifactPath)) {
    throw new Error(
      `Cannot complete ${verificationKey} until ${artifactPath} exists and contains verification evidence.`,
    );
  }

  const text = fs.readFileSync(artifactPath, "utf8");
  const reviewReturned = latestFieldValue(text, "Review results returned", "yes|no") === "yes";
  const resultYes = latestFieldValue(text, resultField, "yes|no") === "yes";
  const fixNeededNo = latestFieldValue(text, "Fix Needed", "yes|no") === "no";
  const routeBack = routeBackField(text);
  const postBrowserLensStatus =
    verificationKey === "buildVerified"
      ? latestFieldValue(text, "Post-browser visual/browser lenses", "pass|issues|blocked|not run")
      : null;

  if (
    !reviewReturned ||
    !resultYes ||
    !fixNeededNo ||
    routeBack !== "no" ||
    (verificationKey === "buildVerified" &&
      postBrowserLensStatus !== "pass" &&
      postBrowserLensStatus !== "not run") ||
    hasStaleMarker(text) ||
    hasBlockingReviewText(text)
  ) {
    throw new Error(
      `Cannot complete ${verificationKey} until ${artifactPath} says Review results returned: yes, ${resultField}: yes, Fix Needed: no, Route Back with Needed: no, required post-browser review status when applicable, and has no stale or blocking review findings.`,
    );
  }
}

function hasRouteBackNeededYes(text) {
  return routeBackField(text) === "yes";
}

function routeBackField(text) {
  const routeBack = markdownSection(text, "Route Back");
  return routeBack ? latestFieldValue(routeBack, "Needed", "yes|no") : null;
}

function hasStaleMarker(text) {
  return latestFieldValue(text, "Stale", "yes|no") === "yes";
}

function hasBlockingReviewText(text) {
  const verdict = latestFieldValue(text, "Verdict", "pass|accepted-risk|needs-fix|blocked");
  const automatedChecks = latestFieldValue(text, "Automated checks", "pass|issues|blocked|failed");
  const readyForBrowser = latestFieldValue(text, "Ready for browser", "yes|no");
  const mustFixCount = Number.parseInt(latestFieldValue(text, "Must Fix count", "\\d+") ?? "", 10);
  return (
    verdict === "blocked" ||
    automatedChecks === "issues" ||
    automatedChecks === "blocked" ||
    automatedChecks === "failed" ||
    readyForBrowser === "no" ||
    mustFixCount > 0 ||
    /^Suggested Category:[^\S\r\n]*Must Fix\b/mi.test(text) ||
    /^Severity:[^\S\r\n]*Must Fix\b/mi.test(text)
  );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function markdownSection(text, heading) {
  return markdownLastSection(text, heading)?.body ?? null;
}

function markdownLastSection(text, heading) {
  const sections = markdownSections(text, heading);
  return sections.at(-1) ?? null;
}

function markdownSections(text, heading) {
  const headingPattern = new RegExp(`^##[ \\t]+${escapeRegExp(heading)}[ \\t]*$`, "gim");
  const sections = [];
  let match;
  while ((match = headingPattern.exec(text)) !== null) {
    const start = match.index + match[0].length;
    const nextHeadingPattern = /^#{1,2}[ \t]+\S.*$/gim;
    nextHeadingPattern.lastIndex = start;
    const next = nextHeadingPattern.exec(text);
    sections.push({ index: match.index, body: text.slice(start, next ? next.index : text.length) });
  }
  return sections;
}

function reviewFields(text) {
  const verdict = latestFieldValue(text, "Verdict", "pass|accepted-risk|needs-fix");
  const mustFixCountText = latestFieldValue(text, "Must Fix count", "\\d+");
  const mustFixCount = Number.parseInt(mustFixCountText ?? "", 10);
  const reviewReturned = latestFieldValue(text, "Review results returned", "yes|no") === "yes";
  return { reviewReturned, verdict, mustFixCount };
}

function latestFieldValue(text, fieldName, valuePattern) {
  return lastRegexMatch(
    text,
    new RegExp(`^${escapeRegExp(fieldName)}:[^\\S\\r\\n]*(${valuePattern})\\b`, "gmi"),
  )?.[1].toLowerCase();
}

function lastRegexMatch(text, pattern) {
  let last = null;
  for (const match of text.matchAll(pattern)) {
    last = match;
  }
  return last;
}

function markdownSectionAfter(text, heading, afterIndex) {
  return markdownLastSectionAfter(text, heading, afterIndex);
}

function markdownLastSectionAfter(text, heading, afterIndex) {
  const headingPattern = new RegExp(`^##[ \\t]+${escapeRegExp(heading)}[ \\t]*$`, "gim");
  let last = null;
  let match;
  while ((match = headingPattern.exec(text)) !== null) {
    if (match.index <= afterIndex) {
      continue;
    }

    const start = match.index + match[0].length;
    const nextHeadingPattern = /^#{1,2}[ \t]+\S.*$/gim;
    nextHeadingPattern.lastIndex = start;
    const next = nextHeadingPattern.exec(text);
    last = text.slice(start, next ? next.index : text.length);
  }
  return last;
}

function requireResearchScopeCheckpoint(verificationKey, artifactPath) {
  if (!hasFileContent(artifactPath)) {
    throw new Error(
      `Cannot complete ${verificationKey} until ${artifactPath} exists and contains a research user checkpoint.`,
    );
  }

  const text = fs.readFileSync(artifactPath, "utf8");
  const checkpoint = markdownLastSection(text, "User Checkpoint");
  const hasReadyYes = latestFieldValue(checkpoint?.body ?? "", "Ready to research", "yes|no") === "yes";
  const hasUserResponse = /^User response:[^\S\r\n]*\S.+$/mi.test(checkpoint?.body ?? "");

  if (!checkpoint || !hasReadyYes || !hasUserResponse) {
    throw new Error(
      `Cannot complete ${verificationKey} until ${artifactPath} has ## User Checkpoint, a non-empty User response, and Ready to research: yes.`,
    );
  }
}

function requireReadyForGrill(verificationKey, artifactPath) {
  if (!hasFileContent(artifactPath)) {
    throw new Error(
      `Cannot complete ${verificationKey} until ${artifactPath} exists and contains a research index.`,
    );
  }

  const text = fs.readFileSync(artifactPath, "utf8");
  const readySection = markdownSection(text, "Ready For Grill");
  if (latestFieldValue(readySection ?? "", "Ready for grill", "yes|no") !== "yes") {
    throw new Error(
      `Cannot complete ${verificationKey} until ${artifactPath} says Ready for grill: yes.`,
    );
  }
}

function requireReadyForSlicing(verificationKey, artifactPath) {
  if (!hasFileContent(artifactPath)) {
    throw new Error(
      `Cannot complete ${verificationKey} until ${artifactPath} exists and contains phase research.`,
    );
  }

  const text = fs.readFileSync(artifactPath, "utf8");
  const readySection = markdownSection(text, "Ready For Slicing");
  if (latestFieldValue(readySection ?? "", "Ready for slicing", "yes|no") !== "yes") {
    throw new Error(
      `Cannot complete ${verificationKey} until ${artifactPath} says Ready for slicing: yes.`,
    );
  }
}

function requirePhaseResearchAudit(verificationKey, researchPath, auditPath) {
  if (!hasFileContent(auditPath)) {
    throw new Error(
      `Cannot complete ${verificationKey} until ${auditPath} exists and contains a phase research audit.`,
    );
  }

  const researchText = fs.readFileSync(researchPath, "utf8");
  const auditText = fs.readFileSync(auditPath, "utf8");
  const researchAuditRollup = markdownLastSection(researchText, "Research Audit");
  const researchFields = reviewFields(researchAuditRollup?.body ?? "");
  const auditStatusSection = markdownLastSection(auditText, "Review Status");
  const auditVerdictSection = markdownLastSection(auditText, "Verdict");
  const auditFields = reviewFields(`${auditStatusSection?.body ?? auditText}\n${auditVerdictSection?.body ?? auditText}`);
  const hasPassingResearchRollup =
    Boolean(researchAuditRollup) &&
    (researchFields.verdict === "pass" || researchFields.verdict === "accepted-risk") &&
    researchFields.mustFixCount === 0;
  const hasPassingAudit =
    auditFields.reviewReturned &&
    (auditFields.verdict === "pass" || auditFields.verdict === "accepted-risk") &&
    auditFields.mustFixCount === 0;

  if (!hasPassingResearchRollup || !hasPassingAudit) {
    throw new Error(
      `Cannot complete ${verificationKey} until ${researchPath} and ${auditPath} show Review results returned: yes, Verdict: pass or accepted-risk, and Must Fix count: 0.`,
    );
  }
}

function requireResearchReports(verificationKey, scopePath, indexPath) {
  const scopeText = fs.readFileSync(scopePath, "utf8");
  const indexText = fs.readFileSync(indexPath, "utf8");
  const approvedItemIds = researchItemIds(scopeText);

  if (approvedItemIds.length === 0) {
    if (!noMaterialResearchNeeded(scopeText)) {
      throw new Error(
        `Cannot complete ${verificationKey} until ${scopePath} either lists approved research item IDs or says No material research needed: yes.`,
      );
    }
    return;
  }

  const reportsById = researchReportsById(indexText);
  const researchRoot = path.dirname(indexPath);
  const missing = [];

  for (const itemId of approvedItemIds) {
    const report = reportsById.get(itemId);
    if (!report?.file || !report?.status || report.status === "not needed") {
      missing.push(itemId);
      continue;
    }

    const reportPath = safeResearchReportPath(researchRoot, report.file);
    if (!reportPath || !hasFileContent(reportPath)) {
      missing.push(`${itemId} (${report.file})`);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Cannot complete ${verificationKey} until each approved research item has a non-empty report file referenced by ${indexPath}: ${missing.join(", ")}.`,
    );
  }
}

function noMaterialResearchNeeded(scopeText) {
  return latestFieldValue(scopeText, "No material research needed", "yes|no") === "yes";
}

function requireResearchAudits(verificationKey, scopePath, indexPath) {
  const scopeText = fs.readFileSync(scopePath, "utf8");
  const indexText = fs.readFileSync(indexPath, "utf8");
  const approvedItemIds = researchItemIds(scopeText);

  if (approvedItemIds.length === 0) {
    return;
  }

  const auditsById = researchAuditsById(indexText);
  const researchRoot = path.dirname(indexPath);
  const missing = [];

  for (const itemId of approvedItemIds) {
    const audit = auditsById.get(itemId);
    const mustFixCount = Number.parseInt(audit?.mustFixCount ?? "", 10);
    const acceptableVerdict = audit?.verdict === "pass" || audit?.verdict === "accepted-risk";
    if (!audit?.file || !acceptableVerdict || mustFixCount !== 0) {
      missing.push(itemId);
      continue;
    }

    const auditPath = safeResearchAuditPath(researchRoot, audit.file);
    if (!auditPath || !hasFileContent(auditPath)) {
      missing.push(`${itemId} (${audit.file})`);
      continue;
    }

    const auditText = fs.readFileSync(auditPath, "utf8");
    const auditFields = reviewFields(auditText);
    const auditFilePasses =
      auditFields.reviewReturned &&
      (auditFields.verdict === "pass" || auditFields.verdict === "accepted-risk") &&
      auditFields.mustFixCount === 0;
    if (!auditFilePasses) {
      missing.push(`${itemId} (${audit.file}: audit file not passing)`);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Cannot complete ${verificationKey} until each approved research item has a non-empty audit file with Review results returned: yes, Verdict pass or accepted-risk, and Must Fix count 0 referenced by ${indexPath}: ${missing.join(", ")}.`,
    );
  }
}

function researchItemIds(scopeText) {
  const ids = [];
  const pattern = /^\s*-?\s*ID:\s*([a-z0-9][a-z0-9-]*)\s*$/gim;
  let match;
  while ((match = pattern.exec(scopeText))) {
    const id = match[1].toLowerCase();
    if (!["none", "n-a", "na", "not-needed"].includes(id)) {
      ids.push(id);
    }
  }
  return [...new Set(ids)];
}

function researchAuditsById(indexText) {
  const audits = new Map();
  let inAudits = false;
  let current = null;

  for (const line of indexText.split(/\r?\n/)) {
    if (/^##\s+/.test(line)) {
      inAudits = /^##\s+Research Audit\b/i.test(line);
      current = null;
      continue;
    }
    if (!inAudits) continue;

    const idMatch = line.match(/^\s*-\s*ID:\s*([a-z0-9][a-z0-9-]*)\s*$/i);
    if (idMatch) {
      current = { id: idMatch[1].toLowerCase(), file: "", verdict: "", mustFixCount: "" };
      audits.set(current.id, current);
      continue;
    }

    if (!current) continue;
    const fileMatch = line.match(/^\s*Audit file:\s*(\S.*)$/i);
    if (fileMatch) {
      current.file = fileMatch[1].trim();
      continue;
    }

    const verdictMatch = line.match(/^\s*Verdict:\s*(pass|needs-fix|accepted-risk)\b/i);
    if (verdictMatch) {
      current.verdict = verdictMatch[1].toLowerCase();
      continue;
    }

    const countMatch = line.match(/^\s*Must Fix count:\s*(\d+)\s*$/i);
    if (countMatch) {
      current.mustFixCount = countMatch[1];
    }
  }

  return audits;
}

function researchReportsById(indexText) {
  const reports = new Map();
  let inReports = false;
  let current = null;

  for (const line of indexText.split(/\r?\n/)) {
    if (/^##\s+/.test(line)) {
      inReports = /^##\s+Reports\b/i.test(line);
      current = null;
      continue;
    }
    if (!inReports) continue;

    const idMatch = line.match(/^\s*-\s*ID:\s*([a-z0-9][a-z0-9-]*)\s*$/i);
    if (idMatch) {
      current = { id: idMatch[1].toLowerCase(), file: "", status: "" };
      reports.set(current.id, current);
      continue;
    }

    if (!current) continue;
    const fileMatch = line.match(/^\s*File:\s*(\S.*)$/i);
    if (fileMatch) {
      current.file = fileMatch[1].trim();
      continue;
    }

    const statusMatch = line.match(/^\s*Status:\s*(complete|partial|not needed)\b/i);
    if (statusMatch) {
      current.status = statusMatch[1].toLowerCase();
    }
  }

  return reports;
}

function safeResearchAuditPath(researchRoot, auditFile) {
  if (!auditFile || auditFile === "-" || /^none$/i.test(auditFile)) return null;
  if (path.isAbsolute(auditFile)) return null;
  const normalized = path.normalize(auditFile);
  if (normalized.startsWith("..") || normalized.includes(`${path.sep}..${path.sep}`)) return null;
  if (!normalized.startsWith(`audits${path.sep}`) || !normalized.endsWith(".md")) {
    return null;
  }
  return path.join(researchRoot, normalized);
}

function safeResearchReportPath(researchRoot, reportFile) {
  if (!reportFile || reportFile === "-" || /^none$/i.test(reportFile)) return null;
  if (path.isAbsolute(reportFile)) return null;
  const normalized = path.normalize(reportFile);
  if (normalized.startsWith("..") || normalized.includes(`${path.sep}..${path.sep}`)) return null;
  if (normalized === "scope.md" || normalized === "index.md" || !normalized.endsWith(".md")) {
    return null;
  }
  return path.join(researchRoot, normalized);
}

function hasFileContent(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const stat = fs.statSync(filePath);
  if (!stat.isFile()) return false;
  return fs.readFileSync(filePath, "utf8").trim().length > 0;
}

function artifactFilePath(statePath = DEFAULT_STATE_PATH, initiativeId, ...segments) {
  return path.join(path.dirname(statePath), "initiatives", initiativeId, ...segments);
}

function phaseArtifactIds(statePath = DEFAULT_STATE_PATH, initiativeId) {
  const phasesRoot = path.join(path.dirname(statePath), "initiatives", initiativeId, "phases");
  return childIds(phasesRoot, "phase-");
}

function sliceArtifactIds(statePath = DEFAULT_STATE_PATH, initiativeId, phaseId) {
  const slicesRoot = path.join(
    path.dirname(statePath),
    "initiatives",
    initiativeId,
    "phases",
    phaseId,
    "slices",
  );
  return childIds(slicesRoot, "slice-");
}

function childIds(root, prefix) {
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(prefix))
    .map((entry) => entry.name)
    .sort((left, right) => compareNumberedIds(left, right, prefix.slice(0, -1)));
}

export function reopenCheck(state, verificationKey, options = {}) {
  const current = getNextStep(state);
  if (current.status !== "active") {
    throw new Error(`Cannot reopen verification: current status is ${current.status}.`);
  }

  const workflow = workflowForCurrentScope(state, current);
  reopenWorkflowCheck(workflow, verificationKey, "current scope");
  reopenCurrentScopeDependents(state, current, verificationKey);
  markStaleArtifactsAfterReopen(state, current, verificationKey, options.statePath);
  return getNextStep(state);
}

export function reopenPhaseCheck(state, phaseId, verificationKey, options = {}) {
  const normalizedPhaseId = normalizePhaseId(phaseId);

  const initiative = getActiveInitiative(state);
  if (!initiative) {
    throw new Error("Cannot reopen phase verification: no active initiative.");
  }

  const phase = (initiative.phases ?? []).find((item) => item.id === normalizedPhaseId);
  if (!phase) {
    throw new Error(`Phase not found: ${normalizedPhaseId}`);
  }

  reopenWorkflowCheck(phase.phaseWorkflow, verificationKey, normalizedPhaseId);
  if (
    verificationKey === "phaseSpecCreated" ||
    verificationKey === "phaseResearchComplete" ||
    verificationKey === "slicesCreated"
  ) {
    for (const slice of phase.slices ?? []) {
      resetWorkflow(slice.sliceWorkflow);
    }
  }
  reopenWorkflowKey(initiative.initiativeWorkflow, "allPhasesVerified");
  markStaleArtifactsAfterReopen(
    state,
    { initiativeId: initiative.id, phaseId: normalizedPhaseId },
    verificationKey,
    options.statePath,
  );
  return getNextStep(state);
}

export function reopenSliceCheck(state, phaseId, sliceId, verificationKey, options = {}) {
  const normalizedPhaseId = normalizePhaseId(phaseId);
  const normalizedSliceId = normalizeSliceId(sliceId);

  const initiative = getActiveInitiative(state);
  if (!initiative) {
    throw new Error("Cannot reopen slice verification: no active initiative.");
  }

  const phase = (initiative.phases ?? []).find((item) => item.id === normalizedPhaseId);
  if (!phase) {
    throw new Error(`Phase not found: ${normalizedPhaseId}`);
  }

  const slice = (phase.slices ?? []).find((item) => item.id === normalizedSliceId);
  if (!slice) {
    throw new Error(`Slice not found in ${normalizedPhaseId}: ${normalizedSliceId}`);
  }

  reopenWorkflowCheck(slice.sliceWorkflow, verificationKey, `${normalizedPhaseId}/${normalizedSliceId}`);
  reopenWorkflowKey(phase.phaseWorkflow, "allSlicesVerified");
  reopenWorkflowKey(initiative.initiativeWorkflow, "allPhasesVerified");
  markStaleArtifactsAfterReopen(
    state,
    { initiativeId: initiative.id, phaseId: normalizedPhaseId, sliceId: normalizedSliceId },
    verificationKey,
    options.statePath,
  );
  return getNextStep(state);
}

function markStaleArtifactsAfterReopen(state, current, verificationKey, statePath = DEFAULT_STATE_PATH) {
  const artifactPaths = reviewedArtifactPathsAffectedByReopen(state, current, verificationKey, statePath);
  for (const artifactPath of artifactPaths) {
    markArtifactStale(artifactPath, verificationKey);
  }
}

function reviewedArtifactPathsAffectedByReopen(state, current, verificationKey, statePath) {
  const paths = [];
  const initiative = (state.initiatives ?? []).find((item) => item.id === current.initiativeId);
  if (!initiative) return paths;

  const addInitiativeVerification = () => {
    paths.push(artifactFilePath(statePath, current.initiativeId, "verification.md"));
  };
  const addPhaseVerification = (phaseId) => {
    paths.push(artifactFilePath(statePath, current.initiativeId, "phases", phaseId, "verification.md"));
  };
  const addSliceVerifications = (phaseId, sliceId) => {
    paths.push(
      artifactFilePath(
        statePath,
        current.initiativeId,
        "phases",
        phaseId,
        "slices",
        sliceId,
        "plan-verification.md",
      ),
      artifactFilePath(
        statePath,
        current.initiativeId,
        "phases",
        phaseId,
        "slices",
        sliceId,
        "build-verification.md",
      ),
    );
  };

  if (current.sliceId) {
    if (verificationKey === "planVerified") {
      addSliceVerifications(current.phaseId, current.sliceId);
    } else if (verificationKey === "buildVerified") {
      paths.push(
        artifactFilePath(
          statePath,
          current.initiativeId,
          "phases",
          current.phaseId,
          "slices",
          current.sliceId,
          "build-verification.md",
        ),
      );
    } else {
      addSliceVerifications(current.phaseId, current.sliceId);
    }
    addPhaseVerification(current.phaseId);
    addInitiativeVerification();
    return paths;
  }

  if (current.phaseId) {
    const phase = (initiative.phases ?? []).find((item) => item.id === current.phaseId);
    if (verificationKey !== "allSlicesVerified") {
      for (const slice of phase?.slices ?? []) {
        addSliceVerifications(current.phaseId, slice.id);
      }
    }
    addPhaseVerification(current.phaseId);
    addInitiativeVerification();
    return paths;
  }

  if (verificationKey !== "allPhasesVerified") {
    for (const phase of initiative.phases ?? []) {
      for (const slice of phase.slices ?? []) {
        addSliceVerifications(phase.id, slice.id);
      }
      addPhaseVerification(phase.id);
    }
  }
  addInitiativeVerification();
  return paths;
}

function markArtifactStale(artifactPath, verificationKey) {
  if (!hasFileContent(artifactPath)) return;
  const text = fs.readFileSync(artifactPath, "utf8");
  if (hasStaleMarker(text)) return;
  fs.appendFileSync(
    artifactPath,
    `\n\n## Strike Stale Marker\nStale: yes\nReason: invalidated by reopening ${verificationKey}; rerun the owning verifier.\n`,
  );
}

function reopenWorkflowCheck(workflow, verificationKey, label) {
  const itemIndex = (workflow ?? []).findIndex((entry) =>
    Object.hasOwn(entry.verified ?? {}, verificationKey),
  );
  if (itemIndex === -1) {
    const validKeys = (workflow ?? []).flatMap((entry) => Object.keys(entry.verified ?? {}));
    throw new Error(
      `Unknown verification key "${verificationKey}" in ${label}. Valid keys: ${validKeys.join(", ")}`,
    );
  }

  for (const item of workflow.slice(itemIndex)) {
    for (const key of Object.keys(item.verified ?? {})) {
      item.verified[key] = false;
    }
  }
}

function reopenWorkflowKey(workflow, verificationKey) {
  const item = (workflow ?? []).find((entry) =>
    Object.hasOwn(entry.verified ?? {}, verificationKey),
  );
  if (item) {
    item.verified[verificationKey] = false;
  }
}

function resetWorkflow(workflow) {
  for (const item of workflow ?? []) {
    for (const key of Object.keys(item.verified ?? {})) {
      item.verified[key] = false;
    }
  }
}

function reopenCurrentScopeDependents(state, current, verificationKey) {
  const initiative = (state.initiatives ?? []).find((item) => item.id === current.initiativeId);
  if (!initiative) return;

  if (current.sliceId) {
    const phase = (initiative.phases ?? []).find((item) => item.id === current.phaseId);
    if (phase) {
      reopenWorkflowKey(phase.phaseWorkflow, "allSlicesVerified");
    }
    reopenWorkflowKey(initiative.initiativeWorkflow, "allPhasesVerified");
    return;
  }

  if (current.phaseId) {
    const phase = (initiative.phases ?? []).find((item) => item.id === current.phaseId);
    if (phase && PHASE_UPSTREAM_CHECKS.has(verificationKey)) {
      for (const slice of phase.slices ?? []) {
        resetWorkflow(slice.sliceWorkflow);
      }
    }
    reopenWorkflowKey(initiative.initiativeWorkflow, "allPhasesVerified");
    return;
  }

  if (INITIATIVE_UPSTREAM_CHECKS.has(verificationKey)) {
    for (const phase of initiative.phases ?? []) {
      resetWorkflow(phase.phaseWorkflow);
      for (const slice of phase.slices ?? []) {
        resetWorkflow(slice.sliceWorkflow);
      }
    }
  }
}

export function addPhase(state, phaseId, name = null) {
  const normalizedPhaseId = normalizePhaseId(phaseId);

  const initiative = getActiveInitiative(state);
  if (!initiative) {
    throw new Error("Cannot add phase: no active initiative.");
  }

  initiative.phases ??= [];
  if (initiative.phases.some((phase) => phase.id === normalizedPhaseId)) {
    throw new Error(`Phase already exists: ${normalizedPhaseId}`);
  }

  const phase = {
    id: normalizedPhaseId,
    name: name || normalizedPhaseId,
    phaseWorkflow: workflowFromTemplate(PHASE_WORKFLOW),
    slices: [],
  };
  initiative.phases.push(phase);
  initiative.phases.sort((left, right) => compareNumberedIds(left.id, right.id, "phase"));
  return phase;
}

export function addSlice(state, phaseId, sliceId, name = null) {
  const normalizedPhaseId = normalizePhaseId(phaseId);
  const normalizedSliceId = normalizeSliceId(sliceId);

  const initiative = getActiveInitiative(state);
  if (!initiative) {
    throw new Error("Cannot add slice: no active initiative.");
  }

  const phase = (initiative.phases ?? []).find((item) => item.id === normalizedPhaseId);
  if (!phase) {
    throw new Error(`Phase not found: ${normalizedPhaseId}`);
  }

  phase.slices ??= [];
  if (phase.slices.some((slice) => slice.id === normalizedSliceId)) {
    throw new Error(`Slice already exists in ${normalizedPhaseId}: ${normalizedSliceId}`);
  }

  const slice = {
    id: normalizedSliceId,
    name: name || normalizedSliceId,
    sliceWorkflow: workflowFromTemplate(SLICE_WORKFLOW),
  };
  phase.slices.push(slice);
  phase.slices.sort((left, right) => compareNumberedIds(left.id, right.id, "slice"));
  return { initiative, phase, slice };
}

export function removeSlice(state, phaseId, sliceId) {
  const normalizedPhaseId = normalizePhaseId(phaseId);
  const normalizedSliceId = normalizeSliceId(sliceId);

  const initiative = getActiveInitiative(state);
  if (!initiative) {
    throw new Error("Cannot remove slice: no active initiative.");
  }

  const phase = (initiative.phases ?? []).find((item) => item.id === normalizedPhaseId);
  if (!phase) {
    throw new Error(`Phase not found: ${normalizedPhaseId}`);
  }

  const index = (phase.slices ?? []).findIndex((slice) => slice.id === normalizedSliceId);
  if (index === -1) {
    throw new Error(`Slice not found in ${normalizedPhaseId}: ${normalizedSliceId}`);
  }

  const slice = phase.slices[index];
  const completedChecks = (slice.sliceWorkflow ?? [])
    .flatMap((item) => Object.entries(item?.verified ?? {}))
    .filter(([, value]) => value === true)
    .map(([key]) => key);
  if (completedChecks.length > 0) {
    throw new Error(
      `Cannot remove slice ${normalizedSliceId}: completed checks exist (${completedChecks.join(", ")}). Only unstarted slices can be removed.`,
    );
  }

  phase.slices.splice(index, 1);
  return { initiative, phase, slice };
}

function firstIncomplete(workflow, skipSkills, scope, onlySkills = null) {
  for (const item of workflow ?? []) {
    if (skipSkills?.has(item.skill)) continue;
    if (onlySkills && !onlySkills.has(item.skill)) continue;

    const missing = missingChecks(item);
    if (missing.length > 0) {
      return {
        status: "active",
        ...scope,
        skill: item.skill,
        missing,
        gateHints: Object.fromEntries(
          missing.map((checkName) => [
            checkName,
            GATE_HINTS[checkName] ??
              "complete-check validates this step's artifact and explains any refusal.",
          ]),
        ),
      };
    }
  }

  return null;
}

function missingChecks(item) {
  const verified = item?.verified;
  if (!verified || typeof verified !== "object" || Array.isArray(verified)) {
    return ["verified"];
  }

  const entries = Object.entries(verified);
  if (entries.length === 0) {
    return ["verified"];
  }

  return entries.filter(([, value]) => value !== true).map(([key]) => key);
}

function withArtifacts(current) {
  return {
    ...current,
    artifacts: artifactPathsForCurrent(current),
  };
}

export function artifactPathsForCurrent(current) {
  if (current.status !== "active") return [];

  const initiativeRoot = `${WORKSPACE_ROOT}/initiatives/${current.initiativeId}`;
  const phaseRoot = current.phaseId ? `${initiativeRoot}/phases/${current.phaseId}` : null;
  const sliceRoot =
    phaseRoot && current.sliceId ? `${phaseRoot}/slices/${current.sliceId}` : null;

  switch (current.skill) {
    case "refine-idea":
      return [`${initiativeRoot}/idea.md`];
    case "research-initiative":
      return [
        `${initiativeRoot}/research/scope.md`,
        `${initiativeRoot}/research/<research-item-id>.md`,
        `${initiativeRoot}/research/audits/<research-item-id>.md`,
        `${initiativeRoot}/research/index.md`,
      ];
    case "grill-idea":
      return [`${initiativeRoot}/decisions.md`];
    case "create-main-spec":
      return [`${initiativeRoot}/main-spec.md`];
    case "create-development-phases":
      return [`${initiativeRoot}/development-plan.md`, `${initiativeRoot}/phases/<phase-id>/phase.md`];
    case "create-phase-spec":
      return phaseRoot ? [`${phaseRoot}/phase-spec.md`] : [];
    case "research-phase":
      return phaseRoot ? [`${phaseRoot}/research.md`, `${phaseRoot}/research-audit.md`] : [];
    case "create-phase-slices":
      return phaseRoot ? [`${phaseRoot}/slices/<slice-id>/slice.md`] : [];
    case "plan-slice":
      return sliceRoot ? [`${sliceRoot}/plan.md`] : [];
    case "verify-slice-plan":
      return sliceRoot ? [`${sliceRoot}/plan-verification.md`] : [];
    case "build-slice":
      return sliceRoot ? ["implementation files", `${sliceRoot}/build.md`] : ["implementation files"];
    case "verify-slice-build":
      return sliceRoot ? [`${sliceRoot}/build-verification.md`] : [];
    case "verify-phase":
      return phaseRoot ? [`${phaseRoot}/verification.md`] : [];
    case "verify-main-spec":
      return [`${initiativeRoot}/verification.md`];
    default:
      return [];
  }
}

function findCurrentWorkflowItem(state, current) {
  const workflow = workflowForCurrentScope(state, current);
  const item = (workflow ?? []).find((entry) => entry.skill === current.skill);
  if (!item) {
    throw new Error(`Workflow item not found: ${current.skill}`);
  }

  return item;
}

function workflowForCurrentScope(state, current) {
  const initiative = (state.initiatives ?? []).find((item) => item.id === current.initiativeId);
  if (!initiative) {
    throw new Error(`Initiative not found: ${current.initiativeId}`);
  }

  let workflow = initiative.initiativeWorkflow;
  if (current.phaseId) {
    const phase = (initiative.phases ?? []).find((item) => item.id === current.phaseId);
    if (!phase) {
      throw new Error(`Phase not found: ${current.phaseId}`);
    }
    workflow = phase.phaseWorkflow;

    if (current.sliceId) {
      const slice = (phase.slices ?? []).find((item) => item.id === current.sliceId);
      if (!slice) {
        throw new Error(`Slice not found: ${current.sliceId}`);
      }
      workflow = slice.sliceWorkflow;
    }
  }

  return workflow;
}

function readState(filePath, options = {}) {
  const state = normalizeState(JSON.parse(fs.readFileSync(filePath, "utf8")));
  return normalizeState(hydrateState(filePath, state, options));
}

function writeState(filePath, state) {
  normalizeState(state);
  const workspaceRoot = path.dirname(filePath);
  for (const initiative of state.initiatives ?? []) {
    if (!isDetailedInitiative(initiative)) {
      continue;
    }
    writeJsonFile(
      initiativeStatePath(workspaceRoot, initiative.id),
      initiativeStateDocument(initiative),
    );
  }
  writeJsonFile(filePath, createStateIndex(state));
}

function hydrateState(filePath, state, options = {}) {
  if (!isSplitStateIndex(state)) {
    return state;
  }

  const hydrate = options.hydrate ?? "active";
  if (hydrate === "none") {
    return state;
  }

  const workspaceRoot = path.dirname(filePath);
  const ids = initiativeIdsToHydrate(state, options);
  return {
    ...state,
    initiatives: (state.initiatives ?? []).map((entry) => {
      if (!ids.has(entry.id)) {
        return entry;
      }
      return hydrateInitiativeState(workspaceRoot, state, entry);
    }),
  };
}

function initiativeIdsToHydrate(state, options = {}) {
  if (options.hydrate === "all") {
    return new Set((state.initiatives ?? []).map((entry) => entry.id));
  }

  const ids = new Set(options.initiativeIds ?? []);
  if (options.initiativeId) {
    ids.add(options.initiativeId);
  }
  if (options.hydrate === "active" || (!options.hydrate && ids.size === 0)) {
    const activeId =
      state.activeInitiativeId ??
      (state.initiatives ?? []).find((entry) => entry.status === "active")?.id;
    if (activeId) {
      ids.add(activeId);
    }
  }
  return ids;
}

function hydrateInitiativeState(workspaceRoot, rootState, entry) {
  if (entry?.initiativeWorkflow || entry?.phases) {
    return entry;
  }

  validateSplitInitiativeEntry(entry);
  const detailPath = initiativeStatePath(workspaceRoot, entry.id);
  if (!fs.existsSync(detailPath)) {
    throw new Error(`Initiative state file is missing for ${entry.id}: ${detailPath}`);
  }

  const detail = JSON.parse(fs.readFileSync(detailPath, "utf8"));
  if (detail?.id && detail.id !== entry.id) {
    throw new Error(`Initiative state id mismatch for ${entry.id}: detail file contains ${detail.id}`);
  }
  return {
    ...detail,
    id: entry.id,
    name: entry.name ?? detail.name ?? entry.id,
    status: entry.status ?? (rootState.activeInitiativeId === entry.id ? "active" : "paused"),
  };
}

function hydrateInitiativeById(statePath, state, initiativeId) {
  const workspaceRoot = path.dirname(statePath);
  const index = (state.initiatives ?? []).findIndex((entry) => entry.id === initiativeId);
  if (index === -1) {
    throw new Error(`Initiative not found: ${initiativeId}`);
  }
  state.initiatives[index] = hydrateInitiativeState(workspaceRoot, state, state.initiatives[index]);
  normalizeInitiative(state.initiatives[index]);
  return state.initiatives[index];
}

function isSplitStateIndex(state) {
  return (
    state &&
    typeof state === "object" &&
    state.version >= STATE_VERSION &&
    Array.isArray(state.initiatives) &&
    state.initiatives.some((entry) => entry?.statePath)
  );
}

function initiativeStateRelativePath(initiativeId) {
  validateId(initiativeId, "Initiative id");
  return `initiatives/${initiativeId}/state.json`;
}

function initiativeStatePath(workspaceRoot, initiativeId) {
  const detailPath = path.resolve(workspaceRoot, initiativeStateRelativePath(initiativeId));
  const initiativesRoot = path.resolve(workspaceRoot, "initiatives");
  if (!detailPath.startsWith(`${initiativesRoot}${path.sep}`)) {
    throw new Error(`Initiative state path must stay inside ${initiativesRoot}: ${detailPath}`);
  }
  return detailPath;
}

function validateSplitInitiativeEntry(entry) {
  validateId(entry.id, "Initiative id");
  const expectedPath = initiativeStateRelativePath(entry.id);
  if (entry.statePath !== undefined && entry.statePath !== expectedPath) {
    throw new Error(`Initiative statePath mismatch for ${entry.id}: expected ${expectedPath}`);
  }
}

function writeJsonFile(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tempPath, filePath);
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function parseArgs(args) {
  const positional = [];
  let statePath = DEFAULT_STATE_PATH;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--state") {
      statePath = args[index + 1];
      if (!statePath) {
        throw new Error("--state requires a path.");
      }
      index += 1;
    } else {
      positional.push(arg);
    }
  }

  return { positional, statePath };
}

function validateId(id, label) {
  if (typeof id !== "string" || !/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    throw new Error(`${label} must use lowercase letters, numbers, and dashes: ${id}`);
  }
}

function normalizePhaseId(id) {
  return normalizeNumberedId(id, "phase", "Phase id");
}

function normalizeSliceId(id) {
  return normalizeNumberedId(id, "slice", "Slice id");
}

function normalizeNumberedId(id, prefix, label) {
  const value = String(id ?? "").trim().toLowerCase();
  const body = value.startsWith(`${prefix}-`) ? value.slice(prefix.length + 1) : value;
  const match = body.match(/^(\d+)(?:-?([a-z]))?$/);
  if (!match) {
    throw new Error(
      `${label} must be numeric or canonical, such as ${prefix}-01 or ${prefix}-01-b. Use the display name argument for human names.`,
    );
  }

  const number = Number.parseInt(match[1], 10);
  if (!Number.isSafeInteger(number) || number < 1) {
    throw new Error(`${label} number must be 1 or greater, such as ${prefix}-01.`);
  }

  const ordinal = String(number).padStart(2, "0");
  const suffix = match[2] ? `-${match[2]}` : "";
  return `${prefix}-${ordinal}${suffix}`;
}

function compareNumberedIds(leftId, rightId, prefix) {
  const left = parseNumberedId(leftId, prefix);
  const right = parseNumberedId(rightId, prefix);
  if (left.number !== right.number) {
    return left.number - right.number;
  }
  return left.suffix.localeCompare(right.suffix);
}

function parseNumberedId(id, prefix) {
  const match = String(id ?? "").match(new RegExp(`^${prefix}-(\\d+)(?:-([a-z]))?$`));
  if (!match) {
    return { number: Number.MAX_SAFE_INTEGER, suffix: String(id ?? "") };
  }

  return {
    number: Number.parseInt(match[1], 10),
    suffix: match[2] ?? "",
  };
}

function initWorkspace(id, name, statePath) {
  validateId(id, "Initiative id");

  if (fs.existsSync(statePath)) {
    throw new Error(`State already exists: ${statePath}`);
  }

  const paths = workspacePaths(statePath);
  const initiativePath = path.join(paths.workspaceRoot, "initiatives", id);

  fs.mkdirSync(path.dirname(paths.helperPath), { recursive: true });
  fs.mkdirSync(initiativePath, { recursive: true });
  createLanguageFile(paths.languagePath);
  createGuidanceFiles(paths.implementationDisciplinePath, IMPLEMENTATION_DISCIPLINE_TEMPLATES);
  createReviewLensFiles(paths.reviewLensesPath);
  syncHelper(paths.helperPath);

  const state = createInitialState(id, name);
  writeState(statePath, state);
  return {
    statePath,
    helperPath: paths.helperPath,
    initiativePath,
    languagePath: paths.languagePath,
    implementationDisciplinePath: paths.implementationDisciplinePath,
    reviewLensesPath: paths.reviewLensesPath,
    nextStep: getNextStep(state),
  };
}

function workspacePaths(statePath) {
  const workspaceRoot = path.dirname(statePath);
  const repoRoot = path.dirname(workspaceRoot);
  const userGuidancePath = path.join(workspaceRoot, USER_GUIDANCE_DIR);
  return {
    workspaceRoot,
    helperPath: path.join(workspaceRoot, "scripts/state.mjs"),
    languagePath: path.join(repoRoot, LANGUAGE_FILE),
    implementationDisciplinePath: path.join(userGuidancePath, IMPLEMENTATION_DISCIPLINE_DIR),
    reviewLensesPath: path.join(userGuidancePath, REVIEW_LENSES_DIR),
  };
}

function createLanguageFile(languagePath) {
  if (fs.existsSync(languagePath)) return;
  fs.writeFileSync(
    languagePath,
    `# Project Language

This file names durable project language for code, UI, docs, planning, and modeling.
It is a glossary, not a spec, implementation guide, ADR, or planning scratchpad.
`,
  );
}

function createReviewLensFiles(reviewLensesPath) {
  createGuidanceFiles(reviewLensesPath, REVIEW_LENS_TEMPLATES);
}

function createGuidanceFiles(rootPath, templates) {
  fs.mkdirSync(rootPath, { recursive: true });
  for (const [filename, content] of templates) {
    const filePath = path.join(rootPath, filename);
    if (fs.existsSync(filePath)) continue;
    fs.writeFileSync(filePath, content);
  }
}

function syncHelper(helperPath) {
  fs.mkdirSync(path.dirname(helperPath), { recursive: true });
  const source = fs.readFileSync(SCRIPT_FILE, "utf8");
  const paths = workspacePaths(path.join(path.dirname(path.dirname(helperPath)), "state.json"));
  createLanguageFile(paths.languagePath);
  createGuidanceFiles(paths.implementationDisciplinePath, IMPLEMENTATION_DISCIPLINE_TEMPLATES);
  createReviewLensFiles(paths.reviewLensesPath);

  if (fs.existsSync(helperPath)) {
    const existing = fs.readFileSync(helperPath, "utf8");
    if (existing !== source) {
      if (!isStrikeStateHelper(existing)) {
        throw new Error(`Refusing to overwrite unrecognized existing helper: ${helperPath}`);
      }
      fs.writeFileSync(helperPath, source);
      return {
        helperPath,
        refreshed: true,
        guidancePath: paths.implementationDisciplinePath,
        reviewLensesPath: paths.reviewLensesPath,
      };
    }
    return {
      helperPath,
      refreshed: false,
      guidancePath: paths.implementationDisciplinePath,
      reviewLensesPath: paths.reviewLensesPath,
    };
  }

  fs.copyFileSync(SCRIPT_FILE, helperPath);
  return {
    helperPath,
    refreshed: true,
    guidancePath: paths.implementationDisciplinePath,
    reviewLensesPath: paths.reviewLensesPath,
  };
}

function isStrikeStateHelper(text) {
  return (
    text.includes('DEFAULT_STATE_PATH = "strike/state.json"') &&
    text.includes("INITIATIVE_WORKFLOW") &&
    text.includes("complete-check")
  );
}

export function main() {
  const [command, ...rawArgs] = process.argv.slice(2);
  const { positional: args, statePath } = parseArgs(rawArgs);

  if (command === "template") {
    const id = args[0];
    if (!id) {
      throw new Error("Usage: state.mjs template <initiative-id> [name]");
    }
    printJson(createInitialState(id, args[1] ?? id));
    return;
  }

  if (command === "init") {
    const id = args[0];
    if (!id) {
      throw new Error("Usage: state.mjs init <initiative-id> [name] [--state path]");
    }
    printJson(initWorkspace(id, args.slice(1).join(" ") || id, statePath));
    return;
  }

  if (command === "sync-helper") {
    const result = syncHelper(workspacePaths(statePath).helperPath);
    printJson(result);
    return;
  }

  if (command === "next-step") {
    printJson(getNextStep(readState(statePath)));
    return;
  }

  if (command === "list-initiatives") {
    const state = readState(statePath, { hydrate: "none" });
    const active = getActiveInitiative(state);
    printJson({
      activeInitiativeId: active?.id ?? null,
      initiatives: listInitiatives(state),
    });
    return;
  }

  if (command === "add-initiative") {
    const id = args[0];
    if (!id) {
      throw new Error("Usage: state.mjs add-initiative <initiative-id> [name] [--state path]");
    }
    const state = readState(statePath, { hydrate: "none" });
    const initiative = addInitiative(state, id, args.slice(1).join(" ") || id);
    const initiativePath = path.join(path.dirname(statePath), "initiatives", initiative.id);
    fs.mkdirSync(initiativePath, { recursive: true });
    writeState(statePath, state);
    printJson({
      initiative: initiativeSummary(initiative),
      initiativePath,
      nextStep: getNextStep(state),
      initiatives: listInitiatives(state),
    });
    return;
  }

  if (command === "set-active") {
    const id = args[0];
    if (!id) {
      throw new Error("Usage: state.mjs set-active <initiative-id> [--state path]");
    }
    const state = readState(statePath, { hydrate: "none" });
    const initiative = setActiveInitiative(state, id);
    hydrateInitiativeById(statePath, state, initiative.id);
    writeState(statePath, state);
    printJson({
      initiative: initiativeSummary(initiative),
      nextStep: getNextStep(state),
      initiatives: listInitiatives(state),
    });
    return;
  }

  if (command === "finish-initiative") {
    const state = args[0]
      ? readState(statePath, { initiativeId: args[0] })
      : readState(statePath);
    const initiative = finishInitiative(state, args[0] ?? null);
    writeState(statePath, state);
    printJson({
      initiative: initiativeSummary(initiative),
      nextStep: getNextStep(state),
      initiatives: listInitiatives(state),
    });
    return;
  }

  if (command === "complete-check") {
    const verificationKey = args[0];
    if (!verificationKey) {
      throw new Error("Usage: state.mjs complete-check <check-name> [--state path]");
    }
    const state = readState(statePath);
    const receipt = completeCheck(state, verificationKey, { statePath });
    writeState(statePath, state);
    printJson(receipt);
    return;
  }

  if (command === "reopen-check") {
    const verificationKey = args[0];
    if (!verificationKey) {
      throw new Error("Usage: state.mjs reopen-check <check-name> [--state path]");
    }
    const state = readState(statePath);
    const current = reopenCheck(state, verificationKey, { statePath });
    writeState(statePath, state);
    printJson(current);
    return;
  }

  if (command === "reopen-phase-check") {
    const phaseId = args[0];
    const verificationKey = args[1];
    if (!phaseId || !verificationKey) {
      throw new Error("Usage: state.mjs reopen-phase-check <phase-id> <check-name> [--state path]");
    }
    const state = readState(statePath);
    const current = reopenPhaseCheck(state, phaseId, verificationKey, { statePath });
    writeState(statePath, state);
    printJson(current);
    return;
  }

  if (command === "reopen-slice-check") {
    const phaseId = args[0];
    const sliceId = args[1];
    const verificationKey = args[2];
    if (!phaseId || !sliceId || !verificationKey) {
      throw new Error("Usage: state.mjs reopen-slice-check <phase-id> <slice-id> <check-name> [--state path]");
    }
    const state = readState(statePath);
    const current = reopenSliceCheck(state, phaseId, sliceId, verificationKey, { statePath });
    writeState(statePath, state);
    printJson(current);
    return;
  }

  if (command === "add-phase") {
    const phaseId = args[0];
    if (!phaseId) {
      throw new Error("Usage: state.mjs add-phase <phase-id> [name] [--state path]");
    }
    const state = readState(statePath);
    const phase = addPhase(state, phaseId, args.slice(1).join(" ") || null);
    const initiative = getActiveInitiative(state);
    const phasePath = path.join(
      path.dirname(statePath),
      "initiatives",
      initiative.id,
      "phases",
      phase.id,
    );
    fs.mkdirSync(phasePath, { recursive: true });
    writeState(statePath, state);
    printJson({
      phase,
      phasePath,
      nextStep: getNextStep(state),
    });
    return;
  }

  if (command === "add-slice") {
    const phaseId = args[0];
    const sliceId = args[1];
    if (!phaseId || !sliceId) {
      throw new Error("Usage: state.mjs add-slice <phase-id> <slice-id> [name] [--state path]");
    }
    const state = readState(statePath);
    const { initiative, phase, slice } = addSlice(
      state,
      phaseId,
      sliceId,
      args.slice(2).join(" ") || null,
    );
    const slicePath = path.join(
      path.dirname(statePath),
      "initiatives",
      initiative.id,
      "phases",
      phase.id,
      "slices",
      slice.id,
    );
    fs.mkdirSync(slicePath, { recursive: true });
    writeState(statePath, state);
    printJson({
      slice,
      slicePath,
      nextStep: getNextStep(state),
    });
    return;
  }

  if (command === "remove-slice") {
    const phaseId = args[0];
    const sliceId = args[1];
    if (!phaseId || !sliceId) {
      throw new Error("Usage: state.mjs remove-slice <phase-id> <slice-id> [--state path]");
    }
    const state = readState(statePath);
    const { initiative, phase, slice } = removeSlice(state, phaseId, sliceId);
    const slicePath = path.join(
      path.dirname(statePath),
      "initiatives",
      initiative.id,
      "phases",
      phase.id,
      "slices",
      slice.id,
    );
    writeState(statePath, state);
    printJson({
      removedSlice: slice,
      slicePath,
      note: "Slice removed from workflow state only. Fold any needed slice.md content into the surviving slice, then delete this slice directory so future slicesCreated checks stay consistent.",
      nextStep: getNextStep(state),
    });
    return;
  }

  throw new Error(
    "Usage: state.mjs <template|init|sync-helper|next-step|list-initiatives|add-initiative|set-active|finish-initiative|complete-check|reopen-check|reopen-phase-check|reopen-slice-check|add-phase|add-slice|remove-slice> ...",
  );
}

function isMainModule() {
  try {
    return Boolean(process.argv[1]) && fs.realpathSync(process.argv[1]) === fs.realpathSync(SCRIPT_FILE);
  } catch {
    return false;
  }
}

if (isMainModule()) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
