# Auto Strike Flow

Treat these as flexible modes, not a rigid waterfall. Usually start with
Brainstorm, then Grill, so later work has enough shape. Jump backward or forward
when useful, keep the workspace current, and borrow a mode's best principles
when another mode surfaces the same kind of problem.

## Brainstorm

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

## Grill

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
permission, relationship, configuration, placement, ownership, or usage context.

Update `language.md` and `decisions.md` as decisions crystallize. Do not keep
contradictory history unless it explains the current choice.

## Spec

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

## Slice

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
- edge cases to handle, verify, defer, or ask about
- code quality checklist items the reviewer should pay special attention to

Before building, do a quick slice review. Check that each slice is vertical,
small enough, has clear verification, names likely surfaces, calls out blast
radius, and includes any research or code-quality focus needed for the build.
Fix obvious slice-plan gaps before coding.

## Edge Case Pass

Before building a slice, and again during review, do a short edge case pass
scaled to the risk of the work. Do not turn this into exhaustive speculation;
focus on cases that can change the plan, implementation, verification, or user
experience.

Check the relevant categories:

- Inputs: missing, malformed, too large, duplicate, out of order, unsupported, or
  hostile input.
- State: empty, loading, success, failure, retry, partial completion, stale data,
  race conditions, and illegal transitions.
- Permissions and ownership: unauthenticated, unauthorized, wrong owner, wrong
  role, expired access, and cross-tenant access.
- Data integrity: duplicate writes, destructive actions, rollback, idempotency,
  migrations, background jobs, and external side effects.
- Integrations: timeout, rate limit, webhook retry, provider outage, partial
  response, version mismatch, and cost limits.
- UI and device behavior: mobile/desktop layout, keyboard navigation, focus,
  accessibility basics, long text, empty content, and visible error recovery.
- Operations: logging, debugging evidence, secrets exposure, deploy/runtime env,
  and safe failure mode.

For each important edge case, choose one outcome:

- build into the current slice
- cover with a test, browser check, or command/API check
- document as accepted MVP limitation
- move to Soon/Later
- ask the user if it changes product behavior or risk

## User Flow Validation Pass

Before building a spec or major slice, and again during readiness, generate a
small set of realistic user or system flows to test whether the plan supports
needed behavior. Keep this practical; do not create a large story backlog unless
the project needs it.

Include:

- standard success flows for the primary user
- first-time user flows
- returning user flows when relevant
- interrupted or resumed flows
- permission, ownership, or role variations
- empty, partial, invalid, duplicate, and recovery flows
- mobile or constrained-device flows for UI work
- admin/operator/support flows when the product requires them
- external system, webhook, background job, or integration flows when relevant

For each flow, check:

- can the user or system start, continue, complete, cancel, recover, or retry?
- does the UI/API/CLI expose the right state and next action?
- are validation, permissions, errors, and data integrity handled?
- is the flow covered by the current spec, slice, tests, browser checks, or
  accepted MVP limitations?

If a generated flow reveals missing behavior, choose one outcome:

- build into the current slice
- add or adjust a future slice
- document as an accepted MVP limitation
- move to Soon/Later
- ask the user if it changes the product promise or risk

## Build

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

## Readiness

When all slices pass review, check the assembled feature against the spec:

- every planned slice is built or intentionally removed
- repo-verifiable success checks pass or have explicit gaps
- required human/live checks are complete or clearly awaiting signoff
- representative user/system flows pass through the built product, or gaps are
  documented as accepted limitations or follow-up slices
- tests/checks cover the important risks, or missing coverage is justified
- the code quality checklist is satisfied, or remaining quality issues are
  written as readiness fixes
- docs, language, decisions, and todo reflect the final state

If readiness finds fixable issues, assign them to the smallest affected slice
and loop through fix and review. When ready, mark the relevant `todo.md` items
complete and leave a concise final note with changed files and checks.

## User Control

Honor these steering signals immediately:

- "include me more" - ask before major recommendations and show tradeoffs.
- "be more automated" - make reasonable decisions and keep moving.
- "go back to brainstorm" - reopen the idea and update downstream docs after.
- "jump to spec/build" - proceed if the missing decisions are safe to assume;
  otherwise ask the smallest blocking question.
- "stop and summarize" - report current docs, decisions, todo state, checks,
  and next best action.

## Done Criteria

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
