# Auto Strike Workspace

Auto Strike owns this root workspace in the consuming repo:

```text
auto-strike/
```

Before writing there, check whether it is already Auto Strike state. Recognize
files such as `index.md`, `todo.md`, `language.md`, or
`initiatives/<slug>/...`. If `auto-strike/` exists but looks unrelated, do not
overwrite it. Ask whether to reuse it, move it, or choose another workspace path.

The user should not need to know which docs to create. Discover what exists,
create what is missing, and keep the structure light.

## Shape

Cold start creates the root index, todo, language file, and active initiative:

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

Add lower-level files only when the work needs them:

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

Use the lowest level that owns the decision:

- `language.md`: shared glossary and domain model across initiatives.
- `initiatives/<slug>/`: one Auto Strike request, session, campaign, MVP, or
  milestone.
- `features/<slug>/`: one buildable capability with its own feature spec,
  slices, and readiness.
- `research/`: source-backed findings.
- `extras/`: supporting notes such as schema, routes, architecture, diagrams, or
  exploratory sketches.

Do not put primary workflow state in `extras/`.

## Initiatives And Features

Create a new initiative only when starting a meaningfully separate Auto Strike
request. A later request like "add image generation" gets its own initiative;
decomposing an existing request creates feature folders inside that initiative,
not new initiatives.

Every active initiative owns `decisions.md`, `grill.md`, and `spec.md` once it
reaches spec or later, even if they are brief:

- `decisions.md`: current product, model, workflow, permission, architecture,
  dependency, validation, and risk decisions.
- `grill.md`: decision pressure-test, Decision Checkpoint, or explicit user
  opt-out.
- `spec.md`: initiative overview and feature map before feature specs, slices,
  or build work proceed.

Inside an initiative, create `features/<feature-slug>/` when the work has
separable outcomes, workflows, roles, domains, readiness targets, or subsystems.
If it looks like a separate initiative, ask the user before creating it.

For multi-slice feature work, `features/<feature-slug>/slices/index.md` carries
the lightweight Slice Map, checkpoints, slice review, and exit evidence. Use
`slice.md` for the slice index and slice document templates.

## Phase Ledger

Each initiative keeps one small `## Phase Ledger`, usually in `idea.md`. It
makes phase compression visible so brainstorm, grill, spec, slice, build,
review, and readiness are not silently skipped.

Update the row when entering or leaving a phase. Replace rows in place; do not
append duplicate `Spec`, `Slice`, or `Build` rows.

```md
## Phase Ledger

| Phase | Status | Artifact | Reason |
| --- | --- | --- | --- |
| Brainstorm | done | `idea.md` | First useful outcome, user, constraints, and non-goals are recorded. |
| Grill | in progress | `grill.md` | Decisions are being pressure-tested. |
| Spec | pending |  |  |
| Slice | pending |  |  |
| Build | pending |  |  |
| Review | pending |  |  |
| Readiness | pending |  |  |
```

Allowed statuses: `in progress`, `done`, `compressed`, `skipped`, `blocked`,
`paused`, or `replaced`.

Rules:

- Before slicing or building, earlier phases should be `done`, `compressed`, or
  `skipped` with artifact and reason.
- Use `compressed` only when prior artifacts or explicit user wording already
  answer the phase.
- Use `skipped` only when the user opts out, asks to move along, or the phase
  truly does not apply.
- A detailed kickoff prompt is not enough to skip brainstorm or grill.
- If the question tool failed or no answer was received, keep the phase blocked
  or in progress and record the plain-text question to ask next.
- Do not mark multiple major phases complete in one work unit unless the user
  explicitly skipped that boundary.
- After implementation evidence exists, the ledger and `index.md` must not still
  look like brainstorm or planning.

## Helper

Auto Strike ships a read-only helper at the skill-local
`scripts/auto-strike.mjs`, resolved relative to the Auto Strike skill folder.
Use it internally when available:

- `inspect`: report observed workspace state.
- `validate`: report errors, warnings, and notes from existing docs.
- `review-plan`: recommend review lenses from active `Changed:` evidence.
- `review-context --lens <lens>`: create compact read-only reviewer packets.

The helper audits state. It does not initialize folders, choose scope, advance
phases, dispatch reviewers, or replace judgment. If it cannot run, inspect
manually and keep moving.

## Index

Use `auto-strike/index.md` as the front door for resume:

```md
# Auto Strike

## Active Work
- Initiative: `auto-strike/initiatives/[initiative-slug]`
- Feature: `auto-strike/initiatives/[initiative-slug]/features/[feature-slug]` / None
- Current mode: brainstorm / grill / spec / slice / build / review / readiness
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

Keep `index.md` short. It is a pointer, not the source of truth.

Refresh it whenever initiative, feature, slice, mode, blocker, or next action
changes. Replace old Active Work values in place. Do not append a second
`Feature`, `Current mode`, `Doc`, `Slice`, `State`, or `Next`.

Concrete `auto-strike/.../*.md` links should exist. If a future doc is not
needed yet, mention it without linking a missing path.

If `index.md`, Key Docs, the active feature, active slice, or active doc point
to missing or contradictory state, read `recovery.md`. Repair enough truth to
resume safely before build, review, or readiness.

## Todo

Use `auto-strike/todo.md` as one flat operational checklist:

```md
# Todo

- [ ] Clarify first useful outcome.
- [ ] Write initiative spec and feature specs.
- [ ] Slice implementation.
- [ ] Build and verify slice 1.
```

Keep it current, not archival. Remove stale items when specs, slices, readiness,
or evidence already preserve the decision. If a slice records `Changed:` and
`Verified:`, mark completed execution tasks or move remaining work into explicit
follow-up, blocker, or skipped/residual-risk evidence.

After context compression, the agent should be able to read `index.md`, open the
active doc, and continue one small task without loading unrelated phase detail.

## Evidence

Record evidence where it best fits the scale:

- contained changes: `index.md`, `todo.md`, or the active slice
- sliced work: `slices/slice-[n]-[name].md`
- feature completion: feature `readiness.md`
- initiative completion: initiative `readiness.md`

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

Done claims need evidence or a clear skipped-check reason. Record `Changed:` and
`Verified:` before review so helper packets can scope changed files. Use
`review.md` for review behavior and lens details.

## Language

Create `auto-strike/language.md` for every Auto Strike initiative. It is the
shared glossary and domain-model language across initiatives:

```md
# Language

## [Context]

- Term: Meaning. Use in: code/docs/UI/planning. Avoid: stale aliases.
```

Keep terms that affect product behavior, user-facing copy, code names, data
models, permissions, integrations, or future planning. Do not add every casual
phrase. Merge aliases into one canonical term when possible. Flag ambiguity
instead of pretending it is settled.

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
the existing entry. Keep rejected options only when they explain the current
choice or prevent likely scope drift.

## Existing Docs And Conflicts

If older planning docs exist elsewhere, link them from `index.md` or merge the
current truth into `auto-strike/`. Do not move or rewrite large user-written
docs just for neatness.

When docs disagree, prefer current-truth artifacts in this order:

1. active initiative `decisions.md` for decisions
2. root `language.md` for terms
3. active initiative `spec.md` for initiative scope and feature map
4. feature `feature-spec.md` for buildable feature scope
5. slice files for current implementation work
6. `index.md` for navigation/status

Fix contradictions when found.

## Repeated Runs

Auto Strike should get smarter as the repo gains feature history.

Start by reading `index.md`, `todo.md`, root `language.md`, and the active
initiative's `decisions.md` and `spec.md`. Then decide whether the new idea
belongs to an existing initiative, extends an existing feature or slice, or
deserves a new initiative.

Reuse language, decisions, architecture notes, and verification patterns.
Restructure lightly when the layout gets in the way: rename vague files, split
an overloaded spec, merge duplicate notes, or add an index. Preserve
user-written content. Move or summarize current truth only when it improves
future discovery.
