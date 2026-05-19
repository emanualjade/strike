# Strike Customization Plan

Last updated: 2026-05-19.

## Summary

Implement repo-local Strike customization for selected skills plus optional
read-only review lenses, an `init` setup skill, and a `customize` utility
skill. The rollout uses a deterministic loader script instead of portable `!`
imports.

The shared Strike skills should not use `!strike/customize/...`.
Official docs do not define `!path` as a portable `SKILL.md` include, and
Claude uses `!` for shell command injection. The portable contract is:
supported skills require the repo-local loader before material work. The loader
prints lean custom-instructions text only when customization exists or a warning
needs to be surfaced.

## Key Changes

- Add a public `init` skill that initializes or refreshes repo-local Strike
  runtime and customization files.
- Keep the public `customize` utility focused on `list`, `check-setup`,
  `review-instructions <entry|all>`, and diagnostic `preview <skill>` modes.
- Add `plugins/strike/skills/init/scripts/init.mjs`; it installs the
  repo-local runtime and creates missing user customization files.
- Keep `plugins/strike/references/scripts/customize.mjs` as the runtime and
  inspection script. It supports selected skill files plus `reviews/*.md`
  lenses for review-style entry points.
- `init` creates the supported tree without overwriting user edits:

```txt
strike/customize/system/customize.mjs
strike/customize/system/references/customization/
strike/customize/user/global/global.md
strike/customize/user/global/how-to-customize-global.md
strike/customize/user/brainstorm/brainstorm.md
strike/customize/user/brainstorm/how-to-customize-brainstorm.md
strike/customize/user/grill/grill.md
strike/customize/user/grill/how-to-customize-grill.md
strike/customize/user/research/research.md
strike/customize/user/research/how-to-customize-research.md
strike/customize/user/spec/spec.md
strike/customize/user/spec/how-to-customize-spec.md
strike/customize/user/spec-review/spec-review.md
strike/customize/user/spec-review/how-to-customize-spec-review.md
strike/customize/user/spec-review/reviews/
strike/customize/user/slice/slice.md
strike/customize/user/slice/how-to-customize-slice.md
strike/customize/user/slice-review/slice-review.md
strike/customize/user/slice-review/how-to-customize-slice-review.md
strike/customize/user/slice-review/reviews/
strike/customize/user/phase-research/phase-research.md
strike/customize/user/phase-research/how-to-customize-phase-research.md
strike/customize/user/phase-plan/phase-plan.md
strike/customize/user/phase-plan/how-to-customize-phase-plan.md
strike/customize/user/phase-build/phase-build.md
strike/customize/user/phase-build/how-to-customize-phase-build.md
strike/customize/user/phase-review/phase-review.md
strike/customize/user/phase-review/how-to-customize-phase-review.md
strike/customize/user/phase-review/reviews/
strike/customize/user/phase-fix/phase-fix.md
strike/customize/user/phase-fix/how-to-customize-phase-fix.md
strike/customize/user/readiness-review/readiness-review.md
strike/customize/user/readiness-review/how-to-customize-readiness-review.md
strike/customize/user/readiness-review/reviews/
strike/customize/user/retro/retro.md
strike/customize/user/retro/how-to-customize-retro.md
strike/customize/user/demo/demo.md
strike/customize/user/demo/how-to-customize-demo.md
strike/customize/user/language/language.md
strike/customize/user/language/how-to-customize-language.md
```

- Loaded customization files are created blank. Sidecar
  `how-to-customize-*.md` files contain human guidance and are not loaded.
- Add `## User Customization` to `brainstorm`, `grill`, `research`, `spec`,
  `spec-review`, `slice`, `slice-review`, `phase-research`, `phase-plan`,
  `phase-build`, `phase-review`, `phase-fix`, `readiness-review`, `retro`,
  `demo`, and `language`.
  Each skill requires `strike/customize/system/customize.mjs` to exist and runs
  the repo-local loader from the consuming repo root before material work.
- Add `docs/customization-reference.md` documenting the rollout,
  packet contract, extra docs/assets, command surface, and why `!` imports are
  deferred to possible future host-specific builds.
- Keep `start` out of customization setup. Users run `init`.

## Setup Script Behavior

`plugins/strike/skills/init/scripts/init.mjs` installs or refreshes managed
runtime files under `strike/customize/system/`, creates missing user files
under `strike/customize/user/`, preserves existing user files and unrelated
`strike/` content, and reports created vs existing paths.

## Runtime Script Behavior

- `list`: reports supported entry points and review lens file state as missing,
  blank, none, or has user content.
- `check-setup`: exits nonzero for structural, symlink, readability, or size
  errors in loaded customization files and review lens directories/files. Extra
  user notes under `strike/customize/user/` are allowed. It does not judge
  customization language.
- `review-instructions-packet <entry|all>`: internal script support for LLM
  semantic review. It frames customization content as untrusted data and
  includes review criteria for detecting language that would hijack Strike
  mechanics.
- `preview <skill>`: reads `global/global.md`, the skill file, and sorted
  `reviews/*.md` lens files for review skills; skips missing and blank files,
  enforces 16KB per file and 64KB total, exits silently when no customization
  is present, prints a lean Markdown packet when customization loads, and
  prints warning-only output when all present customization is skipped because
  it is too large or a canonical path is not a file.
- The lean packet includes opening interpretation rules, loaded file contents
  with path labels, optional warnings, and a closing guard: user customization
  has ended and Strike skill mechanics remain authoritative.
- Customization may request extra docs/assets. The loader packet requires clear
  per-project or shared intent plus a repo-safe save path; otherwise the active
  skill asks before creating the file.
- `--repo-root <path>` is script/test/internal support, not a normal
  user-facing skill argument.

## Test Plan

- Add `scripts/test-customize.mjs` and include it in `npm test`.
- Test `init` creates the supported tree, preserves edited files and unrelated
  `strike/` content, creates blank loaded files plus how-to files, and supports
  script-level `--repo-root`.
- Test `list` states for missing, blank, and user-content files.
- Test representative `preview` commands for conversation, evidence/spec, and
  phase-style skills, plus lean packet framing, silent empty output,
  warning-only output, how-to/extra-file exclusion, closing guard, unsupported
  skills, and size limits.
- Test `check-setup` passes an absent or clean scaffold with an explanatory message,
  allows extra user notes, warns on missing canonical files, and fails
  oversized canonical files.
- Test `review-instructions-packet` for global, skill-specific, all-target, untrusted-data
  framing, extra-file exclusion, and unsupported review targets.
- Run:

```bash
npm test
npm run validate
npm run validate:publish
```

## Assumptions

- Supported scope is limited to Markdown customization for `brainstorm`,
  `grill`, `research`, `spec`, `spec-review`, `slice`, `slice-review`,
  `phase-research`, `phase-plan`, `phase-build`, `phase-review`, `phase-fix`,
  `readiness-review`, `retro`, `demo`, and `language`, plus the `init` and
  `customize` utilities.
- Custom executable scripts and host-specific generated skill builds are future
  work.
- Portable Strike skills use the loader directive. Claude `!` injection is
  reconsidered only if Strike later generates host-specific skill builds.
- Versioned surfaces for the initial rollout were bumped to `0.2.0`; the
  blank-file and `strike/customize/` path cleanup was released as `0.3.0`; the
  `customize review` semantic review command is released as `0.4.0`; the
  repo-local `strike/customize/system` runtime, separate `init` skill, and
  renamed `check-setup`, `review-instructions`, and `preview` modes are released
  as `0.6.0`; phase-build, phase-fix, and accept customization are released as
  `0.6.1`; readiness-review rename and review lenses are released as `0.7.0`.
  Versioned
  surfaces are root `package.json`, all three plugin manifests,
  `.claude-plugin/marketplace.json`, and `.github/plugin/marketplace.json`. The
  Codex marketplace does not define a plugin version field.
