# Integration Risk Review

Use this read-only audit when a verifier launches SUBAGENT: `integration-risk`.

Use this lens when the slice touches APIs, providers, SDKs, webhooks, queues,
uploads, media, AI, email, payment, analytics, background jobs, callbacks, or
external services.

## Checks

- integration contract: check request/response shapes, SDK types, status codes,
  provider error types, rate limits, payload limits, auth, timeouts, retries, and
  idempotency.
- repo precedent: search for existing integrations or workflow boundaries that
  solve a similar problem and verify the plan/build follows the same pattern.
- durable handoff: check that files, images, PDFs, blobs, base64, buffers, or
  large payloads are stored/uploaded at the right boundary and returned as small
  durable references.
- failure modes: check provider down, partial success, cancellation, duplicate
  event, stale callback, invalid payload, blocked content, and retry exhaustion
  behavior.
- observability: check useful logs, user-facing errors, status tracking, and
  debugging evidence without leaking sensitive data.

## Output

Follow `references/review-agents/output-discipline.md`.
