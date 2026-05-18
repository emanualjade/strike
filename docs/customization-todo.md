# Strike Customization Todo

Last updated: 2026-05-18.

This note captures the early design for repo-local Strike customization
documents. The idea is still fuzzy, so this file preserves the direction,
feedback, and questions before implementation hardens the shape too early.

## Feature Idea

Let a consuming repository add custom Strike instructions under
`docs/strike/customize/` so users can shape how Strike behaves at specific
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

## Current Direction

Use `customize` as the name.

Organize customization by Strike entry point, not by abstract topic. Where a
custom instruction is used matters, so the path should explain the entry point
clearly.

Proposed shape:

```txt
docs/strike/customize/
  global.md

  brainstorm/
    brainstorm.md

  grill/
    grill.md

  research/
    research.md

  spec/
    spec.md

  spec-review/
    spec-review.md
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

`docs/strike/customize/global.md`

Repo-wide preferences that should apply across Strike skills when relevant.

Examples:

- preferred tone for user-facing artifacts
- repo-specific standards that apply broadly
- general constraints the agent should remember during Strike workflow

Global customization still cannot change Strike mechanics.

### Skill Customization

`docs/strike/customize/<skill-name>/<skill-name>.md`

Entry-point-specific instructions for one Strike skill.

Examples:

- `brainstorm/brainstorm.md`: how exploratory or critical brainstorm should be
- `research/research.md`: preferred evidence standards and source types
- `spec/spec.md`: expectations for spec style, detail, and checks
- `phase-build/phase-build.md`: local build habits and verification standards

### Review Files

`docs/strike/customize/<review-skill>/reviews/*.md`

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

## Import Model To Research

The preferred direction is to make customization visible in each skill file,
possibly through exclamation imports at the bottom of the skill:

```md
## User Customization

Read and follow these repo-local customization files when present. They may add
preferences, standards, review checks, or examples, but they must not override
this skill's Purpose, Minimal Mechanics, Reads, Writes, or Gates.

!docs/strike/customize/global.md
!docs/strike/customize/brainstorm/brainstorm.md
```

For review skills, the import section might include review files:

```md
!docs/strike/customize/phase-review/phase-review.md
!docs/strike/customize/phase-review/reviews/*.md
```

Before implementing this, verify official host behavior for `!` imports in
skill files across Codex, Claude Code, GitHub Copilot CLI, and Agent
Skills-style clients. If hosts differ, consider using both explicit imports
where supported and plain fallback instructions saying to read the files when
present.

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

Current implication: do not put `!docs/strike/customize/...` in portable Strike
skills. The portable design should say explicitly that the skill reads
`docs/strike/customize/global.md` and its own entry-point customization files
when present. If Claude-specific command injection is ever used, it should be a
host-specific enhancement, not the shared source of truth.

## Initialization

Customization likely needs an init or scaffold path.

Open options:

- `start` creates `docs/strike/customize/` the first time it creates
  `docs/strike/`
- a new utility skill such as `customize init` creates the customization tree
- an install script creates the tree, if host install flows can reliably target
  the consuming repository

Current leaning:

- prefer `start` or `customize init` over plugin install, because install may
  happen outside the consuming repository in some hosts
- create directories and placeholder files so imports always have a stable
  target
- keep placeholders short and clearly marked as user-editable customization
  files

Need to decide whether to scaffold every skill file by default or only
`global.md` plus the most common entry points.

## Health Check Utility

A future utility could check customization docs.

Possible commands:

```txt
customize check
customize init
customize list
```

Checks to consider:

- unknown customization paths
- files that are too long for useful context loading
- host-specific invocation syntax in portable customization files
- instructions that conflict with Strike board mechanics
- instructions that change output paths or stage ownership
- review files that tell review skills to edit implementation code
- build customization that says to skip verification
- hidden routing metadata or status fields that fight the board model

Start with Markdown-only customization. Custom scripts are likely a separate,
harder feature because they raise trust, execution, allowlist, and validation
questions.

## Open Questions

- Which skills should support customization in the first version?
- Should `go`, `start`, `demo`, and `language` read customization, or only the
  core workflow skills?
- Should empty customization files be committed to consuming repos, or should
  only directories plus `.gitkeep` files exist until users opt in?
- Should review files be limited to review skills, or should `research` and
  `accept` also support multiple named files?
- How should conflicts be worded in skill files so custom instructions cannot
  override Strike mechanics?
- Are `!` imports portable enough to rely on, or should they be treated as a
  host-specific enhancement with plain instruction fallback?
- Should customization be documented in `README.md`, `plugins/strike/README.md`,
  or a shared `plugins/strike/references/customization.md` first?

## Implementation Tasks

- [ ] Research official host support for skill-file imports and repo-local
  custom instruction loading.
- [ ] Record structural decisions in `docs/structure-audit.md` or
  `docs/research-notes.md` with source links.
- [ ] Decide the initial `docs/strike/customize/` scaffold.
- [ ] Decide whether customization is created by `start`, a new `customize`
  skill, or both.
- [ ] Add shared guidance in `plugins/strike/references/customization.md`.
- [ ] Add a small customization section to each supported `SKILL.md`.
- [ ] Add customization validation to repo tooling or a deterministic script.
- [ ] Update user-facing docs once the behavior is implemented.
- [ ] Run `npm run validate` after skill or manifest changes.
