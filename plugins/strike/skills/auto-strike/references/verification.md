# Verification

Choose checks based on the risk and surfaces changed. Do the smallest set that
gives real confidence; do not run broad suites only to look busy.

## Capability Preflight

Before accepting fallback evidence, identify the verification that is actually
available:

- repo scripts/checks
- `playwright-cli`, API, command, or user-flow checks
- package/install constraints
- blocked checks and why they are blocked
- replacement evidence and residual risk

For UI, auth/session, routing, forms, responsive layout, or user-visible state,
`playwright-cli` is the only approved browser path. Other browser tools,
screenshots, curl, static HTML, and code review do not count unless the user
explicitly overrides this standard.

For every UI/user-flow slice, record this before final verification:

```md
## Browser Verification Capability
- Applies: yes / no, with reason.
- Playwright CLI:
- Target URL / route:
- Viewports / flows:
- Status: verified / BLOCKED; replacement evidence; residual user-facing risk.
```

## Check Matrix

- Copy/content/docs: spelling, links, rendered page if visible, and no unrelated
  formatting churn.
- Frontend/UI: relevant lint/type/build checks, `playwright-cli` browser
  inspection, desktop and mobile widths, loading/empty/error/success states,
  and accessibility basics.
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

UI/user-flow slices MUST use `playwright-cli` browser verification.

Act like the user: click the flow, check visible results, console/network,
layout, state, and error cases. Curl, static HTML, and code review are not
browser verification.

Ad hoc smoke or walkthrough scripts should fail fast: use a known-free port or
assert the expected server, check response status and required IDs after every
step, and do not print success after failed or empty responses.

If `playwright-cli` is unavailable or blocked, continue but report it loudly:
browser verification was not performed, the UI slice is code-verified rather
than browser-verified, what replacement evidence you checked, and the residual
user-facing risk.
