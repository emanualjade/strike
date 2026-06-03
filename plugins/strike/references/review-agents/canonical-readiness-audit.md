# Canonical Readiness Audit

Use this read-only audit when `verify-slice-plan` runs SUBAGENT:
`canonical-readiness-audit`.

Check whether the plan uses the official, idiomatic, recommended way to solve
this class of problem. This is a plan-time audit: verify that the plan is
grounded in official docs, audited research, generated/package types, framework
conventions, and existing repo precedent before build begins.

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
