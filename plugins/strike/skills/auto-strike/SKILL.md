---
name: auto-strike
description: Turn an idea into a working MVP with a standalone Auto Strike workspace.
argument-hint: "[idea]"
disable-model-invocation: true
allowed-tools: Read Write Edit MultiEdit Bash Grep Glob WebFetch WebSearch Agent
---

# Auto Strike

Use this skill to move a fuzzy idea toward a shipped feature or MVP in any repo.
It borrows the highest-value Strike habits without using the normal Strike
board/card workflow. From a cold start, create the root `auto-strike/`
workspace and grow it from there.

## Boundaries

- This skill is user-invoked only.
- This skill does not use `docs/strike/`, Strike board pointers, Strike cards,
  or handoffs to other Strike skills.
- This skill creates and maintains a standalone root `auto-strike/` workspace in
  the consuming repo.
- The user only needs to invoke `auto-strike` and provide the idea; this skill
  owns the docs, questions, recommendations, planning, build, review, and
  verification loop.

## Host Invocation

When showing future prompts, use the plugin package's `references/invocation.md`
to render the current host's syntax. Do not copy host-specific command examples
unchanged unless they match the active host. When the host is unknown, show the
skill name and arguments as a plain next action.

Normal kickoff:

```text
auto-strike [idea]
```

Durable goal kickoff:

```text
Use the auto-strike skill to help build my idea: [idea].
```

Example idea:

```text
auto-strike Build an MVP web app where a user can upload a video, extract the
content, and re-edit it into something funny. This is the basic idea.
```

## Reference Loading

Do not load every reference file by default. Read only the references needed for
the current work, but always read the required one before doing material work in
that area.

Use this map:

- Cold start, resume, repeated run, doc restructuring, or any workspace write:
  read `references/workspace.md`.
- Research, standards, stack docs, domain modeling, architecture options,
  compliance, security, privacy, cost, or blast-radius decisions: read
  `references/research.md`.
- Spec, slice, build, review, readiness, dependencies, env/secrets, data
  integrity, observability, tests, UI quality, or implementation edits: read
  `references/code-quality.md`.
- Brainstorm, grill, spec, slice, build, readiness, user steering, or MVP done
  criteria: read `references/flow.md`.

If a task crosses areas, read the small set of relevant references. For example,
first implementation in a new repo normally needs `workspace.md`,
`code-quality.md`, and the relevant part of `flow.md`; stack/domain uncertainty
also needs `research.md`.

## Internal Workspace Helper

When available, use the skill-local read-only helper at
`scripts/auto-strike.mjs`, resolved relative to this skill folder, to audit
workspace state. The helper is for agent use; the user should not need to know
it exists unless it fails or its output matters to a decision.

Use it as a guardrail, not as the workflow engine:

- Run `inspect` on cold start, resume, or before writing Auto Strike workspace
  state. Use the result to see observed docs, declared mode, active feature,
  open decisions, evidence locations, and known verification commands.
- Run `validate` before claiming done, readiness, or a clean handoff. Treat
  errors as hard facts to resolve or ask about. Treat warnings and notes as
  prompts for main-agent judgment, not automatic blockers.
- Run `review-context --lens <lens>` before parallel review when a compact
  packet would help reviewers focus. Before generating reviewer packets, record
  compact slice evidence with `Changed:` and `Verified:` sections so reviewers
  get the implementation files and checks, not only planning docs. The main
  agent still dispatches reviewers, evaluates findings, decides what is
  blocking, and owns final synthesis. Review packets prefer active-slice
  evidence, then active-feature evidence, and use broader workspace evidence
  only as a fallback.

Do not use helper output to replace product judgment. The helper must not decide
scope, create features, create slices, advance modes, choose the next action, or
force a full document tree. If the helper is unavailable or inconclusive, perform
the same assessment manually from `auto-strike/`.

## Operating Contract

Drive toward the smallest useful feature or MVP as quickly as quality allows.

- Be opinionated when the repo, product shape, or engineering tradeoff gives a
  clear answer. Present the recommendation and why it is the best path.
- Ask one consequential question at a time. Do not hand the user a long survey.
- Inspect code and docs before asking questions the repo can answer.
- Keep the user involved for intent, tradeoffs, scope, taste, business rules,
  and hard-to-reverse choices.
- Move backward when needed. Brainstorm again, reopen a decision, update the
  spec, or reslice if implementation proves the current plan wrong.
- Keep docs current as source of truth, not ceremony. Save decisions, refined
  scope, research findings, and progress as they happen; do not wait until the
  end of a long conversation.
- Do not pre-create a large document tree. Add files only when the work needs
  them.
- Build, verify, review, and fix in loops until the stopping condition is met or
  a real blocker needs the user.
- Keep the workspace resumable. A fresh context should be able to read
  `auto-strike/` and understand the product, current decisions, active feature,
  progress, blockers, next best action, and any docs that need sync.
- Use subagents only when parallel review or research clearly helps. Multiple
  review agents can run at once when they have distinct lenses such as edge
  cases, user flows, spec coverage, functionality, code quality, or risky
  integrations. Review agents return findings to the main agent; the main agent
  owns synthesis, evaluation, fixes, docs, and the final user-facing answer.
- The user should not need to understand the workflow mechanics. Give short,
  plain-language progress updates that say what was clarified, what was saved,
  what risk or decision is next, and how it moves the MVP forward. Avoid
  repeating stock encouragement or exposing internal phase names unless they help
  the user make a decision.

## Decision Autonomy

Default to moving. Do not ask the user to decide things the repo, common product
patterns, current docs, or a low-risk reversible choice can answer.

Make the decision and record it when:

- the choice is local, reversible, or easy to change later
- the repo already has a clear pattern
- current official docs show an idiomatic path
- the decision only affects internal code organization
- a sensible MVP default is obvious

Ask one question when:

- the choice defines or renames core domain language, schema/model shape,
  relationships, lifecycle states, ownership rules, permissions, or invariants.
  Treat these as user-involved decisions even when the agent has a strong
  recommendation.
- the choice changes the product promise, business rule, pricing, permissions,
  privacy, legal/compliance posture, user-facing workflow, data retention,
  destructive behavior, or hard-to-reverse architecture
- multiple reasonable options have meaningfully different user or business
  outcomes
- guessing would create rework, risk, or misleading behavior

For schema, language, and domain modeling, bring a recommendation first, then ask
for confirmation or the smallest clarifying decision.

When making an autonomous decision, briefly record the choice, why it is safe,
and when to revisit it in `decisions.md`, the active spec, slice plan, or
evidence note.

## Path Selection

At the start of every run, choose the lightest path that can still produce safe,
verified work. The path can change if discovery shows the work is simpler,
larger, or riskier than expected.

- Tiny Change Path: narrow, low-risk edits to existing behavior, copy, layout,
  styling, or a small bug fix.
- Fast Path: small-to-medium MVP or feature work where the core product shape is
  clear enough to spec, slice, build, verify, and review quickly.
- Large Scope Path: work spanning multiple workflows, roles, integrations, data
  models, risky shared surfaces, or many slices.

Do not make the user choose the path unless the tradeoff changes product scope,
risk, timeline, or quality. Pick the path, explain the recommendation briefly,
and keep moving.

Switch paths as soon as discovery shows the first choice is wrong:

- Tiny -> Fast: the change needs a product decision, new behavior, new state,
  multiple surfaces, or non-trivial verification.
- Tiny/Fast -> Large: the work spans multiple workflows, roles, integrations,
  data models, risky shared surfaces, migrations, or many slices.
- Large -> Fast: the MVP can be cut to one clear milestone with a few vertical
  slices.
- Fast -> Tiny: the request is actually a narrow edit to existing behavior with
  low blast radius.

Do not switch to Tiny or Fast only because the active slice is small. A small
slice can still belong to Large Scope when the surrounding feature spans multiple
workflows, roles, integrations, data models, risky shared surfaces, migrations,
or many slices. Use the lighter path only when the overall work context has
actually become simpler or lower risk.

When switching, update `auto-strike/index.md` and `todo.md` with the new path,
why it changed, and the next best action. Do not ask the user to approve a path
switch unless it changes scope, timeline, risk, or product behavior.

## Repo Discovery Pass

Before planning or editing, inspect the repo enough to stop guessing. Scale the
scan to the selected path.

For Tiny Change, inspect only the changed route/component/file, nearby patterns,
available scripts/checks, and existing `auto-strike/` state.

For Fast Path, identify the app stack, package manager, run/test/build scripts,
main routes or entry points, relevant components/modules, data/auth/integration
surfaces, existing docs, and likely verification commands.

For greenfield or thin repos, first determine whether the repo already implies a
stack through files, docs, or package metadata. If it does, follow that stack. If
it does not, recommend the smallest appropriate default for the requested MVP,
explain the tradeoff briefly, and ask before installing dependencies or changing
lockfiles. When dependency approval is unavailable, build the best useful
no-install prototype or documented scaffold the repo can support, and record the
approval needed to continue.

For Large Scope, also map major domains, workflows, architecture boundaries,
shared utilities/adapters, models/schema, permissions, background jobs, external
services, risky shared surfaces, and current test coverage.

Save only decision-useful findings in `auto-strike/index.md`, the active feature
spec, slice plan, or evidence note. Do not turn repo discovery into a file
inventory.

## Fast Path

For most MVPs, use this route unless the idea is large in scope, risky,
regulated, highly technical, or blocked by missing decisions. When the fast path
does not fit, slow down only as much as needed: do deeper research, write the
missing spec/model/architecture docs, split into more slices, or ask the next
blocking question.

1. Create or update `auto-strike/`.
2. Understand the idea and ask one first-outcome question only if needed.
3. Save the current truth in `index.md`, `todo.md`, `language.md`,
   `decisions.md`, and the active feature `idea.md`.
4. Do focused research when it can change the next decision, reveal a relevant
   domain or industry standard, show the idiomatic way to use the current stack,
   or prevent a bad build.
5. Write one compact spec.
6. Create 1-3 vertical slices.
7. Build the first complete, production-shaped behavior path before expanding:
   real UI, real validation, real state handling, real errors, and the simplest
   safe persistence or integration path the MVP requires.
8. Review against the spec, slice, verification, and code quality checklist.
9. Fix blockers, update docs, and continue until the MVP works or a named
   decision blocks progress.

## Tiny Change Path

Use this for narrow, low-risk changes such as copy, layout, styling, a small bug
fix, or a single existing workflow adjustment. Compress documentation, not
quality.

Required loop:

1. Inspect the relevant repo surfaces, existing patterns, and current
   `auto-strike/` state if present.
2. Confirm the change is truly narrow: small blast radius, no unclear product
   decision, no risky data/auth/payment/upload/integration surface.
3. Write only the minimum plan needed to avoid guessing. This may be a few
   checklist items in `auto-strike/todo.md` instead of a full spec and slice.
4. Implement the smallest coherent change.
5. Verify the behavior that changed. For UI work, run a browser or visual check
   when feasible. Run focused tests/build/lint when risk or repo norms call for
   them.
6. Review against user intent, changed surfaces, edge cases, accessibility or
   responsive behavior when relevant, and the code quality checklist.
7. Fix blocking findings, rerun affected checks, and record changed files,
   evidence, skipped checks with reasons, and next action.

Escalate to Fast Path or Large Scope if the change touches data models, auth,
permissions, payments, uploads, migrations, external integrations, multiple
workflows, unclear product decisions, or broad shared code.

## Large Scope Path

Use this when the idea spans multiple workflows, roles, integrations, data
models, risky shared surfaces, or many implementation slices. Add structure only
where it creates speed, safety, or resumability.

Required loop:

1. Build the workspace map first: active goal, repo shape, existing docs, current
   decisions, known risks, likely feature folders, and verification commands.
2. Do focused research before locking major model, architecture, dependency,
   security, privacy, cost, or integration decisions.
3. Create a milestone queue with the smallest useful MVP milestone first.
4. Keep only one active slice in build at a time unless independent work can be
   safely parallelized.
5. For each milestone, write only the specs, model notes, architecture notes, and
   slices needed to build without guessing.
6. Use subagents selectively for independent research, codebase mapping, or
   review of risky surfaces. Multiple review agents may run in parallel when
   they cover different lenses. Have them return findings to the main agent for
   synthesis and evaluation before changing scope, code, or docs.
7. After each slice, run verification, review against the code quality checklist,
   fix blockers, and update `index.md`, `todo.md`, decisions, and slice evidence.
8. Periodically re-cut scope into MVP now, Soon, Later, and Ask first so the work
   does not expand silently.

Do not let a large scope become a large batch. Keep implementation moving through
small vertical slices with real verification evidence.

## Scope Discipline

Default to the smallest real product that proves the core value. When an idea
contains multiple features, roles, integrations, dashboards, automations, or
edge cases, separate them into:

- MVP now: required for the first useful behavior path.
- Soon: likely next slice after the MVP works.
- Later: valuable but not needed to prove the core value.
- Ask first: hard-to-reverse, expensive, risky, regulated, or
  architecture-shaping.

Do not silently include Soon or Later work in the current slice. Capture it in
`todo.md`, `spec.md`, or `mvp-cut.md`, then keep building the MVP.

## Process Summary

Use `references/flow.md` for details. The short version:

- Brainstorm turns the raw idea into a clearer opportunity.
- Grill pressure-tests the idea until consequential decisions are clear.
- Spec writes the durable source of truth for product behavior, boundaries,
  success checks, risks, and build constraints.
- Slice splits the spec into small vertical implementation paths.
- Edge Case Pass identifies important inputs, states, permissions, data,
  integration, UI, and operational cases to build, verify, defer, or ask about.
- User Flow Validation checks representative normal, resumed, invalid, recovery,
  role-based, and system flows against the spec, slices, tests, browser checks,
  or accepted MVP limits.
- Build implements one complete slice at a time, records evidence, reviews,
  fixes blockers, and repeats.
- Readiness checks the assembled MVP against the spec, code quality bar,
  verification evidence, and live/human checks.

## Research Summary

Use `references/research.md` before research or standards-sensitive decisions.
Research should be the smallest pass that can change a decision, reveal a
domain/industry standard, show the idiomatic current-stack approach, identify
blast radius, or prevent a bad build. Use Standards Before Bespoke when mature
platforms, public docs, industry practices, or trusted references can prevent
inventing fragile domain rules.

## Code Quality Summary

Use `references/code-quality.md` before spec/slice/build/review/readiness work
and before editing implementation files. Start organized because early code
becomes the model's anchor. Keep concern boundaries clear, avoid vague utility
buckets, check dependencies and env/secrets, validate data boundaries, preserve
observability, verify important behavior, and keep changes scoped. Use the
verification matrix to choose checks by changed surface. For UI work, run browser
or visual checks when feasible.

## Workspace Summary

Use `references/workspace.md` before creating or updating Auto Strike docs.
The root workspace is `auto-strike/`. It should be resumable from fresh context,
with `index.md` as the map, `todo.md` as an operational checklist,
`language.md` as the shared glossary, and `decisions.md` as current truth.

## Completion Standard

An MVP is done when the user can run or open it with documented steps, the core
happy path works end to end, expected failures have useful errors or recovery,
required validation/state/persistence/integrations are real, repo-verifiable
checks pass or skips are explained, representative user/system flows pass or
documented gaps are accepted, required human/live checks are listed, and
`auto-strike/` reflects the final state and next best action.

If blocked, state the exact blocker, the decision or external change needed, and
the next action after it is resolved. If repeatedly looping on the same issue
without likely progress, stop and explain the blocker clearly.

## Output

Keep responses short and user-facing. Report:

- what changed or was clarified
- which Auto Strike docs were created or updated
- what was built or verified, when code changed
- blockers, human/live checks, or skipped checks with reasons
- the next best action

Do not show raw workflow mechanics. Do not route to normal Strike board/card
skills. If continuing later would help, show the current host's `auto-strike`
prompt form using `references/invocation.md`.
