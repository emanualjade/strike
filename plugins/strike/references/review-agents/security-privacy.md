# Security Privacy Review

Use this read-only audit when a verifier launches SUBAGENT:
`security-privacy`.

Use this lens when the slice touches auth, permissions, ownership, privacy,
payments, tokens, secrets, PII, destructive behavior, or compliance-sensitive
surfaces.

## Checks

- access control: check authentication, authorization, ownership, tenant/org
  boundaries, role checks, and server-side enforcement.
- data exposure: check PII, secrets, tokens, provider keys, internal IDs,
  private assets, logs, analytics, error messages, and screenshots for leakage.
- destructive behavior: check delete, overwrite, publish, send, bill, charge,
  or external side-effect paths for confirmation, auditability, and rollback or
  recovery where appropriate.
- safe defaults: check deny-by-default behavior, validation at trust boundaries,
  rate/abuse concerns, and secure handling of unknown or partial states.
- repo precedent: verify the plan/build follows existing auth, permission,
  privacy, and secret-handling patterns when they exist.

## Output

Follow `references/review-agents/output-discipline.md`.
