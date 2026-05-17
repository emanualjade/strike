---
name: phase-plan
description: Write the build brief for exactly one implementation phase.
argument-hint: "[feature-slug] phase:<phase-slug>"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, MultiEdit, Bash, Grep, Glob, WebFetch, WebSearch, Agent
---

# Strike Phase Plan

## Communication

When speaking to the user or asking questions, use relaxed, friendly language,
like two friends talking through the work over coffee. Explain things in simple
terms without assumptions, guide with context, and simplify concepts so the
conversation feels easy to follow. Keep the conversation centered on the work
in progress; avoid explaining Strike mechanics unless that context helps the
user decide what to do next.

## Purpose

Prepare exactly one phase for a fresh build session.

The output is one compact `build-brief.md` that lets
the `phase-build` skill start after a context reset without rediscovering the phase,
but without turning phase planning into implementation.

A good phase plan:

- names the behavior this phase should leave working
- names the likely files or surfaces
- names the verification strategy
- calls out concrete watchouts that could cause scope drift or a bad build
- points build toward the simplest safe approach for this phase
- avoids broad feature research and implementation edits

## Host Invocation

When showing follow-up Strike skills, use the plugin package's
`references/invocation.md` to render the current host's syntax. Do not copy
`/strike:*` examples unchanged unless the current host is Claude Code. When
the host is unknown, show the canonical handoff first.

## Minimal Mechanics

Board location is state. This skill may work only when the card pointer is in:

```txt
docs/strike/board/06-implementation/<feature-slug>.md
```

Require an explicit phase argument:

```txt
Next Strike skill: phase-plan
Arguments: <feature-slug> phase:<phase-slug>
```

If the pointer is in another lane, or the phase cannot be resolved, stop and
recommend:

```txt
Reset context first: yes
Next Strike skill: go
Arguments: <feature-slug>
```

Do not write app code, tests, build evidence, review, acceptance, retro, project
glossary edits, durable IDs, YAML blocks, or hidden routing metadata.

## Reads

- board pointer
- `cards/<feature-slug>/card.md`
- `outputs/spec/spec.md`
- `phases/<phase-slug>/plan.md`
- existing `phases/<phase-slug>/research.md` if present
- existing `phases/<phase-slug>/build-brief.md` if present
- `outputs/research/research.md` when it contains phase-relevant findings
- `outputs/grill/grill.md` only when a decision cross-check is needed
- focused repo/docs context for this phase
- official/current docs when stack behavior, accessibility, framework behavior,
  or a vendor/API contract matters for this phase

Treat the phase `plan.md` and `spec.md` as the main inputs. Do not rerun
brainstorm, grill, research, or slice.

## Writes

- `cards/<feature-slug>/phases/<phase-slug>/build-brief.md`
- `cards/<feature-slug>/card.md`
- board pointer text in `06-implementation`
- board pointer moved back from `06-implementation` to `02-grill` when a
  missing product/scope/surface/naming/model-shape decision blocks the brief
- board pointer moved back from `06-implementation` to `05-slice` when the
  phase split itself is wrong

The board pointer normally stays in `06-implementation`. This lane owns
phase-plan, phase-build, phase-review, and phase-fix unless the brief is
blocked by an upstream lane's work.

For the normal brief-writing path, do not move the board pointer out of
`06-implementation`. After updating pointer text or routing to an upstream
lane, verify exactly one pointer file exists for the feature slug.

## Research During Phase Plan

If `phases/<phase-slug>/research.md` exists, read it and use it as the starting
evidence. Do not redo it unless it is stale, thin, or contradicted by current
repo context.

Even when optional phase research was skipped, phase-plan may do tactical
research needed to make the build brief safe and specific. This is not a second
feature research pass.

Useful checks:

- exact repo files, components, or helpers this phase is likely to touch
- local precedent for the way this phase should be built
- current docs for a library or platform behavior that could trip the build
- test setup and command for the phase's verification
- whether incomplete user-visible behavior needs gating, delayed mounting, or a
  smaller phase
- concrete accessibility, auth, data, payment, upload, timezone, or framework
  pitfalls when they matter for this phase
- prior phase outputs if this is not the first phase

Skip checks that do not matter. For a tiny phase, a few `rg`/read checks may be
enough. For broad or source-heavy questions, recommend the optional utility:

```txt
Reset context first: yes
Next Strike skill: phase-research
Arguments: <feature-slug> phase:<phase-slug>
```

Use host-supported delegation only when the active host and user/project policy
allow it. When allowed, use subagents sparingly for independent phase questions
broad enough that parallelism clearly helps. The main skill owns synthesis,
questions, file writes, and card/board updates.

## Decision Handling

Default to writing the brief from the spec and phase plan.

Ask the user only when build would likely go wrong without a real decision.
Recommend a concrete answer when asking.

If phase planning discovers a small missing detail that does not change feature
intent, choose with engineering judgment and record the assumption in the brief.

If it discovers a product/scope/surface/naming/model-shape decision that should
not be guessed, update `card.md` with the blocking question and stop without
writing a misleading brief. Move the pointer back to `02-grill` and recommend
the right prior handoff:

```txt
Reset context first: yes
Next Strike skill: grill
Arguments: <feature-slug>
```

If it discovers broad missing evidence, recommend:

```txt
Reset context first: yes
Next Strike skill: phase-research
Arguments: <feature-slug> phase:<phase-slug>
```

Do not write a weak `build-brief.md` with "TODO research" placeholders. Keep
the phase-plan checklist item open, record the missing evidence on `card.md`,
and stop so the optional phase research can run cleanly.

If the phase split itself is wrong, move the pointer back to `05-slice` and
recommend:

```txt
Reset context first: yes
Next Strike skill: slice
Arguments: <feature-slug>
```

## Build Brief Shape

Write `build-brief.md` as the smallest useful handoff for phase-build. Omit
sections that do not help this phase.

```md
# Build Brief: [Phase Name]

## Build Outcome

[What phase-build should leave working.]

## Files And Surfaces

- [Likely file or folder] — [why it matters].

## Implementation Notes

- [Pattern, simplest safe approach, file/surface boundary, data/auth rule, UX/motion/a11y note, etc.]

## Verification

- [Focused command or manual check.]

## Research Used

- [Optional: phase research file/docs/repo precedents the build brief relies on.]

## Watchouts

- [Concrete pitfall or adjacent work not to fold in.]

## Out Of Scope

- [Only boundaries likely to be crossed accidentally.]
```

The brief should be specific enough to build, but not a step-by-step coding
script. Prefer stable repo paths and commands over copied upstream narrative.

## Card And Board Update

When the brief is ready:

- mark the matching phase-plan checklist item complete
- add the next phase-build checklist item if missing:
  `- [ ] Phase-build: build <phase-slug>.`
- update the phase line in `## Phases` to mention `build-brief.md`
- update the board pointer intent to say the phase is ready for build

When the brief is not ready:

- keep the phase-plan checklist item unchecked
- add the blocking question or missing evidence to `card.md`
- leave the board pointer in `06-implementation` for missing phase evidence
- move the board pointer to `02-grill` for missing upstream product decisions
- move the board pointer to `05-slice` for a wrong phase split

## Exit Test

Before finishing, reread `build-brief.md` as if the chat transcript is gone.
It is ready when:

- it is narrow to one phase
- the phase outcome is concrete
- exact likely files/surfaces are named, or unknowns are explicitly assigned to
  phase-build inspection
- verification strategy is concrete enough for phase-build
- concrete watchouts are visible when they matter
- phase research used by the brief is cited briefly when it exists
- out-of-scope boundaries that matter are visible
- phase-build can start after a context reset without broad rediscovery

If the build agent would still have to plan the phase from scratch, improve the
brief before updating the card.

## Output

Final response should be short:

- build brief path written, or why it was blocked
- key research/precedent findings
- card/board update
- next action:
  - if the brief was written:
    ```txt
    Reset context first: yes
    Next Strike skill: phase-build
    Arguments: <feature-slug> phase:<phase-slug>
    ```
  - if blocked by missing evidence, show:
    ```txt
    Reset context first: yes
    Next Strike skill: phase-research
    Arguments: <feature-slug> phase:<phase-slug>
    ```
  - if blocked by upstream feature decisions, show the relevant `grill`,
    `research`, or `slice` handoff.

## Gates

- Do not edit app code.
- Do not create tests.
- Do not move out of `06-implementation` except when routing to `02-grill` for
  a missing upstream decision or `05-slice` for a wrong phase split.
- Do not write build, review, fix, acceptance, or retro artifacts.
- Do not edit `UBIQUITOUS_LANGUAGE.md`.
- Do not create sidecar checker files, drafts, durable IDs, or hidden state.
