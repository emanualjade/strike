#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const helper = path.join(root, "plugins/strike/skills/auto-strike-go/scripts/state.mjs");
const newInitiativeHelper = path.join(
  root,
  "plugins/strike/skills/auto-strike-new-initiative/scripts/state.mjs",
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
  return path.join(repo, "auto-strike/scripts/state.mjs");
}

function assertCurrent(current, expected) {
  for (const [key, value] of Object.entries(expected)) {
    assert.deepEqual(current[key], value, `${key} should match`);
  }
}

function complete(repo, checkName, expected) {
  const current = run(repo, workspaceHelper(repo), ["complete-check", checkName]);
  assertCurrent(current, expected);
  return current;
}

function bootstrapTwoSliceWorkflow(repo) {
  run(repo, helper, ["init", "gallery", "Gallery"]);
  complete(repo, "ideaRefined", { skill: "grill-idea" });
  complete(repo, "decisionsResolved", { skill: "create-main-spec" });
  complete(repo, "specCreated", { skill: "create-development-phases" });
  run(repo, workspaceHelper(repo), ["add-phase", "1", "Upload and display"]);
  complete(repo, "phasesCreated", { phaseId: "phase-01", skill: "create-phase-spec" });
  complete(repo, "phaseSpecCreated", { phaseId: "phase-01", skill: "create-phase-slices" });
  run(repo, workspaceHelper(repo), ["add-slice", "phase-01", "1", "Upload image"]);
  run(repo, workspaceHelper(repo), ["add-slice", "phase-01", "2", "Display gallery"]);
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
  assert.equal(init.current.skill, "refine-idea");
  assert.ok(fs.existsSync(path.join(repo, "PROJECT_LANGUAGE.md")));
  assert.match(fs.readFileSync(path.join(repo, "PROJECT_LANGUAGE.md"), "utf8"), /^# Project Language/m);
  assert.ok(fs.existsSync(path.join(repo, "auto-strike/state.json")));
  assert.ok(fs.existsSync(workspaceHelper(repo)));
  assert.ok(fs.existsSync(path.join(repo, "auto-strike/initiatives/gallery")));

  let current = run(repo, workspaceHelper(repo), ["current"]);
  assertCurrent(current, {
    skill: "refine-idea",
    missing: ["ideaRefined"],
    artifacts: ["auto-strike/initiatives/gallery/idea.md"],
  });

  complete(repo, "ideaRefined", {
    skill: "grill-idea",
    missing: ["decisionsResolved"],
    artifacts: ["auto-strike/initiatives/gallery/decisions.md"],
  });
  complete(repo, "decisionsResolved", {
    skill: "create-main-spec",
    missing: ["specCreated"],
    artifacts: ["auto-strike/initiatives/gallery/main-spec.md"],
  });
  complete(repo, "specCreated", {
    skill: "create-development-phases",
    missing: ["phasesCreated"],
    artifacts: [
      "auto-strike/initiatives/gallery/development-plan.md",
      "auto-strike/initiatives/gallery/phases/<phase-id>/phase.md",
    ],
  });

  const phase = run(repo, workspaceHelper(repo), ["add-phase", "1", "Upload and display"]);
  assert.equal(phase.phase.id, "phase-01");
  assert.ok(fs.existsSync(path.join(repo, "auto-strike/initiatives/gallery/phases/phase-01")));

  complete(repo, "phasesCreated", {
    phaseId: "phase-01",
    skill: "create-phase-spec",
    missing: ["phaseSpecCreated"],
    artifacts: ["auto-strike/initiatives/gallery/phases/phase-01/phase-spec.md"],
  });
  complete(repo, "phaseSpecCreated", {
    phaseId: "phase-01",
    skill: "create-phase-slices",
    missing: ["slicesCreated"],
    artifacts: ["auto-strike/initiatives/gallery/phases/phase-01/slices/<slice-id>/slice.md"],
  });

  run(repo, workspaceHelper(repo), ["add-slice", "phase-1", "1", "Upload image"]);
  run(repo, workspaceHelper(repo), ["add-slice", "01", "slice-2", "Display gallery"]);
  assert.ok(fs.existsSync(path.join(repo, "auto-strike/initiatives/gallery/phases/phase-01/slices/slice-02")));

  complete(repo, "slicesCreated", {
    phaseId: "phase-01",
    sliceId: "slice-01",
    skill: "research-slice",
    missing: ["researchComplete"],
    artifacts: ["auto-strike/initiatives/gallery/phases/phase-01/slices/slice-01/research.md"],
  });
  complete(repo, "researchComplete", {
    phaseId: "phase-01",
    sliceId: "slice-01",
    skill: "plan-slice",
    missing: ["planCreated"],
    artifacts: ["auto-strike/initiatives/gallery/phases/phase-01/slices/slice-01/plan.md"],
  });
  complete(repo, "planCreated", {
    phaseId: "phase-01",
    sliceId: "slice-01",
    skill: "verify-slice-plan",
    missing: ["planVerified"],
    artifacts: ["auto-strike/initiatives/gallery/phases/phase-01/slices/slice-01/plan-verification.md"],
  });
  const reopenedResearch = run(repo, workspaceHelper(repo), ["reopen-check", "researchComplete"]);
  assertCurrent(reopenedResearch, {
    phaseId: "phase-01",
    sliceId: "slice-01",
    skill: "research-slice",
    missing: ["researchComplete"],
    artifacts: ["auto-strike/initiatives/gallery/phases/phase-01/slices/slice-01/research.md"],
  });
  complete(repo, "researchComplete", {
    phaseId: "phase-01",
    sliceId: "slice-01",
    skill: "plan-slice",
    missing: ["planCreated"],
    artifacts: ["auto-strike/initiatives/gallery/phases/phase-01/slices/slice-01/plan.md"],
  });
  complete(repo, "planCreated", {
    phaseId: "phase-01",
    sliceId: "slice-01",
    skill: "verify-slice-plan",
    missing: ["planVerified"],
    artifacts: ["auto-strike/initiatives/gallery/phases/phase-01/slices/slice-01/plan-verification.md"],
  });
  complete(repo, "planVerified", {
    phaseId: "phase-01",
    sliceId: "slice-01",
    skill: "build-slice",
    missing: ["implemented"],
    artifacts: ["implementation files", "auto-strike/initiatives/gallery/phases/phase-01/slices/slice-01/build.md"],
  });
  complete(repo, "implemented", {
    phaseId: "phase-01",
    sliceId: "slice-01",
    skill: "verify-slice-build",
    missing: ["buildVerified"],
    artifacts: ["auto-strike/initiatives/gallery/phases/phase-01/slices/slice-01/build-verification.md"],
  });
  complete(repo, "buildVerified", {
    phaseId: "phase-01",
    sliceId: "slice-02",
    skill: "research-slice",
    missing: ["researchComplete"],
    artifacts: ["auto-strike/initiatives/gallery/phases/phase-01/slices/slice-02/research.md"],
  });
  complete(repo, "researchComplete", {
    phaseId: "phase-01",
    sliceId: "slice-02",
    skill: "plan-slice",
    missing: ["planCreated"],
    artifacts: ["auto-strike/initiatives/gallery/phases/phase-01/slices/slice-02/plan.md"],
  });

  complete(repo, "planCreated", { phaseId: "phase-01", sliceId: "slice-02", skill: "verify-slice-plan" });
  complete(repo, "planVerified", { phaseId: "phase-01", sliceId: "slice-02", skill: "build-slice" });
  complete(repo, "implemented", { phaseId: "phase-01", sliceId: "slice-02", skill: "verify-slice-build" });
  complete(repo, "buildVerified", {
    phaseId: "phase-01",
    skill: "verify-phase",
    missing: ["allSlicesVerified"],
    artifacts: ["auto-strike/initiatives/gallery/phases/phase-01/verification.md"],
  });
  const reopenedSliceBuild = run(repo, workspaceHelper(repo), ["reopen-slice-check", "phase-1", "2", "buildVerified"]);
  assertCurrent(reopenedSliceBuild, {
    phaseId: "phase-01",
    sliceId: "slice-02",
    skill: "verify-slice-build",
    missing: ["buildVerified"],
    artifacts: ["auto-strike/initiatives/gallery/phases/phase-01/slices/slice-02/build-verification.md"],
  });
  complete(repo, "buildVerified", {
    phaseId: "phase-01",
    skill: "verify-phase",
    missing: ["allSlicesVerified"],
    artifacts: ["auto-strike/initiatives/gallery/phases/phase-01/verification.md"],
  });
  complete(repo, "allSlicesVerified", {
    skill: "verify-main-spec",
    missing: ["allPhasesVerified"],
    artifacts: ["auto-strike/initiatives/gallery/verification.md"],
  });
  const reopenedPhaseFinal = run(repo, workspaceHelper(repo), ["reopen-phase-check", "1", "allSlicesVerified"]);
  assertCurrent(reopenedPhaseFinal, {
    phaseId: "phase-01",
    skill: "verify-phase",
    missing: ["allSlicesVerified"],
    artifacts: ["auto-strike/initiatives/gallery/phases/phase-01/verification.md"],
  });
  complete(repo, "allSlicesVerified", {
    skill: "verify-main-spec",
    missing: ["allPhasesVerified"],
    artifacts: ["auto-strike/initiatives/gallery/verification.md"],
  });
  const reopenedPhaseSlices = run(repo, workspaceHelper(repo), ["reopen-phase-check", "phase-1", "slicesCreated"]);
  assertCurrent(reopenedPhaseSlices, {
    phaseId: "phase-01",
    skill: "create-phase-slices",
    missing: ["slicesCreated"],
    artifacts: ["auto-strike/initiatives/gallery/phases/phase-01/slices/<slice-id>/slice.md"],
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
    artifacts: ["auto-strike/initiatives/gallery/verification.md"],
  });

  current = run(repo, workspaceHelper(repo), ["complete-check", "allPhasesVerified"]);
  assertCurrent(current, {
    status: "complete",
    initiativeId: "gallery",
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
  assert.equal(init.current.skill, "refine-idea");
  assert.ok(fs.existsSync(path.join(repo, "PROJECT_LANGUAGE.md")));
  assert.ok(fs.existsSync(path.join(repo, "auto-strike/state.json")));
  assert.ok(fs.existsSync(workspaceHelper(repo)));
  assert.ok(fs.existsSync(path.join(repo, "auto-strike/initiatives/ledger")));
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
  assertCurrent(reopenedPlan, {
    phaseId: "phase-01",
    sliceId: "slice-01",
    skill: "plan-slice",
    missing: ["planCreated"],
    artifacts: ["auto-strike/initiatives/gallery/phases/phase-01/slices/slice-01/plan.md"],
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
  assertCurrent(reopenedSlice, {
    phaseId: "phase-01",
    sliceId: "slice-02",
    skill: "verify-slice-build",
    missing: ["buildVerified"],
    artifacts: ["auto-strike/initiatives/gallery/phases/phase-01/slices/slice-02/build-verification.md"],
  });

  const stateAfterSliceBack = JSON.parse(fs.readFileSync(path.join(repo, "auto-strike/state.json"), "utf8"));
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
  assertCurrent(reopenedPhase, {
    phaseId: "phase-01",
    skill: "verify-phase",
    missing: ["allSlicesVerified"],
    artifacts: ["auto-strike/initiatives/gallery/phases/phase-01/verification.md"],
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
  assertCurrent(reopenedMainSpec, {
    skill: "create-main-spec",
    missing: ["specCreated"],
  });

  let state = JSON.parse(fs.readFileSync(path.join(repo, "auto-strike/state.json"), "utf8"));
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
  assertCurrent(reopenedPhaseSlices, {
    phaseId: "phase-01",
    skill: "create-phase-slices",
    missing: ["slicesCreated"],
  });

  state = JSON.parse(fs.readFileSync(path.join(repo, "auto-strike/state.json"), "utf8"));
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

  const state = JSON.parse(fs.readFileSync(path.join(repo, "auto-strike/state.json"), "utf8"));
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
  assert.equal(added.current.initiativeId, "payment-system");
  assert.equal(added.current.skill, "refine-idea");
  assert.ok(fs.existsSync(path.join(repo, "auto-strike/initiatives/payment-system")));
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
  assert.equal(gallery.current.initiativeId, "gallery");
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
  assert.equal(finished.current.status, "blocked");
  assert.deepEqual(
    finished.initiatives.map(({ id, status }) => [id, status]),
    [
      ["gallery", "complete"],
      ["payment-system", "paused"],
    ],
  );

  const payment = run(repo, localHelper, ["set-active", "payment-system"]);
  assert.equal(payment.current.initiativeId, "payment-system");
  assert.equal(payment.current.skill, "refine-idea");
  runFail(repo, localHelper, ["set-active", "missing"], /Initiative not found/);
}

testBootstrapAndWorkflowProgression();
testStrictCommands();
testNewInitiativeHelperWrapper();
testRouteBackCommandContract();
testRouteBackInvalidatesDownstreamScopes();
testDeterministicRegistrationOrder();
testInitiativeLifecycle();

console.log("state helper tests passed");
