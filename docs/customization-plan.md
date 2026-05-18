# Strike Customization Implementation Plan

Last updated: 2026-05-18.

## Summary

Implement repo-local Strike customization through a new `customize` utility
skill plus a deterministic Node loader.

Do not use `!` imports. Official docs do not make `!path` a portable
`SKILL.md` include, and Claude uses `!` for shell command injection. The
portable contract is: supported Strike skills run the bundled loader before
material work, and the loader prints a clear customization packet.

## Key Changes

- Add a new `customize` utility skill with `init`, `check`, and `list` modes.
- Add a bundled script at
  `plugins/strike/references/scripts/customize.mjs` with subcommands:
  - `init`: create the full `docs/strike/customize/` tree in the consuming repo
    without overwriting existing files.
  - `list`: show supported customization entry points and existing non-empty
    customization files.
  - `check`: validate customization structure, size limits, unknown paths, and
    likely mechanic-conflicting instructions.
  - `load <skill-name>`: print the deterministic customization packet that
    workflow skills use.
- Scaffold the full tree by entry point:
  - `global.md`
  - one zero-byte file per supported skill at
    `docs/strike/customize/<skill>/<skill>.md`
  - review directories with `.gitkeep` for `spec-review`, `slice-review`,
    `phase-review`, and `accept`
- Support customization for `brainstorm`, `grill`, `research`, `spec`,
  `spec-review`, `slice`, `slice-review`, `phase-research`, `phase-plan`,
  `phase-build`, `phase-review`, `phase-fix`, `accept`, `retro`, `demo`, and
  `language`.
- Exclude customization from `start`, `go`, and `customize` in v1 because those
  are setup/routing utilities where repo preferences could distort mechanics.

## Implementation Details

- The loader reads, in order: `global.md`, the skill-specific file, then sorted
  `reviews/*.md` only for review-enabled entry points.
- The loader skips missing, zero-byte, and whitespace-only files; it never
  executes customization content.
- Use deterministic limits: max 16KB per file and 64KB total loaded content.
  `load` warns and skips oversized files; `check` exits nonzero for oversized
  or unknown customization files.
- `check` should fail on unknown `.md` paths under `docs/strike/customize/` and
  warn on likely conflicts such as instructions to change board lanes, output
  paths, stage ownership, or review/build tool boundaries.
- Add `plugins/strike/references/customization.md` documenting the model,
  allowed influence, forbidden mechanic overrides, script commands, and why `!`
  imports are not used.
- Add a short `## User Customization` section to each supported `SKILL.md`:
  resolve the bundled script relative to the installed plugin, run
  `customize.mjs load <skill-name>` from the consuming repo root before
  material work, and apply the packet only when it does not conflict with
  Purpose, Minimal Mechanics, Reads, Writes, or Gates.
- Add `plugins/strike/skills/customize/SKILL.md` plus `agents/openai.yaml`; the
  skill should run the bundled script instead of hand-creating files.
- Update README/plugin docs, `docs/research-notes.md` or
  `docs/structure-audit.md`, and versioned manifests.
- Bump Strike to `0.2.0` because this adds a public skill and new customization
  behavior.

## Test Plan

- Add `scripts/test-customize.mjs` and include it in `npm test`.
- Test `init` creates the full tree, preserves existing user files, and works
  with `--repo-root`.
- Test `load` ordering, empty-file skipping, review-file sorting, missing-tree
  behavior, oversized-file warnings, and unsupported skill errors.
- Test `check` passes a clean scaffold and fails unknown paths or oversized
  files.
- Run:

```bash
npm test
npm run validate
npm run validate:publish
```

## Assumptions

- The final plan file path is `docs/customization-plan.md`.
- v1 uses Markdown-only customization; custom executable review scripts are
  explicitly out of scope.
- Review files are scoped to the entry point where they live, not global
  lenses.
- `start` may mention `customize init` in docs later, but it should not
  scaffold customization itself.
