---
name: grill
description: Drive focused product, technical, and workflow decisions before spec writing.
argument-hint: "[project-slug]"
disable-model-invocation: true
allowed-tools: Read Write Edit MultiEdit Bash Grep Glob
---

# Strike Grill

## Communication

When speaking to the user or asking questions, use relaxed, friendly language,
like two friends talking through the work over coffee. Explain things in simple
terms without assumptions, guide with context, and simplify concepts so the
conversation feels easy to follow. Keep the conversation centered on the work
in progress; avoid explaining Strike mechanics unless that context helps the
user decide what to do next.

## Purpose

Pressure-test a brainstormed project until the important product, technical,
workflow, domain, language, and model-shape decisions are clear enough for
spec.

Grill thinks through the work like a decision tree, but it records the pruned
tree: current decisions, rejected paths, assumptions, candidate language, and
open questions. The durable output is `outputs/grill/grill.md`, not the chat
transcript.

## Host Invocation

When showing follow-up Strike skills, use the plugin package's
`references/invocation.md` to render the current host's syntax. Do not copy
`/strike:*` examples unchanged unless the current host is Claude Code. When
the host is unknown, show the skill name and arguments as a plain next action
without raw field labels.

## User Customization

Before doing any material grill work, you MUST run the repo-local customization
loader from the consuming repository root:

```bash
test -f strike/customize/system/customize.mjs || { echo 'Strike is not initialized in this repo yet. Run the Strike `init` skill first.'; exit 1; }
node strike/customize/system/customize.mjs --repo-root <repo-root> preview grill
```

## Minimal Mechanics

Board location is state. This skill may work only when the card pointer is in:

```txt
docs/strike/board/02-grill/<project-slug>.md
```

If the pointer is in another lane, stop and recommend:

```txt
Reset context first: yes
Next Strike skill: go
Arguments: <project-slug>
```

Do not write spec, slices, implementation, acceptance, retro, implementation
files, repo glossary edits, durable IDs, YAML blocks, or machine-readable
routing metadata.

## Reads

- board pointer
- `cards/<project-slug>/card.md`
- `cards/<project-slug>/outputs/brainstorm/brainstorm.md`
- existing `cards/<project-slug>/outputs/grill/grill.md` if present
- `UBIQUITOUS_LANGUAGE.md` if present
- focused repo/docs context when facts affect the question

If a question can be answered from code or docs, inspect instead of asking the
user. Ask only for intent, preferences, tradeoffs, or decisions the repo cannot
know.

## Writes

- `cards/<project-slug>/outputs/grill/grill.md`
- optional user-requested docs/assets under
  `strike/user-docs/<project-slug>/grill/...`,
  `strike/user-docs/shared/...`, or another repo-safe path the current user
  explicitly provides or confirms
- `cards/<project-slug>/card.md`
- board pointer moved from `02-grill` to `03-research` when evidence or
  guidance is needed before spec
- board pointer moved from `02-grill` to `04-spec` when research is unnecessary
  and spec can continue after a context reset

Use a normal filesystem move, not `git mv`, and verify exactly one pointer file
exists for the project slug after moving.

## Conversation

Ask one consequential question at a time. For each question:

- briefly frame why it matters
- provide a recommended answer
- show real alternatives only when they help the user decide
- use concrete scenarios for abstract decisions
- wait for the user's answer before moving to the next branch

Good grill questions resolve product, technical, workflow, domain, or
build-shaping uncertainty. Avoid asking every possible question. Use these
areas as a menu, not a checklist:

- affected user, system, or workflow and success
- scope and non-goals
- domain language
- core noun and schema/model shape
- user, operator, command, integration, or system flow
- state and lifecycle
- ownership and permissions
- data relationships
- business rules
- failure cases
- UI states when relevant
- CLI/API/docs/tooling behavior when relevant
- integrations when relevant
- validation and success evidence

## Editorial Or Content Choices

Do not turn editorial details into broad homework for the user.

If a branch needs examples, project candidates, content topics, or copy
directions, first inspect the available product, technical, workflow, or repo
context and recommend a tiny candidate set. Ask the user to approve, prune, or
replace it.

Grill keeps asking until spec has the decisions it needs. If a choice affects
what the project is, who or what it serves, what it promises, what is in or
out, how success is judged, or what the first build means, resolve it in grill
and write the current decision to `grill.md`.

Once the underlying decision is made, spec can handle drafting details inside
the recorded constraints. Record the constraints in `grill.md` (tone, length,
terms to use or avoid, promise boundaries, or examples) and let spec draft
within those boundaries without re-interviewing the user. If a "wording" choice
would change the project, resolve it in grill.

## Language And Modeling

If `UBIQUITOUS_LANGUAGE.md` exists, read it lightly before naming or
model-shape decisions. If it is absent, continue without glossary context.
Challenge vague, overloaded, or conflicting terms in the moment:

```txt
You said "job"; the glossary uses "Task" for planned work and "Run" for one
execution attempt. Which one do you mean here?
```

Use the Core Noun Before Qualifiers lens when naming things, defining domain
language, or sketching schema concepts. If the language starts creating
adjective-noun siblings such as `ManualReport` / `ScheduledReport` or
`PublicAsset` / `PrivateAsset`, pause and ask whether the qualifiers are
better represented as fields, tags, enums, booleans, numeric dials,
constraints, configuration, relationships, permissions, state, placement,
ownership, or usage context.

This is not a rule against separate models. It is a reflection step. If the
single-core-noun version seems plausible, discuss it with the user before
committing to separate entities or canonical terms.

Do not edit `UBIQUITOUS_LANGUAGE.md`. Record Project-local terms and candidate
repo language in `grill.md`. Recommend the `language` skill when the user
wants to promote, revise, trace, or assess repo-wide language.

## Optional Demo Support

If a decision is easier to understand visually, you may suggest or create a
small planning demo using the `demo` skill guidance. Treat demos as optional
thinking aids. Do not make them required grill output.

## Optional Research Routing

Research is optional. Route to the `research` skill only when evidence or
guidance can materially improve the spec.

Good reasons to route to research:

- codebase precedent needs verification
- current official docs, pinned-version behavior, or idiomatic implementation
  matters
- broad architecture options need tradeoff research
- domain/modeling pitfalls could change scope, rules, or schema shape
- UX/comparable-product research would sharpen the spec
- tool, library, vendor, or service choice is genuinely open

Do not route to research just to confirm decisions that already stand.

If research is needed, record the focused research questions in `grill.md` and
move the card to `03-research`. If research is unnecessary, say so briefly in
`grill.md` or the final response and move the card to `04-spec`.

## Write As Decisions Crystallize

Do not wait until the end of the session to reconstruct decisions from memory.

When the user resolves a consequential decision, update `outputs/grill/grill.md`
before moving to the next branch. The artifact is the durable memory across
a context reset.

## Current Truth, Not Audit Trail

`grill.md` is the current decision record, not a history log.

If the user changes their mind, update the existing decision so it reflects the
final choice. Remove stale decision text that would confuse spec. Keep rejected
options only when they still explain the current decision.

Do not append contradiction history like "Earlier we decided X, but later Y"
unless that history is necessary to understand the final domain choice.

## Artifact Shape

Use this shape as a loose guide. Omit empty sections.

```md
# Grill

## Decision Summary

- [One-line summary of what is now decided.]

## Decisions

### [Short Decision Name]

Decision: [What we chose.]
Why: [Why this is the current best answer.]
Rejected: [Main alternatives and why.]
Impacts: [Spec/scope/schema/language/UI/API/CLI/workflow implications.]
Confidence: [High / Medium / Low.]
Revisit if: [What would make this decision worth reopening.]

## Candidate Language

- [Term]: [meaning].
- [Term]: [note if Project-local or candidate repo language.]

## Assumptions

- [Assumption] - [why acceptable for now.]

## Spec-Owned Details

- [Detail spec can safely choose] - [constraints spec must preserve.]

## Research Needs

- [Question] - [why research should happen before spec.]

## Spec Handoff

- [What spec should treat as decided.]
- [What spec should preserve as unresolved.]
```

## Card Update

When grill is ready for spec:

- mark the grill checklist item complete
- if research is needed, add a research checklist item if missing:
  `- [ ] Research: gather evidence and guidance for spec.`
- if research is unnecessary, add a spec checklist item if missing:
  `- [ ] Spec: write the durable Project source of truth.`
- summarize key decisions under `Constraints And Decisions`
- move resolved questions out of `Open Questions`
- leave only real open questions visible
- move the board pointer to `03-research` when research is needed, otherwise
  `04-spec`

When grill is not ready:

- keep grill unchecked
- add or refine checklist items for missing decisions
- keep blocking questions visible in `card.md`
- leave the board pointer in `02-grill`

## Exit Test

Before moving on, reread `grill.md` as if the chat transcript is gone.
Move only when:

- every real decision made in the session is captured
- stale or reversed decisions are removed or rewritten
- remaining questions are either blocking in grill, research-needed, or safe
  spec-owned details that do not change project meaning
- candidate repo language is recorded without mutating `UBIQUITOUS_LANGUAGE.md`
- the next step can continue after a context reset without re-interviewing the
  user on product, technical, or workflow intent, affected audience or system,
  scope, boundaries, model shape, success, or first build meaning
- any needed pre-spec research questions are focused enough for
  the `research` skill

If any decision would need to be rediscovered, update `grill.md` before moving.

## Output

Final response should be short and user-facing:

- grill path written
- whether the card moved to `03-research`, moved to `04-spec`, or stayed in
  `02-grill`
- key decisions captured or missing decision gaps
- next prompt, rendered for the current host with `references/invocation.md`:
  - moved to `03-research`: recommend `research <project-slug>` and also show
    the skip path `research <project-slug> skip`
  - moved to `04-spec`: recommend `spec <project-slug>` and mention optional
    research first with `research <project-slug>`
  - stayed in `02-grill`: show `grill <project-slug>`

Do not show raw handoff fields such as `Reset context first`, `Next Strike
skill`, or `Arguments`.

## Gates

- Do not write spec, slice, implementation, review, acceptance, or retro files.
- Do not write implementation files.
- Do not edit `UBIQUITOUS_LANGUAGE.md`.
- Do not create durable IDs or hidden state fields.
- Do not move to spec if `grill.md` loses decisions made in the conversation.
