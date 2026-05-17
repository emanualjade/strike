---
name: phase-fix
description: Fix phase-scoped review or acceptance findings and route back to review.
argument-hint: "[feature-slug] phase:<phase-slug>"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, MultiEdit, Bash, Grep, Glob, WebFetch, WebSearch
---

# Strike Phase Fix

## Communication

When speaking to the user or asking questions, use relaxed, friendly language,
like two friends talking through the work over coffee. Explain things in simple
terms without assumptions, guide with context, and simplify concepts so the
conversation feels easy to follow. Keep the conversation centered on the work
in progress; avoid explaining Strike mechanics unless that context helps the
user decide what to do next.

## Purpose

Repair blocking findings for one phase.

The usual source of truth is `phases/<phase-slug>/review.md`. When acceptance
has moved the card back to implementation, the source can instead be
phase-scoped acceptance fixes recorded in `outputs/acceptance/acceptance.md`
and `card.md`. Fix only those blocking items, rerun relevant checks, write
`fix.md`, and route back to the `phase-review` skill.

This is not a rebuild, redesign, or cleanup pass.

## Host Invocation

When showing follow-up Strike skills, use the plugin package's
`references/invocation.md` to render the current host's syntax. Do not copy
`/strike:*` examples unchanged unless the current host is Claude Code. When
the host is unknown, show the skill name and arguments as a plain next action
without raw field labels.

## Minimal Mechanics

Board location is state. This skill may work only when the card pointer is in:

```txt
docs/strike/board/06-implementation/<feature-slug>.md
```

Require an explicit phase argument:

```txt
Next Strike skill: phase-fix
Arguments: <feature-slug> phase:<phase-slug>
```

If the pointer is in another lane, or the phase cannot be resolved, stop and
recommend:

```txt
Reset context first: yes
Next Strike skill: go
Arguments: <feature-slug>
```

If `review.md` is missing, stop and recommend:

```txt
Reset context first: yes
Next Strike skill: phase-review
Arguments: <feature-slug> phase:<phase-slug>
```

If `review.md` contains no blocking fixes and there are no phase-scoped
acceptance fixes for this phase, stop and recommend:

```txt
Reset context first: yes
Next Strike skill: go
Arguments: <feature-slug>
```

Do not create review, acceptance, retro, durable IDs, YAML blocks, hidden
routing metadata, or project glossary edits.

## Reads

- board pointer
- `cards/<feature-slug>/card.md`
- `outputs/spec/spec.md`
- selected phase `plan.md`
- selected phase `build-brief.md` when present
- selected phase `build.md`
- selected phase `review.md`
- existing selected phase `fix.md` if present
- `outputs/acceptance/acceptance.md` if acceptance moved the card back to
  implementation
- current `git status --short`
- current source/test files named by the blocking fixes and build evidence

Use `review.md` to decide what to fix when review has blocking fixes. If the
card was sent back from acceptance, use only acceptance fixes explicitly
assigned to this phase. Use `spec.md`, `plan.md`, and `build-brief.md` only to
preserve the intended phase shape.

## Writes

- app/test/docs files needed to close the blocking review or acceptance
  findings
- `cards/<feature-slug>/phases/<phase-slug>/fix.md`
- `cards/<feature-slug>/card.md`
- board pointer text in `06-implementation`

The board pointer stays in `06-implementation`. Phase review is the next step.

Do not move the board pointer out of `06-implementation`. After updating
pointer text, verify exactly one pointer file exists for the feature slug.

## Fix Discipline

For each blocking item:

- apply the smallest change that resolves it
- stay inside the selected phase unless the user explicitly expands scope
- add or update only the narrow checks needed for the fix
- rerun relevant checks
- leave unrelated issues alone

If a review or acceptance item is wrong, ambiguous, or would require a
product/scope/design decision, stop and explain. Do not silently reinterpret
the finding.

If a fix requires touching broad shared code or another phase's surface, stop
and ask instead of expanding the repair.

## Verification

Run the relevant checks from the build/review evidence. For a contained fix,
targeted checks plus the project check are usually enough.

Fix failures caused by this repair. If a failure appears unrelated or repeats
after a reasonable fix, record it as an open concern instead of broadening the
phase.

Do not rerun the same successful command unless code or relevant configuration
changed.

Do not end your turn with a dev server or other task-owned process still
running.

## Fix Artifact Shape

Write `fix.md` compactly:

```md
# Fix: [Phase Name]

## Summary

[What blocking review or acceptance findings were fixed.]

Source: [Phase review or acceptance.]

## Fixes

- [x] [Review or acceptance finding] — [what changed].

## Files Changed

- `[path]` — [what changed].

## Verification

- `[command/check]` — [passed/failed/skipped and important note].

## Rollback

- `[exact file-specific command or removal note]`

## Open Concerns

- [Unchecked item only if something still needs attention.]

## Next Step

Reset context first: yes
Next Strike skill: phase-review
Arguments: <feature-slug> phase:<phase-slug>
```

## Card And Board Update

When fixes are complete:

- mark the matching phase-fix checklist item complete
- mark nested blocking fix checklist items complete when present
- keep the phase-review checklist item unchecked, because review must verify
  the fix
- update the phase line in `## Phases` to mention `fix.md`
- update the board pointer intent to say the phase is fixed and ready for
  re-review

When fixes are blocked:

- leave the phase-fix checklist item unchecked
- add the blocker to `card.md`
- leave the board pointer in `06-implementation`

Do not delete or rewrite `review.md`. It remains the source review pass that
the fix addressed.

## Exit Test

Before finishing, reread `fix.md` as if the chat transcript is gone. It is
ready when:

- each blocking review or acceptance item is addressed or the blocker is explicit
- changed files are listed
- verification results are recorded honestly
- rollback notes exist for changed app/test files
- card/board state routes back to phase-review after a context reset

## Output

Final response should be short and user-facing:

- fix path written, or why fix was blocked
- blocking items addressed
- files changed
- checks run
- next prompt, rendered for the current host with `references/invocation.md`:
  `phase-review <feature-slug> phase:<phase-slug>`

Do not show raw handoff fields such as `Reset context first`, `Next Strike
skill`, or `Arguments`.

## Gates

- Do not fix anything outside the review or phase-scoped acceptance findings
  unless the user explicitly expands scope.
- Do not run review or acceptance.
- Do not create durable IDs or hidden state fields.
- Do not move out of `06-implementation`.
- Do not commit.
- Do not run or recommend `git checkout --`, `git clean`, or repo-wide
  reset/restore commands.
