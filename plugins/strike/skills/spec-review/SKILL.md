---
name: spec-review
description: Review and safely repair a Strike spec before slicing.
argument-hint: "[project-slug]"
disable-model-invocation: true
allowed-tools: Read Write Edit MultiEdit Bash Grep Glob WebFetch WebSearch
---

# Strike Spec Review

## Communication

When speaking to the user or asking questions, use relaxed, friendly language,
like two friends talking through the work over coffee. Explain things in simple
terms without assumptions, guide with context, and simplify concepts so the
conversation feels easy to follow. Keep the conversation centered on the work
in progress; avoid explaining Strike mechanics unless that context helps the
user decide what to do next.

## Purpose

Review the spec. Full stop.

This is an optional utility skill, not a workflow stage. It compares the spec
against upstream context, fixes obvious issues, and asks the user only when a
real decision is needed.

No board lane. No draft files. No sidecars. No review report by default.

The only durable exception is when a real unresolved user decision must survive
a context reset; then keep that question visible on the card without changing workflow
state.

## Host Invocation

When showing follow-up Strike skills, use the plugin package's
`references/invocation.md` to render the current host's syntax. Do not copy
`/strike:*` examples unchanged unless the current host is Claude Code. When
the host is unknown, show the skill name and arguments as a plain next action
without raw field labels.

## Reads

- `docs/strike/cards/<project-slug>/card.md`
- `outputs/brainstorm/brainstorm.md`
- `outputs/grill/grill.md`
- `outputs/research/research.md` if present
- `outputs/spec/spec.md`
- `UBIQUITOUS_LANGUAGE.md` if present and language/domain terms matter
- focused repo/docs context when a spec claim needs checking
- focused online/current-doc sources when a narrow spec claim needs checking

Resolve the project by slug, card folder, or active board pointer. If no
`outputs/spec/spec.md` exists, stop and recommend:

```txt
Reset context first: yes
Next Strike skill: go
Arguments: <project-slug>
```

## Writes

Default write target:

- `outputs/spec/spec.md`

Only edit `card.md` when needed to add or update a real unresolved user question
under Open Questions. Do not edit checklist, stage outputs, status, or
constraints from spec review.

Normally leave board pointers unchanged. If review finds an unresolved upstream
issue that blocks slicing, move the pointer back to `02-grill` for product,
technical, workflow, or decision-tree work, or `03-research` for broad evidence
work, then show the matching handoff.

## Review Lenses

Review for accuracy, completeness, and usefulness. The core question is:
does `outputs/spec/spec.md` accurately and completely represent the project as
described by brainstorm, current grill decisions, optional research, and the
card?

- Does the spec reflect current decisions in `grill.md`?
- Did it accidentally revive rejected options?
- Does it preserve the relevant brainstorm framing?
- Does it use research findings properly if research exists?
- Is scope clear?
- Are non-goals clear?
- Are product, technical, or workflow rules concrete?
- Are user/operator/system flows present when sequence or interaction matters?
- Are UX expectations present when visual states, accessibility, responsive
  behavior, tone, or interaction quality matter?
- Are state, lifecycle, and invariants present when the project has states,
  transitions, or truths that must always hold?
- Are security, privacy, permissions, and data integrity covered when access
  scope, boundary rules, sensitive data, destructive actions, or consistency
  matter?
- Are engineering pressure points named when business rules, state transitions,
  permissions, integrations, data consistency, orchestration, or focused tests
  are likely?
- Are success checks useful and split into repo-verifiable vs live/human?
- Are open questions honest and categorized well?
- Is language/domain wording consistent with the Project and repo language?
- Are assumptions and risks visible without being overblown?
- Is anything contradicted by focused code/docs evidence?

## Fix

Fix obvious issues directly in `outputs/spec/spec.md`.

Safe fixes include:

- missed decision already clear in `grill.md`
- contradiction inside the spec
- rejected option accidentally reintroduced
- vague or misplaced success check
- non-goal or boundary missing from spec but clear upstream
- research implication omitted or overstated
- missing user flow, UX expectation, invariant, security/privacy/permission/data
  integrity note, or engineering pressure point that is clearly implied upstream
- inconsistent term when the intended term is clear
- stale source/input note
- unclear prose that can be tightened without changing meaning

When fixing, keep the spec compact. Do not paste raw research. Do not add
review commentary into the spec. Preserve the spec writer's structure unless the
structure itself is causing confusion.

## Ask

Ask the user only when fixing would require a real decision.

Ask when:

- two plausible interpretations exist
- scope would change
- a success criterion needs human judgment
- a language/modeling choice is consequential
- research exposed an unresolved tradeoff
- the spec conflicts with grill/research and the right source of truth is not
  obvious

Ask one focused question at a time and include a recommended answer. If the user
answers, apply the resulting spec fix. If the answer changes a decision in
`grill.md`, say that this belongs in grill, move the pointer back to
`02-grill`, and recommend:

```txt
Reset context first: yes
Next Strike skill: grill
Arguments: <project-slug>
```

Do not rewrite `grill.md` from spec review.

## Focused Checking

Spec review may do small tactical code/docs/online checks when needed to verify
a spec claim. Keep this narrow.

Allowed:

- confirm a named route/component/helper/schema exists
- check official docs for a small stack constraint
- verify a command, test convention, or repo pattern
- inspect language file for term conflicts

Not allowed:

- broad research passes
- architecture exploration
- new product, technical, or workflow discovery
- implementation planning

If the issue needs broad evidence, move the pointer back to `03-research` and
recommend the `research` skill. If it needs a decision-tree conversation, move
the pointer back to `02-grill` and recommend the `grill` skill.

## Output

Final response should be short and user-facing:

- `Spec reviewed.`
- `Fixed:` list only meaningful fixes, or `None.`
- `Questions:` list any user decisions still needed, or `None.`
- `Next:` render `slice <project-slug>` for the current host with
  `references/invocation.md`, unless review found an upstream decision or
  evidence problem; in that case, move the pointer to the owning lane first and
  render the relevant `grill <project-slug>` or `research <project-slug>`
  prompt.

Do not show raw handoff fields such as `Reset context first`, `Next Strike
skill`, or `Arguments`.

## Gates

- Do not create board lanes.
- Do not move board pointers for safe in-place fixes.
- Do not mark the spec approved or complete, and do not advance workflow state.
- Do not write drafts, sidecars, review reports, slices, implementation plans,
  review artifacts, acceptance, retro, or implementation files.
- Do not edit `UBIQUITOUS_LANGUAGE.md`.
- Do not create durable IDs or hidden state fields.
- Do not use the spec review to relitigate product or workflow scope unless the
  spec is clearly inconsistent with upstream decisions.

Use `Bash` only for read-only inspection. Do not mutate implementation files,
board state, repo metadata, or unrelated files.
