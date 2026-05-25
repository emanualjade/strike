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
testReviewContextScopesChangedFilesToActiveFeature();
testValidateWarnsWhenReviewEvidenceLacksChangedAndVerified();
testReviewContextRejectsUnknownLens();
testHelpWorksWithoutCommand();

console.log("auto-strike tests passed");
