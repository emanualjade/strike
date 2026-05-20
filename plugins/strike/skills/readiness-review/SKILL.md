---
name: readiness-review
description: Review whether the assembled project is ready against the Strike spec.
allowed-tools: Read Write Edit MultiEdit Bash Grep Glob
---

# Strike Readiness Review

## Communication

When speaking to the user or asking questions, use relaxed, friendly language,
like two friends talking through the work over coffee. Explain things in simple
terms without assumptions, guide with context, and simplify concepts so the
conversation feels easy to follow. Keep the conversation centered on the work
in progress; avoid explaining Strike mechanics unless that context helps the
user decide what to do next.

## Purpose

Review the assembled project after implementation review. Readiness review
checks whether the reviewed work satisfies the spec's success checks closely
enough to move to retro, or whether fixes/signoff remain.

## Host Invocation

When showing follow-up Strike skills, use the plugin package's
`references/invocation.md` to render the current host's syntax. Do not copy
`/strike:*` examples unchanged unless the current host is Claude Code. When
the host is unknown, show the skill name and arguments as a plain next action
without raw field labels.

## User Customization

Before doing any material readiness-review work, you MUST run the repo-local
customization loader from the consuming repository root:

```bash
test -f strike/customize/system/customize.mjs || { echo 'Strike is not initialized in this repo yet. Run the Strike `init` skill first.'; exit 1; }
node strike/customize/system/customize.mjs --repo-root <repo-root> preview readiness-review
```

If the loader says `readiness-review` is unsupported, the repo-local runtime is
out of date. Stop and tell the user to run the Strike `init` skill to refresh
it.

## State Model

Board location is state. This skill may work only when the card pointer is in:

```txt
docs/strike/board/07-readiness/<project-slug>.md
```

If the pointer is in another lane, stop and recommend:

```txt
Reset context first: yes
Next Strike skill: go
Arguments: <project-slug>
```

If any argument beyond the project slug is passed, stop and show the valid
form:

```txt
Next Strike skill: readiness-review
Arguments: <project-slug>
```

Keep readiness review scoped to this project's Strike card artifacts and the
implementation/test diffs named by the build, fix, and review evidence.

## Reads

- board pointer
- `cards/<project-slug>/card.md`
- `outputs/spec/spec.md`
- every phase `plan.md`, `build-brief.md` when present, `build.md`, `fix.md`
  when present, and `review.md`
- current `git status --short`
- current diff for files listed in phase `build.md` and `fix.md` when present

## Writes

- `outputs/readiness/readiness.md`
- optional user-requested docs/assets under
  `strike/user-docs/<project-slug>/readiness-review/...`,
  `strike/user-docs/shared/...`, or another repo-safe path the current user
  explicitly provides or confirms
- `card.md`
- board pointer moved from `07-readiness` to `08-retro` only when readiness
  passes
- board pointer moved from `07-readiness` back to `06-implementation` when
  fixable readiness work remains

Write `readiness.md` as plain Markdown with verdict, what was reviewed,
repo-verifiable checks, live/human checks, evidence, and readiness fixes. Do
not use IDs, YAML blocks, status fields, or routing metadata.

## Readiness Checks

Check:

- every planned phase has `build.md` and `review.md`
- every review verdict is `Pass`
- the assembled project appears built in full and accurately against
  `outputs/spec/spec.md`
- repo-verifiable success checks from spec are satisfied or have
  readiness-fix checklist items
- important project behavior has tests/checks, or the absence of tests is
  recorded as a readiness gap
- live/human success checks from spec are satisfied, or readiness review waits for
  human signoff
- build/fix/review evidence includes checks and rollback notes
- fix evidence, when present, is consistent with the passing review
- implementation diff still matches the reviewed build evidence
- readiness fixes, if any, are plain unchecked checklist items

Do not edit implementation files.

## Verdict

Use one of these plain verdicts in `readiness.md`:

- `Pass` — success checks passed; move to retro.
- `Needs fixes` — fixable implementation issues remain; move or leave in
  implementation.
- `Awaiting human check` — implementation evidence is clean, but real user,
  stakeholder, or live-environment signoff is required before calling the
  project ready.
- `Blocked` — readiness review cannot reach a verdict because evidence is
  missing.

## Card Update

When verdict is `Pass`:

- mark the readiness-review checklist item complete
- add a retro checklist item if missing:
  `- [ ] Retro: capture workflow lessons.`
- move the board pointer to `08-retro`

When verdict is `Needs fixes`:

- keep or move the pointer to `06-implementation`
- add plain readiness-fix checklist items to `card.md`
- assign each readiness fix to an existing phase when possible
- add a phase-fix checklist item for the first affected phase when a phase is
  clear

When verdict is `Awaiting human check` or `Blocked`:

- leave the pointer in `07-readiness`
- add the needed human check or missing evidence to `card.md`

## Moving The Board

Use a normal filesystem move, not `git mv`; board pointers may be untracked
while the workflow is in progress. After the move, verify exactly one pointer
exists for the project slug under `docs/strike/board/*/`.

## Output

Final response should be short and user-facing:

- readiness path written
- verdict
- readiness fixes or human checks, if any
- whether the card moved to `08-retro`
- next prompt, rendered for the current host with `references/invocation.md`:
  - ready: `retro <project-slug>`
  - needs fixes: show the specific
    `phase-fix <project-slug> phase:<phase-slug>` prompt when an affected phase
    is clear; otherwise show `go <project-slug>` as a state check

Do not show raw handoff fields such as `Reset context first`, `Next Strike
skill`, or `Arguments`.

## Gates

- Do not edit implementation files.
- Do not create retro files.
- Do not create durable IDs or hidden state fields.
- Do not move to retro when readiness review has unresolved fixes or human
  checks.
- Do not commit.
