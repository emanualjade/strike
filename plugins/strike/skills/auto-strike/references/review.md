# Review

Review is the source of truth for plan review, post-build review, reviewer
behavior, evidence shape, and review lens selection.

Use review to catch bugs, missed requirements, edge cases, UI regressions,
security/data risks, and code-quality problems. Review does not replace
verification; it evaluates evidence and changed implementation.

Use `code-quality.md` for the quality checklist and `verification.md` for check
and browser/user-flow expectations.

Do not create a separate review document by default. Keep review outcomes in the
active slice's `Reviewed`, `Skipped`, and `Review Findings` evidence unless a
larger milestone needs `readiness.md`.

## When To Review

- Before meaningful implementation, review the slice plan for research,
  verticality, size, dependency order, surfaces, edge cases, verification, and
  risk handling.
- After meaningful code changes, run a distinct review pass instead of relying
  only on the build mindset.
- For high-risk surfaces, UI/data/integration-heavy work, or new/multi-slice
  features, use a read-only subagent or fresh-context review when the host
  supports it.
- Multiple review agents may run in parallel when each has a distinct lens.

## Evidence

Before focused review, record compact evidence:

```md
Changed:
- [files/surfaces]

Verified:
- [command/check/browser route/state] - [result]

Edge / Flow Coverage:
- [important edge case or user flow] - [handled/tested/deferred/accepted]

Reviewed:
- [lens] - [pass / blocker / warning and short finding]

Skipped:
- [check or required lens] - [reason, risk, replacement evidence]

Review Findings:
- [open blocker or "None"]
```

Keep `Changed:` aligned with the actual implementation files changed in the
worktree. If Git or the helper reports extra changed files, confirm they are
unrelated user work or update the evidence before trusting review packets.

Use `review-plan` after `Changed:` and `Verified:` evidence exists. Use
`review-context --lens <lens>` to prepare compact reviewer packets. The helper
packages context and suggests lenses; it does not dispatch reviewers, evaluate
findings, or decide acceptable risk.

## Review Lenses

Required baseline lenses for meaningful slice work:

- `implementation-plan`: before coding, checks slice research, local precedent,
  size, dependency order, verticality, surfaces, sequencing, verification, and
  risk handling.
- `functionality`: checks whether the behavior works end to end.
- `spec-coverage`: checks idea, decisions, spec, slice, success checks,
  non-goals, and accepted scope.
- `code-quality`: checks maintainability, boundaries, blast radius, tests,
  dependencies, env/secrets, logging, and placement.

Add surface-specific lenses when the changed files justify them:

- `ui-regression` for HTML/CSS/component/frontend changes.
- `user-flows` for UI/workflow changes.
- `state-data-integrity` and often `edge-cases` for state, storage, schema,
  persistence, model, migration, or data-boundary changes.
- `security-privacy` for auth, permissions, ownership, payment, token, secret,
  PII, retention, or compliance-sensitive changes.
- `integration-risk` for API, provider, webhook, queue, upload, media, AI,
  email, payment, or other external-service boundaries.

For UI, browser behavior, auth/session flows, routing, forms, responsive layout,
or user-visible state, include browser/user-flow review evidence. Use host
browser tools or a manual browser check when they are available; the repo does
not need a browser automation dependency for this to count. If browser access is
actually blocked by the host or environment, record that blocker and perform a
static UI regression fallback. Do not silently treat static review as equivalent
to a browser check.

## Reviewer Contract

Review agents are read-only. They do not edit code, docs, tests, package files,
generated files, commits, or user-facing conclusions. They inspect source, run or
request appropriate checks when allowed, and return severity-ranked findings
with evidence and recommended fixes to the main agent.

The main agent evaluates each finding as valid, invalid, already handled,
blocking, accepted risk, or follow-up. Fix blocking issues, verify again, and
re-review. Do not use review as an excuse to redesign the feature unless the
current design cannot meet the spec safely.
