---
name: plan-slice
description: Create a concrete implementation plan for one slice from its slice stub, phase spec, and relevant repo context.
argument-hint: "[slice/context]"
disable-model-invocation: true
allowed-tools: Read Write Edit Grep Glob WebFetch WebSearch
---

# Plan Slice

Create a concrete implementation plan for one slice.

## Inputs

- slice stub or slice context
- initiative research index and relevant reports when they affect this slice
- supporting artifacts relevant to this slice, when present
- slice research from the current slice's `research.md`
- phase spec
- shared verification evidence taxonomy from the Strike plugin root's
  `references/verification-evidence.md`
- user implementation guidance from
  `strike/user-guidance/implementation-discipline/global.md` and
  `strike/user-guidance/implementation-discipline/plan-slice.md`
- optional main spec, decisions, or repo context

## Process

- Read the slice stub, relevant initiative research, relevant supporting
  artifacts, slice research, and relevant spec context.
- Read the bundled `references/verification-evidence.md` from the Strike plugin
  root.
- Read `strike/user-guidance/implementation-discipline/global.md` and
  `strike/user-guidance/implementation-discipline/plan-slice.md` if they
  exist.
- If slice research says `Ready for planning: no`, do not plan; surface the
  blocker or unresolved decision.
- Classify the kind of work the slice is about to do before proposing the
  approach. Use categories such as UI/component, routing/API, networking/provider
  integration, async workflow/job/queue, data model/persistence, upload/file/asset
  storage, validation/error handling, auth/permissions/ownership, and
  testing/E2E/browser verification.
- Inspect local repo patterns before planning edits, including surrounding code,
  related upstream inputs, downstream consumers, and existing shared utilities
  or helpers that may already cover the need.
- For each relevant work category, inspect how the repo already structures and
  solves similar work before proposing the implementation. Prefer existing
  patterns unless there is a clear reason to differ, and record that reason.
- For integration, provider, workflow, upload, asset, storage, queue, job,
  callback, webhook, or dataflow work, search for existing repo examples of the
  same class of problem before proposing a new pattern. Name the precedent or
  record that none was found.
- Use the slice research as planning input.
- Use initiative research as inherited constraints. Do not plan behavior that
  contradicts provider/model/API/database/file/queue constraints recorded
  before Grill.
- If `supporting-artifacts/` exists, scan it and read only files relevant to
  this slice. Use them to understand schema reasoning, architecture tradeoffs,
  provider routing, data lifecycle, permissions, or operational constraints.
- Apply relevant user implementation guidance to the approach and verification
  plan.
- Preserve the slice outcome, acceptance criteria, dependencies, in-scope work,
  out-of-scope boundaries, and verification intent.
- Do tactical research as needed when planning reveals a detail that affects
  implementation, verification, or risk.
- Name likely files, surfaces, and concern boundaries.
- Use the core noun before qualifiers lens when the plan names domain concepts,
  files, types, routes, or schema shape. If adjective-noun siblings appear, ask
  whether the qualifier belongs as a field, enum, state, permission,
  relationship, ownership, placement, or usage context.
- Identify edge cases, verification evidence categories, focused automated
  tests, browser clickthrough, visual evidence, and rollback or recovery notes.
- For each verification evidence category, name the intended environment. Keep
  automated tests in the repo's test/E2E environment and Browser Clickthrough in
  the dev/local app environment unless repo instructions or the user explicitly
  require otherwise.
- Before writing the plan, check whether the slice is cohesive and verifiable in
  one focused build loop. If the likely plan has independent behaviors, unclear
  verification, weak cohesion, or broad-stack work that can be separated without
  creating fake work, do not write a bloated plan. Write a split recommendation
  instead.
- Ask one consequential question if a missing decision changes behavior, risk,
  or implementation shape.
- Point build toward the simplest safe approach. The plan should be specific
  enough to build from, but not a step-by-step coding script.

## Research

Initiative research captures provider/model/API, database/schema, file/blob,
queue/job, auth/payment, and repo-pattern constraints that shaped the spec. Use
it as inherited context when relevant. Slice research is the required
implementation-specific evidence check for this slice.

Supporting artifacts are optional decision-discussion notes. Use them when
relevant, but do not treat them as standalone scope. Accepted decisions and
constraints must still be represented in `decisions.md`, `main-spec.md`, or the
phase/slice specs.

The required pre-planning research should already exist in the slice research
file. Use it as the evidence check before planning, not as the plan itself.
In Strike, it lives at:

```text
strike/initiatives/<initiative-id>/phases/<phase-id>/slices/<slice-id>/research.md
```

If you have reason to do more research on your own you should feel free to do that.
If you need to discover the canonical way of doing things and not guessing you should do more research.

Record how the plan uses the existing research in `Research Used`. If research
was marked unnecessary, say why instead of inventing findings. Record only new
planning-time findings in `Implementation Research Additions`, using the same
compact style: source, finding, and why it matters. Do not paste raw notes, long
excerpts, search trails, or link dumps.

## Output

Write the slice plan to the current slice's `plan.md`:

```text
strike/initiatives/<initiative-id>/phases/<phase-id>/slices/<slice-id>/plan.md
```

Use this shape:

```md
# Slice Plan

## Initiative Research Used

## Supporting Artifacts Used

## Research Used

## Implementation Research Additions

## Repo Context / Impact Scan
Implementation discipline guidance:
Surrounding and related code:
Upstream inputs:
Downstream consumers:
Existing utilities or shared patterns:
Similar repo precedent:
New shared code placement:

## Repo Pattern Scan
Work categories:
Existing examples reviewed:
Chosen precedents:
Pattern decisions:
- UI / component:
- Routing / API:
- Networking / provider integration:
- Async workflow / job / queue:
- Data model / persistence:
- Upload / file / asset storage:
- Validation / error handling:
- Auth / permissions / ownership:
- Testing / E2E / browser verification:
Intentional differences:

## Slice Boundary
Outcome:
Acceptance criteria covered:
Depends on:
In scope:
Out of scope:

## Surfaces
-

## Approach

## Edge Cases

## Verification Evidence Plan
### Static / Build Checks
Required: yes / no
Environment:
Commands/checks:
Reason:

### Unit / Component / Integration Tests
Required: yes / no
Environment:
Tests to add/update:
Focused commands:
Reason:

### E2E Tests
Required: yes / no
Environment:
Specs to add/update:
Focused commands:
Fixtures/data setup:
Skip/not-applicable reason:

### Browser Clickthrough
Required: yes / no
Environment:
DB/runtime:
Route/page:
Representative data:
Controls/actions:
Expected states/results:

### Visual Evidence
Required: yes / no
Environment:
Screenshots:
Viewports:
Reason:

### Skipped / Not Applicable
-

## Verification

## Risks / Rollback

## Open Questions

## Split Recommendation
Needed: yes / no
Reason:
Replacement slices:
- None.
```

## Rules

- Create one implementation plan.
- Read and use the slice research artifact when provided.
- Do not plan around unresolved research blockers.
- Keep coding out of the plan.
- Prefer the smallest complete implementation path.
- Do not create new utilities, helpers, adapters, or shared modules without
  first checking whether the repo already has the needed home or behavior.
- If the slice must modify existing shared code, name likely callers or
  downstream consumers and how the build should protect them.
- Do not write the implementation approach until `Repo Pattern Scan` classifies
  the work and records existing examples or credible no-example findings for the
  relevant categories.
- Use the repo's existing structure for matching UI, routing/API, networking,
  provider integration, workflow/job/queue, data/persistence, file/storage,
  validation/error, auth/permission, and testing patterns unless there is a clear
  reason to differ.
- If `Split Recommendation` says `Needed: yes`, do not present the plan as
  build-ready. Name the replacement slices clearly enough that Strike can
  edit the current slice into the first smaller slice, create any extra slice
  stubs, and register them with `add-slice`.
- Use existing repo conventions before inventing new structure.
- Do not treat an integration, provider, workflow, upload, asset, storage, queue,
  job, callback, webhook, or dataflow problem as novel until you have searched
  the codebase for similar implementations and recorded the closest precedent.
- Keep the plan specific enough that another agent can build from it without
  guessing.
- Prefer stable repo paths, commands, constraints, and current evidence over
  restating earlier artifacts.
- If the plan cannot name likely surfaces, verification checks, important edge
  cases, and unresolved assumptions, tighten it before calling it build-ready.
- Use `Verification Evidence Plan` categories from
  `references/verification-evidence.md`; do not collapse them into one generic
  "test" bucket.
- Do not default to a full test suite. Name focused tests and commands for the
  changed surface. Use a full suite only when it is cheap, repo-standard for the
  touched surface, or specifically justified by the risk.
- For browser-visible work, plan Browser Clickthrough and Visual Evidence with
  the actual route, representative data, controls/actions, expected states, and
  screenshots. Logging in, navigating to a route shell, or inspecting DOM is not
  enough.
- Browser Clickthrough does not replace relevant automated tests, and automated
  tests do not replace Browser Clickthrough.
- Do not plan to switch environments to make verification easier. Unit,
  component, integration, and E2E tests should use the repo's test/E2E
  environment. Browser Clickthrough should use the dev/local app environment.
  If repo instructions or the user require a different environment, record that
  requirement and its effect on confidence.
- If the dev/local environment blocks Browser Clickthrough because of schema
  drift, missing migrations, missing services, or seed data problems, plan the
  repair or route-back instead of treating a test environment clickthrough as
  equivalent proof.
- Require E2E tests when the repo already has E2E infrastructure and the slice
  changes an important user workflow, auth or permission boundary, persistence
  path, cross-page flow, regression-prone interaction, or business-critical path.
  Otherwise record a concrete skip or not-applicable reason.
