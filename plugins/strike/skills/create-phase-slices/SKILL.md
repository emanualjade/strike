---
name: create-phase-slices
description: Split one phase spec into small focused buildable slices with clear outcomes and acceptance criteria.
argument-hint: "[phase spec/context] [--slice-root path]"
disable-model-invocation: true
allowed-tools: Read Write Edit MultiEdit Grep Glob WebFetch WebSearch
---

# Create Phase Slices

Split one phase spec into small focused buildable slices.

## Inputs

- phase spec
- optional main spec, development plan, decisions, initiative research, or
  supporting artifacts
- optional context files or repo paths
- optional slice output root

Work on one phase at a time. If the phase spec is missing, stale, too vague, or
inconsistent with the main spec, do not invent scope inside the slice set.
Record the specific phase-spec problem so Strike can route back to the
owning phase step.

## Slice Size

A slice is one cohesive buildable increment that can be planned, built, verified,
and reviewed in one focused loop.

A good slice:

- produces one observable user or system behavior, a tightly coupled behavior
  cluster that shares the same state/data/API flow, or reduces a specific
  near-term risk
- has clear acceptance criteria
- leaves the repo in a working state
- is cohesive enough to complete without bundling unrelated outcomes

A vertical slice is one observable behavior path. It is not "frontend work,"
"backend work," or "database setup" by itself.

Good vertical slice examples:

- user can create one listing and see it persisted in the list
- admin can approve one pending request and the requester sees the new status
- customer can enter one discount code and see the corrected total

Usually bad slice shapes:

- set up database tables
- build all backend endpoints
- create the whole UI
- add frontend and backend for payments

A slice may touch UI, API, data, and tests when those pieces must land together
to make one behavior flow work. It may include tightly coupled variants when
splitting them would create fake work. Split it when the pieces are independent
or the behavior can work smaller.

Use this sizing guide:

| Size | Shape |
| --- | --- |
| XS | 1 file; tiny config, function, copy, or style change. |
| S | 2-4 files; one component, endpoint, helper, or adapter. |
| M | 5-10 files; one complete vertical behavior path or tightly coupled behavior cluster. |
| L | 11-15 files; justify or split. |
| XL | 16+ files; usually too large for one slice. |

Break or challenge a slice when it has:

- more than 10 likely files, unless the touched files are tightly coupled around
  one behavior flow
- more than 4 acceptance criteria, or criteria that describe independent outcomes
- a broad title such as `and`, `full`, `complete`, `MVP`, or
  `setup frontend/backend`
- multiple independent subsystems or behavior paths
- repo setup plus package decisions plus frontend/backend behavior
- UI plus route/API plus state/data plus tests, when those surfaces do not share
  one behavior flow

Do not label a slice `M` while accepting `L/XL` signals from independent
outcomes or weak cohesion. Split it or record why the larger blast radius is
still the smallest safe move.

Non-vertical slices are allowed only when they reduce risk or unlock near-term
vertical behavior. Keep them XS/S unless clearly justified. Explain why a
vertical slice is worse first and name the next vertical slice they unblock.

## Quality Bar

The slice set is ready when each slice can move into research, planning, build,
and verification without re-slicing the phase.

A fresh context should be able to open any `slice.md` and understand:

- outcome and acceptance criteria
- dependency order
- in-scope and out-of-scope boundaries
- likely surfaces and verification intent
- important edge, flow, risk, or working-state notes

One slice is correct when splitting would create fake work.

## Process

- Read the phase spec and relevant context.
- Read relevant initiative research constraints when they affect slice
  boundaries, provider/model capabilities, data/schema work, file/blob flows,
  queues/jobs, auth/payment behavior, or repo-pattern risk.
- If `supporting-artifacts/` exists, scan it and read only files relevant to
  this phase before setting slice boundaries.
- Identify the smallest set of slices that can complete the phase coherently.
- Name each slice by outcome, not task category.
- Use canonical slice IDs: `slice-01`, `slice-02`, `slice-03-b`.
- Order slices so dependencies are satisfied, high-risk assumptions appear
  early, and each slice leaves the app in a working state.
- Put edge/flow notes only where they affect slice boundaries, acceptance,
  risk, or verification. Useful categories include state, permissions, data
  integrity, integrations, UI/device, operations, and recovery.
- Do not create slices whose acceptance criteria require unsupported or unknown
  provider/model/API/database/file behavior unless the phase spec explicitly
  accepts that risk.
- Do not use supporting artifacts to add scope that is absent from the phase
  spec. Use them to understand reasoning and boundaries.
- Create concise slice stubs when a slice output root is provided.
- Ask one consequential question if the slice split changes scope, risk, or
  delivery order.

Use judgment for normal slice names, order, split/merge boundaries,
dependencies, likely surfaces, and verification shape. Ask only when the phase
cannot be sliced without a new product, technical, workflow, or risk decision.

## Output

If a slice output root is provided, create one directory per slice and write
`slice.md` inside it. Do not create a shared `slices.md`, `index.md`, or
dependency-map file.

If no slice output root is provided, ask the user where they would like to save
the slice stubs.

When running inside Strike, writing slice stubs is not enough to finish this
step. Register every planned slice in workflow state:

```text
node strike/scripts/state.mjs add-slice <phase-id> <slice-id> [name]
```

Run `add-slice` for each slice before `complete-check slicesCreated`. Do not use
`complete-check slicesCreated` as a probe for whether registration is needed.

Use this shape for each slice:

```md
# [slice-01] [Slice Name]

## Size
XS / S / M / L / XL

## Type
Vertical / Non-vertical

## Outcome
One sentence describing the observable behavior that works after this slice.

## Acceptance Criteria
-

## Why This Slice Exists

## Depends On

## In Scope

## Out Of Scope

## Likely Surfaces

## Verification Intent

## Edge / Flow Notes

## Risks / Watchouts
```

## Rules

- Create slices around outcomes.
- Keep slice IDs canonical and put human names in slice titles or display names.
- Keep implementation planning, execution tasks, research notes, build steps,
  and verification evidence out of the slice stub.
- Preserve the phase spec's scope, rules, constraints, and open questions.
- Split or justify any L/XL, batched, low-cohesion, or non-vertical slice.
- Add `## Why Not Split` for L slices or broad-stack slices that cannot be made
  smaller.
- Add `## Non-Vertical Justification` only for non-vertical slices.
- Surface if a slice is too broad or too small to build coherently.
- Do not create shared slice indexes, slice maps, implementation plans, build
  files, or implementation files.
