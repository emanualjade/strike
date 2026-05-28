# Code Quality And Change Safety

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
- Dependencies: use `dependencies.md` before adding packages, changing
  lockfiles, running migrations, or making package-shaped architecture choices.
  Isolate vendor-specific code behind purpose-named adapters when it affects a
  replaceable or high-risk surface.
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
- Verification fit: use `verification.md` to choose focused checks that match
  the risk and changed surfaces.
- UX quality: user-visible states include loading, empty, success, failure, and
  recovery paths when relevant. Accessibility and responsive behavior are not
  afterthoughts.
- Maintainability: future agents can find where a concern belongs without
  guessing. New patterns are documented in `auto-strike/` when they affect
  future slices.

## Change Safety

Before editing implementation files:

- Check the current file state.
- Identify the files and surfaces this slice is expected to touch.
- Do not overwrite, revert, delete, or reformat unrelated user work.
- Do not use destructive commands or broad cleanup unless the user explicitly
  asks.
- Do not install dependencies, run migrations, or change production-facing config
  unless the user approves or the repo instructions clearly allow it.
- In Auto Strike, completed slice and readiness checkpoints are expected to be
  committed. Push only when requested, repo policy requires it, or release flow
  needs it. Include only scoped work and never include unrelated user changes.
- Keep changes scoped to the active slice. If a fix requires broad shared
  changes, stop and update the plan before continuing.
