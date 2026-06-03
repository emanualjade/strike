---
name: plan-slice
description: Create a clear, complete implementation plan for one slice from its slice stub, phase spec, research, and relevant repo context.
argument-hint: "[slice/context]"
disable-model-invocation: true
allowed-tools: Read Write Edit Grep Glob WebFetch WebSearch
---

# Plan Slice

Create a solid, accurate, complete development plan for one slice.

## Inputs

- slice stub or slice context
- slice research from the current slice's `research.md`
- phase spec
- initiative research index, relevant reports, and relevant audits when they
  affect this slice
- supporting artifacts relevant to this slice, when present
- shared verification evidence taxonomy from the Strike plugin root's
  `references/verification-evidence.md`
- user implementation guidance from
  `strike/user-guidance/implementation-discipline/global.md` and
  `strike/user-guidance/implementation-discipline/plan-slice.md`
- optional main spec, decisions, or repo context

## Planning Dialogue

Create a solid, accurate, complete development plan for this slice.

Look for existing patterns related to what we are building. Explore them and use
the good ones.

Consider higher-level abstractions deeply by taking at least 2 distinct steps
back and considering the new perspectives. Only choose a higher-level
abstraction when it simplifies the actual implementation and fits existing repo
patterns.

Ensure what you are planning for is complete. Do not plan only the easiest or
most visible part of the slice. Think through the full accepted outcome, hidden
supporting work, edge cases, and verification needed to prove the slice is done.

Think about the feature as a complete system. Consider frontend, backend/API,
state, data, schema, jobs, files/storage, auth, permissions, integrations, tests,
browser flows, shared utilities, and adjacent features where relevant.

Consider blast radius. Think about what this implementation could affect outside
the obvious files: adjacent features, shared code, data flow, user workflows,
tests, integrations, and existing assumptions. Explain how the plan protects
those things.

Code around here should be clean, simple, organized, easy to understand,
maintainable, robust, accurate, and secure. These are table-stakes requirements.

Explain the plan clearly so the reader can understand what will be built, why
this approach is correct, what codebase patterns it follows, what it may affect,
and how it will be verified.

## Planning Work

- Read the slice stub, phase spec, slice research, relevant initiative research
  reports and audits, relevant supporting artifacts, and relevant spec context.
- Read the bundled `references/verification-evidence.md` from the Strike plugin
  root.
- Read `strike/user-guidance/implementation-discipline/global.md` and
  `strike/user-guidance/implementation-discipline/plan-slice.md` if they exist.
- If slice research says `Ready for planning: no`, do not plan; surface the
  blocker or unresolved decision.
- Use initiative research as inherited constraints. Do not plan behavior that
  contradicts provider/model/API/database/file/queue constraints recorded before
  Grill. Treat passing or accepted-risk initiative research as baseline evidence,
  and read the relevant per-item report and audit before adding new tactical
  research.
- If `supporting-artifacts/` exists, scan it and read only files relevant to this
  slice. Use them to understand schema reasoning, architecture tradeoffs,
  provider routing, data lifecycle, permissions, or operational constraints.
- Inspect local repo patterns before planning edits. Look at surrounding code,
  related upstream inputs, downstream consumers, existing utilities or helpers,
  and similar implementations.
- For integration, provider, workflow, upload, asset, storage, queue, job,
  callback, webhook, or dataflow work, search for existing repo examples of the
  same class of problem before proposing a new pattern. Name the precedent or
  record where you looked and why no close precedent exists.
- Use the core noun before qualifiers lens when the plan names domain concepts,
  files, types, routes, or schema shape. If adjective-noun siblings appear, ask
  whether the qualifier belongs as a field, enum, state, permission,
  relationship, ownership, placement, or usage context.
- Do tactical research as needed when planning reveals a detail that affects
  implementation, verification, or risk. Prefer official or primary sources when
  the fact is external, current, or high-stakes. Do not paste raw notes, long
  excerpts, search trails, or link dumps.
- Ask one consequential question if a missing decision changes behavior, risk, or
  implementation shape.
- Before writing the plan, check whether the slice is cohesive and verifiable in
  one focused build loop. If the likely plan has independent behaviors, unclear
  verification, weak cohesion, or broad-stack work that can be separated without
  creating fake work, do not write a bloated plan. Write a split recommendation
  instead of a build-ready plan.

## Output

Write the slice plan to the current slice's `plan.md`:

```text
strike/initiatives/<initiative-id>/phases/<phase-id>/slices/<slice-id>/plan.md
```

Use this shape. Keep it concise, but do not omit real reasoning just to make the
artifact shorter.

```md
# Slice Plan

## Development Plan
Explain what will be built, how it will be built, and the order of work. Name
likely files, surfaces, important sequencing, and any small code-shaped details
that clarify the plan.

## Research And Artifacts Used
Name the slice research, relevant initiative research, audits, supporting
artifacts, and user guidance that shaped this plan. If no new research was
needed, say why.

## Codebase Patterns
Name the existing files, flows, helpers, utilities, data shapes, routes,
components, tests, or implementation patterns inspected. Explain which patterns
will be reused, which are intentionally not used, and why.

## System Touchpoints
Cover the relevant surfaces: UI, API, state/data, schema, jobs/queues,
files/storage, auth/permissions, integrations, tests, browser flows, shared
utilities, and adjacent features. Do not list irrelevant surfaces just to fill
space.

## Blast Radius
Explain what could be affected outside the immediate slice and how the plan
protects those areas.

## Verification Plan
Name the static/build checks, focused unit/component/integration tests, E2E
tests, Browser Clickthrough, Visual Evidence, and skipped/not-applicable checks
with concrete reasons. Keep automated tests in the repo's test/E2E environment
and Browser Clickthrough in the dev/local app environment unless repo
instructions or the user explicitly require otherwise.

## Why This Plan
Explain why this plan is complete, clean, simple, maintainable, robust,
accurate, secure, and not over-engineered.

## Open Questions
- None.

## Split Recommendation
Needed: yes / no
Reason:
Replacement slices:
- None.
```

## Rules

- Create one implementation plan.
- Do not edit implementation files during this step. This is planning, not
  building.
- It is fine to include small code snippets, schema shapes, type sketches, route
  examples, or pseudocode when they clarify the implementation plan. Do not write
  a full implementation in the plan or let code snippets replace explanation.
- Read and use the slice research artifact when provided.
- Do not plan around unresolved research blockers.
- Prefer the smallest complete implementation path.
- Use existing repo conventions before inventing new structure.
- Do not paste raw notes, long excerpts, search trails, or link dumps into the
  plan.
- Do not create new utilities, helpers, adapters, or shared modules without first
  checking whether the repo already has the needed home or behavior.
- If the slice must modify existing shared code, name likely callers or
  downstream consumers and how the build should protect them.
- Do not treat an integration, provider, workflow, upload, asset, storage, queue,
  job, callback, webhook, or dataflow problem as novel until you have searched
  the codebase for similar implementations and recorded the closest precedent.
- Keep the plan specific enough that another agent can build from it without
  guessing.
- Prefer stable repo paths, commands, constraints, and current evidence over
  restating earlier artifacts.
- If the plan cannot name likely surfaces, verification checks, important edge
  cases, blast radius, and unresolved assumptions, tighten it before calling it build-ready.
- Use verification categories from `references/verification-evidence.md`; do not
  collapse them into one generic "test" bucket.
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
- If `Split Recommendation` says `Needed: yes`, do not present the plan as
  build-ready. Name the replacement slices clearly enough that Strike can edit the current slice into the first smaller slice, create any extra slice stubs,
  and register them with `add-slice`.
