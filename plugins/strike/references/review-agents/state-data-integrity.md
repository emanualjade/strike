# State Data Integrity Review

Use this read-only audit when a verifier launches SUBAGENT:
`state-data-integrity`.

Use this lens when the slice touches state, storage, schema, persistence,
migrations, models, serialization, cache consistency, or data boundaries.

## Checks

- source of truth: identify the authoritative owner for each important value,
  status, relationship, permission, or derived field.
- data shape: check schemas, models, generated types, Zod types, serialization,
  nullable states, enum states, and naming for consistency with repo patterns.
- persistence path: check creates, updates, deletes, migrations, transactions,
  idempotency, race conditions, retries, rollback, and recovery paths.
- boundary behavior: check API/action/job boundaries, background workers,
  queues, upload/storage references, durable references, and client/server
  handoffs instead of fragile in-memory or large payload transfer.
- cache and UI consistency: check invalidation, refetch, optimistic update,
  router refresh, or local reconciliation when persisted data changes.

## Output

Follow `references/review-agents/output-discipline.md`.
