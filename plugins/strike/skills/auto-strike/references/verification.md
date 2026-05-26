# Verification

Choose checks based on the risk and surfaces changed. Do the smallest set that
gives real confidence; do not run broad suites only to look busy.

## Capability Preflight

Before accepting fallback evidence, identify the verification that is actually
available:

- repo scripts/checks
- host, browser, manual, API, or user-flow checks
- package/install constraints
- blocked checks and why they are blocked
- replacement evidence and residual risk

For UI, auth/session, routing, forms, responsive layout, user-visible state,
integrations, or skipped checks, missing Playwright, Cypress, or another repo
browser dependency is not enough to skip browser/user-flow checks when host or
manual browser tooling is available.

## Check Matrix

- Copy/content/docs: spelling, links, rendered page if visible, and no unrelated
  formatting churn.
- Frontend/UI: relevant lint/type/build checks, browser inspection, desktop and
  mobile widths, loading/empty/error/success states, and accessibility basics.
- Business logic/API: focused unit or integration tests, command/API checks,
  validation failures, authorization failures, and useful errors.
- Data/model/migrations: schema validation, migration or seed checks, data
  integrity cases, rollback notes, and duplicate/destructive action handling.
- Auth/permissions/payments/uploads: current official docs, negative permission
  cases, sandbox/mock checks, webhook/retry/idempotency behavior, and secret
  handling.
- Integrations/AI/media/background jobs: sample inputs,
  timeout/rate-limit/provider failure behavior, cost limits, retry behavior, and
  logs/debug evidence.
- Config/dependencies: build/start check, env example updates, startup
  validation, version fit, and security/maintenance review.

UI/user-flow slices MUST be verified in a browser. Use Browser/Chrome tools,
Chrome MCP, repo Playwright/Cypress, a repo browser script, or explicit manual
browser verification.

Act like the user: click the flow, check visible results, console/network,
layout, state, and error cases. Curl, static HTML, and code review are not
browser verification.

Ad hoc smoke or walkthrough scripts should fail fast: use a known-free port or
assert the expected server, check response status and required IDs after every
step, and do not print success after failed or empty responses.

If no approved browser path is available, continue but report it loudly:
browser verification was not performed, what you checked instead, and the
residual user-facing risk.
