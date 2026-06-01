#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEMO_BODY_MAX, createDemoSlug, slugifyText, shortenSlug } from "../plugins/strike/references/scripts/slugify.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const slugifyScript = path.join(root, "plugins/strike/references/scripts/slugify.mjs");

function assertThrowsMessage(fn, pattern) {
  assert.throws(fn, (error) => pattern.test(error.message));
}

function cli(args) {
  return execFileSync(process.execPath, [slugifyScript, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

assert.equal(slugifyText("Mobile flow options!!! @#$ 100% / edit & view"), "mobile-flow-options-100-edit-view");
assert.equal(shortenSlug("mobile-flow-options-for-a-very-long-planning-comparison", 24), "mobile-flow-options-for");

assert.deepEqual(createDemoSlug("Mobile flow options", { index: 2 }), {
  body: "mobile-flow-options",
  filename: "02-mobile-flow-options.html",
  slug: "02-mobile-flow-options",
});
assert.equal(
  createDemoSlug("Mobile flow options", {
    index: 2,
    taken: ["02-mobile-flow-options.html"],
  }).filename,
  "02-mobile-flow-options-2.html",
);
assert.equal(createDemoSlug("Dashboard states", { ext: ".HTML", index: 3 }).filename, "03-dashboard-states.html");
const longDemo = createDemoSlug("Build an extremely long planning surface for several preferences", {
  index: 2,
}).body;
assert.ok(longDemo.length <= DEMO_BODY_MAX);
assert.ok(!longDemo.endsWith("-"));
assertThrowsMessage(() => createDemoSlug("🫠", { index: 1 }), /demo slug/);
assertThrowsMessage(() => createDemoSlug("Mobile flow options", { index: 0 }), /1 to 99/);

assertThrowsMessage(
  () => cli(["project", "--text", "Add user profile page"]),
  /Usage: slugify\.mjs demo/,
);
assert.equal(
  cli(["demo", "--text", "Mobile flow options", "--index", "2"]),
  "filename=02-mobile-flow-options.html\nslug=02-mobile-flow-options\nbody=mobile-flow-options",
);

console.log("slugify tests passed");
