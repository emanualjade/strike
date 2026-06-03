# Phase Spec Coverage Review

Use this read-only audit when `verify-phase` runs SUBAGENT:
`phase-spec-coverage`.

Review the completed slices as assembled phase work. Check whether the slice
outcomes and build-verification evidence satisfy the phase spec without
expanding into whole-initiative review or replaying slice-local code audits.

## Checks

- phase scope: compare completed slices against the phase spec's accepted scope,
  boundaries, non-goals, and success criteria.
- coverage gaps: flag phase requirements with no completed slice evidence or
  only vague, skipped, contradictory, or residual-risk evidence.
- overreach: flag completed work that escaped phase scope when it creates
  readiness risk, hidden decisions, or follow-on obligations.
- evidence sufficiency: check that build-verification summaries give enough
  Static / Build, Unit / Component / Integration, E2E, Browser Clickthrough,
  Visual Evidence, skipped/not-applicable, and environment evidence to support
  phase readiness.
- phase-level proof: identify any phase-level checks, browser/user-flow proof,
  or visual evidence still needed because the assembled phase behavior is not
  proven by individual slice verification.

## Output

Follow `references/review-agents/output-discipline.md`.
