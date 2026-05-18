---
name: language
description: Assess and update repo language discovered during Strike work.
argument-hint: "[term|project-slug|path] [assess|trace|add|update|remove|clarify|apply]"
disable-model-invocation: true
allowed-tools: Read Write Edit MultiEdit Bash Grep Glob
---

# Strike Language

## Communication

When speaking to the user or asking questions, use relaxed, friendly language,
like two friends talking through the work over coffee. Explain things in simple
terms without assumptions, guide with context, and simplify concepts so the
conversation feels easy to follow. Keep the conversation centered on the work
in progress; avoid explaining Strike mechanics unless that context helps the
user decide what to do next.

## Purpose

Keep product, code, workflow, UI, docs, and planning language precise. This is
a standalone Strike utility, and it is also a soft helper that other Strike
skills may use when language affects Project planning.

Language work should feel natural: challenge confusing words when they matter,
sharpen names before they spread, and update the glossary only when a term is
actually resolved.

## Host Invocation

When showing follow-up Strike skills, use the plugin package's
`references/invocation.md` to render the current host's syntax. Do not copy
`/strike:*` examples unchanged unless the current host is Claude Code. When
the host is unknown, show the skill name and arguments as a plain next action
without raw field labels.

## User Customization

Before material language work, load repo-local customization for this skill.

Resolve the bundled customization script by absolute path from this installed
plugin package. This skill lives at `<plugin-root>/skills/language/SKILL.md`;
the script lives at `<plugin-root>/references/scripts/customize.mjs`.

Run the loader from the consuming repository root:

```bash
node <plugin-root>/references/scripts/customize.mjs --repo-root <repo-root> load language
```

Apply the printed customization packet only when it does not conflict with this
skill's Purpose, Source Of Truth, Usage Modes, Output, or Gates. Customization
may shape terminology review, glossary style, naming pressure, domain-language
discussion, and additive files. If additive language files are useful, use a
user-approved docs path; otherwise prefer the normal `UBIQUITOUS_LANGUAGE.md`
flow when a glossary edit is approved.

## Source Of Truth

Use the repo root file:

```txt
UBIQUITOUS_LANGUAGE.md
```

This file is a glossary, not a spec, scratchpad, implementation guide, or stage
artifact. It should stay readable by a human and useful to an agent after
a context reset.

If the file is missing, offer to create it only after a concrete term or
ambiguity has been resolved. Do not create an empty glossary.

## Language File Shape

Keep `UBIQUITOUS_LANGUAGE.md` simple and conversational.

Context sections group related terms:

```md
## Work Execution

### Task
Meaning: A unit of work the system creates, schedules, or tracks to completion.
Use in: code, docs, planning.
User-facing: Task.
Avoid: Job, run, process unless the system defines those separately.
Notes: Use Run only for a single execution attempt when that distinction matters.
```

Use optional fields only when useful:

- `Use in:` for code/UI/docs/planning boundaries
- `User-facing:` when UI language differs from code language
- `Code-facing:` when code language differs from user-facing language
- `Avoid:` for aliases that future agents should not introduce
- `Notes:` for subtle constraints, bounded-context splits, or migration status
- `Kind:` only when model classification clarifies the term

Keep shared sections at the bottom:

- `## Relationships`
- `## Domain Events` when event language matters
- `## Example Dialogue`
- `## Flagged Ambiguities`

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

Use when the user asks to check a Strike Project card, planning artifact, source path,
diff, branch, spec, slice, or PR for language issues.

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

Edit only `UBIQUITOUS_LANGUAGE.md` unless the user explicitly asks for code or
docs renames too. Preserve the simple glossary format. After editing, report the
terms changed and any follow-up language risks.

## Natural Strike Use

This is a utility, not a workflow stage. Do not move board pointers or create
stage outputs.

When called with a Strike project slug:

- read the board pointer if present
- read `docs/strike/cards/<project-slug>/card.md`
- read relevant planning outputs that exist, especially brainstorm, grill, spec,
  and slice files
- compare important repo language against `UBIQUITOUS_LANGUAGE.md`

When another Strike skill is working and a language issue appears, the skill
should handle the light version inline:

```txt
You said "job"; the glossary uses "Task" for planned work and "Run" for one
execution attempt. Which one do you mean here?
```

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

- `UBIQUITOUS_LANGUAGE.md` only when the user approves a concrete glossary
  change or provides exact text to apply
- optional additive customization files only at a user-approved docs path

## Output

Keep responses compact and user-facing:

- what you checked
- what language issue you found, if any
- recommended term or glossary change
- whether `UBIQUITOUS_LANGUAGE.md` was changed
- next useful action, only when one exists

## Gates

- Do not move Strike board pointers.
- Do not write brainstorm, grill, spec, slice, implementation, review,
  acceptance, or retro outputs.
- Do not edit implementation files unless the user explicitly asks for code
  renames and confirms the scope.
- Do not apply uncertain glossary changes without user approval.
- Do not create additive language files without a user-approved docs path.
