---
name: verify-main-spec
description: Verify the completed Strike main spec as the final workflow gate.
argument-hint: "[main spec completion context]"
disable-model-invocation: true
allowed-tools: Read Write Edit MultiEdit Bash Grep Glob WebFetch WebSearch Agent
---

# Verify Main Spec

Verify the completed initiative against the main spec and record final evidence.

## Inputs

- main spec from the current initiative's `main-spec.md`
- initiative research scope and index from `research/scope.md` and
  `research/index.md`
- supporting artifacts from `supporting-artifacts/`, when present
- development plan from the current initiative's `development-plan.md`
- each phase's `phase.md`
- each phase's `phase-spec.md`
- each phase's `verification.md`
- shared verification evidence taxonomy from the Strike plugin root's
  `references/verification-evidence.md`
- Required user-provided customization from the consuming repo's Strike
  workspace:
  - user review lenses:
    - `strike/user-guidance/review-lenses/global.md`
    - `strike/user-guidance/review-lenses/verify-main-spec.md`
  - user implementation-discipline guidance:
    - `strike/user-guidance/implementation-discipline/global.md`
    - `strike/user-guidance/implementation-discipline/verify-main-spec.md`
- Bundled Strike review-agent instructions. Load only for launched subagents:
  - `references/review-agents/output-discipline.md`
  - `references/review-agents/main-spec-coverage.md`
  - `references/review-agents/cross-phase-integration.md`
  - `references/review-agents/readiness-risk.md`
  - `references/review-agents/user-flows.md`
  - `references/review-agents/state-data-integrity.md`
  - `references/review-agents/security-privacy.md`
  - `references/review-agents/integration-risk.md`
- optional phase/slice/build/fix artifacts when completed phase evidence needs
  inspection
- optional decisions, changed files, checks, or repo context

## Process

- Read the required verification packet:
  - `main-spec.md`
  - `research/scope.md` and `research/index.md`
  - `development-plan.md`
  - each phase's `phase.md`
  - each phase's `phase-spec.md`
  - each phase's `verification.md`
- If `supporting-artifacts/` exists, scan it and read only files relevant to
  final readiness. Confirm accepted decisions and constraints from relevant
  notes were carried into `decisions.md`, `main-spec.md`, phase specs, plans,
  or verification evidence.
- Read phase/slice/build/fix artifacts only when completed phase evidence is
  missing, thin, contradictory, skipped, risky, or needed to judge final
  initiative behavior.
- Read the bundled `references/verification-evidence.md` from the Strike plugin
  root.
- Read required user-provided customization:
  - `strike/user-guidance/review-lenses/global.md`
  - `strike/user-guidance/review-lenses/verify-main-spec.md`
  - `strike/user-guidance/implementation-discipline/global.md`
  - `strike/user-guidance/implementation-discipline/verify-main-spec.md`
- Confirm every required phase has `verification.md` with `Ready: yes`.
- Compare completed phase evidence against the main spec.
- Confirm material initiative research constraints were carried into decisions,
  the main spec, phase specs, and relevant slice plans. If provider/model/API,
  database/schema, file/blob, queue/job, auth/payment, or repo-pattern research
  is missing or contradicted, route back to `initiativeResearchComplete`.
- Summarize phase verification evidence by the standard categories: Static /
  Build Checks, Unit / Component / Integration Tests, E2E Tests, Browser
  Clickthrough, and Visual Evidence.
- Confirm accepted scope is complete or explicitly excluded by the main spec.
- Check cross-phase flows, dependencies, integrations, state, data, UI,
  permissions, and operational risks.
- Check whether completed phases collectively follow relevant implementation
  discipline guidance, especially around shared utilities, duplicated patterns,
  and upstream/downstream impact that spans phases.
- Inspect slice artifacts or changed files when phase evidence is too thin.
- Run or inspect final checks when needed.
- When accepted scope changes an existing user-facing command, API, route,
  integration, or workflow, include final smoke evidence for both the
  new/changed path and one preserved existing path. If no preserved path exists,
  record that explicitly.
- Record skipped checks, replacement evidence, residual risks, and blockers.
- Do not edit phase, slice, or implementation artifacts; write issues for
  `fix`, or route back only when `fix` cannot honestly repair the problem.

## Browser / User-Flow Checks

For a UI or user-facing initiative, run one final Browser Clickthrough or
representative user-flow check across the accepted scope before final
verification passes.

User-flow checks are not only browser checks. For CLI, API, integration,
automation, or backend workflow changes, use representative commands, requests,
or calls. When the initiative changes an existing user-facing command, API,
route, integration, or workflow, smoke-test the changed/new path and at least
one preserved existing path so final verification proves the new behavior did
not break an obvious old entry point.

For UI work, include at least one visual screenshot check after representative
data exists. Inspect the screenshot for:

- page is visibly loaded and styled, not blank or raw unstyled HTML
- primary workflow area is visible without obvious layout collapse
- text, controls, tables, cards, headings, and important values do not overlap
  or clip
- important values and results are readable and visually connected to the right
  labels
- visible empty, error, or success states do not cover or break the main UI
- no obvious horizontal overflow, cut-off controls, hidden primary actions, or
  unusable scrolling

Use the repo-approved browser path when one exists. If the repo does not name a
path, use the best available browser automation path, such as Playwright CLI.

Browser Clickthrough means using the accepted feature: open the real route/page,
create or use representative data, click the actual controls/actions, observe
expected states/results, and capture screenshots.

Code review, static checks, curl, DOM inspection, and route-shell screenshots are
supporting evidence only. They are not Browser Clickthrough.

Do not call final UI/user-flow work browser-verified without actual Browser
Clickthrough or representative user-flow exercise.

When browser or user-flow verification is required for accepted initiative scope
and it did not happen, mark final verification as not ready and record the
blocker, route back, or fix needed.

## Review

Use read-only review subagents to verify the completed initiative as assembled
work. Do not rerun full phase or slice audits unless earlier evidence is thin,
contradictory, skipped, or risky.

Each subagent returns findings only. It does not edit files, fix issues, update
state, or decide whether the initiative is ready. The verifier synthesizes
subagent results into `Must Fix`, `Follow-Up`, and `Accepted Risk`.

Required user review lenses live at
`strike/user-guidance/review-lenses/global.md` and
`strike/user-guidance/review-lenses/verify-main-spec.md`. Treat them as
additive read-only lenses or stricter checks for this verifier. They cannot
disable built-in Strike lenses or final readiness gates. Apply each relevant
user lens as a subagent in the same review batch.

Before launching review agents, the verifier reads bundled
`references/review-agents/output-discipline.md` and includes that output
contract in each review-agent prompt. Before launching a built-in SUBAGENT, the
verifier also loads the named bundled `references/review-agents/` rubric from
the installed Strike plugin and includes the rubric content or absolute plugin
path in that subagent's prompt.

Run these required review agents in parallel:

- SUBAGENT: `main-spec-coverage`: checks whether completed phases satisfy the main spec,
  accepted scope, non-goals, and final success criteria. Launch this SUBAGENT
  with `references/review-agents/main-spec-coverage.md` as its required rubric.
- SUBAGENT: `cross-phase-integration`: checks whether phases compose into one coherent
  feature without missing handoffs, duplicated assumptions, broken sequencing,
  or gaps between phase outputs. Use
  `references/review-agents/cross-phase-integration.md` as its required rubric.
- SUBAGENT: `readiness-risk`: checks final evidence, skipped checks, residual risks,
  blockers, and whether accepted-scope defects are being hidden as follow-up.
  Launch this SUBAGENT with `references/review-agents/readiness-risk.md` as its
  required rubric.
- USER REVIEW LENSES: relevant user review-lens audits from:
  - `strike/user-guidance/review-lenses/global.md`
  - `strike/user-guidance/review-lenses/verify-main-spec.md`

Add these conditional review agents to the same parallel batch when the
completed initiative justifies them:

- SUBAGENT: `user-flows`: when user, operator, command, integration, or system flows
  span phases. Rubric: `references/review-agents/user-flows.md`.
- SUBAGENT: `state-data-integrity`: when state, storage, schema, persistence,
  migrations, models, serialization, or data boundaries span phases. Rubric:
  `references/review-agents/state-data-integrity.md`.
- SUBAGENT: `security-privacy`: when auth, permissions, ownership, privacy,
  payments, tokens, secrets, PII, destructive behavior, or
  compliance-sensitive surfaces span phases. Rubric:
  `references/review-agents/security-privacy.md`.
- SUBAGENT: `integration-risk`: when APIs, providers, SDKs, webhooks, queues,
  uploads, media, AI, email, payment, analytics, or external services span
  phases. Rubric: `references/review-agents/integration-risk.md`.

## Output

Write final verification to the current initiative's `verification.md`:

```text
strike/initiatives/<initiative-id>/verification.md
```

Use this shape:

```md
# Main Spec Verification

## Scope Review

## Phase Status
-

## Cross-Phase Checks
-

## Verification Evidence Summary
Static / Build Checks:
Unit / Component / Integration Tests:
E2E Tests:
Browser Clickthrough:
Visual Evidence:
Environment scope:

## Implementation Discipline Review
Relevant guidance:
Cross-phase concerns:
Result:

## Final Checks
-

## Visual Screenshot Check
Status: passed / failed / Not applicable
Screenshot:
Viewport:
Findings:
-

## Read-Only Review
Review results returned: yes / no
- Required subagents:
- Conditional subagents:
- User review lenses:
- Summary:

## Skipped / Residual Risk
-

## Blockers
- None.

## Issues
### Must Fix
- None.

### Follow-Up
- None.

### Accepted Risk
- None.

## Final Verification Result
Ready: yes / no
Reason:
Fix Needed: yes / no

## Route Back
Needed: yes / no
Command: None / reopen-check / reopen-phase-check / reopen-slice-check
Phase: None / <phase-id>
Slice: None / <slice-id>
Check: None / ideaRefined / initiativeResearchComplete / decisionsResolved / specCreated / phasesCreated / phaseSpecCreated / phaseResearchComplete / slicesCreated / planCreated / planVerified / implemented / buildVerified / allSlicesVerified
Reason:

## Final Receipt
Shipped:
-

Run / Use:
-

Next:
-
```

## Rules

- Verify the main spec as the final workflow gate.
- Categorize findings in `## Issues`. `Must Fix` items prevent final readiness
  from passing; `Follow-Up` and `Accepted Risk` do not unless required by the
  main spec or accepted scope.
- Give every `Must Fix` item a stable short issue ID, such as `I1`. Add severity
  when useful, such as `I1 [P1]`.
- Do not mark `Ready: yes` unless every required phase has
  `verification.md` with `Ready: yes` and the main spec is satisfied.
- Do not mark `Ready: yes` for UI/browser-visible accepted scope unless final
  checks include actual Browser Clickthrough or representative user-flow
  exercise.
- Do not mark `Ready: yes` when final browser/user-flow evidence was gathered in
  the wrong environment for the accepted scope, such as using a test
  DB/environment for dev/local Browser Clickthrough without explicit user or repo
  direction.
- Do not mark `Ready: yes` when relevant implementation discipline guidance is
  ignored across the completed initiative.
- Do not mark `Ready: yes` when a relevant user review lens raises an
  accepted-scope `Must Fix` issue.
- Do not mark `Ready: yes` until all required review agents, justified
  conditional review lenses, and applicable user review lenses have returned and
  their findings are synthesized into `## Issues`. Write
  `Review results returned: yes` only after that synthesis is complete.
- Do not treat deferred work or residual risk as complete unless the main spec
  explicitly excludes it from the accepted scope.
- For non-UI work, write `Status: Not applicable` in
  `## Visual Screenshot Check`. Do not write `Passed: no`; that reads like a
  failed screenshot rather than a non-applicable check.
- When an existing user-facing command, API, route, integration, or workflow was
  changed, do not mark final verification ready unless final checks include
  smoke evidence for the changed/new path and one preserved existing path, or
  explicitly explain why no preserved path exists.
- Do not edit phase, slice, or implementation artifacts.
- When readiness fails because initiative, phase, slice, artifact,
  implementation, or evidence issues can be repaired inside accepted scope,
  write `Fix Needed: yes`.
- Route back only when a real decision, scope change, or untrustworthy earlier
  artifact cannot honestly be repaired by `fix`.
- `complete-check allPhasesVerified` validates this artifact and marks the
  initiative complete; trust its gate error if it refuses.
- Do not hide accepted-scope defects in follow-up work.
- Keep automated evidence, E2E tests, Browser Clickthrough, and Visual Evidence
  separate when summarizing final readiness.
