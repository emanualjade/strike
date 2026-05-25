# Code Quality, Review, And Safety

The existing code becomes the model's anchor. Start overly organized and keep it
that way. Before the first meaningful code change in a greenfield or thin repo,
choose a simple structure and record it in the spec or first slice. Adapt to the
framework, but make concern boundaries obvious: routes/pages, UI components,
domain logic, server/API actions, data access, integrations, formatting/parsing,
validation, tests, and scripts should each have a clear home.

## Code Quality Checklist

Use this checklist during spec planning, slice planning, phase review, and
readiness review:

- Structure: code is grouped by clear product/domain boundaries and runtime
  boundaries. UI, server actions/API, data access, business rules, adapters, and
  formatting/parsing are not casually mixed together.
- Names: files, functions, types, routes, and docs use the shared language.
  Avoid vague buckets like `helpers`, `utils`, `misc`, `common`, or `stuff`.
  Prefer purpose names such as `date-utils`, `money-display`,
  `video-transcript-parser`, or `upload-validation`.
- Core noun before qualifiers: before creating adjective-noun siblings such as
  `ManualReport` / `ScheduledReport` or `PublicAsset` / `PrivateAsset`, ask
  whether the qualifier belongs as a field, enum, state, permission,
  relationship, configuration, placement, ownership, or usage context.
- Small modules: no catch-all files, oversized components, hidden side effects,
  or scattered duplicate logic. Extract only when it creates a real stable
  boundary or removes meaningful duplication.
- Blast radius: changes touch the smallest coherent surface. Shared code,
  schemas, auth, payments, uploads, migrations, background jobs, and external
  integrations are treated as higher-risk surfaces.
- Dependencies: add third-party packages only when they clearly reduce risk or
  complexity. Check current docs, maintenance, version fit, security posture,
  and local alternatives first. Isolate vendor-specific code behind a
  purpose-named adapter when it affects auth, payments, uploads, media, AI,
  email, queues, analytics, or other replaceable integrations.
- Environment and secrets: never hardcode secrets, tokens, API keys, webhook
  secrets, or environment-specific URLs. Keep env access centralized and
  documented. Validate required env vars at startup or at the boundary where
  they are used. Update example env files or setup docs when adding new config.
- Data integrity: inputs are validated at boundaries, errors are explicit,
  state transitions are intentional, and destructive or external side effects
  are guarded.
- Observability and debugging: important failures should leave enough evidence
  to diagnose the issue without guessing. Use clear user-facing errors, useful
  server logs, structured error handling, and documented reproduction or debug
  steps for risky flows. Do not leak secrets or sensitive data in logs or UI.
- Tests/checks: important behavior, business rules, permissions, formatting,
  parsing, failure paths, and integration boundaries have focused verification
  or a documented reason they do not.
- Browser and visual checks: for frontend/UI changes, run the app locally and
  inspect the changed route, component, or state in a browser when feasible.
  Check relevant desktop/mobile widths, loading/empty/error/success states,
  accessibility basics, and visible regressions. If the app cannot run locally or
  a browser check is not possible, record the blocker and replacement evidence.
- UX quality: user-visible states include loading, empty, success, failure, and
  recovery paths when relevant. Accessibility and responsive behavior are not
  afterthoughts.
- Maintainability: future agents can find where a concern belongs without
  guessing. New patterns are documented in `auto-strike/` when they affect
  future slices.

## Verification Matrix

Choose checks based on the risk and surfaces changed. Do the smallest set that
gives real confidence; do not run broad suites only to look busy.

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

If a normally expected check cannot run, record the blocker, the risk left open,
and the replacement evidence.

## Dependency And Install Discipline

Before adding or upgrading a dependency, confirm:

- the repo does not already have an adequate local pattern or package
- the dependency solves real complexity or risk for the active slice
- current official docs support the intended usage
- the version fits the repo runtime, framework, bundler, and deployment target
- security, maintenance, license, bundle/runtime impact, and vendor lock-in are
  acceptable
- vendor-specific code is isolated behind a purpose-named adapter when the
  surface is replaceable or high risk

Do not install packages, run migrations, approve build scripts, or change
generated lockfiles unless the user approves or repo instructions clearly allow
it. If approval is needed, explain the package, why it is needed, and the
alternative.

For greenfield MVPs, do not silently turn setup into an architecture decision.
Use existing repo signals first. If there are no useful signals, recommend a
small default stack or no-install prototype path, ask before dependency
installation, and record the chosen setup plus any blocked install step in
`auto-strike/`.

## Review Standard

Before meaningful implementation, review the slice execution plan. The plan
review should be grounded in slice-specific research, local codebase precedent,
and the active spec. It should challenge whether the plan names the right
files/surfaces, keeps concern boundaries clean, includes the right verification,
handles likely edge cases, and avoids avoidable scope drift. Use a critical
review subagent or fresh-context pass when the slice is risky, UI-heavy,
data-heavy, integration-heavy, or large enough that the build agent may be
anchored on its own plan.

Every review pass should ask:

- Does the work match the idea, decisions, spec, slice, and current plan?
- Does the implementation satisfy the code quality checklist?
- Did the work use current official docs or local precedent where it should?
- Is the blast radius as small as practical?
- Are dependency choices, environment variables, secrets handling, vendor
  adapters, and debugging/logging paths appropriate for the risk introduced?
- Are shared utilities, adapters, data access, and domain logic named and placed
  clearly instead of scattered through UI/routes/actions?
- Are important failure paths, permissions, data integrity, accessibility, and
  user-visible states covered?
- Did the work run an edge case pass scaled to the risk, and are important cases
  handled, verified, deferred, or explicitly accepted?
- Are tests/checks enough for the risk introduced?
- For UI work, was the changed behavior inspected in a browser or visual check,
  with skipped checks explained?
- Are docs, decisions, language, slice evidence, and todo updated?

For meaningful Fast Path code changes, separate review from implementation even
if the same agent performs both passes. For Large Scope, high-risk surfaces, or
multi-slice MVPs, prefer an independent subagent or fresh-context review when
available. Multiple review agents may run in parallel when each has a distinct
lens, such as edge cases, user stories and happy paths, failure/recovery flows,
spec coverage, implementation plan, functionality, code quality, UI regression,
accessibility, security/privacy, state/data integrity, or integration behavior.
Review agents should return findings to the main agent for synthesis and
evaluation. The main agent decides what is blocking, what is accepted risk, what
belongs in follow-up, and what fixes to make. Record who or what reviewed, the
lens used, the main findings, and any accepted residual risk in the slice
evidence or readiness note.

Before starting focused review, write compact evidence for the current slice:
`Changed:`, `Verified:`, any important skipped checks, and known review focus.
Then run `review-plan` when implementation files changed and apply the required
lenses unless there is a clear reason to downgrade one. Record each required
lens under `Reviewed:` with a concrete outcome, or under `Skipped:` with the
rationale for not running it. This keeps review grounded in the real
implementation and lets `review-context` include source files directly instead
of making reviewers infer them from prose.

Use the required baseline lenses for meaningful slice work:

- `implementation-plan`: before coding, whether slice research, local precedent,
  exact surfaces, sequencing, verification, and risk handling are strong enough
  to build from.
- `functionality`: whether the behavior works end to end.
- `spec-coverage`: whether the work matches the active spec, slice, success
  checks, non-goals, and accepted scope.
- `code-quality`: whether the implementation is maintainable, scoped, tested,
  and placed in the right boundaries.

Add surface-specific lenses when the changed files justify them:

- `ui-regression` for HTML/CSS/component/front-end changes. This review checks
  new DOM or component structure against existing CSS selectors, inherited
  styles, layout constraints, interaction states, and responsive behavior. It
  should use browser or visual evidence when feasible; if blocked, record a
  static fallback review that explicitly checks selector scope and layout risk.
- `user-flows` for UI/workflow changes.
- `state-data-integrity` and often `edge-cases` for state, storage, schema,
  persistence, model, migration, or data-boundary changes.
- `security-privacy` for auth, permissions, ownership, payment, token, secret,
  PII, retention, or compliance-sensitive changes.
- `integration-risk` for API, provider, webhook, queue, upload, media, AI,
  email, payment, or other external-service boundaries.

When available, use the Auto Strike helper's `review-plan` to recommend lenses
from the active `Changed:` evidence, then use `review-context --lens <lens>` to
prepare compact reviewer packets. The helper only packages context and suggests
lenses; it does not dispatch subagents, evaluate findings, or decide which risks
are acceptable. Its source paths are grouped as active docs, changed files from
active evidence, workspace docs, and context docs so reviewers can prioritize
the changed implementation before background material.

Before review or readiness, keep `Changed:` aligned with the real worktree. The
helper may compare active `Changed:` evidence with Git's changed, staged, and
untracked implementation files. If it reports drift, confirm the extra files are
unrelated user work or update `Changed:` before trusting reviewer packets.

If review finds blocking issues, write plain checklist items, fix only those
items, verify again, and re-review. Do not use review as an excuse to redesign
the feature unless the current design cannot meet the spec safely.

## Change Safety

Before editing implementation files:

- Check the current worktree or file state.
- Identify the files and surfaces this slice is expected to touch.
- Do not overwrite, revert, delete, or reformat unrelated user work.
- Do not use destructive commands or broad cleanup unless the user explicitly
  asks.
- Do not commit, push, install dependencies, run migrations, or change
  production-facing config unless the user approves or the repo instructions
  clearly allow it.
- Keep changes scoped to the active slice. If a fix requires broad shared
  changes, stop and update the plan before continuing.
