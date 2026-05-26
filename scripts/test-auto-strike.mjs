#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const autoStrikeScript = path.join(root, "plugins/strike/skills/auto-strike/scripts/auto-strike.mjs");
const tempRoots = [];

function tempRepo() {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), "strike-auto-"));
  tempRoots.push(repo);
  return repo;
}

process.on("exit", () => {
  for (const repo of tempRoots) {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

function write(repoRoot, relativePath, content) {
  const absolutePath = path.join(repoRoot, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content, "utf8");
}

function run(repoRoot, args) {
  return spawnSync(process.execPath, [autoStrikeScript, ...args, "--repo-root", repoRoot, "--json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function runRaw(args) {
  return spawnSync(process.execPath, [autoStrikeScript, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function initGit(repoRoot) {
  const result = spawnSync("git", ["-C", repoRoot, "init"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert.equal(result.status, 0, `git init should succeed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
}

function assertStatus(result, status, message) {
  assert.equal(result.status, status, `${message}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
}

function json(result) {
  return JSON.parse(result.stdout);
}

function testInspectAbsentWorkspace() {
  const repo = tempRepo();
  const result = run(repo, ["inspect"]);
  assertStatus(result, 0, "inspect should succeed when workspace is absent");

  const body = json(result);
  assert.equal(body.workspace.status, "absent");
  assert.equal(body.docs.length, 0);

  const validate = run(repo, ["validate"]);
  assertStatus(validate, 0, "validate should not fail an absent workspace");
  assert.equal(json(validate).summary.notes, 1);
}

function testValidateUnrelatedWorkspaceCollision() {
  const repo = tempRepo();
  write(repo, "auto-strike/notes.md", "# Another tool\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 1, "unrelated workspace should be a hard validation error");

  const body = json(result);
  assert.equal(body.workspace.status, "unrelated");
  assert.ok(body.messages.some((item) => item.code === "workspace-unrelated" && item.severity === "error"));
}

function testSimpleFeatureSlugDoesNotHardFail() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: tiny-copy-fix
- Current mode: build
- Next best action: Edit the button copy.

## Project State
- Narrow copy update.

## Key Docs
- None.

## Open Decisions
- None.

## Verification
- Manual copy check.
`);
  write(repo, "auto-strike/initiatives/main/features/tiny-copy-fix/feature-spec.md", "# Tiny Copy Fix Spec\n");
  write(repo, "auto-strike/todo.md", `# Todo

- [ ] Update button copy.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "simple active feature slug should not hard fail");
  const body = json(result);
  assert.equal(body.activeFeature.raw, "tiny-copy-fix");
  assert.equal(body.activeFeature.path, "auto-strike/initiatives/main/features/tiny-copy-fix");
  assert.equal(body.activeFeature.inferredPath, "auto-strike/initiatives/main/features/tiny-copy-fix");
  assert.ok(!body.messages.some((item) => item.code === "missing-active-feature"));
  assert.ok(!body.messages.some((item) => item.code === "missing-key-doc"));
}

function testValidateRejectsOldTopLevelFeaturePath() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/features/legacy-feature
- Current mode: slice
- Next: Fix the feature path.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/idea.md", "# Main Idea\n");
  write(repo, "auto-strike/features/legacy-feature/spec.md", "# Legacy Spec\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 1, "old top-level feature paths should be rejected");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "invalid-active-feature-path" && item.severity === "error"));
}

function testInitiativeInspectAndValidateWithEvidence() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/upload-mvp
- Current mode: review
- Active slice: auto-strike/initiatives/main/features/upload-mvp/slices/slice-0-upload-preview.md
- Next best action: Review slice 0.

## Project State
- Upload preview MVP is implemented.

## Key Docs
- \`auto-strike/initiatives/main/features/upload-mvp/feature-spec.md\` - product scope.
- \`auto-strike/initiatives/main/features/upload-mvp/slices/slice-0-upload-preview.md\` - build evidence.

## Open Decisions
- None.

## Verification
- pnpm run test - passed.
`);
  write(repo, "auto-strike/todo.md", `# Todo

- [x] Build upload preview slice.
`);
  write(repo, "auto-strike/initiatives/main/features/upload-mvp/feature-spec.md", "# Upload MVP Spec\n");
  write(repo, "app/upload/page.tsx", "export default function Page() { return null; }\n");
  write(repo, "auto-strike/initiatives/main/features/upload-mvp/slices/slice-0-upload-preview.md", `# Slice 0: Upload Preview

## Evidence

Changed:
- app/upload/page.tsx

Verified:
- pnpm run test - passed
`);

  const inspect = run(repo, ["inspect"]);
  assertStatus(inspect, 0, "inspect should succeed for initiative workspace");
  const inspectBody = json(inspect);
  assert.equal(inspectBody.activeFeature.path, "auto-strike/initiatives/main/features/upload-mvp");
  assert.equal(inspectBody.activeFeature.specExists, true);
  assert.equal(inspectBody.activeFeature.sliceFiles.length, 1);
  assert.deepEqual(inspectBody.evidence.locations, ["auto-strike/initiatives/main/features/upload-mvp/slices/slice-0-upload-preview.md"]);
  assert.deepEqual(inspectBody.evidence.changedPaths, ["app/upload/page.tsx"]);

  const validate = run(repo, ["validate"]);
  assertStatus(validate, 0, "validate should pass complete initiative evidence");
  assert.equal(json(validate).summary.errors, 0);
}

function testValidateWarnsForMissingEvidence() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/search-mvp
- Current mode: review

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/features/search-mvp/feature-spec.md", "# Search MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/features/search-mvp/slices/slice-0-search.md", "# Slice 0: Search\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "missing evidence should warn, not hard fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "missing-evidence" && item.severity === "warning"));
}

function testValidateBrokenKeyDocReference() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/search-mvp
- Current mode: spec

## Key Docs
- \`auto-strike/initiatives/main/features/search-mvp/feature-spec.md\` - product scope.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/features/search-mvp/extras/context.md", "# Context\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 1, "explicit missing key docs should hard fail");
  assert.ok(json(result).messages.some((item) => item.code === "missing-key-doc"));
}

function testKeyDocsCanReferenceRepoDocs() {
  const repo = tempRepo();
  write(repo, "README.md", "# Product Notes\n");
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: None
- Doc: auto-strike/initiatives/main/idea.md
- State: Idea is being clarified.
- Next: Read repo notes before grill.
- Blocked by: None.

## Key Docs
- \`README.md\` - product notes.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/idea.md", `# Search Idea

## Phase Tasks
- [x] Capture repo context.
- [ ] Clarify first useful outcome.

## Exit Evidence
- Repo notes are available as context.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "repo-level key docs should be allowed");
  assert.ok(!json(result).messages.some((item) => item.code === "missing-key-doc"));

  const review = run(repo, ["review-context", "--lens", "spec-coverage"]);
  assertStatus(review, 0, "review context should include repo-level key docs");
  assert.ok(json(review).state.index.keyDocs.some((item) => item.path === "README.md"));

  const markdownReview = runRaw(["review-context", "--lens", "spec-coverage", "--repo-root", repo]);
  assertStatus(markdownReview, 0, "markdown review context should include repo-level key docs");
  assert.match(markdownReview.stdout, /README\.md/);
}

function testReviewContextPacket() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/video-mvp
- Current mode: review

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/features/video-mvp/feature-spec.md", "# Video MVP Spec\n");
  write(repo, "src/video/upload.ts", "export function upload() {}\n");
  write(repo, "auto-strike/initiatives/main/features/video-mvp/slices/slice-0-upload.md", `# Slice 0: Upload

## Evidence

Changed:
- src/video/upload.ts

Verified:
- pnpm run test - passed
`);

  const result = run(repo, ["review-context", "--lens", "edge-cases"]);
  assertStatus(result, 0, "review-context should succeed for supported lens");
  const body = json(result);
  assert.equal(body.lens, "edge-cases");
  assert.match(body.instructions.join("\n"), /Return findings to the main agent/);
  assert.match(body.instructions.join("\n"), /read-only review agent/);
  assert.match(body.instructions.join("\n"), /Do not edit files/);
  assert.ok(body.focus.some((item) => /hostile inputs/i.test(item)));
  assert.ok(body.state.docs.includes("auto-strike/initiatives/main/features/video-mvp/feature-spec.md"));
  assert.ok(body.state.evidence.changedPaths.includes("src/video/upload.ts"));
  assert.ok(body.sourcePaths.some((group) => group.title === "Changed Files From Active Evidence"));
}

function testImplementationPlanReviewContext() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/video-mvp
- Current mode: slice
- Active slice: auto-strike/initiatives/main/features/video-mvp/slices/slice-0-upload.md

## Key Docs
- \`auto-strike/initiatives/main/features/video-mvp/feature-spec.md\` - product scope.
- \`auto-strike/initiatives/main/features/video-mvp/slices/slice-0-upload.md\` - implementation plan.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/features/video-mvp/feature-spec.md", "# Video MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/features/video-mvp/slices/slice-0-upload.md", `# Slice 0: Upload

## Implementation Research
- Check current upload API docs before coding.

## Plan
- Add the upload control.

## Plan Review
- Pending.
`);

  const result = run(repo, ["review-context", "--lens", "plan-review"]);
  assertStatus(result, 0, "implementation plan review lens should support pre-build review");
  const body = json(result);
  assert.equal(body.lens, "implementation-plan");
  assert.ok(body.focus.some((item) => /slice-specific research/i.test(item)));
  const activeDocs = body.sourcePaths.find((group) => group.title === "Active Docs");
  assert.ok(activeDocs.paths.includes("auto-strike/initiatives/main/features/video-mvp/slices/slice-0-upload.md"));
}

function testReviewContextScopesChangedFilesToActiveFeature() {
  const repo = tempRepo();
  write(repo, "README.md", "# Dogfood Repo\n");
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/todo-dogfood
- Current mode: review
- Active slice: auto-strike/initiatives/main/features/todo-dogfood/slices/slice-0-static-todo.md

## Key Docs
- \`README.md\` - repo context.
- \`auto-strike/initiatives/main/features/todo-dogfood/feature-spec.md\` - active spec.
- \`auto-strike/initiatives/main/features/todo-dogfood/slices/slice-0-static-todo.md\` - active evidence.
- \`auto-strike/initiatives/main/features/clip-notes/feature-spec.md\` - completed feature context.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/features/todo-dogfood/feature-spec.md", "# Todo Dogfood Spec\n");
  write(repo, "auto-strike/initiatives/main/features/todo-dogfood/slices/slice-0-static-todo.md", `# Slice 0: Static Todo

## Evidence

Changed:
- todo/index.html
- todo/todo.js
- scripts/todo-smoke.js

Verified:
- node scripts/todo-smoke.js - passed
`);
  write(repo, "auto-strike/initiatives/main/features/clip-notes/feature-spec.md", "# Clip Notes Spec\n");
  write(repo, "auto-strike/initiatives/main/features/clip-notes/slices/slice-1-review-brief.md", `# Slice 1: Review Brief

## Evidence

Changed:
- app/index.html
- app/clip-notes.js
- scripts/clip-notes-smoke.js

Verified:
- node scripts/clip-notes-smoke.js - passed
`);
  write(repo, "todo/index.html", "<!doctype html>\n");
  write(repo, "todo/todo.js", "export function todo() {}\n");
  write(repo, "scripts/todo-smoke.js", "console.log('todo');\n");
  write(repo, "app/index.html", "<!doctype html>\n");
  write(repo, "app/clip-notes.js", "export function clip() {}\n");
  write(repo, "scripts/clip-notes-smoke.js", "console.log('clip');\n");

  const result = run(repo, ["review-context", "--lens", "code-quality"]);
  assertStatus(result, 0, "review-context should scope changed files to the active feature");
  const body = json(result);
  assert.equal(body.state.evidence.reviewScope.scope, "active-slice");
  assert.deepEqual(body.state.evidence.reviewScope.changedPaths, [
    "todo/index.html",
    "todo/todo.js",
    "scripts/todo-smoke.js",
  ]);
  const allSourcePaths = body.sourcePaths.flatMap((group) => group.paths);
  assert.ok(allSourcePaths.includes("todo/todo.js"));
  assert.ok(!allSourcePaths.includes("app/clip-notes.js"));
  const changedGroup = body.sourcePaths.find((group) => group.title === "Changed Files From Active Evidence");
  assert.deepEqual(changedGroup.paths, [
    "todo/index.html",
    "todo/todo.js",
    "scripts/todo-smoke.js",
  ]);
}

function testValidateWarnsWhenReviewEvidenceLacksChangedAndVerified() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/search-mvp
- Current mode: review
- Active slice: auto-strike/initiatives/main/features/search-mvp/slices/slice-0-search.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/features/search-mvp/feature-spec.md", "# Search MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/features/search-mvp/slices/slice-0-search.md", `# Slice 0: Search

## Evidence

Review Findings:
- Pending.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "review evidence without changed/verified should warn, not fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "missing-review-changed-evidence" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "missing-review-verified-evidence" && item.severity === "warning"));
}

function testValidateWarnsForWeakPreBuildSlicePrep() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/todo-dogfood
- Current mode: build
- Active slice: auto-strike/initiatives/main/features/todo-dogfood/slices/slice-1-edit-task.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/features/todo-dogfood/feature-spec.md", "# Todo Dogfood Spec\n");
  write(repo, "auto-strike/initiatives/main/features/todo-dogfood/slices/slice-1-edit-task.md", `# Slice 1: Edit Task

## Outcome
Edit task labels.

## Implementation Research
- Pending.

## Plan
- Build it.

## Plan Review
- Pending review.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "weak pre-build slice prep should warn, not fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "weak-slice-implementation-research" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "weak-slice-plan" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "weak-slice-plan-review" && item.severity === "warning"));
}

function testValidateAcceptsConcretePreBuildSlicePrep() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/todo-dogfood
- Current mode: build
- Active slice: auto-strike/initiatives/main/features/todo-dogfood/slices/slice-1-edit-task.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/features/todo-dogfood/feature-spec.md", "# Todo Dogfood Spec\n");
  write(repo, "auto-strike/initiatives/main/features/todo-dogfood/slices/slice-1-edit-task.md", `# Slice 1: Edit Task

## Outcome
Edit task labels.

## Implementation Research
- Local precedent: todo/todo.js owns task state changes; plan impact: add updateTask beside addTask/toggleTask.
- No third-party package is involved, so no external package docs are needed for this slice.

## Plan
- Update \`todo/todo.js\` with updateTask validation and persistence.
- Update \`todo/index.html\` with edit controls that preserve checkbox behavior.
- Verify with \`node scripts/todo-smoke.js\` and a static UI selector review.

## Plan Review
- main-agent review - pass; files, verification, UI selector risk, and no-blocker edge cases are named before build.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "concrete pre-build slice prep should pass validation");
  const body = json(result);
  assert.ok(!body.messages.some((item) => item.code === "weak-slice-implementation-research"));
  assert.ok(!body.messages.some((item) => item.code === "weak-slice-plan"));
  assert.ok(!body.messages.some((item) => item.code === "weak-slice-plan-review"));
}

function testValidateAcceptsActiveWorkPointer() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: None
- Doc: auto-strike/initiatives/main/idea.md
- State: First-outcome decision is being clarified.
- Next: Complete the first-outcome decision.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/idea.md", `# Clip Notes Idea

## Phase Tasks
- [x] Capture the user, problem, and first useful outcome.
- [ ] Confirm constraints and first-version non-goals.

## First Useful Outcome
User can save a short note for a selected clip.

## Exit Evidence
- Target moment, constraints, and first-version non-goals are recorded.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "valid active work pointer should pass validation");
  const body = json(result);
  assert.equal(body.index.currentMode, "brainstorm");
  assert.ok(!body.messages.some((item) => item.code === "missing-active-work"));
  assert.ok(!body.messages.some((item) => item.code === "missing-active-work-doc"));
  assert.ok(!body.messages.some((item) => item.code === "weak-active-work-doc"));
}

function testValidateWarnsForMissingActiveWork() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: None
- Current mode: brainstorm

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/idea.md", `# Clip Notes Idea

## Phase Tasks
- [x] Capture the user, problem, and first useful outcome.
- [ ] Confirm constraints and first-version non-goals.

## Exit Evidence
- Target moment, constraints, and first-version non-goals are recorded.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "missing active work should warn, not fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "missing-active-work" && item.severity === "warning"));
  assert.ok(!body.messages.some((item) => item.code === "missing-active-work-doc"));
  assert.ok(!body.messages.some((item) => item.code === "weak-active-work-doc"));
}

function testValidateWarnsForWeakOrMissingActiveWorkDoc() {
  const weakRepo = tempRepo();
  write(weakRepo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/clip-notes
- Doc: auto-strike/initiatives/main/features/clip-notes/feature-spec.md
- State: Spec acceptance checks are being drafted.
- Next: Draft acceptance checks.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(weakRepo, "auto-strike/initiatives/main/features/clip-notes/feature-spec.md", `# Clip Notes Spec

## Phase Tasks
- [ ] Draft it later.

## Exit Evidence
- Pending.
`);

  const weak = run(weakRepo, ["validate"]);
  assertStatus(weak, 0, "weak active work doc should warn, not fail");
  assert.ok(json(weak).messages.some((item) => item.code === "weak-active-work-doc" && item.severity === "warning"));

  const missingRepo = tempRepo();
  write(missingRepo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: None
- Doc: auto-strike/initiatives/main/grill.md
- State: Highest-risk user-flow question is unresolved.
- Next: Resolve the highest-risk user-flow question.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(missingRepo, "auto-strike/initiatives/main/idea.md", "# Clip Notes Idea\n");

  const missing = run(missingRepo, ["validate"]);
  assertStatus(missing, 0, "missing active work doc should warn, not fail");
  assert.ok(json(missing).messages.some((item) => item.code === "missing-active-work-doc" && item.severity === "warning"));
}

function writeBuildPhaseFixture(repo, ideaContent) {
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/checklist
- Doc: auto-strike/initiatives/main/features/checklist/slices/slice-0-static-app.md
- State: Slice build is in progress.
- Next: Implement the checklist behavior.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/idea.md", ideaContent);
  write(repo, "auto-strike/initiatives/main/spec.md", "# Checklist Spec\n");
  write(repo, "auto-strike/initiatives/main/features/checklist/feature-spec.md", "# Checklist Feature Spec\n");
  write(repo, "auto-strike/initiatives/main/features/checklist/slices/index.md", `# Slices

## Slice Map

| Slice | Size | Depends On | Unblocks | Risk | Verification |
| --- | --- | --- | --- | --- | --- |
| 0. Static app | S | None | First usable checklist | Low | node --check app.js |
`);
  write(repo, "auto-strike/initiatives/main/features/checklist/slices/slice-0-static-app.md", `# Slice 0: Static App

## Size
S

## Acceptance Criteria
- User can add a checklist item.
- User can mark an item done.

## Depends On
- None.

## Likely Surfaces
- \`app.js\`

## Execution Tasks
- [x] Research local app patterns.
- [x] Write plan with files and checks.
- [x] Review plan before coding.
- [ ] Verify checklist behavior.

## Implementation Research
- Empty repo; no local precedent exists.

## Plan
- Update the \`app.js\` file with checklist state and render behavior.
- Verify with \`node --check app.js\`.

## Plan Review
- main-agent review - pass; file surface and verification are named.
`);
}

function testValidateWarnsForMissingPhaseLedgerAfterSlicing() {
  const repo = tempRepo();
  writeBuildPhaseFixture(repo, `# Checklist Idea

## Current Shape
- First useful outcome: local checklist.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "missing phase ledger should warn, not fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "missing-phase-ledger" && item.severity === "warning"));
}

function testValidateWarnsForWeakPhaseLedgerAfterSlicing() {
  const repo = tempRepo();
  writeBuildPhaseFixture(repo, `# Checklist Idea

## Phase Ledger

| Phase | Status | Artifact | Reason |
| --- | --- | --- | --- |
| Brainstorm | done | \`idea.md\` | First useful outcome is recorded. |
| Grill | pending |  |  |
| Spec | done | \`spec.md\`, \`features/checklist/feature-spec.md\` | Single feature is sliceable. |
| Slice | done | \`features/checklist/slices/index.md\` | Slice 0 is selected. |
| Build | in progress | \`features/checklist/slices/slice-0-static-app.md\` | Active slice is being implemented. |

## Current Shape
- First useful outcome: local checklist.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "weak phase ledger should warn, not fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "weak-phase-ledger" && item.severity === "warning"));
}

function testValidateAcceptsPhaseLedgerAfterSlicing() {
  const repo = tempRepo();
  writeBuildPhaseFixture(repo, `# Checklist Idea

## Phase Ledger

| Phase | Status | Artifact | Reason |
| --- | --- | --- | --- |
| Brainstorm | done | \`idea.md\` | First useful outcome, user, constraints, and non-goals are recorded. |
| Grill | compressed | \`idea.md\` | Prompt already answered core decisions; no consequential blockers were found. |
| Spec | done | \`spec.md\`, \`features/checklist/feature-spec.md\` | Single feature is sliceable. |
| Slice | done | \`features/checklist/slices/index.md\` | Slice 0 is sized, ordered, and dependency-free. |
| Build | in progress | \`features/checklist/slices/slice-0-static-app.md\` | Active slice is being implemented. |
| Review | pending |  |  |
| Validate | pending |  |  |

## Current Shape
- First useful outcome: local checklist.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "substantive phase ledger should pass validation");
  const body = json(result);
  assert.ok(!body.messages.some((item) => item.code === "missing-phase-ledger"));
  assert.ok(!body.messages.some((item) => item.code === "weak-phase-ledger"));
}

function testValidateWarnsForStaleActiveWorkAfterImplementationEvidence() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/tool-library
- Feature: None yet
- Doc: auto-strike/initiatives/tool-library/idea.md
- State: Brainstorm in progress.
- Next: Resolve identity model.
- Blocked by: User decision on identity model.

## Open Decisions
- Identity model.

## Verification
- None yet - no code written.
`);
  write(repo, "auto-strike/language.md", "# Language\n\n## Tool Library\n- Member: Neighbor using the app.\n");
  write(repo, "auto-strike/initiatives/tool-library/decisions.md", "# Decisions\n\n## Identity\n- Persona switcher.\n");
  write(repo, "auto-strike/initiatives/tool-library/spec.md", "# Spec\n\n## Overview\n- Build a local tool library.\n");
  write(repo, "auto-strike/initiatives/tool-library/idea.md", `# Idea

## Phase Ledger

| Phase | Status | Artifact | Reason |
| --- | --- | --- | --- |
| Brainstorm | done | \`idea.md\` | Useful outcome captured. |
| Grill | compressed | \`decisions.md\` | Core decisions are recorded. |
| Spec | done | \`spec.md\` | Scope is sliceable. |
| Slice | in progress | \`features/lending-workflow/slices/index.md\` | Slice map exists. |
| Build | pending |  |  |
| Review | pending |  |  |
| Validate | pending |  |  |
`);
  write(repo, "auto-strike/initiatives/tool-library/features/lending-workflow/feature-spec.md", "# Feature Spec\n");
  write(repo, "auto-strike/initiatives/tool-library/features/lending-workflow/slices/slice-0-foundation.md", `# Slice 0

## Execution Tasks
- [ ] Build the server.

## Evidence

Changed:
- server.js

Verified:
- node --check server.js - passed
`);
  write(repo, "server.js", "console.log('ok');\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "stale active work should warn, not fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "stale-active-work-mode" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "stale-active-feature-pointer" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "stale-active-slice-pointer" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "stale-index-verification" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "open-decisions-after-implementation" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "weak-phase-ledger" && /build/i.test(item.message)));
}

function testValidateWarnsForMissingReferencedAutoStrikeDoc() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/checklist
- Current mode: review
- Active slice: auto-strike/initiatives/main/features/checklist/slices/slice-0-static-app.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/language.md", "# Language\n\n## Checklist\n- Item: A task.\n");
  write(repo, "auto-strike/initiatives/main/decisions.md", "# Decisions\n\n## Scope\n- Local checklist.\n");
  write(repo, "auto-strike/initiatives/main/spec.md", "# Spec\n\n## Overview\n- Local checklist.\n");
  write(repo, "auto-strike/initiatives/main/features/checklist/feature-spec.md", "# Checklist Feature Spec\n");
  write(repo, "auto-strike/initiatives/main/features/checklist/slices/slice-0-static-app.md", `# Slice 0

## Evidence

Changed:
- app.js

Verified:
- node --check app.js - passed

Reviewed:
- See auto-strike/initiatives/main/readiness.md review findings.
`);
  write(repo, "app.js", "console.log('ok');\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "missing referenced Auto Strike docs should warn, not fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "missing-referenced-auto-strike-doc" && item.message.includes("auto-strike/initiatives/main/readiness.md")));
}

function testValidateWarnsForStaleSliceTaskChecklist() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/checklist
- Current mode: review
- Active slice: auto-strike/initiatives/main/features/checklist/slices/slice-0-static-app.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/language.md", "# Language\n\n## Checklist\n- Item: A task.\n");
  write(repo, "auto-strike/initiatives/main/decisions.md", "# Decisions\n\n## Scope\n- Local checklist.\n");
  write(repo, "auto-strike/initiatives/main/spec.md", "# Spec\n\n## Overview\n- Local checklist.\n");
  write(repo, "auto-strike/initiatives/main/features/checklist/feature-spec.md", "# Checklist Feature Spec\n");
  write(repo, "auto-strike/initiatives/main/features/checklist/slices/slice-0-static-app.md", `# Slice 0

## Execution Tasks
- [ ] Build the server.
- [ ] Verify the server.

## Evidence

Changed:
- server.js

Verified:
- node --check server.js - passed
`);
  write(repo, "server.js", "console.log('ok');\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "stale slice task checklists should warn, not fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "stale-slice-task-checklist" && item.severity === "warning"));
}

function testValidateWarnsForMissingCurrentTruthDocs() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: None
- Doc: auto-strike/initiatives/main/idea.md
- State: Brainstorm is starting.
- Next: Capture the first useful outcome.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/idea.md", `# Main Idea

## Phase Tasks
- [x] Capture first useful outcome.
- [ ] Record current truth.

## Exit Evidence
- First useful outcome is clear enough to continue.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "missing current-truth docs should warn, not fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "missing-root-language" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "missing-initiative-decisions" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "missing-initiative-spec" && item.severity === "warning"));
}

function testValidateWarnsForWeakCurrentTruthDocs() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: None
- Doc: auto-strike/initiatives/main/idea.md
- State: Brainstorm is starting.
- Next: Capture the first useful outcome.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/language.md", "# Language\n");
  write(repo, "auto-strike/initiatives/main/decisions.md", "# Main Decisions\n");
  write(repo, "auto-strike/initiatives/main/spec.md", "# Main Spec\n");
  write(repo, "auto-strike/initiatives/main/idea.md", `# Main Idea

## Phase Tasks
- [x] Capture first useful outcome.
- [ ] Record current truth.

## Exit Evidence
- First useful outcome is clear enough to continue.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "weak current-truth docs should warn, not fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "weak-root-language" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "weak-initiative-decisions" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "weak-initiative-spec" && item.severity === "warning"));
}

function testValidateAcceptsMinimalCurrentTruthDocs() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: None
- Doc: auto-strike/initiatives/main/idea.md
- State: Brainstorm is starting.
- Next: Capture the first useful outcome.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/language.md", `# Language

## Current Terms
- No durable domain terms recorded yet.
`);
  write(repo, "auto-strike/initiatives/main/decisions.md", `# Main Decisions

## Status
- No consequential decisions recorded yet.
`);
  write(repo, "auto-strike/initiatives/main/spec.md", `# Main Spec

## Status
- Draft initiative spec exists; current product truth is still being gathered.
`);
  write(repo, "auto-strike/initiatives/main/idea.md", `# Main Idea

## Phase Tasks
- [x] Capture first useful outcome.
- [ ] Record current truth.

## Exit Evidence
- First useful outcome is clear enough to continue.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "minimal current-truth docs should satisfy validation");
  const body = json(result);
  assert.ok(!body.messages.some((item) => item.code === "missing-root-language"));
  assert.ok(!body.messages.some((item) => item.code === "weak-root-language"));
  assert.ok(!body.messages.some((item) => item.code === "missing-initiative-decisions"));
  assert.ok(!body.messages.some((item) => item.code === "weak-initiative-decisions"));
  assert.ok(!body.messages.some((item) => item.code === "missing-initiative-spec"));
  assert.ok(!body.messages.some((item) => item.code === "weak-initiative-spec"));
}

function testValidateWarnsForMissingGrillDecisionDepth() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: None
- Doc: auto-strike/initiatives/main/grill.md
- State: Product workflow decisions are being pressure-tested.
- Next: Resolve the active decision node.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/grill.md", `# Bookings Grill

## Phase Tasks
- [x] Review the brainstorm handoff and repo context.
- [ ] Resolve the active decision node.

## Pressure Points
- Scope: booking creation and cancellation.

## Exit Evidence
- Booking scope is close, but decision depth has not been recorded.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "missing grill decision depth should warn, not fail");
  const body = json(result);
  assert.equal(body.index.currentMode, "grill");
  assert.ok(body.messages.some((item) => item.code === "missing-grill-decision-depth" && item.severity === "warning"));
}

function testValidateAcceptsStandardGrillDecisionDepth() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: None
- Doc: auto-strike/initiatives/main/grill.md
- State: Product workflow decisions are being pressure-tested.
- Next: Resolve the active decision node.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/grill.md", `# Bookings Grill

## Phase Tasks
- [x] Review the brainstorm handoff and repo context.
- [ ] Resolve the active decision node.

## Decision Depth
Level: Standard
Why: Default.

Suggested Depth Changes:
- None.

Active Area Overrides:
- None.

Assumptions Accepted:
- None.

## Exit Evidence
- Booking decisions are being grilled at Standard depth.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "standard grill decision depth should satisfy validation");
  const body = json(result);
  assert.ok(!body.messages.some((item) => item.code === "missing-grill-decision-depth"));
  assert.ok(!body.messages.some((item) => item.code === "unknown-grill-decision-depth"));
}

function testValidateAcceptsDeepGrillDecisionDepthWithSuggestedChange() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: None
- Doc: auto-strike/initiatives/main/grill.md
- State: Payment decisions are being pressure-tested.
- Next: Resolve payment failure behavior.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/grill.md", `# Payments Grill

## Phase Tasks
- [x] Review the brainstorm handoff and repo context.
- [ ] Resolve payment failure behavior.

## Decision Depth
Level: Deep
Why: User requested deeper pressure-testing for payments.

Suggested Depth Changes:
- Refund emails: Standard may be enough because copy is reversible.

Active Area Overrides:
- None.

Assumptions Accepted:
- None.

## Exit Evidence
- Payment decision nodes are being grilled at Deep depth.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "deep grill decision depth with suggestion should satisfy validation");
  const body = json(result);
  assert.ok(!body.messages.some((item) => item.code === "missing-grill-decision-depth"));
  assert.ok(!body.messages.some((item) => item.code === "unknown-grill-decision-depth"));
}

function testValidateWarnsForUnknownGrillDecisionDepth() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: None
- Doc: auto-strike/initiatives/main/grill.md
- State: Product workflow decisions are being pressure-tested.
- Next: Resolve the active decision node.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/grill.md", `# Bookings Grill

## Phase Tasks
- [x] Review the brainstorm handoff and repo context.
- [ ] Resolve the active decision node.

## Decision Depth
Level: Hand wavy
Why: User wants speed.

## Exit Evidence
- Booking decisions are being grilled.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "unknown grill decision depth should warn, not fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "unknown-grill-decision-depth" && item.severity === "warning"));
}

function testValidateDoesNotRequireDecisionDepthOutsideGrillMode() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: None
- Doc: auto-strike/initiatives/main/spec.md
- State: Spec is being drafted from grill decisions.
- Next: Draft acceptance criteria.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/spec.md", `# Bookings Spec

## Phase Tasks
- [x] Preserve grill decisions.
- [ ] Draft acceptance criteria.

## Exit Evidence
- Spec is being drafted.
`);
  write(repo, "auto-strike/initiatives/main/grill.md", `# Bookings Grill

## Phase Tasks
- [x] Review the brainstorm handoff and repo context.
- [x] Resolve the active decision node.

## Exit Evidence
- Grill moved to spec before decision depth existed.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "non-grill mode should not require decision depth");
  const body = json(result);
  assert.equal(body.index.currentMode, "spec");
  assert.ok(!body.messages.some((item) => item.code === "missing-grill-decision-depth"));
  assert.ok(!body.messages.some((item) => item.code === "unknown-grill-decision-depth"));
}

function testValidateWarnsForMissingGrillBeforeSpecOrSlice() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/tool-library
- Doc: auto-strike/initiatives/main/features/tool-library/feature-spec.md
- State: Feature has been specced and is being sliced.
- Next: Slice the feature.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/language.md", "# Language\n\n## Tool Library\n- Member: Neighbor using the tool library.\n");
  write(repo, "auto-strike/initiatives/main/decisions.md", "# Decisions\n\n## Status\n- Tool-library decisions are being recorded.\n");
  write(repo, "auto-strike/initiatives/main/spec.md", "# Spec\n\n## Summary\nBuild a local tool library.\n");
  write(repo, "auto-strike/initiatives/main/idea.md", `# Idea

## Phase Ledger

| Phase | Status | Artifact | Reason |
| --- | --- | --- | --- |
| Brainstorm | done | \`idea.md\` | First useful outcome, user, constraints, and non-goals are recorded. |
| Grill | done | \`idea.md\` | Agent inferred decisions from the prompt. |
| Spec | done | \`spec.md\`, \`features/tool-library/feature-spec.md\` | Feature is ready to slice. |
| Slice | in progress | \`features/tool-library/slices/index.md\` | Slice plan is being drafted. |
| Build | pending |  |  |
| Review | pending |  |  |
| Validate | pending |  |  |
`);
  write(repo, "auto-strike/initiatives/main/features/tool-library/feature-spec.md", "# Tool Library Spec\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "missing real grill artifact should warn, not fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "missing-initiative-grill" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "phase-completed-by-inference" && item.severity === "warning"));
}

function testValidateAcceptsGrillDecisionCheckpointBeforeSpec() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: None
- Doc: auto-strike/initiatives/main/spec.md
- State: Spec is being drafted from grill decisions.
- Next: Draft the feature map.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/language.md", "# Language\n\n## Tool Library\n- Member: Neighbor using the tool library.\n");
  write(repo, "auto-strike/initiatives/main/decisions.md", "# Decisions\n\n## Stack\nDecision: Use vanilla HTML and a tiny local server.\n");
  write(repo, "auto-strike/initiatives/main/spec.md", "# Spec\n\n## Summary\nBuild a local tool library.\n");
  write(repo, "auto-strike/initiatives/main/idea.md", `# Idea

## Phase Ledger

| Phase | Status | Artifact | Reason |
| --- | --- | --- | --- |
| Brainstorm | done | \`idea.md\` | First useful outcome, user, constraints, and non-goals are recorded. |
| Grill | done | \`grill.md\`, \`decisions.md\` | User-facing grill resolved hardening decisions. |
| Spec | in progress | \`spec.md\` | Spec is being drafted. |
`);
  write(repo, "auto-strike/initiatives/main/grill.md", `# Tool Library Grill

## Phase Tasks
- [x] Review the brainstorm handoff and repo context.
- [x] Set or confirm Grill Decision Depth.
- [x] Translate vague kickoff language into explicit constraints or questions.
- [x] Identify consequential product/domain/data/workflow decisions.
- [x] Record the Decision Checkpoint before spec.

## Decision Depth
Level: Standard
Why: Default.

## Decision Checkpoint
- Scope / size: First version is a local two-member lending workflow, not a complete marketplace.
- Stack / dependencies: Vanilla HTML plus a tiny local server; no third-party packages.
- Data / persistence / state: JSON file persistence is enough for this prototype.
- Auth / identity / permissions: Name-based member switcher; no real authentication.
- Feature split / non-goals: Listing, browsing, request, pickup, return; no payments or messaging.
- Validation / browser or live checks: Browser walkthrough plus server smoke check.
- User-confirmed decisions: User accepted local prototype constraints in grill.
- Accepted assumptions: Dates can be simple ISO date inputs.
- Deferred decisions: Real auth and notifications.

## Exit Evidence
- Scope, stack, persistence, identity, feature split, and validation are explicit enough to spec.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "grill decision checkpoint should satisfy spec-stage validation");
  const body = json(result);
  assert.ok(!body.messages.some((item) => item.code === "missing-initiative-grill"));
  assert.ok(!body.messages.some((item) => item.code === "missing-grill-decision-checkpoint"));
  assert.ok(!body.messages.some((item) => item.code === "weak-grill-decision-checkpoint"));
}

function testValidateWarnsWhenSpecPhaseCreatesSliceArtifacts() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/tool-library
- Current mode: spec
- Doc: auto-strike/initiatives/main/features/tool-library/feature-spec.md
- State: Spec is being drafted.
- Next: Finish spec review.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/language.md", "# Language\n\n## Tool Library\n- Member: Neighbor using the tool library.\n");
  write(repo, "auto-strike/initiatives/main/decisions.md", "# Decisions\n\n## Stack\nDecision: Use a local server.\n");
  write(repo, "auto-strike/initiatives/main/grill.md", `# Grill

## Decision Checkpoint
- Scope / size: One feature.
- Stack / dependencies: Local app.
- Data / persistence / state: SQLite.
- Auth / identity / permissions: Seed members.
- Validation / browser or live checks: Manual browser check.
- User-confirmed decisions: User confirmed defaults.
`);
  write(repo, "auto-strike/initiatives/main/idea.md", `# Idea

## Phase Ledger

| Phase | Status | Artifact | Reason |
| --- | --- | --- | --- |
| Brainstorm | done | \`idea.md\` | First useful outcome, user, constraints, and non-goals are recorded. |
| Grill | done | \`grill.md\`, \`decisions.md\` | User-facing grill resolved hardening decisions. |
| Spec | in progress | \`spec.md\`, \`features/tool-library/feature-spec.md\` | Spec is being drafted. |
| Slice | pending |  |  |
`);
  write(repo, "auto-strike/initiatives/main/spec.md", "# Spec\n\n## Summary\nBuild a local tool library.\n");
  write(repo, "auto-strike/initiatives/main/features/tool-library/feature-spec.md", `# Tool Library Spec

## Summary
Build the core tool library.

## Slice Handoff
- Slice next after spec is reviewed.
`);
  write(repo, "auto-strike/initiatives/main/features/tool-library/slices/index.md", `# Slices

## Slice Map

| Slice | Size | Depends On | Unblocks | Risk | Verification |
| --- | --- | --- | --- | --- | --- |
| 0. Setup | S | None | Tool listing | High | App starts |
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "slice artifacts during spec should warn, not fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "spec-phase-created-slice-artifacts" && item.severity === "warning"));
}

function testValidateWarnsForDetailedSlicePlanningInsideSpec() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/tool-library
- Current mode: spec
- Doc: auto-strike/initiatives/main/features/tool-library/feature-spec.md
- State: Spec is being drafted.
- Next: Finish spec review.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/language.md", "# Language\n\n## Tool Library\n- Member: Neighbor using the tool library.\n");
  write(repo, "auto-strike/initiatives/main/decisions.md", "# Decisions\n\n## Stack\nDecision: Use a local server.\n");
  write(repo, "auto-strike/initiatives/main/grill.md", `# Grill

## Decision Checkpoint
- Scope / size: One feature.
- Stack / dependencies: Local app.
- Data / persistence / state: SQLite.
- Auth / identity / permissions: Seed members.
- Validation / browser or live checks: Manual browser check.
- User-confirmed decisions: User confirmed defaults.
`);
  write(repo, "auto-strike/initiatives/main/idea.md", `# Idea

## Phase Ledger

| Phase | Status | Artifact | Reason |
| --- | --- | --- | --- |
| Brainstorm | done | \`idea.md\` | First useful outcome, user, constraints, and non-goals are recorded. |
| Grill | done | \`grill.md\`, \`decisions.md\` | User-facing grill resolved hardening decisions. |
| Spec | in progress | \`spec.md\`, \`features/tool-library/feature-spec.md\` | Spec is being drafted. |
`);
  write(repo, "auto-strike/initiatives/main/spec.md", "# Spec\n\n## Summary\nBuild a local tool library.\n");
  write(repo, "auto-strike/initiatives/main/features/tool-library/feature-spec.md", `# Tool Library Spec

## Summary
Build the core tool library.

## Slice Map

| Slice | Size | Depends On | Unblocks | Risk | Verification |
| --- | --- | --- | --- | --- | --- |
| 0. Setup | S | None | Tool listing | High | App starts |
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "detailed slice planning inside spec should warn, not fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "detailed-slice-planning-in-spec" && item.severity === "warning"));
}

function testValidateAllowsConciseSliceHandoffInsideSpec() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/tool-library
- Current mode: spec
- Doc: auto-strike/initiatives/main/features/tool-library/feature-spec.md
- State: Spec is being drafted.
- Next: Finish spec review.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/language.md", "# Language\n\n## Tool Library\n- Member: Neighbor using the tool library.\n");
  write(repo, "auto-strike/initiatives/main/decisions.md", "# Decisions\n\n## Stack\nDecision: Use a local server.\n");
  write(repo, "auto-strike/initiatives/main/grill.md", `# Grill

## Decision Checkpoint
- Scope / size: One feature.
- Stack / dependencies: Local app.
- Data / persistence / state: SQLite.
- Auth / identity / permissions: Seed members.
- Validation / browser or live checks: Manual browser check.
- User-confirmed decisions: User confirmed defaults.
`);
  write(repo, "auto-strike/initiatives/main/idea.md", `# Idea

## Phase Ledger

| Phase | Status | Artifact | Reason |
| --- | --- | --- | --- |
| Brainstorm | done | \`idea.md\` | First useful outcome, user, constraints, and non-goals are recorded. |
| Grill | done | \`grill.md\`, \`decisions.md\` | User-facing grill resolved hardening decisions. |
| Spec | in progress | \`spec.md\`, \`features/tool-library/feature-spec.md\` | Spec is being drafted. |
`);
  write(repo, "auto-strike/initiatives/main/spec.md", "# Spec\n\n## Summary\nBuild a local tool library.\n");
  write(repo, "auto-strike/initiatives/main/features/tool-library/feature-spec.md", `# Tool Library Spec

## Summary
Build the core tool library.

## Slice Handoff
- Start by slicing the smallest runnable setup path, then the first tool-listing behavior.
- Keep lifecycle risk early and verify each slice.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "concise slice handoff inside spec should be allowed");
  const body = json(result);
  assert.ok(!body.messages.some((item) => item.code === "spec-phase-created-slice-artifacts"));
  assert.ok(!body.messages.some((item) => item.code === "detailed-slice-planning-in-spec"));
}

function testValidateAcceptsExplicitUserOptOutOfGrill() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/tool-library
- Doc: auto-strike/initiatives/main/features/tool-library/feature-spec.md
- State: User asked to skip grill and move along to implementation planning.
- Next: Slice the feature.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/language.md", "# Language\n\n## Tool Library\n- Member: Neighbor using the tool library.\n");
  write(repo, "auto-strike/initiatives/main/decisions.md", "# Decisions\n\n## Status\n- User asked the agent to proceed with assumptions.\n");
  write(repo, "auto-strike/initiatives/main/spec.md", "# Spec\n\n## Summary\nBuild a local tool library.\n");
  write(repo, "auto-strike/initiatives/main/idea.md", `# Idea

## Phase Ledger

| Phase | Status | Artifact | Reason |
| --- | --- | --- | --- |
| Brainstorm | done | \`idea.md\` | First useful outcome, user, constraints, and non-goals are recorded. |
| Grill | skipped | \`idea.md\`, \`decisions.md\` | User explicitly asked to skip grill and move along; assumptions are recorded. |
| Spec | done | \`spec.md\`, \`features/tool-library/feature-spec.md\` | Feature is ready to slice. |
| Slice | in progress | \`features/tool-library/slices/index.md\` | Slice plan is being drafted. |
`);
  write(repo, "auto-strike/initiatives/main/features/tool-library/feature-spec.md", "# Tool Library Spec\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "explicit user opt-out should not require grill artifact");
  const body = json(result);
  assert.ok(!body.messages.some((item) => item.code === "missing-initiative-grill"));
  assert.ok(!body.messages.some((item) => item.code === "missing-grill-decision-checkpoint"));
}

function testValidateWarnsForPhaseCompletedAfterQuestionToolFailure() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/tool-library
- Doc: auto-strike/initiatives/main/features/tool-library/slices/slice-0-static-app.md
- State: Slice planning has started.
- Next: Build the first slice.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/language.md", "# Language\n\n## Tool Library\n- Member: Neighbor using the tool library.\n");
  write(repo, "auto-strike/initiatives/main/decisions.md", "# Decisions\n\n## Identity\nDecision: Pre-seeded picker.\n");
  write(repo, "auto-strike/initiatives/main/spec.md", "# Spec\n\n## Summary\nBuild a local tool library.\n");
  write(repo, "auto-strike/initiatives/main/idea.md", `# Idea

## Phase Ledger

| Phase | Status | Artifact | Reason |
| --- | --- | --- | --- |
| Brainstorm | done | \`idea.md\` | First useful outcome, user, constraints, and non-goals are recorded. |
| Grill | compressed | \`grill.md\`, \`decisions.md\` | AskUserQuestion returned "Answer questions?", so the agent picked defaults and proceeded. |
| Spec | done | \`spec.md\`, \`features/tool-library/feature-spec.md\` | Feature is ready to slice. |
| Slice | in progress | \`features/tool-library/slices/index.md\` | Slice plan is being drafted. |
`);
  write(repo, "auto-strike/initiatives/main/grill.md", `# Grill

## Decision Checkpoint
- Scope / size: local first version.
- Stack / dependencies: no packages.
- Data / persistence / state: JSON file.
- Auth / identity / permissions: pre-seeded picker.
- Feature split / non-goals: one feature, no auth.
- Validation / browser or live checks: browser walkthrough.
- Accepted assumptions: Chosen after question tool failure.
`);
  write(repo, "auto-strike/initiatives/main/features/tool-library/feature-spec.md", "# Tool Library Spec\n");
  write(repo, "auto-strike/initiatives/main/features/tool-library/slices/slice-0-static-app.md", `# Slice 0: Static App

## Size
S

## Depends On
- None.

## Execution Tasks
- [ ] Research local patterns.
- [ ] Write plan.
- [ ] Review plan.
- [ ] Verify app.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "phase completed after question tool failure should warn, not fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "phase-completed-after-question-tool-failure" && item.severity === "warning"));
}

function testValidateAcceptsSliceMapDependenciesAndCheckpoint() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/auth-mvp
- Current mode: slice
- Active slice: auto-strike/initiatives/main/features/auth-mvp/slices/slice-1-register-user.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/features/auth-mvp/feature-spec.md", "# Auth MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/features/auth-mvp/slices/index.md", `# Slices

## Slice Map

| Slice | Size | Depends On | Unblocks | Risk | Verification |
| --- | --- | --- | --- | --- | --- |
| 0. Session Baseline | S | None | Register User | High | App starts; auth route smoke |
| 1. Register User | M | 0 | Login User | Medium | Register flow smoke |
| 2. Login User | M | 0, 1 | Org creation | High | Login/session browser check |

## Checkpoint: After Slices 1-3
- [ ] App builds or starts without errors.
- [ ] Focused tests or checks pass.
- [ ] Core user/system flow works end to end.
- [ ] Review findings are resolved or accepted.
- [ ] Human decision needed? If yes, pause and ask.
`);
  write(repo, "auto-strike/initiatives/main/features/auth-mvp/slices/slice-0-session-baseline.md", `# Slice 0: Session Baseline

## Size
S

## Outcome
Session plumbing is ready for user auth flows.

## Acceptance Criteria
- Server starts with session middleware configured.
- Auth smoke route returns a stable response.

## Depends On
- None.

## Likely Surfaces
- \`server.js\`
- \`auth/session.js\`

## Execution Tasks
- [x] Research local session precedent before coding.
- [x] Write plan with exact surfaces and checks.
- [x] Review plan and resolve findings.
- [ ] Verify acceptance criteria with auth smoke check.

## Non-Vertical Justification
- Reason: reduces auth/session risk before user-facing registration.
- Next vertical slice: Slice 1 Register User.
`);
  write(repo, "auto-strike/initiatives/main/features/auth-mvp/slices/slice-1-register-user.md", `# Slice 1: Register User

## Size
M

## Outcome
User can create an account.

## Acceptance Criteria
- Valid user can register.
- Duplicate email shows a visible error.
- Registered user has a session.

## Depends On
- Slice 0: Session Baseline.

## Likely Surfaces
- \`server.js\`
- \`auth/routes.js\`
- \`public/register.html\`
- \`public/app.js\`

## Execution Tasks
- [ ] Research registration docs and local auth routes.
- [ ] Write plan with exact surfaces and checks.
- [ ] Review plan and resolve findings.
- [ ] Verify acceptance criteria with register flow smoke.
`);
  write(repo, "auto-strike/initiatives/main/features/auth-mvp/slices/slice-2-login-user.md", `# Slice 2: Login User

## Size
M

## Outcome
User can log in with an existing account.

## Acceptance Criteria
- Existing user can log in.
- Invalid credentials show a visible error.

## Depends On
- Slice 0: Session Baseline.
- Slice 1: Register User.

## Likely Surfaces
- \`server.js\`
- \`auth/routes.js\`
- \`public/login.html\`
- \`public/app.js\`

## Execution Tasks
- [ ] Research login/session behavior before coding.
- [ ] Write plan with exact surfaces and checks.
- [ ] Review plan and resolve findings.
- [ ] Verify acceptance criteria with login/session browser check.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "clean slice map, dependencies, and checkpoint should pass");
  const body = json(result);
  const newWarningCodes = new Set([
    "missing-slice-map",
    "missing-slice-checkpoint",
    "missing-slice-dependency",
    "missing-slice-execution-tasks",
    "oversized-slice",
    "too-many-slice-acceptance-criteria",
    "too-many-slice-surfaces",
    "batched-slice-title",
    "weak-non-vertical-slice-justification",
  ]);
  assert.ok(!body.messages.some((item) => newWarningCodes.has(item.code)));
}

function testValidateWarnsForMissingSliceMapDependenciesAndCheckpoint() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/auth-mvp
- Current mode: slice

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/features/auth-mvp/feature-spec.md", "# Auth MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/features/auth-mvp/slices/slice-0-session.md", `# Slice 0: Session

## Size
S

## Depends On
- None.
`);
  write(repo, "auto-strike/initiatives/main/features/auth-mvp/slices/slice-1-register.md", `# Slice 1: Register

## Size
M
`);
  write(repo, "auto-strike/initiatives/main/features/auth-mvp/slices/slice-2-login.md", `# Slice 2: Login

## Size
M

## Depends On
- Slice 1: Register.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "missing slice map/dependency/checkpoint should warn, not fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "missing-slice-map" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "missing-slice-checkpoint" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "missing-slice-dependency" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "missing-slice-execution-tasks" && item.severity === "warning"));
}

function testValidateWarnsForOversizedBatchedAndWeakNonVerticalSlice() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/auth-mvp
- Current mode: slice

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/features/auth-mvp/feature-spec.md", "# Auth MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/features/auth-mvp/slices/slice-0-full-mvp.md", `# Slice 0: Full MVP Setup Frontend and Backend

## Size
XL

## Outcome
Build the whole auth MVP.

## Acceptance Criteria
- Repo is configured.
- Packages are installed.
- Registration works.
- Login works.

## Depends On
- None.

## Likely Surfaces
- \`package.json\`
- \`server.js\`
- \`auth/client.js\`
- \`auth/routes.js\`
- \`public/index.html\`
- \`public/app.js\`
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "oversized batched non-vertical slice should warn, not fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "oversized-slice" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "too-many-slice-acceptance-criteria" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "too-many-slice-surfaces" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "batched-slice-title" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "weak-non-vertical-slice-justification" && item.severity === "warning"));
}

function testValidateWarnsForDuplicateActiveWorkAndStillChecksSlices() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: None
- Feature: auto-strike/initiatives/main/features/tool-library
- Doc: auto-strike/initiatives/main/features/tool-library/slices/index.md
- Slice: None
- State: Slice map written.
- Next: Build slice 0.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/language.md", "# Language\n\n## Tool Library\n- Tool means borrowable item.\n");
  write(repo, "auto-strike/initiatives/main/decisions.md", "# Decisions\n\n## Status\n- Decided.\n");
  write(repo, "auto-strike/initiatives/main/idea.md", `# Main Idea

## Phase Ledger
| Phase | Status | Artifact | Reason |
| --- | --- | --- | --- |
| Brainstorm | done | \`idea.md\` | First useful outcome and constraints are recorded. |
| Grill | done | \`grill.md\` | Stack, persistence, permissions, and verification are decided. |
| Spec | done | \`spec.md\`, \`features/tool-library/feature-spec.md\` | Feature is explicit and sliceable. |
| Slice | done | \`features/tool-library/slices/index.md\` | Slice map is complete. |
| Build | pending |  |  |
| Review | pending |  |  |
| Validate | pending |  |  |
`);
  write(repo, "auto-strike/initiatives/main/features/tool-library/feature-spec.md", "# Tool Library Spec\n");
  write(repo, "auto-strike/initiatives/main/features/tool-library/slices/index.md", `# Slices

## Slice Map
| Slice | Size | Depends On | Unblocks | Risk | Verification |
| --- | --- | --- | --- | --- | --- |
| 0. Scaffold + domain | M | None | Persona shell | High | Typecheck |
`);
  write(repo, "auto-strike/initiatives/main/features/tool-library/slices/slice-0-scaffold.md", `# Slice 0: Scaffold + domain core

## Size
M

## Acceptance Criteria
- App scaffold exists.
- Domain types exist.
- Store seeds.
- Dev server boots.

## Depends On
- None.

## Likely Surfaces
- \`package.json\`
- \`apps/tool/package.json\`
- \`apps/tool/app/page.tsx\`
- \`apps/tool/src/domain/types.ts\`
- \`apps/tool/src/storage/store.ts\`
- \`apps/tool/src/storage/seed.ts\`

## Execution Tasks
- [ ] Research package docs.
- [ ] Write plan.
- [ ] Review plan.
- [ ] Verify typecheck.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "duplicate active work should warn but still validate slices");
  const body = json(result);
  assert.equal(body.activeFeature.path, "auto-strike/initiatives/main/features/tool-library");
  assert.ok(body.messages.some((item) => item.code === "duplicate-active-work-field" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "too-many-slice-acceptance-criteria" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "too-many-slice-surfaces" && item.severity === "warning"));
  assert.ok(!body.messages.some((item) => item.code === "missing-active-feature"));
}

function testValidateWarnsForDuplicatePhaseLedgerRowsWithoutFalseSpecSliceBoundary() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/tool-library
- Doc: auto-strike/initiatives/main/features/tool-library/slices/index.md
- Slice: auto-strike/initiatives/main/features/tool-library/slices/slice-0-scaffold.md
- State: Slice map written.
- Next: Build slice 0.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/language.md", "# Language\n\n## Tool Library\n- Tool means borrowable item.\n");
  write(repo, "auto-strike/initiatives/main/decisions.md", "# Decisions\n\n## Status\n- Decided.\n");
  write(repo, "auto-strike/initiatives/main/idea.md", `# Main Idea

## Phase Ledger
| Phase | Status | Artifact | Reason |
| --- | --- | --- | --- |
| Brainstorm | done | \`idea.md\` | First useful outcome and constraints are recorded. |
| Grill | done | \`grill.md\` | Stack, persistence, permissions, and verification are decided. |
| Spec | done | \`spec.md\`, \`features/tool-library/feature-spec.md\` | Feature is explicit and sliceable. |
| Slice | done | \`features/tool-library/slices/index.md\` | Slice map is complete. |
| Build | in progress | \`features/tool-library/slices/slice-0-scaffold.md\` | Slice 0 is active. |
| Spec | pending |  |  |
| Slice | pending |  |  |
| Build | pending |  |  |
| Review | pending |  |  |
| Validate | pending |  |  |
`);
  write(repo, "auto-strike/initiatives/main/features/tool-library/feature-spec.md", "# Tool Library Spec\n");
  write(repo, "auto-strike/initiatives/main/features/tool-library/slices/index.md", `# Slices

## Slice Map
| Slice | Size | Depends On | Unblocks | Risk | Verification |
| --- | --- | --- | --- | --- | --- |
| 0. Scaffold | S | None | Persona shell | Medium | Typecheck |
`);
  write(repo, "auto-strike/initiatives/main/features/tool-library/slices/slice-0-scaffold.md", `# Slice 0: Scaffold

## Size
S

## Acceptance Criteria
- App starts.

## Depends On
- None.

## Likely Surfaces
- \`apps/tool/app/page.tsx\`

## Execution Tasks
- [ ] Research local pattern.
- [ ] Write plan.
- [ ] Review plan.
- [ ] Verify typecheck.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "duplicate phase rows should warn without false spec boundary warning");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "duplicate-phase-ledger-row" && item.severity === "warning"));
  assert.ok(!body.messages.some((item) => item.code === "spec-phase-created-slice-artifacts"));
}

function testReviewPlanRecommendsUiRegressionForUiChanges() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/todo-dogfood
- Current mode: build
- Active slice: auto-strike/initiatives/main/features/todo-dogfood/slices/slice-1-edit-task.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/features/todo-dogfood/feature-spec.md", "# Todo Dogfood Spec\n");
  write(repo, "auto-strike/initiatives/main/features/todo-dogfood/slices/slice-1-edit-task.md", `# Slice 1: Edit Task

## Evidence

Changed:
- todo/index.html
- todo/todo.js

Verified:
- node scripts/todo-smoke.js - passed
`);
  write(repo, "todo/index.html", "<!doctype html>\n<input>\n");
  write(repo, "todo/todo.js", "export function todo() {}\n");

  const planResult = run(repo, ["review-plan"]);
  assertStatus(planResult, 0, "review-plan should succeed for UI changes");
  const plan = json(planResult);
  const requiredLenses = plan.required.map((item) => item.lens);
  assert.ok(requiredLenses.includes("functionality"));
  assert.ok(requiredLenses.includes("spec-coverage"));
  assert.ok(requiredLenses.includes("code-quality"));
  assert.ok(requiredLenses.includes("ui-regression"));
  assert.ok(requiredLenses.includes("user-flows"));
  assert.ok(plan.surfaces.ui.includes("todo/index.html"));
  assert.ok(plan.notes.some((item) => /Verification Capability/.test(item)));

  const validate = run(repo, ["validate"]);
  assertStatus(validate, 0, "UI review gaps should warn, not fail");
  const body = json(validate);
  assert.ok(body.messages.some((item) => item.code === "missing-reviewed-lens-evidence" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "missing-ui-browser-review-evidence" && item.severity === "warning"));

  const alias = run(repo, ["review-context", "--lens", "frontend"]);
  assertStatus(alias, 0, "frontend alias should resolve to the UI regression lens");
  assert.equal(json(alias).lens, "ui-regression");
}

function testUiReviewEvidenceSuppressesUiReviewWarning() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/todo-dogfood
- Current mode: review
- Active slice: auto-strike/initiatives/main/features/todo-dogfood/slices/slice-1-edit-task.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/features/todo-dogfood/feature-spec.md", "# Todo Dogfood Spec\n");
  write(repo, "auto-strike/initiatives/main/features/todo-dogfood/slices/slice-1-edit-task.md", `# Slice 1: Edit Task

## Verification Capability
- Repo scripts/checks: \`node scripts/todo-smoke.js\`.
  - Host/browser/manual checks: checked host browser tool and manual browser option; both unavailable in this session because GUI access is blocked.
- Package installs allowed: none.
  - Blocked checks: browser screenshot/click check blocked by no host browser or manual browser access.
- Replacement evidence: smoke script plus static UI regression review; residual risk is visual layout.

## Evidence

Changed:
- todo/index.html
- todo/todo.js

Verified:
- node scripts/todo-smoke.js - passed

Reviewed:
- ui-regression - pass; static CSS selector review checked new edit input against existing selectors
- functionality - pass

Skipped:
- Browser check - checked host browser tool and manual browser option; both blocked by no GUI/browser access, so smoke script plus static UI regression review were used as replacement evidence; residual risk is visual layout.
`);
  write(repo, "todo/index.html", "<!doctype html>\n<input>\n");
  write(repo, "todo/todo.js", "export function todo() {}\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "recorded UI review evidence should satisfy UI review validation");
  const body = json(result);
  assert.ok(!body.messages.some((item) => item.code === "missing-reviewed-lens-evidence"));
  assert.ok(!body.messages.some((item) => item.code === "missing-ui-browser-review-evidence"));
  assert.ok(!body.messages.some((item) => item.code === "missing-verification-capability"));
}

function testUiRegressionReviewAloneDoesNotSuppressBrowserWarning() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/todo-dogfood
- Current mode: review
- Active slice: auto-strike/initiatives/main/features/todo-dogfood/slices/slice-1-edit-task.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/features/todo-dogfood/feature-spec.md", "# Todo Dogfood Spec\n");
  write(repo, "auto-strike/initiatives/main/features/todo-dogfood/slices/slice-1-edit-task.md", `# Slice 1: Edit Task

## Evidence

Changed:
- todo/index.html
- todo/todo.js

Verified:
- node scripts/todo-smoke.js - passed

Reviewed:
- functionality - pass
- spec-coverage - pass
- code-quality - pass
- ui-regression - pass; static selector review checked edit input against checkbox selectors
- user-flows - pass
`);
  write(repo, "todo/index.html", "<!doctype html>\n<input>\n");
  write(repo, "todo/todo.js", "export function todo() {}\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "static UI review without browser evidence should warn");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "missing-ui-browser-review-evidence" && item.severity === "warning"));
}

function testCurlLocalhostDoesNotSuppressBrowserWarning() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/todo-dogfood
- Current mode: review
- Active slice: auto-strike/initiatives/main/features/todo-dogfood/slices/slice-1-edit-task.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/features/todo-dogfood/feature-spec.md", "# Todo Dogfood Spec\n");
  write(repo, "auto-strike/initiatives/main/features/todo-dogfood/slices/slice-1-edit-task.md", `# Slice 1: Edit Task

## Evidence

Changed:
- todo/index.html
- todo/todo.js

Verified:
- curl http://localhost:3000/ - passed

Reviewed:
- functionality - pass
- spec-coverage - pass
- code-quality - pass
- ui-regression - pass by static selector review
- user-flows - pass by curl route checks
`);
  write(repo, "todo/index.html", "<!doctype html>\n<input>\n");
  write(repo, "todo/todo.js", "document.querySelector('button').addEventListener('click', () => {});\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "curl localhost checks should not count as browser evidence");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "missing-ui-browser-review-evidence" && item.severity === "warning"));
}

function testPackageOnlyBrowserSkipDoesNotSuppressBrowserWarning() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/todo-dogfood
- Current mode: build
- Active slice: auto-strike/initiatives/main/features/todo-dogfood/slices/slice-1-edit-task.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/features/todo-dogfood/feature-spec.md", "# Todo Dogfood Spec\n");
  write(repo, "auto-strike/initiatives/main/features/todo-dogfood/slices/slice-1-edit-task.md", `# Slice 1: Edit Task

## Evidence

Changed:
- todo/index.html
- todo/todo.js

Verified:
- node scripts/todo-smoke.js - passed

Reviewed:
- functionality - pass
- spec-coverage - pass
- code-quality - pass
- ui-regression - pass by static review plus syntax checks
- user-flows - pass

Skipped:
- Automated browser screenshot/click automation - no browser automation dependency exists in this repo and package installs are out of scope; replaced with API flow checks and static UI review
`);
  write(repo, "todo/index.html", "<!doctype html>\n<input>\n");
  write(repo, "todo/todo.js", "export function todo() {}\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "package-only browser skip should warn, not fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "missing-ui-browser-review-evidence" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "missing-verification-capability" && item.severity === "warning"));
}

function testValidateWarnsForMissingVerificationCapabilityOnSkippedUiChecks() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/todo-dogfood
- Current mode: review
- Active slice: auto-strike/initiatives/main/features/todo-dogfood/slices/slice-1-edit-task.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/features/todo-dogfood/feature-spec.md", "# Todo Dogfood Spec\n");
  write(repo, "auto-strike/initiatives/main/features/todo-dogfood/slices/slice-1-edit-task.md", `# Slice 1: Edit Task

## Evidence

Changed:
- todo/index.html
- todo/todo.js

Verified:
- node scripts/todo-smoke.js - passed

Reviewed:
- functionality - pass
- spec-coverage - pass
- code-quality - pass
- ui-regression - pass; static selector review checked edit input against checkbox selectors
- user-flows - pass

Skipped:
- Browser screenshot/click check - browser backend unavailable; static UI regression review was used as replacement evidence
`);
  write(repo, "todo/index.html", "<!doctype html>\n<input>\n");
  write(repo, "todo/todo.js", "document.querySelector('button').addEventListener('click', () => {});\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "missing verification capability should warn, not fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "missing-verification-capability" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "missing-ui-browser-review-evidence" && item.severity === "warning"));
}

function testValidateAcceptsVerificationCapabilityForSkippedUiChecks() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/todo-dogfood
- Current mode: review
- Active slice: auto-strike/initiatives/main/features/todo-dogfood/slices/slice-1-edit-task.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/features/todo-dogfood/feature-spec.md", "# Todo Dogfood Spec\n");
  write(repo, "auto-strike/initiatives/main/features/todo-dogfood/slices/slice-1-edit-task.md", `# Slice 1: Edit Task

## Verification Capability
- Repo scripts/checks: \`node scripts/todo-smoke.js\`.
  - Host/browser/manual checks: checked host browser tool and manual browser option; browser backend unavailable in this session and manual browser check blocked by no GUI access.
- Package installs allowed: none.
- Blocked checks: browser screenshot/click check blocked by no host browser access.
- Replacement evidence: smoke script plus static UI regression review; residual risk is visual layout.

## Evidence

Changed:
- todo/index.html
- todo/todo.js

Verified:
- node scripts/todo-smoke.js - passed

Reviewed:
- functionality - pass
- spec-coverage - pass
- code-quality - pass
- ui-regression - pass; static selector review checked edit input against checkbox selectors
- user-flows - pass

Skipped:
- Browser screenshot/click check - checked host browser tool and manual browser option; both blocked by no GUI/browser access, so smoke script plus static UI regression review were used as replacement evidence; residual risk is visual layout.
`);
  write(repo, "todo/index.html", "<!doctype html>\n<input>\n");
  write(repo, "todo/todo.js", "document.querySelector('button').addEventListener('click', () => {});\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "recorded verification capability should satisfy validation");
  const body = json(result);
  assert.ok(!body.messages.some((item) => item.code === "missing-verification-capability"));
  assert.ok(!body.messages.some((item) => item.code === "missing-ui-browser-review-evidence"));
}

function testValidateWarnsForMissingSliceCloseoutSummary() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/video-mvp
- Current mode: review
- Active slice: auto-strike/initiatives/main/features/video-mvp/slices/slice-0-caption.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/features/video-mvp/feature-spec.md", "# Video MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/features/video-mvp/slices/slice-0-caption.md", `# Slice 0: Caption

## Evidence

Changed:
- src/video/caption.ts

Verified:
- node scripts/caption-smoke.js - passed

Reviewed:
- functionality - passed after fixes
- spec-coverage - passed
- code-quality - passed
- final re-review - no remaining blockers
`);
  write(repo, "src/video/caption.ts", "export function caption() {}\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "missing slice closeout summary should warn, not fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "missing-slice-closeout-summary" && item.severity === "warning"));
}

function testValidateAcceptsSliceCloseoutSummary() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/video-mvp
- Current mode: review
- Active slice: auto-strike/initiatives/main/features/video-mvp/slices/slice-0-caption.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/features/video-mvp/feature-spec.md", "# Video MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/features/video-mvp/slices/slice-0-caption.md", `# Slice 0: Caption

## Evidence

Changed:
- src/video/caption.ts

Verified:
- node scripts/caption-smoke.js - passed

Reviewed:
- functionality - passed after fixes
- spec-coverage - passed
- code-quality - passed
- final re-review - no remaining blockers

Skipped:
- None.

## Closeout Summary
Implemented Slice 0: Caption.

Built:
- Added caption generation behavior.
- Added validation for empty transcript input.

Validation passed:
- node scripts/caption-smoke.js

Review:
- Functionality/spec/code quality: passed after fixes.
- Final re-review: no remaining blocking findings.

Skipped / residual risk:
- None.

Docs:
- auto-strike/initiatives/main/features/video-mvp/slices/slice-0-caption.md

Next:
- Slice 1: Caption editing.
`);
  write(repo, "src/video/caption.ts", "export function caption() {}\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "recorded slice closeout summary should satisfy validation");
  const body = json(result);
  assert.ok(!body.messages.some((item) => item.code === "missing-slice-closeout-summary"));
}

function testValidateDoesNotRequireCloseoutForInProgressBuildSlice() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/video-mvp
- Current mode: build
- Active slice: auto-strike/initiatives/main/features/video-mvp/slices/slice-0-caption.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/features/video-mvp/feature-spec.md", "# Video MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/features/video-mvp/slices/slice-0-caption.md", `# Slice 0: Caption

## Evidence

Changed:
- src/video/caption.ts

Verified:
- node scripts/caption-smoke.js - passed
`);
  write(repo, "src/video/caption.ts", "export function caption() {}\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "in-progress build slice should not require closeout yet");
  const body = json(result);
  assert.ok(!body.messages.some((item) => item.code === "missing-slice-closeout-summary"));
}

function testValidateWarnsForMissingRequiredReviewLenses() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/video-mvp
- Current mode: review
- Active slice: auto-strike/initiatives/main/features/video-mvp/slices/slice-0-upload.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/features/video-mvp/feature-spec.md", "# Video MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/features/video-mvp/slices/slice-0-upload.md", `# Slice 0: Upload

## Implementation Research
- Local precedent: src/video/upload.ts owns upload behavior.

## Plan
- Update \`src/video/upload.ts\` and verify with \`node scripts/video-smoke.js\`.

## Plan Review
- main-agent review - pass; files and verification are named.

## Evidence

Changed:
- src/video/upload.ts

Verified:
- node scripts/video-smoke.js - passed

Reviewed:
- code-quality - pass
`);
  write(repo, "src/video/upload.ts", "export function upload() {}\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "missing required review lenses should warn, not fail");
  const body = json(result);
  const missing = body.messages.filter((item) => item.code === "missing-required-review-lens");
  assert.equal(missing.length, 2);
  assert.ok(missing.some((item) => /functionality/.test(item.message)));
  assert.ok(missing.some((item) => /spec-coverage/.test(item.message)));
  assert.ok(!missing.some((item) => /code-quality/.test(item.message)));
}

function testValidateAcceptsReviewedAndSkippedRequiredReviewLenses() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/todo-dogfood
- Current mode: review
- Active slice: auto-strike/initiatives/main/features/todo-dogfood/slices/slice-1-edit-task.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/features/todo-dogfood/feature-spec.md", "# Todo Dogfood Spec\n");
  write(repo, "auto-strike/initiatives/main/features/todo-dogfood/slices/slice-1-edit-task.md", `# Slice 1: Edit Task

## Implementation Research
- Local precedent: todo/todo.js owns task state changes; plan impact: add updateTask beside addTask/toggleTask.

## Plan
- Update \`todo/todo.js\` with updateTask validation and persistence.
- Update \`todo/index.html\` with edit controls.
- Verify with \`node scripts/todo-smoke.js\` and static UI selector review.

## Plan Review
- main-agent review - pass; files, verification, and UI selector risks are named.

## Evidence

Changed:
- todo/index.html
- todo/todo.js

Verified:
- node scripts/todo-smoke.js - passed

Reviewed:
- functionality - pass
- spec-coverage - pass
- code-quality - pass
- ui-regression - pass; static selector review checked edit input against checkbox selectors

Skipped:
- user-flows - accepted skip; edit/save/cancel flows were already covered by the smoke script for this narrow slice
`);
  write(repo, "todo/index.html", "<!doctype html>\n<input>\n");
  write(repo, "todo/todo.js", "document.querySelector('button').addEventListener('click', () => {});\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "reviewed and skipped required lenses should satisfy validation");
  const body = json(result);
  assert.ok(!body.messages.some((item) => item.code === "missing-required-review-lens"));
}

function testValidateWarnsForSingleSliceWithoutFreshReviewAgentEvidence() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/video-mvp
- Current mode: review
- Active slice: auto-strike/initiatives/main/features/video-mvp/slices/slice-0-upload.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/features/video-mvp/feature-spec.md", "# Video MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/features/video-mvp/slices/slice-0-upload.md", `# Slice 0: Upload

## Implementation Research
- Local precedent: src/video/upload.ts owns upload behavior.

## Plan
- Update \`src/video/upload.ts\` and verify with \`node scripts/video-smoke.js\`.

## Plan Review
- main-agent review - pass; files and verification are named.

## Evidence

Changed:
- src/video/upload.ts

Verified:
- node scripts/video-smoke.js - passed

Reviewed:
- functionality - pass
- spec-coverage - pass
- code-quality - pass
`);
  write(repo, "src/video/upload.ts", "export function upload() {}\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "single-slice completed review without fresh reviewer evidence should warn");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "missing-fresh-review-agent-evidence" && item.severity === "warning"));
}

function testValidateAcceptsFreshReviewAgentUnavailableRationale() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/video-mvp
- Current mode: review
- Active slice: auto-strike/initiatives/main/features/video-mvp/slices/slice-0-upload.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/features/video-mvp/feature-spec.md", "# Video MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/features/video-mvp/slices/slice-0-upload.md", `# Slice 0: Upload

## Implementation Research
- Local precedent: src/video/upload.ts owns upload behavior.

## Plan
- Update \`src/video/upload.ts\` and verify with \`node scripts/video-smoke.js\`.

## Plan Review
- main-agent review - pass; files and verification are named.

## Evidence

Changed:
- src/video/upload.ts

Verified:
- node scripts/video-smoke.js - passed

Reviewed:
- functionality - pass
- spec-coverage - pass
- code-quality - pass

Skipped:
- fresh read-only review agent - host does not expose subagents in this run; main-agent review used as replacement evidence.
`);
  write(repo, "src/video/upload.ts", "export function upload() {}\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "explicit unavailable-host fresh-review rationale should satisfy validation");
  const body = json(result);
  assert.ok(!body.messages.some((item) => item.code === "missing-fresh-review-agent-evidence"));
}

function testValidateWarnsForMultiSliceWithoutFreshReviewAgentEvidence() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/video-mvp
- Current mode: review
- Active slice: auto-strike/initiatives/main/features/video-mvp/slices/slice-0-upload.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/features/video-mvp/feature-spec.md", "# Video MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/features/video-mvp/slices/slice-1-caption.md", `# Slice 1: Caption

## Size
S

## Depends On
- Slice 0: Upload.

## Execution Tasks
- [ ] Research local caption behavior.
- [ ] Write plan with surfaces and checks.
- [ ] Review plan and resolve findings.
- [ ] Verify caption behavior.
`);
  write(repo, "auto-strike/initiatives/main/features/video-mvp/slices/slice-0-upload.md", `# Slice 0: Upload

## Implementation Research
- Local precedent: src/video/upload.ts owns upload behavior.

## Plan
- Update \`src/video/upload.ts\` and verify with \`node scripts/video-smoke.js\`.

## Plan Review
- read-only review agent - pass; files and verification are named.

## Evidence

Changed:
- src/video/upload.ts

Verified:
- node scripts/video-smoke.js - passed

Reviewed:
- functionality - pass
- spec-coverage - pass
- code-quality - pass
`);
  write(repo, "src/video/upload.ts", "export function upload() {}\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "multi-slice review without fresh reviewer evidence should warn");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "missing-fresh-review-agent-evidence" && item.severity === "warning"));
}

function testValidateAcceptsMultiSliceFreshReviewAgentEvidence() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/video-mvp
- Current mode: review
- Active slice: auto-strike/initiatives/main/features/video-mvp/slices/slice-0-upload.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/features/video-mvp/feature-spec.md", "# Video MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/features/video-mvp/slices/slice-1-caption.md", `# Slice 1: Caption

## Size
S

## Depends On
- Slice 0: Upload.

## Execution Tasks
- [ ] Research local caption behavior.
- [ ] Write plan with surfaces and checks.
- [ ] Review plan and resolve findings.
- [ ] Verify caption behavior.
`);
  write(repo, "auto-strike/initiatives/main/features/video-mvp/slices/slice-0-upload.md", `# Slice 0: Upload

## Implementation Research
- Local precedent: src/video/upload.ts owns upload behavior.

## Plan
- Update \`src/video/upload.ts\` and verify with \`node scripts/video-smoke.js\`.

## Plan Review
- read-only review agent - pass; files and verification are named.

## Evidence

Changed:
- src/video/upload.ts

Verified:
- node scripts/video-smoke.js - passed

Reviewed:
- read-only review agent, functionality - pass
- fresh-context review, spec-coverage - pass
- independent reviewer, code-quality - pass
`);
  write(repo, "src/video/upload.ts", "export function upload() {}\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "multi-slice review with fresh reviewer evidence should not warn");
  const body = json(result);
  assert.ok(!body.messages.some((item) => item.code === "missing-fresh-review-agent-evidence"));
}

function testValidateWarnsWhenGitChangesMissingFromChangedEvidence() {
  const repo = tempRepo();
  initGit(repo);
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/video-mvp
- Current mode: review
- Active slice: auto-strike/initiatives/main/features/video-mvp/slices/slice-0-upload.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/features/video-mvp/feature-spec.md", "# Video MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/features/video-mvp/slices/slice-0-upload.md", `# Slice 0: Upload

## Implementation Research
- Local precedent: src/video/upload.ts owns upload behavior.

## Plan
- Update \`src/video/upload.ts\` and verify with \`node scripts/video-smoke.js\`.

## Plan Review
- main-agent review - pass; files and verification are named.

## Evidence

Changed:
- src/video/upload.ts

Verified:
- node scripts/video-smoke.js - passed

Reviewed:
- functionality - pass
- spec-coverage - pass
- code-quality - pass
`);
  write(repo, "src/video/upload.ts", "export function upload() {}\n");
  write(repo, "src/video/preview.ts", "export function preview() {}\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "git changed files missing from Changed evidence should warn, not fail");
  const body = json(result);
  const warning = body.messages.find((item) => item.code === "changed-evidence-may-be-stale");
  assert.ok(warning);
  assert.match(warning.message, /src\/video\/preview\.ts/);
  assert.doesNotMatch(warning.message, /auto-strike/);
}

function testValidateWarnsForStaleChangedEvidencePath() {
  const repo = tempRepo();
  initGit(repo);
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/video-mvp
- Current mode: review
- Active slice: auto-strike/initiatives/main/features/video-mvp/slices/slice-0-upload.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/features/video-mvp/feature-spec.md", "# Video MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/features/video-mvp/slices/slice-0-upload.md", `# Slice 0: Upload

## Implementation Research
- Local precedent: src/video/upload.ts owns upload behavior.

## Plan
- Update \`src/video/upload.ts\` and verify with \`node scripts/video-smoke.js\`.

## Plan Review
- main-agent review - pass; files and verification are named.

## Evidence

Changed:
- src/video/missing.ts

Verified:
- node scripts/video-smoke.js - passed

Reviewed:
- functionality - pass
- spec-coverage - pass
- code-quality - pass
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "stale Changed evidence paths should warn, not fail");
  const body = json(result);
  const warning = body.messages.find((item) => item.code === "stale-changed-evidence-path");
  assert.ok(warning);
  assert.match(warning.message, /src\/video\/missing\.ts/);
}

function testReviewPlanDetectsBrowserScriptUiChanges() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/vanilla-ui
- Current mode: review
- Active slice: auto-strike/initiatives/main/features/vanilla-ui/slices/slice-0-click.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/features/vanilla-ui/feature-spec.md", "# Vanilla UI Spec\n");
  write(repo, "auto-strike/initiatives/main/features/vanilla-ui/slices/slice-0-click.md", `# Slice 0: Click

## Evidence

Changed:
- todo/todo.js

Verified:
- node scripts/todo-smoke.js - passed
`);
  write(repo, "todo/todo.js", "document.querySelector('button').addEventListener('click', () => {});\n");

  const result = run(repo, ["review-plan"]);
  assertStatus(result, 0, "review-plan should detect browser-facing JavaScript UI changes");
  const plan = json(result);
  assert.ok(plan.surfaces.ui.includes("todo/todo.js"));
  assert.ok(plan.required.map((item) => item.lens).includes("ui-regression"));
}

function testReviewContextRejectsUnknownLens() {
  const repo = tempRepo();
  const result = run(repo, ["review-context", "--lens", "unknown-lens"]);
  assertStatus(result, 2, "unknown review lens should fail usage");
  assert.match(result.stderr, /Unknown review lens/);
}

function testHelpWorksWithoutCommand() {
  const result = runRaw(["--help"]);
  assertStatus(result, 0, "help should work without a command");
  assert.match(result.stdout, /Usage: auto-strike\.mjs/);
}

testInspectAbsentWorkspace();
testValidateUnrelatedWorkspaceCollision();
testSimpleFeatureSlugDoesNotHardFail();
testValidateRejectsOldTopLevelFeaturePath();
testInitiativeInspectAndValidateWithEvidence();
testValidateWarnsForMissingEvidence();
testValidateBrokenKeyDocReference();
testKeyDocsCanReferenceRepoDocs();
testReviewContextPacket();
testImplementationPlanReviewContext();
testReviewContextScopesChangedFilesToActiveFeature();
testValidateWarnsWhenReviewEvidenceLacksChangedAndVerified();
testValidateWarnsForWeakPreBuildSlicePrep();
testValidateAcceptsConcretePreBuildSlicePrep();
testValidateAcceptsActiveWorkPointer();
testValidateWarnsForMissingActiveWork();
testValidateWarnsForWeakOrMissingActiveWorkDoc();
testValidateWarnsForMissingPhaseLedgerAfterSlicing();
testValidateWarnsForWeakPhaseLedgerAfterSlicing();
testValidateAcceptsPhaseLedgerAfterSlicing();
testValidateWarnsForStaleActiveWorkAfterImplementationEvidence();
testValidateWarnsForMissingReferencedAutoStrikeDoc();
testValidateWarnsForStaleSliceTaskChecklist();
testValidateWarnsForMissingCurrentTruthDocs();
testValidateWarnsForWeakCurrentTruthDocs();
testValidateAcceptsMinimalCurrentTruthDocs();
testValidateWarnsForMissingGrillDecisionDepth();
testValidateAcceptsStandardGrillDecisionDepth();
testValidateAcceptsDeepGrillDecisionDepthWithSuggestedChange();
testValidateWarnsForUnknownGrillDecisionDepth();
testValidateDoesNotRequireDecisionDepthOutsideGrillMode();
testValidateWarnsForMissingGrillBeforeSpecOrSlice();
testValidateAcceptsGrillDecisionCheckpointBeforeSpec();
testValidateWarnsWhenSpecPhaseCreatesSliceArtifacts();
testValidateWarnsForDetailedSlicePlanningInsideSpec();
testValidateAllowsConciseSliceHandoffInsideSpec();
testValidateAcceptsExplicitUserOptOutOfGrill();
testValidateWarnsForPhaseCompletedAfterQuestionToolFailure();
testValidateAcceptsSliceMapDependenciesAndCheckpoint();
testValidateWarnsForMissingSliceMapDependenciesAndCheckpoint();
testValidateWarnsForOversizedBatchedAndWeakNonVerticalSlice();
testValidateWarnsForDuplicateActiveWorkAndStillChecksSlices();
testValidateWarnsForDuplicatePhaseLedgerRowsWithoutFalseSpecSliceBoundary();
testReviewPlanRecommendsUiRegressionForUiChanges();
testUiReviewEvidenceSuppressesUiReviewWarning();
testUiRegressionReviewAloneDoesNotSuppressBrowserWarning();
testCurlLocalhostDoesNotSuppressBrowserWarning();
testPackageOnlyBrowserSkipDoesNotSuppressBrowserWarning();
testValidateWarnsForMissingVerificationCapabilityOnSkippedUiChecks();
testValidateAcceptsVerificationCapabilityForSkippedUiChecks();
testValidateWarnsForMissingSliceCloseoutSummary();
testValidateAcceptsSliceCloseoutSummary();
testValidateDoesNotRequireCloseoutForInProgressBuildSlice();
testValidateWarnsForMissingRequiredReviewLenses();
testValidateAcceptsReviewedAndSkippedRequiredReviewLenses();
testValidateWarnsForSingleSliceWithoutFreshReviewAgentEvidence();
testValidateAcceptsFreshReviewAgentUnavailableRationale();
testValidateWarnsForMultiSliceWithoutFreshReviewAgentEvidence();
testValidateAcceptsMultiSliceFreshReviewAgentEvidence();
testValidateWarnsWhenGitChangesMissingFromChangedEvidence();
testValidateWarnsForStaleChangedEvidencePath();
testReviewPlanDetectsBrowserScriptUiChanges();
testReviewContextRejectsUnknownLens();
testHelpWorksWithoutCommand();

console.log("auto-strike tests passed");
