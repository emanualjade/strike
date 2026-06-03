# Built Slice Code Audit

Use this read-only audit when `verify-slice-build` runs SUBAGENT:
`built-slice-code-audit`.

Review changed code for general quality and local correctness. Check nearby
repo-pattern fit, naming, placement, duplication, code correctness,
maintainability, organization, utility/shared-code placement, edge cases, blast
radius, and obvious regressions.

## Checks

- code correctness and maintainability: check that the implementation is
  accurate, readable, well organized, cohesive, easy to maintain, and no more
  complex than the slice needs.
- repo structure and utilities: check that files, components, utilities,
  helpers, adapters, tests, and shared code live in the repo's established homes
  and do not create vague buckets, duplicate helpers, or awkward ownership.
- robustness and edge cases: check that important empty, missing, invalid,
  duplicate, stale, partial, retry, failure, recovery, permission, and
  destructive-action cases are handled or credibly out of scope for this slice.
- blast radius and regressions: check that shared code changes, data contracts,
  UI behavior, side effects, integrations, and existing workflows touched by the
  slice were considered and protected.

## Output

Follow `references/review-agents/output-discipline.md`.
