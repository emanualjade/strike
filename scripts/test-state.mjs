#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const helper = path.join(root, "plugins/strike/skills/go/scripts/state.mjs");
const newInitiativeHelper = path.join(
  root,
  "plugins/strike/skills/new-initiative/scripts/state.mjs",
);
const tempRoots = [];

process.on("exit", () => {
  for (const repo of tempRoots) {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

function tempRepo() {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), "strike-state-"));
  tempRoots.push(repo);
  return repo;
}

function run(repo, script, args) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: repo,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  assert.equal(
    result.status,
    0,
    `${path.basename(script)} ${args.join(" ")} failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
  return JSON.parse(result.stdout);
}

function runFail(repo, script, args, pattern) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: repo,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  assert.notEqual(result.status, 0, `${args.join(" ")} should fail`);
  assert.match(result.stderr, pattern);
}

function workspaceHelper(repo) {
  return path.join(repo, "strike/scripts/state.mjs");
}

function assertNextStep(nextStep, expected) {
  for (const [key, value] of Object.entries(expected)) {
    assert.deepEqual(nextStep[key], value, `${key} should match`);
  }
}

function complete(repo, checkName, expected) {
  writeWorkflowCheckpointArtifact(repo, checkName);
  const receipt = run(repo, workspaceHelper(repo), ["complete-check", checkName]);
  assertNextStep(receipt, {
    status: "recorded",
    completedCheck: checkName,
    runNext: "node strike/scripts/state.mjs next-step",
  });
  assert.ok(receipt.initiativeId, "completion receipt should name the initiative");
  assert.ok(receipt.skill, "completion receipt should name the completed skill");

  const nextStep = run(repo, workspaceHelper(repo), ["next-step"]);
  assertNextStep(nextStep, expected);
  return nextStep;
}

function writeArtifact(repo, relativePath, content = "# Test Artifact\n\nReady.\n") {
  const artifactPath = path.join(repo, relativePath);
  fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
  fs.writeFileSync(artifactPath, content);
}

function writeWorkflowCheckpointArtifact(repo, checkName) {
  if (checkName !== "ideaRefined" && checkName !== "decisionsResolved") {
    return;
  }

  const statePath = path.join(repo, "strike/state.json");
  if (!fs.existsSync(statePath)) {
    return;
  }

  const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  const initiative = state.initiatives.find((item) => item.status === "active");
  if (!initiative) {
    return;
  }

  const artifactName = checkName === "ideaRefined" ? "idea.md" : "decisions.md";
  const artifactPath = path.join(repo, "strike/initiatives", initiative.id, artifactName);
  if (fs.existsSync(artifactPath)) {
    return;
  }

  writeArtifact(
    repo,
    path.join("strike/initiatives", initiative.id, artifactName),
    `# Test Artifact

## User Checkpoint
Prompt: Are you ready to continue?
User response: Yes, continue.
Ready to continue: yes
`,
  );
}

function writePhaseArtifacts(repo, initiativeId, phaseIds) {
  writeArtifact(repo, `strike/initiatives/${initiativeId}/development-plan.md`);
  for (const phaseId of phaseIds) {
    writeArtifact(repo, `strike/initiatives/${initiativeId}/phases/${phaseId}/phase.md`);
  }
}

function testUserCheckpointRequiredForIdeaAndGrill() {
  const repo = tempRepo();
  run(repo, helper, ["init", "gallery", "Gallery"]);
  const localHelper = workspaceHelper(repo);

  runFail(repo, localHelper, ["complete-check", "ideaRefined"], /user checkpoint/);

  writeArtifact(repo, "strike/initiatives/gallery/idea.md", "# Refined Idea\n\nNo checkpoint.\n");
  runFail(repo, localHelper, ["complete-check", "ideaRefined"], /User Checkpoint/);

  writeArtifact(
    repo,
    "strike/initiatives/gallery/idea.md",
    `# Refined Idea

## User Checkpoint
Prompt: Are you ready?
User response:
Ready to continue: yes
`,
  );
  runFail(repo, localHelper, ["complete-check", "ideaRefined"], /non-empty User response/);

  writeArtifact(
    repo,
    "strike/initiatives/gallery/idea.md",
    `# Refined Idea

## User Checkpoint
Prompt: Are you ready?
User response: Yes, continue.
Ready to continue: yes
`,
  );
  complete(repo, "ideaRefined", { skill: "grill-idea" });

  runFail(repo, localHelper, ["complete-check", "decisionsResolved"], /user checkpoint/);

  writeArtifact(
    repo,
    "strike/initiatives/gallery/decisions.md",
    `# Idea Decisions

## User Checkpoint
Prompt: Are you ready for spec?
User response: Yes, continue.
Ready to continue: yes
`,
  );
  complete(repo, "decisionsResolved", { skill: "create-main-spec" });
}

function writeSliceArtifacts(repo, initiativeId, phaseId, sliceIds) {
  for (const sliceId of sliceIds) {
    writeArtifact(repo, `strike/initiatives/${initiativeId}/phases/${phaseId}/slices/${sliceId}/slice.md`);
  }
}

function bootstrapTwoSliceWorkflow(repo) {
  run(repo, helper, ["init", "gallery", "Gallery"]);
  complete(repo, "ideaRefined", { skill: "grill-idea" });
  complete(repo, "decisionsResolved", { skill: "create-main-spec" });
  complete(repo, "specCreated", { skill: "create-development-phases" });
  run(repo, workspaceHelper(repo), ["add-phase", "1", "Upload and display"]);
  writePhaseArtifacts(repo, "gallery", ["phase-01"]);
  complete(repo, "phasesCreated", { phaseId: "phase-01", skill: "create-phase-spec" });
  complete(repo, "phaseSpecCreated", { phaseId: "phase-01", skill: "create-phase-slices" });
  run(repo, workspaceHelper(repo), ["add-slice", "phase-01", "1", "Upload image"]);
  run(repo, workspaceHelper(repo), ["add-slice", "phase-01", "2", "Display gallery"]);
  writeSliceArtifacts(repo, "gallery", "phase-01", ["slice-01", "slice-02"]);
  complete(repo, "slicesCreated", {
    phaseId: "phase-01",
    sliceId: "slice-01",
    skill: "research-slice",
  });
}

function completeSlice(repo, expectedAfterBuildVerified) {
  complete(repo, "researchComplete", { skill: "plan-slice" });
  complete(repo, "planCreated", { skill: "verify-slice-plan" });
  complete(repo, "planVerified", { skill: "build-slice" });
  complete(repo, "implemented", { skill: "verify-slice-build" });
  complete(repo, "buildVerified", expectedAfterBuildVerified);
}

function testBootstrapAndWorkflowProgression() {
  const repo = tempRepo();

  const init = run(repo, helper, ["init", "gallery", "Gallery"]);
  assert.equal(init.nextStep.skill, "refine-idea");
  assert.ok(fs.existsSync(path.join(repo, "PROJECT_LANGUAGE.md")));
  assert.match(fs.readFileSync(path.join(repo, "PROJECT_LANGUAGE.md"), "utf8"), /^# Project Language/m);
  assert.ok(fs.existsSync(path.join(repo, "strike/user-guidance/implementation-discipline/global.md")));
  assert.match(
    fs.readFileSync(path.join(repo, "strike/user-guidance/implementation-discipline/global.md"), "utf8"),
    /^# Global Implementation Discipline/m,
  );
  assert.ok(fs.existsSync(path.join(repo, "strike/user-guidance/implementation-discipline/plan-slice.md")));
  assert.ok(fs.existsSync(path.join(repo, "strike/user-guidance/implementation-discipline/build-slice.md")));
  assert.ok(fs.existsSync(path.join(repo, "strike/user-guidance/implementation-discipline/fix.md")));
  assert.ok(fs.existsSync(path.join(repo, "strike/user-guidance/implementation-discipline/verify-slice-plan.md")));
  assert.ok(fs.existsSync(path.join(repo, "strike/user-guidance/implementation-discipline/verify-slice-build.md")));
  assert.ok(fs.existsSync(path.join(repo, "strike/user-guidance/implementation-discipline/verify-phase.md")));
  assert.ok(fs.existsSync(path.join(repo, "strike/user-guidance/implementation-discipline/verify-main-spec.md")));
  assert.ok(fs.existsSync(path.join(repo, "strike/user-guidance/review-lenses/global.md")));
  assert.ok(fs.existsSync(path.join(repo, "strike/user-guidance/review-lenses/verify-slice-plan.md")));
  assert.ok(fs.existsSync(path.join(repo, "strike/user-guidance/review-lenses/verify-slice-build.md")));
  assert.ok(fs.existsSync(path.join(repo, "strike/user-guidance/review-lenses/verify-phase.md")));
  assert.ok(fs.existsSync(path.join(repo, "strike/user-guidance/review-lenses/verify-main-spec.md")));
  assert.ok(fs.existsSync(path.join(repo, "strike/state.json")));
  assert.ok(fs.existsSync(workspaceHelper(repo)));
  assert.ok(fs.existsSync(path.join(repo, "strike/initiatives/gallery")));

  let nextStep = run(repo, workspaceHelper(repo), ["next-step"]);
  assertNextStep(nextStep, {
    skill: "refine-idea",
    missing: ["ideaRefined"],
    artifacts: ["strike/initiatives/gallery/idea.md"],
  });

  complete(repo, "ideaRefined", {
    skill: "grill-idea",
    missing: ["decisionsResolved"],
    artifacts: ["strike/initiatives/gallery/decisions.md"],
  });
  complete(repo, "decisionsResolved", {
    skill: "create-main-spec",
    missing: ["specCreated"],
    artifacts: ["strike/initiatives/gallery/main-spec.md"],
  });
  complete(repo, "specCreated", {
    skill: "create-development-phases",
    missing: ["phasesCreated"],
    artifacts: [
      "strike/initiatives/gallery/development-plan.md",
      "strike/initiatives/gallery/phases/<phase-id>/phase.md",
    ],
  });

  const phase = run(repo, workspaceHelper(repo), ["add-phase", "1", "Upload and display"]);
  assert.equal(phase.phase.id, "phase-01");
  assert.ok(fs.existsSync(path.join(repo, "strike/initiatives/gallery/phases/phase-01")));
  writePhaseArtifacts(repo, "gallery", ["phase-01"]);

  complete(repo, "phasesCreated", {
    phaseId: "phase-01",
    skill: "create-phase-spec",
    missing: ["phaseSpecCreated"],
    artifacts: ["strike/initiatives/gallery/phases/phase-01/phase-spec.md"],
  });
  complete(repo, "phaseSpecCreated", {
    phaseId: "phase-01",
    skill: "create-phase-slices",
    missing: ["slicesCreated"],
    artifacts: ["strike/initiatives/gallery/phases/phase-01/slices/<slice-id>/slice.md"],
  });

  run(repo, workspaceHelper(repo), ["add-slice", "phase-1", "1", "Upload image"]);
  run(repo, workspaceHelper(repo), ["add-slice", "01", "slice-2", "Display gallery"]);
  assert.ok(fs.existsSync(path.join(repo, "strike/initiatives/gallery/phases/phase-01/slices/slice-02")));
  writeSliceArtifacts(repo, "gallery", "phase-01", ["slice-01", "slice-02"]);

  complete(repo, "slicesCreated", {
    phaseId: "phase-01",
    sliceId: "slice-01",
    skill: "research-slice",
    missing: ["researchComplete"],
    artifacts: ["strike/initiatives/gallery/phases/phase-01/slices/slice-01/research.md"],
  });
  complete(repo, "researchComplete", {
    phaseId: "phase-01",
    sliceId: "slice-01",
    skill: "plan-slice",
    missing: ["planCreated"],
    artifacts: ["strike/initiatives/gallery/phases/phase-01/slices/slice-01/plan.md"],
  });
  complete(repo, "planCreated", {
    phaseId: "phase-01",
    sliceId: "slice-01",
    skill: "verify-slice-plan",
    missing: ["planVerified"],
    artifacts: ["strike/initiatives/gallery/phases/phase-01/slices/slice-01/plan-verification.md"],
  });
  const reopenedResearch = run(repo, workspaceHelper(repo), ["reopen-check", "researchComplete"]);
  assertNextStep(reopenedResearch, {
    phaseId: "phase-01",
    sliceId: "slice-01",
    skill: "research-slice",
    missing: ["researchComplete"],
    artifacts: ["strike/initiatives/gallery/phases/phase-01/slices/slice-01/research.md"],
  });
  complete(repo, "researchComplete", {
    phaseId: "phase-01",
    sliceId: "slice-01",
    skill: "plan-slice",
    missing: ["planCreated"],
    artifacts: ["strike/initiatives/gallery/phases/phase-01/slices/slice-01/plan.md"],
  });
  complete(repo, "planCreated", {
    phaseId: "phase-01",
    sliceId: "slice-01",
    skill: "verify-slice-plan",
    missing: ["planVerified"],
    artifacts: ["strike/initiatives/gallery/phases/phase-01/slices/slice-01/plan-verification.md"],
  });
  complete(repo, "planVerified", {
    phaseId: "phase-01",
    sliceId: "slice-01",
    skill: "build-slice",
    missing: ["implemented"],
    artifacts: ["implementation files", "strike/initiatives/gallery/phases/phase-01/slices/slice-01/build.md"],
  });
  complete(repo, "implemented", {
    phaseId: "phase-01",
    sliceId: "slice-01",
    skill: "verify-slice-build",
    missing: ["buildVerified"],
    artifacts: ["strike/initiatives/gallery/phases/phase-01/slices/slice-01/build-verification.md"],
  });
  complete(repo, "buildVerified", {
    phaseId: "phase-01",
    sliceId: "slice-02",
    skill: "research-slice",
    missing: ["researchComplete"],
    artifacts: ["strike/initiatives/gallery/phases/phase-01/slices/slice-02/research.md"],
  });
  complete(repo, "researchComplete", {
    phaseId: "phase-01",
    sliceId: "slice-02",
    skill: "plan-slice",
    missing: ["planCreated"],
    artifacts: ["strike/initiatives/gallery/phases/phase-01/slices/slice-02/plan.md"],
  });

  complete(repo, "planCreated", { phaseId: "phase-01", sliceId: "slice-02", skill: "verify-slice-plan" });
  complete(repo, "planVerified", { phaseId: "phase-01", sliceId: "slice-02", skill: "build-slice" });
  complete(repo, "implemented", { phaseId: "phase-01", sliceId: "slice-02", skill: "verify-slice-build" });
  complete(repo, "buildVerified", {
    phaseId: "phase-01",
    skill: "verify-phase",
    missing: ["allSlicesVerified"],
    artifacts: ["strike/initiatives/gallery/phases/phase-01/verification.md"],
  });
  const reopenedSliceBuild = run(repo, workspaceHelper(repo), ["reopen-slice-check", "phase-1", "2", "buildVerified"]);
  assertNextStep(reopenedSliceBuild, {
    phaseId: "phase-01",
    sliceId: "slice-02",
    skill: "verify-slice-build",
    missing: ["buildVerified"],
    artifacts: ["strike/initiatives/gallery/phases/phase-01/slices/slice-02/build-verification.md"],
  });
  complete(repo, "buildVerified", {
    phaseId: "phase-01",
    skill: "verify-phase",
    missing: ["allSlicesVerified"],
    artifacts: ["strike/initiatives/gallery/phases/phase-01/verification.md"],
  });
  complete(repo, "allSlicesVerified", {
    skill: "verify-main-spec",
    missing: ["allPhasesVerified"],
    artifacts: ["strike/initiatives/gallery/verification.md"],
  });
  const reopenedPhaseFinal = run(repo, workspaceHelper(repo), ["reopen-phase-check", "1", "allSlicesVerified"]);
  assertNextStep(reopenedPhaseFinal, {
    phaseId: "phase-01",
    skill: "verify-phase",
    missing: ["allSlicesVerified"],
    artifacts: ["strike/initiatives/gallery/phases/phase-01/verification.md"],
  });
  complete(repo, "allSlicesVerified", {
    skill: "verify-main-spec",
    missing: ["allPhasesVerified"],
    artifacts: ["strike/initiatives/gallery/verification.md"],
  });
  const reopenedPhaseSlices = run(repo, workspaceHelper(repo), ["reopen-phase-check", "phase-1", "slicesCreated"]);
  assertNextStep(reopenedPhaseSlices, {
    phaseId: "phase-01",
    skill: "create-phase-slices",
    missing: ["slicesCreated"],
    artifacts: ["strike/initiatives/gallery/phases/phase-01/slices/<slice-id>/slice.md"],
  });
  complete(repo, "slicesCreated", {
    phaseId: "phase-01",
    sliceId: "slice-01",
    skill: "research-slice",
    missing: ["researchComplete"],
  });
  complete(repo, "researchComplete", { phaseId: "phase-01", sliceId: "slice-01", skill: "plan-slice" });
  complete(repo, "planCreated", { phaseId: "phase-01", sliceId: "slice-01", skill: "verify-slice-plan" });
  complete(repo, "planVerified", { phaseId: "phase-01", sliceId: "slice-01", skill: "build-slice" });
  complete(repo, "implemented", { phaseId: "phase-01", sliceId: "slice-01", skill: "verify-slice-build" });
  complete(repo, "buildVerified", { phaseId: "phase-01", sliceId: "slice-02", skill: "research-slice" });
  complete(repo, "researchComplete", { phaseId: "phase-01", sliceId: "slice-02", skill: "plan-slice" });
  complete(repo, "planCreated", { phaseId: "phase-01", sliceId: "slice-02", skill: "verify-slice-plan" });
  complete(repo, "planVerified", { phaseId: "phase-01", sliceId: "slice-02", skill: "build-slice" });
  complete(repo, "implemented", { phaseId: "phase-01", sliceId: "slice-02", skill: "verify-slice-build" });
  complete(repo, "buildVerified", { phaseId: "phase-01", skill: "verify-phase" });
  complete(repo, "allSlicesVerified", {
    skill: "verify-main-spec",
    missing: ["allPhasesVerified"],
    artifacts: ["strike/initiatives/gallery/verification.md"],
  });

  nextStep = complete(repo, "allPhasesVerified", {
    status: "idle",
    reason: "No active initiative.",
  });

  const completedState = JSON.parse(fs.readFileSync(path.join(repo, "strike/state.json"), "utf8"));
  assert.equal(completedState.initiatives[0].status, "complete");

  const addedAfterComplete = run(repo, workspaceHelper(repo), [
    "add-initiative",
    "payment-system",
    "Payment system",
  ]);
  assert.deepEqual(
    addedAfterComplete.initiatives.map(({ id, status }) => [id, status]),
    [
      ["gallery", "complete"],
      ["payment-system", "active"],
    ],
  );
}

function testPhaseAndSliceRegistrationRequired() {
  const repo = tempRepo();
  run(repo, helper, ["init", "gallery", "Gallery"]);
  const localHelper = workspaceHelper(repo);

  complete(repo, "ideaRefined", { skill: "grill-idea" });
  complete(repo, "decisionsResolved", { skill: "create-main-spec" });
  complete(repo, "specCreated", { skill: "create-development-phases" });
  runFail(repo, localHelper, ["complete-check", "phasesCreated"], /at least one phase/);

  fs.mkdirSync(path.join(repo, "strike/initiatives/gallery/phases/phase-01"), { recursive: true });
  fs.mkdirSync(path.join(repo, "strike/initiatives/gallery/phases/phase-02"), { recursive: true });
  run(repo, localHelper, ["add-phase", "1", "Upload and display"]);
  runFail(repo, localHelper, ["complete-check", "phasesCreated"], /phase-02/);
  run(repo, localHelper, ["add-phase", "2", "Export gallery"]);
  runFail(repo, localHelper, ["complete-check", "phasesCreated"], /development-plan\.md/);
  writeArtifact(repo, "strike/initiatives/gallery/development-plan.md", "   \n");
  runFail(repo, localHelper, ["complete-check", "phasesCreated"], /development-plan\.md/);
  writeArtifact(repo, "strike/initiatives/gallery/development-plan.md");
  runFail(repo, localHelper, ["complete-check", "phasesCreated"], /phase-01\/phase\.md/);
  writeArtifact(repo, "strike/initiatives/gallery/phases/phase-01/phase.md");
  runFail(repo, localHelper, ["complete-check", "phasesCreated"], /phase-02\/phase\.md/);
  writeArtifact(repo, "strike/initiatives/gallery/phases/phase-02/phase.md");
  complete(repo, "phasesCreated", { phaseId: "phase-01", skill: "create-phase-spec" });
  complete(repo, "phaseSpecCreated", { phaseId: "phase-01", skill: "create-phase-slices" });

  fs.mkdirSync(path.join(repo, "strike/initiatives/gallery/phases/phase-01/slices/slice-01"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(repo, "strike/initiatives/gallery/phases/phase-01/slices/slice-02"), {
    recursive: true,
  });
  runFail(repo, localHelper, ["complete-check", "slicesCreated"], /at least one slice/);

  run(repo, localHelper, ["add-slice", "phase-01", "1", "Upload image"]);
  runFail(repo, localHelper, ["complete-check", "slicesCreated"], /slice-02/);
  run(repo, localHelper, ["add-slice", "phase-01", "2", "Display gallery"]);
  runFail(repo, localHelper, ["complete-check", "slicesCreated"], /slice-01\/slice\.md/);
  writeArtifact(
    repo,
    "strike/initiatives/gallery/phases/phase-01/slices/slice-01/slice.md",
    "\n\t\n",
  );
  runFail(repo, localHelper, ["complete-check", "slicesCreated"], /slice-01\/slice\.md/);
  writeArtifact(repo, "strike/initiatives/gallery/phases/phase-01/slices/slice-01/slice.md");
  runFail(repo, localHelper, ["complete-check", "slicesCreated"], /slice-02\/slice\.md/);
  writeArtifact(repo, "strike/initiatives/gallery/phases/phase-01/slices/slice-02/slice.md");
  complete(repo, "slicesCreated", {
    phaseId: "phase-01",
    sliceId: "slice-01",
    skill: "research-slice",
  });
}

function testStrictCommands() {
  const repo = tempRepo();
  run(repo, helper, ["init", "gallery", "Gallery"]);
  const localHelper = workspaceHelper(repo);

  runFail(repo, localHelper, ["complete-check", "notAKey"], /Unknown verification key/);
  runFail(repo, localHelper, ["reopen-check", "notAKey"], /Unknown verification key/);
  runFail(repo, localHelper, ["add-phase", "phase-0!"], /Phase id must be numeric or canonical/);
  runFail(repo, localHelper, ["add-phase", "payments"], /Use the display name argument/);
  runFail(repo, localHelper, ["add-phase", "phase-0"], /Phase id number must be 1 or greater/);

  const phase = run(repo, localHelper, ["add-phase", "1-b", "Flexible phase"]);
  assert.equal(phase.phase.id, "phase-01-b");
  runFail(repo, localHelper, ["add-phase", "phase-1B"], /Phase already exists: phase-01-b/);
  runFail(repo, localHelper, ["add-slice", "phase-02", "slice-01"], /Phase not found: phase-02/);
  runFail(repo, localHelper, ["add-slice", "phase-01-b", "payments"], /Slice id must be numeric or canonical/);
  runFail(repo, localHelper, ["reopen-phase-check", "phase-02", "allSlicesVerified"], /Phase not found: phase-02/);
  runFail(repo, localHelper, ["reopen-phase-check", "phase-01-b", "notAKey"], /Unknown verification key/);

  const slice = run(repo, localHelper, ["add-slice", "01-b", "1B", "Flexible slice"]);
  assert.equal(slice.slice.id, "slice-01-b");
  runFail(repo, localHelper, ["reopen-slice-check", "phase-01-b", "slice-01-b", "notAKey"], /Unknown verification key/);
  runFail(repo, localHelper, ["add-slice", "phase-01-b", "slice-01-b"], /Slice already exists in phase-01-b: slice-01-b/);
}

function testNewInitiativeHelperWrapper() {
  const repo = tempRepo();

  const init = run(repo, newInitiativeHelper, ["init", "ledger", "Ledger"]);
  assert.equal(init.nextStep.skill, "refine-idea");
  assert.ok(fs.existsSync(path.join(repo, "PROJECT_LANGUAGE.md")));
  assert.ok(fs.existsSync(path.join(repo, "strike/user-guidance/implementation-discipline/global.md")));
  assert.ok(fs.existsSync(path.join(repo, "strike/user-guidance/review-lenses/global.md")));
  assert.ok(fs.existsSync(path.join(repo, "strike/state.json")));
  assert.ok(fs.existsSync(workspaceHelper(repo)));
  assert.ok(fs.existsSync(path.join(repo, "strike/initiatives/ledger")));
}

function testInitPreservesProjectGuidanceFiles() {
  const repo = tempRepo();
  const languagePath = path.join(repo, "PROJECT_LANGUAGE.md");
  const disciplinePath = path.join(repo, "strike/user-guidance/implementation-discipline/global.md");
  const globalReviewLensPath = path.join(repo, "strike/user-guidance/review-lenses/global.md");
  fs.mkdirSync(path.dirname(disciplinePath), { recursive: true });
  fs.mkdirSync(path.dirname(globalReviewLensPath), { recursive: true });
  fs.writeFileSync(languagePath, "# Project Language\n\nExisting language.\n");
  fs.writeFileSync(disciplinePath, "# Global Implementation Discipline\n\n- Existing rule.\n");
  fs.writeFileSync(globalReviewLensPath, "# Global Review Lenses\n\n- Existing lens.\n");

  run(repo, helper, ["init", "gallery", "Gallery"]);

  assert.equal(fs.readFileSync(languagePath, "utf8"), "# Project Language\n\nExisting language.\n");
  assert.equal(
    fs.readFileSync(disciplinePath, "utf8"),
    "# Global Implementation Discipline\n\n- Existing rule.\n",
  );
  assert.equal(fs.readFileSync(globalReviewLensPath, "utf8"), "# Global Review Lenses\n\n- Existing lens.\n");
  assert.ok(fs.existsSync(path.join(repo, "strike/user-guidance/implementation-discipline/build-slice.md")));
  assert.ok(fs.existsSync(path.join(repo, "strike/user-guidance/review-lenses/verify-slice-build.md")));
}

function testRouteBackCommandContract() {
  const repo = tempRepo();
  bootstrapTwoSliceWorkflow(repo);
  const localHelper = workspaceHelper(repo);

  complete(repo, "researchComplete", {
    phaseId: "phase-01",
    sliceId: "slice-01",
    skill: "plan-slice",
  });
  complete(repo, "planCreated", {
    phaseId: "phase-01",
    sliceId: "slice-01",
    skill: "verify-slice-plan",
    missing: ["planVerified"],
  });

  const reopenedPlan = run(repo, localHelper, ["reopen-check", "planCreated"]);
  assertNextStep(reopenedPlan, {
    phaseId: "phase-01",
    sliceId: "slice-01",
    skill: "plan-slice",
    missing: ["planCreated"],
    artifacts: ["strike/initiatives/gallery/phases/phase-01/slices/slice-01/plan.md"],
  });
  runFail(repo, localHelper, ["reopen-check", "allSlicesVerified"], /Unknown verification key/);

  complete(repo, "planCreated", { phaseId: "phase-01", sliceId: "slice-01", skill: "verify-slice-plan" });
  complete(repo, "planVerified", { phaseId: "phase-01", sliceId: "slice-01", skill: "build-slice" });
  complete(repo, "implemented", { phaseId: "phase-01", sliceId: "slice-01", skill: "verify-slice-build" });
  complete(repo, "buildVerified", { phaseId: "phase-01", sliceId: "slice-02", skill: "research-slice" });

  completeSlice(repo, {
    phaseId: "phase-01",
    skill: "verify-phase",
    missing: ["allSlicesVerified"],
  });
  complete(repo, "allSlicesVerified", {
    skill: "verify-main-spec",
    missing: ["allPhasesVerified"],
  });

  const reopenedSlice = run(repo, localHelper, [
    "reopen-slice-check",
    "phase-01",
    "slice-02",
    "buildVerified",
  ]);
  assertNextStep(reopenedSlice, {
    phaseId: "phase-01",
    sliceId: "slice-02",
    skill: "verify-slice-build",
    missing: ["buildVerified"],
    artifacts: ["strike/initiatives/gallery/phases/phase-01/slices/slice-02/build-verification.md"],
  });

  const stateAfterSliceBack = JSON.parse(fs.readFileSync(path.join(repo, "strike/state.json"), "utf8"));
  assert.equal(stateAfterSliceBack.initiatives[0].phases[0].phaseWorkflow[2].verified.allSlicesVerified, false);
  assert.equal(stateAfterSliceBack.initiatives[0].initiativeWorkflow[4].verified.allPhasesVerified, false);

  complete(repo, "buildVerified", {
    phaseId: "phase-01",
    skill: "verify-phase",
    missing: ["allSlicesVerified"],
  });
  complete(repo, "allSlicesVerified", {
    skill: "verify-main-spec",
    missing: ["allPhasesVerified"],
  });

  const reopenedPhase = run(repo, localHelper, [
    "reopen-phase-check",
    "phase-01",
    "allSlicesVerified",
  ]);
  assertNextStep(reopenedPhase, {
    phaseId: "phase-01",
    skill: "verify-phase",
    missing: ["allSlicesVerified"],
    artifacts: ["strike/initiatives/gallery/phases/phase-01/verification.md"],
  });

  runFail(repo, localHelper, ["reopen-phase-check", "payment", "allSlicesVerified"], /Phase id must be numeric or canonical/);
  runFail(repo, localHelper, ["reopen-phase-check", "phase-99", "allSlicesVerified"], /Phase not found: phase-99/);
  runFail(repo, localHelper, ["reopen-slice-check", "phase-01", "payment", "buildVerified"], /Slice id must be numeric or canonical/);
  runFail(repo, localHelper, ["reopen-slice-check", "phase-01", "slice-99", "buildVerified"], /Slice not found in phase-01: slice-99/);
  runFail(repo, localHelper, ["reopen-slice-check", "phase-01", "slice-02", "allSlicesVerified"], /Unknown verification key/);
}

function testRouteBackInvalidatesDownstreamScopes() {
  const repo = tempRepo();
  bootstrapTwoSliceWorkflow(repo);
  const localHelper = workspaceHelper(repo);

  completeSlice(repo, { phaseId: "phase-01", sliceId: "slice-02", skill: "research-slice" });
  completeSlice(repo, { phaseId: "phase-01", skill: "verify-phase" });
  complete(repo, "allSlicesVerified", { skill: "verify-main-spec" });

  const reopenedMainSpec = run(repo, localHelper, ["reopen-check", "specCreated"]);
  assertNextStep(reopenedMainSpec, {
    skill: "create-main-spec",
    missing: ["specCreated"],
  });

  let state = JSON.parse(fs.readFileSync(path.join(repo, "strike/state.json"), "utf8"));
  const phase = state.initiatives[0].phases[0];
  assert.deepEqual(
    phase.phaseWorkflow.flatMap((item) => Object.values(item.verified)),
    [false, false, false],
  );
  for (const slice of phase.slices) {
    assert.deepEqual(
      slice.sliceWorkflow.flatMap((item) => Object.values(item.verified)),
      [false, false, false, false, false],
    );
  }

  complete(repo, "specCreated", { skill: "create-development-phases" });
  complete(repo, "phasesCreated", { phaseId: "phase-01", skill: "create-phase-spec" });

  complete(repo, "phaseSpecCreated", { phaseId: "phase-01", skill: "create-phase-slices" });
  complete(repo, "slicesCreated", { phaseId: "phase-01", sliceId: "slice-01", skill: "research-slice" });
  completeSlice(repo, { phaseId: "phase-01", sliceId: "slice-02", skill: "research-slice" });
  completeSlice(repo, { phaseId: "phase-01", skill: "verify-phase" });

  const reopenedPhaseSlices = run(repo, localHelper, ["reopen-check", "slicesCreated"]);
  assertNextStep(reopenedPhaseSlices, {
    phaseId: "phase-01",
    skill: "create-phase-slices",
    missing: ["slicesCreated"],
  });

  state = JSON.parse(fs.readFileSync(path.join(repo, "strike/state.json"), "utf8"));
  assert.equal(state.initiatives[0].initiativeWorkflow[4].verified.allPhasesVerified, false);
  for (const slice of state.initiatives[0].phases[0].slices) {
    assert.deepEqual(
      slice.sliceWorkflow.flatMap((item) => Object.values(item.verified)),
      [false, false, false, false, false],
    );
  }
}

function testDeterministicRegistrationOrder() {
  const repo = tempRepo();
  run(repo, helper, ["init", "gallery", "Gallery"]);
  const localHelper = workspaceHelper(repo);

  run(repo, localHelper, ["add-phase", "2", "Second phase"]);
  run(repo, localHelper, ["add-phase", "10", "Tenth phase"]);
  run(repo, localHelper, ["add-phase", "1-b", "First phase follow-up"]);
  run(repo, localHelper, ["add-phase", "1", "First phase"]);

  run(repo, localHelper, ["add-slice", "phase-01", "2", "Second slice"]);
  run(repo, localHelper, ["add-slice", "phase-01", "10", "Tenth slice"]);
  run(repo, localHelper, ["add-slice", "phase-01", "1-b", "First slice follow-up"]);
  run(repo, localHelper, ["add-slice", "phase-01", "1", "First slice"]);

  const state = JSON.parse(fs.readFileSync(path.join(repo, "strike/state.json"), "utf8"));
  const initiative = state.initiatives[0];
  assert.deepEqual(
    initiative.phases.map((phase) => phase.id),
    ["phase-01", "phase-01-b", "phase-02", "phase-10"],
  );
  assert.deepEqual(
    initiative.phases[0].slices.map((slice) => slice.id),
    ["slice-01", "slice-01-b", "slice-02", "slice-10"],
  );
}

function testInitiativeLifecycle() {
  const repo = tempRepo();
  run(repo, helper, ["init", "gallery", "Gallery"]);
  const localHelper = workspaceHelper(repo);

  const added = run(repo, localHelper, ["add-initiative", "payment-system", "Payment system"]);
  assert.equal(added.initiative.id, "payment-system");
  assert.equal(added.nextStep.initiativeId, "payment-system");
  assert.equal(added.nextStep.skill, "refine-idea");
  assert.ok(fs.existsSync(path.join(repo, "strike/initiatives/payment-system")));
  assert.deepEqual(
    added.initiatives.map(({ id, status }) => [id, status]),
    [
      ["gallery", "paused"],
      ["payment-system", "active"],
    ],
  );

  const listed = run(repo, localHelper, ["list-initiatives"]);
  assert.equal(listed.activeInitiativeId, "payment-system");
  assert.deepEqual(
    listed.initiatives.map(({ id, status }) => [id, status]),
    [
      ["gallery", "paused"],
      ["payment-system", "active"],
    ],
  );

  runFail(repo, localHelper, ["add-initiative", "payment-system"], /Initiative already exists/);
  runFail(repo, localHelper, ["add-initiative", "PaymentSystem"], /lowercase letters/);

  const gallery = run(repo, localHelper, ["set-active", "gallery"]);
  assert.equal(gallery.initiative.id, "gallery");
  assert.equal(gallery.nextStep.initiativeId, "gallery");
  assert.deepEqual(
    gallery.initiatives.map(({ id, status }) => [id, status]),
    [
      ["gallery", "active"],
      ["payment-system", "paused"],
    ],
  );

  const finished = run(repo, localHelper, ["finish-initiative"]);
  assert.equal(finished.initiative.id, "gallery");
  assert.equal(finished.initiative.status, "complete");
  assert.equal(finished.nextStep.status, "idle");
  assert.deepEqual(
    finished.initiatives.map(({ id, status }) => [id, status]),
    [
      ["gallery", "complete"],
      ["payment-system", "paused"],
    ],
  );

  const payment = run(repo, localHelper, ["set-active", "payment-system"]);
  assert.equal(payment.nextStep.initiativeId, "payment-system");
  assert.equal(payment.nextStep.skill, "refine-idea");
  runFail(repo, localHelper, ["set-active", "missing"], /Initiative not found/);
}

testBootstrapAndWorkflowProgression();
testUserCheckpointRequiredForIdeaAndGrill();
testPhaseAndSliceRegistrationRequired();
testStrictCommands();
testNewInitiativeHelperWrapper();
testInitPreservesProjectGuidanceFiles();
testRouteBackCommandContract();
testRouteBackInvalidatesDownstreamScopes();
testDeterministicRegistrationOrder();
testInitiativeLifecycle();

console.log("state helper tests passed");
