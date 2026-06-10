# Canonical Implementation Review

Use this read-only audit when a verifier launches SUBAGENT:
`canonical-implementation`.

## Trigger

At `verify-slice-build`, this audit is required, not optional, whenever the
changed code touches any third-party API, package, SDK, framework feature,
provider/model, or mature solved domain such as payments, refunds, discounts,
billing, accounting, taxes, auth, sessions, or permissions. The built code is
checked against the documented way, not against the plan's claims. When none
of these surfaces are touched, the verifier skips this audit and records the
skip with its reason.

## Mandate

Check whether the implementation uses the official, idiomatic, recommended way
to solve this class of problem. Actually fetch and read
the official docs or primary sources and the package/generated types for each
touched surface; do not accept a reasonable-sounding implementation as
canonical.

## Checks

- official/current source: check official docs or primary sources for the API,
  package, provider, framework, regulation, or domain rule when facts may be
  versioned, external, or high-stakes.
- local precedent: check the repo for existing examples of the same problem
  class and verify the plan/build reuses the closest good pattern or explains a
  credible no-precedent finding.
- standard shape: flag invented protocols, guessed provider responses, ad hoc
  package behavior, manual schema/API assumptions, or nonstandard flows when a
  documented or repo-proven path exists.
- boundary fit: check that provider adapters, external calls, env access,
  payload limits, retries, error handling, and durable artifact references use
  the repo's normal boundaries.
- production examples: when relevant, compare against serious production-system
  patterns such as Stripe, Shopify, or Amazon, but do not force those examples
  when the local repo pattern is sufficient.

## Output

Follow `references/review-agents/output-discipline.md`.
