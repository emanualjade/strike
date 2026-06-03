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
- `create-phase-slices/SKILL.md` - split one phase into small focused buildable slices.
- `research-slice/SKILL.md` - research one slice before planning.
- `plan-slice/SKILL.md` - plan one researched slice before coding.
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

When a verifier fails, run `fix` with the failed verification artifact, then
run the same verifier again. Keep the current verification check incomplete
until that verifier passes.

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
workspace helper for `next-step`. If `next-step` returns `status: "active"`,
resume from the returned workflow skill unless the user asks to jump, revisit,
or repair an earlier step.

If there is no workflow state, tell the user to start with
`new-initiative`.

If state exists but no initiative is active, `next-step` returns
`status: "idle"`. Run:

```text
node strike/scripts/state.mjs list-initiatives
```

Then ask which initiative to activate or whether to start a new initiative.

If the current state is unclear, repair it with the helper when possible or
surface the specific state question before continuing.

## State

Strike stores the initiative index in `strike/state.json`. The root index is
authoritative for initiative lifecycle fields such as `status` and
`activeInitiativeId`. Detailed workflow facts for one initiative live in that
initiative's own state file:

```text
strike/state.json
strike/initiatives/<initiative-id>/state.json
```

Agents may read state files when the helper output is unclear or repair is
needed, but keep the read focused:

- read `strike/state.json` to see the active initiative and short initiative
  list
- read only `strike/initiatives/<initiative-id>/state.json` for detailed
  progress on the active or explicitly selected initiative
- do not read every initiative state file unless switching initiatives,
  repairing cross-initiative state, or answering a user question about multiple
  initiatives

Root state example:

```json
{
  "version": 2,
  "activeInitiativeId": "gallery",
  "initiatives": [
    {
      "id": "gallery",
      "name": "Gallery",
      "status": "active",
      "statePath": "initiatives/gallery/state.json"
    },
    {
      "id": "billing-ledger",
      "name": "Billing Ledger",
      "status": "complete",
      "statePath": "initiatives/billing-ledger/state.json"
    }
  ]
}
```

Initiative state example:

```json
{
  "version": 2,
  "id": "gallery",
  "name": "Gallery",
  "initiativeWorkflow": [
    { "skill": "refine-idea", "verified": { "ideaRefined": true } },
    { "skill": "research-initiative", "verified": { "initiativeResearchComplete": true } },
    { "skill": "grill-idea", "verified": { "decisionsResolved": true } },
    { "skill": "create-main-spec", "verified": { "specCreated": true } },
    { "skill": "create-development-phases", "verified": { "phasesCreated": true } },
    { "skill": "verify-main-spec", "verified": { "allPhasesVerified": false } }
  ],
  "phases": [
    {
      "id": "phase-01",
      "name": "Upload and display",
      "phaseWorkflow": [
        { "skill": "create-phase-spec", "verified": { "phaseSpecCreated": true } },
        { "skill": "create-phase-slices", "verified": { "slicesCreated": true } },
        { "skill": "verify-phase", "verified": { "allSlicesVerified": false } }
      ],
      "slices": [
        {
          "id": "slice-01",
          "name": "Upload image",
          "sliceWorkflow": [
            { "skill": "research-slice", "verified": { "researchComplete": true } },
            { "skill": "plan-slice", "verified": { "planCreated": true } },
            { "skill": "verify-slice-plan", "verified": { "planVerified": true } },
            { "skill": "build-slice", "verified": { "implemented": true } },
            { "skill": "verify-slice-build", "verified": { "buildVerified": true } }
          ]
        },
        {
          "id": "slice-02",
          "name": "Display gallery",
          "sliceWorkflow": [
            { "skill": "research-slice", "verified": { "researchComplete": false } },
            { "skill": "plan-slice", "verified": { "planCreated": false } },
            { "skill": "verify-slice-plan", "verified": { "planVerified": false } },
            { "skill": "build-slice", "verified": { "implemented": false } },
            { "skill": "verify-slice-build", "verified": { "buildVerified": false } }
          ]
        }
      ]
    }
  ]
}
```

Markdown files store the actual artifacts. State files store progress facts.

The helper derives the next workflow step from the verification matrices.

## Step Discipline

Move one Strike workflow step at a time.

- Run `node strike/scripts/state.mjs next-step`.
- Do the one workflow skill returned by `next-step`.
- Complete only the first check named in that result's `missing` list.
- Run `node strike/scripts/state.mjs next-step` again before doing another
  workflow skill.

Do not batch multiple `complete-check` commands together. Do not mark later
checks complete just because their artifacts already exist. If you created more
than one artifact while working, still re-enter through `next-step` after each
completed check and let the helper decide the next step.

The JSON returned by `complete-check` is only a receipt. It intentionally does
not return the next workflow skill, missing checks, or artifact paths. Always
run `next-step` again before doing or completing another workflow step.
Phase boundaries are normal workflow handoffs, not automatic pauses. If
`allSlicesVerified` completes and `next-step` returns the next phase's
`create-phase-spec`, continue with that returned step unless the user asked to
pause or the workflow is blocked.

Slice boundaries are normal workflow handoffs too. After `buildVerified`
completes and the slice git checkpoint is done, run `next-step`. If it returns
the next slice's `research-slice`, continue with that returned step unless the
user asked to pause or the workflow is blocked. Stage-local verifier instructions
such as not starting another slice mean that verifier does not own next-slice
work; they are not a stop condition for `go`.

Treat the `next-step` result as an exclusive gate. Do not create or edit artifacts
owned by later workflow skills until `next-step` points to that skill. In
particular:

- Do not edit implementation files, tests, package metadata, or runtime docs
  until the `next-step` result's `skill` is `build-slice`.
- Do not write verification artifacts until the `next-step` result's `skill`
  is the matching verifier.
- Do not backfill planning artifacts around code that was already built.
- Repo inspection for the current step is fine; implementation is not.
- If you accidentally do later-step work early, stop and report the workflow
  violation instead of backfilling documents and marking checks complete.

## Workspace Helper

The first new-initiative run creates:

```text
PROJECT_LANGUAGE.md
strike/
  user-guidance/
    implementation-discipline/
      global.md
      plan-slice.md
      build-slice.md
      fix.md
      verify-slice-plan.md
      verify-slice-build.md
      verify-phase.md
      verify-main-spec.md
    review-lenses/
      global.md
      verify-slice-plan.md
      verify-slice-build.md
      verify-phase.md
      verify-main-spec.md
  state.json
  scripts/state.mjs
  initiatives/
```

It runs the packaged helper once:

```text
node <new-initiative skill dir>/scripts/state.mjs init <initiative-id> [name]
```

This creates starter state, copies the helper to
`strike/scripts/state.mjs`, and initializes `strike/user-guidance/`
as user-owned workflow guidance. Strike stages that plan, build, fix, or
verify code should read implementation discipline `global.md` plus their own
stage file. Verifiers should also read review-lenses `global.md` plus their own
stage file.

At the start of a Strike resume, refresh the copied workspace helper from the
current packaged helper before using it:

```text
node <go skill dir>/scripts/state.mjs sync-helper
```

This keeps existing workspaces on the current workflow gates after a plugin
update. If the helper refuses to overwrite an unrecognized file, stop and ask
the user instead of editing the helper by hand.

After bootstrap, use the workspace helper:

```text
node strike/scripts/state.mjs next-step
node strike/scripts/state.mjs list-initiatives
node strike/scripts/state.mjs set-active <initiative-id>
node strike/scripts/state.mjs finish-initiative [initiative-id]
node strike/scripts/state.mjs sync-helper
node strike/scripts/state.mjs complete-check <check-name>
node strike/scripts/state.mjs reopen-check <check-name>
node strike/scripts/state.mjs reopen-phase-check <phase-id> <check-name>
node strike/scripts/state.mjs reopen-slice-check <phase-id> <slice-id> <check-name>
node strike/scripts/state.mjs add-phase <phase-id> [name]
node strike/scripts/state.mjs add-slice <phase-id> <slice-id> [name]
```

## IDs

Use canonical IDs for generated phases and slices:

- initiatives: `gallery`, `payment-system`, `checkout-redesign`
- phases: `phase-01`, `phase-02`, `phase-03-b`
- slices: `slice-01`, `slice-02`, `slice-03-b`

IDs are not titles. Put human names in the optional name argument:

```text
node strike/scripts/state.mjs add-phase phase-01 "Upload and display"
node strike/scripts/state.mjs add-slice phase-01 slice-01 "Upload image"
```

The helper normalizes common numeric inputs such as `1`, `01`, `phase-1`, and
`1-b`. It stores phases and slices in canonical ID order even when they are
registered out of order. It rejects human names such as `payments`; use those
as display names.

## Artifacts

Workflow artifacts live under:

```text
strike/initiatives/<initiative-id>/
```

Default outputs:

- `refine-idea` -> `idea.md`
- `research-initiative` -> `research/scope.md`, one report per approved
  research item, one audit under `research/audits/` per approved research item,
  and `research/index.md`
- `grill-idea` -> `decisions.md`, optionally `supporting-artifacts/<topic>.md`
- `create-main-spec` -> `main-spec.md`
- `create-development-phases` -> `development-plan.md`, `phases/<phase-id>/phase.md`, and initiative state phase entries
- `create-phase-spec` -> `phases/<phase-id>/phase-spec.md`
- `create-phase-slices` -> `phases/<phase-id>/slices/<slice-id>/slice.md` and initiative state slice entries
- `research-slice` -> `phases/<phase-id>/slices/<slice-id>/research.md`
- `plan-slice` -> `phases/<phase-id>/slices/<slice-id>/plan.md`
- `verify-slice-plan` -> `phases/<phase-id>/slices/<slice-id>/plan-verification.md`
- `build-slice` -> implementation files and `phases/<phase-id>/slices/<slice-id>/build.md`
- `verify-slice-build` -> `phases/<phase-id>/slices/<slice-id>/build-verification.md`
- `fix` -> the next local `fixes/fix-001.md`, `fix-002.md`, etc. beside the failed verification evidence
- `verify-phase` -> `phases/<phase-id>/verification.md`
- `verify-main-spec` -> `verification.md`

Initiative research is a required pre-grill workflow artifact. It may conclude
that no material research is needed, but only after a user-approved scope
checkpoint. When material research is approved, each per-item report must be
audited before Grill can run. Slice research is also required for every
implementation slice.

`supporting-artifacts/` is optional initiative context created during Grill
when schema, architecture, provider routing, data lifecycle, permissions, or
other decision reasoning needs a concise note outside `decisions.md`. It is not
hidden source of truth: decisions and constraints required for planning must be
summarized in `decisions.md` and carried into `main-spec.md`. Later research,
spec, phase, slice, plan, build, and verification stages should scan this
directory when it exists and read only files relevant to their current step.

## State Helper

Use the state helper for workflow state:

```text
node strike/scripts/state.mjs next-step
node strike/scripts/state.mjs complete-check <check-name>
node strike/scripts/state.mjs reopen-check <check-name>
node strike/scripts/state.mjs reopen-phase-check <phase-id> <check-name>
node strike/scripts/state.mjs reopen-slice-check <phase-id> <slice-id> <check-name>
```

The helper should own:

- creating starter state
- calculating the next workflow step
- resolving artifact paths for the next workflow skill
- adding phases and slices
- marking verification items complete
- reopening verification items when a later verification routes back
- reopening a specific phase check from main-spec verification
- reopening a specific slice check from phase-level verification
- listing missing verification items

Edit state files directly only when the helper does not support the needed
operation yet. Keep the same state shape and touch only the compact root index
or the relevant initiative-local state file.

## Running A Workflow Skill

Use the workspace helper to get the next skill, missing check, and artifact
path:

```text
node strike/scripts/state.mjs next-step
```

Run the returned workflow skill with its context and artifact path. Use
the first value in `missing` as the completion check for that step. If the host
cannot invoke a skill from inside this skill, read that skill's `SKILL.md` from
the installed Strike plugin and follow it directly with the same arguments.

Stay inside that one skill's ownership boundary. For example, `refine-idea`
may inspect enough context to clarify the request, but it must not create
decisions, specs, phase files, slices, code, tests, or verification evidence.
`create-development-phases` may create phase stubs and register them with
`add-phase`, but it must not create phase specs, slices, code, or verification
evidence.

After the artifact is created and checked, complete the matching check:

```text
node strike/scripts/state.mjs complete-check <check-name>
```

Complete only that one returned check. The completion receipt is not a workflow
position; run `node strike/scripts/state.mjs next-step` again to learn the next
allowed step. Do not chain multiple `complete-check` commands in one shell
command.

Do not complete `researchComplete` unless `research.md` says
`Ready for planning: yes`. If it says `Ready for planning: no`, follow the
research output: split the slice, route back, or surface the unresolved
decision from `Reason` and `## Questions Or Blockers`.

Do not complete `planCreated` if `plan.md` says `Split Recommendation` is
`Needed: yes`. Split the active slice, add any replacement slice stubs with
`add-slice`, run `reopen-check researchComplete`, then continue from `next-step`.

Do not complete `ideaRefined` unless `idea.md` contains `## User Checkpoint`,
records a non-empty `User response:`, and says `Ready to continue: yes`.

Do not complete `initiativeResearchComplete` unless `research/scope.md`
contains `## User Checkpoint`, records a non-empty `User response:`, and says
`Ready to research: yes`, `research/index.md` says `Ready for grill: yes`, and
each approved research item has a non-empty report file and a non-empty audit
file referenced by `research/index.md`. The index must show `Verdict: pass` or
`Verdict: accepted-risk` and `Must Fix count: 0` for every approved research
item. If no material research is needed, `research/scope.md` must explicitly
say `No material research needed: yes`.

Do not complete `decisionsResolved` unless `decisions.md` contains
`## User Checkpoint`, records a non-empty `User response:`, and says
`Ready to continue: yes`, and contains `## Decision Review` with
`Verdict: pass` or `Verdict: accepted-risk` and `Must Fix count: 0`.

Do not complete `phasesCreated` until `development-plan.md` exists, each
planned phase has a phase stub, and each planned phase has been added with
`add-phase`.

Do not complete `slicesCreated` until each planned slice has a slice stub and
has been added with `add-slice`.

Do not complete `implemented` unless `build.md` says `Built: yes`. If it says
`Built: no` and `Route Back` says `Needed: yes`, run the named route-back
`Command` with its `Phase`, `Slice`, and `Check`.

Do not complete `planVerified` unless `plan-verification.md` says `Ready: yes`.
If it says `Ready: no` and `Fix Needed: yes`, run `fix`, then run
`verify-slice-plan` again.

Do not complete `buildVerified` unless `build-verification.md` says
`Verified: yes`. If it says `Verified: no` and `Fix Needed: yes`, run `fix`,
then run `verify-slice-build` again.

After completing `buildVerified`, complete the slice git checkpoint before
moving to the next slice.

Do not complete `allSlicesVerified` unless `verification.md` says
`Ready: yes`. If it says `Ready: no` and `Fix Needed: yes`, run `fix`, then
run `verify-phase` again.

Do not complete `allPhasesVerified` unless the initiative `verification.md`
says `Ready: yes`. If it says `Ready: no` and `Fix Needed: yes`, run `fix`,
then run `verify-main-spec` again.

Completing `allPhasesVerified` marks the initiative complete. Run `next-step`
after the completion receipt; it should report `status: "idle"` unless another
initiative is active. `finish-initiative` still exists for explicit recovery of
older state or manual closure, but a normal Strike run does not need it
after the final check.

## Failed Verification Loop

When a verification skill returns `Ready: no` or `Verified: no`, do not
complete the current check.

If its artifact says `Fix Needed: yes`, run `fix` with:

```text
- the failed verifier name
- the failed verification artifact path
- the relevant initiative, phase, and slice artifacts
- prior fix reports for the same verifier, when present
```

After `fix` writes `Fixed: yes`, run the same verifier again. Repeat only for
new or still-open `Must Fix` issues inside accepted scope.

The verifier owns issue judgment. It categorizes findings as `Must Fix`,
`Follow-Up`, or `Accepted Risk`. `fix` repairs `Must Fix` items and records what
changed. The same verifier decides whether the repair passes.

Use severity only to clarify priority: `P0` and `P1` issues normally belong in
`Must Fix`; `P2` and `P3` issues normally become `Follow-Up` or
`Accepted Risk` unless they are required by accepted scope.

Do not let the loop expand the feature. `Follow-Up` and `Accepted Risk` items
do not keep the loop alive unless they are required by the current spec or
acceptance criteria.

If `fix` writes `Fixed: no` and `Route Back` says `Needed: yes`, run the named
route-back `Command` with its `Phase`, `Slice`, and `Check`, then continue from
`next-step`. If `fix` writes `Fixed: no` without route-back, surface the
unresolved decision without broadening the feature.

## Slice Git Checkpoint

After `buildVerified` is complete for a slice, commit and push that slice
before moving to the next slice when the workspace is a git repository and push
is available.

- Include only changes from that completed slice.
- Use a concise message naming the slice ID and outcome.
- If commit or push is unavailable because the workspace is not a git
  repository, no remote exists, auth is blocked, or user/project rules forbid
  it, record the reason and continue according to user/project rules.
- Do not prescribe extra git inspection commands; let the agent use normal
  judgment.

## Route-Back Handling

Route back only when the issue cannot honestly be repaired inside the current
verification loop.

When any artifact's `Route Back` says `Needed: yes`, run its named `Command`
with its `Phase`, `Slice`, and `Check`, then continue from `next-step`.

For current-scope route-back:

```text
node strike/scripts/state.mjs reopen-check <owning-check-name>
node strike/scripts/state.mjs next-step
```

For a specific slice route-back:

```text
node strike/scripts/state.mjs reopen-slice-check <phase-id> <slice-id> <owning-check-name>
node strike/scripts/state.mjs next-step
```

For a specific phase route-back:

```text
node strike/scripts/state.mjs reopen-phase-check <phase-id> <owning-check-name>
node strike/scripts/state.mjs next-step
```

Use route-back for missing decisions, changed accepted scope, untrustworthy
research/spec/plan artifacts, or repeated blockers that no longer look like a
contained repair.

`reopen-check` reopens the named check and all later checks in the same workflow
scope. It also reopens dependent phase, slice, or main verification checks when
the reopened item could make downstream work stale. `reopen-phase-check` and
`reopen-slice-check` do the same for targeted phase and slice route-backs.

Common route backs:

- missing or weak slice research -> `reopen-check researchComplete`
- missing or weak initiative research -> `reopen-check initiativeResearchComplete`
- weak slice plan -> `reopen-check planCreated`
- oversized slice discovered before build -> edit the current slice into the
  first smaller replacement slice, create additional replacement slice stubs,
  run `add-slice <phase-id> <slice-id> [name]` for each added slice, then rerun
  `reopen-check researchComplete`. Do not force the oversized slice through
  build.
- weak slice build -> `reopen-check implemented`
- phase verification finds weak slice build verification -> `reopen-slice-check <phase-id> <slice-id> buildVerified`
- main verification finds weak phase verification -> `reopen-phase-check <phase-id> allSlicesVerified`
- main verification finds weak phase shape -> `reopen-phase-check <phase-id> phaseSpecCreated`
- main verification finds missing provider/API/model/repo-pattern research that
  affects initiative decisions -> `reopen-check initiativeResearchComplete`

When splitting an active slice, preserve the original slice ID as the first
smaller slice whenever possible. Use canonical suffix IDs such as `slice-03-b`
and `slice-03-c` for the additional slices so workflow state can keep moving in
order.

If the owning earlier check is already open, `next-step` should already point at
the owning skill; run that skill instead of editing state by hand.

## Workflow Handoff Pattern

Run `next-step`, invoke the returned skill with the relevant artifact paths, then
complete the returned check only after the step's artifact passes its gate.

Initiative setup:

- `refine-idea`: pass the raw request; write `idea.md`; complete
  `ideaRefined` only after the user checkpoint says `Ready to continue: yes`.
- `research-initiative`: pass `idea.md`; write `research/scope.md`, one report
  per approved research item, one audit under `research/audits/` per approved
  research item, and `research/index.md`; complete
  `initiativeResearchComplete` only after the research scope checkpoint says
  `Ready to research: yes`, the index says `Ready for grill: yes`, and every
  approved research item has a report file plus a passing or accepted-risk
  audit with no unresolved Must Fix findings.
- `grill-idea`: pass `idea.md` plus `research/scope.md`,
  `research/index.md`, and relevant research reports; write `decisions.md`; complete
  `decisionsResolved` only after the user checkpoint says
  `Ready to continue: yes` and the decision review has no unresolved Must Fix
  findings. If decision discussion creates relevant
  schema/architecture/provider/data notes, write them under
  `supporting-artifacts/` and link them from `decisions.md`.
- `create-main-spec`: pass `idea.md`, initiative research, `decisions.md`, and
  relevant `supporting-artifacts/`; write `main-spec.md`; complete
  `specCreated`.
- `create-development-phases`: pass `main-spec.md`, initiative research, and
  relevant `supporting-artifacts/` when they affect phase boundaries or risk;
  write `development-plan.md` and phase stubs. Run
  `add-phase <phase-id> [name]` for every phase, then complete
  `phasesCreated`.

Phase setup:

- `create-phase-spec`: pass `main-spec.md`, initiative research, relevant
  `supporting-artifacts/`, `development-plan.md`, and the phase stub; write the
  phase's `phase-spec.md`; complete `phaseSpecCreated`.
- `create-phase-slices`: pass the phase spec plus relevant initiative research
  and `supporting-artifacts/`; write one `slice.md` per slice. Run
  `add-slice <phase-id> <slice-id> [name]` for every slice, then complete
  `slicesCreated`.

Slice loop:

- `research-slice`: pass `main-spec.md`, `research/index.md`, relevant
  initiative research reports and audits, relevant `supporting-artifacts/`,
  `phase-spec.md`, and `slice.md`; write `research.md`; complete
  `researchComplete` only when it says `Ready for planning: yes`.
- `plan-slice`: pass `main-spec.md`, `research/index.md`, relevant initiative
  research reports and audits, relevant `supporting-artifacts/`, `phase-spec.md`,
  `slice.md`, and `research.md`; write `plan.md` with a focused
  `Verification Evidence Plan`; complete
  `planCreated` only when `Split Recommendation` is `Needed: no`.
- `verify-slice-plan`: pass the slice artifacts plus `research/index.md`,
  relevant initiative research reports and audits, and `supporting-artifacts/`;
  write `plan-verification.md`; complete
  `planVerified` only when it says `Ready: yes`.
- `build-slice`: pass `plan.md`, `plan-verification.md`, relevant
  `supporting-artifacts/` named in the plan, and repo files named by the plan;
  implement the work, add/update planned automated tests, run focused
  verification evidence checks, use existing repo precedent before patching
  technical symptoms or integration/dataflow behavior, and write `build.md`;
  complete `implemented` only when it says `Built: yes`.
- `verify-slice-build`: pass the slice artifacts, relevant
  `supporting-artifacts/`, and changed files; write `build-verification.md`;
  confirm grouped verification evidence, including Browser Clickthrough for
  browser-visible work; complete `buildVerified` only when it says
  `Verified: yes`, then commit and push that completed slice before moving on.

Verification gates:

- `verify-phase`: pass the phase spec, relevant initiative research,
  relevant `supporting-artifacts/`, and all slice artifacts for the phase; write
  the phase's `verification.md`; complete `allSlicesVerified` only when it says
  `Ready: yes`.
- `verify-main-spec`: pass the main spec, initiative research,
  `supporting-artifacts/`, development plan, and every phase verification; write
  the initiative `verification.md`; complete
  `allPhasesVerified` only when it says `Ready: yes`. The helper marks the
  initiative complete.

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
