# Verification

Choose checks based on the risk and surfaces changed. Do the smallest set that
gives real confidence; do not run broad suites only to look busy.

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

For UI, browser behavior, auth/session flows, routing, forms, responsive layout,
or user-visible state, run the app locally and inspect the changed route,
component, or state in a browser when feasible. Check relevant desktop/mobile
widths, loading/empty/error/success states, accessibility basics, console/runtime
errors when feasible, and visible regressions.

If a normally expected check cannot run, record the blocker, the risk left open,
and the replacement evidence. Do not skip browser checks only because the repo
lacks Playwright or another browser package; use host/manual browser tooling
when available. Static review is a fallback for blocked browser access, not an
equivalent replacement.
