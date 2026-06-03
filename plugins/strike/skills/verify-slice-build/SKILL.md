---
name: verify-slice-build
description: Verify one slice build against its acceptance criteria, checks, risks, and evidence, then record build verification.
argument-hint: "[slice/build context]"
disable-model-invocation: true
allowed-tools: Read Write Edit MultiEdit Bash Grep Glob WebFetch WebSearch Agent
---

# Verify Slice Build

Verify one slice build and record build verification.

## Inputs

- Required verification packet:
  - `build.md`
  - `plan.md`
  - `slice.md`
- optional context when needed:
  - `plan-verification.md`
  - phase `research.md`
  - phase `research-audit.md`
  - `phase-spec.md`
- Required user-provided customization from the consuming repo's Strike
  workspace:
  - user review lenses:
    - `strike/user-guidance/review-lenses/global.md`
    - `strike/user-guidance/review-lenses/verify-slice-build.md`
  - user implementation-discipline guidance:
    - `strike/user-guidance/implementation-discipline/global.md`
    - `strike/user-guidance/implementation-discipline/verify-slice-build.md`
- Bundled Strike review-agent instructions. Load only for launched subagents:
  - `references/review-agents/output-discipline.md`
  - `references/review-agents/built-slice-acceptance-audit.md`
  - `references/review-agents/built-slice-code-audit.md`
  - `references/review-agents/built-slice-common-issues-audit.md`
  - `references/review-agents/canonical-implementation.md`
  - `references/review-agents/state-data-integrity.md`
  - `references/review-agents/security-privacy.md`
  - `references/review-agents/integration-risk.md`
  - `references/review-agents/ui-regression.md`
  - `references/review-agents/user-flows.md`
  - `references/review-agents/accessibility.md`

## Process

1. Read the required verification packet: `build.md`, `plan.md`, and
   `slice.md`.
2. Confirm the slice is eligible for build verification:
   - workflow state or `plan-verification.md` shows the plan was ready
   - `build.md` says `Built: yes`
3. Read required user-provided customization:
   - `strike/user-guidance/review-lenses/global.md`
   - `strike/user-guidance/review-lenses/verify-slice-build.md`
   - `strike/user-guidance/implementation-discipline/global.md`
   - `strike/user-guidance/implementation-discipline/verify-slice-build.md`
4. Load optional context only when needed:
   - read deeper into `plan-verification.md` when state is unclear or the build
     or plan references verifier findings, accepted risks, route-back concerns,
     or contradictions
   - read phase `research.md` and `research-audit.md` when
     provider/API/domain/schema/data/file/queue/auth/payment facts matter, the
     plan/build references research, or evidence conflicts with recorded
     constraints or accepted research risks
   - read `phase-spec.md` when phase scope, boundaries, acceptance intent, or
     phase-level integration risk is unclear
5. Run the pre-browser verification batch in parallel:
   - automated slice checks in the repo's test runtime/server with test
     DB/fixtures only
   - SUBAGENT: `built-slice-acceptance-audit`
   - SUBAGENT: `built-slice-code-audit`
   - SUBAGENT: `built-slice-common-issues-audit`
   - USER REVIEW LENSES: relevant user review-lens audits from required user
     guidance
   - justified conditional review lenses that do not require final browser
     evidence
   Before launching a built-in SUBAGENT, the verifier loads the named bundled
   `references/review-agents/` rubric from the installed Strike plugin and
   includes the rubric content or absolute plugin path in that subagent's prompt.
6. Synthesize the pre-browser batch into a compact gate:
   - use the verification evidence categories shown in this skill
   - use focused commands instead of defaulting to a full suite unless the plan,
     repo convention, or risk justifies a broader run
   - summarize automated checks, required audits, conditional lenses, user
     lenses, and the acceptance audit's `Browser Proof Needed`
   - list only blocking issue IDs in the gate summary; keep details in
     `## Issues`
   - set `Ready for browser: yes` only when no accepted-scope `Must Fix`,
     failed required check, or blocked required audit remains. Missing final
     Browser Clickthrough or final screenshot evidence is pending proof for the
     next step, not a pre-browser blocker.
   - when `Ready for browser: no`, stop before Browser Checks and write
     `Verified: no` with the fix path
7. Run Browser Checks for browser-visible work:
   - use the dev/local app environment and dev/local DB only
   - use the `built-slice-acceptance-audit` browser proof checklist plus the
     plan/build evidence
   - actually use the feature: open the real route/page, create or use
     representative data, click feature controls/actions, observe expected
     states/results, and capture screenshots
   - after Browser Checks, run any justified visual/browser review lens whose
     rubric requires completed browser evidence, then summarize that status in
     `Read-Only Review` as `Post-browser visual/browser lenses: pass` or
     `not run`
8. Write `build-verification.md`: categorize issues, set `Verified`, set
   `Fix Needed`, and write route-back instructions when needed.

## Review

Review agents are read-only. They return findings only; they do not edit files,
fix issues, update state, or decide whether the build passes.
Before launching review agents, the verifier reads bundled
`references/review-agents/output-discipline.md` and includes that output
contract in each review-agent prompt.

### 1. Run Required Review Agents In Parallel

Run these required review agents in the same pre-browser batch:

- SUBAGENT: `built-slice-acceptance-audit`: reviews the completed slice as local
  acceptance work, not as the whole phase. Check whether the build satisfies the
  slice outcome and acceptance criteria, stays inside accepted slice scope,
  follows plan intent, and has the non-browser evidence needed for this slice.
  This audit reviews evidence already recorded in `build.md`; the verifier
  separately owns fresh automated command results running in the same
  pre-browser batch and synthesizes both sources before the gate decision.
  Treat final browser proof as pending, not failed. Return a concise
  `Browser Proof Needed` checklist with route/page, representative data,
  controls/actions, expected states/results, screenshots, and any browser
  concerns the final pass must prove. Use
  `references/review-agents/built-slice-acceptance-audit.md` as the required
  rubric.
- SUBAGENT: `built-slice-code-audit`: reviews changed code for general quality and local
  correctness. Check nearby repo-pattern fit, naming, placement, duplication,
  code correctness, maintainability, organization, utility/shared-code
  placement, edge cases, blast radius, and obvious regressions. Use
  `references/review-agents/built-slice-code-audit.md` as the required rubric.
- SUBAGENT: `built-slice-common-issues-audit`: reviews changed code for recurring
  slice-level failure patterns. Check proper use of existing types, error
  handling integrity, ephemeral React UI/action state isolation, form
  architecture, post-submit data consistency, and design-system component reuse.
  Use `references/review-agents/built-slice-common-issues-audit.md` as the
  required rubric.
- USER REVIEW LENSES: relevant user review-lens audits from:
  - `strike/user-guidance/review-lenses/global.md`
  - `strike/user-guidance/review-lenses/verify-slice-build.md`

User review lenses are user-provided customization. They may add review agents,
stricter checks, or additional lenses for this verifier. They are additive and
cannot disable built-in Strike review agents or verification gates. When a user
review lens asks for an audit, review agent, review pass, or otherwise applies
to this slice, add it to the same parallel pre-browser batch unless it requires
completed Browser Check evidence. Run browser-evidence-dependent user lenses
after Browser Checks with the captured route/action/screenshot evidence.

### 2. Add Conditional Review Lenses To The Same Parallel Batch

Only add these review lenses when the changed files, slice plan, build evidence,
or risk justify them. Use the named bundled `references/review-agents/` file as
the conditional SUBAGENT's required audit rubric.

- SUBAGENT: `canonical-implementation`: when the slice touches third-party APIs, packages,
  framework-specific behavior, auth, security, privacy, permissions, payments,
  accounting, provider/model behavior, queues, uploads, media, AI, email,
  external services, or a solved domain where inventing is risky. Rubric:
  `references/review-agents/canonical-implementation.md`.
- SUBAGENT: `user-flows`: when a user, operator, command, or system workflow changed.
  Rubric: `references/review-agents/user-flows.md`.
- SUBAGENT: `state-data-integrity`: when state, storage, schema, persistence, migrations,
  models, serialization, or data boundaries changed. Rubric:
  `references/review-agents/state-data-integrity.md`.
- SUBAGENT: `security-privacy`: when auth, permissions, ownership, privacy, payments,
  tokens, secrets, PII, destructive behavior, or compliance-sensitive surfaces
  changed. Rubric: `references/review-agents/security-privacy.md`.
- SUBAGENT: `integration-risk`: when APIs, providers, SDKs, webhooks, queues, uploads,
  media, AI, email, payment, analytics, or external services changed. Rubric:
  `references/review-agents/integration-risk.md`.

Run these visual/browser conditional lenses after Browser Checks when their
conditions apply, so they can inspect completed route/action/screenshot evidence
instead of treating pending browser proof as a pre-browser failure.

- SUBAGENT: `ui-regression`: when UI, HTML, CSS, component, or frontend behavior changed.
  Rubric: `references/review-agents/ui-regression.md`.
- SUBAGENT: `accessibility`: when UI risk is meaningful or browser evidence is available.
  Rubric: `references/review-agents/accessibility.md`.

### 3. Synthesize Review Results

The verifier synthesizes automated checks and review-agent findings into
`Must Fix`, `Follow-Up`, and `Accepted Risk`. Require every review agent to
follow the bundled output discipline: return every `Must Fix`, return only
material `Follow-Up` findings, group repeated examples, avoid low-value nits,
and avoid restating the rubric. The
`built-slice-acceptance-audit` also returns `Browser Proof Needed`.

Write a compact `Pre-Browser Verification Batch` gate before any browser work:
automated checks, required audits, conditional risk lenses, user review lenses,
browser proof needed, blocking issue IDs, `Ready for browser`, and reason. If
the gate says `Ready for browser: no`, stop before Browser Checks and write
`Verified: no` with the fix path.

### 4. Run Browser Checks

For browser-visible work, run Browser Checks only after `Ready for browser:
yes`. The Browser / User-Flow Checks section below defines the required browser
proof.

## Browser / User-Flow Checks

For browser-visible work, verify by using the accepted feature in the browser in
the dev/local app environment and dev/local DB/runtime: open the real route/page,
create or use representative data, click the feature controls/actions, observe
the resulting states/data/UI, and capture screenshots of the completed feature
state.

When keyboard, focus, accessibility, or alternate-input behavior is part of
accepted scope, exercise it in the browser when the browser automation surface
can synthesize the relevant native events. If the surface focuses native
controls but cannot synthesize activation or focus traversal, record the exact
keys/tools attempted, the observed limitation, and residual risk separately. Do
not add custom app key handlers solely to satisfy an automation quirk for native
controls.

This is an execution check. Merely opening the route, logging in, navigating
near the feature, inspecting DOM, running curl, reading code, or taking
screenshots without using the feature does not satisfy Browser Clickthrough.
Automated tests and Browser Clickthrough are separate gates.

If the feature cannot be used successfully, write `Verified: no`, record the
blocker and evidence, and route to `fix` unless the blocker requires upstream
research/planning. Treat the browser as available: if one local URL form or
browser automation surface fails, try another valid local URL/tool before
calling browser evidence blocked. Do not switch to a test DB/environment to make
browser proof easier.

## Output

Write the slice build verification to the current slice's
`build-verification.md`:

```text
strike/initiatives/<initiative-id>/phases/<phase-id>/slices/<slice-id>/build-verification.md
```

Use this shape:

```md
# Slice Build Verification

## Acceptance Review

## Pre-Browser Verification Batch
Automated checks: pass / issues / blocked
Required audits: pass / issues / blocked
Conditional risk lenses: pass / issues / blocked / not run
User review lenses: pass / issues / blocked / not run
Browser proof needed:
Blocking issue IDs:
Ready for browser: yes / no
Reason:

## Browser Proof Checklist
Route/page:
Representative data:
Controls/actions:
Expected states/results:
Screenshots:
Concerns from acceptance audit:

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

## Review

## Read-Only Review
Review results returned: yes / no
Required audits: pass / issues / blocked
Conditional risk lenses: pass / issues / blocked / not run
User review lenses: pass / issues / blocked / not run
Post-browser visual/browser lenses: pass / issues / blocked / not run
Summary:

## Skipped / Residual Risk
-

## Issues
### Must Fix
- None.

### Follow-Up
- None.

### Accepted Risk
- None.

## Build Verification Result
Verified: yes / no
Reason:
Fix Needed: yes / no

Remaining Risk:
- None.

## Route Back
Needed: yes / no
Command: None / reopen-check / reopen-phase-check
Phase: None / <phase-id>
Slice: None / <slice-id>
Check: None / phaseResearchComplete / planCreated / planVerified / implemented
Reason:
```

## Rules

### Verifier Conduct

- Verify one slice build.
- Categorize findings in `## Issues`. `Must Fix` items prevent verification
  from passing; `Follow-Up` and `Accepted Risk` do not unless required by the
  slice, phase spec, or acceptance criteria.
- Give every `Must Fix` item a stable short issue ID, such as `I1`. Add severity
  when useful, such as `I1 [P1]`.
- Do not edit implementation files; write issues for `fix` when the build needs
  changes.
- Do not verify the whole phase.

### `Verified: yes` Requires

- `build.md` says `Built: yes`.
- Relevant automated tests, E2E tests, static checks, Browser Clickthrough, and
  Visual Evidence are present, or skipped with a concrete category-specific
  reason. Do not collapse evidence into a generic "checks" bucket.
- Automated tests ran in the repo's test/E2E environment. Browser Clickthrough
  ran in the dev/local app environment and dev/local DB/runtime. Env files, DB
  targets, or runtime mode were not changed merely to make verification easier.
- Browser-visible work has actual Browser Clickthrough: route/page opened,
  DB/runtime recorded, representative data created or used, feature
  controls/actions clicked, expected states/results observed, and screenshots
  captured.
- E2E Tests were added, updated, or run when repo infrastructure and workflow
  risk require E2E coverage.
- Integration, provider, workflow, upload, asset, storage, queue, job, callback,
  webhook, or dataflow work checked existing repo precedent for the same class
  of problem.
- No accepted-scope `Must Fix` issue remains from built-in audits, conditional
  risk lenses, user review lenses, required checks, or Browser Clickthrough.
- The pre-browser gate is clean: no accepted-scope `Must Fix`, failed required
  check, or blocked required audit remains.
- All required review agents, justified conditional risk lenses, post-browser
  visual/browser lenses, and applicable user review lenses have returned. The
  artifact says `Review results returned: yes` only after their returned
  findings have been synthesized into `## Issues`.
- `Post-browser visual/browser lenses` is recorded as `pass` when those lenses
  ran and passed, or `not run` when no browser-evidence-dependent lens applied.
  `issues`, `blocked`, or a missing status prevents verification from passing.

### Browser Blockers

- Do not mark browser verification as blocked after only one local URL form or
  one browser automation surface failed. Record alternate URL/tool attempts in
  Browser Clickthrough evidence before treating browser evidence as blocked.
- Do not run Browser Checks when the pre-browser gate has accepted-scope
  `Must Fix` issues, failed required checks, or blocked required audits. Write
  `Ready for browser: no`, keep browser evidence not run because the pre-browser
  gate failed, and record the fix path.

### Fix Or Route Back

- When verification fails because the implementation, tests, evidence, or local
  artifacts can be repaired inside accepted scope, write `Fix Needed: yes`.
- If the fix would edit phase `research.md` or `research-audit.md`, route back
  to `phaseResearchComplete` instead so the phase research audit can be rerun.
- When verification fails because phase research is missing, weak, contradicted,
  or broad enough that the slice plan/build cannot honestly be repaired locally,
  route with `Command: reopen-phase-check`, `Phase: <phase-id>`, `Slice: None`,
  and `Check: phaseResearchComplete`.
- Route back only when the accepted plan, research, or scope is untrustworthy
  enough that `fix` cannot honestly repair the issue.

### Completion

- When `Verified: yes`, write `Fix Needed: no`, `Needed: no`,
  `Command: None`, `Phase: None`, `Slice: None`, and `Check: None`.
- After writing `Verified: yes` and `Review results returned: yes`, Strike can run
  `node strike/scripts/state.mjs complete-check buildVerified`.
- Do not start another slice from inside `verify-slice-build`; return control to
  `go` so the orchestrator can run `next-step` and continue if another slice is
  ready.
- Keep Browser Clickthrough and automated tests separate. Passing one does not
  satisfy the other.
