# Cross-Slice Integration Review

Use this read-only audit when `verify-phase` runs SUBAGENT:
`cross-slice-integration`.

Review how completed slices compose into one phase. Focus on handoffs,
dependencies, shared assumptions, and assembled behavior across slices, not
slice-local implementation quality already covered by slice verification.

## Checks

- handoffs and sequencing: check that each slice output is usable by dependent
  slices and that required ordering, setup, migrations, generated artifacts,
  jobs, routes, or data states are represented.
- shared assumptions: flag conflicting assumptions across slices about state,
  data shape, permissions, environment, test data, provider behavior, feature
  flags, or user workflow.
- integration gaps: look for missing glue between UI/API/data/background jobs,
  callbacks, uploads, queues, persistence, notifications, navigation, or
  external-service boundaries.
- duplicate or divergent patterns: flag cross-slice duplicated utilities,
  inconsistent data handling, parallel abstractions, or incompatible error/state
  handling that creates phase-level risk.
- regression surface: identify existing adjacent flows or shared surfaces that
  need phase-level smoke evidence because multiple slices touched them.

## Output

Follow `references/review-agents/output-discipline.md`.
