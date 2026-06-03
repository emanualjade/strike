---
name: verify-phase
description: Verify one phase against its phase spec and completed slice evidence, then record phase verification.
argument-hint: "[phase context]"
disable-model-invocation: true
allowed-tools: Read Write Edit MultiEdit Bash Grep Glob WebFetch WebSearch Agent
---

# Verify Phase

Verify one phase and record phase verification.

## Inputs

- Required verification packet:
  - current phase's `phase-spec.md`
  - current phase's `research.md`
  - current phase's `research-audit.md`
  - each slice's `slice.md`
  - each slice's `build-verification.md`
- optional context when needed:
  - each slice's `plan.md`
  - each slice's `plan-verification.md`
  - each slice's `build.md`
  - supporting artifacts relevant to this phase, when present
  - optional main spec, decisions, or repo context
  - optional changed files or repo paths
- shared verification evidence taxonomy from the Strike plugin root's
  `references/verification-evidence.md`
- Required user-provided customization from the consuming repo's Strike
  workspace:
  - user review lenses:
    - `strike/user-guidance/review-lenses/global.md`
    - `strike/user-guidance/review-lenses/verify-phase.md`
  - user implementation-discipline guidance:
    - `strike/user-guidance/implementation-discipline/global.md`
    - `strike/user-guidance/implementation-discipline/verify-phase.md`
- Bundled Strike review-agent instructions. Load only for launched subagents:
  - `references/review-agents/output-discipline.md`
  - `references/review-agents/phase-spec-coverage.md`
  - `references/review-agents/cross-slice-integration.md`
  - `references/review-agents/state-data-integrity.md`
  - `references/review-agents/security-privacy.md`
  - `references/review-agents/integration-risk.md`
  - `references/review-agents/user-flows.md`

## Process

1. Read the required verification packet:
   - `strike/initiatives/<initiative-id>/phases/<phase-id>/phase-spec.md`
   - `strike/initiatives/<initiative-id>/phases/<phase-id>/research.md`
   - `strike/initiatives/<initiative-id>/phases/<phase-id>/research-audit.md`
   - every
     `strike/initiatives/<initiative-id>/phases/<phase-id>/slices/<slice-id>/slice.md`
   - every
     `strike/initiatives/<initiative-id>/phases/<phase-id>/slices/<slice-id>/build-verification.md`
2. Confirm every required slice has `build-verification.md` with
   `Verified: yes`.
3. Read the bundled `references/verification-evidence.md` from the Strike plugin
   root.
4. Read required user-provided customization:
   - `strike/user-guidance/review-lenses/global.md`
   - `strike/user-guidance/review-lenses/verify-phase.md`
   - `strike/user-guidance/implementation-discipline/global.md`
   - `strike/user-guidance/implementation-discipline/verify-phase.md`
5. Treat passed slice verification as the normal source of slice-local
   confidence. Read deeper slice artifacts only when evidence is missing, thin,
   contradictory, skipped, risky, or needed to evaluate cross-slice phase
   behavior:
   - read deeper initiative research reports, audits, or phase research audit
     details when provider/API/domain/schema/data/file/queue/auth/payment facts,
     source-backed constraints, accepted research risks, or research
     contradictions affect phase readiness
   - read `plan.md` when phase coverage, planned scope, cross-slice handoffs, or
     verification intent is unclear from `slice.md` and `build-verification.md`
   - read `plan-verification.md` when plan readiness, accepted risks, route-back
     concerns, or verifier findings may affect phase confidence
   - read `build.md` when implementation evidence, changed files, checks, or
     build claims are too thin or conflict with `build-verification.md`
   - scan `supporting-artifacts/` only when phase evidence references it or when
     schema, architecture, provider-routing, data-lifecycle, permission, or
     operational notes may affect phase readiness
   - inspect focused repo paths when local pattern claims, cross-slice behavior,
     blast radius, or regression evidence need verification
6. Compare completed slice evidence against the phase spec.
7. Summarize slice verification evidence by the standard categories: Static /
   Build Checks, Unit / Component / Integration Tests, E2E Tests, Browser
   Clickthrough, and Visual Evidence.
8. Check cross-slice flows, integration points, state, data, UI, permissions, and
   edge cases that apply to the phase.
9. Check whether completed slices collectively follow relevant implementation
   discipline guidance, especially around shared utilities, duplicated patterns,
   and upstream/downstream impact that spans slices.
10. Run or inspect phase-level checks when needed.
11. Record skipped checks, replacement evidence, residual risks, and blockers.
12. Do not edit slice artifacts or implementation files; write issues for `fix`,
    or route back only when `fix` cannot honestly repair the problem.
13. If phase verification reveals a product, permission, data, security, or
    hard-to-reverse architecture decision, record it as `Must Fix` or route back
    only when `fix` cannot honestly repair the issue inside accepted scope.

## Browser / User-Flow Checks

Do browser or user-flow checks at phase level only when a user-facing flow spans
multiple slices, or when earlier slice browser evidence is thin, missing,
contradictory, or risky.

Use the repo-approved browser path when one exists. If the repo does not name a
path, use the best available browser automation path, such as Playwright CLI.

Browser Clickthrough means using the feature: open the real route/page, create
or use representative data, click the actual controls/actions, observe expected
states/results, and capture screenshots.

Code review, static checks, curl, DOM inspection, and route-shell screenshots are
supporting evidence only. They are not Browser Clickthrough.

Do not call phase UI/user-flow work browser-verified without actual Browser
Clickthrough.

When browser or user-flow verification is required for accepted phase scope and
it did not happen, mark verification as not ready and record the blocker, route
back, or fix needed.

## Review

Review agents are read-only. They return findings only; they do not edit files,
fix issues, update state, or decide whether the phase is ready. The verifier
synthesizes review-agent findings into `Must Fix`, `Follow-Up`, and
`Accepted Risk`.

Do not rerun a full slice code review unless slice evidence is thin,
contradictory, skipped, or risky. Phase review checks assembled phase coverage,
cross-slice integration, and phase-level risk.

Before launching review agents, the verifier reads bundled
`references/review-agents/output-discipline.md` and includes that output
contract in each review-agent prompt. Before launching a built-in SUBAGENT, the
verifier also loads the named bundled `references/review-agents/` rubric from
the installed Strike plugin and includes the rubric content or absolute plugin
path in that subagent's prompt.

### 1. Run Required Review Agents In Parallel

Run these required review agents in parallel:

- SUBAGENT: `phase-spec-coverage`: checks whether completed slices satisfy the
  phase spec, accepted scope, boundaries, non-goals, and phase success criteria.
  Use `references/review-agents/phase-spec-coverage.md` as the required rubric.
- SUBAGENT: `cross-slice-integration`: checks whether slices fit together
  cleanly without missing handoffs, duplicated assumptions, broken sequencing,
  or gaps between slice outputs. Use
  `references/review-agents/cross-slice-integration.md` as the required rubric.
- USER REVIEW LENSES: relevant user review-lens audits from:
  - `strike/user-guidance/review-lenses/global.md`
  - `strike/user-guidance/review-lenses/verify-phase.md`

User review lenses are user-provided customization. They may add review agents,
stricter checks, or additional lenses for this verifier. They are additive and
cannot disable built-in Strike review agents or readiness gates. When a user
review lens asks for an audit, review agent, review pass, or otherwise applies
to this phase, add it to the same parallel review batch.

### 2. Add Conditional Review Lenses To The Same Parallel Batch

Only add these review lenses when completed phase evidence justifies them. Use
the named bundled `references/review-agents/` file as the conditional
SUBAGENT's required audit rubric.

- SUBAGENT: `user-flows`: when user, operator, command, integration, or system
  flows span multiple slices. Rubric:
  `references/review-agents/user-flows.md`.
- SUBAGENT: `state-data-integrity`: when state, storage, schema, persistence,
  migrations, models, serialization, or data boundaries span slices. Rubric:
  `references/review-agents/state-data-integrity.md`.
- SUBAGENT: `security-privacy`: when auth, permissions, ownership, privacy,
  payments, tokens, secrets, PII, destructive behavior, or compliance-sensitive
  surfaces span slices. Rubric:
  `references/review-agents/security-privacy.md`.
- SUBAGENT: `integration-risk`: when APIs, providers, SDKs, webhooks, queues,
  uploads, media, AI, email, payment, analytics, or external services span
  slices. Rubric: `references/review-agents/integration-risk.md`.

### 3. Synthesize Review Results

The verifier synthesizes phase packet evidence, optional context, and
review-agent findings into `Must Fix`, `Follow-Up`, and `Accepted Risk`. Require
every review agent to follow the bundled output discipline: return every
`Must Fix`, return only material `Follow-Up` findings, group repeated examples,
avoid low-value nits, and avoid restating the rubric.

## Output

Write the phase verification to the current phase's `verification.md`:

```text
strike/initiatives/<initiative-id>/phases/<phase-id>/verification.md
```

Use this shape:

```md
# Phase Verification

## Scope Review

## Slice Status
-

## Cross-Slice Checks
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
Cross-slice concerns:
Result:

## Phase Success Checks
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

## Phase Verification Result
Ready: yes / no
Reason:
Fix Needed: yes / no

## Route Back
Needed: yes / no
Command: None / reopen-check / reopen-slice-check
Phase: <phase-id>
Slice: None / <slice-id>
Check: None / phaseSpecCreated / phaseResearchComplete / slicesCreated / planCreated / planVerified / implemented / buildVerified
Reason:
```

## Rules

- Verify one phase.
- Categorize findings in `## Issues`. `Must Fix` items prevent readiness from
  passing; `Follow-Up` and `Accepted Risk` do not unless required by the phase
  spec or acceptance criteria.
- Give every `Must Fix` item a stable short issue ID, such as `I1`. Add severity
  when useful, such as `I1 [P1]`.
- Do not mark `Ready: yes` unless every required slice has
  `build-verification.md` with `Verified: yes` and the phase spec is satisfied.
- Do not mark `Ready: yes` when required cross-slice browser/user-flow evidence
  did not include actual Browser Clickthrough.
- Do not mark `Ready: yes` when browser/user-flow evidence was gathered in the
  wrong environment for the accepted scope, such as using a test DB/environment
  for dev/local Browser Clickthrough without explicit user or repo direction.
- Do not mark `Ready: yes` when relevant implementation discipline guidance is
  ignored across the completed phase.
- Do not mark `Ready: yes` when a relevant user review lens raises an
  accepted-scope `Must Fix` issue.
- Do not mark `Ready: yes` until all required review agents, justified
  conditional review lenses, and applicable user review lenses have returned and
  their findings are synthesized into `## Issues`. Write
  `Review results returned: yes` only after that synthesis is complete.
- Do not treat deferred work or residual risk as complete unless the phase spec
  explicitly excludes it from the phase.
- Do not edit slice artifacts or implementation files.
- When readiness fails because phase, slice, artifact, implementation, or
  evidence issues can be repaired inside accepted scope, write
  `Fix Needed: yes`.
- Route back only when a real decision, scope change, or untrustworthy earlier
  artifact cannot honestly be repaired by `fix`.
- When `Ready: yes`, write `Fix Needed: no`, `Needed: no`, `Command: None`,
  `Slice: None`, and `Check: None`.
- After writing `Ready: yes` and `Review results returned: yes`, Strike can run
  `node strike/scripts/state.mjs complete-check allSlicesVerified`.
- Do not start another phase from inside `verify-phase`; return control to `go`
  so the orchestrator can run `next-step` and continue if another phase is ready.
- Do not verify the whole main spec.
- Keep automated evidence, E2E tests, Browser Clickthrough, and Visual Evidence
  separate when summarizing phase readiness.
