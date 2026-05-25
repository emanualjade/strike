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

function testTinyPathDoesNotRequireSpecOrSlices() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Feature
- tiny-copy-fix
- Current path: Tiny Change Path
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
  write(repo, "auto-strike/todo.md", `# Todo

- [ ] Update button copy.
`);

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "tiny path should not require feature docs for a simple active feature slug");
  const body = json(result);
  assert.equal(body.activeFeature.raw, "tiny-copy-fix");
  assert.equal(body.activeFeature.path, null);
  assert.equal(body.activeFeature.inferredPath, "auto-strike/features/tiny-copy-fix");
  assert.ok(!body.messages.some((item) => item.code === "missing-active-feature"));
  assert.ok(!body.messages.some((item) => item.code === "missing-key-doc"));
  assert.ok(!body.messages.some((item) => item.code === "missing-active-spec"));
  assert.ok(!body.messages.some((item) => item.code === "missing-active-slice"));
}

function testFastPathInspectAndValidateWithEvidence() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Feature
- auto-strike/features/upload-mvp
- Current path: Fast Path
- Current mode: review
- Active slice: auto-strike/features/upload-mvp/slices/slice-0-upload-preview.md
- Next best action: Review slice 0.

## Project State
- Upload preview MVP is implemented.

## Key Docs
- \`auto-strike/features/upload-mvp/spec.md\` - product scope.
- \`auto-strike/features/upload-mvp/slices/slice-0-upload-preview.md\` - build evidence.

## Open Decisions
- None.

## Verification
- pnpm run test - passed.
`);
  write(repo, "auto-strike/todo.md", `# Todo

- [x] Build upload preview slice.
`);
  write(repo, "auto-strike/features/upload-mvp/spec.md", "# Upload MVP Spec\n");
  write(repo, "app/upload/page.tsx", "export default function Page() { return null; }\n");
  write(repo, "auto-strike/features/upload-mvp/slices/slice-0-upload-preview.md", `# Slice 0: Upload Preview

## Evidence

Changed:
- app/upload/page.tsx

Verified:
- pnpm run test - passed
`);

  const inspect = run(repo, ["inspect"]);
  assertStatus(inspect, 0, "inspect should succeed for fast path workspace");
  const inspectBody = json(inspect);
  assert.equal(inspectBody.activeFeature.path, "auto-strike/features/upload-mvp");
  assert.equal(inspectBody.activeFeature.specExists, true);
  assert.equal(inspectBody.activeFeature.sliceFiles.length, 1);
  assert.deepEqual(inspectBody.evidence.locations, ["auto-strike/features/upload-mvp/slices/slice-0-upload-preview.md"]);
  assert.deepEqual(inspectBody.evidence.changedPaths, ["app/upload/page.tsx"]);

  const validate = run(repo, ["validate"]);
  assertStatus(validate, 0, "validate should pass complete fast path evidence");
  assert.equal(json(validate).summary.errors, 0);
}

function testValidateWarnsForMissingEvidence() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Feature
- auto-strike/features/search-mvp
- Current path: Fast Path
- Current mode: review

## Open Decisions
- None.
`);
  write(repo, "auto-strike/features/search-mvp/spec.md", "# Search MVP Spec\n");
  write(repo, "auto-strike/features/search-mvp/slices/slice-0-search.md", "# Slice 0: Search\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "missing evidence should warn, not hard fail");
  const body = json(result);
  assert.ok(body.messages.some((item) => item.code === "missing-evidence" && item.severity === "warning"));
}

function testValidateBrokenKeyDocReference() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Feature
- auto-strike/features/search-mvp
- Current path: Fast Path
- Current mode: spec

## Key Docs
- \`auto-strike/features/search-mvp/spec.md\` - product scope.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/features/search-mvp/idea.md", "# Idea\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 1, "explicit missing key docs should hard fail");
  assert.ok(json(result).messages.some((item) => item.code === "missing-key-doc"));
}

function testKeyDocsCanReferenceRepoDocs() {
  const repo = tempRepo();
  write(repo, "README.md", "# Product Notes\n");
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Feature
- search-mvp
- Current path: Fast Path
- Current mode: idea

## Key Docs
- \`README.md\` - product notes.

## Open Decisions
- None.
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

## Active Feature
- auto-strike/features/video-mvp
- Current path: Large Scope Path
- Current mode: review

## Open Decisions
- None.
`);
  write(repo, "auto-strike/features/video-mvp/spec.md", "# Video MVP Spec\n");
  write(repo, "src/video/upload.ts", "export function upload() {}\n");
  write(repo, "auto-strike/features/video-mvp/slices/slice-0-upload.md", `# Slice 0: Upload

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
  assert.ok(body.focus.some((item) => /hostile inputs/i.test(item)));
  assert.ok(body.state.docs.includes("auto-strike/features/video-mvp/spec.md"));
  assert.ok(body.state.evidence.changedPaths.includes("src/video/upload.ts"));
  assert.ok(body.sourcePaths.some((group) => group.title === "Changed Files From Active Evidence"));
}

function testImplementationPlanReviewContext() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Feature
- auto-strike/features/video-mvp
- Current path: Fast Path
- Current mode: slice
- Active slice: auto-strike/features/video-mvp/slices/slice-0-upload.md

## Key Docs
- \`auto-strike/features/video-mvp/spec.md\` - product scope.
- \`auto-strike/features/video-mvp/slices/slice-0-upload.md\` - implementation plan.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/features/video-mvp/spec.md", "# Video MVP Spec\n");
  write(repo, "auto-strike/features/video-mvp/slices/slice-0-upload.md", `# Slice 0: Upload

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
  assert.ok(activeDocs.paths.includes("auto-strike/features/video-mvp/slices/slice-0-upload.md"));
}

function testReviewContextScopesChangedFilesToActiveFeature() {
  const repo = tempRepo();
  write(repo, "README.md", "# Dogfood Repo\n");
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Feature
- auto-strike/features/todo-dogfood
- Current path: Fast Path
- Current mode: review
- Active slice: auto-strike/features/todo-dogfood/slices/slice-0-static-todo.md

## Key Docs
- \`README.md\` - repo context.
- \`auto-strike/features/todo-dogfood/spec.md\` - active spec.
- \`auto-strike/features/todo-dogfood/slices/slice-0-static-todo.md\` - active evidence.
- \`auto-strike/features/clip-notes/spec.md\` - completed feature context.

## Open Decisions
- None.
`);
  write(repo, "auto-strike/features/todo-dogfood/spec.md", "# Todo Dogfood Spec\n");
  write(repo, "auto-strike/features/todo-dogfood/slices/slice-0-static-todo.md", `# Slice 0: Static Todo

## Evidence

Changed:
- todo/index.html
- todo/todo.js
- scripts/todo-smoke.js

Verified:
- node scripts/todo-smoke.js - passed
`);
  write(repo, "auto-strike/features/clip-notes/spec.md", "# Clip Notes Spec\n");
  write(repo, "auto-strike/features/clip-notes/slices/slice-1-review-brief.md", `# Slice 1: Review Brief

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

## Active Feature
- auto-strike/features/search-mvp
- Current path: Fast Path
- Current mode: review
- Active slice: auto-strike/features/search-mvp/slices/slice-0-search.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/features/search-mvp/spec.md", "# Search MVP Spec\n");
  write(repo, "auto-strike/features/search-mvp/slices/slice-0-search.md", `# Slice 0: Search

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

## Active Feature
- auto-strike/features/todo-dogfood
- Current path: Fast Path
- Current mode: build
- Active slice: auto-strike/features/todo-dogfood/slices/slice-1-edit-task.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/features/todo-dogfood/spec.md", "# Todo Dogfood Spec\n");
  write(repo, "auto-strike/features/todo-dogfood/slices/slice-1-edit-task.md", `# Slice 1: Edit Task

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

## Active Feature
- auto-strike/features/todo-dogfood
- Current path: Fast Path
- Current mode: build
- Active slice: auto-strike/features/todo-dogfood/slices/slice-1-edit-task.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/features/todo-dogfood/spec.md", "# Todo Dogfood Spec\n");
  write(repo, "auto-strike/features/todo-dogfood/slices/slice-1-edit-task.md", `# Slice 1: Edit Task

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

function testReviewPlanRecommendsUiRegressionForUiChanges() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Feature
- auto-strike/features/todo-dogfood
- Current path: Fast Path
- Current mode: review
- Active slice: auto-strike/features/todo-dogfood/slices/slice-1-edit-task.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/features/todo-dogfood/spec.md", "# Todo Dogfood Spec\n");
  write(repo, "auto-strike/features/todo-dogfood/slices/slice-1-edit-task.md", `# Slice 1: Edit Task

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

  const validate = run(repo, ["validate"]);
  assertStatus(validate, 0, "UI review gaps should warn, not fail");
  const body = json(validate);
  assert.ok(body.messages.some((item) => item.code === "missing-reviewed-lens-evidence" && item.severity === "warning"));
  assert.ok(body.messages.some((item) => item.code === "missing-ui-review-evidence" && item.severity === "warning"));

  const alias = run(repo, ["review-context", "--lens", "frontend"]);
  assertStatus(alias, 0, "frontend alias should resolve to the UI regression lens");
  assert.equal(json(alias).lens, "ui-regression");
}

function testUiReviewEvidenceSuppressesUiReviewWarning() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Feature
- auto-strike/features/todo-dogfood
- Current path: Fast Path
- Current mode: review
- Active slice: auto-strike/features/todo-dogfood/slices/slice-1-edit-task.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/features/todo-dogfood/spec.md", "# Todo Dogfood Spec\n");
  write(repo, "auto-strike/features/todo-dogfood/slices/slice-1-edit-task.md", `# Slice 1: Edit Task

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
- Browser check - browser backend unavailable; static UI regression review was used as replacement evidence
`);
  write(repo, "todo/index.html", "<!doctype html>\n<input>\n");
  write(repo, "todo/todo.js", "export function todo() {}\n");

  const result = run(repo, ["validate"]);
  assertStatus(result, 0, "recorded UI review evidence should satisfy UI review validation");
  const body = json(result);
  assert.ok(!body.messages.some((item) => item.code === "missing-reviewed-lens-evidence"));
  assert.ok(!body.messages.some((item) => item.code === "missing-ui-review-evidence"));
}

function testValidateWarnsForMissingRequiredReviewLenses() {
  const repo = tempRepo();
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Feature
- auto-strike/features/video-mvp
- Current path: Fast Path
- Current mode: review
- Active slice: auto-strike/features/video-mvp/slices/slice-0-upload.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/features/video-mvp/spec.md", "# Video MVP Spec\n");
  write(repo, "auto-strike/features/video-mvp/slices/slice-0-upload.md", `# Slice 0: Upload

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

## Active Feature
- auto-strike/features/todo-dogfood
- Current path: Fast Path
- Current mode: review
- Active slice: auto-strike/features/todo-dogfood/slices/slice-1-edit-task.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/features/todo-dogfood/spec.md", "# Todo Dogfood Spec\n");
  write(repo, "auto-strike/features/todo-dogfood/slices/slice-1-edit-task.md", `# Slice 1: Edit Task

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

function testValidateWarnsWhenGitChangesMissingFromChangedEvidence() {
  const repo = tempRepo();
  initGit(repo);
  write(repo, "auto-strike/index.md", `# Auto Strike

## Active Feature
- auto-strike/features/video-mvp
- Current path: Fast Path
- Current mode: review
- Active slice: auto-strike/features/video-mvp/slices/slice-0-upload.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/features/video-mvp/spec.md", "# Video MVP Spec\n");
  write(repo, "auto-strike/features/video-mvp/slices/slice-0-upload.md", `# Slice 0: Upload

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

## Active Feature
- auto-strike/features/video-mvp
- Current path: Fast Path
- Current mode: review
- Active slice: auto-strike/features/video-mvp/slices/slice-0-upload.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/features/video-mvp/spec.md", "# Video MVP Spec\n");
  write(repo, "auto-strike/features/video-mvp/slices/slice-0-upload.md", `# Slice 0: Upload

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

## Active Feature
- auto-strike/features/vanilla-ui
- Current path: Fast Path
- Current mode: review
- Active slice: auto-strike/features/vanilla-ui/slices/slice-0-click.md

## Open Decisions
- None.
`);
  write(repo, "auto-strike/features/vanilla-ui/spec.md", "# Vanilla UI Spec\n");
  write(repo, "auto-strike/features/vanilla-ui/slices/slice-0-click.md", `# Slice 0: Click

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
testTinyPathDoesNotRequireSpecOrSlices();
testFastPathInspectAndValidateWithEvidence();
testValidateWarnsForMissingEvidence();
testValidateBrokenKeyDocReference();
testKeyDocsCanReferenceRepoDocs();
testReviewContextPacket();
testImplementationPlanReviewContext();
testReviewContextScopesChangedFilesToActiveFeature();
testValidateWarnsWhenReviewEvidenceLacksChangedAndVerified();
testValidateWarnsForWeakPreBuildSlicePrep();
testValidateAcceptsConcretePreBuildSlicePrep();
testReviewPlanRecommendsUiRegressionForUiChanges();
testUiReviewEvidenceSuppressesUiReviewWarning();
testValidateWarnsForMissingRequiredReviewLenses();
testValidateAcceptsReviewedAndSkippedRequiredReviewLenses();
testValidateWarnsWhenGitChangesMissingFromChangedEvidence();
testValidateWarnsForStaleChangedEvidencePath();
testReviewPlanDetectsBrowserScriptUiChanges();
testReviewContextRejectsUnknownLens();
testHelpWorksWithoutCommand();

console.log("auto-strike tests passed");
