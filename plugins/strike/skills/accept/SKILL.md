---
name: accept
description: Validate the assembled feature against the Strike spec and run kind.
argument-hint: "[feature-slug] [dogfood]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, MultiEdit, Bash, Grep, Glob
---

# Strike Accept

## Communication

When speaking to the user or asking questions, use relaxed, friendly language,
like two friends talking through the work over coffee. Explain things in simple
terms without assumptions, guide with context, and simplify concepts so the
conversation feels easy to follow. Keep the conversation centered on the work
in progress; avoid explaining Strike mechanics unless that context helps the
user decide what to do next.

## Purpose

Validate the assembled feature after implementation review. Acceptance checks
whether the reviewed work satisfies the spec's success checks closely
enough to move to retro, or whether fixes/signoff remain.

Use `dogfood` mode for temporary system-test implementations that should not
remain in the app. Dogfood mode may accept the workflow evidence while recording
that live human/demo checks were intentionally not run.

## Host Invocation

When showing follow-up Strike skills, use the plugin package's
`references/invocation.md` to render the current host's syntax. Do not copy
`/strike:*` examples unchanged unless the current host is Claude Code. When
the host is unknown, show the canonical handoff first.

## State Model

Board location is state. This skill may work only when the card pointer is in:

```txt
docs/strike/board/07-acceptance/<feature-slug>.md
```

If the pointer is in another lane, stop and recommend:

```txt
Reset context first: yes
Next Strike skill: go
Arguments: <feature-slug>
```

Keep acceptance scoped to this feature's Strike card artifacts and the
app/test diffs named by the build, fix, and review evidence.

## Modes

- normal: validate the feature as if it might ship.
- `dogfood`: validate the workflow/test implementation, record any human
  success checks as intentionally not run, and include exact app-code rollback
  commands from `build.md` and `fix.md` when present.

If an unknown mode is passed, stop and explain the valid modes.

## Reads

- board pointer
- `cards/<feature-slug>/card.md`
- `outputs/spec/spec.md`
- every phase `plan.md`, `build-brief.md` when present, `build.md`, `fix.md`
  when present, and `review.md`
- current `git status --short`
- current app diff for files listed in phase `build.md` and `fix.md` when
  present

## Writes

- `outputs/acceptance/acceptance.md`
- `card.md`
- board pointer moved from `07-acceptance` to `08-retro` only when acceptance
  passes or dogfood mode accepts the workflow evidence
- board pointer moved from `07-acceptance` back to `06-implementation` when
  fixable acceptance work remains

Write `acceptance.md` as plain Markdown with verdict, run kind, what was
accepted, code-verifiable checks, live/human checks, evidence, acceptance fixes,
and dogfood cleanup when relevant. Do not use IDs, YAML blocks, status fields,
or routing metadata.

## Acceptance Lenses

Check:

- every planned phase has `build.md` and `review.md`
- every review verdict is `Pass`
- the assembled feature appears built in full and accurately against
  `outputs/spec/spec.md`
- code-verifiable success checks from spec are satisfied or have
  acceptance-fix checklist items
- important feature behavior has tests/checks, or the absence of tests is
  recorded as an acceptance gap
- live/human success checks from spec are satisfied in normal mode, or
  explicitly carried forward as not run in dogfood mode
- build/fix/review evidence includes checks and rollback notes
- fix evidence, when present, is consistent with the passing review
- app-code diff still matches the accepted build evidence
- acceptance fixes, if any, are plain unchecked checklist items

Do not edit app code. Do not run rollback.

## Verdict

Use one of these plain verdicts in `acceptance.md`:

- `Pass` — shippable success checks passed; move to retro.
- `Dogfood accepted` — technical/workflow acceptance passed, human/live checks
  were intentionally not run, and app-code rollback should happen before retro.
- `Needs fixes` — fixable app issues remain; move or leave in implementation.
- `Awaiting human check` — app evidence is clean, but real user/demo signoff is
  required before calling the feature accepted.
- `Blocked` — acceptance cannot reach a verdict because evidence is missing.

## Card Update

When verdict is `Pass` or `Dogfood accepted`:

- mark the acceptance checklist item complete
- add a retro checklist item if missing:
  `- [ ] Retro: capture workflow lessons.`
- update the card's visible run kind line to `Dogfood` or `Shippable` when it
  is present
- summarize pending human/live checks or dogfood rollback notes under Notes
- move the board pointer to `08-retro`

When verdict is `Needs fixes`:

- keep or move the pointer to `06-implementation`
- add plain acceptance-fix checklist items to `card.md`
- assign each acceptance fix to an existing phase when possible
- add a phase-fix checklist item for the first affected phase when a phase is
  clear

When verdict is `Awaiting human check` or `Blocked`:

- leave the pointer in `07-acceptance`
- add the needed human check or missing evidence to `card.md`

## Moving The Board

Use a normal filesystem move, not `git mv`; board pointers may be untracked
during dogfooding. After the move, verify exactly one pointer exists for the
feature slug under `docs/strike/board/*/`.

## Dogfood Rollback

Dogfood mode should copy exact rollback commands from reviewed `build.md` and
`fix.md` when present into the `Dogfood Cleanup Before Retro` section of
`acceptance.md`, the card notes, the board pointer intent, and the final
response.

For this mode, the next action after acceptance is app-code rollback, before
retro. Use exact file commands only. Never run rollback inside acceptance. Never
recommend `git checkout --`, `git clean`, or repo-wide reset/restore commands.

If rollback is pending, the `08-retro` board pointer should say cleanup is
required before retro, not imply retro can run immediately.

## Output

Final response should be short:

- acceptance path written
- verdict
- acceptance fixes or human checks, if any
- whether the card moved to `08-retro`
- dogfood rollback commands when in dogfood mode, labeled as required before
  retro
- in normal mode, when accepted:
  ```txt
  Reset context first: yes
  Next Strike skill: retro
  Arguments: <feature-slug>
  ```
- in dogfood mode, say to run the exact rollback commands before retro, then:
  ```txt
  Reset context first: yes
  Next Strike skill: retro
  Arguments: <feature-slug>
  ```
- when acceptance needs fixes, show the specific `phase-fix` handoff when an
  affected phase is clear; otherwise show a `go` handoff as a state check.

## Gates

- Do not edit app code.
- Do not run rollback.
- Do not create retro files.
- Do not create durable IDs or hidden state fields.
- Do not move to retro when normal-mode acceptance has unresolved fixes or
  human checks.
- Do not commit.
