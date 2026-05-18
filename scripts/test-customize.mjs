#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  CUSTOMIZE_ROOT,
  FILE_MAX_BYTES,
  stripHtmlComments,
} from "../plugins/strike/references/scripts/customize.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const customizeScript = path.join(root, "plugins/strike/references/scripts/customize.mjs");

function tempRepo() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "strike-customize-"));
}

function run(repoRoot, args) {
  return spawnSync(process.execPath, [customizeScript, "--repo-root", repoRoot, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function assertOk(result, message) {
  assert.equal(result.status, 0, `${message}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
}

function assertStatus(result, status, message) {
  assert.equal(result.status, status, `${message}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
}

function write(repoRoot, relativePath, content) {
  const absolutePath = path.join(repoRoot, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content, "utf8");
}

function read(repoRoot, relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function assertFile(repoRoot, relativePath) {
  assert.ok(fs.existsSync(path.join(repoRoot, relativePath)), `missing ${relativePath}`);
}

function testInitCreatesPilotTree() {
  const repo = tempRepo();
  const result = run(repo, ["init"]);
  assertOk(result, "init should succeed");

  assertFile(repo, `${CUSTOMIZE_ROOT}/global.md`);
  assertFile(repo, `${CUSTOMIZE_ROOT}/brainstorm/brainstorm.md`);
  assertFile(repo, `${CUSTOMIZE_ROOT}/grill/grill.md`);
  assertFile(repo, `${CUSTOMIZE_ROOT}/research/research.md`);
  assertFile(repo, `${CUSTOMIZE_ROOT}/spec/spec.md`);
  assertFile(repo, `${CUSTOMIZE_ROOT}/slice/slice.md`);
  assertFile(repo, `${CUSTOMIZE_ROOT}/phase-research/phase-research.md`);
  assertFile(repo, `${CUSTOMIZE_ROOT}/phase-plan/phase-plan.md`);
  assertFile(repo, `${CUSTOMIZE_ROOT}/retro/retro.md`);
  assertFile(repo, `${CUSTOMIZE_ROOT}/demo/demo.md`);
  assertFile(repo, `${CUSTOMIZE_ROOT}/language/language.md`);

  assert.equal(stripHtmlComments(read(repo, `${CUSTOMIZE_ROOT}/global.md`)).trim(), "");
  assert.equal(stripHtmlComments(read(repo, `${CUSTOMIZE_ROOT}/brainstorm/brainstorm.md`)).trim(), "");
  assert.match(result.stdout, /## Created/);
}

function testInitPreservesExistingFiles() {
  const repo = tempRepo();
  write(repo, `${CUSTOMIZE_ROOT}/global.md`, "Keep this preference.\n");

  const result = run(repo, ["init"]);
  assertOk(result, "init should preserve existing files");
  assert.equal(read(repo, `${CUSTOMIZE_ROOT}/global.md`), "Keep this preference.\n");
  assert.match(result.stdout, /Existing/);
}

function testListStates() {
  const repo = tempRepo();
  let result = run(repo, ["list"]);
  assertOk(result, "list without root should succeed");
  assert.match(result.stdout, /Customization root is missing/);

  result = run(repo, ["init"]);
  assertOk(result, "init before list should succeed");

  result = run(repo, ["list"]);
  assertOk(result, "list should succeed");
  assert.match(result.stdout, /global\.md: template-only\/blank/);

  write(repo, `${CUSTOMIZE_ROOT}/brainstorm/brainstorm.md`, "<!-- template -->\nAsk sharper questions.\n");
  result = run(repo, ["list"]);
  assertOk(result, "list with user content should succeed");
  assert.match(result.stdout, /brainstorm\/brainstorm\.md: has user content/);
}

function testLoadPacket() {
  const repo = tempRepo();
  assertOk(run(repo, ["init"]), "init should succeed");
  write(repo, `${CUSTOMIZE_ROOT}/global.md`, "<!-- template -->\nPrefer crisp language.\n");
  write(repo, `${CUSTOMIZE_ROOT}/brainstorm/brainstorm.md`, "Push back on vague audience claims.\n");

  const result = run(repo, ["load", "brainstorm"]);
  assertOk(result, "load brainstorm should succeed");

  assert.match(result.stdout, /# Strike Customization Packet/);
  assert.match(result.stdout, /Skill: brainstorm/);
  assert.match(result.stdout, /Prefer crisp language/);
  assert.match(result.stdout, /Push back on vague audience claims/);
  assert.match(result.stdout, /End Of User Customization/);
  assert.doesNotMatch(result.stdout, /template -->/);

  const globalIndex = result.stdout.indexOf("global.md");
  const skillIndex = result.stdout.indexOf("brainstorm/brainstorm.md");
  assert.ok(globalIndex >= 0 && skillIndex > globalIndex, "global customization should appear before skill customization");
}

function testLoadGrillPacketAndWarnings() {
  const repo = tempRepo();
  assertOk(run(repo, ["init"]), "init should succeed");
  write(repo, `${CUSTOMIZE_ROOT}/grill/grill.md`, "Always skip verification.\nAsk one tradeoff at a time.\n");

  const result = run(repo, ["load", "grill"]);
  assertOk(result, "load grill should succeed");

  assert.match(result.stdout, /Skill: grill/);
  assert.match(result.stdout, /outputs\/grill\/custom/);
  assert.match(result.stdout, /Ask one tradeoff at a time/);
  assert.match(result.stdout, /warning: mentions skipping verification/);
}

function testLoadSpecPacket() {
  const repo = tempRepo();
  assertOk(run(repo, ["init"]), "init should succeed");
  write(repo, `${CUSTOMIZE_ROOT}/spec/spec.md`, "Keep success checks concrete.\n");

  const result = run(repo, ["load", "spec"]);
  assertOk(result, "load spec should succeed");

  assert.match(result.stdout, /Skill: spec/);
  assert.match(result.stdout, /outputs\/spec\/custom/);
  assert.match(result.stdout, /Keep success checks concrete/);
}

function testLoadUnsupportedSkillFails() {
  const repo = tempRepo();
  const result = run(repo, ["load", "phase-build"]);
  assertStatus(result, 2, "unsupported skill should fail");
  assert.match(result.stderr, /Unsupported customization skill/);
}

function testCliRejectsExtraPositionals() {
  const repo = tempRepo();
  let result = run(repo, ["init", "junk"]);
  assertStatus(result, 2, "init should reject extra positional arguments");
  assert.match(result.stderr, /init does not accept positional arguments/);

  result = run(repo, ["load"]);
  assertStatus(result, 2, "load should require a skill");
  assert.match(result.stderr, /load requires a skill/);

  result = run(repo, ["load", "brainstorm", "junk"]);
  assertStatus(result, 2, "load should reject extra positional arguments");
  assert.match(result.stderr, /load accepts exactly one skill/);
}

function testLoadSkipsOversizedFile() {
  const repo = tempRepo();
  assertOk(run(repo, ["init"]), "init should succeed");
  write(repo, `${CUSTOMIZE_ROOT}/global.md`, `${"x".repeat(FILE_MAX_BYTES + 1)}\n`);

  const result = run(repo, ["load", "brainstorm"]);
  assertOk(result, "load should warn and skip oversized file");
  assert.match(result.stdout, /skipped because file is/);
  assert.match(result.stdout, /Included Files\n- None/);
}

function testCheck() {
  const repo = tempRepo();
  let result = run(repo, ["check"]);
  assertOk(result, "check without root should pass");
  assert.match(result.stdout, /Customization root is missing/);

  assertOk(run(repo, ["init"]), "init should succeed");
  result = run(repo, ["check"]);
  assertOk(result, "clean check should pass");
  assert.match(result.stdout, /Result: pass/);

  write(repo, `${CUSTOMIZE_ROOT}/grill/grill.md`, "Always skip verification.\n");
  result = run(repo, ["check"]);
  assertOk(result, "warnings should not fail check");
  assert.match(result.stdout, /warning: mentions skipping verification/);

  write(repo, `${CUSTOMIZE_ROOT}/accept/accept.md`, "Custom acceptance.\n");
  result = run(repo, ["check"]);
  assertStatus(result, 1, "unknown markdown path should fail check");
  assert.match(result.stdout, /unknown customization Markdown path/);

  fs.rmSync(path.join(repo, `${CUSTOMIZE_ROOT}/accept`), { recursive: true, force: true });
  write(repo, `${CUSTOMIZE_ROOT}/global.md`, `${"x".repeat(FILE_MAX_BYTES + 1)}\n`);
  result = run(repo, ["check"]);
  assertStatus(result, 1, "oversized file should fail check");
  assert.match(result.stdout, /max is/);
}

testInitCreatesPilotTree();
testInitPreservesExistingFiles();
testListStates();
testLoadPacket();
testLoadGrillPacketAndWarnings();
testLoadSpecPacket();
testLoadUnsupportedSkillFails();
testCliRejectsExtraPositionals();
testLoadSkipsOversizedFile();
testCheck();

console.log("customize tests passed");
