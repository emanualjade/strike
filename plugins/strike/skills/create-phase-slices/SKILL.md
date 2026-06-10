---
name: create-phase-slices
description: Split one phase spec into cohesive buildable slices with clear outcomes and acceptance criteria.
argument-hint: "[phase spec/context] [--slice-root path]"
disable-model-invocation: true
allowed-tools: Read Write Edit MultiEdit Grep Glob WebFetch WebSearch
---

# Create Phase Slices

Split one phase spec into cohesive buildable slices.

## Inputs

- phase spec
- phase research from the current phase's `research.md`
- phase research audit from the current phase's `research-audit.md`
- optional main spec, development plan, decisions, initiative research, or
  supporting artifacts
- optional context files or repo paths
- optional slice output root
- bundled Strike slice-boundary standard from the Strike plugin root:
  `references/slice-boundaries.md`

Work on one phase at a time. If the phase spec is missing, stale, too vague, or
inconsistent with the main spec, do not invent scope inside the slice set.
Record the specific phase-spec problem so Strike can route back to the
owning phase step.

## Slice Boundary Standard

Read the Strike plugin root's `references/slice-boundaries.md` before creating
slices. It is the canonical Strike standard for what a good slice is, when
broader cross-stack slices are appropriate, when to split bundled work, how
non-vertical risk slices work, and when to add `Why Not Split`.

The slice set is ready when each slice can move into planning, build, and
verification without re-slicing the phase.

## Process

- Read the phase spec and relevant context.
- Read bundled `references/slice-boundaries.md` from the Strike plugin root and
  use it as the canonical slice-boundary standard.
- Read the current phase's `research.md`. If it says `Ready for slicing: no`,
  do not create slices; surface the blocker or route back.
- Read the current phase's `research-audit.md` and preserve any accepted risks,
  follow-ups, or source-backed constraints that affect slice boundaries.
- If `research-audit.md` does not show all required audit fields, do not create
  slices; route back to `phaseResearchComplete`. Required fields are:
  `Review results returned: yes`, `Verdict: pass` or
  `Verdict: accepted-risk`, and `Must Fix count: 0`.
- Read relevant initiative research constraints when they affect slice
  boundaries, provider/model capabilities, data/schema work, file/blob flows,
  queues/jobs, auth/payment behavior, or repo-pattern risk.
- Use phase research and its audit as the inherited implementation research
  baseline for this phase. Do not make every slice rediscover the same
  official/provider/repo facts.
- If `supporting-artifacts/` exists, scan it and read only files relevant to
  this phase before setting slice boundaries.
- Identify the slice set that completes the phase with the fewest verification
  loops while keeping each slice one honest verification story. Slice count is
  the main workflow cost multiplier; apply the Slice Economics standard in
  `references/slice-boundaries.md`. Default to M or L slices and reserve XS or
  S for genuinely standalone tiny outcomes or justified non-vertical enablers.
- Before registering slices, check adjacent slices for merge signals from
  `references/slice-boundaries.md`. Merge slices that share one capability
  boundary, risk center, and verification story.
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

If phase research or phase research audit is missing, failing, or too weak to
slice safely, do not create slice stubs. Write a concise route-back note instead
and run the exact helper command named in it before continuing:

```md
# Slice Boundary Blocker

## Route Back
Needed: yes
Command: reopen-phase-check
Phase: <phase-id>
Slice: None
Check: phaseResearchComplete
Reason:
```

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

When required by `references/slice-boundaries.md`, add these sections after
`## Risks / Watchouts`:

```md
## Why Not Split

## Non-Vertical Justification
```

## Rules

- Create slices around outcomes.
- Prefer fewer cohesive slices over many thin ones. Do not pre-split work to
  reduce per-slice risk; verification gates own that risk.
- Keep slice IDs canonical and put human names in slice titles or display names.
- Keep implementation planning, execution tasks, research notes, build steps,
  and verification evidence out of the slice stub.
- Preserve the phase spec's scope, rules, constraints, and open questions.
- Preserve phase research constraints and slice-boundary implications.
- Apply the Strike plugin root's `references/slice-boundaries.md` for split,
  justify, `Why Not Split`, non-vertical slice, and too-broad or too-thin slice
  decisions.
- Do not create shared slice indexes, slice maps, implementation plans, build
  files, or implementation files.
