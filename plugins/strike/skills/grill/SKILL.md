---
name: grill
description: Drive focused product and engineering decisions before spec writing.
argument-hint: "[feature-slug]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, MultiEdit, Bash, Grep, Glob
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

Pressure-test a brainstormed feature until the important product, domain,
language, and model-shape decisions are clear enough for spec.

Grill thinks through the work like a decision tree, but it records the pruned
tree: current decisions, rejected paths, assumptions, candidate language, and
open questions. The durable output is `outputs/grill/grill.md`, not the chat
transcript.

## Host Invocation

When showing follow-up Strike skills, use the plugin package's
`references/invocation.md` to render the current host's syntax. Do not copy
`/strike:*` examples unchanged unless the current host is Claude Code. When
the host is unknown, show the canonical handoff first.

## Minimal Mechanics

Board location is state. This skill may work only when the card pointer is in:

```txt
docs/strike/board/02-grill/<feature-slug>.md
```

If the pointer is in another lane, stop and recommend:

```txt
Reset context first: yes
Next Strike skill: go
Arguments: <feature-slug>
```

Do not write spec, slices, implementation, acceptance, retro, app code, project
glossary edits, durable IDs, YAML blocks, or machine-readable routing metadata.

## Reads

- board pointer
- `cards/<feature-slug>/card.md`
- `cards/<feature-slug>/outputs/brainstorm/brainstorm.md`
- existing `cards/<feature-slug>/outputs/grill/grill.md` if present
- `UBIQUITOUS_LANGUAGE.md` if present
- focused repo/docs context when facts affect the question

If a question can be answered from code or docs, inspect instead of asking the
user. Ask only for product intent, preferences, or decisions the repo cannot
know.

## Writes

- `cards/<feature-slug>/outputs/grill/grill.md`
- `cards/<feature-slug>/card.md`
- board pointer moved from `02-grill` to `03-research` when evidence or
  guidance is needed before spec
- board pointer moved from `02-grill` to `04-spec` when research is unnecessary
  and spec can continue after a context reset

Use a normal filesystem move, not `git mv`, and verify exactly one pointer file
exists for the feature slug after moving.

## Conversation

Ask one consequential question at a time. For each question:

- briefly frame why it matters
- provide a recommended answer
- show real alternatives only when they help the user decide
- use concrete scenarios for abstract decisions
- wait for the user's answer before moving to the next branch

Good grill questions resolve product, domain, or build-shaping uncertainty.
Avoid asking every possible question. Use these areas as a menu, not a checklist:

- user and success
- scope and non-goals
- domain language
- core noun and schema/model shape
- user flow
- state and lifecycle
- ownership and permissions
- data relationships
- business rules
- failure cases
- UI states when relevant
- integrations when relevant
- validation and success evidence

## Editorial Or Content Choices

Do not turn editorial details into broad homework for the user.

If a branch needs examples, feature candidates, content topics, or copy
directions, first inspect the available product context and recommend a tiny
candidate set. Ask the user to approve, prune, or replace it.

Grill keeps asking until spec has the decisions it needs. If a choice affects
what the feature is, who it serves, what it promises, what is in or out, how
success is judged, or what the first build means, resolve it in grill and write
the current decision to `grill.md`.

Once the underlying decision is made, spec can handle drafting details inside
the recorded constraints. Record the constraints in `grill.md` (tone, length,
terms to use or avoid, promise boundaries, or examples) and let spec draft
within those boundaries without re-interviewing the user. If a "wording" choice
would change the feature, resolve it in grill.

## Language And Modeling

If `UBIQUITOUS_LANGUAGE.md` exists, read it lightly before naming or
model-shape decisions. If it is absent, continue without glossary context.
Challenge vague, overloaded, or conflicting terms in the moment:

```txt
You said "account"; the glossary uses "User" for auth identity and
"Organization" for tenant. Which one do you mean here?
```

Use the Core Noun Before Qualifiers lens when naming things, defining domain
language, or sketching schema concepts. If the language starts creating
adjective-noun siblings such as `FixedAdSlot` / `FlexibleAdSlot` or
`PublisherImage` / `AdvertiserImage`, pause and ask whether the qualifiers are
better represented as fields, tags, enums, booleans, numeric dials,
constraints, configuration, relationships, permissions, state, placement,
ownership, or usage context.

This is not a rule against separate models. It is a reflection step. If the
single-core-noun version seems plausible, discuss it with the user before
committing to separate entities or canonical terms.

Do not edit `UBIQUITOUS_LANGUAGE.md`. Record feature-local terms and candidate
project language in `grill.md`. Recommend the `language` skill when the user
wants to promote, revise, trace, or assess project-wide language.

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

Do not route to research just to confirm decisions that already stand. Do not
make small dogfood features perform fake research.

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
Impacts: [Spec/scope/schema/language/UI implications.]
Confidence: [High / Medium / Low.]
Revisit if: [What would make this decision worth reopening.]

## Candidate Language

- [Term]: [meaning].
- [Term]: [note if feature-local or candidate project language.]

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
  `- [ ] Spec: write the durable feature source of truth.`
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
  spec-owned details that do not change feature meaning
- candidate project language is recorded without mutating `UBIQUITOUS_LANGUAGE.md`
- the next step can continue after a context reset without re-interviewing the user on
  product intent, audience, scope, boundaries, model shape, success, or first
  build meaning
- any needed pre-spec research questions are focused enough for
  the `research` skill

If any decision would need to be rediscovered, update `grill.md` before moving.

## Output

Final response should be short:

- grill path written
- whether the card moved to `03-research`, moved to `04-spec`, or stayed in
  `02-grill`
- key decisions captured or missing decision gaps
- next action:
  - if moved to `03-research`, show the recommended research handoff plus the
    skip path:
    ```txt
    Reset context first: yes
    Next Strike skill: research
    Arguments: <feature-slug>
    ```
    Or skip research and go straight to creating the spec:
    ```txt
    Reset context first: yes
    Next Strike skill: research
    Arguments: <feature-slug> skip
    ```
  - if moved to `04-spec`, show the spec handoff and optional research:
    ```txt
    Reset context first: yes
    Next Strike skill: spec
    Arguments: <feature-slug>
    ```
    Optional before spec:
    ```txt
    Reset context first: yes
    Next Strike skill: research
    Arguments: <feature-slug>
    ```
  - if still in `02-grill`, show the focused rerun handoff:
    ```txt
    Reset context first: yes
    Next Strike skill: grill
    Arguments: <feature-slug>
    ```

## Gates

- Do not write spec, slice, implementation, review, acceptance, or retro files.
- Do not write app code.
- Do not edit `UBIQUITOUS_LANGUAGE.md`.
- Do not create durable IDs or hidden state fields.
- Do not move to spec if `grill.md` loses decisions made in the conversation.
