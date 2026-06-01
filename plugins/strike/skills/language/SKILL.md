---
name: language
description: Assess and update repo language discovered during Auto Strike work, utility work, or source inspection.
argument-hint: "[term|project-slug|path] [assess|trace|add|update|remove|clarify|apply]"
disable-model-invocation: true
allowed-tools: Read Write Edit MultiEdit Bash Grep Glob
---

# Strike Language

## Communication

Keep the conversation centered on the term, model, UI wording, or source
language being clarified. Avoid explaining workflow mechanics unless that
context helps the user decide what to do next.

## Purpose

Keep product, code, workflow, UI, docs, and planning language precise. This is
a standalone Strike utility, and it is also a soft helper Auto Strike may use
when language affects planning or implementation.

Language work should feel natural: challenge confusing words when they matter,
sharpen names before they spread, and update the glossary only when a term is
actually resolved.


## Source Of Truth

Use the shared language contract in the plugin package:

```txt
references/language.md
```

The consuming repo's project language file is:

```txt
PROJECT_LANGUAGE.md
```

Follow the contract's file shape, session behavior, and promotion rules. If
`PROJECT_LANGUAGE.md` is missing during standalone use, offer to create it
only after a concrete term, accepted alias, or meaningful ambiguity has been
resolved. Do not create an empty glossary during standalone language work.

## Jobs

Infer the job from the user request. If unclear, do the smallest useful thing.

### Explain

Use when the user asks what a term means or what to call something.

Read the glossary and answer with:

- canonical term
- meaning
- user-facing/code-facing split, if any
- aliases to avoid
- related terms or ambiguity notes

### Assess

Use when the user asks to check an Auto Strike artifact, source path, diff,
branch, spec, slice, or PR for language issues.

Read the glossary and the target artifact. Search code only as needed. Report:

- terms that match the glossary cleanly
- missing terms
- aliases or stale terms
- overloaded words that need clarification
- user-facing labels that conflict with known context mappings
- proposed glossary changes, if any

### Trace

Use when the user asks how a term or alias is used.

Search docs and code for the term and likely aliases. Summarize:

- where it appears
- whether usages mean the same thing
- whether code, UI, and docs agree
- whether the glossary should change

### Propose Change

Use when the user wants to add, update, remove, rename, or clarify language but
has not approved exact text yet.

Present a compact proposal:

```md
## Glossary Proposal

Add / Update / Remove: [Term]
Context: [context section]
Meaning: [one sentence]
Use in: [code / UI / docs / planning]
User-facing: [if different]
Avoid: [aliases]
Reason: [why this improves clarity]
```

End by asking whether to apply the proposal. Do not edit the glossary yet.

### Apply Approved Change

Use when the user clearly approves a specific glossary edit, or when they gave
exact text and asked you to apply it.

Edit only `PROJECT_LANGUAGE.md` unless the user explicitly asks for code or
docs renames too. Preserve the simple glossary format. After editing, report the
terms changed and any follow-up language risks.

## Natural Strike Use

This is a utility, not an Auto Strike workflow step. Do not edit Auto Strike
state or workflow artifacts unless the user explicitly asks to link a language
decision there.

When called from an Auto Strike context:

- read `auto-strike/state.json` when present
- read relevant initiative, phase, and slice docs
- compare important repo language against `PROJECT_LANGUAGE.md`

When Auto Strike is working and a language issue appears, Auto Strike should
handle the light version inline using the shared language contract.

Use the `language` skill for deeper work: term tracing, glossary updates,
branch/path scans, or messy conflicts.

## Guidance

Prefer simple, useful entries over perfect taxonomy.

Good glossary entries:

- pick one canonical term
- define what the thing is in one sentence
- list aliases to avoid
- capture user-facing versus code-facing names when they intentionally differ
- show relationships when they prevent confusion
- flag unresolved ambiguity instead of pretending it is settled

### Core Noun Before Qualifiers

Use this as a reflection lens when naming things, defining domain language, or
sketching schema concepts.

Pause if the language starts creating adjective-noun siblings such as
`ManualReport` / `ScheduledReport` or `PublicAsset` / `PrivateAsset`.
First remove the adjectives and find the core noun. Then ask whether the
qualifiers are better represented as fields, tags, enums, booleans, numeric
dials, constraints, configuration, relationships, permissions, state,
placement, ownership, or usage context.

This is not a rule against separate models. It is a moment to evaluate. If the
single-core-noun version seems plausible, discuss it with the user before
committing to separate entities or canonical terms.

Use these higher-power checks when they are genuinely useful:

- focused scans of a repo, path, diff, or branch
- term tracing through code, UI, and docs
- context mappings such as Task vs Run or config key vs display label
- proposal-before-apply for repo-wide language changes
- bounded-context ambiguity handling

Do not add:

- generic programming concepts
- implementation details that belong in code or specs
- transient Project-local wording that is not ready to become repo language
- speculative terms the user has not accepted

## Writes

- `PROJECT_LANGUAGE.md` only when the user approves a concrete glossary
  change or provides exact text to apply
- optional user-requested docs/assets under `docs/language/...` or another
  repo-safe path the current user explicitly provides or confirms

## Output

Keep responses compact and user-facing:

- what you checked
- what language issue you found, if any
- recommended term or glossary change
- whether `PROJECT_LANGUAGE.md` was changed
- next useful action, only when one exists

## Gates

- Do not write Auto Strike workflow outputs such as idea, decision, spec,
  phase, slice, plan, build, or verification artifacts.
- Do not edit implementation files unless the user explicitly asks for code
  renames and confirms the scope.
- Do not apply uncertain glossary changes without user approval.
- Do not create extra language docs/assets without clear per-project or shared
  intent and a repo-safe path.
