---
name: phase-review
description: Review one built phase and route clean or blocking findings.
argument-hint: "[project-slug] phase:<phase-slug>"
disable-model-invocation: true
allowed-tools: Read Write Edit MultiEdit Bash Grep Glob
---

# Strike Phase Review

## Communication

When speaking to the user or asking questions, use relaxed, friendly language,
like two friends talking through the work over coffee. Explain things in simple
terms without assumptions, guide with context, and simplify concepts so the
conversation feels easy to follow. Keep the conversation centered on the work
in progress; avoid explaining Strike mechanics unless that context helps the
user decide what to do next.

## Purpose

Review one built phase from fresh context.

The job is to catch scope drift, regressions, missing checks, and quality
problems while the phase diff is still small. Review writes the fix list when
fixes are needed; implementation/test repairs belong to the `phase-fix` skill.

Keep review plain: prose, checkboxes, and evidence. Do not create finding IDs,
YAML blocks, hidden routing metadata, or sidecar checker files.

## Host Invocation

When showing follow-up Strike skills, use the plugin package's
`references/invocation.md` to render the current host's syntax. Do not copy
`/strike:*` examples unchanged unless the current host is Claude Code. When
the host is unknown, show the skill name and arguments as a plain next action
without raw field labels.

## Minimal Mechanics

Board location is state. This skill may work only when the card pointer is in:

```txt
docs/strike/board/06-implementation/<project-slug>.md
```

Require an explicit phase argument:

```txt
Next Strike skill: phase-review
Arguments: <project-slug> phase:<phase-slug>
```

If the pointer is in another lane, or the phase cannot be resolved, stop and
recommend:

```txt
Reset context first: yes
Next Strike skill: go
Arguments: <project-slug>
```

If `build.md` is missing, stop and recommend:

```txt
Reset context first: yes
Next Strike skill: phase-build
Arguments: <project-slug> phase:<phase-slug>
```

Do not edit implementation or test files. Do not create fix, acceptance, or
retro files.

## Reads

- board pointer
- `cards/<project-slug>/card.md`
- `outputs/spec/spec.md`
- selected phase `plan.md`
- selected phase `build-brief.md` when present
- selected phase `build.md`
- existing selected phase `review.md` if present
- current `git status --short`
- current diff for files listed in `build.md`
- focused implementation/test files only as needed to verify the diff

Treat `build.md` and the current diff as the main review target. Use
`spec.md`, `plan.md`, and `build-brief.md` to check intent and scope.

## Writes

- `cards/<project-slug>/phases/<phase-slug>/review.md`
- `cards/<project-slug>/card.md`
- board pointer moved from `06-implementation` to `07-acceptance` only when
  every listed phase has a clean review and no implementation checklist items
  remain open

Use normal filesystem moves, not `git mv`, and verify exactly one pointer file
exists for the project slug after moving.

## Review Lenses

Review against the phase plan, build brief, spec, build evidence, and current
diff:

- scope: changes stay inside the selected phase
- behavior: the phase outcome appears implemented
- quality: implementation is readable and fits local patterns
- intent: output matches the spec and phase promise
- verification: checks in `build.md` are enough, and skipped/failed checks are
  honest
- tests: added/updated checks cover the important behavior, or absence is
  explained
- rollback: changed implementation/test files and exact rollback notes are
  present
- risk: any security, auth, data integrity, accessibility, or integration issue
  introduced by the phase is visible

Do not redo the build. You may run cheap read-only commands or focused checks
to verify evidence, but do not mutate implementation/test files.

## Verdict

Use one of these plain verdicts in `review.md`:

- `Pass` — no blocking fixes remain. Non-blocking notes may exist.
- `Needs fixes` — code/test/artifact fixes are needed; leave the card in
  `06-implementation`.
- `Blocked` — review cannot reach a verdict because evidence, diff, or
  required verification is missing.

Blocking fixes should be plain unchecked checklist items, for example:

```md
- [ ] Restore the missing keyboard focus outline on the new card link.
```

If the fix requires code or test changes, do not make it in review. Write it as
a blocking fix and route to phase-fix.

## Review Artifact Shape

Write `review.md` compactly:

```md
# Review: [Phase Name]

## Verdict

- Pass | Needs fixes | Blocked

## What Was Reviewed

- [Spec/build/brief/diff/checks read.]

## Blocking Fixes

- [ ] [Only if verdict is Needs fixes or Blocked.]

## Non-Blocking Notes

- [Optional.]

## Evidence

- [Checks, diff inspection, files reviewed.]

## Rollback Check

- [Whether rollback notes are exact enough.]

## Next Step

[Acceptance, phase-fix, or missing evidence.]
```

## Card And Board Update

When review passes:

- mark the matching phase-review checklist item complete
- update the phase line in `## Phases` to mention `review.md`
- if all listed phases are reviewed and no implementation or acceptance-fix
  checklist items remain open, add an acceptance checklist item if missing:
  `- [ ] Acceptance: validate the assembled project.`
- move the board pointer to `07-acceptance` only when all listed phases are
  reviewed cleanly

When review needs fixes:

- leave the card in `06-implementation`
- keep or add a phase-fix checklist item:
  `- [ ] Phase-fix: fix review findings for <phase-slug>.`
- copy blocking fix checkboxes into `card.md` in plain language, or link to the
  review file if the list is long

When review is blocked:

- leave the card in `06-implementation`
- add the missing evidence as an unchecked card item

## Exit Test

Before finishing, reread `review.md` as if the chat transcript is gone. It is
ready when:

- verdict is clear
- reviewed inputs are listed
- blocking fixes are actionable plain checkboxes, or the pass verdict has
  enough evidence to trust acceptance as next
- skipped, failed, or missing checks are not hidden
- rollback adequacy is recorded
- board/card state matches the verdict

## Output

Final response should be short and user-facing:

- review path written
- verdict
- blocking fixes, if any
- whether the card moved to `07-acceptance` or stayed in `06-implementation`
- next prompt, rendered for the current host with `references/invocation.md`:
  - needs fixes: `phase-fix <project-slug> phase:<phase-slug>`
  - phase passed and more phases remain: optional
    `phase-research <project-slug> phase:<next-phase-slug>` and direct
    `phase-plan <project-slug> phase:<next-phase-slug>`
  - all phases passed: `accept <project-slug>`
  - blocked by missing evidence: show the prompt that supplies that evidence
    when obvious; otherwise show `go <project-slug>` as a state check

Do not show raw handoff fields such as `Reset context first`, `Next Strike
skill`, or `Arguments`.

## Gates

- Do not edit implementation or test files.
- Do not create fix, acceptance, or retro files.
- Do not create durable IDs or hidden state fields.
- Do not move the card to acceptance if blocking fixes or missing evidence remain.
- Do not commit.
