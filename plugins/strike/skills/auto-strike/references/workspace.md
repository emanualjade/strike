# Auto Strike Workspace

Auto Strike owns this root workspace in the consuming repo:

```text
auto-strike/
```

Before writing to `auto-strike/`, check whether it already exists. Treat it as
Auto Strike state only when it contains recognizable Auto Strike files such as
`index.md`, `todo.md`, `language.md`, or an initiative layout that matches this
reference. If the directory exists but appears unrelated, do not overwrite or
restructure it; ask the user whether to reuse it, choose another workspace path,
or move the unrelated content.

The user should not need to know which docs to create. On every run, discover
what exists, decide what is missing, and update or restructure lightly. On cold
start, create root `language.md` plus the active initiative's `idea.md`,
`decisions.md`, `grill.md`, and `spec.md`. Keep them minimal if the truth is
still emerging, but do not leave them absent once the initiative reaches spec or
later.

```text
auto-strike/
  index.md
  todo.md
  language.md
  initiatives/
    <initiative-slug>/
      idea.md
      decisions.md
      grill.md
      spec.md
```

Add more files only when useful:

```text
auto-strike/
  research/
  extras/
  initiatives/
    <initiative-slug>/
      idea.md
      decisions.md
      grill.md
      spec.md
      readiness.md
      todo.md
      research/
      extras/
      features/
        <feature-slug>/
          feature-spec.md
          readiness.md
          research/
          extras/
          slices/
            index.md
            slice-0-[name].md
```

Use `initiatives/<initiative-slug>/` as the first grouping unit. An initiative
represents one Auto Strike user request, session, campaign, MVP, or milestone.
Create a new initiative only when starting a new Auto Strike run/request that is
meaningfully separate from existing active work.

Every active initiative owns `decisions.md`, `grill.md`, and `spec.md` once it
reaches spec or later, even when they are brief. `decisions.md` may say no
consequential decisions have been made yet, but it must become the current truth
once brainstorm or grill resolves product, model, workflow, permission,
architecture, dependency, or validation decisions. `grill.md` must record either
the decision pressure-test and Decision Checkpoint or the user's explicit opt-out.
`spec.md` may start as a thin initiative overview, but it must exist before
feature specs, slices, or build work proceed.

Inside an initiative, use `features/<feature-slug>/` for buildable capabilities
with their own feature spec, slices, and feature readiness. Decomposition inside
an initiative creates or updates feature folders, not new initiatives. If the
work appears to require a separate initiative, ask the user before creating it.

Use `research/` for source-backed findings and `extras/` for supporting docs
such as schema, routes, architecture notes, workflow diagrams, and exploratory
sketches. Prefer the lowest level that owns the decision. Do not put primary
workflow state in `extras/`.

For multi-slice feature work,
`initiatives/<initiative-slug>/features/<feature-slug>/slices/index.md` should
carry only the useful ordering context:

```md
# Slices

## Slice Map

| Slice | Size | Depends On | Unblocks | Risk | Verification |
| --- | --- | --- | --- | --- | --- |
| 0. [name] | S/M | None | [next slice] | High/Med/Low | [check] |

## Checkpoint: After Slices 1-3
- [ ] App builds or starts without errors.
- [ ] Focused tests or checks pass.
- [ ] Core user/system flow works end to end.
- [ ] Review findings are resolved or accepted.
- [ ] Human decision needed? If yes, pause and ask.

## Slice Review
- [pass/blocker/warning] - [size, dependency, risk, working-state, or verification finding]

## Exit Evidence
- [Why this feature can enter build one slice at a time without guessing.]
```

For each `slices/slice-[n]-[name].md`, use the slice template in
`references/slice.md`. The key live sections are `Acceptance Criteria`,
`Depends On`, `Likely Surfaces`, and `Execution Tasks`; they turn the slice into
a small work packet instead of a general concept.

## Phase Ledger

Each initiative keeps a small `## Phase Ledger`, usually in its `idea.md`. This
is not ceremony; it makes phase compression visible so brainstorm, grill, spec,
slice, build, review, and validation are not silently skipped.

Update it when entering or leaving a phase. Keep one row per phase and replace
the row in place; do not append duplicate `Spec`, `Slice`, or `Build` rows when
state changes.

```md
## Phase Ledger

| Phase | Status | Artifact | Reason |
| --- | --- | --- | --- |
| Brainstorm | done | `idea.md` | First useful outcome, user, constraints, and non-goals are recorded. |
| Grill | compressed | `grill.md` | Prompt already answered core decisions; no consequential blockers found. |
| Spec | done | `spec.md`, `features/[feature]/feature-spec.md` | Single-feature initiative is sliceable. |
| Slice | in progress | `features/[feature]/slices/index.md` | Slices are being sized and ordered. |
| Build | pending |  |  |
| Review | pending |  |  |
| Validate | pending |  |  |
```

Allowed statuses: `in progress`, `done`, `compressed`, `skipped`, `blocked`,
`paused`, or `replaced`. Before slicing or building, earlier phases should be
`done`, `compressed`, or `skipped` with a real artifact and reason. Use
`compressed` only when prior artifacts or explicit user wording already provide
enough detail; use `skipped` only when the user opts out, asks to move along, or
the phase truly does not apply. A detailed kickoff prompt is not, by itself, a
reason to skip brainstorm or grill. Do not mark a phase done because the agent
privately inferred answers; the artifact should show user engagement, explicit
answers, prior-artifact evidence, or explicit permission to skip.
If a question tool failed or no answer was received, keep the phase blocked or
in progress and record the plain-text question to ask next.

Do not mark multiple major phases complete in one work unit. Once a phase row
changes to `done`, `compressed`, `skipped`, or `replaced`, stop after updating
the active doc, `index.md`, and the next action. A later continuation can move
to the next phase. If the user explicitly asked to skip a boundary, record that
reason in the ledger.

After implementation evidence exists, the ledger and `index.md` must not still
look like brainstorm/planning. Build evidence means the build row needs a real
artifact and reason; review evidence means the review row needs a real artifact
and reason. If a phase was compressed, say what artifact carries the work.

## Helper Script

Auto Strike ships a read-only workspace helper at the skill-local
`scripts/auto-strike.mjs`, resolved relative to the Auto Strike skill folder.
Use it internally when available:

- `inspect` reports observed workspace state.
- `validate` reports errors, warnings, and notes based on the docs that exist.
- `review-plan` recommends review lenses from active `Changed:` evidence.
- `review-context --lens <lens>` creates compact read-only reviewer packets.

The helper is intentionally not an initializer, scaffolder, or workflow engine.
It does not create initiative folders, feature folders, specs, slices,
readiness docs, or next-action decisions. If it cannot run or its output is
inconclusive, inspect the workspace manually and keep moving. Use `review.md`
for reviewer behavior, lens selection, and helper packet details.

## Index

Use `auto-strike/index.md` as the resume map:

- active initiative, active feature when relevant, active doc, active slice,
  state, blocker, and next best action
- important docs and what they contain
- current verification commands or checks
- open human decisions
- notes about any non-Auto-Strike docs that matter

Keep it short and scannable:

```md
# Auto Strike

## Active Work
- Initiative: `auto-strike/initiatives/[initiative-slug]`
- Feature: `auto-strike/initiatives/[initiative-slug]/features/[feature-slug]` / None
- Doc: `auto-strike/initiatives/[initiative-slug]/[active-doc].md`
- Slice: `auto-strike/initiatives/[initiative-slug]/features/[feature-slug]/slices/[slice].md` / None
- State: [one short current truth]
- Next: [one concrete action]
- Blocked by: [decision/check/dependency, or "None."]

## Key Docs
- `[path]` - [what to read it for.]

## Open Decisions
- [Decision needed, or "None."]

## Verification
- [Commands/checks known so far.]
```

Refresh `index.md` whenever the active feature, active slice, mode, blocker, or
next action changes. As soon as a feature folder or slice exists, point to it.
Do not leave `Feature: None`, `Slice: None`, stale open decisions, or "no code
written" after build evidence exists. Replace old Active Work values in place;
do not append a second `Feature`, `Doc`, `Slice`, `State`, or `Next` line.

Every concrete `auto-strike/.../*.md` path referenced in Auto Strike docs should
exist. If a future doc is not needed yet, say that in prose without linking to a
missing path.

## Todo

Use `auto-strike/todo.md` as one flat checklist:

```md
# Todo

- [ ] Clarify first useful outcome.
- [ ] Write initiative spec and feature specs.
- [ ] Slice implementation.
- [ ] Build and verify slice 1.
```

Keep `todo.md` operational, not archival. It should show current work, next
actions, blockers, and accepted follow-ups. Remove or move stale items when the
initiative spec, feature specs, slices, or readiness docs already preserve the
decision.

Keep task checkboxes current. If a slice records `Changed:` and `Verified:`,
mark completed execution tasks or move remaining unchecked work into explicit
follow-up, blocker, or skipped/residual-risk evidence.

Use `Active Work` in `index.md` only as a pointer. The active phase or slice doc
owns the task list, decisions, and exit evidence for that phase. After context
compression, the agent should be able to read `index.md`, open the active doc,
and continue one small task without reloading unrelated phase detail.

## Evidence

Record evidence wherever it best fits the scale of the work:

- contained changes: `auto-strike/index.md`, `todo.md`, or the active slice
- sliced work: the relevant `slices/slice-[n]-[name].md`
- feature completion: the feature `readiness.md`
- initiative completion: the initiative `readiness.md`

Use compact evidence, not a diary:

```md
## Evidence

Changed:
- [files/surfaces]

Verified:
- [command/check/browser route/state] - [result]

Edge / Flow Coverage:
- [important edge case or user flow] - [handled/tested/deferred/accepted]

Reviewed:
- [lens] - [pass / blocker / warning and short finding]

Skipped:
- [check] - [reason, risk, replacement evidence]
- [required review lens] - [reason it was not run or was downgraded]

Review Findings:
- [open blocker or "None"]
```

A claim that work is done should be backed by evidence or a clear skipped-check
reason. Record `Changed:` and `Verified:` before review so helper packets can
scope changed files; use `review.md` for review evidence and lens details.

## Language

Create `auto-strike/language.md` on every Auto Strike initiative. It is the
shared glossary and domain-model language across initiatives:

```md
# Language

## [Context]

- Term: Meaning. Use in: code/docs/UI/planning. Avoid: stale aliases.
```

Keep it focused on terms that affect product behavior, user-facing copy, code
names, data models, permissions, integrations, or future planning. Do not add
every casual phrase. Merge aliases into one canonical term when possible, and
flag unresolved ambiguity instead of pretending it is settled.

## Initiative Decisions

Use `auto-strike/initiatives/<initiative-slug>/decisions.md` for decisions that
affect scope, model shape, user behavior, data, permissions, architecture,
dependencies, validation, or risk:

```md
# [Initiative] Decisions

## Status
- No consequential decisions recorded yet.

## [Decision]

Decision: [What we chose.]
Why: [Why this is the current best answer.]
Rejected: [Important alternatives and why.]
Impacts: [Spec/scope/model/UI/API/workflow implications.]
Revisit if: [What would make this worth reopening.]
```

Keep `decisions.md` as current truth, not history. If a decision changes, update
the existing entry so the final choice is clear. Keep rejected options only when
they explain the current decision or prevent likely scope drift.

## Existing Docs And Conflicts

If older planning docs already exist elsewhere, either link to them from
`auto-strike/index.md` or merge the current truth into `auto-strike/`. Do not
move or rewrite large user-written docs just for neatness.

When docs disagree, prefer the newest current-truth artifact in this order:
the active initiative `decisions.md` for decisions, root `language.md` for
terms, the active initiative `spec.md` for initiative scope and feature map,
feature `feature-spec.md` for buildable feature scope, slice files for current
implementation work, and `index.md` for navigation/status. Fix contradictions
as soon as they are found.

## Repeated Runs

Auto Strike should get smarter as the repo gains feature history.

- Start by reading `auto-strike/index.md`, `todo.md`, root `language.md`, and
  the active initiative's `decisions.md` and `spec.md`.
- Detect whether the new idea belongs to an existing initiative, extends an
  existing feature or prior slice, or deserves a new initiative.
- Reuse language, decisions, architecture notes, and verification patterns.
- Restructure lightly when the current layout is getting in the way: rename a
  vague file, split an overloaded spec, merge duplicate notes, or add an index.
- Preserve user-written content. Summarize or move current truth only when it
  improves future discovery.
- Update `auto-strike/index.md` whenever important docs move or a new
  initiative, feature, or slice becomes the active focus.
