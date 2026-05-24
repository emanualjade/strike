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

## Kickoff

Auto Strike works as a normal skill invocation or inside a durable goal. The
user only needs to invoke `auto-strike` and provide the idea; this skill owns the
workspace, docs, questions, recommendations, planning, build, and verification
loop.

## Host Invocation

This skill is user-invoked only. It is independent from the normal Strike
board/card workflow and does not hand off to other Strike skills.

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

## Operating Contract

Drive toward the smallest useful feature or MVP as quickly as quality allows.

- Be opinionated when the repo, product shape, or engineering tradeoff gives a
  clear answer. Present the recommendation and why it is the best path.
- When a domain has known standards or common traps, do focused research before
  locking in the model or workflow. For example: commerce, taxes, billing,
  subscriptions, refunds, accounting, auth, permissions, healthcare, legal,
  scheduling, file uploads, media processing, AI generation, privacy, security,
  or data retention. If the user is heading toward a bespoke path where a
  standard pattern would reduce risk, explain the tradeoff and recommend the
  standard path.
- Ask one consequential question at a time. Do not hand the user a long survey.
- Inspect code and docs before asking questions the repo can answer.
- When the repo has little or no structure, create the Auto Strike workspace
  first and start from the idea.
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
- Use subagents only when parallel review or research clearly helps, such as
  checking a major decision across multiple planning docs or independent code
  surfaces.
- The user should not need to understand the workflow mechanics. Give short,
  plain-language progress updates that say what was clarified, what was saved,
  what risk or decision is next, and how it moves the MVP forward. Avoid
  repeating stock encouragement or exposing internal phase names unless they help
  the user make a decision.

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

## MVP Scope Discipline

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

## Research And Planning Discipline

Research when the answer can change scope, architecture, implementation strategy,
verification, cost, UX, security, privacy, or blast radius. Use the smallest
research pass that can produce a defensible recommendation, reveal a standard or
idiomatic pattern, name the risk, or identify the blocker.

For third-party frameworks, APIs, SDKs, CLIs, auth, payments, uploads, video,
AI services, databases, queues, deployment platforms, accessibility, security,
or browser behavior, check current official docs before making binding decisions
or writing code. Prefer the idiomatic path for the actual version in the repo.

Research at four levels:

- Idea research: check product, UX, technical, business, legal/privacy, domain,
  industry-standard, or comparable-product context only when it can change the
  MVP target.
- Domain/model research: check standards, workflows, data models, lifecycle
  rules, compliance expectations, and common traps before inventing a bespoke
  solution to a solved problem.
- Spec research: verify repo precedents, stack guidance, architecture options,
  data/model pitfalls, state/lifecycle risks, permissions, failure modes, and
  blast radius before writing durable constraints.
- Slice/plan research: before each slice build, confirm files and surfaces,
  local conventions, current docs, test/dev setup, data/auth/access boundaries,
  and the smallest safe verification path.

Record research as implications, not a diary. Good research says what changed,
why it matters, and where the evidence came from.

## Code Quality Checklist

The existing code becomes the model's anchor. Start overly organized and keep it
that way. Before the first meaningful code change in a greenfield or thin repo,
choose a simple structure and record it in the spec or first slice. Adapt to the
framework, but make concern boundaries obvious: routes/pages, UI components,
domain logic, server/API actions, data access, integrations, formatting/parsing,
validation, tests, and scripts should each have a clear home.

Use this checklist during spec planning, slice planning, phase review, and
readiness review:

- Structure: code is grouped by clear product/domain boundaries and runtime
  boundaries. UI, server actions/API, data access, business rules, adapters, and
  formatting/parsing are not casually mixed together.
- Names: files, functions, types, routes, and docs use the shared language.
  Avoid vague buckets like `helpers`, `utils`, `misc`, `common`, or `stuff`.
  Prefer purpose names such as `date-utils`, `money-display`,
  `video-transcript-parser`, or `upload-validation`.
- Core noun before qualifiers: before creating adjective-noun siblings such as
  `ManualReport` / `ScheduledReport` or `PublicAsset` / `PrivateAsset`, ask
  whether the qualifier belongs as a field, enum, state, permission,
  relationship, configuration, placement, ownership, or usage context.
- Small modules: no catch-all files, oversized components, hidden side effects,
  or scattered duplicate logic. Extract only when it creates a real stable
  boundary or removes meaningful duplication.
- Blast radius: changes touch the smallest coherent surface. Shared code,
  schemas, auth, payments, uploads, migrations, background jobs, and external
  integrations are treated as higher-risk surfaces.
- Dependencies: add third-party packages only when they clearly reduce risk or
  complexity. Check current docs, maintenance, version fit, security posture,
  and local alternatives first. Isolate vendor-specific code behind a
  purpose-named adapter when it affects auth, payments, uploads, media, AI,
  email, queues, analytics, or other replaceable integrations.
- Environment and secrets: never hardcode secrets, tokens, API keys, webhook
  secrets, or environment-specific URLs. Keep env access centralized and
  documented. Validate required env vars at startup or at the boundary where
  they are used. Update example env files or setup docs when adding new config.
- Data integrity: inputs are validated at boundaries, errors are explicit,
  state transitions are intentional, and destructive or external side effects
  are guarded.
- Observability and debugging: important failures should leave enough evidence
  to diagnose the issue without guessing. Use clear user-facing errors, useful
  server logs, structured error handling, and documented reproduction or debug
  steps for risky flows. Do not leak secrets or sensitive data in logs or UI.
- Tests/checks: important behavior, business rules, permissions, formatting,
  parsing, failure paths, and integration boundaries have focused verification
  or a documented reason they do not.
- UX quality: user-visible states include loading, empty, success, failure, and
  recovery paths when relevant. Accessibility and responsive behavior are not
  afterthoughts.
- Maintainability: future agents can find where a concern belongs without
  guessing. New patterns are documented in `auto-strike/` when they affect
  future slices.

## Review Standard

Every review pass should ask:

- Does the work match the idea, decisions, spec, slice, and current plan?
- Does the implementation satisfy the code quality checklist?
- Did the work use current official docs or local precedent where it should?
- Is the blast radius as small as practical?
- Are dependency choices, environment variables, secrets handling, vendor
  adapters, and debugging/logging paths appropriate for the risk introduced?
- Are shared utilities, adapters, data access, and domain logic named and placed
  clearly instead of scattered through UI/routes/actions?
- Are important failure paths, permissions, data integrity, accessibility, and
  user-visible states covered?
- Are tests/checks enough for the risk introduced?
- Are docs, decisions, language, slice evidence, and todo updated?

If review finds blocking issues, write plain checklist items, fix only those
items, verify again, and re-review. Do not use review as an excuse to redesign
the feature unless the current design cannot meet the spec safely.

## Change Safety

Before editing implementation files:

- Check the current worktree or file state.
- Identify the files and surfaces this slice is expected to touch.
- Do not overwrite, revert, delete, or reformat unrelated user work.
- Do not use destructive commands or broad cleanup unless the user explicitly
  asks.
- Do not commit, push, install dependencies, run migrations, or change
  production-facing config unless the user approves or the repo instructions
  clearly allow it.
- Keep changes scoped to the active slice. If a fix requires broad shared
  changes, stop and update the plan before continuing.

## Auto Strike Workspace

Auto Strike owns this root workspace. Create it when missing.

```text
auto-strike/
```

The user should not need to know which docs to create. On every run, discover
what exists, decide what is missing, and update or restructure lightly. On a
cold start, create only files that have real content now; the workspace usually
grows toward this shape:

Typical cold-start workspace:

```text
auto-strike/
  index.md
  todo.md
  language.md
  decisions.md
  features/
    <feature-slug>/
      idea.md
```

Add more files only when useful:

```text
auto-strike/
  architecture/
    architecture.md
    routes.md
    schema.md
  models/
    [concept]-model.md
  features/
    <feature-slug>/
      idea.md
      spec.md
      research.md
      mvp-cut.md
      workflows.md
      readiness.md
      slices/
        index.md
        slice-0-[name].md
```

Use `auto-strike/index.md` as the map:

- active feature and next best action
- important docs and what they contain
- current verification commands or checks
- open human decisions
- notes about any non-Auto-Strike docs that matter

Keep `index.md` short and scannable:

```md
# Auto Strike

## Active Feature
- [Feature slug/path]
- Current mode: [idea / decisions / spec / slice / build / review / readiness]
- Next best action: [one sentence]

## Project State
- [One-paragraph current truth.]

## Key Docs
- `[path]` - [what to read it for.]

## Open Decisions
- [Decision needed, or "None."]

## Verification
- [Commands/checks known so far.]
```

Use `auto-strike/todo.md` as one flat checklist:

```md
# Todo

- [ ] Clarify first useful outcome.
- [ ] Write MVP spec.
- [ ] Slice implementation.
- [ ] Build and verify slice 1.
```

Keep `todo.md` operational, not archival. It should show current work, next
actions, blockers, and accepted follow-ups. Remove or move stale items when the
spec, slices, or `mvp-cut.md` already preserve the decision.

Use `auto-strike/language.md` as the shared glossary:

```md
# Language

## [Context]

- Term: Meaning. Use in: code/docs/UI/planning. Avoid: stale aliases.
```

Keep `language.md` focused on terms that affect product behavior, user-facing
copy, code names, data models, permissions, integrations, or future planning. Do
not add every casual phrase. Merge aliases into one canonical term when
possible, and flag unresolved ambiguity instead of pretending it is settled.

Use `auto-strike/decisions.md` only for decisions that affect scope, model
shape, user behavior, data, permissions, architecture, or validation:

```md
## [Decision]

Decision: [What we chose.]
Why: [Why this is the current best answer.]
Rejected: [Important alternatives and why.]
Impacts: [Spec/scope/model/UI/API/workflow implications.]
Revisit if: [What would make this worth reopening.]
```

Keep `decisions.md` as current truth, not history. If a decision changes, update
the existing entry so the final choice is clear. Keep rejected options only when
they explain the current decision or prevent likely scope drift.

If older planning docs already exist elsewhere, either link to them from
`auto-strike/index.md` or merge the current truth into `auto-strike/`. Do not
move or rewrite large user-written docs just for neatness.

When docs disagree, prefer the newest current-truth artifact in this order:
`decisions.md` for decisions, `language.md` for terms, the active feature
`spec.md` for product/build scope, slice files for current implementation work,
and `index.md` for navigation/status. Fix contradictions as soon as they are
found.

## Flow

Treat these as flexible modes, not a rigid waterfall. Usually start with
Brainstorm, then Grill, so later work has enough shape. Jump backward or forward
when useful, keep the workspace current, and borrow a mode's best principles
when another mode surfaces the same kind of problem.

### 1. Brainstorm

Turn the raw idea into a clearer opportunity. Start with the user, maintainer,
operator, integration, or system moment, then work backward to the technology.

Find:

- who or what this is for
- the painful moment, risk, or workflow drag
- the current workaround or failure
- what would make the first version obviously useful
- constraints and first-version non-goals

Explore a few real directions when useful, then converge to a recommendation.
Challenge vague value, broad audiences, and attractive distractions.

Do light idea research when it can change the MVP target: comparable workflows,
current product expectations, difficult technical dependencies, content/legal
constraints, privacy risk, cost, or whether a key assumption is obviously false.
Save only decision-useful findings.

Save useful output in `auto-strike/features/<feature-slug>/idea.md` when the
idea is stable enough to preserve.

### 2. Grill

Pressure-test the idea until the important decisions are clear enough to write a
spec. Ask only for decisions that matter.

Good grill areas:

- affected user/system/workflow and success
- scope, non-goals, and first useful outcome
- domain language and overloaded terms
- core nouns, relationships, and model shape
- flows, lifecycle, state, and invariants
- permissions, ownership, privacy, and data integrity
- integrations, external side effects, and failure cases
- UI/API/CLI behavior when relevant
- validation evidence

When naming models or concepts, prefer the core noun before qualifiers. If the
language starts creating sibling nouns like `ManualReport` and
`ScheduledReport`, ask whether the qualifier is better as a field, enum, state,
permission, relationship, configuration, placement, or usage context.

Update `language.md` and `decisions.md` as decisions crystallize. Do not keep
contradictory history unless it explains the current choice.

### 3. Spec

Write one or more specs only when they are useful. A spec is the durable source
of truth for what is being built, not an implementation script.

Default path:

- `auto-strike/features/<feature-slug>/spec.md`
- additional specs only for genuinely separate capabilities or audiences

Useful spec shape:

```md
# [Feature/MVP] Spec

## Summary
## Who Or What This Serves
## What We Are Building
## Flows
## Scope
## Product Rules
## Domain Language
## State, Lifecycle, And Invariants
## Security, Privacy, Permissions, And Data Integrity
## Technical Constraints
## Success Checks
### Repo-Verifiable
### Live / Human
## Risks And Assumptions
## Open Questions
## Slice Handoff
```

Omit empty sections. Include "out of scope and why" so later work does not
silently expand. Split success checks into repo-verifiable checks and live or
human checks.

Do focused research before or during spec when current docs, codebase precedent,
domain pitfalls, or architecture tradeoffs can change the decision. Use primary
sources for unstable or external facts.

Before calling the spec ready, check it against the research discipline and code
quality checklist. The spec should name the expected code organization,
architecture boundaries, risky shared surfaces, and blast radius where those
choices matter. If the repo is greenfield, be more explicit: the first structure
will anchor future agents and should be clean from slice one.

Before moving from spec to slices, do a quick spec review. Check that scope,
non-goals, success checks, domain language, data/state rules, permissions,
failure paths, research implications, and code organization are clear enough to
slice without guessing. Fix obvious gaps in the spec; ask only for decisions
that would change the product or risk.

### 4. Slice

Split the spec into the smallest ordered vertical slices that leave observable,
reviewable behavior. Avoid horizontal layers unless a foundation phase genuinely
reduces risk or unlocks later behavior. Try to slice across the full range of the
stack in small slices rather than all the APIs at once then all the UI at once.

Default path:

- `auto-strike/features/<feature-slug>/slices/index.md`
- `auto-strike/features/<feature-slug>/slices/slice-0-[name].md`
- `auto-strike/features/<feature-slug>/slices/slice-1-[name].md`

Slice shape:

```md
# Slice [N]: [Name]

## Outcome
## Why This Slice Exists
## Depends On
## In Scope
## Out Of Scope
## Likely Surfaces
## Plan
## Verification
## Watchouts
```

Each slice should be small enough to plan, build, review, and fix in one focused
loop. If it is too broad, split it.

Each slice plan should include the slice-specific research and organization
guidance needed for a fresh build session:

- current official docs or local precedent to check before coding
- exact repo surfaces likely to change
- expected module/file placement
- likely shared utilities or adapters, with purpose-specific names
- test/dev setup and verification command
- blast radius and higher-risk boundaries
- code quality checklist items the reviewer should pay special attention to

Before building, do a quick slice review. Check that each slice is vertical,
small enough, has clear verification, names likely surfaces, calls out blast
radius, and includes any research or code-quality focus needed for the build.
Fix obvious slice-plan gaps before coding.

### 5. Build

For each slice:

1. Research only the phase-specific facts that can change the build.
   Research the latest official docs for third party software and the idiomatic
   way of doing things for the repo's actual version. Do not guess.
2. Write or update the slice plan.
3. Implement the smallest complete behavior inside the slice.
4. Run the verification from the spec/slice and any focused checks the code
   makes necessary.
5. Record build evidence in the slice file or a nearby build note: files
   changed, checks run, results, skipped checks with reasons, important
   implementation choices, rollback notes, and review focus.
6. Review against the spec, slice, current diff, verification, and code quality
   checklist.
7. Fix blocking findings and re-review.
8. Do not add features that were not asked for. Do not remove existing features
   unless asked.

Do not fold in unrelated cleanup, speculative abstractions, or future slices.
If implementation exposes a missing product, model, permission, UX, or
architecture decision, stop broadening the build, update the docs, and return to
grill/spec/slice as needed.

### 6. Readiness

When all slices pass review, check the assembled feature against the spec:

- every planned slice is built or intentionally removed
- repo-verifiable success checks pass or have explicit gaps
- required human/live checks are complete or clearly awaiting signoff
- tests/checks cover the important risks, or missing coverage is justified
- the code quality checklist is satisfied, or remaining quality issues are
  written as readiness fixes
- docs, language, decisions, and todo reflect the final state

If readiness finds fixable issues, assign them to the smallest affected slice
and loop through fix and review. When ready, mark the relevant `todo.md` items
complete and leave a concise final note with changed files and checks.

## Repeated Runs

Auto Strike should get smarter as the repo gains feature history.

- Start by reading `auto-strike/index.md`, `todo.md`, `language.md`, and
  `decisions.md`.
- Detect whether the new idea belongs to an existing feature, extends a prior
  slice, or deserves a new feature folder.
- Reuse language, decisions, architecture notes, and verification patterns.
- Restructure lightly when the current layout is getting in the way: rename a
  vague file, split an overloaded spec, merge duplicate notes, or add an index.
- Preserve user-written content. Summarize or move current truth only when it
  improves future discovery.
- Update `auto-strike/index.md` whenever important docs move or a new feature
  becomes the active focus.

## User Control

Honor these steering signals immediately:

- "include me more" - ask before major recommendations and show tradeoffs.
- "be more automated" - make reasonable decisions and keep moving.
- "go back to brainstorm" - reopen the idea and update downstream docs after.
- "jump to spec/build" - proceed if the missing decisions are safe to assume;
  otherwise ask the smallest blocking question.
- "stop and summarize" - report current docs, decisions, todo state, checks,
  and next best action.

The modes like Brainstorm and Grill are named because they have useful
thinking patterns, not because the process must be rigid. You can borrow from
them inside other phases. If a deep decision comes up during spec planning, you
do not always need to move backward; use the Grill principles in place when the
decision is local enough to resolve safely.

## MVP Done Criteria

An MVP is done when:

- the user can run or open the app using documented steps
- the core happy path works end to end
- expected failure paths show useful errors or recovery options
- real validation, state handling, persistence, and integrations needed for the
  MVP are in place
- repo-verifiable checks pass, or skipped checks have clear reasons
- required human/live checks are listed clearly
- `auto-strike/` reflects the final state, remaining follow-ups, and next best
  action

## Completion Standard

You are done only when the agreed stopping condition is met, the Auto Strike
workspace is current, and verification has passed or the remaining human/live
checks are explicit. If blocked, state the exact blocker, the decision or
external change needed, and the next action after it is resolved.

If you are repeatedly looping on the same thing and will not get unblocked
without the user's help, stop and explain the blocker clearly.

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
