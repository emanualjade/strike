# Canonical Readiness Audit

Use this read-only audit when `verify-slice-plan` runs SUBAGENT:
`canonical-readiness-audit`.

## Trigger

This audit is required, not optional, whenever the slice or plan touches a
mature solved domain such as payments, refunds, discounts, billing,
accounting, taxes, auth, sessions, or permissions, or uses a third-party API,
package, SDK, framework feature, or provider/model in a way that has no
existing repo precedent. A newly added dependency is always a no-precedent
surface. Inventing in these areas is the most common and expensive failure
this workflow guards against, and the agent that invented a solution cannot be
trusted to notice it should have checked the docs. Reusing an established repo
pattern for the same surface is not invention; the verifier skips this audit
when no solved domain is touched and every touched third-party surface follows
named repo precedent, and records the skip with its reason and the precedent
file(s).

## Mandate

Check whether the plan uses the official, idiomatic, recommended way to solve
this class of problem. This is a plan-time audit: verify that the plan is
grounded in official docs, audited research, generated/package types, framework
conventions, and existing repo precedent before build begins. Treat audited
initiative/phase research and audited library entries as trusted baseline; do
not re-verify claims they already verified unless a claim the plan leans on
could plausibly have changed. Actually fetch and read the official docs and
package/generated types for the claims the plan adds beyond that baseline;
never judge canonicality from the plan's own unaudited claims.

## Checks

- canonical surfaces: identify every third-party API, package, SDK, framework,
  plugin, provider/model, generated type system, domain standard, or solved
  repo pattern the slice depends on.
- official recommended path: for each relevant surface, check official docs,
  primary sources, audited initiative/phase research, or generated/package
  types for the recommended primitives, lifecycle, permissions, data shapes,
  errors, and integration flow.
- no plausible invention: do not accept a reasonable-sounding implementation as
  canonical. Flag guessed APIs, handmade permission systems, invented provider
  responses, custom error/type objects, ad hoc schema assumptions, or manual
  workflows when an official or repo-proven solution exists.
- repo precedent: check the repo for existing implementations of the same class
  of problem. The plan should reuse the closest good pattern or explain a
  credible no-precedent finding.
- research sufficiency: if the plan does not cite enough official, audited, or
  repo evidence to know whether the approach is canonical, mark it `Must Fix`.
- boundary fit: check that planned adapters, external calls, environment access,
  payload handling, retries, durable artifact references, and error handling fit
  the repo's normal boundaries.
- generated and package types: check whether the plan intends to use real types
  from packages, SDKs, Prisma, Zod, framework helpers, or generated clients
  instead of making up parallel types.

## Output

Follow `references/review-agents/output-discipline.md`.
