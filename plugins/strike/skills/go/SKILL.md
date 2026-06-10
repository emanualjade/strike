---
name: go
description: Use when the user asks Strike to continue or resume the active initiative from existing workflow state.
argument-hint: "[optional context]"
disable-model-invocation: true
allowed-tools: Read Write Edit MultiEdit Bash Grep Glob WebFetch WebSearch Agent
---

# Go

Continue the active Strike initiative from existing state. Do not create a
new initiative in this skill.

## The Workflow Skills

- `refine-idea/SKILL.md` - clarify the raw idea into a useful first outcome.
- `research-initiative/SKILL.md` - research approved initiative-level dependencies before grilling decisions.
- `grill-idea/SKILL.md` - pressure-test key decisions before specs.
- `create-main-spec/SKILL.md` - define the whole feature or MVP at a durable level.
- `create-development-phases/SKILL.md` - split the main spec into buildable phases.
- `create-phase-spec/SKILL.md` - define one phase clearly enough to slice.
- `research-phase/SKILL.md` - research and audit phase-level implementation facts before slicing.
- `create-phase-slices/SKILL.md` - split one phase into cohesive buildable slices.
- `plan-slice/SKILL.md` - plan one slice before coding, adding only narrow research deltas.
- `verify-slice-plan/SKILL.md` - check that one slice plan is ready to build.
- `build-slice/SKILL.md` - implement one verified slice plan.
- `verify-slice-build/SKILL.md` - test, review, and close one built slice.
- `verify-phase/SKILL.md` - confirm all slices satisfy the phase spec.
- `verify-main-spec/SKILL.md` - confirm all phases satisfy the main spec.

## Repair Skill

- `fix` (`fix/SKILL.md`) repairs issues from a failed verification pass, then
  returns to the same verifier.

## Running Order

Start at the first workflow skill and move down the list one skill at a time.

Workflow skills are unaware of Strike mechanics except for the canonical
workflow artifact path named in their own instructions. When using them inside
Strike, pass the relevant context and completion check as skill arguments.
Each skill's own `SKILL.md` names its required inputs.

A workflow skill may still send Strike back to an earlier skill when its
output reveals a real decision, scope, research, spec, or plan problem that
cannot honestly be repaired in the verification loop.

Do not move forward until the current workflow skill has produced its required
output, route-back instructions, or a clear unresolved decision.

## Go Behavior

At the start of every run, inspect the existing Strike workspace.

If `strike/state.json` exists, run:

```text
node <go skill dir>/scripts/state.mjs sync-helper
node strike/scripts/state.mjs next-step
```

Use the current packaged helper for `sync-helper`, then use the refreshed
workspace helper for `next-step`. This keeps existing workspaces on the
current workflow gates after a plugin update. If the helper refuses to
overwrite an unrecognized file, stop and ask the user instead of editing the
helper by hand.

If `next-step` returns `status: "active"`, resume from the returned workflow
skill unless the user asks to jump, revisit, or repair an earlier step.

If there is no workflow state, tell the user to start with `new-initiative`.

If state exists but no initiative is active, `next-step` returns
`status: "idle"`. Run `list-initiatives`, then ask which initiative to
activate or whether to start a new initiative.

If the current state is unclear, repair it with the helper when possible or
surface the specific state question before continuing.

## The Helper Is The Law

The workspace helper owns workflow state and every completion gate:

```text
node strike/scripts/state.mjs next-step
node strike/scripts/state.mjs complete-check <check-name>
node strike/scripts/state.mjs reopen-check <check-name>
node strike/scripts/state.mjs reopen-phase-check <phase-id> <check-name>
node strike/scripts/state.mjs reopen-slice-check <phase-id> <slice-id> <check-name>
node strike/scripts/state.mjs add-phase <phase-id> [name]
node strike/scripts/state.mjs add-slice <phase-id> <slice-id> [name]
node strike/scripts/state.mjs remove-slice <phase-id> <slice-id>
node strike/scripts/state.mjs list-initiatives
node strike/scripts/state.mjs set-active <initiative-id>
node strike/scripts/state.mjs finish-initiative [initiative-id]
node strike/scripts/state.mjs sync-helper
```

`next-step` returns the next workflow skill, the missing checks, the artifact
paths, and a `gateHints` entry describing what each missing check's artifact
must say. `complete-check` validates the artifact against its gate and refuses
with a specific reason when the gate is not satisfied. Trust the hints and the
errors; do not guess at gates or restate them.

Use canonical IDs: initiatives like `gallery`, phases like `phase-01`, slices
like `slice-03-b`. IDs are not titles; pass human names as the optional name
argument. The helper normalizes common numeric inputs and stores phases and
slices in canonical order.

Edit state files directly only when the helper does not support the needed
operation yet. Keep the same state shape: a compact root index in
`strike/state.json`, authoritative for initiative lifecycle, and detailed
progress in `strike/initiatives/<initiative-id>/state.json`. Markdown files
store the actual artifacts; state files store progress facts.

## Step Discipline

Move one Strike workflow step at a time: run `next-step`, do the one returned
workflow skill, complete the first check in `missing`, then run `next-step`
again before doing another workflow step. The completion receipt is not a
workflow position. Do not mark later checks complete just because their
artifacts already exist.

Treat the `next-step` result as an exclusive gate. Do not create or edit
artifacts owned by later workflow skills until `next-step` points to that
skill. In particular:

- Do not edit implementation files, tests, package metadata, or runtime docs
  until the `next-step` result's `skill` is `build-slice`.
- Do not write verification artifacts until the `next-step` result's `skill`
  is the matching verifier.
- Do not backfill planning artifacts around code that was already built.
- Repo inspection for the current step is fine; implementation is not.
- If you accidentally do later-step work early, stop and report the workflow
  violation instead of backfilling documents and marking checks complete.

If the host cannot invoke a skill from inside this skill, read that skill's
`SKILL.md` from the installed Strike plugin and follow it directly with the
same arguments.

## Workspace

Workflow artifacts live under `strike/initiatives/<initiative-id>/`;
`next-step` returns the artifact paths for the current step. Stages that plan,
build, fix, or verify code read implementation discipline `global.md` plus
their own stage file from `strike/user-guidance/implementation-discipline/`.
Verifiers also read review-lenses `global.md` plus their own stage file from
`strike/user-guidance/review-lenses/`.

`strike/research/` is the durable cross-initiative research library. Research
stages read it before researching, verify only the claims the current work
leans on, and write durable findings back, following the plugin's
`references/research-library.md`.

`supporting-artifacts/` is optional initiative context created during Grill.
It is not hidden source of truth: decisions and constraints required for
planning must be summarized in `decisions.md` and carried into
`main-spec.md`. Later stages should scan this directory when it exists and
read only files relevant to their current step.

## Boundary Changes

When a slice plan's `Boundary Recommendation` says `Needed: yes`, apply the
boundary change, run `reopen-check planCreated`, then continue from
`next-step`:

- For `Type: split`, edit the current slice into the first replacement slice
  and add replacement slice stubs with `add-slice`. Preserve the original
  slice ID as the first smaller slice whenever possible, and use canonical
  suffix IDs such as `slice-03-b` and `slice-03-c` for the additional slices.
- For `Type: merge`, fold each absorbed slice's stub into the current slice's
  `slice.md`, unregister it with `remove-slice`, and delete its slice
  directory. When merging, keep the active slice's ID as the surviving slice
  and absorb only later slices with no completed checks; `remove-slice`
  refuses to remove a slice that has completed checks.

If the plan's `Route Back` names `slicesCreated` or `phaseResearchComplete`
instead, follow that command: the phase slice list or phase research must be
repaired before local slice planning can continue.

Larger unplanned enabling work discovered during planning, build, or fix
follows the same path: turn the active slice into the enabling slice when
possible, create a follow-up slice for the original planned outcome, register
added slice stubs with `add-slice`, then rerun `reopen-check planCreated`.

## Failed Verification And Route-Back

When a verifier returns not-ready with `Fix Needed: yes`, run `fix` with the
failed verification artifact, the relevant initiative, phase, and slice
artifacts, and prior fix reports for the same verifier when present. After
`fix` writes `Fixed: yes`, run the same verifier again. Keep the current
verification check incomplete until that verifier passes.

The verifier owns issue judgment; `fix` repairs `Must Fix` items. Do not let
the loop expand the feature: `Follow-Up` and `Accepted Risk` items do not keep
the loop alive unless they are required by the current spec or acceptance
criteria.

When any artifact's `Route Back` says `Needed: yes`, run its named `Command`
with its `Phase`, `Slice`, and `Check`, then continue from `next-step`. Route
back only when the issue cannot honestly be repaired inside the current
verification loop. Reopening a check also reopens later checks in the same
workflow scope and dependent downstream verification checks, so stale work
cannot stay marked complete.

If `fix` writes `Fixed: no` without route-back, surface the unresolved
decision without broadening the feature.

## Slice Git Checkpoint

After `buildVerified` is complete for a slice, commit and push that slice
before moving to the next slice when the workspace is a git repository and push
is available.

- Include only changes from that completed slice.
- Use a concise message naming the slice ID and outcome.
- If commit or push is unavailable because the workspace is not a git
  repository, no remote exists, auth is blocked, or user/project rules forbid
  it, record the reason and continue according to user/project rules.
- A completed slice checkpoint is a waypoint, not a pause. After the checkpoint
  succeeds or is recorded as unavailable, run `next-step` and continue with the
  returned workflow skill unless the user asked to pause or a real blocker
  remains.
- Do not prescribe extra git inspection commands; let the agent use normal
  judgment.

## Continuation

Phase boundaries are normal workflow handoffs, not automatic pauses. Slice
boundaries are normal workflow handoffs too. Stage-local verifier instructions
such as not starting another slice mean that verifier does not own next-slice
work; they hand control back to this `go` orchestrator inside the same run. Do
not report back to the user merely because one slice completed. Continue with
the step `next-step` returns unless the user asked to pause or the workflow is
blocked.

Completing `allPhasesVerified` marks the initiative complete; `next-step`
then reports `status: "idle"` unless another initiative is active.

## Basic Rule

Strike owns the workflow. Each workflow skill owns one step.

## Ownership

Strike owns:

- choosing the next workflow skill
- passing the right context to that skill
- saving workflow state and artifacts
- deciding whether the workflow can advance

Workflow skills own:

- doing one step well
- asking any unresolved question for that step
- returning the artifact, decision, unresolved issue, or exit evidence for that step
