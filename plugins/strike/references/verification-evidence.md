# Verification Evidence

Use these categories consistently when planning, building, and verifying Strike
slices. Keep them separate so one kind of evidence cannot silently replace
another.

Each category should answer:

```md
Required: yes / no
Environment:
Evidence:
Result: passed / failed / skipped / not applicable
Reason:
```

## Static / Build Checks

Compile, typecheck, lint, schema validation, generated-code checks, dependency
checks, or other non-runtime checks for the changed surface.

## Unit / Component / Integration Tests

Focused automated tests for logic, rendering, API or server behavior,
persistence, validation, state, adapters, and internal integration boundaries.

## E2E Tests

Committed automated user-flow specs, such as Playwright or Cypress tests.

Require E2E tests when the repo already has E2E infrastructure and the slice
changes an important user workflow, auth or permission boundary, persistence
path, cross-page flow, regression-prone interaction, or business-critical path.
Otherwise record a concrete skip or not-applicable reason.

Run E2E tests in the repo's test or E2E-test environment, using test fixtures,
test data setup, and the repo's normal test commands. Do not point E2E tests at
the live dev environment just because fixtures are missing or the test setup is
hard.

## Browser Clickthrough

Live browser exercise of the actual accepted feature. For browser-visible work,
this is mandatory before build verification can pass.

Browser clickthrough must record:

- environment and DB/runtime used
- route or page opened
- representative data created, seeded, uploaded, or used
- controls clicked or user actions taken
- keyboard, focus, accessibility, or alternate-input actions attempted when
  they are part of accepted scope
- expected states or results observed
- issues found or residual risk

Opening a route shell, logging in, navigating near the feature, static review,
curl, DOM inspection, and screenshots alone are not browser clickthrough.

Run Browser Clickthrough against the dev/local app environment unless repo
instructions or the user explicitly require a different environment. Do not
switch to a test DB or test environment to make browser clickthrough easier. If
the dev/local environment is blocked by schema drift, missing migrations, missing
services, or seed data problems, record the blocker and fail or route back
instead of silently changing environments.

A failed first browser route, URL form, or browser tool is not enough to declare
Browser Clickthrough blocked. Treat the browser as available. If local browser
navigation fails, try valid alternate local URL forms such as `localhost`,
`127.0.0.1`, the assigned dev-server host/port, and, for static apps, an
absolute `file://` URL when the app can run from disk. If one browser automation
surface blocks the URL or cannot complete navigation, try another available
browser surface before failing verification. Record each attempted URL/tool and
the observed failure. Do not use curl, server reachability, DOM inspection, or
static review as the fallback substitute for clicking the feature.

When keyboard or alternate-input behavior is part of accepted scope, prove it in
the browser when the automation surface can synthesize the relevant native
events. If the browser surface focuses the control but cannot synthesize native
activation or focus traversal, record the exact keys/tools attempted, the
observed limitation, and the residual risk separately. Do not add custom app key
handlers solely to satisfy an automation quirk for native controls.

## Visual Evidence

Screenshots of the actual changed feature state after representative data and
interaction. For browser-visible work, visual evidence supports browser
clickthrough; it does not replace clicking through the flow.

## Skipped / Not Applicable

Use only with a concrete reason per category. For browser-visible accepted scope,
do not skip Browser Clickthrough. If the feature cannot be exercised because a
product decision, data path, auth path, or external dependency is missing, mark
verification as failing or route back instead of treating the gap as passed.

## Cross-Category Rules

- Relevant automated checks and browser clickthrough are separate gates.
- Browser clickthrough does not replace appropriate automated tests.
- Automated tests do not replace browser clickthrough for browser-visible work.
- E2E tests and browser clickthrough are not the same: E2E tests are committed
  automated specs; browser clickthrough is live feature exercise.
- A browser URL-policy, navigation, timeout, or tool-selection failure is a
  Browser Clickthrough recovery problem first. Retry with alternate local URL
  forms and another available browser surface before calling it blocked.
- E2E tests and Browser Clickthrough must stay in their proper environments:
  tests in the repo's test/E2E environment, browser clickthrough in the dev/local
  app environment unless explicitly overridden.
- Do not modify env files, DB targets, or runtime mode just to make a check pass.
  If a non-default environment is used, record who/what required it, what failed
  in the default environment, and how it affects confidence.
- Representative local data is part of the work. Create, seed, upload, fixture,
  or mock it safely when the feature needs data to be exercised.
