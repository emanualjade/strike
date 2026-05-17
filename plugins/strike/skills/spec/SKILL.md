---
name: spec
description: Write the durable product and technical specification for a Strike card.
argument-hint: "[feature-slug]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, MultiEdit, Bash, Grep, Glob, WebFetch, WebSearch
---

# Strike Spec

## Communication

When speaking to the user or asking questions, use relaxed, friendly language,
like two friends talking through the work over coffee. Explain things in simple
terms without assumptions, guide with context, and simplify concepts so the
conversation feels easy to follow. Keep the conversation centered on the work
in progress; avoid explaining Strike mechanics unless that context helps the
user decide what to do next.

## Purpose

Turn brainstorm, grill, and optional research outputs into the durable feature
source of truth.

The spec should explain what we are building, why it matters, what is in and
out, what product rules matter, how success will be checked, and what later
slice planning must preserve. It should be specific enough to slice, but not an
implementation plan.

## Host Invocation

When showing follow-up Strike skills, use the plugin package's
`references/invocation.md` to render the current host's syntax. Do not copy
`/strike:*` examples unchanged unless the current host is Claude Code. When
the host is unknown, show the skill name and arguments as a plain next action
without raw field labels.

## Minimal Mechanics

Board location is state. This skill may work only when the card pointer is in:

```txt
docs/strike/board/04-spec/<feature-slug>.md
```

If the pointer is in another lane, stop and recommend:

```txt
Reset context first: yes
Next Strike skill: go
Arguments: <feature-slug>
```

Do not write slices, implementation plans, review, acceptance, retro, app code,
project glossary edits, durable IDs, YAML blocks, or machine-readable routing
metadata.

## Reads

- board pointer
- `cards/<feature-slug>/card.md`
- `cards/<feature-slug>/outputs/brainstorm/brainstorm.md`
- `cards/<feature-slug>/outputs/grill/grill.md`
- `cards/<feature-slug>/outputs/research/research.md` if present
- existing `cards/<feature-slug>/outputs/spec/spec.md` if present
- `UBIQUITOUS_LANGUAGE.md` if present
- focused repo/docs context when facts affect the spec
- focused online/current-doc sources when a narrow fact or pattern is needed to
  write the spec accurately

Read code to confirm surfaces, constraints, existing patterns, or wording
context. Do not inspect broadly just to feel prepared.

## Writes

- `cards/<feature-slug>/outputs/spec/spec.md`
- `cards/<feature-slug>/card.md`
- board pointer moved back from `04-spec` to `02-grill` when missing feature
  intent, audience, scope, boundaries, model shape, success, or first-build
  meaning needs a real decision-tree conversation
- board pointer moved back from `04-spec` to `03-research` when spec discovers
  a real evidence gap that should not be guessed through
- board pointer moved from `04-spec` to `05-slice` only when slice planning can
  continue after a context reset

Use a normal filesystem move, not `git mv`, and verify exactly one pointer file
exists for the feature slug after moving.

## Spec Conversation

Open by checking whether brainstorm, grill, or research give spec enough to
write. Spec starts from the expectation that grill answered the consequential
feature questions. It should not intentionally become a second grill session,
but it can ask a focused question when it discovers one missing decision while
writing.

Classify any remaining item:

- `blocking`: spec would encode a likely-wrong decision without the user
- `research-needed`: spec would encode a likely-wrong technical, domain, or
  architecture assumption without evidence
- `spec-owned`: spec can choose or recommend the detail because it does not
  change feature intent, user/audience, scope, boundaries, model shape,
  success/acceptance, or first-build meaning
- `safe for slice`: record it as a constraint or later-phase question

Ask at most 1-3 concise questions, one at a time. Prefer recommending a concrete
answer over handing the user a blank page. If a missing decision is small and
local, resolve it here and update the relevant upstream artifact (`grill.md` or
`card.md`) so a context reset does not lose the current truth. If it opens a broad
product branch, add/refine the question on `card.md` and move the pointer back
to `02-grill`.

For copy, editorial content, examples, or naming details:

- inspect available product context first
- when feature meaning is decided, prefer one recommended draft over a menu of
  options
- ask the user to approve, prune, or rewrite only when the wording changes
  scope, audience, legal risk, product promise, acceptance, or first slice
- avoid blocking on wording unless the wording changes scope, audience, legal
  risk, product promise, acceptance, or the first slice

If the user says they are testing the flow or wants to continue with available
information, write the best spec from current inputs and keep assumptions or
needed signoff visible.

If the spec cannot stand up without a new decision-tree branch, do not quietly
decide it in spec. Add or refine the question on `card.md` and move the pointer
back to `02-grill`.

If a real evidence gap appears, do not fake confidence. Add a focused research
question to `card.md` and move the pointer back to `03-research`.

## Focused Research During Spec

The spec writer may do small tactical research when the missing fact is narrow,
answerable, and faster to resolve here than by routing back to research.

Allowed examples:

- read code to confirm an existing route, component, helper, schema, command,
  permission check, or pattern
- check official docs for a library/API/framework behavior that affects a spec
  constraint
- verify a current idiomatic pattern or known gotcha for a small technical
  choice
- inspect product/docs context to propose copy, naming, or a tiny editorial
  choice

Use primary sources for online stack research when possible: official docs,
source repos, vendor docs, standards, or pinned-version references. Label weak
evidence as weak.

Keep this research lightweight. Absorb the result into the relevant spec
section; do not create a separate research artifact from spec and do not paste
raw research notes into the spec.

Route back to `03-research` when the gap is broad, uncertain, source-heavy, or
would benefit from a dedicated evidence/guidance pass. Route back to `02-grill`
when the finding changes product intent, scope, naming/model shape, or another
decision-tree branch that the user should reconsider.

## What To Preserve

Pull forward the useful decisions, not every upstream note.

From brainstorm:

- user, painful moment, and why the feature matters
- chosen direction and serious alternatives rejected
- assumptions, first-version non-goals, and open questions

From grill:

- current decisions and why
- rejected paths that still explain scope
- candidate language
- assumptions and safe open questions
- spec handoff

From research, when present:

- findings that shape scope, rules, technical constraints, risks, or success
  checks
- broad architecture or technical recommendations worth preserving for slice
- weak evidence or unknowns the spec must not overstate
- sources only when the source itself is useful downstream

From focused research done during spec:

- absorb only the spec-useful implication
- cite a source only when later slice/implementation should be able to find it
- avoid turning the spec into a research transcript

From repo/docs:

- stable surfaces, conventions, commands, dependencies, or constraints that
  later slice/implementation must respect

## Spec Quality Bar

The spec should accurately and completely represent the feature as decided by
brainstorm, grill, and optional research. Complete does not mean long; it means
the next fresh context window can understand the feature without guessing.

Before writing, ask what this feature needs from these lenses. Include the
sections that matter and omit the ones that do not:

- user flows: what the user sees or does, in intent-named flows when sequence
  matters
- UX expectations: important empty/loading/error states, accessibility,
  responsive behavior, visual/tone expectations, and interaction quality
- state, lifecycle, and invariants: states, allowed transitions, irreversible
  steps, and truths that must always hold
- security, privacy, permissions, and data integrity: auth scope, tenant scope,
  access rules, sensitive data, destructive actions, consistency, and failure
  safety
- engineering pressure points: business rules, state transitions, permissions,
  integrations, data consistency, orchestration, or logic likely to need focused
  tests or a small stable boundary later

Capture "not doing and why," not just "out of scope." The why is what prevents
scope creep after a context reset.

Do not over-design architecture. Engineering pressure points name complexity
areas; they do not prescribe final module names or interfaces unless already
decided.

## Language And Modeling

Use project language consistently. If `UBIQUITOUS_LANGUAGE.md` exists, read it
lightly before naming feature concepts or writing domain vocabulary. If it is
absent, continue without glossary context.

If the spec introduces feature-local terms, define them in the spec. If a term
should become project-wide language, mention the `language` skill as a follow
up instead of editing `UBIQUITOUS_LANGUAGE.md` here.

Use the Core Noun Before Qualifiers reflection when naming domain concepts or
sketching schema shape. If adjective-noun siblings appear, pause long enough to
ask whether the qualifier belongs as a field, tag, enum, boolean, numeric dial,
constraint, configuration, relationship, permission, state, placement,
ownership, or usage context.

## Success Checks

Split success checks into:

- code-verifiable checks: tests, screenshots, routes, rendered states, type
  checks, browser walkthroughs, or repo evidence acceptance can inspect
- live/human checks: user taste calls, live sales/demo checks, external user
  signoff, or analytics that cannot be proven from repo evidence alone

For dogfood runs, it is okay for acceptance to pass on code-verifiable evidence
while carrying live/human checks as intentionally not run. The spec should make
that distinction explicit.

Do not invent measurable metrics just to look rigorous. Use observable checks
that match the feature's real risk.

## Boundaries

Write boundaries in plain language so later agents can avoid scope creep:

- In scope
- Out of scope
- Needs user decision
- Never do

Use "Needs user decision" for hard-to-reverse changes such as schema changes,
new dependencies, new auth or permission behavior, production data changes, new
external integrations, or scope beyond grill decisions.

Describe product and engineering boundaries as facts. Do not give later stages
workflow instructions. State what is in scope, what is out of scope, what needs
a user decision, and what later planning may choose inside those boundaries.

## Artifact Shape

Use this shape as a loose guide. Omit empty sections.

Do not include a section unless it carries real feature-specific information.
The template is a reminder of useful lenses, not a form to fill mechanically.

```md
# Spec

## Summary

[What this feature is and why it matters.]

## Run Kind

[Dogfood / Shippable / Undecided, with implications.]

## Source Inputs

- [Card, brainstorm, grill, relevant repo docs/code.]
- [Optional research output when present.]
- [Focused code/docs/online checks done during spec, only when worth preserving.]

## User And Problem

[Who this is for, their moment, and why it matters.]

## What We Are Building

[User-visible behavior and relevant flows.]

## User Flows

- [Flow name]: [steps or behavior, when sequence matters.]

## UX Expectations

- [States, accessibility, responsive behavior, tone, interaction expectations.]

## Scope

In:
- [...]

Out:
- [Thing not included] - [why.]

Needs user decision:
- [...]

Never:
- [...]

## Product Rules

- [...]

## Domain Language

- [Term]: [meaning.]

## State, Lifecycle, And Invariants

- [State, transition, or invariant.]

## Security, Privacy, Permissions, And Data Integrity

- [Auth, tenant scope, privacy, destructive action, consistency, or integrity rule.]

## Technical Constraints

- [Stable surfaces, dependencies, commands, repo conventions.]

## Engineering Pressure Points

- [Complexity area that may need focused tests or a small stable boundary later.]

## Success Checks

### Code-Verifiable Checks

- [ ] [...]

### Live / Human Checks

- [ ] [...]

## Risks And Assumptions

- [Risk or assumption] - [mitigation or why acceptable.]

## Open Questions

### Blocking

- [...]

### Later Detail Choices

- [...]

## Slice Handoff

- [What slice planning should treat as decided.]
- [What slice planning must preserve or avoid.]
```

## Card Update

When the spec is ready for slice:

- mark the spec checklist item complete
- add a slice checklist item if missing:
  `- [ ] Slice: create vertical phases from the spec.`
- summarize any newly resolved decisions under `Constraints And Decisions`
- move resolved questions out of `Open Questions`
- leave only real open questions visible
- add `Spec: outputs/spec/spec.md` under stage outputs if missing
- move the board pointer to `05-slice`

When the spec is not ready:

- keep spec unchecked
- add or refine checklist items for missing spec decisions
- if the blocker is product intent, scope, naming/modeling shape, or success
  meaning, add or refine the grill question and move the pointer back to
  `02-grill`
- if the blocker is evidence or guidance, add a research checklist item and
  move the pointer back to `03-research`
- keep blocking questions visible in `card.md`
- otherwise leave the board pointer in `04-spec`

## Exit Test

Before moving to slice, reread `spec.md` as if the chat transcript is gone.
Move only when:

- the spec is internally consistent
- it preserves the important brainstorm and grill decisions
- it does not revive rejected options from brainstorm, grill, or research
- it absorbs optional research and any focused spec-time research without
  copying raw notes
- weak evidence or unknowns from research are not overstated
- it represents the feature accurately and completely against brainstorm,
  grill, and optional research
- user-visible behavior and scope are concrete enough to slice
- user flows, UX expectations, state/lifecycle/invariants, security/privacy/
  permissions/data integrity, and engineering pressure points are included when
  relevant or intentionally omitted when not relevant
- success checks are split into code-verifiable and live/human checks
- non-goals and ask-first boundaries are visible
- any remaining questions are clearly blocking, safe for slice, or later-phase
  notes that do not change feature meaning
- slice can continue after a context reset without re-interviewing the user on product
  intent, scope, success, or first-build meaning

If any slice planner would have to rediscover the feature, update `spec.md`
before moving.

## Output

Final response should be short and user-facing:

- spec path written
- whether the card moved to `05-slice`, moved back to `02-grill`, moved back to
  `03-research`, or stayed in `04-spec`
- key spec decisions captured or missing gaps
- next prompt, rendered for the current host with `references/invocation.md`:
  - moved to `05-slice`: show optional `spec-review <feature-slug>` and direct
    `slice <feature-slug>`
  - moved back to `02-grill`: show `grill <feature-slug>`
  - moved back to `03-research`: show `research <feature-slug>`
  - stayed in `04-spec`: show `spec <feature-slug>`

Do not show raw handoff fields such as `Reset context first`, `Next Strike
skill`, or `Arguments`.

## Gates

- Do not create slices.
- Do not write implementation plans.
- Do not write app code.
- Do not edit `UBIQUITOUS_LANGUAGE.md`.
- Do not create durable IDs or hidden state fields.
- Do not move to slice if `spec.md` loses decisions made in brainstorm/grill.

Use `Bash` only for read-only inspection and the board pointer move described
above. Do not mutate app code, repo metadata, or unrelated files.
