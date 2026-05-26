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
feature or initiative readiness pass needs `readiness.md`.

## When To Review

- Before meaningful implementation, review the slice plan for research,
  verticality, size, dependency order, surfaces, edge cases, verification, and
  risk handling.
- After meaningful code changes, run a distinct review pass instead of relying
  only on the build mindset.
- You MUST run a read-only review subagent.
- A main-agent self-review is never sufficient on its own.
- For high-risk or UI/data/integration-heavy work, run distinct read-only
  review subagents per lens.

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
- `spec-coverage`: checks idea, decisions, initiative spec, feature spec, slice,
  success checks, non-goals, and accepted scope.
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

UI/user-flow slices MUST be verified in a browser. Use Browser/Chrome tools,
Chrome MCP, repo Playwright/Cypress, a repo browser script, or explicit manual
browser verification.

Act like the user: click the flow, check visible results, console/network,
layout, state, and error cases. Curl, static HTML, and code review are not
browser verification.

If no approved browser path is available, continue but report it loudly:
browser verification was not performed, what you checked instead, and the
residual user-facing risk.

## Reviewer Contract

Review agents are read-only. They do not edit code, docs, tests, package files,
generated files, commits, or user-facing conclusions. They inspect source, run or
request appropriate checks when allowed, and return severity-ranked findings
with evidence and recommended fixes to the main agent.

The main agent evaluates each finding as valid, invalid, already handled,
blocking, accepted risk, or follow-up. Fix blocking issues, verify again, and
re-review. Do not use review as an excuse to redesign the feature unless the
current design cannot meet the spec safely.

After findings are fixed or accepted, summarize review in the slice's
`Closeout Summary` as confidence telemetry, not review minutes. Keep bullets
short: which lens/group passed, whether fixes were needed, skipped checks or
accepted risk, and whether final re-review has remaining blockers.
