# User Flows Review

Use this read-only audit when a verifier launches SUBAGENT: `user-flows`.

Use this lens when the slice changes a user, operator, command, integration, or
system workflow.

## Checks

- flow completeness: check entry points, required data, main path, alternate
  paths, cancellation, retries, empty states, failure states, and completion
  states.
- user intent: check that UI/actions/messages match the user's goal and do not
  leave hidden required steps or ambiguous status.
- cross-surface effects: check navigation, redirects, notifications, lists,
  detail pages, background jobs, persisted results, and related views touched by
  the workflow.
- verification: for plan verification, check that E2E and Browser Clickthrough
  plans name the flow, representative data, actions, expected states, and
  screenshots. For build verification, check that evidence proves the flow.
- regression risk: check existing workflows that might break because of shared
  state, shared components, routes, commands, jobs, or data contracts.

## Output

Follow `references/review-agents/output-discipline.md`.
