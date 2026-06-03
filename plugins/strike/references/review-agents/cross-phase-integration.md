# Cross-Phase Integration Review

Use this read-only audit when `verify-main-spec` runs SUBAGENT:
`cross-phase-integration`.

Review how completed phases compose into one initiative. Focus on handoffs,
dependencies, sequencing, shared assumptions, and assembled behavior across
phases, not phase-local or slice-local implementation quality already covered
by earlier verification.

## Checks

- phase handoffs and sequencing: check that each phase output is usable by
  dependent phases and that required ordering, setup, migrations, generated
  artifacts, jobs, routes, data states, or release steps are represented.
- shared assumptions: flag conflicting assumptions across phases about state,
  data shape, permissions, environment, test data, provider behavior, feature
  flags, operational constraints, or user workflow.
- integration gaps: look for missing glue between UI/API/data/background jobs,
  callbacks, uploads, queues, persistence, notifications, navigation, release
  steps, or external-service boundaries.
- duplicate or divergent patterns: flag cross-phase duplicated utilities,
  inconsistent data handling, parallel abstractions, or incompatible
  error/state handling that creates initiative-level risk.
- regression surface: identify existing adjacent flows or shared surfaces that
  need final smoke evidence because multiple phases touched them.

## Output

Follow `references/review-agents/output-discipline.md`.
