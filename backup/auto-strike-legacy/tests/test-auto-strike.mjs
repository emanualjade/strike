#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const autoStrikeScript = path.join(root, "skill/auto-strike.mjs");
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

function testSimplePhaseSlugDoesNotHardFail() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: tiny-copy-fix
- Current mode: build
- Doc: auto-strike/initiatives/main/phases/tiny-copy-fix/slices/slice-0-copy.md
- Slice: auto-strike/initiatives/main/phases/tiny-copy-fix/slices/slice-0-copy.md
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
  write(repo, "auto-strike/initiatives/main/phases/tiny-copy-fix/phase-spec.md", "# Tiny Copy Fix Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/tiny-copy-fix/slices/slice-0-copy.md", "# Slice 0: Copy\n");
  write(repo, "auto-strike/todo.md", `# Todo

- [ ] Update button copy.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "simple active phase slug should not hard fail");
  const body = json(result);
  assert.equal(body.activePhase.raw, "tiny-copy-fix");
  assert.equal(body.activePhase.path, "auto-strike/initiatives/main/phases/tiny-copy-fix");
  assert.equal(body.activePhase.inferredPath, "auto-strike/initiatives/main/phases/tiny-copy-fix");
  assert.ok(!body.messages.some((item) => item.code === "missing-active-phase"));
  assert.ok(!body.messages.some((item) => item.code === "missing-key-doc"));
}

function testValidateRejectsOldTopLevelPhasePath() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/phases/legacy-phase
- Current mode: slice
- Next: Fix the phase path.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/idea.md", "# Main Idea\n");
  write(repo, "auto-strike/phases/legacy-phase/spec.md", "# Legacy Spec\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 1, "old top-level phase paths should be rejected");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "invalid-active-phase-path" && item.severity === "error"));
}

function testLegacyFeatureShapeWarnsButStillResolves() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Feature: auto-strike/initiatives/main/features/legacy-phase
- Current mode: build
- Doc: auto-strike/initiatives/main/features/legacy-phase/slices/slice-0-legacy.md
- Slice: auto-strike/initiatives/main/features/legacy-phase/slices/slice-0-legacy.md
- Next: Rename this workspace when convenient.

## Key Docs
- \`auto-strike/initiatives/main/features/legacy-phase/feature-spec.md\` - legacy spec.

## Open Decisions
- None.

## Verification
- Existing evidence.
`);
  write(repo, "auto-strike/initiatives/main/features/legacy-phase/feature-spec.md", "# Legacy Phase Spec\n");
  write(repo, "auto-strike/initiatives/main/features/legacy-phase/slices/slice-0-legacy.md", "# Slice 0: Legacy\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "legacy feature shape should warn but remain readable for one release");
  const body = json(result);
  assert.equal(body.activePhase.path, "auto-strike/initiatives/main/features/legacy-phase");
  assert.equal(body.activePhase.specPath, "auto-strike/initiatives/main/features/legacy-phase/feature-spec.md");
  assert.equal(body.activeFeature.path, body.activePhase.path);
  assert.ok(body.messages.some((item) => item.code === "legacy-active-feature-label" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "legacy-feature-directories" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "legacy-active-feature-path" && item.severity === "warning"));
  assert.ok(!body.messages.some((item) => item.code === "invalid-active-phase-path"));
}

function testInitiativeInspectAndValidateWithEvidence() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/upload-mvp
- Current mode: review
- Active slice: auto-strike/initiatives/main/phases/upload-mvp/slices/slice-0-upload-preview.md
- Next best action: Review slice 0.

## Project State
- Upload preview MVP is implemented.

## Key Docs
- \`auto-strike/initiatives/main/phases/upload-mvp/phase-spec.md\` - product scope.
- \`auto-strike/initiatives/main/phases/upload-mvp/slices/slice-0-upload-preview.md\` - build evidence.

## Open Decisions
- None.

## Verification
- pnpm run test - passed.
`);
  write(repo, "auto-strike/todo.md", `# Todo

- [x] Build upload preview slice.
`);
  write(repo, "auto-strike/initiatives/main/phases/upload-mvp/phase-spec.md", "# Upload MVP Spec\n");
  write(repo, "app/upload/page.tsx", "export default function Page() { return null; }\n");
  write(repo, "auto-strike/initiatives/main/phases/upload-mvp/slices/slice-0-upload-preview.md", `# Slice 0: Upload Preview

## Evidence

Changed:
- app/upload/page.tsx

Verified:
- pnpm run test - passed

Reviewed:
- read-only review subagent - pass; returned findings to main agent for synthesis.
`);

  const inspect = run(repo, ["inspect"]);
  assertStatus(inspect, 0, "inspect should succeed for initiative workspace");
  const inspectBody = json(inspect);
  assert.equal(inspectBody.activePhase.path, "auto-strike/initiatives/main/phases/upload-mvp");
  assert.equal(inspectBody.activePhase.specExists, true);
  assert.equal(inspectBody.activePhase.sliceFiles.length, 1);
  assert.deepEqual(inspectBody.evidence.locations, ["auto-strike/initiatives/main/phases/upload-mvp/slices/slice-0-upload-preview.md"]);
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
- Phase: auto-strike/initiatives/main/phases/search-mvp
- Current mode: review
- Active slice: auto-strike/initiatives/main/phases/search-mvp/slices/slice-0-search.md
- Next: Record review evidence.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/search-mvp/phase-spec.md", "# Search MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/search-mvp/slices/slice-0-search.md", "# Slice 0: Search\n");

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
- Phase: auto-strike/initiatives/main/phases/search-mvp
- Current mode: spec

## Key Docs
- \`auto-strike/initiatives/main/phases/search-mvp/phase-spec.md\` - product scope.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/search-mvp/extras/context.md", "# Context\n");

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
- Phase: None
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

## Mode Tasks
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

function testMarkdownLinksResolveToTargets() {
  const repo = tempRepo();
  write(repo, "README.md", "# Product Notes\n");
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: [Main](auto-strike/initiatives/main)
- Phase: None.
- Current mode: brainstorm
- Doc: [Idea](auto-strike/initiatives/main/idea.md)
- State: Idea is being clarified.
- Next: Grill the durable terminology.
- Blocked by: None.

## Key Docs
- [README](README.md) - product notes.
- [Idea](auto-strike/initiatives/main/idea.md) - active idea.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/idea.md", `# Main Idea

## Mode Tasks
- [x] Capture initial idea.
- [ ] Grill terminology.

## Exit Evidence
- The idea is clear enough to resume.
`);

  const inspect = run(repo, ["inspect"]);
  assertStatus(inspect, 0, "inspect should parse markdown-link targets");
  const inspectBody = json(inspect);
  assert.equal(inspectBody.index.activeInitiativePath, "auto-strike/initiatives/main");
  assert.equal(inspectBody.index.activeWork.docPath, "auto-strike/initiatives/main/idea.md");
  assert.deepEqual(inspectBody.index.keyDocs.map((item) => item.path), [
    "README.md",
    "auto-strike/initiatives/main/idea.md",
  ]);

  const validate = run(repo, ["validate"]);
  assertStatus(validate, 0, "markdown-link key docs should not produce missing-doc errors");
  assert.ok(!json(validate).messages.some((item) => item.code === "missing-key-doc"));
}

function testReviewContextPacket() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/video-mvp
- Current mode: review

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/phase-spec.md", "# Video MVP Spec\n");
  write(repo, "src/video/upload.ts", "export function upload() {}\n");
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-upload.md", `# Slice 0: Upload

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
  assert.match(body.instructions.join("\n"), /read-only review subagent/);
  assert.match(body.instructions.join("\n"), /Do not edit files/);
  assert.ok(body.focus.some((item) => /hostile inputs/i.test(item)));
  assert.ok(body.state.docs.includes("auto-strike/initiatives/main/phases/video-mvp/phase-spec.md"));
  assert.ok(body.state.evidence.changedPaths.includes("src/video/upload.ts"));
  assert.ok(body.sourcePaths.some((group) => group.title === "Changed Files From Active Evidence"));
}

function testImplementationPlanReviewContext() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/video-mvp
- Current mode: slice
- Active slice: auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-upload.md

## Key Docs
- \`auto-strike/initiatives/main/phases/video-mvp/phase-spec.md\` - product scope.
- \`auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-upload.md\` - implementation plan.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/phase-spec.md", "# Video MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-upload.md", `# Slice 0: Upload

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
  assert.ok(activeDocs.paths.includes("auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-upload.md"));
}

function testReviewContextScopesChangedFilesToActivePhase() {
  const repo = tempRepo();
  write(repo, "README.md", "# Dogfood Repo\n");
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/todo-dogfood
- Current mode: review
- Active slice: auto-strike/initiatives/main/phases/todo-dogfood/slices/slice-0-static-todo.md

## Key Docs
- \`README.md\` - repo context.
- \`auto-strike/initiatives/main/phases/todo-dogfood/phase-spec.md\` - active spec.
- \`auto-strike/initiatives/main/phases/todo-dogfood/slices/slice-0-static-todo.md\` - active evidence.
- \`auto-strike/initiatives/main/phases/clip-notes/phase-spec.md\` - completed phase context.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/todo-dogfood/phase-spec.md", "# Todo Dogfood Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/todo-dogfood/slices/slice-0-static-todo.md", `# Slice 0: Static Todo

## Evidence

Changed:
- todo/index.html
- todo/todo.js
- scripts/todo-smoke.js

Verified:
- node scripts/todo-smoke.js - passed
`);
  write(repo, "auto-strike/initiatives/main/phases/clip-notes/phase-spec.md", "# Clip Notes Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/clip-notes/slices/slice-1-review-brief.md", `# Slice 1: Review Brief

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
  assertStatus(result, 0, "review-context should scope changed files to the active phase");
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
- Phase: auto-strike/initiatives/main/phases/search-mvp
- Current mode: review
- Active slice: auto-strike/initiatives/main/phases/search-mvp/slices/slice-0-search.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/search-mvp/phase-spec.md", "# Search MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/search-mvp/slices/slice-0-search.md", `# Slice 0: Search

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
- Phase: auto-strike/initiatives/main/phases/todo-dogfood
- Current mode: build
- Active slice: auto-strike/initiatives/main/phases/todo-dogfood/slices/slice-1-edit-task.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/todo-dogfood/phase-spec.md", "# Todo Dogfood Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/todo-dogfood/slices/slice-1-edit-task.md", `# Slice 1: Edit Task

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
- Phase: auto-strike/initiatives/main/phases/todo-dogfood
- Current mode: build
- Active slice: auto-strike/initiatives/main/phases/todo-dogfood/slices/slice-1-edit-task.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/todo-dogfood/phase-spec.md", "# Todo Dogfood Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/todo-dogfood/slices/slice-1-edit-task.md", `# Slice 1: Edit Task

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
- Phase: None
- Current mode: brainstorm
- Doc: auto-strike/initiatives/main/idea.md
- State: First-outcome decision is being clarified.
- Next: Complete the first-outcome decision.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/idea.md", `# Clip Notes Idea

## Mode Tasks
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

function testValidateWarnsForDocNameAsCurrentMode() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: None
- Current mode: idea
- Doc: auto-strike/initiatives/main/idea.md
- Slice: None
- State: Idea is being shaped.
- Next: Continue brainstorm.
- Blocked by: None.

## Key Docs
- auto-strike/initiatives/main/idea.md - brainstorm packet.

## Open Decisions
- None.

## Verification
- None yet.
`);
  write(repo, "auto-strike/initiatives/main/idea.md", `# Main Idea

## Mode Tasks
- [ ] Capture initial idea.

## Exit Evidence
- Still brainstorming.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "doc names should warn when used as current mode");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "unknown-mode" && item.severity === "warning"));
}

function testValidateWarnsForMissingActiveWork() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: None
- Current mode: brainstorm

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/idea.md", `# Clip Notes Idea

## Mode Tasks
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
- Phase: auto-strike/initiatives/main/phases/clip-notes
- Current mode: spec
- Doc: auto-strike/initiatives/main/phases/clip-notes/phase-spec.md
- State: Spec acceptance checks are being drafted.
- Next: Draft acceptance checks.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(weakRepo, "auto-strike/initiatives/main/phases/clip-notes/phase-spec.md", `# Clip Notes Spec

## Mode Tasks
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
- Phase: None
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

function testValidateErrorsForMissingActiveWorkDocDuringBuild() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/tool-library
- Current mode: build
- Doc: auto-strike/initiatives/main/phases/tool-library/slices/slice-0-foundation.md
- Slice: auto-strike/initiatives/main/phases/tool-library/slices/slice-0-foundation.md
- State: Building the foundation slice.
- Next: Repair missing slice state before continuing build.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/tool-library/phase-spec.md", "# Tool Library Phase\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 1, "missing active build doc should hard fail recovery-sensitive modes");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "missing-active-work-doc" && item.severity === "error"));
  assert.ok(body.messages.some((item) => item.code === "missing-active-slice" && item.severity === "error"));
}

function testValidateErrorsForMissingActivePhaseDuringReview() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: missing-phase
- Current mode: review
- Doc: auto-strike/initiatives/main/review.md
- Slice: None
- State: Reviewing a completed slice.
- Next: Repair missing phase pointer before continuing review.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/review.md", `# Review

## Mode Tasks
- [ ] Scope review.
- [ ] Record findings.

## Exit Evidence
- Review is pending.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 1, "missing active phase should hard fail review recovery-sensitive mode");
  assert.ok(json(result).messages.some((item) => item.code === "missing-active-phase" && item.severity === "error"));
}

function testValidateWarnsForBatchedModeNextAction() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/tool-library
- Phase: None
- Doc: auto-strike/initiatives/tool-library/grill.md
- State: Grill has one open business-rule decision.
- Next: After the answer, close grill, write the spec and phase spec, and slice the build.
- Blocked by: User answer on conflict policy.

## Open Decisions
- Conflict policy.
`);
  write(repo, "auto-strike/initiatives/tool-library/grill.md", `# Tool Library Grill

## Mode Tasks
- [x] Review brainstorm.
- [ ] Resolve conflict policy.

## Exit Evidence
- Pending conflict policy.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "batched phase next action should warn, not fail");
  assert.ok(json(result).messages.some((item) => item.code === "batched-mode-next-action" && item.severity === "warning"));
}

function testValidateWarnsForNextSliceDocAndImplementationBatch() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/tool-library
- Phase: auto-strike/initiatives/tool-library/phases/core
- Current mode: build
- Doc: auto-strike/initiatives/tool-library/phases/core/slices/slice-0-server-boot.md
- Active slice: auto-strike/initiatives/tool-library/phases/core/slices/slice-0-server-boot.md
- State: Slice 0 is closed.
- Next: Write slice-1-json-store.md, add Implementation Research / Plan / Plan Review, then implement and verify.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/tool-library/phases/core/phase-spec.md", "# Core Spec\n");
  write(repo, "auto-strike/initiatives/tool-library/phases/core/slices/slice-0-server-boot.md", `# Slice 0: Server Boot

## Execution Tasks
- [x] Research.
- [x] Plan.
- [x] Review.
- [x] Verify.

## Evidence
Changed:
- \`src/server.mjs\`

Verified:
- \`pnpm smoke\` passed.

Reviewed:
- functionality: passed.
- read-only review subagent - pass; returned findings to main agent for synthesis.

## Closeout Summary
Implemented Slice 0: Server Boot.

Built:
- Server boots.

Validation passed:
- \`pnpm smoke\`

Review:
- functionality: passed.
- read-only review subagent: passed.

Skipped / residual risk:
- None.

Docs:
- This slice doc.

Next:
- Slice 1.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "next-slice doc plus implementation next action should warn, not fail");
  assert.ok(json(result).messages.some((item) => item.code === "batched-mode-next-action" && item.severity === "warning"));
}

function testValidateAcceptsSingleBoundaryNextAction() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/tool-library
- Phase: None
- Doc: auto-strike/initiatives/tool-library/grill.md
- State: Grill has one open business-rule decision.
- Next: After the answer, record the decision, close grill, and leave spec as the next action.
- Blocked by: User answer on conflict policy.

## Open Decisions
- Conflict policy.
`);
  write(repo, "auto-strike/initiatives/tool-library/grill.md", `# Tool Library Grill

## Mode Tasks
- [x] Review brainstorm.
- [ ] Resolve conflict policy.

## Exit Evidence
- Pending conflict policy.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "single boundary next action should not warn");
  assert.ok(!json(result).messages.some((item) => item.code === "batched-mode-next-action"));
}

function writeBuildPhaseFixture(repo, ideaContent) {
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/checklist
- Current mode: build
- Doc: auto-strike/initiatives/main/phases/checklist/slices/slice-0-static-app.md
- State: Slice build is in progress.
- Next: Implement the checklist behavior.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/idea.md", ideaContent);
  write(repo, "auto-strike/initiatives/main/spec.md", "# Checklist Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/checklist/phase-spec.md", "# Checklist Phase Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/checklist/slices/index.md", `# Slices

## Slice Map

| Slice | Size | Depends On | Unblocks | Risk | Verification |
| --- | --- | --- | --- | --- | --- |
| 0. Static app | S | None | First usable checklist | Low | node --check app.js |
`);
  write(repo, "auto-strike/initiatives/main/phases/checklist/slices/slice-0-static-app.md", `# Slice 0: Static App

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

function testValidateWarnsForMissingModeLedgerAfterSlicing() {
  const repo = tempRepo();
  writeBuildPhaseFixture(repo, `# Checklist Idea

## Current Shape
- First useful outcome: local checklist.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "missing mode ledger should warn, not fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "missing-mode-ledger" && item.severity === "warning"));
}

function testValidateWarnsForWeakModeLedgerAfterSlicing() {
  const repo = tempRepo();
  writeBuildPhaseFixture(repo, `# Checklist Idea

## Mode Ledger

| Mode | Status | Artifact | Reason |
| --- | --- | --- | --- |
| Brainstorm | done | \`idea.md\` | First useful outcome is recorded. |
| Grill | pending |  |  |
| Spec | done | \`spec.md\`, \`phases/checklist/phase-spec.md\` | Single phase is sliceable. |
| Slice | done | \`phases/checklist/slices/index.md\` | Slice 0 is selected. |
| Build | in progress | \`phases/checklist/slices/slice-0-static-app.md\` | Active slice is being implemented. |

## Current Shape
- First useful outcome: local checklist.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "weak mode ledger should warn, not fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "weak-mode-ledger" && item.severity === "warning"));
}

function testValidateAcceptsModeLedgerAfterSlicing() {
  const repo = tempRepo();
  writeBuildPhaseFixture(repo, `# Checklist Idea

## Mode Ledger

| Mode | Status | Artifact | Reason |
| --- | --- | --- | --- |
| Brainstorm | done | \`idea.md\` | First useful outcome, user, constraints, and non-goals are recorded. |
| Grill | compressed | \`idea.md\` | Prompt already answered core decisions; no consequential blockers were found. |
| Spec | done | \`spec.md\`, \`phases/checklist/phase-spec.md\` | Single phase is sliceable. |
| Slice | done | \`phases/checklist/slices/index.md\` | Slice 0 is sized, ordered, and dependency-free. |
| Build | in progress | \`phases/checklist/slices/slice-0-static-app.md\` | Active slice is being implemented. |
| Review | pending |  |  |
| Readiness | pending |  |  |

## Current Shape
- First useful outcome: local checklist.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "substantive mode ledger should pass validation");
  const body = json(result);
  assert.ok(!body.messages.some((item) => item.code === "missing-mode-ledger"));
  assert.ok(!body.messages.some((item) => item.code === "weak-mode-ledger"));
}

function testValidateWarnsForLegacyPhaseLedgerName() {
  const repo = tempRepo();
  writeBuildPhaseFixture(repo, `# Checklist Idea

## Phase Ledger

| Phase | Status | Artifact | Reason |
| --- | --- | --- | --- |
| Brainstorm | done | \`idea.md\` | First useful outcome, user, constraints, and non-goals are recorded. |
| Grill | compressed | \`idea.md\` | Prompt already answered core decisions; no consequential blockers were found. |
| Spec | done | \`spec.md\`, \`phases/checklist/phase-spec.md\` | Single phase is sliceable. |
| Slice | done | \`phases/checklist/slices/index.md\` | Slice 0 is sized, ordered, and dependency-free. |
| Build | in progress | \`phases/checklist/slices/slice-0-static-app.md\` | Active slice is being implemented. |

## Current Shape
- First useful outcome: local checklist.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "legacy Phase Ledger heading should warn but remain readable");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "legacy-phase-ledger-name" && item.severity === "warning"));
  assert.ok(!body.messages.some((item) => item.code === "missing-mode-ledger"));
}

function testValidateAcceptsSpecModeLedgerWithFuturePendingRows() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/tool-library
- Current mode: spec
- Doc: auto-strike/initiatives/main/spec.md
- State: Spec is being drafted.
- Next: Finish spec review.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "UBIQUITOUS_LANGUAGE.md", "# Ubiquitous Language\n\n## Tool Library\n- Member: Neighbor using the tool library.\n");
  write(repo, "auto-strike/initiatives/main/decisions.md", "# Decisions\n\n## Stack\nDecision: Use a local server.\n");
  write(repo, "auto-strike/initiatives/main/spec.md", `# Spec

## Mode Tasks
- [x] Draft initiative spec.
- [ ] Review spec before slicing.

## Exit Evidence
- Spec is being drafted from completed grill decisions.
`);
  write(repo, "auto-strike/initiatives/main/phases/tool-library/phase-spec.md", "# Tool Library Spec\n");
  write(repo, "auto-strike/initiatives/main/grill.md", `# Grill

## Decision Depth
Level: Standard
Why: Default.

## Decision Checkpoint
- Scope / size: One local lending workflow.
- Stack / dependencies: Local server with no third-party packages.
- Data / persistence / state: JSON file store.
- Auth / identity / permissions: Name picker with lender ownership checks.
- Validation / browser or live checks: Browser walkthrough plus server smoke check.
- User-confirmed decisions: User confirmed the local prototype scope.
`);
  write(repo, "auto-strike/initiatives/main/idea.md", `# Idea

## Mode Ledger

| Mode | Status | Artifact | Reason |
| --- | --- | --- | --- |
| Brainstorm | done | \`idea.md\` | First useful outcome, user, constraints, and non-goals are recorded. |
| Grill | done | \`grill.md\`, \`decisions.md\` | User-facing grill resolved hardening decisions. |
| Spec | in progress | \`spec.md\`, \`phases/tool-library/phase-spec.md\` | Spec is being drafted. |
| Slice | pending |  |  |
| Build | pending |  |  |
| Review | pending |  |  |
| Readiness | pending |  |  |
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "future pending ledger rows should not weaken active spec mode");
  const body = json(result);
  assert.ok(!body.messages.some((item) => item.code === "weak-mode-ledger"));
}

function testValidateDoesNotInferBuildPrepFromSliceDocAlone() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/tool-library
- Doc: auto-strike/initiatives/main/phases/tool-library/slices/slice-0-server-boot.md
- Slice: auto-strike/initiatives/main/phases/tool-library/slices/slice-0-server-boot.md
- State: Slice planning is done; build is next.
- Next: Build slice 0.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "UBIQUITOUS_LANGUAGE.md", "# Ubiquitous Language\n\n## Tool Library\n- Member: Neighbor using the tool library.\n");
  write(repo, "auto-strike/initiatives/main/decisions.md", "# Decisions\n\n## Stack\nDecision: Use a local server.\n");
  write(repo, "auto-strike/initiatives/main/spec.md", "# Spec\n\n## Summary\nBuild a local tool library.\n");
  write(repo, "auto-strike/initiatives/main/grill.md", `# Grill

## Decision Depth
Level: Standard
Why: Default.

## Decision Checkpoint
- Scope / size: One local lending workflow.
- Stack / dependencies: Local server with no third-party packages.
- Data / persistence / state: JSON file store.
- Auth / identity / permissions: Name picker with lender ownership checks.
- Validation / browser or live checks: Browser walkthrough plus server smoke check.
- User-confirmed decisions: User confirmed the local prototype scope.
`);
  write(repo, "auto-strike/initiatives/main/idea.md", `# Idea

## Mode Ledger

| Mode | Status | Artifact | Reason |
| --- | --- | --- | --- |
| Brainstorm | done | \`idea.md\` | First useful outcome, user, constraints, and non-goals are recorded. |
| Grill | done | \`grill.md\`, \`decisions.md\` | User-facing grill resolved hardening decisions. |
| Spec | done | \`spec.md\`, \`phases/tool-library/phase-spec.md\` | Phase is ready to slice. |
| Slice | done | \`phases/tool-library/slices/index.md\`, \`phases/tool-library/slices/slice-0-server-boot.md\` | Slices are sized and ordered; slice 0 is ready for build. |
| Build | pending |  |  |
`);
  write(repo, "auto-strike/initiatives/main/phases/tool-library/phase-spec.md", "# Tool Library Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/tool-library/slices/index.md", `# Slices

## Slice Map

| Slice | Size | Depends On | Unblocks | Risk | Verification |
| --- | --- | --- | --- | --- | --- |
| 0. server-boot | S | None | JSON store | Low | Server starts |

## Slice Review
- pass - size, dependency order, and verification are clear.

## Exit Evidence
- Phase can enter build one slice at a time without guessing.
`);
  write(repo, "auto-strike/initiatives/main/phases/tool-library/slices/slice-0-server-boot.md", `# Slice 0: Server Boot

## Size
S

## Acceptance Criteria
- [ ] Server starts.
- [ ] Health route responds.
- [ ] Static CSS route responds.

## Depends On
- None.

## Likely Surfaces
- \`src/server.mjs\` - server route boundary.

## Execution Tasks
- [ ] Research Node http behavior.
- [ ] Write plan.
- [ ] Review plan.
- [ ] Verify server boot.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "slice doc without explicit mode should require mode but not infer build prep");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "missing-active-work" && item.severity === "warning"));
  assert.ok(!body.messages.some((item) => item.code === "weak-slice-implementation-research"));
  assert.ok(!body.messages.some((item) => item.code === "weak-slice-plan"));
  assert.ok(!body.messages.some((item) => item.code === "weak-slice-plan-review"));
  assert.ok(!body.messages.some((item) => item.code === "weak-mode-ledger" && /build/i.test(item.message)));
}

function testValidateWarnsForStaleActiveWorkAfterImplementationEvidence() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/tool-library
- Phase: None yet
- Doc: auto-strike/initiatives/tool-library/idea.md
- State: Brainstorm in progress.
- Next: Resolve identity model.
- Blocked by: User decision on identity model.

## Open Decisions
- Identity model.

## Verification
- None yet - no code written.
`);
  write(repo, "UBIQUITOUS_LANGUAGE.md", "# Ubiquitous Language\n\n## Tool Library\n- Member: Neighbor using the app.\n");
  write(repo, "auto-strike/initiatives/tool-library/decisions.md", "# Decisions\n\n## Identity\n- Persona switcher.\n");
  write(repo, "auto-strike/initiatives/tool-library/spec.md", "# Spec\n\n## Overview\n- Build a local tool library.\n");
  write(repo, "auto-strike/initiatives/tool-library/idea.md", `# Idea

## Mode Ledger

| Mode | Status | Artifact | Reason |
| --- | --- | --- | --- |
| Brainstorm | done | \`idea.md\` | Useful outcome captured. |
| Grill | compressed | \`decisions.md\` | Core decisions are recorded. |
| Spec | done | \`spec.md\` | Scope is sliceable. |
| Slice | in progress | \`phases/lending-workflow/slices/index.md\` | Slice map exists. |
| Build | pending |  |  |
| Review | pending |  |  |
| Readiness | pending |  |  |
`);
  write(repo, "auto-strike/initiatives/tool-library/phases/lending-workflow/phase-spec.md", "# Phase Spec\n");
  write(repo, "auto-strike/initiatives/tool-library/phases/lending-workflow/slices/slice-0-foundation.md", `# Slice 0

## Execution Tasks
- [ ] Build the server.

## Evidence

Changed:
- server.js

Verified:
- node --check server.js - passed

Reviewed:
- read-only review subagent - pass; returned findings to main agent for synthesis.
`);
  write(repo, "server.js", "console.log('ok');\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "stale active work should warn, not fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "stale-active-work-mode" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "stale-active-phase-pointer" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "stale-active-slice-pointer" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "stale-index-verification" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "open-decisions-after-implementation" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "weak-mode-ledger" && /build/i.test(item.message)));
}

function testValidateWarnsForStaleFinalIndexState() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/tool-library
- Current mode: readiness (closed)
- Doc: auto-strike/initiatives/main/readiness.md
- Slice: auto-strike/initiatives/main/phases/tool-library/slices/slice-6-final.md (closed)
- State: Initiative complete.
- Next: User can run the app.

## Key Docs
- auto-strike/initiatives/main/readiness.md - final readiness.
- auto-strike/initiatives/main/phases/tool-library/slices/slice-6-final.md - active build target.

## Open Decisions
- None.

## Verification
- Planned later: full request loop.
`);
  write(repo, "auto-strike/initiatives/main/idea.md", `# Idea

## Mode Ledger
| Mode | Status | Artifact | Reason |
| --- | --- | --- | --- |
| Brainstorm | done | \`idea.md\` | Done. |
| Grill | done | \`decisions.md\` | Done. |
| Spec | done | \`spec.md\` | Done. |
| Slice | done | \`slices/index.md\` | Done. |
| Build | done | \`slices/slice-6-final.md\` | Done. |
| Review | done | \`readiness.md\` | Done. |
| Readiness | done | \`readiness.md\` | Done. |
`);
  write(repo, "auto-strike/initiatives/main/readiness.md", `# Readiness

## Mode Tasks
- [x] Run checks.
- [x] Update docs.

## Exit Evidence
- Ready.
`);
  write(repo, "auto-strike/initiatives/main/phases/tool-library/phase-spec.md", "# Phase Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/tool-library/slices/slice-6-final.md", `# Slice 6: Final

## Evidence
Changed:
- src/app.js

Verified:
- pnpm smoke - passed

Reviewed:
- read-only review subagent - passed
`);
  write(repo, "src/app.js", "export {};\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "closed readiness with stale index should warn");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "stale-final-index-state" && item.severity === "warning"));
}

function testValidateWarnsForMissingReferencedAutoStrikeDoc() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/checklist
- Current mode: review
- Active slice: auto-strike/initiatives/main/phases/checklist/slices/slice-0-static-app.md

## Open Decisions
- None.
`);
  write(repo, "UBIQUITOUS_LANGUAGE.md", "# Ubiquitous Language\n\n## Checklist\n- Item: A task.\n");
  write(repo, "auto-strike/initiatives/main/decisions.md", "# Decisions\n\n## Scope\n- Local checklist.\n");
  write(repo, "auto-strike/initiatives/main/spec.md", "# Spec\n\n## Overview\n- Local checklist.\n");
  write(repo, "auto-strike/initiatives/main/phases/checklist/phase-spec.md", "# Checklist Phase Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/checklist/slices/slice-0-static-app.md", `# Slice 0

## Evidence

Changed:
- app.js

Verified:
- node --check app.js - passed

Reviewed:
- See auto-strike/initiatives/main/readiness.md review findings.
- read-only review subagent - pass; returned findings to main agent for synthesis.
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
- Phase: auto-strike/initiatives/main/phases/checklist
- Current mode: review
- Active slice: auto-strike/initiatives/main/phases/checklist/slices/slice-0-static-app.md

## Open Decisions
- None.
`);
  write(repo, "UBIQUITOUS_LANGUAGE.md", "# Ubiquitous Language\n\n## Checklist\n- Item: A task.\n");
  write(repo, "auto-strike/initiatives/main/decisions.md", "# Decisions\n\n## Scope\n- Local checklist.\n");
  write(repo, "auto-strike/initiatives/main/spec.md", "# Spec\n\n## Overview\n- Local checklist.\n");
  write(repo, "auto-strike/initiatives/main/phases/checklist/phase-spec.md", "# Checklist Phase Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/checklist/slices/slice-0-static-app.md", `# Slice 0

## Execution Tasks
- [ ] Build the server.
- [ ] Verify the server.

## Evidence

Changed:
- server.js

Verified:
- node --check server.js - passed

Reviewed:
- read-only review subagent - pass; returned findings to main agent for synthesis.
`);
  write(repo, "server.js", "console.log('ok');\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "stale slice task checklists should warn, not fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "stale-slice-task-checklist" && item.severity === "warning"));
}

function testValidateAllowsMissingRootLanguage() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: None
- Doc: auto-strike/initiatives/main/idea.md
- State: Brainstorm is starting.
- Next: Capture the first useful outcome.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/idea.md", `# Main Idea

## Mode Tasks
- [x] Capture first useful outcome.
- [ ] Record current truth.

## Exit Evidence
- First useful outcome is clear enough to continue.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "missing root language should not warn by itself");
  const body = json(result);
  assert.ok(!body.messages.some((item) => item.code === "missing-root-language"));
  assert.ok(!body.messages.some((item) => item.code === "weak-root-language"));
  assert.ok(body.messages.some((item) => item.code === "missing-initiative-decisions" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "missing-initiative-spec" && item.severity === "warning"));
}

function testValidateWarnsForWeakCurrentTruthDocs() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: None
- Doc: auto-strike/initiatives/main/idea.md
- State: Brainstorm is starting.
- Next: Capture the first useful outcome.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "UBIQUITOUS_LANGUAGE.md", "# Ubiquitous Language\n");
  write(repo, "auto-strike/initiatives/main/decisions.md", "# Main Decisions\n");
  write(repo, "auto-strike/initiatives/main/spec.md", "# Main Spec\n");
  write(repo, "auto-strike/initiatives/main/idea.md", `# Main Idea

## Mode Tasks
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
- Phase: None
- Doc: auto-strike/initiatives/main/idea.md
- State: Brainstorm is starting.
- Next: Capture the first useful outcome.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "UBIQUITOUS_LANGUAGE.md", `# Ubiquitous Language

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

## Mode Tasks
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
- Phase: None
- Doc: auto-strike/initiatives/main/grill.md
- State: Product workflow decisions are being pressure-tested.
- Next: Resolve the active decision node.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/grill.md", `# Bookings Grill

## Mode Tasks
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
- Phase: None
- Doc: auto-strike/initiatives/main/grill.md
- State: Product workflow decisions are being pressure-tested.
- Next: Resolve the active decision node.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/grill.md", `# Bookings Grill

## Mode Tasks
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
- Phase: None
- Doc: auto-strike/initiatives/main/grill.md
- State: Payment decisions are being pressure-tested.
- Next: Resolve payment failure behavior.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/grill.md", `# Payments Grill

## Mode Tasks
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
- Phase: None
- Doc: auto-strike/initiatives/main/grill.md
- State: Product workflow decisions are being pressure-tested.
- Next: Resolve the active decision node.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/grill.md", `# Bookings Grill

## Mode Tasks
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

function testValidateRequiresDecisionDepthAfterGrillMode() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: None
- Doc: auto-strike/initiatives/main/spec.md
- State: Spec is being drafted from grill decisions.
- Next: Draft acceptance criteria.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/spec.md", `# Bookings Spec

## Mode Tasks
- [x] Preserve grill decisions.
- [ ] Draft acceptance criteria.

## Exit Evidence
- Spec is being drafted.
`);
  write(repo, "auto-strike/initiatives/main/grill.md", `# Bookings Grill

## Mode Tasks
- [x] Review the brainstorm handoff and repo context.
- [x] Resolve the active decision node.

## Exit Evidence
- Grill moved to spec before decision depth existed.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "later phases should still require recorded grill decision depth");
  const body = json(result);
  assert.equal(body.index.currentMode, "spec");
  assert.ok(body.messages.some((item) => item.code === "missing-grill-decision-depth" && item.severity === "warning"));
  assert.ok(!body.messages.some((item) => item.code === "unknown-grill-decision-depth"));
}

function testValidateWarnsForMissingGrillBeforeSpecOrSlice() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/tool-library
- Doc: auto-strike/initiatives/main/phases/tool-library/phase-spec.md
- State: Phase has been specced and is being sliced.
- Next: Slice the phase.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "UBIQUITOUS_LANGUAGE.md", "# Ubiquitous Language\n\n## Tool Library\n- Member: Neighbor using the tool library.\n");
  write(repo, "auto-strike/initiatives/main/decisions.md", "# Decisions\n\n## Status\n- Tool-library decisions are being recorded.\n");
  write(repo, "auto-strike/initiatives/main/spec.md", "# Spec\n\n## Summary\nBuild a local tool library.\n");
  write(repo, "auto-strike/initiatives/main/idea.md", `# Idea

## Mode Ledger

| Mode | Status | Artifact | Reason |
| --- | --- | --- | --- |
| Brainstorm | done | \`idea.md\` | First useful outcome, user, constraints, and non-goals are recorded. |
| Grill | done | \`idea.md\` | Agent inferred decisions from the prompt. |
| Spec | done | \`spec.md\`, \`phases/tool-library/phase-spec.md\` | Phase is ready to slice. |
| Slice | in progress | \`phases/tool-library/slices/index.md\` | Slice plan is being drafted. |
| Build | pending |  |  |
| Review | pending |  |  |
| Readiness | pending |  |  |
`);
  write(repo, "auto-strike/initiatives/main/phases/tool-library/phase-spec.md", "# Tool Library Spec\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "missing real grill artifact should warn, not fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "missing-initiative-grill" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "mode-completed-by-inference" && item.severity === "warning"));
}

function testValidateAcceptsGrillDecisionCheckpointBeforeSpec() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: None
- Doc: auto-strike/initiatives/main/spec.md
- State: Spec is being drafted from grill decisions.
- Next: Draft the phase map.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "UBIQUITOUS_LANGUAGE.md", "# Ubiquitous Language\n\n## Tool Library\n- Member: Neighbor using the tool library.\n");
  write(repo, "auto-strike/initiatives/main/decisions.md", "# Decisions\n\n## Stack\nDecision: Use vanilla HTML and a tiny local server.\n");
  write(repo, "auto-strike/initiatives/main/spec.md", "# Spec\n\n## Summary\nBuild a local tool library.\n");
  write(repo, "auto-strike/initiatives/main/idea.md", `# Idea

## Mode Ledger

| Mode | Status | Artifact | Reason |
| --- | --- | --- | --- |
| Brainstorm | done | \`idea.md\` | First useful outcome, user, constraints, and non-goals are recorded. |
| Grill | done | \`grill.md\`, \`decisions.md\` | User-facing grill resolved hardening decisions. |
| Spec | in progress | \`spec.md\` | Spec is being drafted. |
`);
  write(repo, "auto-strike/initiatives/main/grill.md", `# Tool Library Grill

## Mode Tasks
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
- Phase split / non-goals: Listing, browsing, request, pickup, return; no payments or messaging.
- Validation / browser or live checks: Browser walkthrough plus server smoke check; date windows require \`start <= end\`.
- User-confirmed decisions: User accepted local prototype constraints in grill.
- Accepted assumptions: Dates can be simple ISO date inputs.
- Deferred decisions: Real auth and notifications.

## Exit Evidence
- Scope, stack, persistence, identity, phase split, and validation are explicit enough to spec.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "grill decision checkpoint should satisfy spec-stage validation");
  const body = json(result);
  assert.ok(!body.messages.some((item) => item.code === "missing-initiative-grill"));
  assert.ok(!body.messages.some((item) => item.code === "missing-grill-decision-checkpoint"));
  assert.ok(!body.messages.some((item) => item.code === "weak-grill-decision-checkpoint"));
}

function testValidateWarnsForToolingConstraintRuntimeConflict() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: None
- Current mode: spec
- Doc: auto-strike/initiatives/main/spec.md
- State: Spec is being drafted.
- Next: Draft the phase map.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/idea.md", `# Idea

## Current Shape
- Constraint: Do not use npm or npx; use pnpm only if a package command is needed.

## Mode Ledger
| Mode | Status | Artifact | Reason |
| --- | --- | --- | --- |
| Brainstorm | done | \`idea.md\` | First useful outcome and constraints are recorded. |
| Grill | done | \`grill.md\`, \`decisions.md\` | User-facing grill resolved hardening decisions. |
| Spec | in progress | \`spec.md\` | Spec is being drafted. |
`);
  write(repo, "auto-strike/initiatives/main/grill.md", `# Grill

## Decision Depth
Level: Standard
Why: Default.

## Decision Checkpoint
- Scope / size: Small local web app.
- Stack / dependencies / tooling constraints: Python 3 stdlib, no package commands.
- Data / persistence / state: JSON file.
- Auth / identity / permissions: Name-only personas.
- Validation / browser or live checks: Browser walkthrough plus checks.
- User-confirmed decisions: User gave pnpm-only package constraint.
- Accepted assumptions: None.

## Exit Evidence
- Decisions are recorded.
`);
  write(repo, "auto-strike/initiatives/main/decisions.md", `# Decisions

## Stack
Decision: Use Python 3 stdlib because it avoids npm, npx, and pnpm package installs.
`);
  write(repo, "auto-strike/initiatives/main/spec.md", "# Spec\n\n## Summary\nBuild the local app.\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "runtime conflict with pnpm/no-npm constraint should warn, not fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "possible-tooling-constraint-runtime-conflict" && item.severity === "warning"));
}

function testValidateWarnsWhenSpecModeCreatesSliceArtifacts() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/tool-library
- Current mode: spec
- Doc: auto-strike/initiatives/main/phases/tool-library/phase-spec.md
- State: Spec is being drafted.
- Next: Finish spec review.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "UBIQUITOUS_LANGUAGE.md", "# Ubiquitous Language\n\n## Tool Library\n- Member: Neighbor using the tool library.\n");
  write(repo, "auto-strike/initiatives/main/decisions.md", "# Decisions\n\n## Stack\nDecision: Use a local server.\n");
  write(repo, "auto-strike/initiatives/main/grill.md", `# Grill

## Decision Checkpoint
- Scope / size: One phase.
- Stack / dependencies: Local app.
- Data / persistence / state: SQLite.
- Auth / identity / permissions: Seed members.
- Validation / browser or live checks: Manual browser check.
- User-confirmed decisions: User confirmed defaults.
`);
  write(repo, "auto-strike/initiatives/main/idea.md", `# Idea

## Mode Ledger

| Mode | Status | Artifact | Reason |
| --- | --- | --- | --- |
| Brainstorm | done | \`idea.md\` | First useful outcome, user, constraints, and non-goals are recorded. |
| Grill | done | \`grill.md\`, \`decisions.md\` | User-facing grill resolved hardening decisions. |
| Spec | in progress | \`spec.md\`, \`phases/tool-library/phase-spec.md\` | Spec is being drafted. |
| Slice | pending |  |  |
`);
  write(repo, "auto-strike/initiatives/main/spec.md", "# Spec\n\n## Summary\nBuild a local tool library.\n");
  write(repo, "auto-strike/initiatives/main/phases/tool-library/phase-spec.md", `# Tool Library Spec

## Summary
Build the core tool library.

## Slice Handoff
- Slice next after spec is reviewed.
`);
  write(repo, "auto-strike/initiatives/main/phases/tool-library/slices/index.md", `# Slices

## Slice Map

| Slice | Size | Depends On | Unblocks | Risk | Verification |
| --- | --- | --- | --- | --- | --- |
| 0. Setup | S | None | Tool listing | High | App starts |
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "slice artifacts during spec should warn, not fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "spec-mode-created-slice-artifacts" && item.severity === "warning"));
}

function testValidateWarnsForDetailedSlicePlanningInsideSpec() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/tool-library
- Current mode: spec
- Doc: auto-strike/initiatives/main/phases/tool-library/phase-spec.md
- State: Spec is being drafted.
- Next: Finish spec review.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "UBIQUITOUS_LANGUAGE.md", "# Ubiquitous Language\n\n## Tool Library\n- Member: Neighbor using the tool library.\n");
  write(repo, "auto-strike/initiatives/main/decisions.md", "# Decisions\n\n## Stack\nDecision: Use a local server.\n");
  write(repo, "auto-strike/initiatives/main/grill.md", `# Grill

## Decision Checkpoint
- Scope / size: One phase.
- Stack / dependencies: Local app.
- Data / persistence / state: SQLite.
- Auth / identity / permissions: Seed members.
- Validation / browser or live checks: Manual browser check.
- User-confirmed decisions: User confirmed defaults.
`);
  write(repo, "auto-strike/initiatives/main/idea.md", `# Idea

## Mode Ledger

| Mode | Status | Artifact | Reason |
| --- | --- | --- | --- |
| Brainstorm | done | \`idea.md\` | First useful outcome, user, constraints, and non-goals are recorded. |
| Grill | done | \`grill.md\`, \`decisions.md\` | User-facing grill resolved hardening decisions. |
| Spec | in progress | \`spec.md\`, \`phases/tool-library/phase-spec.md\` | Spec is being drafted. |
`);
  write(repo, "auto-strike/initiatives/main/spec.md", "# Spec\n\n## Summary\nBuild a local tool library.\n");
  write(repo, "auto-strike/initiatives/main/phases/tool-library/phase-spec.md", `# Tool Library Spec

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
- Phase: auto-strike/initiatives/main/phases/tool-library
- Current mode: spec
- Doc: auto-strike/initiatives/main/phases/tool-library/phase-spec.md
- State: Spec is being drafted.
- Next: Finish spec review.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "UBIQUITOUS_LANGUAGE.md", "# Ubiquitous Language\n\n## Tool Library\n- Member: Neighbor using the tool library.\n");
  write(repo, "auto-strike/initiatives/main/decisions.md", "# Decisions\n\n## Stack\nDecision: Use a local server.\n");
  write(repo, "auto-strike/initiatives/main/grill.md", `# Grill

## Decision Checkpoint
- Scope / size: One phase.
- Stack / dependencies: Local app.
- Data / persistence / state: SQLite.
- Auth / identity / permissions: Seed members.
- Validation / browser or live checks: Manual browser check.
- User-confirmed decisions: User confirmed defaults.
`);
  write(repo, "auto-strike/initiatives/main/idea.md", `# Idea

## Mode Ledger

| Mode | Status | Artifact | Reason |
| --- | --- | --- | --- |
| Brainstorm | done | \`idea.md\` | First useful outcome, user, constraints, and non-goals are recorded. |
| Grill | done | \`grill.md\`, \`decisions.md\` | User-facing grill resolved hardening decisions. |
| Spec | in progress | \`spec.md\`, \`phases/tool-library/phase-spec.md\` | Spec is being drafted. |
`);
  write(repo, "auto-strike/initiatives/main/spec.md", "# Spec\n\n## Summary\nBuild a local tool library.\n");
  write(repo, "auto-strike/initiatives/main/phases/tool-library/phase-spec.md", `# Tool Library Spec

## Summary
Build the core tool library.

## Slice Handoff
- Start by slicing the smallest runnable setup path, then the first tool-listing behavior.
- Keep lifecycle risk early and verify each slice.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "concise slice handoff inside spec should be allowed");
  const body = json(result);
  assert.ok(!body.messages.some((item) => item.code === "spec-mode-created-slice-artifacts"));
  assert.ok(!body.messages.some((item) => item.code === "detailed-slice-planning-in-spec"));
}

function testValidateWarnsForDetailedSliceHandoffAfterSpecIsMarkedDone() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/tool-library
- Current mode: build
- Active slice: auto-strike/initiatives/main/phases/tool-library/slices/slice-0-scaffold.md

## Open Decisions
- None.
`);
  write(repo, "UBIQUITOUS_LANGUAGE.md", "# Ubiquitous Language\n\n## Tool Library\n- Member: Neighbor using the tool library.\n");
  write(repo, "auto-strike/initiatives/main/decisions.md", "# Decisions\n\n## Stack\nDecision: Use a local server.\n");
  write(repo, "auto-strike/initiatives/main/grill.md", `# Grill

## Decision Depth
Level: Standard
Why: Default.

## Decision Checkpoint
- Scope / size: One phase.
- Stack / dependencies: Local app.
- Data / persistence / state: JSON file.
- Auth / identity / permissions: Seed members.
- Validation / browser or live checks: Manual browser check.
- User-confirmed decisions: User confirmed defaults.
`);
  write(repo, "auto-strike/initiatives/main/idea.md", `# Idea

## Mode Ledger

| Mode | Status | Artifact | Reason |
| --- | --- | --- | --- |
| Brainstorm | done | \`idea.md\` | First useful outcome, user, constraints, and non-goals are recorded. |
| Grill | done | \`grill.md\`, \`decisions.md\` | User-facing grill resolved hardening decisions. |
| Spec | done | \`spec.md\`, \`phases/tool-library/phase-spec.md\` | Spec is ready to slice. |
| Slice | done | \`phases/tool-library/slices/index.md\` | Slice plan is ready. |
| Build | in progress | \`phases/tool-library/slices/slice-0-scaffold.md\` | Build started. |
`);
  write(repo, "auto-strike/initiatives/main/spec.md", `# Spec

## Summary
Build a local tool library.

## Spec Review
- pass - scope and phase boundary are clear.

## Exit Evidence
- Spec can be sliced without guessing.
`);
  write(repo, "auto-strike/initiatives/main/phases/tool-library/phase-spec.md", `# Tool Library Spec

## Summary
Build the core tool library.

## Slice Handoff
- Three slices planned (see \`phases/tool-library/slices/index.md\`):
  - Slice 0: scaffold and identity.
  - Slice 1: tool listings.
  - Slice 2: borrow lifecycle.

## Spec Review
- pass - phase behavior is clear.

## Exit Evidence
- Phase can be sliced without guessing.
`);
  write(repo, "auto-strike/initiatives/main/phases/tool-library/slices/index.md", `# Slices

## Slice Map

| Slice | Size | Depends On | Unblocks | Risk | Verification |
| --- | --- | --- | --- | --- | --- |
| 0. scaffold | S | None | 1 | Low | App starts |

## Slice Review
- pass - slices are small enough.

## Exit Evidence
- Build can start with slice 0.
`);
  write(repo, "auto-strike/initiatives/main/phases/tool-library/slices/slice-0-scaffold.md", `# Slice 0: Scaffold

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
  assertStatus(result, 0, "over-detailed handoff should warn even after spec is marked done");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "slice-handoff-too-detailed" && item.severity === "warning"));
}

function testValidateWarnsForMissingModeExitGatesBeforeBuild() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/tool-library
- Current mode: build
- Active slice: auto-strike/initiatives/main/phases/tool-library/slices/slice-0-scaffold.md

## Open Decisions
- None.
`);
  write(repo, "UBIQUITOUS_LANGUAGE.md", "# Ubiquitous Language\n\n## Tool Library\n- Member: Neighbor using the tool library.\n");
  write(repo, "auto-strike/initiatives/main/decisions.md", "# Decisions\n\n## Stack\nDecision: Use a local server.\n");
  write(repo, "auto-strike/initiatives/main/grill.md", `# Grill

## Decision Depth
Level: Standard
Why: Default.

## Decision Checkpoint
- Scope / size: One phase.
- Stack / dependencies: Local app.
- Data / persistence / state: JSON file.
- Auth / identity / permissions: Seed members.
- Validation / browser or live checks: Manual browser check.
- User-confirmed decisions: User confirmed defaults.
`);
  write(repo, "auto-strike/initiatives/main/idea.md", `# Idea

## Mode Ledger

| Mode | Status | Artifact | Reason |
| --- | --- | --- | --- |
| Brainstorm | done | \`idea.md\` | First useful outcome, user, constraints, and non-goals are recorded. |
| Grill | done | \`grill.md\`, \`decisions.md\` | User-facing grill resolved hardening decisions. |
| Spec | done | \`spec.md\`, \`phases/tool-library/phase-spec.md\` | Spec is ready. |
| Slice | done | \`phases/tool-library/slices/index.md\` | Slices are ready. |
| Build | in progress | \`phases/tool-library/slices/slice-0-scaffold.md\` | Build started. |
`);
  write(repo, "auto-strike/initiatives/main/spec.md", "# Spec\n\n## Summary\nBuild a local tool library.\n");
  write(repo, "auto-strike/initiatives/main/phases/tool-library/phase-spec.md", "# Tool Library Spec\n\n## Summary\nBuild the core tool library.\n");
  write(repo, "auto-strike/initiatives/main/phases/tool-library/slices/index.md", `# Slices

## Slice Map

| Slice | Size | Depends On | Unblocks | Risk | Verification |
| --- | --- | --- | --- | --- | --- |
| 0. scaffold | S | None | 1 | Low | App starts |
`);
  write(repo, "auto-strike/initiatives/main/phases/tool-library/slices/slice-0-scaffold.md", `# Slice 0: Scaffold

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
  assertStatus(result, 0, "missing phase exit gates should warn, not fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "missing-spec-review" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "missing-spec-exit-evidence" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "missing-slice-review" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "missing-slice-exit-evidence" && item.severity === "warning"));
}

function testValidateAcceptsExplicitUserOptOutOfGrill() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/tool-library
- Doc: auto-strike/initiatives/main/phases/tool-library/phase-spec.md
- State: User asked to skip grill and move along to implementation planning.
- Next: Slice the phase.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "UBIQUITOUS_LANGUAGE.md", "# Ubiquitous Language\n\n## Tool Library\n- Member: Neighbor using the tool library.\n");
  write(repo, "auto-strike/initiatives/main/decisions.md", "# Decisions\n\n## Status\n- User asked the agent to proceed with assumptions.\n");
  write(repo, "auto-strike/initiatives/main/spec.md", "# Spec\n\n## Summary\nBuild a local tool library.\n");
  write(repo, "auto-strike/initiatives/main/idea.md", `# Idea

## Mode Ledger

| Mode | Status | Artifact | Reason |
| --- | --- | --- | --- |
| Brainstorm | done | \`idea.md\` | First useful outcome, user, constraints, and non-goals are recorded. |
| Grill | skipped | \`idea.md\`, \`decisions.md\` | User explicitly asked to skip grill and move along; assumptions are recorded. |
| Spec | done | \`spec.md\`, \`phases/tool-library/phase-spec.md\` | Phase is ready to slice. |
| Slice | in progress | \`phases/tool-library/slices/index.md\` | Slice plan is being drafted. |
`);
  write(repo, "auto-strike/initiatives/main/phases/tool-library/phase-spec.md", "# Tool Library Spec\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "explicit user opt-out should not require grill artifact");
  const body = json(result);
  assert.ok(!body.messages.some((item) => item.code === "missing-initiative-grill"));
  assert.ok(!body.messages.some((item) => item.code === "missing-grill-decision-checkpoint"));
}

function testValidateWarnsForModeCompletedAfterQuestionToolFailure() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/tool-library
- Doc: auto-strike/initiatives/main/phases/tool-library/slices/slice-0-static-app.md
- State: Slice planning has started.
- Next: Build the first slice.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "UBIQUITOUS_LANGUAGE.md", "# Ubiquitous Language\n\n## Tool Library\n- Member: Neighbor using the tool library.\n");
  write(repo, "auto-strike/initiatives/main/decisions.md", "# Decisions\n\n## Identity\nDecision: Pre-seeded picker.\n");
  write(repo, "auto-strike/initiatives/main/spec.md", "# Spec\n\n## Summary\nBuild a local tool library.\n");
  write(repo, "auto-strike/initiatives/main/idea.md", `# Idea

## Mode Ledger

| Mode | Status | Artifact | Reason |
| --- | --- | --- | --- |
| Brainstorm | done | \`idea.md\` | First useful outcome, user, constraints, and non-goals are recorded. |
| Grill | compressed | \`grill.md\`, \`decisions.md\` | AskUserQuestion returned "Answer questions?", so the agent picked defaults and proceeded. |
| Spec | done | \`spec.md\`, \`phases/tool-library/phase-spec.md\` | Phase is ready to slice. |
| Slice | in progress | \`phases/tool-library/slices/index.md\` | Slice plan is being drafted. |
`);
  write(repo, "auto-strike/initiatives/main/grill.md", `# Grill

## Decision Checkpoint
- Scope / size: local first version.
- Stack / dependencies: no packages.
- Data / persistence / state: JSON file.
- Auth / identity / permissions: pre-seeded picker.
- Phase split / non-goals: one phase, no auth.
- Validation / browser or live checks: browser walkthrough.
- Accepted assumptions: Chosen after question tool failure.
`);
  write(repo, "auto-strike/initiatives/main/phases/tool-library/phase-spec.md", "# Tool Library Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/tool-library/slices/slice-0-static-app.md", `# Slice 0: Static App

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
  assert.ok(body.messages.some((item) => item.code === "mode-completed-after-question-tool-failure" && item.severity === "warning"));
}

function testValidateAcceptsSliceMapDependenciesAndCheckpoint() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/auth-mvp
- Current mode: slice
- Active slice: auto-strike/initiatives/main/phases/auth-mvp/slices/slice-1-register-user.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/auth-mvp/phase-spec.md", "# Auth MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/auth-mvp/slices/index.md", `# Slices

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
  write(repo, "auto-strike/initiatives/main/phases/auth-mvp/slices/slice-0-session-baseline.md", `# Slice 0: Session Baseline

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
  write(repo, "auto-strike/initiatives/main/phases/auth-mvp/slices/slice-1-register-user.md", `# Slice 1: Register User

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
  write(repo, "auto-strike/initiatives/main/phases/auth-mvp/slices/slice-2-login-user.md", `# Slice 2: Login User

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

function testValidateAllowsAndSliceTitleWithSmallRationale() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/tool-library
- Current mode: slice
- Active slice: auto-strike/initiatives/main/phases/tool-library/slices/slice-0-borrow-request-and-approval.md
- Next: Build slice 0.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/tool-library/phase-spec.md", "# Tool Library Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/tool-library/slices/slice-0-borrow-request-and-approval.md", `# Slice 0: Borrow Request and Approval

## Size
M

## Acceptance Criteria
- [ ] Borrower can request a listed tool.
- [ ] Owner can approve the pending request.
- [ ] Conflicting requests show a useful error.

## Why This Slice Exists
Request creation and owner approval are one small behavior path because approval cannot be verified without a request to approve.

## Depends On
- None

## Likely Surfaces
- \`src/domain/requests.mjs\` - request and approval state
- \`src/server.mjs\` - form routes
- \`scripts/smoke.mjs\` - request and approval checks

## Execution Tasks
- [ ] Research local request patterns.
- [ ] Write the implementation plan with surfaces and checks.
- [ ] Review the plan before coding.
- [ ] Verify request and approval behavior.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "small and-titled behavior slice with rationale should validate");
  const body = json(result);
  assert.ok(!body.messages.some((item) => item.code === "batched-slice-title"));
}

function testValidateWarnsForMissingSliceMapDependenciesAndCheckpoint() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/auth-mvp
- Current mode: slice

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/auth-mvp/phase-spec.md", "# Auth MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/auth-mvp/slices/slice-0-session.md", `# Slice 0: Session

## Size
S

## Depends On
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/auth-mvp/slices/slice-1-register.md", `# Slice 1: Register

## Size
M
`);
  write(repo, "auto-strike/initiatives/main/phases/auth-mvp/slices/slice-2-login.md", `# Slice 2: Login

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
- Phase: auto-strike/initiatives/main/phases/auth-mvp
- Current mode: slice

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/auth-mvp/phase-spec.md", "# Auth MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/auth-mvp/slices/slice-0-full-mvp.md", `# Slice 0: Full MVP Setup Frontend and Backend

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

function testValidateRequiresWhyNotSplitForLargeSlice() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/tool-library
- Current mode: slice
- Active slice: auto-strike/initiatives/main/phases/tool-library/slices/slice-1-tools.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/tool-library/phase-spec.md", "# Tool Library Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/tool-library/slices/slice-1-tools.md", `# Slice 1: Tools

## Size
L

## Acceptance Criteria
- Tools can be listed.

## Depends On
- None.

## Likely Surfaces
- \`src/routes/tools.js\`
- \`src/routes/pages.js\`
- \`src/store.js\`
- \`src/smoke.js\`

## Execution Tasks
- [ ] Research nearby patterns.
- [ ] Write plan.
- [ ] Review plan.
- [ ] Verify checks.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "large slice missing why-not-split should warn");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "missing-why-not-split" && item.severity === "warning"));
}

function testValidateWarnsForBroadStackSliceWithoutStrongWhyNotSplit() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/tool-library
- Current mode: slice
- Active slice: auto-strike/initiatives/main/phases/tool-library/slices/slice-1-tools.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/tool-library/phase-spec.md", "# Tool Library Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/tool-library/slices/slice-1-tools.md", `# Slice 1: Tools

## Size
M

## Acceptance Criteria
- Tool listing flow works.

## Depends On
- None.

## Likely Surfaces
- \`src/routes/pages.js\` - UI page and form.
- \`src/routes/tools.js\` - route handler.
- \`src/store.js\` - persisted state.
- \`src/smoke.js\` - smoke tests.

## Execution Tasks
- [ ] Research nearby patterns.
- [ ] Write plan.
- [ ] Review plan.
- [ ] Verify checks.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "broad stack slice without strong why-not-split should warn");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "broad-stack-slice-needs-split" && item.severity === "warning"));
}

function testValidateAcceptsBroadStackSliceWithStrongWhyNotSplit() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/tool-library
- Current mode: slice
- Active slice: auto-strike/initiatives/main/phases/tool-library/slices/slice-1-tools.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/tool-library/phase-spec.md", "# Tool Library Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/tool-library/slices/slice-1-tools.md", `# Slice 1: Tools

## Size
M

## Acceptance Criteria
- Tool listing flow works.

## Depends On
- None.

## Likely Surfaces
- \`src/routes/pages.js\` - UI page and form.
- \`src/routes/tools.js\` - route handler.
- \`src/store.js\` - persisted state.
- \`src/smoke.js\` - smoke tests.

## Why Not Split
This is one behavior and cannot work smaller: the form, route, persisted write,
and smoke check must land together to make one observable listing flow.

## Execution Tasks
- [ ] Research nearby patterns.
- [ ] Write plan.
- [ ] Review plan.
- [ ] Verify checks.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "strong why-not-split should satisfy broad-stack warning");
  const body = json(result);
  assert.ok(!body.messages.some((item) => item.code === "broad-stack-slice-needs-split"));
}

function testValidateWarnsForDuplicateActiveWorkAndStillChecksSlices() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: None
- Phase: auto-strike/initiatives/main/phases/tool-library
- Doc: auto-strike/initiatives/main/phases/tool-library/slices/index.md
- Slice: None
- State: Slice map written.
- Next: Build slice 0.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "UBIQUITOUS_LANGUAGE.md", "# Ubiquitous Language\n\n## Tool Library\n- Tool means borrowable item.\n");
  write(repo, "auto-strike/initiatives/main/decisions.md", "# Decisions\n\n## Status\n- Decided.\n");
  write(repo, "auto-strike/initiatives/main/idea.md", `# Main Idea

## Mode Ledger
| Mode | Status | Artifact | Reason |
| --- | --- | --- | --- |
| Brainstorm | done | \`idea.md\` | First useful outcome and constraints are recorded. |
| Grill | done | \`grill.md\` | Stack, persistence, permissions, and verification are decided. |
| Spec | done | \`spec.md\`, \`phases/tool-library/phase-spec.md\` | Phase is explicit and sliceable. |
| Slice | done | \`phases/tool-library/slices/index.md\` | Slice map is complete. |
| Build | pending |  |  |
| Review | pending |  |  |
| Readiness | pending |  |  |
`);
  write(repo, "auto-strike/initiatives/main/phases/tool-library/phase-spec.md", "# Tool Library Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/tool-library/slices/index.md", `# Slices

## Slice Map
| Slice | Size | Depends On | Unblocks | Risk | Verification |
| --- | --- | --- | --- | --- | --- |
| 0. Scaffold + domain | M | None | Persona shell | High | Typecheck |
`);
  write(repo, "auto-strike/initiatives/main/phases/tool-library/slices/slice-0-scaffold.md", `# Slice 0: Scaffold + domain core

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
  assert.equal(body.activePhase.path, "auto-strike/initiatives/main/phases/tool-library");
  assert.ok(body.messages.some((item) => item.code === "duplicate-active-work-field" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "too-many-slice-acceptance-criteria" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "too-many-slice-surfaces" && item.severity === "warning"));
  assert.ok(!body.messages.some((item) => item.code === "missing-active-phase"));
}

function writeCheckpointDueFixture(repo, activeSliceIndex) {
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/tool-library
- Current mode: build
- Doc: auto-strike/initiatives/main/phases/tool-library/slices/slice-${activeSliceIndex}-done.md
- Active slice: auto-strike/initiatives/main/phases/tool-library/slices/slice-${activeSliceIndex}-done.md
- State: Slice ${activeSliceIndex} has implementation evidence.
- Next: Close slice ${activeSliceIndex}.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/tool-library/phase-spec.md", "# Tool Library Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/tool-library/slices/index.md", `# Slices

## Slice Map
| Slice | Size | Depends On | Unblocks | Risk | Verification |
| --- | --- | --- | --- | --- | --- |
| 0. Server Boot | S | None | Store | Low | Smoke |
| 1. Store | S | 0 | Identity | Medium | Smoke |
| 2. Identity | S | 1 | Tools | Medium | Browser |
| 3. Tools | S | 2 | Requests | Medium | Browser |
| 4. Requests | M | 3 | Readiness | High | Browser |

## Checkpoint: After Slices 0-3
- [ ] Core user flow works end to end.

## Checkpoint: After Slice 4
- [ ] Borrow approval works end to end.
`);
  write(repo, `auto-strike/initiatives/main/phases/tool-library/slices/slice-${activeSliceIndex}-done.md`, `# Slice ${activeSliceIndex}: Done

## Size
S

## Acceptance Criteria
- App behavior works.

## Depends On
- None.

## Likely Surfaces
- \`src/app.js\`

## Execution Tasks
- [x] Research.
- [x] Plan.
- [x] Review.
- [x] Verify.

## Evidence
Changed:
- \`src/app.js\`

Verified:
- \`pnpm smoke\` passed.

Reviewed:
- functionality: passed.
- read-only review subagent - pass; returned findings to main agent for synthesis.

## Closeout Summary
Implemented Slice ${activeSliceIndex}: Done.

Built:
- Behavior works.

Validation passed:
- \`pnpm smoke\`

Review:
- functionality: passed.

Skipped / residual risk:
- None.

Docs:
- Slice doc.

Next:
- Next slice.
`);
}

function testValidateDoesNotWarnForFutureSliceCheckpoint() {
  const repo = tempRepo();
  writeCheckpointDueFixture(repo, 0);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "future slice checkpoint should not warn before due slice completes");
  assert.ok(!json(result).messages.some((item) => item.code === "stale-slice-checkpoint-checklist"));
}

function testValidateWarnsForDueSliceCheckpoint() {
  const repo = tempRepo();
  writeCheckpointDueFixture(repo, 3);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "due slice checkpoint should warn when unchecked");
  assert.ok(json(result).messages.some((item) => item.code === "stale-slice-checkpoint-checklist" && item.severity === "warning"));
}

function testValidateWarnsForDuplicateModeLedgerRowsWithoutFalseSpecSliceBoundary() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/tool-library
- Doc: auto-strike/initiatives/main/phases/tool-library/slices/index.md
- Slice: auto-strike/initiatives/main/phases/tool-library/slices/slice-0-scaffold.md
- State: Slice map written.
- Next: Build slice 0.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "UBIQUITOUS_LANGUAGE.md", "# Ubiquitous Language\n\n## Tool Library\n- Tool means borrowable item.\n");
  write(repo, "auto-strike/initiatives/main/decisions.md", "# Decisions\n\n## Status\n- Decided.\n");
  write(repo, "auto-strike/initiatives/main/idea.md", `# Main Idea

## Mode Ledger
| Mode | Status | Artifact | Reason |
| --- | --- | --- | --- |
| Brainstorm | done | \`idea.md\` | First useful outcome and constraints are recorded. |
| Grill | done | \`grill.md\` | Stack, persistence, permissions, and verification are decided. |
| Spec | done | \`spec.md\`, \`phases/tool-library/phase-spec.md\` | Phase is explicit and sliceable. |
| Slice | done | \`phases/tool-library/slices/index.md\` | Slice map is complete. |
| Build | in progress | \`phases/tool-library/slices/slice-0-scaffold.md\` | Slice 0 is active. |
| Spec | pending |  |  |
| Slice | pending |  |  |
| Build | pending |  |  |
| Review | pending |  |  |
| Readiness | pending |  |  |
`);
  write(repo, "auto-strike/initiatives/main/phases/tool-library/phase-spec.md", "# Tool Library Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/tool-library/slices/index.md", `# Slices

## Slice Map
| Slice | Size | Depends On | Unblocks | Risk | Verification |
| --- | --- | --- | --- | --- | --- |
| 0. Scaffold | S | None | Persona shell | Medium | Typecheck |
`);
  write(repo, "auto-strike/initiatives/main/phases/tool-library/slices/slice-0-scaffold.md", `# Slice 0: Scaffold

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
  assert.ok(body.messages.some((item) => item.code === "duplicate-mode-ledger-row" && item.severity === "warning"));
  assert.ok(!body.messages.some((item) => item.code === "spec-mode-created-slice-artifacts"));
}

function testReviewPlanRecommendsUiRegressionForUiChanges() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/todo-dogfood
- Current mode: build
- Active slice: auto-strike/initiatives/main/phases/todo-dogfood/slices/slice-1-edit-task.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/todo-dogfood/phase-spec.md", "# Todo Dogfood Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/todo-dogfood/slices/slice-1-edit-task.md", `# Slice 1: Edit Task

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
  assert.ok(body.messages.some((item) => item.code === "missing-browser-verification-capability" && item.severity === "warning"));
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
- Phase: auto-strike/initiatives/main/phases/todo-dogfood
- Current mode: review
- Active slice: auto-strike/initiatives/main/phases/todo-dogfood/slices/slice-1-edit-task.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/todo-dogfood/phase-spec.md", "# Todo Dogfood Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/todo-dogfood/slices/slice-1-edit-task.md", `# Slice 1: Edit Task

## Browser Verification Capability
- Applies: yes, this slice changes a visible edit input.
- Playwright CLI: checked \`playwright-cli --version\`; unavailable in this session because CLI access is blocked.
- Target URL / route: /todo.
- Viewports / flows: edit task flow at desktop width.
- Status: BLOCKED; UI is code-verified, not browser-verified; replacement evidence is smoke script plus static UI regression review; residual user-facing risk is visual layout.

## Evidence

Changed:
- todo/index.html
- todo/todo.js

Verified:
- node scripts/todo-smoke.js - passed

Reviewed:
- ui-regression - pass; static CSS selector review checked new edit input against existing selectors
- functionality - pass
- read-only review subagent - pass; returned findings to main agent for synthesis.

Skipped:
- Browser check - playwright-cli unavailable, so smoke script plus static UI regression review were used as replacement evidence; residual risk is visual layout.
`);
  write(repo, "todo/index.html", "<!doctype html>\n<input>\n");
  write(repo, "todo/todo.js", "export function todo() {}\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "recorded UI review evidence should satisfy UI review validation");
  const body = json(result);
  assert.ok(!body.messages.some((item) => item.code === "missing-reviewed-lens-evidence"));
  assert.ok(!body.messages.some((item) => item.code === "missing-ui-browser-review-evidence"));
  assert.ok(!body.messages.some((item) => item.code === "missing-browser-verification-capability"));
  assert.ok(!body.messages.some((item) => item.code === "missing-verification-capability"));
  assert.ok(body.messages.some((item) => item.code === "ui-browser-verification-blocked" && item.severity === "warning"));
}

function testUiRegressionReviewAloneDoesNotSuppressBrowserWarning() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/todo-dogfood
- Current mode: review
- Active slice: auto-strike/initiatives/main/phases/todo-dogfood/slices/slice-1-edit-task.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/todo-dogfood/phase-spec.md", "# Todo Dogfood Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/todo-dogfood/slices/slice-1-edit-task.md", `# Slice 1: Edit Task

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
- read-only review subagent - pass; returned findings to main agent for synthesis.
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
- Phase: auto-strike/initiatives/main/phases/todo-dogfood
- Current mode: review
- Active slice: auto-strike/initiatives/main/phases/todo-dogfood/slices/slice-1-edit-task.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/todo-dogfood/phase-spec.md", "# Todo Dogfood Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/todo-dogfood/slices/slice-1-edit-task.md", `# Slice 1: Edit Task

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
- read-only review subagent - pass; returned findings to main agent for synthesis.
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
- Phase: auto-strike/initiatives/main/phases/todo-dogfood
- Current mode: build
- Active slice: auto-strike/initiatives/main/phases/todo-dogfood/slices/slice-1-edit-task.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/todo-dogfood/phase-spec.md", "# Todo Dogfood Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/todo-dogfood/slices/slice-1-edit-task.md", `# Slice 1: Edit Task

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
- read-only review subagent - pass; returned findings to main agent for synthesis.

Skipped:
- Automated browser screenshot/click automation - no browser automation dependency exists in this repo and package installs are out of scope; replaced with API flow checks and static UI review
`);
  write(repo, "todo/index.html", "<!doctype html>\n<input>\n");
  write(repo, "todo/todo.js", "export function todo() {}\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "package-only browser skip should warn, not fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "missing-ui-browser-review-evidence" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "missing-browser-verification-capability" && item.severity === "warning"));
}

function testValidateWarnsForMissingVerificationCapabilityOnSkippedUiChecks() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/todo-dogfood
- Current mode: review
- Active slice: auto-strike/initiatives/main/phases/todo-dogfood/slices/slice-1-edit-task.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/todo-dogfood/phase-spec.md", "# Todo Dogfood Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/todo-dogfood/slices/slice-1-edit-task.md", `# Slice 1: Edit Task

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
- read-only review subagent - pass; returned findings to main agent for synthesis.

Skipped:
- Browser screenshot/click check - browser backend unavailable; static UI regression review was used as replacement evidence
`);
  write(repo, "todo/index.html", "<!doctype html>\n<input>\n");
  write(repo, "todo/todo.js", "document.querySelector('button').addEventListener('click', () => {});\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "missing verification capability should warn, not fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "missing-browser-verification-capability" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "missing-ui-browser-review-evidence" && item.severity === "warning"));
}

function testValidateAcceptsVerificationCapabilityForSkippedUiChecks() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/todo-dogfood
- Current mode: review
- Active slice: auto-strike/initiatives/main/phases/todo-dogfood/slices/slice-1-edit-task.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/todo-dogfood/phase-spec.md", "# Todo Dogfood Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/todo-dogfood/slices/slice-1-edit-task.md", `# Slice 1: Edit Task

## Browser Verification Capability
- Applies: yes, this slice changes a visible edit input.
- Playwright CLI: checked \`playwright-cli --version\`; unavailable in this session.
- Target URL / route: /todo.
- Viewports / flows: edit task flow at desktop width.
- Status: BLOCKED; UI is code-verified, not browser-verified; replacement evidence is smoke script plus static UI regression review; residual user-facing risk is visual layout.

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
- read-only review subagent - pass; returned findings to main agent for synthesis.

Skipped:
- Browser screenshot/click check - playwright-cli unavailable, so smoke script plus static UI regression review were used as replacement evidence; residual risk is visual layout.
`);
  write(repo, "todo/index.html", "<!doctype html>\n<input>\n");
  write(repo, "todo/todo.js", "document.querySelector('button').addEventListener('click', () => {});\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "recorded verification capability should satisfy validation");
  const body = json(result);
  assert.ok(!body.messages.some((item) => item.code === "missing-verification-capability"));
  assert.ok(!body.messages.some((item) => item.code === "missing-browser-verification-capability"));
  assert.ok(!body.messages.some((item) => item.code === "missing-ui-browser-review-evidence"));
  assert.ok(body.messages.some((item) => item.code === "ui-browser-verification-blocked" && item.severity === "warning"));
}

function testValidateAcceptsRealBrowserVerificationForUiChecks() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/todo-dogfood
- Current mode: review
- Active slice: auto-strike/initiatives/main/phases/todo-dogfood/slices/slice-1-edit-task.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/todo-dogfood/phase-spec.md", "# Todo Dogfood Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/todo-dogfood/slices/slice-1-edit-task.md", `# Slice 1: Edit Task

## Browser Verification Capability
- Applies: yes, this slice changes the visible edit flow.
- Playwright CLI: available; \`playwright-cli --version\` passed.
- Target URL / route: http://127.0.0.1:3000/todo.
- Viewports / flows: desktop edit flow.
- Status: verified.

## Evidence

Changed:
- todo/index.html
- todo/todo.js

Verified:
- playwright-cli: opened /todo, clicked Edit, saved the task, checked visible result, checked console errors = 0 - passed

Reviewed:
- functionality - pass
- spec-coverage - pass
- code-quality - pass
- ui-regression - pass with browser evidence
- user-flows - pass with browser evidence
- read-only review subagent - pass; returned findings to main agent for synthesis.
`);
  write(repo, "todo/index.html", "<!doctype html>\n<input>\n");
  write(repo, "todo/todo.js", "document.querySelector('button').addEventListener('click', () => {});\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "real browser evidence should satisfy UI browser validation");
  const body = json(result);
  assert.ok(!body.messages.some((item) => item.code === "missing-browser-verification-capability"));
  assert.ok(!body.messages.some((item) => item.code === "missing-ui-browser-review-evidence"));
  assert.ok(!body.messages.some((item) => item.code === "ui-browser-verification-blocked"));
}

function testValidateDoesNotContradictGenericTasksWhenBrowserBlocked() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/todo-dogfood
- Current mode: review
- Active slice: auto-strike/initiatives/main/phases/todo-dogfood/slices/slice-1-edit-task.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/todo-dogfood/phase-spec.md", "# Todo Dogfood Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/todo-dogfood/slices/slice-1-edit-task.md", `# Slice 1: Edit Task

## Execution Tasks
- [x] Verify the acceptance criteria and any required browser/user-flow checks.

## Browser Verification Capability
- Applies: yes, this slice changes a visible form.
- Playwright CLI: checked \`playwright-cli --version\`; unavailable in this session.
- Target URL / route: /todo.
- Viewports / flows: edit task flow.
- Status: BLOCKED; UI is code-verified, not browser-verified; replacement evidence is smoke script plus static UI review; residual user-facing risk is visual layout.

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
- ui-regression - pass by static review
- user-flows - pass by smoke route checks
- read-only review subagent - pass; returned findings to main agent for synthesis.

Skipped:
- Browser verification - playwright-cli unavailable, so smoke script plus static UI review were used as replacement evidence; residual risk is visual layout.
`);
  write(repo, "todo/index.html", "<!doctype html>\n<input>\n");
  write(repo, "todo/todo.js", "document.querySelector('button').addEventListener('click', () => {});\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "generic verified task plus honest browser block should not look contradictory");
  const body = json(result);
  assert.ok(!body.messages.some((item) => item.code === "completed-check-conflicts-with-skipped-evidence"));
  assert.ok(body.messages.some((item) => item.code === "ui-browser-verification-blocked" && item.severity === "warning"));
}

function testValidateDoesNotContradictCompletedBrowserTaskWhenFallbackBrowserRan() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/todo-dogfood
- Current mode: review
- Active slice: auto-strike/initiatives/main/phases/todo-dogfood/slices/slice-1-edit-task.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/todo-dogfood/phase-spec.md", "# Todo Dogfood Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/todo-dogfood/slices/slice-1-edit-task.md", `# Slice 1: Edit Task

## Execution Tasks
- [x] For UI/user-flow work, record browser verification capability per \`verification.md\`.
- [x] Verify the acceptance criteria and required browser/user-flow checks.

## Browser Verification Capability
- Applies: yes, this slice changes a visible form.
- Playwright CLI: available; \`playwright-cli --version\` passed.
- Target URL / route: http://127.0.0.1:3000/todo.
- Viewports / flows: edit task flow and mobile overflow check.
- Status: verified.

## Evidence

Changed:
- todo/index.html
- todo/todo.js

Verified:
- playwright-cli browser flow - passed edit task and mobile overflow checks.

Reviewed:
- read-only review subagent - pass; returned findings to main agent for synthesis.
- functionality - pass
- spec-coverage - pass
- code-quality - pass
- ui-regression - pass with browser evidence
- user-flows - pass with browser evidence

Skipped:
- None for required checks.
`);
  write(repo, "todo/index.html", "<!doctype html>\n<input>\n");
  write(repo, "todo/todo.js", "document.querySelector('button').addEventListener('click', () => {});\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "completed browser task with real fallback browser evidence should not warn as contradictory");
  const body = json(result);
  assert.ok(!body.messages.some((item) => item.code === "completed-check-conflicts-with-skipped-evidence"));
  assert.ok(!body.messages.some((item) => item.code === "missing-ui-browser-review-evidence"));
}

function testValidateWarnsForMissingSliceCloseoutSummary() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/video-mvp
- Current mode: review
- Active slice: auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-caption.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/phase-spec.md", "# Video MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-caption.md", `# Slice 0: Caption

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
- read-only review subagent - passed after fixes
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
- Phase: auto-strike/initiatives/main/phases/video-mvp
- Current mode: review
- Active slice: auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-caption.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/phase-spec.md", "# Video MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-caption.md", `# Slice 0: Caption

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
- read-only review subagent - passed after fixes

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
- auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-caption.md

Next:
- Slice 1: Caption editing.
`);
  write(repo, "src/video/caption.ts", "export function caption() {}\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "recorded slice closeout summary should satisfy validation");
  const body = json(result);
  assert.ok(!body.messages.some((item) => item.code === "missing-slice-closeout-summary"));
}

function testValidateAcceptsCloseoutSummaryWithValidationAlias() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/video-mvp
- Current mode: review
- Active slice: auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-caption.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/phase-spec.md", "# Video MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-caption.md", `# Slice 0: Caption

## Evidence

Changed:
- src/video/caption.ts

Verified:
- node scripts/caption-smoke.js - passed

Reviewed:
- functionality - passed
- spec-coverage - passed
- code-quality - passed
- read-only review subagent - passed
- final re-review - no remaining blockers
- read-only review subagent - passed

## Closeout Summary
Implemented Caption.

Built:
- Added caption generation behavior.

Validation:
- node scripts/caption-smoke.js

Review:
- Functionality/spec/code quality: passed.
- Final re-review: no remaining blocking findings.

Skipped residual risk:
- None.

Docs:
- auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-caption.md

Next:
- Slice 1: Caption editing.
`);
  write(repo, "src/video/caption.ts", "export function caption() {}\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "closeout summary should accept concise equivalent labels");
  const body = json(result);
  assert.ok(!body.messages.some((item) => item.code === "missing-slice-closeout-summary"));
}

function testValidateDoesNotRequireCloseoutForInProgressBuildSlice() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/video-mvp
- Current mode: build
- Active slice: auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-caption.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/phase-spec.md", "# Video MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-caption.md", `# Slice 0: Caption

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
- Phase: auto-strike/initiatives/main/phases/video-mvp
- Current mode: review
- Active slice: auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-upload.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/phase-spec.md", "# Video MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-upload.md", `# Slice 0: Upload

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
- read-only review subagent - pass; returned findings to main agent for synthesis.
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
- Phase: auto-strike/initiatives/main/phases/todo-dogfood
- Current mode: review
- Active slice: auto-strike/initiatives/main/phases/todo-dogfood/slices/slice-1-edit-task.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/todo-dogfood/phase-spec.md", "# Todo Dogfood Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/todo-dogfood/slices/slice-1-edit-task.md", `# Slice 1: Edit Task

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
- read-only review subagent - pass; returned findings to main agent for synthesis.

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

function testValidateErrorsForSingleSliceWithoutReviewSubagentEvidence() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/video-mvp
- Current mode: review
- Active slice: auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-upload.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/phase-spec.md", "# Video MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-upload.md", `# Slice 0: Upload

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
  assertStatus(result, 1, "single-slice completed review without review subagent evidence should fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "missing-review-subagent-evidence" && item.severity === "error"));
}

function testValidateRejectsSkippedReviewSubagentEvidence() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/video-mvp
- Current mode: review
- Active slice: auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-upload.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/phase-spec.md", "# Video MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-upload.md", `# Slice 0: Upload

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
- read-only review subagent - skipped; main-agent self-review used.
`);
  write(repo, "src/video/upload.ts", "export function upload() {}\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 1, "skipped review-subagent evidence should not satisfy validation");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "missing-review-subagent-evidence" && item.severity === "error"));
}

function testValidateErrorsForMissingReviewedSubagentEvidence() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/video-mvp
- Current mode: review
- Active slice: auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-upload.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/phase-spec.md", "# Video MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-upload.md", `# Slice 0: Upload

## Evidence

Changed:
- src/video/upload.ts

Verified:
- node scripts/video-smoke.js - passed
`);
  write(repo, "src/video/upload.ts", "export function upload() {}\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 1, "review mode with changed and verified implementation needs review subagent evidence");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "missing-review-subagent-evidence" && item.severity === "error"));
}

function testValidateRejectsPendingReviewSubagentEvidence() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/video-mvp
- Current mode: review
- Active slice: auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-upload.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/phase-spec.md", "# Video MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-upload.md", `# Slice 0: Upload

## Evidence

Changed:
- src/video/upload.ts

Verified:
- node scripts/video-smoke.js - passed

Reviewed:
- read-only review subagent - pending
`);
  write(repo, "src/video/upload.ts", "export function upload() {}\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 1, "pending review-subagent evidence should not satisfy validation");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "missing-review-subagent-evidence" && item.severity === "error"));
}

function testValidateRejectsMainAgentSelfReviewSubagentEvidence() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/video-mvp
- Current mode: review
- Active slice: auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-upload.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/phase-spec.md", "# Video MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-upload.md", `# Slice 0: Upload

## Evidence

Changed:
- src/video/upload.ts

Verified:
- node scripts/video-smoke.js - passed

Reviewed:
- read-only review subagent - main agent self review passed
`);
  write(repo, "src/video/upload.ts", "export function upload() {}\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 1, "main-agent self-review wording should not satisfy review-subagent validation");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "missing-review-subagent-evidence" && item.severity === "error"));
}

function testValidateErrorsForMultiSliceWithoutReviewSubagentEvidence() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/video-mvp
- Current mode: review
- Active slice: auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-upload.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/phase-spec.md", "# Video MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/slices/slice-1-caption.md", `# Slice 1: Caption

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
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-upload.md", `# Slice 0: Upload

## Implementation Research
- Local precedent: src/video/upload.ts owns upload behavior.

## Plan
- Update \`src/video/upload.ts\` and verify with \`node scripts/video-smoke.js\`.

## Plan Review
- read-only review subagent - pass; files and verification are named.

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
  assertStatus(result, 1, "multi-slice review without review subagent evidence should fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "missing-review-subagent-evidence" && item.severity === "error"));
}

function testValidateAcceptsMultiSliceReviewSubagentEvidence() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/video-mvp
- Current mode: review
- Active slice: auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-upload.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/phase-spec.md", "# Video MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/slices/slice-1-caption.md", `# Slice 1: Caption

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
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-upload.md", `# Slice 0: Upload

## Implementation Research
- Local precedent: src/video/upload.ts owns upload behavior.

## Plan
- Update \`src/video/upload.ts\` and verify with \`node scripts/video-smoke.js\`.

## Plan Review
- read-only review subagent - pass; files and verification are named.

## Evidence

Changed:
- src/video/upload.ts

Verified:
- node scripts/video-smoke.js - passed

Reviewed:
- read-only review subagent, functionality - pass
- read-only review subagent, spec-coverage - pass
- read-only review subagent, code-quality - pass
`);
  write(repo, "src/video/upload.ts", "export function upload() {}\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "multi-slice review with review subagent evidence should not warn");
  const body = json(result);
  assert.ok(!body.messages.some((item) => item.code === "missing-review-subagent-evidence"));
}

function testValidateWarnsWhenCheckedTodoConflictsWithSkippedEvidence() {
  const repo = tempRepo();
  write(repo, "auto-strike/todo.md", `# Todo

- [x] Browser walkthrough passed for upload flow.
`);
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/video-mvp
- Current mode: build
- Active slice: auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-upload.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/phase-spec.md", "# Video MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-upload.md", `# Slice 0: Upload

## Evidence

Changed:
- src/video/upload.ts

Verified:
- node scripts/video-smoke.js - passed

Skipped:
- Browser walkthrough - skipped; playwright-cli was unavailable, replacement evidence was node smoke, residual risk remains.
`);
  write(repo, "src/video/upload.ts", "export function upload() {}\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "checked todo contradiction should warn, not fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "completed-check-conflicts-with-skipped-evidence"));
}

function testValidateWarnsWhenCheckedCheckpointLacksBrowserEvidence() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/video-mvp
- Current mode: build
- Active slice: auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-upload.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/phase-spec.md", "# Video MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/slices/index.md", `# Slices

## Slice Map
| Slice | Size | Depends On | Unblocks | Risk | Verification |
| --- | --- | --- | --- | --- | --- |
| 0. Upload | S | None | None | Low | Browser |

## Checkpoint: After Slice 0
- [x] Browser walkthrough works end to end.
`);
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-upload.md", `# Slice 0: Upload

## Evidence

Changed:
- src/video/upload.ts

Verified:
- node scripts/video-smoke.js - passed
`);
  write(repo, "src/video/upload.ts", "export function upload() {}\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "checked checkpoint without browser evidence should warn, not fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "completed-browser-check-missing-evidence"));
}

function testValidateWarnsWhenCheckedExecutionTaskConflictsWithSkippedEvidence() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/video-mvp
- Current mode: build
- Active slice: auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-upload.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/phase-spec.md", "# Video MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-upload.md", `# Slice 0: Upload

## Execution Tasks
- [x] Verify browser walkthrough.

## Evidence

Changed:
- src/video/upload.ts

Verified:
- node scripts/video-smoke.js - passed

Skipped:
- Browser walkthrough - skipped; playwright-cli was unavailable, replacement evidence was node smoke, residual risk remains.
`);
  write(repo, "src/video/upload.ts", "export function upload() {}\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "checked execution task contradiction should warn, not fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "completed-check-conflicts-with-skipped-evidence"));
}

function testValidateWarnsWhenVerifiedEvidenceDidNotRun() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/video-mvp
- Current mode: review
- Active slice: auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-upload.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/phase-spec.md", "# Video MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-upload.md", `# Slice 0: Upload

## Evidence

Changed:
- src/video/upload.ts

Verified:
- Browser check not run.

Reviewed:
- read-only review subagent - pass; returned findings to main agent for synthesis.
`);
  write(repo, "src/video/upload.ts", "export function upload() {}\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "non-running Verified evidence should warn, not fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "missing-review-verified-evidence"));
}

function testValidateDoesNotCompareChangedEvidenceAgainstRepoDiff() {
  const repo = tempRepo();
  initGit(repo);
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/video-mvp
- Current mode: review
- Active slice: auto-strike/initiatives/main/phases/video-mvp/slices/slice-1-caption.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/phase-spec.md", "# Video MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-upload.md", `# Slice 0: Upload

## Evidence

Changed:
- src/video/upload.ts

Verified:
- node scripts/video-smoke.js - passed

Reviewed:
- functionality - passed
- spec-coverage - passed
- code-quality - passed
- final re-review - no remaining blockers

## Closeout Summary
Implemented Slice 0: Upload.

Built:
- Added upload behavior.

Validation passed:
- node scripts/video-smoke.js

Review:
- Functionality/spec/code quality: passed.
- Final re-review: no remaining blocking findings.

Skipped / residual risk:
- None.

Docs:
- auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-upload.md

Next:
- Slice 1: Caption.
`);
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/slices/slice-1-caption.md", `# Slice 1: Caption

## Evidence

Changed:
- src/video/caption.ts

Verified:
- node scripts/caption-smoke.js - passed

Reviewed:
- functionality - passed
- spec-coverage - passed
- code-quality - passed
- read-only review subagent - passed
`);
  write(repo, "src/video/upload.ts", "export function upload() {}\n");
  write(repo, "src/video/caption.ts", "export function caption() {}\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "Changed evidence should be artifact-based, not repo-diff-based");
  const body = json(result);
  assert.ok(!body.messages.some((item) => item.message.includes("src/video/upload.ts")));
}

function testValidateWarnsForPrematureNextSliceActivation() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/tool-library
- Current mode: build
- Active slice: auto-strike/initiatives/main/phases/tool-library/slices/slice-1-requests.md
- Next: Build slice 1.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/tool-library/phase-spec.md", "# Tool Library Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/tool-library/slices/slice-0-listings.md", `# Slice 0: Listings

## Evidence

Changed:
- src/listings.mjs

Verified:
- node scripts/smoke.mjs - passed

Reviewed:
- functionality - passed
- spec-coverage - passed
- code-quality - passed
- read-only review subagent - passed

## Closeout Summary
Implemented Slice 0: Listings.

Built:
- Added listings.

Validation passed:
- node scripts/smoke.mjs

Review:
- Functionality/spec/code quality: passed.
- Final re-review: no remaining blocking findings.

Skipped / residual risk:
- None.

Docs:
- auto-strike/initiatives/main/phases/tool-library/slices/slice-0-listings.md

Next:
- Slice 1: Requests.
`);
  write(repo, "auto-strike/initiatives/main/phases/tool-library/slices/slice-1-requests.md", `# Slice 1: Requests

## Size
M

## Depends On
- Slice 0: Listings

## Execution Tasks
- [ ] Research request behavior.
- [ ] Write the plan.
- [ ] Review the plan.
- [ ] Verify request behavior.
`);
  write(repo, "src/listings.mjs", "export function listings() {}\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "next-slice skeleton after closeout should warn");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "premature-next-slice-activation" && item.severity === "warning"));
}

function testValidateWarnsForDocPathNextSliceWithProseSliceLabel() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/tool-library
- Current mode: build
- Doc: auto-strike/initiatives/main/phases/tool-library/slices/slice-1-requests.md
- Slice: Slice 1 (Requests)
- State: Slice 0 implemented and verified. Build mode continues on Slice 1.
- Next: Implement Slice 1.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/tool-library/phase-spec.md", "# Tool Library Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/tool-library/slices/slice-0-listings.md", `# Slice 0: Listings

## Evidence

Changed:
- src/listings.mjs

Verified:
- node scripts/smoke.mjs - passed

Reviewed:
- functionality - passed
- spec-coverage - passed
- code-quality - passed
- read-only review subagent - passed

## Closeout Summary
Implemented Slice 0: Listings.

Built:
- Added listings.

Validation passed:
- node scripts/smoke.mjs

Review:
- Functionality/spec/code quality: passed.
- Final re-review: no remaining blocking findings.

Skipped / residual risk:
- None.

Docs:
- auto-strike/initiatives/main/phases/tool-library/slices/slice-0-listings.md

Next:
- Slice 1: Requests.
`);
  write(repo, "auto-strike/initiatives/main/phases/tool-library/slices/slice-1-requests.md", `# Slice 1: Requests

## Size
M

## Depends On
- Slice 0: Listings

## Execution Tasks
- [x] Research request behavior.
- [x] Write the plan.
- [x] Review the plan.
- [ ] Verify request behavior.

## Implementation Research
- Local precedent: \`src/listings.mjs\` keeps domain behavior isolated.

## Plan
- Add \`src/requests.mjs\` and verify with \`node scripts/smoke.mjs\`.

## Plan Review
- main-agent review - passed; surfaces and checks are named.
`);
  write(repo, "src/listings.mjs", "export function listings() {}\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "doc path should resolve active slice even when Slice label is prose");
  const body = json(result);
  assert.equal(body.activeSlice.path, "auto-strike/initiatives/main/phases/tool-library/slices/slice-1-requests.md");
  assert.ok(body.messages.some((item) => item.code === "premature-next-slice-activation" && item.severity === "warning"));
}

function testValidateWarnsForCompletedSliceCloseoutWithoutEvidence() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/tool-library
- Current mode: build
- Active slice: auto-strike/initiatives/main/phases/tool-library/slices/slice-0-listings.md
- Next: Close slice 0.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/tool-library/phase-spec.md", "# Tool Library Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/tool-library/slices/slice-0-listings.md", `# Slice 0: Listings

## Closeout Summary
Implemented Slice 0: Listings.

Built:
- Added listings.

Validation passed:
- node scripts/smoke.mjs

Review:
- Functionality/spec/code quality: passed.
- Final re-review: no remaining blocking findings.

Skipped / residual risk:
- None.

Docs:
- auto-strike/initiatives/main/phases/tool-library/slices/slice-0-listings.md

Next:
- Slice 1: Requests.
`);
  write(repo, "src/listings.mjs", "export function listings() {}\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "completed slice closeout without evidence should warn");
  const body = json(result);
  const warning = body.messages.find((item) => item.code === "completed-slice-missing-evidence");
  assert.ok(warning);
  assert.match(warning.message, /Changed/);
  assert.match(warning.message, /Verified/);
  assert.match(warning.message, /Reviewed/);
}

function testValidateAcceptsNextSliceActivationWhenUserExplicitlyContinued() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/tool-library
- Current mode: build
- Active slice: auto-strike/initiatives/main/phases/tool-library/slices/slice-1-requests.md
- State: User explicitly asked to continue to the next slice after Slice 0 closeout.
- Next: Build slice 1.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/tool-library/phase-spec.md", "# Tool Library Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/tool-library/slices/slice-0-listings.md", `# Slice 0: Listings

## Evidence

Changed:
- src/listings.mjs

Verified:
- node scripts/smoke.mjs - passed

Reviewed:
- functionality - passed
- spec-coverage - passed
- code-quality - passed
- read-only review subagent - passed

## Closeout Summary
Implemented Slice 0: Listings.

Built:
- Added listings.

Validation passed:
- node scripts/smoke.mjs

Review:
- Functionality/spec/code quality: passed.
- Final re-review: no remaining blocking findings.

Skipped / residual risk:
- None.

Docs:
- auto-strike/initiatives/main/phases/tool-library/slices/slice-0-listings.md

Next:
- Slice 1: Requests.
`);
  write(repo, "auto-strike/initiatives/main/phases/tool-library/slices/slice-1-requests.md", `# Slice 1: Requests

## Size
M

## Depends On
- Slice 0: Listings

## Execution Tasks
- [x] Research request behavior.
- [x] Write the plan.
- [x] Review the plan.
- [ ] Verify request behavior.

## Implementation Research
- Local precedent: \`src/listings.mjs\` keeps domain behavior isolated.

## Plan
- Add \`src/requests.mjs\` and verify with \`node scripts/smoke.mjs\`.

## Plan Review
- main-agent review - passed; surfaces and checks are named.
`);
  write(repo, "src/listings.mjs", "export function listings() {}\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "explicit user continuation should not warn as premature");
  const body = json(result);
  assert.ok(!body.messages.some((item) => item.code === "premature-next-slice-activation"));
}

function testValidateWarnsForStaleChangedEvidencePath() {
  const repo = tempRepo();
  initGit(repo);
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/video-mvp
- Current mode: review
- Active slice: auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-upload.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/phase-spec.md", "# Video MVP Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/video-mvp/slices/slice-0-upload.md", `# Slice 0: Upload

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
- read-only review subagent - pass; returned findings to main agent for synthesis.
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
- Phase: auto-strike/initiatives/main/phases/vanilla-ui
- Current mode: review
- Active slice: auto-strike/initiatives/main/phases/vanilla-ui/slices/slice-0-click.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/vanilla-ui/phase-spec.md", "# Vanilla UI Spec\n");
  write(repo, "auto-strike/initiatives/main/phases/vanilla-ui/slices/slice-0-click.md", `# Slice 0: Click

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

function testReviewPlanDoesNotInferUiFromScriptPathOnly() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/backend-route
- Current mode: review
- Active slice: auto-strike/initiatives/main/phases/backend-route/slices/slice-0-handler.md
- State: Backend route helper is ready for review.
- Next: Review backend route helper.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/backend-route/slices/slice-0-handler.md", `# Slice 0: Handler

## Evidence
Changed:
- app/demo.js

Verified:
- node --check app/demo.js - passed
`);
  write(repo, "app/demo.js", "export const demo = true;\n");

  const result = run(repo, ["review-plan"]);
  assertStatus(result, 0, "review-plan should not infer UI from script path alone");
  const plan = json(result);
  assert.ok(plan.changedPaths.includes("app/demo.js"));
  assert.ok(!plan.surfaces.ui.includes("app/demo.js"));
  assert.ok(!plan.required.map((item) => item.lens).includes("ui-regression"));
}

function testValidateErrorsForStripeWorkWithoutCliSandboxEvidence() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/checkout
- Current mode: review
- Active slice: auto-strike/initiatives/main/phases/checkout/slices/slice-0-payment-intent.md
- State: Stripe PaymentIntent slice is ready for review.
- Next: Review Stripe sandbox evidence.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/phases/checkout/phase-spec.md", "# Checkout Spec\n\n## Summary\nCreate a Stripe PaymentIntent checkout path.\n");
  write(repo, "auto-strike/initiatives/main/phases/checkout/slices/slice-0-payment-intent.md", `# Slice 0: Payment Intent

## Evidence
Changed:
- src/billing/stripe-checkout.ts

Verified:
- pnpm run test - passed

Reviewed:
- read-only review subagent - pass; returned findings to main agent for synthesis.
`);
  write(repo, "src/billing/stripe-checkout.ts", "import Stripe from 'stripe';\nexport function createPaymentIntent() {}\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 1, "Stripe implementation without CLI sandbox evidence should fail in review");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "missing-stripe-cli-sandbox-evidence" && item.severity === "error"));
}

function testValidateAcceptsStripeCliSandboxEvidence() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: auto-strike/initiatives/main/phases/checkout
- Current mode: review
- Active slice: auto-strike/initiatives/main/phases/checkout/slices/slice-0-payment-intent.md
- State: Stripe PaymentIntent slice is ready for review.
- Next: Review Stripe sandbox evidence.
- Blocked by: None.

## Open Decisions
- None.

## Verification
- stripe --version - passed in sandbox/test account.
`);
  write(repo, "auto-strike/initiatives/main/phases/checkout/phase-spec.md", "# Checkout Spec\n\n## Summary\nCreate a Stripe PaymentIntent checkout path.\n");
  write(repo, "auto-strike/initiatives/main/phases/checkout/slices/slice-0-payment-intent.md", `# Slice 0: Payment Intent

## Evidence
Changed:
- src/billing/stripe-checkout.ts

Verified:
- stripe --version - passed in sandbox/test account.
- stripe payment_intents create --amount 1000 --currency usd - test mode returned pi_123.
- stripe trigger payment_intent.succeeded - sandbox event evt_123 reached local webhook.

Reviewed:
- read-only review subagent - pass; returned findings to main agent for synthesis.
`);
  write(repo, "src/billing/stripe-checkout.ts", "import Stripe from 'stripe';\nexport function createPaymentIntent() {}\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "Stripe CLI sandbox evidence should satisfy Stripe verification gate");
  assert.ok(!json(result).messages.some((item) => item.code === "missing-stripe-cli-sandbox-evidence"));
}

function testValidateWarnsForStripeConnectWithoutSkillResearch() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: None.
- Current mode: spec
- Doc: auto-strike/initiatives/main/spec.md
- State: Stripe Connect onboarding is being specified.
- Next: Record Connect account decisions.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/spec.md", `# Connect Spec

## Summary
Create Stripe Connect connected accounts with account links and requested capabilities.

## Mode Tasks
- [x] Draft Connect scope.
- [ ] Record Connect research.

## Exit Evidence
- Connect scope is being clarified.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "missing stripe-connect skill research should warn, not hard fail during spec");
  assert.ok(json(result).messages.some((item) => item.code === "missing-stripe-connect-skill-research" && item.severity === "warning"));
}

function testValidateAcceptsStripeConnectSkillResearchNote() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Work
- Initiative: auto-strike/initiatives/main
- Phase: None.
- Current mode: spec
- Doc: auto-strike/initiatives/main/spec.md
- State: Stripe Connect onboarding is being specified.
- Next: Record Connect account decisions.
- Blocked by: None.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/initiatives/main/spec.md", `# Connect Spec

## Summary
Create Stripe Connect connected accounts with account links and requested capabilities.

## Research Notes
- Used installed stripe-connect skill to choose hosted onboarding, requested capabilities, and webhook scope.

## Mode Tasks
- [x] Draft Connect scope.
- [x] Record Connect research.

## Exit Evidence
- Connect scope is ready for spec review.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "stripe-connect skill research note should satisfy Connect warning");
  assert.ok(!json(result).messages.some((item) => item.code === "missing-stripe-connect-skill-research"));
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
testSimplePhaseSlugDoesNotHardFail();
testValidateRejectsOldTopLevelPhasePath();
testLegacyFeatureShapeWarnsButStillResolves();
testInitiativeInspectAndValidateWithEvidence();
testValidateWarnsForMissingEvidence();
testValidateBrokenKeyDocReference();
testKeyDocsCanReferenceRepoDocs();
testMarkdownLinksResolveToTargets();
testReviewContextPacket();
testImplementationPlanReviewContext();
testReviewContextScopesChangedFilesToActivePhase();
testValidateWarnsWhenReviewEvidenceLacksChangedAndVerified();
testValidateWarnsForWeakPreBuildSlicePrep();
testValidateAcceptsConcretePreBuildSlicePrep();
testValidateAcceptsActiveWorkPointer();
testValidateWarnsForDocNameAsCurrentMode();
testValidateWarnsForMissingActiveWork();
testValidateWarnsForWeakOrMissingActiveWorkDoc();
testValidateErrorsForMissingActiveWorkDocDuringBuild();
testValidateErrorsForMissingActivePhaseDuringReview();
testValidateWarnsForBatchedModeNextAction();
testValidateWarnsForNextSliceDocAndImplementationBatch();
testValidateAcceptsSingleBoundaryNextAction();
testValidateWarnsForMissingModeLedgerAfterSlicing();
testValidateWarnsForWeakModeLedgerAfterSlicing();
testValidateAcceptsModeLedgerAfterSlicing();
testValidateWarnsForLegacyPhaseLedgerName();
testValidateAcceptsSpecModeLedgerWithFuturePendingRows();
testValidateDoesNotInferBuildPrepFromSliceDocAlone();
testValidateWarnsForStaleActiveWorkAfterImplementationEvidence();
testValidateWarnsForStaleFinalIndexState();
testValidateWarnsForMissingReferencedAutoStrikeDoc();
testValidateWarnsForStaleSliceTaskChecklist();
testValidateAllowsMissingRootLanguage();
testValidateWarnsForWeakCurrentTruthDocs();
testValidateAcceptsMinimalCurrentTruthDocs();
testValidateWarnsForMissingGrillDecisionDepth();
testValidateAcceptsStandardGrillDecisionDepth();
testValidateAcceptsDeepGrillDecisionDepthWithSuggestedChange();
testValidateWarnsForUnknownGrillDecisionDepth();
testValidateRequiresDecisionDepthAfterGrillMode();
testValidateWarnsForMissingGrillBeforeSpecOrSlice();
testValidateAcceptsGrillDecisionCheckpointBeforeSpec();
testValidateWarnsForToolingConstraintRuntimeConflict();
testValidateWarnsWhenSpecModeCreatesSliceArtifacts();
testValidateWarnsForDetailedSlicePlanningInsideSpec();
testValidateAllowsConciseSliceHandoffInsideSpec();
testValidateWarnsForDetailedSliceHandoffAfterSpecIsMarkedDone();
testValidateWarnsForMissingModeExitGatesBeforeBuild();
testValidateAcceptsExplicitUserOptOutOfGrill();
testValidateWarnsForModeCompletedAfterQuestionToolFailure();
testValidateAcceptsSliceMapDependenciesAndCheckpoint();
testValidateAllowsAndSliceTitleWithSmallRationale();
testValidateWarnsForMissingSliceMapDependenciesAndCheckpoint();
testValidateDoesNotWarnForFutureSliceCheckpoint();
testValidateWarnsForDueSliceCheckpoint();
testValidateWarnsForOversizedBatchedAndWeakNonVerticalSlice();
testValidateRequiresWhyNotSplitForLargeSlice();
testValidateWarnsForBroadStackSliceWithoutStrongWhyNotSplit();
testValidateAcceptsBroadStackSliceWithStrongWhyNotSplit();
testValidateWarnsForDuplicateActiveWorkAndStillChecksSlices();
testValidateWarnsForDuplicateModeLedgerRowsWithoutFalseSpecSliceBoundary();
testReviewPlanRecommendsUiRegressionForUiChanges();
testUiReviewEvidenceSuppressesUiReviewWarning();
testUiRegressionReviewAloneDoesNotSuppressBrowserWarning();
testCurlLocalhostDoesNotSuppressBrowserWarning();
testPackageOnlyBrowserSkipDoesNotSuppressBrowserWarning();
testValidateWarnsForMissingVerificationCapabilityOnSkippedUiChecks();
testValidateAcceptsVerificationCapabilityForSkippedUiChecks();
testValidateAcceptsRealBrowserVerificationForUiChecks();
testValidateDoesNotContradictGenericTasksWhenBrowserBlocked();
testValidateWarnsForMissingSliceCloseoutSummary();
testValidateAcceptsSliceCloseoutSummary();
testValidateAcceptsCloseoutSummaryWithValidationAlias();
testValidateDoesNotRequireCloseoutForInProgressBuildSlice();
testValidateWarnsForMissingRequiredReviewLenses();
testValidateAcceptsReviewedAndSkippedRequiredReviewLenses();
testValidateErrorsForSingleSliceWithoutReviewSubagentEvidence();
testValidateRejectsSkippedReviewSubagentEvidence();
testValidateErrorsForMissingReviewedSubagentEvidence();
testValidateRejectsPendingReviewSubagentEvidence();
testValidateRejectsMainAgentSelfReviewSubagentEvidence();
testValidateErrorsForMultiSliceWithoutReviewSubagentEvidence();
testValidateAcceptsMultiSliceReviewSubagentEvidence();
testValidateWarnsWhenCheckedTodoConflictsWithSkippedEvidence();
testValidateWarnsWhenCheckedCheckpointLacksBrowserEvidence();
testValidateWarnsWhenCheckedExecutionTaskConflictsWithSkippedEvidence();
testValidateWarnsWhenVerifiedEvidenceDidNotRun();
testValidateDoesNotCompareChangedEvidenceAgainstRepoDiff();
testValidateWarnsForPrematureNextSliceActivation();
testValidateWarnsForDocPathNextSliceWithProseSliceLabel();
testValidateWarnsForCompletedSliceCloseoutWithoutEvidence();
testValidateAcceptsNextSliceActivationWhenUserExplicitlyContinued();
testValidateWarnsForStaleChangedEvidencePath();
testReviewPlanDetectsBrowserScriptUiChanges();
testReviewPlanDoesNotInferUiFromScriptPathOnly();
testValidateErrorsForStripeWorkWithoutCliSandboxEvidence();
testValidateAcceptsStripeCliSandboxEvidence();
testValidateWarnsForStripeConnectWithoutSkillResearch();
testValidateAcceptsStripeConnectSkillResearchNote();
testReviewContextRejectsUnknownLens();
testHelpWorksWithoutCommand();

console.log("auto-strike tests passed");
