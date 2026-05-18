---
name: research
description: Gather lean pre-spec evidence when it can change project decisions.
argument-hint: "[project-slug] [optional focus|skip]"
disable-model-invocation: true
allowed-tools: Read Write Edit MultiEdit Bash Grep Glob WebFetch WebSearch Agent
---

# Strike Research

## Communication

When speaking to the user or asking questions, use relaxed, friendly language,
like two friends talking through the work over coffee. Explain things in simple
terms without assumptions, guide with context, and simplify concepts so the
conversation feels easy to follow. Keep the conversation centered on the work
in progress; avoid explaining Strike mechanics unless that context helps the
user decide what to do next.

## Purpose

Run a lean evidence and guidance pass before spec.

Research is optional. Use it only when evidence, current docs, architecture
guidance, domain pitfalls, UX examples, or repo precedent could materially
improve the spec. Do not research just to prove decisions that grill already
made.

If the user passes `skip`, do not research. Move the card from `03-research`
to `04-spec`, record that research was skipped, and show a `spec` handoff as
the next action.

Mental model:

```txt
grill.md = current decisions
research.md = useful evidence, options, guidance, and implications
spec.md = source of truth that absorbs both
```

## Host Invocation

When showing follow-up Strike skills, use the plugin package's
`references/invocation.md` to render the current host's syntax. Do not copy
`/strike:*` examples unchanged unless the current host is Claude Code. When
the host is unknown, show the skill name and arguments as a plain next action
without raw field labels.

## User Customization

Before material research work, load repo-local customization for this skill.

Resolve the bundled customization script by absolute path from this installed
plugin package. This skill lives at `<plugin-root>/skills/research/SKILL.md`;
the script lives at `<plugin-root>/references/scripts/customize.mjs`.

Run the loader from the consuming repository root:

```bash
node <plugin-root>/references/scripts/customize.mjs --repo-root <repo-root> load research
```

Apply the printed customization packet only when it does not conflict with this
skill's Purpose, Minimal Mechanics, Reads, Writes, or Gates. Customization may
shape evidence standards, source choices, citation style, synthesis depth, and
additive files. Additive research files should live under the active card's
`outputs/research/custom/` folder unless the user explicitly asks for another
path already allowed by this skill.

## Minimal Mechanics

Board location is state. This skill may work when the card pointer is in:

```txt
docs/strike/board/03-research/<project-slug>.md
docs/strike/board/04-spec/<project-slug>.md
```

Use `03-research` when a prior stage routed the card to research. Use
`04-spec` when the user asks for an optional evidence pass before writing spec.

If the pointer is in another lane, stop and recommend:

```txt
Reset context first: yes
Next Strike skill: go
Arguments: <project-slug>
```

Do not write spec, slices, implementation, review, acceptance, retro,
implementation files, repo glossary edits, durable IDs, YAML blocks, or
machine-readable routing metadata.

## Reads

- board pointer
- `cards/<project-slug>/card.md`
- `cards/<project-slug>/outputs/brainstorm/brainstorm.md`
- `cards/<project-slug>/outputs/grill/grill.md`
- existing `cards/<project-slug>/outputs/research/research.md` if present
- `UBIQUITOUS_LANGUAGE.md` if present and naming or modeling is relevant
- focused repo/docs context
- online sources when current or external evidence matters

Research questions can come from `card.md`, `grill.md`, the user prompt/focus,
or a later spec gap that routed the card back to research.

## Writes

- `cards/<project-slug>/outputs/research/research.md`
- `cards/<project-slug>/outputs/grill/grill.md` only when research changes a
  decision and the user resolves it
- `cards/<project-slug>/card.md`
- skip mode: no `research.md`; update `card.md` and move from `03-research` to
  `04-spec`
- board pointer moved back from `03-research` to `02-grill` only when research
  reveals a product, technical, workflow, or domain decision that needs a real
  decision-tree session
- board pointer moved from `03-research` to `04-spec` only when spec can
  continue after a context reset
- board pointer left in `04-spec` when research was run as an optional pre-spec
  pass from `04-spec`

Use a normal filesystem move, not `git mv`, and verify exactly one pointer file
exists for the project slug after moving.

## Skip Mode

When the user runs:

```txt
Next Strike skill: research
Arguments: <project-slug> skip
```

from `03-research`:

- do not inspect broadly
- do not write `research.md`
- mark or rewrite the research checklist item as skipped
- add a spec checklist item if missing:
  `- [ ] Spec: write the durable Project source of truth.`
- add a short note to `card.md` that optional research was skipped by user
  choice
- move the board pointer to `04-spec`

If the card is already in `04-spec`, say research is already optional there and
show a `spec` handoff.

## Research Lanes

Use these as a menu, not a checklist. Pick only what can affect decisions, spec
scope, product, technical, or workflow rules, domain language, model shape, UX
expectations, implementation constraints, success checks, repo workflows, or
risk mitigation.

- `codebase-precedents`: existing repo patterns, reusable helpers,
  surfaces, commands, APIs, config, data shape, access scope, tests, and
  conventions.
- `stack-technology-contracts`: official docs, pinned-version behavior,
  idiomatic usage, current gotchas, CLI/library/framework constraints,
  SSR/a11y behavior, vendor SDKs, APIs, or package/tooling requirements.
- `architecture-options`: broad technical shapes, tradeoffs, reversibility,
  complexity, and fit with this project.
- `domain-modeling-pitfalls`: permissions, access boundaries, privacy,
  schema/model traps, race conditions, data integrity, time zones, external
  side effects, uploads, or lifecycle risk.
- `ux-comparable-patterns`: interaction guidance, accessibility expectations,
  comparable product patterns, visual/product examples, operator workflows, or
  developer experience examples.
- `stack-options`: tool, library, vendor, or service choices only when the
  choice is genuinely open.

Online research is first-class when the topic can drift or when outside
guidance matters. Prefer primary sources for stack behavior: official docs,
source repos, standards, vendor docs, and pinned-version references. Use blogs,
forum answers, examples, or AI summaries only as secondary context unless they
are the best available source.

If evidence is weak, label it weak. Do not turn weak evidence into a hard spec
rule.

## Decision Handling

Research does not confirm decisions for audit.

- If research simply supports something already decided, no special action is
  needed.
- If research answers an open research question without changing product,
  technical, workflow, or architecture decisions, record the useful finding in
  `research.md`.
- If research reveals that a grill decision is wrong, risky, ambiguous, or
  incomplete, ask the user one focused question.
- After the user decides, update `outputs/grill/grill.md` so it reflects the
  current truth.
- Do not intentionally pass a new product, technical, workflow, scope, surface,
  naming, model-shape, or sequencing decision forward as "for spec." Resolve
  small decision-changing findings here when possible, or route back to grill
  when the project needs a real decision-tree conversation again. Spec may
  still ask a focused question if it later discovers a missing decision;
  research just should not knowingly hand it one.
- Do not keep contradiction history in `grill.md`.
- Do not add a bookkeeping note to `research.md` just to say `grill.md` was
  updated. Keep `research.md` focused on the finding, evidence, and spec
  implication.

If the decision-changing finding needs product, technical, or workflow judgment
and the user is not ready to decide, leave the pointer in `03-research` or move
it back to `02-grill` only when the project needs a real decision-tree
conversation again. Keep the blocking question visible on `card.md`.

## Using Subagents

Use host-supported delegation only when the active host and user/project policy
allow it. When allowed, use subagents sparingly for independent research lanes
broad enough that parallelism clearly saves time or avoids a shallow answer.
For a few repo lookups, use local search and reads directly.

When delegation is allowed, keep prompts narrow and avoid spawning one agent
per checklist bullet by default. The main skill owns synthesis, user decision
questions, file writes, and board movement.

## Artifact Shape

`research.md` should be the smallest document that lets spec make better
choices after a context reset.

Write synthesized findings, not a research diary. Prefer implication-level
notes over listing every search, every file opened, or the same point in several
sections. A good finding usually says what changed or became clearer, why spec
cares, and where the evidence came from.

Avoid:

- proving every grill decision
- dumping raw notes
- long source summaries
- generic best practices
- every option considered
- huge quote blocks
- empty rigid sections
- "we found nothing" notes unless the absence matters

Use this shape as a loose guide. Omit sections that do not apply.

```md
# Research

## Summary

- [One to five useful takeaways for spec.]

## Findings

### [Finding Name]

Finding: [What became clearer.]
Spec use: [What spec should do with it.]
Sources: [Only the useful files/links.]

## Options / Tradeoffs

### [Option]

Best if: [...]
Tradeoffs: [...]
Recommendation: [...]

## Decisions Needed

- [Only if research exposed one.]

## Weak Evidence / Unknowns

- [...]

## Sources

- [...]
```

If the `Findings` already contain the spec implications, do not repeat them in a
separate `Spec Implications` section.


## Card Update

When research is ready for spec:

- mark the research checklist item complete if it exists
- add a spec checklist item if missing:
  `- [ ] Spec: write the durable Project source of truth.`
- summarize only newly useful research implications under `Constraints And
  Decisions`
- move resolved research questions out of `Open Questions`
- leave only real open questions visible
- add `Research: outputs/research/` under stage outputs if missing
- move the board pointer to `04-spec` if it started in `03-research`; leave it
  in `04-spec` if it started there

When research is not ready:

- keep research unchecked
- add or refine checklist items for missing research or user decisions
- keep blocking questions visible in `card.md`
- leave the board pointer in `03-research`, or move back to `02-grill` when the
  blocker needs a decision-tree conversation rather than more research

## Exit Test

Before moving to spec, reread `research.md` and `grill.md` as if the chat
transcript is gone. Move only when:

- research questions that matter before spec are answered, deferred, or marked
  weak/unknown
- decision-changing findings have been resolved with the user or routed back to
  grill
- `grill.md` reflects current decisions
- `research.md` contains only spec-useful findings, options, pitfalls, sources,
  and weak evidence
- no known product, technical, workflow, scope, surface, naming, or model-shape
  decision is being intentionally handed to spec as unresolved project intent
- spec can continue after a context reset without rerunning research

If spec would have to rediscover the evidence, update `research.md` before
moving.

## Output

Final response should be short and user-facing:

- research path written
- whether the card moved to `04-spec`, moved back to `02-grill`, or stayed in
  `03-research`
- key findings or missing research/user-decision gaps
- next prompt, rendered for the current host with `references/invocation.md`:
  `spec <project-slug>` when ready for spec, `grill <project-slug>` when
  routed back for decisions, or `research <project-slug>` when research should
  continue

Do not show raw handoff fields such as `Reset context first`, `Next Strike
skill`, or `Arguments`.

## Gates

- Do not write spec, slice, implementation, review, acceptance, or retro files.
- Do not write implementation files.
- Do not edit `UBIQUITOUS_LANGUAGE.md`.
- Do not research every possible thing.
- Do not create durable IDs or hidden state fields.
- Do not move to spec if decision-changing findings are unresolved.
