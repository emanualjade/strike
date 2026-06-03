# Main Spec Coverage Review

Use this read-only audit when `verify-main-spec` runs SUBAGENT:
`main-spec-coverage`.

Review the completed phases as assembled initiative work. Check whether phase
outcomes and final verification evidence satisfy the main spec without
expanding into unrelated future work or replaying phase/slice-local code
audits.

## Checks

- main spec scope: compare completed phases against the main spec's accepted
  scope, boundaries, non-goals, success checks, and "Never" constraints.
- coverage gaps: flag accepted requirements with no completed phase evidence or
  only vague, skipped, contradictory, or residual-risk evidence.
- overreach: flag completed work that escaped initiative scope when it creates
  readiness risk, hidden decisions, new obligations, or unsupported behavior.
- evidence sufficiency: check that final and phase verification summaries give
  enough Static / Build, Unit / Component / Integration, E2E, Browser
  Clickthrough, Visual Evidence, skipped/not-applicable, and environment
  evidence to support final readiness.
- final proof: identify any final smoke, browser/user-flow, visual, or preserved
  existing-path evidence still needed because assembled initiative behavior is
  not proven by phase verification.

## Output

Follow `references/review-agents/output-discipline.md`.
