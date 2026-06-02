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
- plan verification from the current slice's `plan-verification.md`
- repo files named by the plan
- shared verification evidence taxonomy from the Strike plugin root's
  `references/verification-evidence.md`
- user implementation guidance from
  `strike/user-guidance/implementation-discipline/global.md` and
  `strike/user-guidance/implementation-discipline/build-slice.md`
- supporting artifacts named in the verified plan, when present
- optional slice, research, or phase-spec context only when the verified plan is
  unclear, stale, or appears to conflict with the repo

## Process

- Treat `plan.md` as the primary build handoff.
- Read the bundled `references/verification-evidence.md` from the Strike plugin
  root.
- Read `strike/user-guidance/implementation-discipline/global.md` and
  `strike/user-guidance/implementation-discipline/build-slice.md` if they
  exist, and apply the relevant guidance while editing.
- If `plan-verification.md` does not say `Ready: yes`, write `Built: no` with
  route back to `verify-slice-plan` and do not edit implementation files.
- Skim the plan's `Repo Pattern Scan`, `Slice Boundary`, `Surfaces`, `Approach`,
  `Verification Evidence Plan`, and `Verification` before editing.
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
- Implement only the planned slice scope, using the smallest complete path.
- Follow the repo structures and precedents selected in the plan's
  `Repo Pattern Scan`. If the selected precedent no longer fits after inspecting
  the code, write `Built: no` and route back instead of inventing a replacement
  pattern inside the build step.
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
  representative data named by the plan in the dev/local app environment, then
  run the planned Browser Clickthrough there and capture the planned Visual
  Evidence screenshots. Do not switch Browser Clickthrough to a test DB or test
  environment just because the dev/local environment is harder to prepare.
- Do not declare Browser Clickthrough blocked after one failed browser URL,
  navigation attempt, timeout, or browser tool. Treat the browser as available:
  try valid alternate local URL forms such as `localhost`, `127.0.0.1`, the
  assigned dev-server host/port, and, for static apps that can run from disk, an
  absolute `file://` URL. If one browser automation surface blocks the URL, try
  another available browser surface before recording failure.
- Record changed files, verification evidence by category, and important
  implementation notes in `build.md`.
- Use engineering judgment for ordinary implementation details inside the
  verified plan, and record meaningful assumptions in `build.md`.
- If the plan is missing, too vague, no longer matches the repo, or needs
  upstream context to understand, write `Built: no` with route back to
  `plan-slice` or `verify-slice-plan`.
- If the build discovers a relevant schema/architecture/provider/data note in
  `supporting-artifacts/` that the plan did not account for, write `Built: no`
  with route back to `plan-slice` instead of silently expanding scope.
- If the verified plan cannot be followed without expanding or redesigning the
  slice, write `Built: no` with route back to `plan-slice`.

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

## Implementation Notes
- Implementation discipline guidance used:
- Repo pattern or utility placement notes:
- Similar repo precedent used:
- Upstream/downstream impact notes:

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

- Keep work inside one slice.
- Do not broaden the slice to include unrelated cleanup or future work.
- Do not improvise around a bad plan; write `Built: no` and route back to the
  owning workflow step so Strike can continue.
- Do not re-evaluate whether the slice is well-shaped. That was handled by
  research, planning, and plan verification.
- Do not route back for ordinary implementation choices that fit the verified
  plan.
- Read upstream artifacts only when they are needed to clarify or challenge the
  verified plan.
- Do not treat a failing command, provider response, workflow error, payload
  limit, upload/storage issue, or dataflow mismatch as a novel failure until you
  have searched the repo for similar errors, patterns, adapters, and examples.
  Record the precedent used, or record that none was found.
- When `Built: yes`, write `Needed: no`, `Command: None`, `Phase: None`,
  `Slice: None`, and `Check: None`.
- After writing `Built: yes`, Strike can run
  `node strike/scripts/state.mjs complete-check implemented`.
- Do not claim verification.
- Preserve unrelated user work.
- Follow the repo's package manager, test, security, and editing rules.
- Keep automated tests and Browser Clickthrough separate. Browser Clickthrough
  does not replace relevant automated tests, and automated tests do not replace
  Browser Clickthrough for browser-visible work.
- Keep environments separate too. Automated tests run in the repo's test/E2E
  environment. Browser Clickthrough runs in the dev/local app environment unless
  the repo or user explicitly says otherwise. If the planned environment cannot
  run, write `Built: no`, record the blocker, and route back instead of silently
  switching environments.
- A local URL policy, navigation timeout, or browser-tool failure is not proof
  that Browser Clickthrough is impossible. Record it, retry with alternate local
  URL forms and another available browser surface, and only then record browser
  verification as blocked or failed.
- Do not treat missing representative local data as a blocker when it can be
  created, seeded, uploaded, fixture-backed, or safely mocked inside accepted
  scope.
- Do not scatter duplicate helpers or create convenience utilities without a
  repo-pattern-based home.
