# Spec

Every initiative has a `spec.md`, even when minimal. Specs are durable
source-of-truth artifacts, not implementation scripts.

Before writing a real spec, confirm brainstorm and grill produced artifacts or
were explicitly opted out by the user. Do not treat the kickoff prompt as the
spec. Pull current truth from `idea.md`, `grill.md`, `decisions.md`, root
`language.md`, repo context, and research; unresolved hardening decisions go
back to grill.

Default paths:

- `auto-strike/initiatives/<initiative-slug>/spec.md` for the initiative
  overview, feature map, readiness target, cross-feature flows, constraints, and
  sequencing.
- `auto-strike/initiatives/<initiative-slug>/features/<feature-slug>/feature-spec.md`
  for each buildable feature that will be sliced.

Use one feature folder when the initiative has one buildable capability. Split
into multiple feature folders when the initiative combines independent outcomes,
domains, roles, workflows, readiness targets, or releaseable capabilities.

Spec mode stops at specs plus handoff. It may name the active feature, likely
slice themes, high-risk boundaries, and verification expectations in `Slice
Handoff`, but it must not create or link to future `slices/index.md`,
`slices/slice-*.md`, a detailed Slice Map, numbered slice list, slice acceptance
criteria, or slice execution tasks. When spec is ready, record `Spec Review` and
`Exit Evidence`, update the Phase Ledger, and stop with slice mode as the next
action. Enter slice mode as a separate work unit and load `slice.md`.

Useful initiative spec shape:

```md
# [Initiative] Spec

## Summary
## Who Or What This Serves
## Initiative Outcome
## Feature Map
| Feature | Purpose | Depends On | Readiness Target | Status |
| --- | --- | --- | --- | --- |
## Cross-Feature Flows
## Scope And Non-Goals
## Product Rules And Constraints
## Domain Language
## Security, Privacy, Permissions, And Data Integrity
## Technical Constraints
## Success Checks
### Repo-Verifiable
### Live / Human
## Risks And Assumptions
## Open Questions
## Feature Spec Handoff
## Phase Tasks
## Spec Review
## Exit Evidence
```

Useful feature spec shape:

```md
# [Feature] Spec

## Summary
## Who Or What This Serves
## What We Are Building
## Flows
## Scope
## Product Rules
## Domain Language
## State, Lifecycle, And Invariants
## Security, Privacy, Permissions, And Data Integrity
## Technical Constraints
## Success Checks
### Repo-Verifiable
### Live / Human
## Risks And Assumptions
## Open Questions
## Slice Handoff
## Phase Tasks
## Spec Review
## Exit Evidence
```

Omit empty sections. Include "out of scope and why" so later work does not
silently expand. Split success checks into repo-verifiable checks and live or
human checks.

During active spec work, keep the process sections concise:

```md
## Phase Tasks
- [ ] Pull current truth from idea, grill, root language, and initiative decisions.
- [ ] Confirm grill has a Decision Checkpoint or an explicit user opt-out.
- [ ] Write or update the initiative feature map.
- [ ] Write feature specs for buildable capabilities.
- [ ] Write product behavior, scope, non-goals, rules, and flows.
- [ ] Define repo-verifiable and live/human success checks.
- [ ] Record risky surfaces, constraints, assumptions, and open questions.
- [ ] Review the spec for sliceability and fix gaps.
- [ ] Write only a concise Slice Handoff; leave numbered slice lists, Slice Map,
      slice acceptance criteria, and slice files for slice mode.

## Spec Review
- [pass/blocker/warning] - [scope, rules, checks, risks, or missing decisions]

## Exit Evidence
- [Why this spec can be sliced without guessing.]
```

Do focused research before or during spec when current docs, codebase precedent,
domain pitfalls, or architecture tradeoffs can change the decision. Use primary
sources for unstable or external facts. Put initiative-wide findings in the
initiative `research/` directory and feature-specific findings in the feature
`research/` directory.

Before calling the spec ready, check it against the research discipline,
dependency discipline when packages or setup are involved, and code quality
checklist. Initiative specs should make the feature split, readiness target,
dependencies, and cross-feature constraints clear. Feature specs should name the
expected code organization, architecture boundaries, risky shared surfaces, and
blast radius where those choices matter. Specs must preserve declared
tooling/security constraints; a runtime or package-manager change belongs back
in grill unless the user explicitly approved it. If the repo is greenfield, be more
explicit: the first structure will anchor future agents and should be clean from
slice one.

Before moving from spec to slices, do a quick spec review. Check that scope,
non-goals, success checks, domain language, data/state rules, permissions,
failure paths, research implications, feature boundaries, and code organization
are clear enough to slice without guessing. Fix obvious gaps in the specs; ask
only for decisions that would change the product or risk.
Update the initiative Phase Ledger before slicing. Brainstorm, grill, and spec
should be `done`, `compressed`, or `skipped` with artifact and reason; do not
let a direct jump to slicing hide missing thinking.
After spec review and exit evidence are recorded, do not create slice artifacts
in the same work unit. Update `index.md` so the next action is slice mode and
stop; the next continuation can build the Slice Map from the finished specs.
