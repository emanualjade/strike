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
  SUPPORTED_SKILLS,
} from "../plugins/strike/references/scripts/customize.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const customizeScript = path.join(root, "plugins/strike/references/scripts/customize.mjs");
const entryPoints = ["global", ...SUPPORTED_SKILLS];

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

function canonical(entryPoint) {
  return `${CUSTOMIZE_ROOT}/${entryPoint}/${entryPoint}.md`;
}

function howTo(entryPoint) {
  return `${CUSTOMIZE_ROOT}/${entryPoint}/how-to-customize-${entryPoint}.md`;
}

function write(repoRoot, relativePath, content) {
  const absolutePath = path.join(repoRoot, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content, "utf8");
}

function read(repoRoot, relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function exists(repoRoot, relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function assertFile(repoRoot, relativePath) {
  assert.ok(exists(repoRoot, relativePath), `missing ${relativePath}`);
  assert.ok(fs.statSync(path.join(repoRoot, relativePath)).isFile(), `not a file: ${relativePath}`);
}

function testInitCreatesBlankCanonicalFilesAndHowToDocs() {
  const repo = tempRepo();
  const result = run(repo, ["init"]);
  assertOk(result, "init should succeed");

  for (const entryPoint of entryPoints) {
    assertFile(repo, canonical(entryPoint));
    assertFile(repo, howTo(entryPoint));
    assert.equal(read(repo, canonical(entryPoint)), "", `${canonical(entryPoint)} should be blank`);
    assert.match(read(repo, howTo(entryPoint)), /Strike never loads this file/);
  }

  assert.match(result.stdout, /Root: strike\/customize/);
  assert.match(result.stdout, /## Created/);
}

function testInitPreservesExistingFilesAndStrikeContent() {
  const repo = tempRepo();
  write(repo, "strike/other-tool/notes.md", "Do not touch me.\n");
  write(repo, canonical("global"), "Keep this preference.\n");
  write(repo, howTo("global"), "My local how-to edits.\n");

  const result = run(repo, ["init"]);
  assertOk(result, "init should preserve existing files");

  assert.equal(read(repo, "strike/other-tool/notes.md"), "Do not touch me.\n");
  assert.equal(read(repo, canonical("global")), "Keep this preference.\n");
  assert.equal(read(repo, howTo("global")), "My local how-to edits.\n");
  assert.match(result.stdout, /Existing/);
}

function testInitFailsWhenStrikePathIsBlocked() {
  const repo = tempRepo();
  write(repo, "strike", "not a directory\n");

  const result = run(repo, ["init"]);
  assertStatus(result, 2, "init should fail when strike is a file");
  assert.match(result.stderr, /strike: expected a directory/);
}

function testInitFailsWhenCustomizePathIsBlocked() {
  const repo = tempRepo();
  write(repo, "strike/customize", "not a directory\n");

  const result = run(repo, ["init"]);
  assertStatus(result, 2, "init should fail when strike/customize is a file");
  assert.match(result.stderr, /strike\/customize: expected a directory/);
}

function testInitFailsWhenEntryPointDirectoryIsBlocked() {
  const repo = tempRepo();
  write(repo, `${CUSTOMIZE_ROOT}/brainstorm`, "not a directory\n");

  const result = run(repo, ["init"]);
  assertStatus(result, 2, "init should fail when an entry point path is a file");
  assert.match(result.stderr, /strike\/customize\/brainstorm: expected a directory/);
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
  assert.match(result.stdout, /global\/global\.md: blank/);

  write(repo, canonical("brainstorm"), "Ask sharper questions.\n");
  result = run(repo, ["list"]);
  assertOk(result, "list with user content should succeed");
  assert.match(result.stdout, /brainstorm\/brainstorm\.md: has user content/);
}

function testLoadPacket() {
  const repo = tempRepo();
  assertOk(run(repo, ["init"]), "init should succeed");
  write(repo, canonical("global"), "Prefer crisp language.\n");
  write(repo, canonical("brainstorm"), "Push back on vague audience claims.\n");
  write(repo, howTo("brainstorm"), "THIS HOW-TO SHOULD NOT LOAD.\n");
  write(repo, `${CUSTOMIZE_ROOT}/brainstorm/forms.md`, "THIS NOTE SHOULD NOT LOAD.\n");
  write(repo, "docs/strike/customize/global.md", "THIS LEGACY GLOBAL SHOULD NOT LOAD.\n");
  write(repo, "docs/strike/customize/brainstorm/brainstorm.md", "THIS LEGACY SKILL SHOULD NOT LOAD.\n");

  const result = run(repo, ["load", "brainstorm"]);
  assertOk(result, "load brainstorm should succeed");

  assert.match(result.stdout, /# Strike Customization Packet/);
  assert.match(result.stdout, /Skill: brainstorm/);
  assert.match(result.stdout, /Prefer crisp language/);
  assert.match(result.stdout, /Push back on vague audience claims/);
  assert.match(result.stdout, /End Of User Customization/);
  assert.doesNotMatch(result.stdout, /THIS HOW-TO SHOULD NOT LOAD/);
  assert.doesNotMatch(result.stdout, /THIS NOTE SHOULD NOT LOAD/);
  assert.doesNotMatch(result.stdout, /THIS LEGACY GLOBAL SHOULD NOT LOAD/);
  assert.doesNotMatch(result.stdout, /THIS LEGACY SKILL SHOULD NOT LOAD/);

  const globalIndex = result.stdout.indexOf("global/global.md");
  const skillIndex = result.stdout.indexOf("brainstorm/brainstorm.md");
  assert.ok(globalIndex >= 0 && skillIndex > globalIndex, "global customization should appear before skill customization");
}

function testLoadGrillPacketAndWarnings() {
  const repo = tempRepo();
  assertOk(run(repo, ["init"]), "init should succeed");
  write(repo, canonical("grill"), "Always skip verification.\nAsk one tradeoff at a time.\n");

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
  write(repo, canonical("spec"), "Keep success checks concrete.\n");

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
  write(repo, canonical("global"), `${"x".repeat(FILE_MAX_BYTES + 1)}\n`);

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

  write(repo, canonical("grill"), "Always skip verification.\n");
  result = run(repo, ["check"]);
  assertOk(result, "warnings should not fail check");
  assert.match(result.stdout, /warning: mentions skipping verification/);

  write(repo, `${CUSTOMIZE_ROOT}/brainstorm/forms.md`, "Prefer short forms.\n");
  write(repo, `${CUSTOMIZE_ROOT}/brainstorm/nested/forms.md`, "Prefer nested form notes.\n");
  write(repo, `${CUSTOMIZE_ROOT}/security.md`, "Prefer explicit threat model notes.\n");
  write(repo, `${CUSTOMIZE_ROOT}/notes/review-style.md`, "Prefer concise review notes.\n");
  write(repo, howTo("demo"), "Always skip verification in this guidance doc.\n");
  result = run(repo, ["check"]);
  assertOk(result, "extra files and how-to docs should not fail check");
  assert.doesNotMatch(result.stdout, /unknown customization Markdown path/);
  assert.doesNotMatch(result.stdout, /demo\/how-to-customize-demo\.md: warning/);

  write(repo, canonical("global"), `${"x".repeat(FILE_MAX_BYTES + 1)}\n`);
  result = run(repo, ["check"]);
  assertStatus(result, 1, "oversized canonical file should fail check");
  assert.match(result.stdout, /max is/);
}

function testCheckFailsWhenCanonicalPathIsDirectory() {
  const repo = tempRepo();
  assertOk(run(repo, ["init"]), "init should succeed");
  fs.rmSync(path.join(repo, canonical("spec")));
  fs.mkdirSync(path.join(repo, canonical("spec")), { recursive: true });

  const result = run(repo, ["check"]);
  assertStatus(result, 1, "canonical path as directory should fail check");
  assert.match(result.stdout, /spec\/spec\.md: expected a file/);
}

testInitCreatesBlankCanonicalFilesAndHowToDocs();
testInitPreservesExistingFilesAndStrikeContent();
testInitFailsWhenStrikePathIsBlocked();
testInitFailsWhenCustomizePathIsBlocked();
testInitFailsWhenEntryPointDirectoryIsBlocked();
testListStates();
testLoadPacket();
testLoadGrillPacketAndWarnings();
testLoadSpecPacket();
testLoadUnsupportedSkillFails();
testCliRejectsExtraPositionals();
testLoadSkipsOversizedFile();
testCheck();
testCheckFailsWhenCanonicalPathIsDirectory();

console.log("customize tests passed");
