# Full Plan Audit

Use this read-only audit when `verify-slice-plan` runs SUBAGENT:
`full-plan-audit`.

Run a senior-engineer plan review across the whole slice. This is not an
implementation/code audit. Check whether the plan makes sense before build
starts and whether it gives the builder enough context to avoid guessing.

## Checks

- codebase fit: check that planned files, surfaces, utilities, state boundaries,
  data flow, and dependency order fit the surrounding repo structure.
- completeness: check that the plan covers the accepted slice outcome,
  acceptance criteria, edge cases, failure/recovery paths, and required
  user/system states without leaving hidden work for the builder.
- blast radius: check likely impact on adjacent features, shared utilities,
  data/schema contracts, auth/permissions, jobs/queues, external integrations,
  browser flows, tests, and operational assumptions.
- security and privacy: when the plan touches auth, permissions, ownership,
  secrets, PII, destructive actions, payments, or compliance-sensitive surfaces,
  check that the plan names the needed protections and verification evidence.
- state and data: when the plan touches local state, server state, cache,
  schema, persistence, serialization, generated models, migrations, or durable
  artifacts, check that the plan states the intended data lifecycle and cache or
  consistency strategy.
- UI and accessibility: when browser-visible work is planned, check that the
  plan names the affected route/page, components, states, form behavior,
  keyboard/focus or accessibility concerns, and visual/browser evidence.
- tests and proof: check that the `Verification Plan` has specific static,
  unit/component/integration, E2E, Browser Clickthrough, and visual evidence
  entries or clear not-applicable reasons.
- maintainability: check that the plan is clean, simple, organized, and likely
  maintainable without over-engineering or scattering duplicate helpers.

## Output

Follow `references/review-agents/output-discipline.md`.
