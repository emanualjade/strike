---
name: retro
description: Capture workflow lessons and move accepted Strike work to done.
argument-hint: "[project-slug]"
disable-model-invocation: true
allowed-tools: Read Write Edit MultiEdit Bash Grep Glob
---

# Strike Retro

## Communication

When speaking to the user or asking questions, use relaxed, friendly language,
like two friends talking through the work over coffee. Explain things in simple
terms without assumptions, guide with context, and simplify concepts so the
conversation feels easy to follow. Keep the conversation centered on the work
in progress; avoid explaining Strike mechanics unless that context helps the
user decide what to do next.

## Purpose

Capture lessons from a completed Strike run, especially places where the
board/card mechanics helped or got in the way. Retro is about improving the
workflow, not relitigating product or workflow scope.

Keep it plain: Markdown sections, prose, and checkboxes. Do not create IDs,
YAML blocks, status fields, or routing metadata.

## Host Invocation

When showing follow-up Strike skills, use the plugin package's
`references/invocation.md` to render the current host's syntax. Do not copy
`/strike:*` examples unchanged unless the current host is Claude Code. When
the host is unknown, show the skill name and arguments as a plain next action
without raw field labels.

## User Customization

Before material retro work, load repo-local customization for this skill.

Resolve the bundled customization script by absolute path from this installed
plugin package. This skill lives at `<plugin-root>/skills/retro/SKILL.md`; the
script lives at `<plugin-root>/references/scripts/customize.mjs`.

Run the loader from the consuming repository root:

```bash
node <plugin-root>/references/scripts/customize.mjs --repo-root <repo-root> load retro
```

Apply the printed customization packet only when it does not conflict with this
skill's Purpose, State Model, Reads, Writes, or Gates. Customization may shape
what Strike captures about workflow, product, technical, or process follow-ups
and may request extra docs/assets. Extra docs/assets are optional
user-requested outputs, not customization inputs. Create them only with clear
per-project or shared intent and a repo-safe save path. If the path or intent is
unclear, ask before creating them and suggest updating
`strike/customize/retro/retro.md` or running `customize review retro` after
editing.

## State Model

Board location is state. This skill may work only when the card pointer is in:

```txt
docs/strike/board/08-retro/<project-slug>.md
```

If the pointer is in another lane, stop and recommend:

```txt
Reset context first: yes
Next Strike skill: go
Arguments: <project-slug>
```

Keep retro scoped to this project's Strike artifacts and visible evidence from
the run.

## Reads

- board pointer
- `cards/<project-slug>/card.md`
- `outputs/brainstorm/brainstorm.md`
- `outputs/grill/grill.md`
- `outputs/research/research.md` if present
- `outputs/spec/spec.md`
- every phase `plan.md`, `build-brief.md`, `build.md`, `review.md`, and
  `fix.md` that exists
- `outputs/acceptance/acceptance.md`
- current `git status --short`

## Writes

- `outputs/retro/retro.md`
- optional user-requested docs/assets under
  `strike/user-docs/<project-slug>/retro/...`, `strike/user-docs/shared/...`, or
  another repo-safe path the current user explicitly provides or confirms
- `card.md`
- board pointer moved from `08-retro` to `09-done`

Write `retro.md` as plain Markdown with verdict, what helped, what hurt or
felt brittle, Strike improvements, and product, workflow, or engineering
follow-ups.

## Retro Lenses

Capture:

- what made the project workflow smoother across a context reset
- what felt brittle, confusing, or over-mechanical
- where a skill gave the wrong next action or hid the real state
- where validation was useful versus excessive
- concrete Strike improvements to keep, change, add, or defer
- product, workflow, or engineering follow-ups that should not block closing
  this workflow

Prefer observations grounded in artifacts and terminal evidence. If the user
gave explicit feedback during the run, include it. If a lesson is inferred,
say so plainly.

## Card Update

When retro is written:

- mark the retro checklist item complete
- add a short note pointing to `outputs/retro/retro.md`
- move the board pointer to `09-done`

## Moving The Board

Use a normal filesystem move, not `git mv`; board pointers may be untracked
while the workflow is in progress. After the move, verify exactly one pointer
exists for the project slug under `docs/strike/board/*/`.

## Output

Final response should be short and user-facing:

- retro path written
- top two or three lessons
- board moved to `09-done`
- no next Strike handoff unless follow-up work remains

## Gates

- Do not edit implementation files.
- Do not create durable IDs or hidden state fields.
- Do not commit.
