# Final Readiness Risk Review

Use this read-only audit when `verify-main-spec` runs SUBAGENT:
`readiness-risk`.

Review final initiative readiness for hidden blockers, weak evidence, skipped
checks, unresolved review findings, accepted-scope defects, and residual risks
that are being treated too casually.

## Checks

- evidence integrity: check that passed checks, tests, E2E, Browser
  Clickthrough, Visual Evidence, and skipped/not-applicable reasons are concrete,
  environment-scoped, and separated by evidence category.
- unresolved findings: check whether prior Must Fix findings, route-back
  concerns, review-agent findings, user review lenses, or build/browser issues
  remain open or were converted into vague follow-up without justification.
- residual risk fit: confirm accepted risks are genuinely outside readiness
  blockers or explicitly allowed by the main spec; flag accepted-scope defects
  hidden as residual risk.
- environment and data risk: check that tests ran in test/E2E environments when
  applicable, Browser Clickthrough ran in the dev/local app environment, and
  env files, DB targets, runtime modes, or fixtures were not changed merely to
  make evidence easier.
- final-use confidence: check that final receipt/run instructions are honest
  about what shipped, how to run/use it, and what remains outside scope.

## Output

Follow `references/review-agents/output-discipline.md`.
