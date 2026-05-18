#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ARTIFACT_BODY_MAX,
  PROJECT_BODY_MAX,
  createDemoSlug,
  createPhaseSlug,
  createProjectSlug,
} from "../plugins/strike/references/scripts/slugify.mjs";

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

assert.equal(createProjectSlug("Add user profile page").slug, "user-profile-page");
assert.equal(createProjectSlug("Add --dry-run flag").slug, "dry-run-flag");
assert.equal(createProjectSlug("Add auth").slug, "auth");
assert.equal(
  createProjectSlug("Add user profile page!!! @#$ 100% / edit & view").slug,
  "user-profile-page-100-edit-view",
);
assert.equal(
  createProjectSlug("Add user profile page", { dropLeadingWords: false }).slug,
  "add-user-profile-page",
);
assertThrowsMessage(() => createProjectSlug("!!! @#$"), /project slug/);

const longProject = createProjectSlug(
  "Add user profile page with a much longer name that should be pleasant to use repeatedly in commands",
).slug;
assert.ok(longProject.length <= PROJECT_BODY_MAX);
assert.ok(!longProject.endsWith("-"));

const takenLongProject = createProjectSlug("A very long generated slug name that should stay inside the cap", {
  taken: [createProjectSlug("A very long generated slug name that should stay inside the cap").slug],
}).slug;
assert.ok(takenLongProject.length <= PROJECT_BODY_MAX);
assert.ok(takenLongProject.endsWith("-2"));

assert.deepEqual(createPhaseSlug("Profile form foundation", { index: 1 }), {
  body: "profile-form-foundation",
  slug: "01-profile-form-foundation",
});
assert.equal(
  createPhaseSlug("Profile form foundation", {
    index: 1,
    taken: ["01-profile-form-foundation"],
  }).slug,
  "01-profile-form-foundation-2",
);
assert.equal(createPhaseSlug("Profile form foundation", { index: "09" }).slug, "09-profile-form-foundation");
assertThrowsMessage(() => createPhaseSlug("Profile form foundation", { index: 100 }), /1 to 99/);
assertThrowsMessage(() => createPhaseSlug("Profile form foundation", { index: "1e2" }), /1 to 99/);
const longPhase = createPhaseSlug("Build an extremely long profile management surface for several preferences", {
  index: 2,
}).body;
assert.ok(longPhase.length <= ARTIFACT_BODY_MAX);
assert.ok(!longPhase.endsWith("-"));
assertThrowsMessage(() => createPhaseSlug("!!! @#$", { index: 1 }), /phase slug/);

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
assertThrowsMessage(() => createDemoSlug("🫠", { index: 1 }), /demo slug/);
assertThrowsMessage(() => createDemoSlug("Mobile flow options", { index: 0 }), /1 to 99/);

assert.equal(cli(["project", "--text", "Add user profile page"]), "slug=user-profile-page");
assert.equal(
  cli(["phase", "--text", "Profile form foundation", "--index", "09"]),
  "slug=09-profile-form-foundation\nbody=profile-form-foundation",
);
assert.equal(
  cli(["phase", "--text", "Profile form foundation", "--index", "1"]),
  "slug=01-profile-form-foundation\nbody=profile-form-foundation",
);
assertThrowsMessage(
  () => cli(["phase", "--text", "Profile form foundation", "--index", "1e2"]),
  /1 to 99/,
);
assert.equal(
  cli(["demo", "--text", "Mobile flow options", "--index", "2"]),
  "filename=02-mobile-flow-options.html\nslug=02-mobile-flow-options\nbody=mobile-flow-options",
);

console.log("slugify tests passed");
