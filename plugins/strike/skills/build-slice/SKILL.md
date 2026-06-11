---
name: build-slice
description: Implement one planned slice while keeping changes scoped and recording compact build evidence.
argument-hint: "[slice plan/context]"
disable-model-invocation: true
allowed-tools: Read Write Edit MultiEdit Bash Grep Glob WebFetch WebSearch
---

# Build Slice

Implement one planned slice.

## Inputs

- verified slice plan from the current slice's `plan.md`
- plan verification from the current slice's `plan-verification.md` when it
  exists (standard-tier plans complete `planVerified` from the plan's tier
  declaration and have no `plan-verification.md`)
- repo files named by the plan
- shared verification evidence taxonomy from the Strike plugin root's
  `references/verification-evidence.md`
- Required user-provided customization from the consuming repo's Strike
  workspace:
  - user implementation-discipline guidance:
    - `strike/user-guidance/implementation-discipline/global.md`
    - `strike/user-guidance/implementation-discipline/build-slice.md`
- supporting artifacts named in the verified plan, when present
- optional slice, phase research/audit, or phase-spec context only when the
  verified plan is unclear, stale, or appears to conflict with the repo

## Process

- Treat `plan.md` as the primary build handoff.
- Read the bundled `references/verification-evidence.md` from the Strike plugin
  root.
- Read required user-provided customization and apply the relevant guidance
  while editing:
  - `strike/user-guidance/implementation-discipline/global.md`
  - `strike/user-guidance/implementation-discipline/build-slice.md`
- Confirm the plan is verified. For a standard-tier plan, workflow state
  showing `planVerified` complete is enough and no `plan-verification.md`
  exists. Otherwise, if `plan-verification.md` does not say `Ready: yes`,
  write `Built: no` with route back to `verify-slice-plan` and do not edit
  implementation files.
- Skim the plan's `Development Plan`, `Research And Artifacts Used`,
  `Codebase Patterns`, `System Touchpoints`, `Blast Radius`, `Verification Plan`,
  and `Why This Plan` before editing.
- If the plan names relevant `supporting-artifacts/`, read them before editing.
  Use them only as context for decisions already reflected in the plan/specs.
- Inspect the current repo files and surfaces named by the plan, plus nearby
  related code, before changing them.
- Before patching a technical symptom or implementing integration, provider,
  workflow, upload, asset, storage, queue, job, callback, webhook, or dataflow
  behavior, search for existing repo examples of the same class of problem. Use
  the repo's established pattern when one exists instead of inventing a new one.
- Before creating a utility, helper, adapter, or shared module, search for an
  existing one and place any new shared code where repo patterns say it belongs.
- Before modifying an existing shared utility, helper, adapter, schema, or
  shared module, inspect likely callers and downstream consumers.
- Implement the slice with the smallest complete path.
- Treat the slice's accepted boundary and acceptance criteria as the contract,
  and the verified plan as the route. When the repo disagrees with the plan,
  adapt and keep building as long as the work stays inside the accepted
  boundary, serves the same acceptance criteria, creates no new product
  outcome, and needs no user-class decision about security posture,
  destructive data, product behavior, architecture, or new dependencies.
  Small repairs the planned work needs to function are inside the boundary;
  new capabilities are not.
- Record every deviation from the plan as a plan amendment in `build.md`: what
  the plan said, what was built instead, why, and which acceptance criterion
  it serves. If a deviation needs a missing tactical fact, do the narrow
  source-backed research now and record the delta with the amendment. Amend
  when a competent reviewer reading the note would say "obviously, yes"; stop
  and route back when they would want a conversation first.
- Start from the repo structures and precedents selected in the plan's
  `Codebase Patterns`. When a selected precedent no longer fits the actual
  code, use the closest repo-proven pattern instead and record the amendment.
- Follow repo conventions and the repo's package manager, test, security, and
  editing rules.
- Add or update the focused Unit / Component / Integration Tests and E2E Tests
  named in the plan when they apply. If the implementation makes missing
  automated coverage obvious, add it or record why it was not appropriate.
- Run the planned Static / Build Checks and focused test commands for the
  changed surface. Do not default to a full suite unless the plan justifies it,
  the repo makes it cheap, or the risk clearly warrants it.
- Run automated tests in the planned test/E2E environment. Do not point tests at
  the dev environment or mutate env files just to avoid writing fixtures or test
  setup.
- For browser-visible work, create, seed, upload, fixture, or safely mock the
  representative data named by the plan so `verify-slice-build` can run final
  Browser Clickthrough in the dev/local app environment. You may record a
  developer smoke attempt in `build.md`, but final Browser Clickthrough and
  Visual Evidence are owned by `verify-slice-build`.
- If you run a developer browser smoke attempt, do not switch it to a test DB or
  test environment just because the dev/local environment is harder to prepare.
  A local URL policy, navigation timeout, or browser-tool failure is not proof
  that browser verification is impossible; record the issue for
  `verify-slice-build` instead of claiming final browser proof.
- Record changed files, verification evidence by category, and important
  implementation notes in `build.md`.
- Declare the build verification tier in `build.md` from the actually-changed
  code. Answer each trigger honestly:
  - `Third-party surface`: the change uses a third-party API, package, SDK,
    framework feature, or provider/model in a way that has no existing repo
    precedent. A newly added dependency is always `yes`. Following an
    established repo pattern for the same surface is `no`; name the precedent
    under `Implementation Notes`.
  - `Solved domain`: the change touches a mature solved domain such as
    payments, refunds, discounts, billing, accounting, taxes, auth, sessions,
    or permissions.
  - `Schema or data risk`: schema, migrations, persistence shape, or
    destructive data operations.
  - `Novel pattern`: an implementation pattern with no close repo precedent.
  - `Plan amendments`: `build.md` records any plan amendment.
  - `Builder uncertainty`: open questions, surprises, or material uncertainty
    about the implementation.
  Any `yes` requires `Tier: deep`, and `verify-slice-build` runs its full
  audit batch. `Tier: standard` is valid only when every trigger is honestly
  `no`; `verify-slice-build` then runs the acceptance audit plus its own
  automated checks and user review lenses, and still owns final Browser
  Clickthrough. When unsure about any trigger, answer `yes`.
- Write `Built: no` and route back only when adaptation cannot honestly stay
  inside the contract: implementation findings change the accepted slice
  boundary or acceptance criteria, a new product outcome or user-class
  decision appears, upstream artifacts are too untrustworthy or stale to
  build from, or amendments would replace the plan rather than repair the
  route.

## Output

Make the implementation changes in the repo.

Write build evidence to the current slice's `build.md`:

```text
strike/initiatives/<initiative-id>/phases/<phase-id>/slices/<slice-id>/build.md
```

Use this shape:

```md
# Slice Build

## Build Status
Built: yes / no
Reason:

## Changed Files
-

## Verification Evidence
### Static / Build Checks
Required: yes / no
Environment:
Evidence:
Result: passed / failed / skipped / not applicable
Reason:

### Unit / Component / Integration Tests
Required: yes / no
Environment:
Evidence:
Result: passed / failed / skipped / not applicable
Reason:

### E2E Tests
Required: yes / no
Environment:
Evidence:
Fixtures/data setup:
Result: passed / failed / skipped / not applicable
Reason:

### Browser Clickthrough
Required: yes / no
Environment:
DB/runtime:
Route/page:
Representative data:
Controls/actions:
Observed states/results:
Result: passed / failed / skipped / not applicable
Reason:

### Visual Evidence
Required: yes / no
Environment:
Screenshots:
Viewports:
Result: passed / failed / skipped / not applicable
Reason:

### Skipped / Not Applicable
-

## Plan Amendments
- Planned:
  Built instead:
  Why:
  Serves acceptance criterion:
  Research delta:
- None. Use this when the build followed the plan without deviation.

## Implementation Notes
- Implementation discipline guidance used:
- Repo pattern or utility placement notes:
- Similar repo precedent used:
- Upstream/downstream impact notes:

## Build Verification Tier
Tier: standard / deep
Third-party surface: yes / no
Solved domain: yes / no
Schema or data risk: yes / no
Novel pattern: yes / no
Plan amendments: yes / no
Builder uncertainty: yes / no
Reason:

## Route Back
Needed: yes / no
Command: None / reopen-check
Phase: None / <phase-id>
Slice: None / <slice-id>
Check: None / planCreated / planVerified
Reason:

## Blocked
- None.
```

## Rules

- The accepted boundary and acceptance criteria are the contract; the verified
  plan is the route. Adapt inside the contract with recorded plan amendments;
  route back only when the contract itself must change or upstream artifacts
  cannot be trusted.
- Keep unrelated cleanup and future work outside this build.
- Read upstream artifacts only when they are needed to clarify or challenge the
  verified plan.
- Do not treat a failing command, provider response, workflow error, payload
  limit, upload/storage issue, or dataflow mismatch as a novel failure until you
  have searched the repo for similar errors, patterns, adapters, and examples.
  Record the precedent used, or record that none was found.
- Declare the build verification tier honestly from the actual diff; it sizes
  the `verify-slice-build` audit batch. The verifier confirms the declaration
  against the changed files and escalates a contradicted `standard` to deep.
  When unsure, declare `Tier: deep`.
- `complete-check implemented` validates `build.md`; trust its gate error if
  it refuses.
- Do not claim verification.
- Preserve unrelated user work.
- Follow the repo's package manager, test, security, and editing rules.
- Keep automated tests and Browser Clickthrough separate. Automated tests do not
  replace Browser Clickthrough for browser-visible work, but final Browser
  Clickthrough is the responsibility of `verify-slice-build`.
- Keep environments separate too. Automated tests run in the repo's test/E2E
  environment. Browser setup for final verifier proof belongs in the dev/local
  app environment unless the repo or user explicitly says otherwise. If the
  planned environment cannot be prepared, write `Built: no`, record the blocker,
  and route back instead of silently switching environments.
- Do not claim final browser verification from `build-slice`. Record prepared
  data, routes, commands, and any developer smoke notes so `verify-slice-build`
  can run the final browser check after review audits pass.
- Do not treat missing representative local data as a blocker when it can be
  created, seeded, uploaded, fixture-backed, or safely mocked inside accepted
  scope.
- Do not scatter duplicate helpers or create convenience utilities without a
  repo-pattern-based home.
