---
name: create-development-phases
description: Create a development plan that breaks a main spec into coherent buildable phases.
argument-hint: "[main spec/context] [--output path] [--phase-root path]"
disable-model-invocation: true
allowed-tools: Read Write Edit MultiEdit Grep Glob WebFetch WebSearch
---

# Create Development Phases

Create a development plan that breaks a main spec into coherent buildable
phases.

## Inputs

- main spec
- initiative research index or relevant reports when they affect phase order or
  risk
- supporting artifacts when they affect phase boundaries or risk
- optional decisions, constraints, or context files
- optional output path for the development plan
- optional phase output root for phase stubs

## Phase Size

A phase is one coherent buildable capability area. It is larger than a single
implementation slice and smaller than a broad subsystem.

A good phase is usually vertical: it leaves something observable, reviewable, or
verifiable, such as a user path, system capability, working integration, or
meaningful risk retired.

A good phase has:

- one clear user or system outcome
- a completion target
- enough scope to split into slices
- boundaries that keep unrelated capabilities out

Split a phase when it contains multiple independent outcomes, roles, workflows,
risk areas, release targets, fuzzy acceptance, or more work than one focused
build/review loop should own.

Merge or demote a phase when it is only a tiny implementation change. One phase
is correct when splitting would create fake work.

Avoid horizontal phases like "schema first," "API first," or "UI later." A
foundation phase is allowed only when it reduces risk, unlocks later behavior,
creates a stable contract, or makes the next phase easier to verify.

## Process

- Read the main spec, initiative research constraints, relevant supporting
  artifacts, and other relevant context.
- Identify the smallest ordered phase list that can deliver the spec
  coherently.
- Name each phase by outcome, not implementation activity.
- Use canonical phase IDs: `phase-01`, `phase-02`, `phase-03-b`.
- Capture why the phases are separate and why they are ordered that way.
- Order early phases to prove the most important uncertainty or unlock the next
  useful behavior.
- Use initiative research to order provider/API/model, data/schema,
  file/blob, queue/job, auth/payment, or repo-pattern risks where they affect
  phase shape.
- Use supporting artifacts to preserve decision-discussion context that affects
  phase boundaries, such as schema reasoning, architecture tradeoffs, data
  lifecycle, provider routing, or operational constraints.
- Mention likely surfaces or watchouts only when they clarify phase scope,
  risk, research needs, or verification shape.
- Create concise phase stubs when a phase output root is provided.
- Ask one consequential question if the phase split changes scope, risk, or
  delivery order.

Use judgment for normal phase names, order, split/merge boundaries, likely
surfaces, and verification shape. Ask only when the spec cannot be phased
without a new project decision.

## Output

If an output path is provided, write the development plan there. The
development plan is the human-readable phase breakdown and rationale.

If no output path is provided, ask the user where they would like to save it.

Use this shape:

```md
# Development Plan

## Phase Strategy

## Phase Map
| Phase | Outcome | Depends On | Readiness Target | Why Separate |
| --- | --- | --- | --- | --- |

## Phase Details
### [phase-01] [Phase Name]
  Outcome:
  Depends On:
  Completion Target:
  Likely Surfaces:
  Watchouts:
  Phase-Spec Focus:

## Boundaries

## Risks / Dependencies

## Open Questions
```

When a phase output root is provided, create one phase stub per phase:

```md
# [Phase Name]

Phase ID:

## Outcome

## Depends On

## Readiness Target

## Boundaries

## Phase-Spec Focus
```

When running inside Strike, writing the development plan and phase stubs is not
enough to finish this step. Register every planned phase in workflow state:

```text
node strike/scripts/state.mjs add-phase <phase-id> [name]
```

Run `add-phase` for each phase before `complete-check phasesCreated`. Do not use
`complete-check phasesCreated` as a probe for whether registration is needed.

## Rules

- Create phases around outcomes.
- Keep phase IDs canonical and put human names in phase titles or display names.
- Keep phase count as small as the spec allows.
- Preserve the main spec's scope, rules, constraints, and open questions.
- Preserve material initiative research constraints. Do not phase work in a way
  that requires unsupported provider/model/API/database/file behavior unless the
  main spec explicitly accepted that risk.
- Do not treat supporting artifacts as standalone scope. Phase only against
  decisions and constraints represented in the main spec.
- Do not create phase specs, slice files, slice acceptance criteria,
  implementation tasks, or implementation files.
- Before finishing, reread the development plan as if the chat transcript is
  gone. The first phase should be ready for phase-spec creation without
  re-slicing the initiative.
