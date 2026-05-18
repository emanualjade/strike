# Strike Customization Todo

Last updated: 2026-05-18.

This note captures the early design for repo-local Strike customization
documents. The idea is still fuzzy, so this file preserves the direction,
feedback, and questions before implementation hardens the shape too early.

## Current Single-File Rollout

The first implementation supports selected single-file customization entries,
not the full customization tree. It supports:

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

The rollout adds a `customize` utility skill and a deterministic
`plugins/strike/references/scripts/customize.mjs` loader with `init`, `list`,
`check`, and `load <skill>` modes. Supported skills load a framed customization
packet before material work. Review files, custom executable scripts,
phase-build/phase-fix/acceptance customization, and host-specific generated
skill builds are future work.

## Feature Idea

Let a consuming repository add custom Strike instructions under
`strike/customize/` so users can shape how Strike behaves at specific
workflow entry points.

The purpose is not to create a general extension system. The purpose is to give
users a durable place to say things like:

- how they like brainstorm to explore ideas
- how research should gather evidence
- what spec review should care about
- what phase review should check
- how acceptance should judge readiness

Customization should shape judgment, tone, standards, examples, and review
checks. It should not override Strike mechanics, board state, output paths,
stage gates, or tool boundaries.

## Broader Future Direction

Use `customize` as the name.

Organize customization by Strike entry point, not by abstract topic. Where a
custom instruction is used matters, so the path should explain the entry point
clearly.

Proposed shape:

```txt
strike/customize/
  global/
    global.md
    how-to-customize-global.md

  brainstorm/
    brainstorm.md
    how-to-customize-brainstorm.md

  grill/
    grill.md
    how-to-customize-grill.md

  research/
    research.md
    how-to-customize-research.md

  spec/
    spec.md
    how-to-customize-spec.md

  spec-review/
    spec-review.md
    how-to-customize-spec-review.md
    reviews/
      security.md
      forms.md
      api-consistency.md

  slice/
    slice.md

  slice-review/
    slice-review.md
    reviews/
      phase-shape.md

  phase-plan/
    phase-plan.md

  phase-build/
    phase-build.md

  phase-review/
    phase-review.md
    reviews/
      security.md
      validation.md
      accessibility.md

  phase-fix/
    phase-fix.md

  accept/
    accept.md
    reviews/
      release-readiness.md

  retro/
    retro.md
```

## Concepts

Keep the first version to a small number of concepts.

### Global Customization

`strike/customize/global/global.md`

Repo-wide preferences that should apply across Strike skills when relevant.

Examples:

- preferred tone for user-facing artifacts
- repo-specific standards that apply broadly
- general constraints the agent should remember during Strike workflow

Global customization still cannot change Strike mechanics.

### Skill Customization

`strike/customize/<skill-name>/<skill-name>.md`

Each customization directory can also contain a
`how-to-customize-<skill-name>.md` guide. The how-to file is for humans and is
not loaded by Strike.

Entry-point-specific instructions for one Strike skill.

Examples:

- `brainstorm/brainstorm.md`: how exploratory or critical brainstorm should be
- `research/research.md`: preferred evidence standards and source types
- `spec/spec.md`: expectations for spec style, detail, and checks
- `phase-build/phase-build.md`: local build habits and verification standards

### Review Files

`strike/customize/<review-skill>/reviews/*.md`

Only review-like entry points should read multiple review files. Each file is a
review lens for that specific entry point, not a universal topic.

Examples:

- `spec-review/reviews/forms.md`: make sure form expectations are specified
  clearly enough before slicing or building
- `phase-review/reviews/forms.md`: inspect a built phase against local form
  implementation standards
- `accept/reviews/release-readiness.md`: check assembled project readiness
  before moving to retro

This avoids a vague top-level `lenses/` directory where it is unclear when a
topic should be applied.

## Import Model Decision

The resolved direction is to make customization visible through a
deterministic loader script, not portable `!` imports.

Each supported skill should run the bundled loader before material work:

```bash
node <plugin-root>/references/scripts/customize.mjs --repo-root <repo-root> load <skill-name>
```

The loader prints a framed packet with interpretation rules, loaded user
customization, warnings, and a closing guard. This gives the model clear
context without relying on host-specific import syntax.

### Research Note: 2026-05-18

Initial docs research does not support treating `!path` as a portable
`SKILL.md` file import.

- Codex Agent Skills docs say a skill is a directory with `SKILL.md` plus
  optional `scripts/`, `references/`, `assets/`, and `agents/` files. They
  describe progressive loading of `SKILL.md`, but do not define a `!` import
  mechanism for skill files.
- Agent Skills specification says supporting files should be referenced from
  `SKILL.md` with relative Markdown links or paths. It does not define a
  `!` import syntax.
- Claude Code skills docs define `!` as dynamic context injection for shell
  commands such as ``!`git diff HEAD` ``. This is preprocessing that runs a
  command before the skill content is sent to Claude. It is not a plain file
  include. It can also be disabled by Claude settings.
- GitHub Copilot docs say `SKILL.md` is injected when the skill is used and
  that scripts/resources can be referenced from the skill directory. They do
  not document `!` file imports for skills.

Current implication: do not put `!strike/customize/...` in portable Strike
skills. The portable design should say explicitly that the skill reads
`strike/customize/global/global.md` and its own entry-point customization file
when present. If Claude-specific command injection is ever used, it should be a
host-specific enhancement, not the shared source of truth.

## Initialization

Customization likely needs an init or scaffold path.

Open options:

- `start` creates `strike/customize/` the first time it creates
  `docs/strike/`
- a new utility skill such as `customize init` creates the customization tree
- an install script creates the tree, if host install flows can reliably target
  the consuming repository

Current leaning:

- prefer `start` or `customize init` over plugin install, because install may
  happen outside the consuming repository in some hosts
- create directories and blank loaded files so the loader always has a stable
  target
- keep loaded customization files blank and put human guidance in sidecar
  how-to files

Need to decide whether to scaffold every skill file by default or only
`global.md` plus the most common entry points.

## Health Check Utility

A future utility could check customization docs.

Possible commands:

```txt
customize check
customize init
customize list
customize review <entry|all>
```

Checks to consider:

- unexpected blocked paths where Strike needs directories or canonical files
- files that are too long for useful context loading
- host-specific invocation syntax in portable customization files

Language review belongs in `customize review <entry|all>`, not deterministic
`customize check`.

Semantic review should consider:

- instructions that conflict with Strike board mechanics
- instructions that change output paths or stage ownership
- review files that tell review skills to edit implementation code
- build customization that says to skip verification
- hidden routing metadata or status fields that fight the board model

Start with Markdown-only customization. Custom scripts are likely a separate,
harder feature because they raise trust, execution, allowlist, and validation
questions.

## Resolved In 0.2.0

- [x] Research official host support for skill-file imports and repo-local
  custom instruction loading.
- [x] Record the import decision in `docs/research-notes.md`.
- [x] Add the initial `strike/customize/` scaffold for selected
  single-file skills.
- [x] Create customization through a new `customize` utility skill, not
  `start`.
- [x] Add shared guidance in `plugins/strike/references/customization.md`.
- [x] Add a customization loader section to supported `SKILL.md` files.
- [x] Add deterministic customization validation/loading tooling.
- [x] Update user-facing docs.
- [x] Run `npm test`, `npm run validate`, `npm run validate:publish`, and
  `npm run release:validate`.

## Resolved In 0.3.0

- [x] Move customization to `strike/customize/`.
- [x] Move global customization to `strike/customize/global/global.md`.
- [x] Create loaded customization files as blank files.
- [x] Put guidance in sidecar `how-to-customize-*.md` files.
- [x] Allow extra user notes under `strike/customize/` without failing
  `customize check`.
- [x] Harden `customize init` around existing `strike/` content and blocked
  paths.

## Resolved In 0.4.0

- [x] Keep `customize check` deterministic and setup-focused.
- [x] Add `customize review <entry|all>` for LLM semantic review of
  customization language.
- [x] Add an internal review packet so file discovery stays deterministic while
  language judgment is handled by the LLM.

## Future Questions

- Should review skills support both one entry-point file and
  `reviews/*.md` lenses?
- Should `accept` get single-file customization, or should it wait for the
  review-lens model?
- Should `phase-build` and `phase-fix` support customization after we test
  write-boundary behavior?
- Should Strike ever generate host-specific skill builds where Claude-only `!`
  command injection can preload customization?
- Should custom executable review scripts exist at all, and if so, what trust,
  allowlist, and validation rules are required?
