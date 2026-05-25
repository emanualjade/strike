# Auto Strike Workspace

Auto Strike owns this root workspace in the consuming repo:

```text
auto-strike/
```

Before writing to `auto-strike/`, check whether it already exists. Treat it as
Auto Strike state only when it contains recognizable Auto Strike files such as
`index.md`, `todo.md`, `language.md`, `decisions.md`, or a feature layout that
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
  features/
    <feature-slug>/
      idea.md
```

Add more files only when useful:

```text
auto-strike/
  architecture/
    architecture.md
    routes.md
    schema.md
  models/
    [concept]-model.md
  features/
    <feature-slug>/
      idea.md
      spec.md
      research.md
      mvp-cut.md
      workflows.md
      readiness.md
      slices/
        index.md
        slice-0-[name].md
```

## Helper Script

Auto Strike ships a read-only workspace helper at the skill-local
`scripts/auto-strike.mjs`, resolved relative to the Auto Strike skill folder.
Use it internally when available:

- `inspect` reports observed workspace state.
- `validate` reports errors, warnings, and notes based on the docs that exist.
- `review-plan` recommends review lenses from active `Changed:` evidence.
- `review-context --lens <lens>` creates compact review packets for the main
  agent to pass to reviewers. Review packets scope evidence to the active slice
  first, the active feature second, and the whole workspace only as a fallback.

The helper is intentionally not an initializer, scaffolder, or workflow engine.
It does not create feature folders, specs, slices, readiness docs, or next-action
decisions. If it cannot run or its output is inconclusive, inspect the workspace
manually and keep moving.

## Index

Use `auto-strike/index.md` as the resume map:

- active feature and next best action
- important docs and what they contain
- current verification commands or checks
- open human decisions
- notes about any non-Auto-Strike docs that matter

Keep it short and scannable:

```md
# Auto Strike

## Active Feature
- [Feature slug/path]
- Current mode: [idea / decisions / spec / slice / build / review / readiness]
- Next best action: [one sentence]

## Project State
- [One-paragraph current truth.]

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
- [ ] Write MVP spec.
- [ ] Slice implementation.
- [ ] Build and verify slice 1.
```

Keep `todo.md` operational, not archival. It should show current work, next
actions, blockers, and accepted follow-ups. Remove or move stale items when the
spec, slices, or `mvp-cut.md` already preserve the decision.

## Evidence

Record evidence wherever it best fits the scale of the work:

- tiny changes: `auto-strike/index.md` or `todo.md`
- sliced work: the relevant `slices/slice-[n]-[name].md`
- larger milestones: `features/<feature-slug>/readiness.md` or a nearby build
  note

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
reason.

Record evidence before asking for focused review or generating
`review-plan` or `review-context` packets. The helper can recommend review
lenses and include implementation files in review packets when slice evidence
has an explicit `Changed:` list; without that, it can still package workspace
docs but cannot reliably infer what changed. Keep `Changed:` aligned with the
actual implementation files changed in the worktree; if Git reports extra
changed files, confirm they are unrelated user work or update the evidence
before review. Record the lenses that actually ran under `Reviewed:` and any
intentionally skipped required lenses under `Skipped:` so future validation can
tell whether review was general, surface-specific, or consciously downgraded. In
multi-feature workspaces, keep active feature evidence current so reviewers are
not distracted by older completed features.

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
`decisions.md` for decisions, `language.md` for terms, the active feature
`spec.md` for product/build scope, slice files for current implementation work,
and `index.md` for navigation/status. Fix contradictions as soon as they are
found.

## Repeated Runs

Auto Strike should get smarter as the repo gains feature history.

- Start by reading `auto-strike/index.md`, `todo.md`, `language.md`, and
  `decisions.md`.
- Detect whether the new idea belongs to an existing feature, extends a prior
  slice, or deserves a new feature folder.
- Reuse language, decisions, architecture notes, and verification patterns.
- Restructure lightly when the current layout is getting in the way: rename a
  vague file, split an overloaded spec, merge duplicate notes, or add an index.
- Preserve user-written content. Summarize or move current truth only when it
  improves future discovery.
- Update `auto-strike/index.md` whenever important docs move or a new feature
  becomes the active focus.
