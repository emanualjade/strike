# Strike Stage Contracts

These contracts are intentionally small. A workflow stage owns a job, writes
useful Markdown, validates that the next stage can trust it, then moves the
board pointer. Utility skills are included when they are part of the current
Strike skill set, but they leave board state unchanged unless a contract
explicitly says otherwise.

## Shared Rules

- Board lane is workflow state.
- Card folder is durable context.
- `card.md` carries the working checklist.
- Stage outputs are human-readable Markdown.
- IDs, YAML blocks, and join tables are not default tools.
- Validation should improve the artifact or checklist before it adds machinery.
- Final responses should derive the next action from the canonical handoff in
  `references/invocation.md`, then show the active host's next prompt in plain
  user-facing language. Do not dump raw handoff fields unless the user asks for
  them.
- When moving a board pointer, use a normal filesystem move, not `git mv`, then
  verify exactly one pointer exists for the project slug.
- Utilities with no board lane normally leave board pointers alone. A utility
  may move a pointer only when its contract explicitly says it can route a
  blocking issue back to the lane that owns the repair.

## Start

Allowed lane: none.

Writes:

- `cards/<project-slug>/card.md`
- `board/01-brainstorm/<project-slug>.md`

Validation:

- card folder exists
- exactly one board pointer exists for the slug
- starter checklist names the first brainstorm task

## Go Utility

No board lane.

Primary job:

- inspect board pointers and resolve the requested project
- report the current lane, visible checklist items, and one recommended next
  action
- render the current host's next prompt for any recommended Strike skill

Reads:

- `docs/strike/board/*/*.md`
- the resolved `cards/<project-slug>/card.md`
- only the current lane's likely output folder or phase artifacts when needed
  to recommend the next action

Writes:

- nothing

This utility is read-only. It does not move board pointers, edit cards, infer
state from mtimes or metadata blocks, or create artifacts.

## Brainstorm

Allowed lane: `01-brainstorm`.

Primary job:

- turn a fuzzy idea into a clearer product, technical, or workflow direction
- identify the affected user, system, or workflow, painful moment or workflow
  friction, current workaround or failure mode, and success shape
- explore a few plausible directions before converging
- record first-version non-goals, assumptions, and questions for grill
- create optional static HTML demos when visual choice would help

Writes:

- `outputs/brainstorm/brainstorm.md`
- optional `demos/*.html`
- updates `card.md` checklist/questions/constraints

Move to `02-grill` when:

- grill can ask consequential decision-tree questions without rerunning
  brainstorm
- open questions are visible as questions for grill or card checklist items

## Demo Utility

No board lane.

Primary job:

- create one small static HTML planning demo when seeing the idea would help the
  user think, compare, or decide
- support UI options, flow comparisons, before/after states, decision maps,
  state explainers, command output comparisons, API/config/data-shape sketches,
  product concept sketches, and lightweight interactive choices
- keep demos self-contained, mock-data-only, and clearly planning artifacts

Writes:

- `demos/<nn-topic>.html`
- optional `demos/README.md`

This utility does not edit repo source files, install packages, use external
CDNs/assets, move board pointers, or make demos required for any stage.

## Grill

Allowed lane: `02-grill`.

Primary job:

- exhaust the decision tree enough that spec does not guess
- ask one consequential question at a time
- answer from code/docs instead of asking when the repo already knows
- record decisions, assumptions, rejected options, research questions, domain
  language, non-goals, and open blockers as plain Markdown

Writes:

- `outputs/grill/grill.md`
- updates `card.md` checklist/questions/constraints

`grill.md` is the current decision record, not an audit log. Update it as
decisions crystallize, and rewrite stale decisions when the user changes their
mind. It should preserve decisions, rejected options, assumptions, candidate
language, and open spec questions well enough that spec can continue after
a context reset without the chat transcript.

Move to `03-research` when:

- pre-spec evidence, current docs, architecture guidance, domain pitfalls, UX
  patterns, or stack options could materially improve the spec
- research questions are focused enough that research can run after a context
  reset

Research remains optional even when recommended. The user can skip it and move
to spec.

Move to `04-spec` when:

- spec can be written without re-interviewing the user on product, technical,
  or workflow intent, affected audience or system, scope, boundaries, model
  shape, success, or first build meaning
- research is unnecessary or not needed before spec
- spec has the decisions it needs; any remaining items are safe spec-owned
  details, research follow-ups, or visible blockers

## Research

Allowed lanes:

- `03-research` when a prior stage routed the card to research
- `04-spec` when the user requests an optional research pass before spec

Primary job:

- gather lean evidence and guidance before spec
- research only questions that can affect decisions, scope, product, technical,
  or workflow rules, domain language, model shape, UX expectations,
  implementation constraints, success checks, or risk mitigation
- include online/current-doc/architecture/domain/UX research when useful, not
  only current-code inspection
- update `grill.md` only when research changes a decision and the user resolves
  it
- keep the research artifact useful and compact

Writes:

- `outputs/research/research.md`
- updates `outputs/grill/grill.md` only for resolved decision changes
- updates `card.md` checklist/questions/constraints

Move to `04-spec` when:

- research questions that matter before spec are answered, marked weak/unknown,
  or saved for later because they are not spec-blocking
- decision-changing findings have been resolved with the user or routed back to
  grill
- `grill.md` reflects current decisions
- `research.md` contains only spec-useful findings, options, pitfalls, sources,
  and weak evidence
- if research started from `04-spec`, leave the pointer in `04-spec`
- if the user skipped research, no `research.md` is required; record the skip
  on the card and move to `04-spec`

Move back to `02-grill` when:

- research reveals a product, technical, workflow, or domain decision that
  needs a real decision-tree conversation before spec

## Spec

Allowed lane: `04-spec`.

Primary job:

- write the durable product, technical, or workflow spec
- split success checks into repo-verifiable checks and live/human checks
- capture product, technical, or workflow rules, domain vocabulary, boundaries,
  risks, and verification expectations
- stop before slicing

Writes:

- `outputs/spec/spec.md`

Move to `05-slice` when:

- the spec is concrete enough to slice
- repo-verifiable success checks are concrete enough for readiness review, or
  the card clearly says readiness depends on live/human signoff
- live/human checks, if any, are separated from checks readiness review can
  grade from repo evidence
- known risks are visible

Move back to `03-research` when:

- spec discovers a real evidence, current-doc, architecture, domain, or UX gap
  that should not be guessed through

Move back to `02-grill` when:

- missing project intent, affected audience or system, scope, boundaries, model
  shape, success, or first-build meaning needs a real decision-tree
  conversation

Spec may ask a focused question for a small missing decision and then update
the relevant card/grill/spec artifacts so a context reset preserves the current
truth.
It should not intentionally become a second grill session.

## Spec Review Utility

No board lane.

Primary job:

- optionally review `outputs/spec/spec.md` before slicing
- fix obvious spec issues in place
- ask only when the spec review finds a real unresolved decision
- leave board state unchanged unless review finds an upstream issue that blocks
  slicing

Writes:

- `outputs/spec/spec.md` for safe in-place fixes
- `card.md` only when a real unresolved user question must survive a context
  reset
- may move the board pointer back to `02-grill` or `03-research` when review
  finds an unresolved upstream issue that blocks slicing

This utility does not write a review report, create approval state, move board
pointers for safe in-place fixes, write slice/implementation artifacts, edit
implementation files, or edit `UBIQUITOUS_LANGUAGE.md`.

The user can skip this utility and go straight to the `slice` skill.

## Slice

Allowed lane: `05-slice`.

Primary job:

- turn the spec into a small phase list of vertical implementation phases
- create one folder per phase with a compact phase plan
- use engineering judgment to split, merge, order, and name phases so the full
  project can be built accurately without extra ceremony
- mention likely code surfaces when they clarify a phase, without turning slice
  into implementation or a build brief

Writes:

- `phases/<phase-slug>/plan.md`
- updates `card.md`

Move to `06-implementation` when:

- at least one buildable phase exists
- the first phase can be phase-planned after a context reset without broad
  rediscovery

## Slice Review Utility

No board lane.

Primary job:

- optionally review generated phase plans before phase planning starts
- fix obvious phase-plan issues in place
- ask only when the phase split needs a real product, technical, workflow, or
  engineering decision
- leave board state unchanged unless review finds a blocking issue owned by an
  earlier lane

Writes:

- `phases/<phase-slug>/plan.md` for safe in-place fixes
- `card.md` only when a real unresolved user question must survive a context
  reset
- may move the board pointer back to `05-slice`, `04-spec`, `03-research`, or
  `02-grill` when review finds a blocking issue owned by that lane

This utility does not write a review report, create approval state, move board
pointers for safe in-place fixes, write build briefs, or touch implementation
files. The user can skip it and go straight to the `phase-plan` skill.

## Phase Research Utility

No board lane. Runs while the card is in `06-implementation`.

Primary job:

- optionally research one phase before phase-plan
- inspect phase-specific repo precedents, current docs, test/dev setup, and
  pitfalls
- write a compact phase-specific synthesis
- leave board state unchanged unless the phase split itself is wrong

Writes:

```txt
phases/<phase-slug>/research.md
```

May move the board pointer back to `05-slice` only when phase research shows
the phase split itself is wrong.

Use it for complex/integration-heavy phases. Skip it for simple phases and go
straight to the `phase-plan` skill.

## Phase Plan

Allowed lane: `06-implementation`.

Primary job:

- prepare exactly one phase for a fresh build session
- read `phases/<phase-slug>/research.md` if present
- do additional tactical research when useful
- write one compact build brief
- touch no implementation files

Phase-plan tactical research should stay practical and phase-shaped:

- inspect exact repo precedents this phase is likely to touch
- check current official docs when stack behavior matters
- identify the verification strategy for this phase
- point build toward the simplest safe approach
- flag incomplete user-visible behavior that needs gating, delayed mounting, or
  a smaller phase
- call out concrete pitfalls or adjacent work not to fold in
- carry forward relevant prior phase handoff notes

Writes:

```txt
phases/<phase-slug>/build-brief.md
```

May move the board pointer back to `02-grill` when a missing product,
technical, or workflow decision blocks the brief, or to `05-slice` when the
phase split itself is wrong.

Validation:

- the brief is narrow to one phase
- behavior, likely files/surfaces, verification, and concrete watchouts are
  clear enough for phase-build
- phase research used by the brief is cited briefly when it exists
- broad project research was not repeated as ritual

The board pointer normally stays in `06-implementation`; this lane owns
phase-plan, phase-build, phase-review, and phase-fix unless work is routed back
to an upstream lane.

Brief shape:

```md
# Build Brief: [Phase Name]

## Build Outcome

## Files And Surfaces

## Implementation Notes

## Verification

## Research Used

## Watchouts

## Out Of Scope
```

## Phase Build

Allowed lane: `06-implementation`.

Primary job:

- implement exactly one phase from its phase plan and build brief
- edit only the implementation, test, or documentation files needed for that
  phase
- run focused verification
- keep changes small and reviewable
- use the simplest code that satisfies the current phase
- keep phase evidence local in `build.md`
- do not implement future phases or adjacent cleanup

Writes:

```txt
phases/<phase-slug>/build.md
```

Updates:

- `card.md`
- board pointer text in `06-implementation`
- may move the board pointer back to `02-grill`, `03-research`, or `05-slice`
  when build discovers an upstream blocker owned by that lane

Validation:

- build output matches the phase plan
- every changed implementation file is listed with rollback notes
- tests or checks added/updated are listed, or absence is explained
- verification that matters for the phase has run or is visible as an unchecked
  user action
- failed or skipped checks are recorded honestly
- phase-review can start after a context reset without reconstructing the build from
  git diff alone

The board pointer stays in `06-implementation` for completed builds;
phase-review is the next step.

## Phase Review

Allowed lane: `06-implementation`.

Primary job:

- review a built phase from fresh context
- write plain-language blocking fixes or a pass verdict
- leave implementation/test repairs to phase-fix when fixes are needed
- move to readiness only when all phases are cleanly reviewed

Writes:

- `phases/<phase-slug>/review.md`
- updates `card.md`
- may move board pointer to `07-readiness`

Validation:

- phase plan, build evidence, and current diff were read
- blocking fixes are plain unchecked checklist items
- pass verdict has enough evidence to trust readiness review as the next stage
- skipped, failed, or missing checks are not hidden

Move to `07-readiness` when:

- all planned phases are reviewed cleanly or intentionally skipped in prose
- no blocking implementation or readiness-fix checklist items remain

## Phase Fix

Allowed lane: `06-implementation`.

Primary job:

- fix blocking work found by phase-review or phase-scoped readiness fixes
- stay inside the selected phase unless the user explicitly expands scope
- rerun the relevant checks
- write fix evidence and return to phase-review

Writes:

- `phases/<phase-slug>/fix.md` with what changed, why, and what checks ran
- updates `card.md` checklist items when needed

Validation:

- every fix maps to a real review finding, a phase-scoped readiness fix, or
  user-approved expansion
- the phase is ready for another phase-review after a context reset
- card/board state stays in `06-implementation` and routes back to phase-review

## Readiness Review

Allowed lane: `07-readiness`.

Primary job:

- review the assembled project against the spec's success checks
- verify that the project has been built in full and accurately, not merely
  that phase files exist
- verify that important project tests/checks exist, or that missing tests are
  explicitly called out as readiness gaps
- run broad enough tests, command/API checks, manual checks, or browser checks
  for confidence
- route failures back as plain-language checklist items
- read phase `fix.md` when present as part of the reviewed phase evidence

Writes:

- `outputs/readiness/readiness.md`
- updates `card.md` with readiness fixes when needed
- may move board pointer to `08-retro`
- may move board pointer back to `06-implementation`

Move to `08-retro` when:

- success checks pass, including required live/human checks
- repo-verifiable spec checks have evidence from tests, commands, API checks,
  generated artifacts, browser walkthroughs, or code/repo inspection as
  appropriate
- important project behavior has tests/checks, or the absence of tests is
  intentionally accepted and visible
- no readiness fix checklist items remain open

Move back to `06-implementation` when:

- readiness review found fixable work
- readiness fixes are assigned to the affected phase when possible, so
  phase-fix can repair them and phase-review can verify them before readiness
  review runs again

## Retro

Allowed lane: `08-retro`.

Primary job:

- capture what helped or hurt
- record improvements to Strike itself
- call out follow-up product, workflow, or engineering work

Writes:

- `outputs/retro/retro.md`

Move to `09-done` when:

- retro notes are saved
- no user-facing signoff remains open

## Language Utility

No board lane.

Primary job:

- assess, trace, explain, propose, or apply repo language changes when
  wording affects planning, UI, code, docs, or domain modeling
- compare Strike Project artifacts against repo language when called with
  a project slug
- keep shared language in `UBIQUITOUS_LANGUAGE.md`

Writes:

- `UBIQUITOUS_LANGUAGE.md` only when the user approves a concrete glossary
  change or provides exact text to apply

This utility does not move board pointers, create stage outputs, edit
implementation files unless explicitly asked, or apply uncertain glossary
changes without user approval. Project-local terms can stay in card/grill/spec
artifacts until they are stable enough to promote.
