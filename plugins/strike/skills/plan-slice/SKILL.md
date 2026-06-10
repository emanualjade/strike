---
name: plan-slice
description: Create a clear, complete implementation plan for one slice from its slice stub, phase spec, audited phase research, and relevant repo context.
argument-hint: "[slice/context]"
disable-model-invocation: true
allowed-tools: Read Write Edit Grep Glob WebFetch WebSearch
---

# Plan Slice

Create a solid, accurate, complete development plan for one slice.

## Inputs

- slice stub or slice context
- phase spec
- phase research from the current phase's `research.md`
- phase research audit from the current phase's `research-audit.md`
- initiative research index, relevant reports, and relevant audits when they
  affect this slice
- supporting artifacts relevant to this slice, when present
- shared verification evidence taxonomy from the Strike plugin root's
  `references/verification-evidence.md`
- shared slice-boundary standard from the Strike plugin root's
  `references/slice-boundaries.md`
- Required user-provided customization from the consuming repo's Strike
  workspace:
  - user implementation-discipline guidance:
    - `strike/user-guidance/implementation-discipline/global.md`
    - `strike/user-guidance/implementation-discipline/plan-slice.md`
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

- Read the slice stub, phase spec, phase research, phase research audit,
  relevant initiative research reports and audits, relevant supporting artifacts,
  and relevant spec context.
- Read the bundled `references/verification-evidence.md` from the Strike plugin
  root.
- Read the bundled `references/slice-boundaries.md` from the Strike plugin root.
- Read required user-provided customization:
  - `strike/user-guidance/implementation-discipline/global.md`
  - `strike/user-guidance/implementation-discipline/plan-slice.md`
- If phase research says `Ready for slicing: no`, do not plan; surface the
  blocker or route back to `phaseResearchComplete`.
- If phase `research-audit.md` does not show all required audit fields, do not
  plan; route back to `phaseResearchComplete`. Required fields are:
  `Review results returned: yes`, `Verdict: pass` or
  `Verdict: accepted-risk`, and `Must Fix count: 0`.
- Use initiative research as inherited constraints. Do not plan behavior that
  contradicts provider/model/API/database/file/queue constraints recorded before
  Grill. Treat passing or accepted-risk initiative research as baseline evidence,
  and read the relevant per-item report and audit before adding new tactical
  research.
- Use phase research and its audit as the inherited implementation baseline for
  this slice. Do not redo official/provider/repo research covered by audited
  phase research.
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
- Do narrow tactical research as needed when planning reveals a slice-specific
  detail that the research library at `strike/research/`, initiative research,
  and phase research do not cover. Prefer official or
  primary sources when the fact is external, current, or high-stakes. Record the
  delta in the plan, and write durable findings back to the library per the
  plugin root's `references/research-library.md`; do not paste raw notes, long
  excerpts, search trails, or link dumps.
- If the missing fact affects multiple slices, phase boundaries, provider/model
  viability, repo architecture, data modeling, file/blob/job flow, auth,
  permissions, or verification strategy, do not bury it as a slice-specific
  research delta. Write a route-back to `phaseResearchComplete`.
- Ask one consequential question if a missing decision changes behavior, risk, or
  implementation shape.
- Work from the accepted slice boundary and the standard in
  `references/slice-boundaries.md`. If planning reveals that a clean, complete
  implementation needs a different boundary, write a boundary recommendation
  with the specific evidence: `split` when the slice bundles independent
  outcomes or verification stories, `merge` when this slice and a later
  unstarted slice are one capability with one verification story. Merge only
  absorbs later slices with no completed checks; never merge into completed
  work.
- Declare the plan verification tier from what this plan actually touches.
  Answer each trigger honestly:
  - `Third-party surface`: any third-party API, package, SDK, framework
    feature, or provider/model.
  - `Solved domain`: a mature solved domain such as payments, refunds,
    discounts, billing, accounting, taxes, auth, sessions, or permissions.
  - `Schema or data risk`: schema, migrations, persistence shape, or
    destructive data operations.
  - `Novel pattern`: an implementation pattern with no close repo precedent.
  - `Planner uncertainty`: open questions, boundary concerns, or material
    uncertainty about the approach.
  Any `yes` requires `Tier: deep`, and `verify-slice-plan` runs in full.
  `Tier: standard` is valid only when every trigger is honestly `no`; Strike
  then completes `planVerified` from this declaration and building starts
  directly, while `verify-slice-build` still verifies everything against the
  real code. When unsure about any trigger, answer `yes`.
- If planning finds unplanned enabling work that directly blocks this slice,
  keep the workflow moving at the smallest appropriate level. Plan a small,
  local, low-risk enabling repair inside the current slice when it only makes
  the planned slice possible and creates no new product outcome. If the enabling
  work is larger, uncertain, security-sensitive, a meaningful dependency or
  toolchain change, or deserves its own planning and verification, use a
  `split` boundary recommendation to make the enabling work its own slice
  before the original slice.

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
Name the phase research, phase research audit, relevant initiative research,
audits, supporting artifacts, user guidance, and any slice-specific research
delta that shaped this plan. If no new slice-specific research was needed, say
why.

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

## Plan Verification Tier
Tier: standard / deep
Third-party surface: yes / no
Solved domain: yes / no
Schema or data risk: yes / no
Novel pattern: yes / no
Planner uncertainty: yes / no
Reason:

## Route Back
Needed: yes / no
Command: None / reopen-phase-check / reopen-check
Phase: None / <phase-id>
Slice: None / <slice-id>
Check: None / phaseResearchComplete / slicesCreated / planCreated
Reason:

## Boundary Recommendation
Needed: yes / no
Type: None / split / merge
Reason:
Replacement slices:
- None.
Absorbed slices:
- None.
```

## Rules

- Create one implementation plan.
- Do not edit implementation files during this step. This is planning, not
  building.
- It is fine to include small code snippets, schema shapes, type sketches, route
  examples, or pseudocode when they clarify the implementation plan. Do not write
  a full implementation in the plan or let code snippets replace explanation.
- Read and use phase research and its audit.
- Do not plan around unresolved phase research blockers.
- Use initiative research and audited phase research as inherited baseline
  evidence. Add only narrow slice-specific research deltas when the slice needs a
  fact that those artifacts do not cover.
- Prefer the most direct complete implementation path that satisfies the slice's
  accepted capability, follows existing repo patterns, and avoids unnecessary
  scope.
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
- If a material research gap belongs to the phase rather than this slice, route
  back to `phaseResearchComplete` instead of guessing.
- Declare the verification tier honestly; it decides whether
  `verify-slice-plan` runs. A misdeclared `standard` tier surfaces at build
  verification and routes the slice back here. Open questions or a boundary
  recommendation always mean `Planner uncertainty: yes` and `Tier: deep`.
- Use verification categories from `references/verification-evidence.md`; do not
  collapse them into one generic "test" bucket.
- Do not default to a full test suite. Name focused tests and commands for the
  changed surface. Use a full suite only when it is cheap, repo-standard for the
  touched surface, or specifically justified by the risk.
- For browser-visible work, plan Browser Clickthrough and Visual Evidence with
  the actual route, representative data, controls/actions, expected states, and
  screenshots. Logging in, navigating to a route shell, or inspecting DOM is not
  enough.
- For browser-visible work, plan proportionate Browser Clickthrough or Visual
  Evidence for the behavior the current slice makes usable. When the current
  slice only prepares UI that becomes usable in a near-term later slice, record
  the limited evidence this slice can provide and name the later integrated
  clickthrough that must cover it.
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
- If `Boundary Recommendation` says `Needed: yes`, write the artifact as a
  boundary update instead of a build-ready plan. For `Type: split`, name the
  replacement slices clearly enough that Strike can edit the current slice into
  the first replacement slice, create any extra slice stubs, and register them
  with `add-slice`. For `Type: merge`, name the absorbed later slices clearly
  enough that Strike can fold their stubs into the current slice's `slice.md`,
  unregister them with `remove-slice`, and delete their slice directories;
  absorb only later slices with no completed checks. Set `Route Back` to the
  exact helper command Strike should run after applying the local boundary
  change, usually `reopen-check planCreated`. Use
  `reopen-phase-check <phase-id> slicesCreated` only when the phase's whole
  slice list must be regenerated instead of adjusting the active slice from this
  plan. Use `reopen-phase-check <phase-id> phaseResearchComplete` when phase
  research must be repaired.
