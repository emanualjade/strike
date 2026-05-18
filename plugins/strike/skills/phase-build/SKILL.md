---
name: phase-build
description: Implement exactly one planned phase and record build evidence.
argument-hint: "[project-slug] phase:<phase-slug>"
disable-model-invocation: true
allowed-tools: Read Write Edit MultiEdit Bash Grep Glob WebFetch WebSearch
---

# Strike Phase Build

## Communication

When speaking to the user or asking questions, use relaxed, friendly language,
like two friends talking through the work over coffee. Explain things in simple
terms without assumptions, guide with context, and simplify concepts so the
conversation feels easy to follow. Keep the conversation centered on the work
in progress; avoid explaining Strike mechanics unless that context helps the
user decide what to do next.

## Purpose

Implement exactly one prepared phase from fresh context.

The output is working code plus one local `build.md` evidence file that lets
the `phase-review` skill review the phase after a context reset.

A good phase build:

- follows the phase `build-brief.md` closely
- stays inside the selected phase
- keeps changes small and reviewable
- runs the brief's verification, plus any focused check made necessary by the
  code
- records changed files, checks, rollback notes, and review notes
- leaves review, acceptance, and retro for later steps

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
Next Strike skill: phase-build
Arguments: <project-slug> phase:<phase-slug>
```

If the pointer is in another lane, or the phase cannot be resolved, stop and
recommend:

```txt
Reset context first: yes
Next Strike skill: go
Arguments: <project-slug>
```

If `build-brief.md` is missing, stop and recommend:

```txt
Reset context first: yes
Next Strike skill: phase-plan
Arguments: <project-slug> phase:<phase-slug>
```

Do not create review, fix, acceptance, retro, durable IDs, YAML blocks, hidden
routing metadata, or repo glossary edits.

## Reads

- board pointer
- `cards/<project-slug>/card.md`
- `outputs/spec/spec.md`
- `phases/<phase-slug>/plan.md`
- `phases/<phase-slug>/build-brief.md`
- `phases/<phase-slug>/research.md` if present
- existing `phases/<phase-slug>/build.md` if present
- current `git status --short`
- focused repo files named by the build brief

Treat `build-brief.md` as the main handoff. Use `spec.md` and `plan.md` to
catch scope drift, not to re-plan the phase from scratch.

## Writes

- implementation, test, or documentation files needed for the selected phase
- `cards/<project-slug>/phases/<phase-slug>/build.md`
- `cards/<project-slug>/card.md`
- board pointer text in `06-implementation`
- board pointer moved back from `06-implementation` to `02-grill`,
  `03-research`, or `05-slice` only when build discovers an upstream blocker
  owned by that lane

The board pointer stays in `06-implementation` for normal phase work. Phase
review is the next step when the build is complete.

For normal phase work, do not move the board pointer out of
`06-implementation`. After updating pointer text or routing to an upstream
lane, verify exactly one pointer file exists for the project slug.

## Preflight

Before editing implementation or test files:

1. Read the build brief and likely touched files.
2. Run `git status --short`.
3. Identify expected implementation, test, or documentation files for this
   phase.
4. If an expected file already has unrelated user changes that make the phase
   unsafe to edit, stop and explain the conflict.
5. If the file is dirty but the changes are clearly part of the selected phase
   or can be worked with safely, continue carefully.
6. Tell the user which files or surfaces are about to change.

Untracked or modified Strike docs are normal while a card is in progress and
are not a reason to stop.

Never revert user changes. Never use repo-wide reset, `git checkout --`, or
`git clean`.

## Build Behavior

Build exactly the selected phase. Use engineering judgment for small details
the brief leaves open, but do not expand the Project scope.

Before editing, quickly sanity-check the build brief against the current repo.
If it is still coherent, build the smallest complete behavior first.

Start with the simplest code that satisfies the current phase. Add an
abstraction only when it makes this phase clearer, not because a future phase
might need it.

Use incremental discipline as guidance, not ritual: build or update one focused
behavior, add or update the narrowest useful check when practical, verify, then
continue only inside this phase.

Do not fold in nearby cleanup, speculative abstractions, or future phase work.

If implementation exposes a missing product, technical, workflow, UX, language,
data, permission, or model-shape decision that should not be guessed, stop,
update `card.md` with the blocking question, move the pointer back to
`02-grill`, and recommend the right earlier handoff:

```txt
Reset context first: yes
Next Strike skill: grill
Arguments: <project-slug>
```

If implementation exposes missing evidence or stack knowledge that cannot be
answered with a quick focused lookup, stop, record the gap on `card.md`, and
recommend phase research when the evidence is phase-scoped:

```txt
Reset context first: yes
Next Strike skill: phase-research
Arguments: <project-slug> phase:<phase-slug>
```

If the missing evidence is Project-level research rather than phase-scoped
implementation knowledge, move the pointer back to `03-research` and recommend
the `research` skill.

Do not leave half-built code behind if you stop for a blocker. If edits were
already made before the blocker became clear, record exactly what changed and
how to restore those files.

## Verification

Run the checks from `build-brief.md` when feasible. Add a focused check if the
implementation creates a risk the brief missed.

Fix verification failures caused by this phase. If a failure appears unrelated
or repeats after a reasonable fix, record it as a blocker instead of broadening
the phase.

After a successful check, do not rerun the same command unless code or relevant
configuration changed.

Record skipped checks honestly. A skipped check is acceptable only when the
reason and replacement evidence are clear.

For frontend/UI phases, run an appropriate local visual or browser check when
the relevant UI can be run locally. If the local preview cannot start, record
the blocker instead of pretending visual verification happened.

Do not end your turn with a local server or other task-owned process still
running.

## Build Artifact Shape

Write `build.md` as phase evidence, not a narrative diary. Keep it compact.

```md
# Build: [Phase Name]

## Summary

[What now works.]

## Files Changed

- `[path]` — [what changed].

## Tests Or Checks Added

- `[path/check]` — [behavior covered, or "_None_" with a brief reason.]

## Verification

- `[command/check]` — [passed/failed/skipped and important note].

## Implementation Notes

- [Only assumptions or small choices made during coding that review should know.]

## Rollback

- `[exact file-specific command or removal note]`

## Open Concerns

- [Unchecked item only if something still needs attention.]

## Review Notes

- [Anything phase-review should pay attention to, including adjacent work noticed but not touched.]
```

## Card And Board Update

When the phase is built:

- mark the matching phase-build checklist item complete
- add the next phase-review checklist item if missing:
  `- [ ] Phase-review: review <phase-slug>.`
- update the phase line in `## Phases` to mention `build.md`
- update the board pointer intent to say the phase is ready for review

When the phase is blocked:

- keep the phase-build checklist item unchecked
- add the blocker or missing evidence to `card.md`
- leave the board pointer in `06-implementation` for phase-scoped missing
  evidence
- move the board pointer to `02-grill` for missing upstream decisions about
  product, technical, or workflow direction, `03-research` for Project-level
  evidence, or `05-slice` for a wrong phase split

## Exit Test

Before finishing, reread `build.md` as if the chat transcript is gone. It is
ready when:

- the selected phase outcome is built or the blocker is explicit
- changed implementation, test, or documentation files are listed
- tests or checks added/updated are listed, or absence is explained
- verification commands and results are recorded
- skipped or failed checks are honest
- exact rollback notes exist for every changed implementation/test file
- open concerns are visible as checkboxes when they matter
- phase-review can start after a context reset without rediscovering what changed

If review would have to reconstruct the build from git diff alone, improve
`build.md` before updating the card.

## Output

Final response should be short and user-facing:

- build path written, or why build was blocked
- implementation/test/docs files changed
- checks run
- rollback note
- card/board update
- next prompt, rendered for the current host with `references/invocation.md`:
  - built: `phase-review <project-slug> phase:<phase-slug>`
  - blocked by missing brief: `phase-plan <project-slug> phase:<phase-slug>`
  - blocked by missing phase evidence:
    `phase-research <project-slug> phase:<phase-slug>`
  - blocked by an upstream Project decision, Project-level evidence gap, or
    wrong phase split: move the pointer to the owning lane and render the
    relevant `grill`, `research`, or `slice` prompt

Do not show raw handoff fields such as `Reset context first`, `Next Strike
skill`, or `Arguments`.

## Gates

- Do not build more than one phase.
- Do not move out of `06-implementation` except when routing a blocker to the
  upstream lane that owns it.
- Do not create review, fix, acceptance, or retro artifacts.
- Do not create durable IDs or hidden state fields.
- Do not commit.
- Do not run or recommend `git checkout --`, `git clean`, or repo-wide
  reset/restore commands.
