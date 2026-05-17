---
name: slice
description: Split a completed Strike spec into vertical implementation phases.
argument-hint: "[feature-slug]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, MultiEdit, Bash, Grep, Glob
---

# Strike Slice

## Communication

When speaking to the user or asking questions, use relaxed, friendly language,
like two friends talking through the work over coffee. Explain things in simple
terms without assumptions, guide with context, and simplify concepts so the
conversation feels easy to follow. Keep the conversation centered on the work
in progress; avoid explaining Strike mechanics unless that context helps the
user decide what to do next.

## Purpose

Turn a complete spec into a small, ordered set of vertical phases.

This skill decides how to cut the work so the feature can be built accurately
and completely. A good slice lets the `phase-plan` skill start after a context reset
with enough context to do narrow phase research and later write the first build
brief.

## Host Invocation

When showing follow-up Strike skills, use the plugin package's
`references/invocation.md` to render the current host's syntax. Do not copy
`/strike:*` examples unchanged unless the current host is Claude Code. When
the host is unknown, show the canonical handoff first.

## Minimal Mechanics

Board location is state. This skill may work only when the card pointer is in:

```txt
docs/strike/board/05-slice/<feature-slug>.md
```

If the pointer is in another lane, stop and recommend:

```txt
Reset context first: yes
Next Strike skill: go
Arguments: <feature-slug>
```

Keep the output focused on phase plans, card updates, and the board pointer.
This is planning, not implementation. Light code references are welcome when
they make a phase concrete, but do not edit app code here.

## Reads

- board pointer
- `cards/<feature-slug>/card.md`
- `cards/<feature-slug>/outputs/spec/spec.md`
- `cards/<feature-slug>/outputs/research/research.md` if present and relevant
- `cards/<feature-slug>/outputs/grill/grill.md` only when the spec needs a
  decision cross-check
- `cards/<feature-slug>/outputs/brainstorm/brainstorm.md` only when the spec
  seems to have lost the original user/problem framing
- focused repo/docs context only when needed to avoid slicing against a fake
  surface or nonexistent pattern

Treat `outputs/spec/spec.md` as the primary source. Do not re-run brainstorm,
grill, or research inside slice.

## Writes

- `cards/<feature-slug>/phases/<phase-slug>/plan.md`
- `cards/<feature-slug>/card.md`
- board pointer moved from `05-slice` to `06-implementation` only when the
  first phase can be phase-planned after a context reset
- board pointer moved back from `05-slice` to `04-spec` when the spec is too
  thin or contradictory to slice safely

Use a normal filesystem move, not `git mv`, and verify exactly one pointer file
exists for the feature slug after moving.

## Slicing Principles

Use engineering judgment to create the smallest ordered phase list that covers
the whole spec.

Before writing phases, briefly think through what depends on what, what the
smallest useful behavior path is, and what result would make each phase
reviewable or verifiable.

Cut by useful behavior, not by technical layer. Prefer phases that leave
something observable, reviewable, or verifiable: a user path, a system
capability, a working integration, or a meaningful risk retired.

Avoid defaulting to horizontal phases like "schema first," "API first," or "UI
later." A foundation phase is fine only when it genuinely reduces risk, unlocks
later behavior, creates a stable contract for dependent work, or makes the next
phase easier to verify.

Split when a phase would be too large, risky, or hard to review in one focused
session. Merge when separate phases would only create ceremony. One phase is
correct when splitting would create fake work.

If a phase would touch several independent subsystems, has fuzzy acceptance, or
would take more than one focused build/review session, split it smaller.

Order phases so the earliest phase proves the most important uncertainty or
unlocks the next useful behavior.

## Phase Shape

Each phase plan should let the `phase-plan` skill continue after a context reset
without rediscovering the feature.

Name the outcome, order/dependency, verifiable result, likely surfaces, and
concrete watchouts. Mention phase-plan focus only when there is something the
next step should check before code, such as local precedents, current docs,
test conventions, or a phase-specific pitfall.

Keep phase plans compact. Do not restate the whole spec, list every rejected
option, or create build/review checklists. Use project language consistently;
if a phase name introduces a new term, define it briefly.

## Conversation

Default to writing the phase list from the spec.

Use judgment for normal slicing choices: phase names, order, split/merge
boundaries, likely surfaces, verification shape, and phase-plan focus items.
Capture assumptions or watchouts in the phase plan.

Ask only when the spec cannot be sliced without a new feature decision or a
change to the spec. When asking, explain the tradeoff plainly and recommend an
answer.

## Plan Shape

Each phase folder should use an ordered numeric prefix so the build order is
visible in the filesystem and on the card:

```txt
phases/01-first-useful-outcome/
phases/02-second-useful-outcome/
```

The number is for human ordering only, not a durable ID.

Write each `plan.md` with a shape like this. Omit sections that do not help the
phase planner.

```md
# Phase: [Name]

## Outcome

[One complete behavior or independently verifiable result.]

## Why This Phase Exists

[Why this phase belongs here. Mention dependency or risk ordering only when it
actually matters.]

## Depends On

- [Prior phase or external condition, or "None."]

## Verifiable Result

[What phase-plan/build/review can use to know this phase worked.]

## In Scope

- [Only the important boundaries or deltas from the spec.]

## Out Of Scope

- [Only when a boundary is likely to be crossed by accident.]

## Likely Surfaces

- [Route, component, module, schema, command, or "To be confirmed in phase-plan."]

## Phase-Plan Focus

- [Question for optional phase-research or phase-plan to investigate before code is written, or "None obvious."]

## Watchouts

- [Concrete pitfall only, or "None obvious."]
```

## Card Update

When phases are written:

- mark the slice checklist item complete
- add the next phase-plan checklist item
- update `## Phases` with each phase and its `plan.md`
- move the board pointer to `06-implementation`

If the spec is not sliceable:

- keep the slice checklist item unchecked
- record the blocking question on `card.md`
- move the pointer back to `04-spec` if the spec needs repair

## Exit Test

Before moving out of `05-slice`, reread the phase plans as if the chat
transcript is gone. Move forward when:

- the phase list covers the whole spec
- each phase has a clear outcome
- each phase has a verifiable result
- phase order is clear from the numbered phase folders and card list
- phase boundaries make the work easier to build, review, or verify
- meaningful risks, dependencies, or watchouts are visible
- rejected scope from brainstorm, grill, research, or spec stays rejected
- the `phase-plan` skill can continue
  after a context reset without broad rediscovery

If a phase planner would have to rediscover the feature or guess the first
phase, improve the phase plans before moving.

## Output

Final response should be short:

- phase folders written
- whether the card moved to `06-implementation` for phase planning, moved back
  to `04-spec`, or stayed in `05-slice`
- the recommended first phase
- next action:
  - if moved to `06-implementation`, show optional phase research and direct
    phase-plan for the first phase:
    ```txt
    Reset context first: yes
    Next Strike skill: phase-research
    Arguments: <feature-slug> phase:<first-phase-slug>
    ```
    Or create the build brief:
    ```txt
    Reset context first: yes
    Next Strike skill: phase-plan
    Arguments: <feature-slug> phase:<first-phase-slug>
    ```
  - if moved back to `04-spec`:
    ```txt
    Reset context first: yes
    Next Strike skill: spec
    Arguments: <feature-slug>
    ```
  - if still in `05-slice`, show the focused rerun handoff:
    ```txt
    Reset context first: yes
    Next Strike skill: slice
    Arguments: <feature-slug>
    ```

## Gates

- Do not edit app code or tests.
- Do not write build briefs, build evidence, review, acceptance, or retro
  artifacts.
- Do not create durable IDs, hidden state fields, or routing metadata.
- Do not move to implementation unless at least one phase is concrete enough
  for phase-plan.
