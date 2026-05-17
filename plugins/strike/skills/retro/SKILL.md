---
name: retro
description: Capture workflow lessons and move accepted Strike work to done.
argument-hint: "[feature-slug]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, MultiEdit, Bash, Grep, Glob
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
workflow, not relitigating product scope.

Keep it plain: Markdown sections, prose, and checkboxes. Do not create IDs,
YAML blocks, status fields, or routing metadata.

## Host Invocation

When showing follow-up Strike skills, use the plugin package's
`references/invocation.md` to render the current host's syntax. Do not copy
`/strike:*` examples unchanged unless the current host is Claude Code. When
the host is unknown, show the skill name and arguments as a plain next action
without raw field labels.

## State Model

Board location is state. This skill may work only when the card pointer is in:

```txt
docs/strike/board/08-retro/<feature-slug>.md
```

If the pointer is in another lane, stop and recommend:

```txt
Reset context first: yes
Next Strike skill: go
Arguments: <feature-slug>
```

Keep retro scoped to this feature's Strike artifacts plus any dogfood
rollback verification paths named by acceptance.

## Reads

- board pointer
- `cards/<feature-slug>/card.md`
- `outputs/brainstorm/brainstorm.md`
- `outputs/grill/grill.md`
- `outputs/research/research.md` if present
- `outputs/spec/spec.md`
- every phase `plan.md`, `build-brief.md`, `build.md`, `review.md`, and
  `fix.md` that exists
- `outputs/acceptance/acceptance.md`
- current `git status --short`

## Dogfood Rollback Gate

If `acceptance.md` includes `Dogfood Cleanup Before Retro` or any dogfood
rollback section with exact app-code rollback commands, verify those app-code
changes are already gone before writing retro.

Examples:

- A tracked file named in a rollback command like
  `git restore -- src/routes/app/workspace/index.tsx` should not appear as
  modified in `git status --short`.
- A new file named in a rollback command like
  `rm src/components/workspace/workspace-category-card.tsx` should not exist.

If dogfood app-code changes remain, stop. Do not write retro yet. Print the
exact rollback commands from `acceptance.md`, then tell the user to rerun:

```txt
Reset context first: yes
Next Strike skill: retro
Arguments: <feature-slug>
```

Do not run rollback inside retro.

## Writes

- `outputs/retro/retro.md`
- `card.md`
- board pointer moved from `08-retro` to `09-done`

Write `retro.md` as plain Markdown with verdict, what helped, what hurt or
felt brittle, Strike improvements, product/engineering follow-ups, and
dogfood cleanup when relevant.

## Retro Lenses

Capture:

- what made the feature workflow smoother across a context reset
- what felt brittle, confusing, or over-mechanical
- where a skill gave the wrong next action or hid the real state
- where validation was useful versus excessive
- concrete Strike improvements to keep, change, add, or defer
- product/engineering follow-ups that should not block closing this workflow

Prefer observations grounded in artifacts and terminal evidence. If the user
gave explicit feedback during the run, include it. If a lesson is inferred,
say so plainly.

## Card Update

When retro is written:

- mark the retro checklist item complete
- add a short note pointing to `outputs/retro/retro.md`
- if dogfood rollback was required and verified clean, note that cleanup was
  complete before retro
- move the board pointer to `09-done`

## Moving The Board

Use a normal filesystem move, not `git mv`; board pointers may be untracked
during dogfooding. After the move, verify exactly one pointer exists for the
feature slug under `docs/strike/board/*/`.

## Output

Final response should be short and user-facing:

- retro path written
- top two or three lessons
- dogfood cleanup status, if applicable
- board moved to `09-done`
- no next Strike handoff unless follow-up work remains

## Gates

- Do not edit app code.
- Do not run dogfood rollback.
- Do not write retro while dogfood app-code changes remain.
- Do not create durable IDs or hidden state fields.
- Do not commit.
