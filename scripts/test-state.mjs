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

function readRootState(repo) {
  return JSON.parse(fs.readFileSync(path.join(repo, "strike/state.json"), "utf8"));
}

function readInitiativeState(repo, initiativeId) {
  return JSON.parse(
    fs.readFileSync(path.join(repo, "strike/initiatives", initiativeId, "state.json"), "utf8"),
  );
}

function writeRootState(repo, state) {
  fs.writeFileSync(path.join(repo, "strike/state.json"), `${JSON.stringify(state, null, 2)}\n`);
}

function writeInitiativeState(repo, initiativeId, state) {
  fs.writeFileSync(
    path.join(repo, "strike/initiatives", initiativeId, "state.json"),
    `${JSON.stringify(state, null, 2)}\n`,
  );
}

function writeWorkflowCheckpointArtifact(repo, checkName) {
  if (
    checkName !== "ideaRefined" &&
    checkName !== "initiativeResearchComplete" &&
    checkName !== "decisionsResolved" &&
    checkName !== "phaseResearchComplete" &&
    checkName !== "planCreated" &&
    checkName !== "planVerified" &&
    checkName !== "implemented" &&
    checkName !== "buildVerified" &&
    checkName !== "allSlicesVerified" &&
    checkName !== "allPhasesVerified"
  ) {
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

  if (checkName === "initiativeResearchComplete") {
    const researchRoot = path.join(repo, "strike/initiatives", initiative.id, "research");
    const scopePath = path.join(researchRoot, "scope.md");
    const indexPath = path.join(researchRoot, "index.md");
    if (!fs.existsSync(scopePath)) {
      writeArtifact(
        repo,
        path.join("strike/initiatives", initiative.id, "research/scope.md"),
        `# Initiative Research Scope

## Research Items
- ID: repo-patterns
  Topic: Existing repo patterns
  Category: repo
  Why it matters: The implementation should reuse local precedent.
  Questions to answer:
  Expected sources:

## User Checkpoint
Prompt: Research these topics?
User response: Yes, research these.
Ready to research: yes
`,
      );
    }
    if (!fs.existsSync(indexPath)) {
      writeArtifact(
        repo,
        path.join("strike/initiatives", initiative.id, "research/index.md"),
        `# Initiative Research Index

## Reports
- ID: repo-patterns
  File: repo-patterns.md
  Topic: Existing repo patterns
  Status: complete

## Research Audit
- ID: repo-patterns
  Audit file: audits/repo-patterns.md
  Verdict: pass
  Must Fix count: 0

## Ready For Grill
Ready for grill: yes
Reason: Research is complete enough for grilling.
`,
      );
    }
    const reportPath = path.join(researchRoot, "repo-patterns.md");
    if (!fs.existsSync(reportPath)) {
      writeArtifact(
        repo,
        path.join("strike/initiatives", initiative.id, "research/repo-patterns.md"),
        `# Research: Existing Repo Patterns

## Findings
- Finding: Representative repo pattern reviewed.
  Evidence: Test fixture.
  Implication: Grill can proceed.
`,
      );
    }
    const auditPath = path.join(researchRoot, "audits/repo-patterns.md");
    if (!fs.existsSync(auditPath)) {
      writeArtifact(
        repo,
        path.join("strike/initiatives", initiative.id, "research/audits/repo-patterns.md"),
        `# Research Audit: Existing Repo Patterns

Verdict: pass

## Must Fix
- None.

## Evidence Checked
- Test fixture.
`,
      );
    }
    return;
  }

  if (checkName === "phaseResearchComplete") {
    const current = run(repo, workspaceHelper(repo), ["next-step"]);
    if (!current.phaseId) {
      return;
    }
    writeArtifact(
      repo,
      path.join("strike/initiatives", initiative.id, "phases", current.phaseId, "research.md"),
      `# Phase Research

## Additional Phase Research
Additional phase research needed: no
Reason: Initiative research covers this phase for the test fixture.

## Research Audit
Audit file: research-audit.md
Verdict: pass
Must Fix count: 0
Notes: Fixture audit passed.

## Ready For Slicing
Ready for slicing: yes
Reason: Phase research is complete enough for slicing.
`,
    );
    writeArtifact(
      repo,
      path.join("strike/initiatives", initiative.id, "phases", current.phaseId, "research-audit.md"),
      `# Phase Research Audit

Review results returned: yes

## Issues
### Must Fix
- None.

## Verdict
Verdict: pass
Must Fix count: 0
Reason: Fixture phase research audit passed.
`,
    );
    return;
  }

  if (checkName === "planCreated") {
    const current = run(repo, workspaceHelper(repo), ["next-step"]);
    if (!current.phaseId || !current.sliceId) {
      return;
    }
    const planPath = path.join(
      repo,
      "strike/initiatives",
      initiative.id,
      "phases",
      current.phaseId,
      "slices",
      current.sliceId,
      "plan.md",
    );
    if (fs.existsSync(planPath)) {
      return;
    }
    writeArtifact(
      repo,
      path.relative(repo, planPath),
      `# Slice Plan

## Development Plan
Fixture plan.

## Split Recommendation
Needed: no
Reason: Fixture slice is buildable.
Replacement slices:
- None.
`,
    );
    return;
  }

  if (
    checkName === "planVerified" ||
    checkName === "buildVerified" ||
    checkName === "allSlicesVerified" ||
    checkName === "allPhasesVerified"
  ) {
    const current = run(repo, workspaceHelper(repo), ["next-step"]);
    const reviewedArtifact = reviewedGateArtifact(repo, initiative.id, current, checkName);
    if (!reviewedArtifact) {
      return;
    }
    const { artifactPath, resultField } = reviewedArtifact;
    if (fs.existsSync(artifactPath)) {
      const existingText = fs.readFileSync(artifactPath, "utf8");
      if (!/^Stale:[^\S\r\n]*yes\b/mi.test(existingText)) {
        return;
      }
    }
    const relativePath = path.relative(repo, artifactPath);
    writeArtifact(
      repo,
      relativePath,
      `# Fixture Verification

## Read-Only Review
Review results returned: yes
- Required subagents: pass
- Summary: Fixture review passed.

## Verification Result
${resultField}: yes
Reason: Fixture verification passed.
Fix Needed: no

## Route Back
Needed: no
Command: None
Phase: None
Slice: None
Check: None
Reason: None.
`,
    );
    return;
  }

  if (checkName === "implemented") {
    const current = run(repo, workspaceHelper(repo), ["next-step"]);
    if (!current.phaseId || !current.sliceId) {
      return;
    }
    const buildPath = path.join(
      repo,
      "strike/initiatives",
      initiative.id,
      "phases",
      current.phaseId,
      "slices",
      current.sliceId,
      "build.md",
    );
    if (fs.existsSync(buildPath)) {
      return;
    }
    writeArtifact(
      repo,
      path.relative(repo, buildPath),
      `# Slice Build

Built: yes

## Verification Evidence
### Static / Build Checks
- Fixture check passed.

## Route Back
Needed: no
Command: None
Phase: None
Slice: None
Check: None
Reason: None.
`,
    );
    return;
  }

  const artifactName = checkName === "ideaRefined" ? "idea.md" : "decisions.md";
  const artifactPath = path.join(repo, "strike/initiatives", initiative.id, artifactName);
  if (fs.existsSync(artifactPath)) {
    return;
  }

  if (checkName === "decisionsResolved") {
    writeArtifact(
      repo,
      path.join("strike/initiatives", initiative.id, artifactName),
      `# Idea Decisions

## User Checkpoint
Prompt: Are you ready to continue?
User response: Yes, continue.
Ready to continue: yes

## Decision Review
Reviewer: inline
Review results returned: yes
Verdict: pass
Must Fix count: 0
Findings addressed:
- None.
Accepted risks:
- None.
`,
    );
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

function reviewedGateArtifact(repo, initiativeId, current, checkName) {
  const initiativeRoot = path.join(repo, "strike/initiatives", initiativeId);
  if (checkName === "planVerified" && current.phaseId && current.sliceId) {
    return {
      artifactPath: path.join(
        initiativeRoot,
        "phases",
        current.phaseId,
        "slices",
        current.sliceId,
        "plan-verification.md",
      ),
      resultField: "Ready",
    };
  }
  if (checkName === "buildVerified" && current.phaseId && current.sliceId) {
    return {
      artifactPath: path.join(
        initiativeRoot,
        "phases",
        current.phaseId,
        "slices",
        current.sliceId,
        "build-verification.md",
      ),
      resultField: "Verified",
    };
  }
  if (checkName === "allSlicesVerified" && current.phaseId) {
    return {
      artifactPath: path.join(initiativeRoot, "phases", current.phaseId, "verification.md"),
      resultField: "Ready",
    };
  }
  if (checkName === "allPhasesVerified") {
    return {
      artifactPath: path.join(initiativeRoot, "verification.md"),
      resultField: "Ready",
    };
  }
  return null;
}

function writePhaseArtifacts(repo, initiativeId, phaseIds) {
  writeArtifact(repo, `strike/initiatives/${initiativeId}/development-plan.md`);
  for (const phaseId of phaseIds) {
    writeArtifact(repo, `strike/initiatives/${initiativeId}/phases/${phaseId}/phase.md`);
  }
}

function testUserCheckpointRequiredForIdeaResearchAndGrill() {
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
  complete(repo, "ideaRefined", { skill: "research-initiative" });

  runFail(repo, localHelper, ["complete-check", "initiativeResearchComplete"], /research user checkpoint/);

  writeArtifact(
    repo,
    "strike/initiatives/gallery/research/scope.md",
    `# Initiative Research Scope

## Research Items
- ID: repo-patterns
  Topic: Existing repo patterns
  Category: repo
  Why it matters: The implementation should reuse local precedent.
  Questions to answer:
  Expected sources:

## User Checkpoint
Prompt: Research these topics?
User response:
Ready to research: yes
`,
  );
  runFail(repo, localHelper, ["complete-check", "initiativeResearchComplete"], /non-empty User response/);

  writeArtifact(
    repo,
    "strike/initiatives/gallery/research/scope.md",
    `# Initiative Research Scope

## Research Items
- ID: repo-patterns
  Topic: Existing repo patterns
  Category: repo
  Why it matters: The implementation should reuse local precedent.
  Questions to answer:
  Expected sources:

## User Checkpoint
Prompt: Research these topics?
User response: Yes, research these.
Ready to research: yes
`,
  );
  runFail(repo, localHelper, ["complete-check", "initiativeResearchComplete"], /research index/);

  writeArtifact(
    repo,
    "strike/initiatives/gallery/research/index.md",
    `# Initiative Research Index

## Reports
- ID: repo-patterns
  File: repo-patterns.md
  Topic: Existing repo patterns
  Status: complete

## Research Audit
- ID: repo-patterns
  Audit file: audits/repo-patterns.md
  Verdict: pass
  Must Fix count: 0

## Ready For Grill
Ready for grill: no
Reason: Still missing approved research.
`,
  );
  runFail(repo, localHelper, ["complete-check", "initiativeResearchComplete"], /Ready for grill: yes/);

  writeArtifact(
    repo,
    "strike/initiatives/gallery/research/index.md",
    `# Initiative Research Index

## Reports
- ID: repo-patterns
  File: repo-patterns.md
  Topic: Existing repo patterns
  Status: complete

## Research Audit
- ID: repo-patterns
  Audit file: audits/repo-patterns.md
  Verdict: pass
  Must Fix count: 0

## Ready For Grill
Ready for grill: yes
Reason: Research is complete enough for grilling.
`,
  );
  runFail(repo, localHelper, ["complete-check", "initiativeResearchComplete"], /approved research item/);

  writeArtifact(
    repo,
    "strike/initiatives/gallery/research/repo-patterns.md",
    `# Research: Existing Repo Patterns

## Findings
- Finding: Representative repo pattern reviewed.
  Evidence: Test fixture.
  Implication: Grill can proceed.
`,
  );
  runFail(repo, localHelper, ["complete-check", "initiativeResearchComplete"], /audit file/);

  writeArtifact(
    repo,
    "strike/initiatives/gallery/research/audits/repo-patterns.md",
    `# Research Audit: Existing Repo Patterns

Verdict: pass

## Must Fix
- None.

## Evidence Checked
- Test fixture.
`,
  );
  writeArtifact(
    repo,
    "strike/initiatives/gallery/research/index.md",
    `# Initiative Research Index

## Reports
- ID: repo-patterns
  File: repo-patterns.md
  Topic: Existing repo patterns
  Status: complete

## Research Audit
- ID: repo-patterns
  Audit file: ../repo-patterns.md
  Verdict: pass
  Must Fix count: 0

## Ready For Grill
Ready for grill: yes
Reason: Research is complete enough for grilling.
`,
  );
  runFail(repo, localHelper, ["complete-check", "initiativeResearchComplete"], /audit file/);

  writeArtifact(
    repo,
    "strike/initiatives/gallery/research/index.md",
    `# Initiative Research Index

## Reports
- ID: repo-patterns
  File: repo-patterns.md
  Topic: Existing repo patterns
  Status: complete

## Research Audit
- ID: repo-patterns
  Audit file: audits/repo-patterns.md
  Verdict: needs-fix
  Must Fix count: 0

## Ready For Grill
Ready for grill: yes
Reason: Research is complete enough for grilling.
`,
  );
  runFail(repo, localHelper, ["complete-check", "initiativeResearchComplete"], /Verdict pass or accepted-risk/);

  writeArtifact(
    repo,
    "strike/initiatives/gallery/research/index.md",
    `# Initiative Research Index

## Reports
- ID: repo-patterns
  File: repo-patterns.md
  Topic: Existing repo patterns
  Status: complete

## Research Audit
- ID: repo-patterns
  Audit file: audits/repo-patterns.md
  Verdict: pass
  Must Fix count: 1

## Ready For Grill
Ready for grill: yes
Reason: Research is complete enough for grilling.
`,
  );
  runFail(repo, localHelper, ["complete-check", "initiativeResearchComplete"], /Must Fix count 0/);

  writeArtifact(
    repo,
    "strike/initiatives/gallery/research/index.md",
    `# Initiative Research Index

## Reports
- ID: repo-patterns
  File: repo-patterns.md
  Topic: Existing repo patterns
  Status: complete

## Research Audit
- ID: repo-patterns
  Audit file: audits/repo-patterns.md
  Verdict: accepted-risk
  Must Fix count: 0

## Ready For Grill
Ready for grill: yes
Reason: Research is complete enough for grilling.
`,
  );
  complete(repo, "initiativeResearchComplete", { skill: "grill-idea" });

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
  runFail(repo, localHelper, ["complete-check", "decisionsResolved"], /Decision Review/);

  writeArtifact(
    repo,
    "strike/initiatives/gallery/decisions.md",
    `# Idea Decisions

## User Checkpoint
Prompt: Are you ready for spec?
User response: Yes, continue.
Ready to continue: yes

## Decision Review
Reviewer: subagent
Verdict: pass
Must Fix count: 0
Findings addressed:
- None.
Accepted risks:
- None.
`,
  );
  runFail(repo, localHelper, ["complete-check", "decisionsResolved"], /Review results returned: yes/);

  writeArtifact(
    repo,
    "strike/initiatives/gallery/decisions.md",
    `# Idea Decisions

## User Checkpoint
Prompt: Are you ready for spec?
User response: Yes, continue.
Ready to continue: yes

## Decision Review
Reviewer: subagent
Review results returned: yes
Verdict: needs-fix
Must Fix count: 0
Findings addressed:
- None.
Accepted risks:
- None.
`,
  );
  runFail(repo, localHelper, ["complete-check", "decisionsResolved"], /Verdict: pass or accepted-risk/);

  writeArtifact(
    repo,
    "strike/initiatives/gallery/decisions.md",
    `# Idea Decisions

## User Checkpoint
Prompt: Are you ready for spec?
User response: Yes, continue.
Ready to continue: yes

## Decision Review
Reviewer: subagent
Review results returned: yes
Verdict: pass
Must Fix count: 1
Findings addressed:
- One finding remains.
Accepted risks:
- None.
`,
  );
  runFail(repo, localHelper, ["complete-check", "decisionsResolved"], /Must Fix count: 0/);

  writeArtifact(
    repo,
    "strike/initiatives/gallery/decisions.md",
    `# Idea Decisions

## User Checkpoint
Prompt: Are you ready for spec?
User response: Yes, continue.
Ready to continue: yes

## Decision Review
Reviewer: subagent
Review results returned: yes
Verdict: accepted-risk
Must Fix count: 0
Findings addressed:
- None.
Accepted risks:
- Minor follow-up risk accepted.
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
  complete(repo, "ideaRefined", { skill: "research-initiative" });
  complete(repo, "initiativeResearchComplete", { skill: "grill-idea" });
  complete(repo, "decisionsResolved", { skill: "create-main-spec" });
  complete(repo, "specCreated", { skill: "create-development-phases" });
  run(repo, workspaceHelper(repo), ["add-phase", "1", "Upload and display"]);
  writePhaseArtifacts(repo, "gallery", ["phase-01"]);
  complete(repo, "phasesCreated", { phaseId: "phase-01", skill: "create-phase-spec" });
  complete(repo, "phaseSpecCreated", { phaseId: "phase-01", skill: "research-phase" });
  complete(repo, "phaseResearchComplete", { phaseId: "phase-01", skill: "create-phase-slices" });
  run(repo, workspaceHelper(repo), ["add-slice", "phase-01", "1", "Upload image"]);
  run(repo, workspaceHelper(repo), ["add-slice", "phase-01", "2", "Display gallery"]);
  writeSliceArtifacts(repo, "gallery", "phase-01", ["slice-01", "slice-02"]);
  complete(repo, "slicesCreated", {
    phaseId: "phase-01",
    sliceId: "slice-01",
    skill: "plan-slice",
  });
}

function completeSlice(repo, expectedAfterBuildVerified) {
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
  assert.ok(fs.existsSync(path.join(repo, "strike/initiatives/gallery/state.json")));
  assert.ok(fs.existsSync(workspaceHelper(repo)));
  assert.ok(fs.existsSync(path.join(repo, "strike/initiatives/gallery")));
  const rootState = readRootState(repo);
  assert.equal(rootState.activeInitiativeId, "gallery");
  assert.equal(rootState.initiatives[0].statePath, "initiatives/gallery/state.json");
  assert.equal(rootState.initiatives[0].initiativeWorkflow, undefined);
  assert.equal(readInitiativeState(repo, "gallery").status, undefined);

  let nextStep = run(repo, workspaceHelper(repo), ["next-step"]);
  assertNextStep(nextStep, {
    skill: "refine-idea",
    missing: ["ideaRefined"],
    artifacts: ["strike/initiatives/gallery/idea.md"],
  });

  complete(repo, "ideaRefined", {
    skill: "research-initiative",
    missing: ["initiativeResearchComplete"],
    artifacts: [
      "strike/initiatives/gallery/research/scope.md",
      "strike/initiatives/gallery/research/<research-item-id>.md",
      "strike/initiatives/gallery/research/audits/<research-item-id>.md",
      "strike/initiatives/gallery/research/index.md",
    ],
  });
  complete(repo, "initiativeResearchComplete", {
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
    skill: "research-phase",
    missing: ["phaseResearchComplete"],
    artifacts: [
      "strike/initiatives/gallery/phases/phase-01/research.md",
      "strike/initiatives/gallery/phases/phase-01/research-audit.md",
    ],
  });
  complete(repo, "phaseResearchComplete", {
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
  const reopenedPlan = run(repo, workspaceHelper(repo), ["reopen-check", "planCreated"]);
  assertNextStep(reopenedPlan, {
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
    skill: "plan-slice",
    missing: ["planCreated"],
  });
  complete(repo, "planCreated", { phaseId: "phase-01", sliceId: "slice-01", skill: "verify-slice-plan" });
  complete(repo, "planVerified", { phaseId: "phase-01", sliceId: "slice-01", skill: "build-slice" });
  complete(repo, "implemented", { phaseId: "phase-01", sliceId: "slice-01", skill: "verify-slice-build" });
  complete(repo, "buildVerified", { phaseId: "phase-01", sliceId: "slice-02", skill: "plan-slice" });
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

  const completedState = readRootState(repo);
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

  complete(repo, "ideaRefined", { skill: "research-initiative" });
  complete(repo, "initiativeResearchComplete", { skill: "grill-idea" });
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
  complete(repo, "phaseSpecCreated", { phaseId: "phase-01", skill: "research-phase" });
  runFail(repo, localHelper, ["complete-check", "phaseResearchComplete"], /phase research/);
  writeArtifact(repo, "strike/initiatives/gallery/phases/phase-01/research.md", "# Phase Research\n\nReady for slicing: no\n");
  runFail(repo, localHelper, ["complete-check", "phaseResearchComplete"], /Ready for slicing: yes/);
  writeArtifact(
    repo,
    "strike/initiatives/gallery/phases/phase-01/research.md",
    `# Phase Research

## Research Audit
Audit file: research-audit.md
Verdict: pass
Must Fix count: 0

## Ready For Slicing
Ready for slicing: yes
`,
  );
  runFail(repo, localHelper, ["complete-check", "phaseResearchComplete"], /phase research audit/);
  writeArtifact(
    repo,
    "strike/initiatives/gallery/phases/phase-01/research-audit.md",
    "# Phase Research Audit\n\nVerdict: needs-fix\nMust Fix count: 1\n",
  );
  runFail(repo, localHelper, ["complete-check", "phaseResearchComplete"], /Verdict: pass or accepted-risk/);
  writeArtifact(
    repo,
    "strike/initiatives/gallery/phases/phase-01/research.md",
    `# Phase Research

## Research Audit
Audit file: research-audit.md
Verdict: needs-fix
Must Fix count: 1

## Ready For Slicing
Ready for slicing: yes
`,
  );
  writeArtifact(
    repo,
    "strike/initiatives/gallery/phases/phase-01/research-audit.md",
    "# Phase Research Audit\n\nReview results returned: yes\nVerdict: pass\nMust Fix count: 0\n",
  );
  runFail(repo, localHelper, ["complete-check", "phaseResearchComplete"], /Verdict: pass or accepted-risk/);
  writeArtifact(
    repo,
    "strike/initiatives/gallery/phases/phase-01/research.md",
    `# Phase Research

## Research Audit
Audit file: research-audit.md
Verdict: accepted-risk
Must Fix count: 0

## Ready For Slicing
Ready for slicing: yes
`,
  );
  writeArtifact(
    repo,
    "strike/initiatives/gallery/phases/phase-01/research-audit.md",
    "# Phase Research Audit\n\nVerdict: accepted-risk\nMust Fix count: 0\n",
  );
  runFail(repo, localHelper, ["complete-check", "phaseResearchComplete"], /Review results returned: yes/);
  writeArtifact(
    repo,
    "strike/initiatives/gallery/phases/phase-01/research-audit.md",
    "# Phase Research Audit\n\nReview results returned: yes\nVerdict: accepted-risk\nMust Fix count: 0\n",
  );
  const phaseResearchReceipt = run(repo, localHelper, ["complete-check", "phaseResearchComplete"]);
  assertNextStep(phaseResearchReceipt, {
    status: "recorded",
    phaseId: "phase-01",
    skill: "research-phase",
    completedCheck: "phaseResearchComplete",
  });

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
    skill: "plan-slice",
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

function testSyncHelperRefreshesRecognizedWorkspaceHelper() {
  const repo = tempRepo();
  const localHelper = workspaceHelper(repo);
  fs.mkdirSync(path.dirname(localHelper), { recursive: true });
  fs.writeFileSync(
    localHelper,
    `#!/usr/bin/env node
const DEFAULT_STATE_PATH = "strike/state.json";
const INITIATIVE_WORKFLOW = [];
const command = "complete-check";
console.log(DEFAULT_STATE_PATH, INITIATIVE_WORKFLOW, command);
`,
  );

  const firstSync = run(repo, helper, ["sync-helper"]);
  assert.equal(firstSync.refreshed, true);
  assert.equal(fs.readFileSync(localHelper, "utf8"), fs.readFileSync(helper, "utf8"));

  const secondSync = run(repo, helper, ["sync-helper"]);
  assert.equal(secondSync.refreshed, false);
}

function testSyncHelperRepairsMissingGuidanceFiles() {
  const repo = tempRepo();
  const localHelper = workspaceHelper(repo);
  fs.mkdirSync(path.dirname(localHelper), { recursive: true });
  fs.writeFileSync(localHelper, fs.readFileSync(helper, "utf8"));

  const existingGuidancePath = path.join(
    repo,
    "strike/user-guidance/implementation-discipline/global.md",
  );
  fs.mkdirSync(path.dirname(existingGuidancePath), { recursive: true });
  fs.writeFileSync(existingGuidancePath, "# Global Implementation Discipline\n\n- Keep me.\n");

  const sync = run(repo, helper, ["sync-helper"]);
  assert.equal(sync.refreshed, false);
  assert.equal(
    fs.readFileSync(existingGuidancePath, "utf8"),
    "# Global Implementation Discipline\n\n- Keep me.\n",
  );
  assert.ok(fs.existsSync(path.join(repo, "PROJECT_LANGUAGE.md")));
  assert.ok(fs.existsSync(path.join(repo, "strike/user-guidance/implementation-discipline/build-slice.md")));
  assert.ok(fs.existsSync(path.join(repo, "strike/user-guidance/review-lenses/global.md")));
  assert.ok(fs.existsSync(path.join(repo, "strike/user-guidance/review-lenses/verify-main-spec.md")));
}

function testOldInitiativeWorkflowNormalizesResearchGate() {
  const repo = tempRepo();
  const statePath = path.join(repo, "strike/state.json");
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(
    statePath,
    `${JSON.stringify(
      {
        version: 1,
        initiatives: [
          {
            id: "gallery",
            name: "Gallery",
            status: "active",
            initiativeWorkflow: [
              { skill: "refine-idea", verified: { ideaRefined: true } },
              { skill: "grill-idea", verified: { decisionsResolved: false } },
              { skill: "create-main-spec", verified: { specCreated: false } },
              { skill: "create-development-phases", verified: { phasesCreated: false } },
              { skill: "verify-main-spec", verified: { allPhasesVerified: false } },
            ],
            phases: [],
          },
        ],
      },
      null,
      2,
    )}\n`,
  );

  const nextStep = run(repo, helper, ["next-step"]);
  assertNextStep(nextStep, {
    skill: "research-initiative",
    missing: ["initiativeResearchComplete"],
  });

  writeWorkflowCheckpointArtifact(repo, "initiativeResearchComplete");
  const receipt = run(repo, helper, ["complete-check", "initiativeResearchComplete"]);
  assert.equal(receipt.completedCheck, "initiativeResearchComplete");

  const normalizedState = readInitiativeState(repo, "gallery");
  assert.equal(normalizedState.status, undefined);
  assert.deepEqual(
    normalizedState.initiativeWorkflow.map((item) => item.skill),
    [
      "refine-idea",
      "research-initiative",
      "grill-idea",
      "create-main-spec",
      "create-development-phases",
      "verify-main-spec",
    ],
  );
  assert.equal(
    normalizedState.initiativeWorkflow[1].verified.initiativeResearchComplete,
    true,
  );
}

function testOldPhaseAndSliceWorkflowNormalizesPhaseResearchGate() {
  const repo = tempRepo();
  run(repo, helper, ["init", "gallery", "Gallery"]);
  const localHelper = workspaceHelper(repo);

  writeInitiativeState(repo, "gallery", {
    version: 1,
    id: "gallery",
    name: "Gallery",
    initiativeWorkflow: [
      { skill: "refine-idea", verified: { ideaRefined: true } },
      { skill: "research-initiative", verified: { initiativeResearchComplete: true } },
      { skill: "grill-idea", verified: { decisionsResolved: true } },
      { skill: "create-main-spec", verified: { specCreated: true } },
      { skill: "create-development-phases", verified: { phasesCreated: true } },
      { skill: "verify-main-spec", verified: { allPhasesVerified: true } },
    ],
    phases: [
      {
        id: "phase-01",
        name: "Upload and display",
        phaseWorkflow: [
          { skill: "create-phase-spec", verified: { phaseSpecCreated: true } },
          { skill: "create-phase-slices", verified: { slicesCreated: true } },
          { skill: "verify-phase", verified: { allSlicesVerified: true } },
        ],
        slices: [
          {
            id: "slice-01",
            name: "Upload image",
            sliceWorkflow: [
              { skill: "research-slice", verified: { researchComplete: true } },
              { skill: "plan-slice", verified: { planCreated: true } },
              { skill: "verify-slice-plan", verified: { planVerified: true } },
              { skill: "build-slice", verified: { implemented: true } },
              { skill: "verify-slice-build", verified: { buildVerified: true } },
            ],
          },
        ],
      },
    ],
  });

  writeArtifact(
    repo,
    "strike/initiatives/gallery/phases/phase-01/research.md",
    `# Phase Research

## Research Audit
Audit file: research-audit.md
Verdict: pass
Must Fix count: 0

## Ready For Slicing
Ready for slicing: yes
`,
  );
  writeArtifact(
    repo,
    "strike/initiatives/gallery/phases/phase-01/research-audit.md",
    "# Phase Research Audit\n\nReview results returned: yes\nVerdict: pass\nMust Fix count: 0\n",
  );

  const receipt = run(repo, localHelper, ["complete-check", "phaseResearchComplete"]);
  assertNextStep(receipt, {
    status: "recorded",
    phaseId: "phase-01",
    skill: "research-phase",
    completedCheck: "phaseResearchComplete",
  });

  const nextStep = run(repo, localHelper, ["next-step"]);
  assertNextStep(nextStep, {
    status: "idle",
    reason: "No active initiative.",
  });

  const normalizedState = readInitiativeState(repo, "gallery");
  const phase = normalizedState.phases[0];
  assert.deepEqual(
    phase.phaseWorkflow.map((item) => item.skill),
    ["create-phase-spec", "research-phase", "create-phase-slices", "verify-phase"],
  );
  assert.equal(phase.phaseWorkflow[1].verified.phaseResearchComplete, true);
  assert.equal(phase.phaseWorkflow[2].verified.slicesCreated, true);
  assert.equal(phase.phaseWorkflow[3].verified.allSlicesVerified, true);
  assert.equal(normalizedState.initiativeWorkflow[5].verified.allPhasesVerified, true);
  assert.deepEqual(
    phase.slices[0].sliceWorkflow.map((item) => item.skill),
    ["plan-slice", "verify-slice-plan", "build-slice", "verify-slice-build"],
  );
  for (const item of phase.slices[0].sliceWorkflow) {
    for (const value of Object.values(item.verified)) {
      assert.equal(value, true);
    }
  }
}

function testRouteBackCommandContract() {
  const repo = tempRepo();
  bootstrapTwoSliceWorkflow(repo);
  const localHelper = workspaceHelper(repo);

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
  complete(repo, "buildVerified", { phaseId: "phase-01", sliceId: "slice-02", skill: "plan-slice" });

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

  const stateAfterSliceBack = readInitiativeState(repo, "gallery");
  assert.equal(
    stateAfterSliceBack.phases[0].phaseWorkflow.find((item) => item.skill === "verify-phase").verified.allSlicesVerified,
    false,
  );
  assert.equal(stateAfterSliceBack.initiativeWorkflow[5].verified.allPhasesVerified, false);

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

function testReviewedVerifierRequiresReturnedReviewResults() {
  {
    const repo = tempRepo();
    bootstrapTwoSliceWorkflow(repo);
    const localHelper = workspaceHelper(repo);

    complete(repo, "planCreated", {
      phaseId: "phase-01",
      sliceId: "slice-01",
      skill: "verify-slice-plan",
      missing: ["planVerified"],
      artifacts: ["strike/initiatives/gallery/phases/phase-01/slices/slice-01/plan-verification.md"],
    });

    writeArtifact(
      repo,
      "strike/initiatives/gallery/phases/phase-01/slices/slice-01/plan-verification.md",
      `# Slice Plan Verification

## Read-Only Review
- Required plan audits: pass

## Build Readiness
Ready: yes
Reason: Fixture says ready but omits returned review evidence.
Fix Needed: no
`,
    );

    runFail(repo, localHelper, ["complete-check", "planVerified"], /Review results returned: yes/);
  }

  {
    const repo = tempRepo();
    bootstrapTwoSliceWorkflow(repo);
    const localHelper = workspaceHelper(repo);

    complete(repo, "planCreated", { skill: "verify-slice-plan" });
    complete(repo, "planVerified", { skill: "build-slice" });
    complete(repo, "implemented", {
      phaseId: "phase-01",
      sliceId: "slice-01",
      skill: "verify-slice-build",
      missing: ["buildVerified"],
      artifacts: ["strike/initiatives/gallery/phases/phase-01/slices/slice-01/build-verification.md"],
    });

    writeArtifact(
      repo,
      "strike/initiatives/gallery/phases/phase-01/slices/slice-01/build-verification.md",
      `# Slice Build Verification

## Read-Only Review
- Required build audits: pass

## Verification Result
Verified: yes
Reason: Fixture says verified but omits returned review evidence.
Fix Needed: no
`,
    );

    runFail(repo, localHelper, ["complete-check", "buildVerified"], /Review results returned: yes/);
  }

  {
    const repo = tempRepo();
    bootstrapTwoSliceWorkflow(repo);
    const localHelper = workspaceHelper(repo);

    completeSlice(repo, { phaseId: "phase-01", sliceId: "slice-02", skill: "plan-slice" });
    completeSlice(repo, { phaseId: "phase-01", skill: "verify-phase" });

    writeArtifact(
      repo,
      "strike/initiatives/gallery/phases/phase-01/verification.md",
      `# Phase Verification

## Read-Only Review
- Required phase audits: pass

## Verification Result
Ready: yes
Reason: Fixture says ready but omits returned review evidence.
Fix Needed: no
`,
    );

    runFail(repo, localHelper, ["complete-check", "allSlicesVerified"], /Review results returned: yes/);
  }

  {
    const repo = tempRepo();
    bootstrapTwoSliceWorkflow(repo);
    const localHelper = workspaceHelper(repo);

    completeSlice(repo, { phaseId: "phase-01", sliceId: "slice-02", skill: "plan-slice" });
    completeSlice(repo, { phaseId: "phase-01", skill: "verify-phase" });
    complete(repo, "allSlicesVerified", { skill: "verify-main-spec" });

    writeArtifact(
      repo,
      "strike/initiatives/gallery/verification.md",
      `# Initiative Verification

## Read-Only Review
- Required final audits: pass

## Verification Result
Ready: yes
Reason: Fixture says ready but omits returned review evidence.
Fix Needed: no
`,
    );

    runFail(repo, localHelper, ["complete-check", "allPhasesVerified"], /Review results returned: yes/);
  }
}

function testPlanAndBuildCompletionPreconditions() {
  {
    const repo = tempRepo();
    bootstrapTwoSliceWorkflow(repo);
    const localHelper = workspaceHelper(repo);

    writeArtifact(
      repo,
      "strike/initiatives/gallery/phases/phase-01/slices/slice-01/plan.md",
      `# Slice Plan

## Development Plan
Needed: no
Reason: This line is unrelated and must not satisfy split readiness.
`,
    );

    runFail(repo, localHelper, ["complete-check", "planCreated"], /Needed: no/);
  }

  {
    const repo = tempRepo();
    bootstrapTwoSliceWorkflow(repo);
    const localHelper = workspaceHelper(repo);

    writeArtifact(
      repo,
      "strike/initiatives/gallery/phases/phase-01/slices/slice-01/plan.md",
      `# Slice Plan

## Split Recommendation
Reason: Missing Needed field.

# Appendix
Needed: no
Reason: This top-level section is not part of Split Recommendation.
`,
    );

    runFail(repo, localHelper, ["complete-check", "planCreated"], /Needed: no/);
  }

  {
    const repo = tempRepo();
    bootstrapTwoSliceWorkflow(repo);
    const localHelper = workspaceHelper(repo);

    writeArtifact(
      repo,
      "strike/initiatives/gallery/phases/phase-01/slices/slice-01/plan.md",
      `# Slice Plan

## Split Recommendation
Needed: yes
Reason: Fixture split required.
Replacement slices:
- slice-01
- slice-02
`,
    );

    runFail(repo, localHelper, ["complete-check", "planCreated"], /Needed: no/);
  }

  {
    const repo = tempRepo();
    bootstrapTwoSliceWorkflow(repo);
    const localHelper = workspaceHelper(repo);

    complete(repo, "planCreated", { skill: "verify-slice-plan" });
    complete(repo, "planVerified", { skill: "build-slice" });

    writeArtifact(
      repo,
      "strike/initiatives/gallery/phases/phase-01/slices/slice-01/build.md",
      `# Slice Build

Built: no

## Route Back
Needed: yes
Command: reopen-check
Phase: None
Slice: None
Check: planVerified
Reason: Fixture route back required.
`,
    );

    runFail(repo, localHelper, ["complete-check", "implemented"], /Built: yes/);
  }
}

function testReopenMarksReviewedArtifactsStale() {
  {
    const repo = tempRepo();
    bootstrapTwoSliceWorkflow(repo);
    const localHelper = workspaceHelper(repo);

    complete(repo, "planCreated", { skill: "verify-slice-plan" });
    complete(repo, "planVerified", { skill: "build-slice" });
    complete(repo, "implemented", { skill: "verify-slice-build" });
    complete(repo, "buildVerified", { phaseId: "phase-01", sliceId: "slice-02", skill: "plan-slice" });

    const planVerificationPath =
      "strike/initiatives/gallery/phases/phase-01/slices/slice-01/plan-verification.md";
    const buildVerificationPath =
      "strike/initiatives/gallery/phases/phase-01/slices/slice-01/build-verification.md";

    run(repo, localHelper, ["reopen-slice-check", "phase-01", "slice-01", "planCreated"]);

    assert.match(fs.readFileSync(path.join(repo, planVerificationPath), "utf8"), /^Stale: yes$/m);
    assert.match(fs.readFileSync(path.join(repo, buildVerificationPath), "utf8"), /^Stale: yes$/m);

    complete(repo, "planCreated", { skill: "verify-slice-plan" });
    runFail(repo, localHelper, ["complete-check", "planVerified"], /stale or blocking/);
  }

  {
    const repo = tempRepo();
    bootstrapTwoSliceWorkflow(repo);
    const localHelper = workspaceHelper(repo);

    complete(repo, "planCreated", { skill: "verify-slice-plan" });
    complete(repo, "planVerified", { skill: "build-slice" });
    complete(repo, "implemented", { skill: "verify-slice-build" });
    complete(repo, "buildVerified", { phaseId: "phase-01", sliceId: "slice-02", skill: "plan-slice" });

    const planVerificationPath =
      "strike/initiatives/gallery/phases/phase-01/slices/slice-01/plan-verification.md";
    const buildVerificationPath =
      "strike/initiatives/gallery/phases/phase-01/slices/slice-01/build-verification.md";

    run(repo, localHelper, ["reopen-slice-check", "phase-01", "slice-01", "planVerified"]);

    assert.match(fs.readFileSync(path.join(repo, planVerificationPath), "utf8"), /^Stale: yes$/m);
    assert.match(fs.readFileSync(path.join(repo, buildVerificationPath), "utf8"), /^Stale: yes$/m);

    runFail(repo, localHelper, ["complete-check", "planVerified"], /stale or blocking/);
  }
}

function testRouteBackInvalidatesDownstreamScopes() {
  const repo = tempRepo();
  bootstrapTwoSliceWorkflow(repo);
  const localHelper = workspaceHelper(repo);

  completeSlice(repo, { phaseId: "phase-01", sliceId: "slice-02", skill: "plan-slice" });
  completeSlice(repo, { phaseId: "phase-01", skill: "verify-phase" });
  complete(repo, "allSlicesVerified", { skill: "verify-main-spec" });

  const reopenedMainSpec = run(repo, localHelper, ["reopen-check", "specCreated"]);
  assertNextStep(reopenedMainSpec, {
    skill: "create-main-spec",
    missing: ["specCreated"],
  });

  let state = readInitiativeState(repo, "gallery");
  const phase = state.phases[0];
  assert.deepEqual(
    phase.phaseWorkflow.flatMap((item) => Object.values(item.verified)),
    [false, false, false, false],
  );
  for (const slice of phase.slices) {
    assert.deepEqual(
      slice.sliceWorkflow.flatMap((item) => Object.values(item.verified)),
      [false, false, false, false],
    );
  }

  complete(repo, "specCreated", { skill: "create-development-phases" });
  complete(repo, "phasesCreated", { phaseId: "phase-01", skill: "create-phase-spec" });

  complete(repo, "phaseSpecCreated", { phaseId: "phase-01", skill: "research-phase" });
  complete(repo, "phaseResearchComplete", { phaseId: "phase-01", skill: "create-phase-slices" });
  complete(repo, "slicesCreated", { phaseId: "phase-01", sliceId: "slice-01", skill: "plan-slice" });
  completeSlice(repo, { phaseId: "phase-01", sliceId: "slice-02", skill: "plan-slice" });
  completeSlice(repo, { phaseId: "phase-01", skill: "verify-phase" });

  const reopenedPhaseSlices = run(repo, localHelper, ["reopen-check", "slicesCreated"]);
  assertNextStep(reopenedPhaseSlices, {
    phaseId: "phase-01",
    skill: "create-phase-slices",
    missing: ["slicesCreated"],
  });

  state = readInitiativeState(repo, "gallery");
  assert.equal(state.initiativeWorkflow[5].verified.allPhasesVerified, false);
  for (const slice of state.phases[0].slices) {
    assert.deepEqual(
      slice.sliceWorkflow.flatMap((item) => Object.values(item.verified)),
      [false, false, false, false],
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

  const initiative = readInitiativeState(repo, "gallery");
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

function testSplitStateSkipsMissingInactiveDetails() {
  const repo = tempRepo();
  run(repo, helper, ["init", "gallery", "Gallery"]);
  const localHelper = workspaceHelper(repo);

  run(repo, localHelper, ["add-initiative", "payment-system", "Payment system"]);
  const inactiveDetailPath = path.join(repo, "strike/initiatives/gallery/state.json");
  fs.rmSync(inactiveDetailPath);

  const listed = run(repo, localHelper, ["list-initiatives"]);
  assert.equal(listed.activeInitiativeId, "payment-system");
  assert.deepEqual(
    listed.initiatives.map(({ id, status }) => [id, status]),
    [
      ["gallery", "paused"],
      ["payment-system", "active"],
    ],
  );

  const nextStep = run(repo, localHelper, ["next-step"]);
  assertNextStep(nextStep, {
    initiativeId: "payment-system",
    skill: "refine-idea",
    missing: ["ideaRefined"],
  });

  complete(repo, "ideaRefined", {
    initiativeId: "payment-system",
    skill: "research-initiative",
    missing: ["initiativeResearchComplete"],
  });
  assert.equal(fs.existsSync(inactiveDetailPath), false);
  runFail(repo, localHelper, ["set-active", "gallery"], /Initiative state file is missing/);
}

function testActiveOperationsDoNotRewriteInactiveDetails() {
  const repo = tempRepo();
  run(repo, helper, ["init", "gallery", "Gallery"]);
  const localHelper = workspaceHelper(repo);
  const inactiveDetailPath = path.join(repo, "strike/initiatives/gallery/state.json");
  const inactiveDetail = readInitiativeState(repo, "gallery");
  inactiveDetail.status = "active";
  inactiveDetail.customSentinel = "preserve inactive detail";
  writeInitiativeState(repo, "gallery", inactiveDetail);
  const expectedInactiveDetail = fs.readFileSync(inactiveDetailPath, "utf8");

  run(repo, localHelper, ["add-initiative", "payment-system", "Payment system"]);
  assert.equal(fs.readFileSync(inactiveDetailPath, "utf8"), expectedInactiveDetail);
  assert.equal(readInitiativeState(repo, "payment-system").status, undefined);

  complete(repo, "ideaRefined", {
    initiativeId: "payment-system",
    skill: "research-initiative",
    missing: ["initiativeResearchComplete"],
  });
  assert.equal(fs.readFileSync(inactiveDetailPath, "utf8"), expectedInactiveDetail);
}

function testRootStatusOverridesLegacyDetailStatus() {
  const repo = tempRepo();
  run(repo, helper, ["init", "gallery", "Gallery"]);
  const localHelper = workspaceHelper(repo);
  run(repo, localHelper, ["add-initiative", "payment-system", "Payment system"]);

  const galleryDetail = readInitiativeState(repo, "gallery");
  galleryDetail.status = "active";
  writeInitiativeState(repo, "gallery", galleryDetail);

  const paymentDetail = readInitiativeState(repo, "payment-system");
  paymentDetail.status = "complete";
  writeInitiativeState(repo, "payment-system", paymentDetail);

  const listed = run(repo, localHelper, ["list-initiatives"]);
  assert.deepEqual(
    listed.initiatives.map(({ id, status }) => [id, status]),
    [
      ["gallery", "paused"],
      ["payment-system", "active"],
    ],
  );

  const nextStep = run(repo, localHelper, ["next-step"]);
  assertNextStep(nextStep, {
    initiativeId: "payment-system",
    skill: "refine-idea",
    missing: ["ideaRefined"],
  });
}

function testSplitStateReconcilesStaleActiveInitiativeId() {
  const repo = tempRepo();
  run(repo, helper, ["init", "gallery", "Gallery"]);
  const localHelper = workspaceHelper(repo);

  const rootState = readRootState(repo);
  rootState.activeInitiativeId = "missing";
  writeRootState(repo, rootState);

  const nextStep = run(repo, localHelper, ["next-step"]);
  assertNextStep(nextStep, {
    initiativeId: "gallery",
    skill: "refine-idea",
    missing: ["ideaRefined"],
  });

  complete(repo, "ideaRefined", {
    skill: "research-initiative",
    missing: ["initiativeResearchComplete"],
  });
  const repairedRootState = readRootState(repo);
  assert.equal(repairedRootState.activeInitiativeId, "gallery");
}

function testSplitStateRejectsMalformedRootEntries() {
  const repo = tempRepo();
  run(repo, helper, ["init", "gallery", "Gallery"]);
  const localHelper = workspaceHelper(repo);

  const badPathState = readRootState(repo);
  badPathState.initiatives[0].statePath = "../outside/state.json";
  writeRootState(repo, badPathState);
  runFail(repo, localHelper, ["list-initiatives"], /Initiative statePath mismatch/);

  const badCanonicalState = readRootState(repo);
  badCanonicalState.initiatives[0].statePath = "initiatives/other/state.json";
  writeRootState(repo, badCanonicalState);
  runFail(repo, localHelper, ["next-step"], /expected initiatives\/gallery\/state\.json/);

  const badIdState = readRootState(repo);
  badIdState.activeInitiativeId = "../outside";
  badIdState.initiatives[0].id = "../outside";
  badIdState.initiatives[0].statePath = "initiatives/../outside/state.json";
  writeRootState(repo, badIdState);
  runFail(repo, localHelper, ["list-initiatives"], /lowercase letters, numbers, and dashes/);
}

function testSplitStateRejectsMismatchedDetailId() {
  const repo = tempRepo();
  run(repo, helper, ["init", "gallery", "Gallery"]);
  const localHelper = workspaceHelper(repo);

  const detail = readInitiativeState(repo, "gallery");
  detail.id = "payment-system";
  writeInitiativeState(repo, "gallery", detail);

  runFail(repo, localHelper, ["next-step"], /Initiative state id mismatch/);
}

testBootstrapAndWorkflowProgression();
testUserCheckpointRequiredForIdeaResearchAndGrill();
testPhaseAndSliceRegistrationRequired();
testStrictCommands();
testNewInitiativeHelperWrapper();
testInitPreservesProjectGuidanceFiles();
testSyncHelperRefreshesRecognizedWorkspaceHelper();
testSyncHelperRepairsMissingGuidanceFiles();
testOldInitiativeWorkflowNormalizesResearchGate();
testOldPhaseAndSliceWorkflowNormalizesPhaseResearchGate();
testRouteBackCommandContract();
testReviewedVerifierRequiresReturnedReviewResults();
testPlanAndBuildCompletionPreconditions();
testReopenMarksReviewedArtifactsStale();
testRouteBackInvalidatesDownstreamScopes();
testDeterministicRegistrationOrder();
testInitiativeLifecycle();
testSplitStateSkipsMissingInactiveDetails();
testActiveOperationsDoNotRewriteInactiveDetails();
testRootStatusOverridesLegacyDetailStatus();
testSplitStateReconcilesStaleActiveInitiativeId();
testSplitStateRejectsMalformedRootEntries();
testSplitStateRejectsMismatchedDetailId();

console.log("state helper tests passed");
