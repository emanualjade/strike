# Strike Single-File Customization Plan

Last updated: 2026-05-18.

## Summary

Implement repo-local Strike customization for selected single-file skills plus
a `customize` utility skill. The rollout uses a deterministic loader script
instead of portable `!` imports.

The shared Strike skills should not use `!strike/customize/...`.
Official docs do not define `!path` as a portable `SKILL.md` include, and
Claude uses `!` for shell command injection. The portable contract is:
supported skills run the bundled loader before material work, and the loader
prints a framed customization packet.

## Key Changes

- Add a public `customize` utility skill with `init`, `list`, `check`, and
  diagnostic `load <skill>` modes.
- Add `plugins/strike/references/scripts/customize.mjs`; it supports selected
  single-file skills and intentionally skips review/multi-file entries.
- `customize init` creates the supported tree without overwriting user edits:

```txt
strike/customize/global/global.md
strike/customize/global/how-to-customize-global.md
strike/customize/brainstorm/brainstorm.md
strike/customize/brainstorm/how-to-customize-brainstorm.md
strike/customize/grill/grill.md
strike/customize/grill/how-to-customize-grill.md
strike/customize/research/research.md
strike/customize/research/how-to-customize-research.md
strike/customize/spec/spec.md
strike/customize/spec/how-to-customize-spec.md
strike/customize/slice/slice.md
strike/customize/slice/how-to-customize-slice.md
strike/customize/phase-research/phase-research.md
strike/customize/phase-research/how-to-customize-phase-research.md
strike/customize/phase-plan/phase-plan.md
strike/customize/phase-plan/how-to-customize-phase-plan.md
strike/customize/retro/retro.md
strike/customize/retro/how-to-customize-retro.md
strike/customize/demo/demo.md
strike/customize/demo/how-to-customize-demo.md
strike/customize/language/language.md
strike/customize/language/how-to-customize-language.md
```

- Loaded customization files are created blank. Sidecar
  `how-to-customize-*.md` files contain human guidance and are not loaded.
- Add `## User Customization` to `brainstorm`, `grill`, `research`, `spec`,
  `slice`, `phase-research`, `phase-plan`, `retro`, `demo`, and `language`.
  Each skill resolves the bundled script by absolute path from the installed
  plugin package and runs `load <skill>` from the consuming repo root before
  material work.
- Add `plugins/strike/references/customization.md` documenting the rollout,
  packet contract, additive files, command surface, and why `!` imports are
  deferred to possible future host-specific builds.
- Keep `start` out of customization setup. Users run `customize init`.

## Script Behavior

- `init`: creates missing customization files/directories, preserves existing
  files and unrelated `strike/` content, and reports created vs existing paths.
- `list`: reports supported entry points and file state as missing,
  blank, or has user content.
- `check`: exits nonzero only for structural or size errors in canonical loaded
  files. Extra user notes under `strike/customize/` are allowed. Heuristic
  mechanic-conflict phrases produce warnings, not failures.
- `load <skill>`: reads `global/global.md` then the skill file, skips missing
  and blank files, enforces 16KB per file and 64KB total, and prints a
  Markdown packet.
- The packet includes opening interpretation rules, loaded file contents with
  path labels, and a closing guard: user customization has ended and Strike
  skill mechanics remain authoritative.
- Customization may request additive files. Each supported skill names its
  preferred custom output location in the loader packet and `SKILL.md`.
- `--repo-root <path>` is script/test/internal support, not a normal
  user-facing skill argument.

## Test Plan

- Add `scripts/test-customize.mjs` and include it in `npm test`.
- Test `init` creates the supported tree, preserves edited files and unrelated
  `strike/` content, creates blank loaded files plus how-to files, and supports
  script-level `--repo-root`.
- Test `list` states for missing, blank, and user-content files.
- Test representative `load` commands for conversation, evidence/spec, and
  phase-style skills, plus packet framing, how-to/extra-file exclusion,
  closing guard, unsupported skills, missing customization root, and size
  limits.
- Test `check` passes an absent or clean scaffold with an explanatory message,
  allows extra user notes, fails oversized canonical files, and emits warnings
  for suspicious mechanic-changing phrases.
- Run:

```bash
npm test
npm run validate
npm run validate:publish
```

## Assumptions

- Supported scope is limited to single-file customization for `brainstorm`,
  `grill`, `research`, `spec`, `slice`, `phase-research`, `phase-plan`,
  `retro`, `demo`, `language`, plus the `customize` utility.
- Review files, custom scripts, phase-build/phase-fix/acceptance customization,
  and host-specific generated skill builds are future work.
- Portable Strike skills use the loader directive. Claude `!` injection is
  reconsidered only if Strike later generates host-specific skill builds.
- Versioned surfaces for the initial rollout were bumped to `0.2.0`; the
  blank-file and `strike/customize/` path cleanup is released as `0.3.0`: root
  `package.json`, all three plugin manifests, `.claude-plugin/marketplace.json`,
  and `.github/plugin/marketplace.json`. The Codex marketplace does not define
  a plugin version field.
