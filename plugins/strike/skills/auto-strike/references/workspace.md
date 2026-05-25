# Auto Strike Workspace

Auto Strike owns this root workspace in the consuming repo:

```text
auto-strike/
```

Before writing to `auto-strike/`, check whether it already exists. Treat it as
Auto Strike state only when it contains recognizable Auto Strike files such as
`index.md`, `todo.md`, `language.md`, `decisions.md`, or an initiative layout that
matches this reference. If the directory exists but appears unrelated, do not
overwrite or restructure it; ask the user whether to reuse it, choose another
workspace path, or move the unrelated content.

The user should not need to know which docs to create. On every run, discover
what exists, decide what is missing, and update or restructure lightly. On a
cold start, create only files that have real content now; the workspace usually
grows toward this shape:

```text
auto-strike/
  index.md
  todo.md
  language.md
  decisions.md
  initiatives/
    <initiative-slug>/
      idea.md
```

Add more files only when useful:

```text
auto-strike/
  research/
  extras/
  initiatives/
    <initiative-slug>/
      idea.md
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
```

For each `slices/slice-[n]-[name].md`, use the slice template in
`references/slice.md`. The key live sections are `Acceptance Criteria`,
`Depends On`, `Likely Surfaces`, and `Execution Tasks`; they turn the slice into
a small work packet instead of a general concept.

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

Use `auto-strike/language.md` as the shared glossary:

```md
# Language

## [Context]

- Term: Meaning. Use in: code/docs/UI/planning. Avoid: stale aliases.
```

Keep it focused on terms that affect product behavior, user-facing copy, code
names, data models, permissions, integrations, or future planning. Do not add
every casual phrase. Merge aliases into one canonical term when possible, and
flag unresolved ambiguity instead of pretending it is settled.

## Decisions

Use `auto-strike/decisions.md` only for decisions that affect scope, model
shape, user behavior, data, permissions, architecture, or validation:

```md
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
`decisions.md` for decisions, `language.md` for terms, the active initiative
`spec.md` for initiative scope and feature map, feature `feature-spec.md` for
buildable feature scope, slice files for current implementation work, and
`index.md` for navigation/status. Fix contradictions as soon as they are found.

## Repeated Runs

Auto Strike should get smarter as the repo gains feature history.

- Start by reading `auto-strike/index.md`, `todo.md`, `language.md`, and
  `decisions.md`.
- Detect whether the new idea belongs to an existing initiative, extends an
  existing feature or prior slice, or deserves a new initiative.
- Reuse language, decisions, architecture notes, and verification patterns.
- Restructure lightly when the current layout is getting in the way: rename a
  vague file, split an overloaded spec, merge duplicate notes, or add an index.
- Preserve user-written content. Summarize or move current truth only when it
  improves future discovery.
- Update `auto-strike/index.md` whenever important docs move or a new
  initiative, feature, or slice becomes the active focus.
