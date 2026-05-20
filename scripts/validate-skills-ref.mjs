#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillsRootRelative = "plugins/strike/skills";
const skillsRoot = path.join(root, skillsRootRelative);

function fail(message, exitCode = 1) {
  console.error(message);
  process.exit(exitCode);
}

function resolveBinary(command) {
  const pathEntries = (process.env.PATH || "").split(path.delimiter).filter(Boolean);
  const extensions = process.platform === "win32"
    ? (process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM").split(";")
    : [""];

  for (const entry of pathEntries) {
    for (const extension of extensions) {
      const candidate = path.join(entry, `${command}${extension}`);
      try {
        fs.accessSync(candidate, fs.constants.X_OK);
        return candidate;
      } catch {
        // Continue searching PATH.
      }
    }
  }
  return null;
}

function skillDirectories() {
  if (!fs.existsSync(skillsRoot)) {
    fail(`Missing skills directory: ${skillsRootRelative}`);
  }
  if (!fs.statSync(skillsRoot).isDirectory()) {
    fail(`Expected a directory: ${skillsRootRelative}`);
  }

  const skills = fs.readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  if (skills.length === 0) {
    fail(`No skill directories found under ${skillsRootRelative}`);
  }
  return skills;
}

function printOutput(label, text) {
  const trimmed = String(text || "").trimEnd();
  if (!trimmed) {
    return;
  }
  console.error(`--- ${label} ---`);
  console.error(trimmed);
}

const skills = skillDirectories();
const skillsRef = resolveBinary("skills-ref");

if (!skillsRef) {
  fail(
    [
      "`skills-ref` was not found on PATH.",
      "Install or otherwise make the Agent Skills reference validator available, then rerun `pnpm run validate:skills-ref`.",
    ].join("\n"),
    127,
  );
}

const results = [];

for (const skill of skills) {
  const skillRelativePath = path.join(skillsRootRelative, skill);
  const skillAbsolutePath = path.join(root, skillRelativePath);
  const skillFile = path.join(skillAbsolutePath, "SKILL.md");

  if (!fs.existsSync(skillFile) || !fs.statSync(skillFile).isFile()) {
    console.error(`FAIL ${skill}: missing SKILL.md`);
    results.push({ skill, status: "failed", reason: "missing SKILL.md" });
    continue;
  }

  const result = spawnSync(skillsRef, ["validate", skillRelativePath], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
    shell: false,
  });

  if (result.error) {
    console.error(`FAIL ${skill}: failed to start skills-ref: ${result.error.message}`);
    results.push({ skill, status: "failed", reason: result.error.message });
    continue;
  }

  const exitCode = typeof result.status === "number" ? result.status : 1;
  if (exitCode === 0) {
    console.log(`PASS ${skill}`);
    results.push({ skill, status: "passed" });
    continue;
  }

  console.error(`FAIL ${skill}: skills-ref exited with code ${exitCode}`);
  printOutput(`${skill} stdout`, result.stdout);
  printOutput(`${skill} stderr`, result.stderr);
  results.push({ skill, status: "failed", reason: `exit ${exitCode}` });
}

const failed = results.filter((result) => result.status === "failed");
console.log(`Validated ${results.length} skills with skills-ref: ${results.length - failed.length} passed, ${failed.length} failed.`);

if (failed.length > 0) {
  process.exit(1);
}
