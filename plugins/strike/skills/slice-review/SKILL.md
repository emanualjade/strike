---
name: slice-review
description: Review and safely repair Strike phase plans before implementation.
argument-hint: "[project-slug]"
disable-model-invocation: true
allowed-tools: Read Write Edit MultiEdit Bash Grep Glob
---

# Strike Slice Review

## Communication

When speaking to the user or asking questions, use relaxed, friendly language,
like two friends talking through the work over coffee. Explain things in simple
terms without assumptions, guide with context, and simplify concepts so the
conversation feels easy to follow. Keep the conversation centered on the work
in progress; avoid explaining Strike mechanics unless that context helps the
user decide what to do next.

## Purpose

Review the phase split. Full stop.

This is an optional utility skill, not a workflow stage. It preserves the
useful part of a fresh-eyes slice review: check whether the generated phase
plans are actually thin, vertical, ordered, verifiable, and faithful to the
spec before phase planning begins.

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

## User Customization

Before doing any material slice-review work, you MUST run the repo-local
customization loader from the consuming repository root:

```bash
test -f strike/customize/system/customize.mjs || { echo 'Strike is not initialized in this repo yet. Run the Strike `init` skill first.'; exit 1; }
node strike/customize/system/customize.mjs --repo-root <repo-root> preview slice-review
```

If the loader says `slice-review` is unsupported, the repo-local runtime is out
of date. Stop and tell the user to run the Strike `init` skill to refresh it.

## Reads

- `docs/strike/cards/<project-slug>/card.md`
- `outputs/spec/spec.md`
- `outputs/research/research.md` if present
- `outputs/grill/grill.md` when decisions or rejected options matter
- `outputs/brainstorm/brainstorm.md` only when initial problem framing seems lost
- every `phases/<phase-slug>/plan.md`
- focused repo/docs context only when a phase plan names a surface that needs
  basic existence or shape checking

Resolve the project by slug, card folder, or active board pointer. If no phase
plans exist, stop and recommend:

```txt
Reset context first: yes
Next Strike skill: go
Arguments: <project-slug>
```

## Writes

Default write targets:

- `phases/<phase-slug>/plan.md`

Only edit `card.md` when needed to add or update a real unresolved user question
under Open Questions. Do not edit checklist, stage outputs, status, or
constraints from slice review.

Normally leave board pointers unchanged. If review finds a blocking issue that
means the current phase list should not advance, move the pointer back to the
owning lane first: `05-slice` for phase split repair, `04-spec` for spec repair,
`03-research` for broad evidence, or `02-grill` for decision-tree work.

## Review Lenses

Review for phase quality, ordering, and faithfulness. The core question is:
can the `phase-plan` skill start on the first phase after a context reset without
having to re-slice the project?

- Does the phase list preserve the spec's scope, non-goals, success checks, and
  boundaries?
- Did it accidentally revive rejected options from brainstorm, grill, research,
  or spec?
- Are phases vertical rather than horizontal?
- Is any foundation phase truly necessary, independently verifiable, and
  justified?
- Is the first phase the smallest useful or risk-reducing start?
- Are there too many phases, too few phases, or an obvious merge/split?
- Does each phase have one clear outcome?
- Can each phase be independently verified or reviewed?
- Are in-scope and out-of-scope boundaries clear enough to prevent phase creep?
- Are phase-plan focus items captured where local precedents, current docs,
  test conventions, or slice-specific pitfalls matter?
- Are module-boundary or complexity watchouts present without inventing
  architecture?
- Is language consistent with the spec and repo language?
- Are dependencies and ordering honest?

## Fix

Fix obvious issues directly in `phases/<phase-slug>/plan.md`.

Safe fixes include:

- phase outcome wording that is vague but clearly implied by the spec
- missing non-goal or boundary that is clear upstream
- a rejected option accidentally reintroduced
- obvious horizontal wording that should be reframed as a vertical outcome
- missing verification idea when the check is clear from the spec
- missing phase-plan focus item that is clear from the phase surface
- likely surface/path typo when the intended surface is obvious
- inconsistent phase terminology when the intended term is clear
- unclear prose that can be tightened without changing meaning

When fixing, keep phase plans compact. Do not paste raw spec or research notes.
Do not add review commentary into the plans. Preserve the slice writer's
structure unless the structure itself is causing confusion.

## Ask

Ask the user only when fixing would require a real decision.

Ask when:

- two plausible phase orders carry different risk
- a phase boundary changes scope
- the first phase is genuinely ambiguous
- a foundation phase may or may not be justified
- a phase split depends on a product, workflow, UX, data, permission, or
  modeling choice
- the phase list conflicts with the spec and the right source of truth is not
  obvious

Ask one focused question at a time and include a recommended answer. If the
answer changes the spec or grill decisions, say that this belongs upstream and
move the pointer back to the owning lane before recommending the next skill. If
you cannot confidently choose the owning lane, stop and ask rather than
guessing. For decision-tree work:

```txt
Reset context first: yes
Next Strike skill: grill
Arguments: <project-slug>
```

Do not rewrite `outputs/spec/spec.md`, `outputs/grill/grill.md`, or
`UBIQUITOUS_LANGUAGE.md` from slice review.

## Focused Checking

Slice review may do small tactical repo/docs checks when needed to verify a
phase-plan claim. Keep this narrow.

Allowed:

- confirm a named route, component, helper, schema, or command exists
- inspect a nearby pattern only enough to see whether a phase is fake or too
  broad
- inspect language file for term conflicts

Not allowed:

- broad research passes
- detailed phase research
- architecture exploration
- implementation planning
- build-brief writing

If the issue needs broad evidence, move the pointer to `03-research` and
recommend the `research` skill, or keep it in `06-implementation` for optional
`phase-research` when the issue is phase-scoped. If it needs a decision-tree
conversation, move the pointer to `02-grill` and recommend the `grill` skill.

## Output

Final response should be short and user-facing:

- `Slice reviewed.`
- `Fixed:` list only meaningful fixes, or `None.`
- `Questions:` list any user decisions still needed, or `None.`
- `Next:` usually render
  `phase-plan <project-slug> phase:<first-phase-slug>` for the current host
  with `references/invocation.md`. If the phase list still needs broad
  evidence, a real upstream decision, or re-slicing, move the pointer to the
  owning lane first and render the relevant `phase-research`, `research`,
  `grill`, or `slice` prompt.

Do not show raw handoff fields such as `Reset context first`, `Next Strike
skill`, or `Arguments`.

## Gates

- Do not create board lanes.
- Do not move board pointers for safe in-place fixes.
- Do not mark the slice approved or complete, and do not advance workflow state.
- Do not write drafts, sidecars, review reports, build briefs, implementation,
  review, readiness, retro, or implementation files.
- Do not edit `outputs/spec/spec.md`, `outputs/grill/grill.md`, or
  `UBIQUITOUS_LANGUAGE.md`.
- Do not create durable IDs, coverage matrices, lifecycle tables, or hidden
  state fields.
- Do not use slice review to relitigate product or workflow scope unless the
  phase list is clearly inconsistent with upstream decisions.

Use `Bash` only for read-only inspection. Do not mutate implementation files,
board state, repo metadata, or unrelated files.
