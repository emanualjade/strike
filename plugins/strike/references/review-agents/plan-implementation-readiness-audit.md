# Plan Implementation Readiness Audit

Use this read-only audit when `verify-slice-plan` runs SUBAGENT:
`plan-implementation-readiness-audit`.

Check whether the plan is complete, cohesive, buildable, inside the accepted
slice boundary, aligned with the phase spec, grounded in research and repo
patterns, and ready for an agent to build without guessing.

## Checks

- slice and phase fit: compare the plan's `Development Plan` against the slice
  outcome, acceptance criteria, phase spec, dependencies, in-scope work,
  out-of-scope boundaries, and verification intent.
- research usage: check that the plan uses initiative research and phase
  research as inherited baseline evidence, records any narrow slice-specific
  research delta, and explains why no new slice-specific research was needed
  when applicable. When optional supporting artifacts are loaded, check that
  relevant notes were represented or explicitly rejected with a reason.
- plan specificity: check that likely files, surfaces, sequencing, edge cases,
  and verification are specific enough to build from.
- codebase patterns: check that `Codebase Patterns` names enough surrounding
  code, upstream/downstream impact, shared-utility awareness, local repo
  precedent, and similar-precedent evidence for the slice's risk.
- system touchpoints: check that `System Touchpoints` covers relevant UI, API,
  state/data, schema, jobs/queues, files/storage, auth/permissions,
  integrations, tests, browser flows, shared utilities, and adjacent features
  without filling irrelevant surfaces.
- blast radius: check that `Blast Radius` explains what could be affected
  outside the immediate slice and how the plan protects those areas.
- implementation discipline: check that the plan applies relevant
  implementation discipline guidance, places new utilities/helpers/adapters in a
  repo-pattern-based home, and accounts for likely callers or downstream
  consumers when shared code changes.
- naming and data shape: check planned names, files, types, routes, and schema
  concepts with the core noun before qualifiers lens. Do not fail separate
  concepts just for being separate, but flag adjective-noun siblings when a
  field, enum, state, permission, relationship, ownership, placement, or usage
  context may be the better model.
- verification plan: check that the plan has a concrete `Verification Plan`
  using these categories: Static / Build Checks, Unit / Component / Integration
  Tests, E2E Tests, Browser Clickthrough, Visual Evidence, and Skipped / Not
  Applicable. Check that it separates automated tests from Browser Clickthrough,
  names intended environments, avoids vague default full-suite commands, and
  explains skipped or not-applicable checks.
- E2E and browser proof: for browser-visible work, check that Browser
  Clickthrough names the actual route/page, dev/local environment and
  DB/runtime, representative data, controls/actions, expected states/results,
  and Visual Evidence screenshots. Check that E2E Tests either names specs to
  add/update or gives a concrete skip/not-applicable reason.
- repo precedent for risky work: for integration, provider, workflow, upload,
  asset, storage, queue, job, callback, webhook, or dataflow work, confirm the
  plan searched for existing repo examples of the same problem class and named
  the closest precedent or a credible no-precedent finding.
- risk and decisions: review risky state, data, UI, integration, permission,
  rollback, product, security, data, permission, or hard-to-reverse architecture
  concerns that apply to the slice.

## Output

Follow `references/review-agents/output-discipline.md`.
