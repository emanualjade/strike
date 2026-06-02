---
name: research-initiative
description: Run mandatory pre-grill research for an initiative, including user-approved research scope, per-topic reports, and a concise research index for later decisions and planning.
argument-hint: "[idea/context] [--output-dir path]"
disable-model-invocation: true
allowed-tools: Read Write Edit Bash Grep Glob WebFetch WebSearch
---

# Research Initiative

Run the pre-grill research gate for an initiative.

This step makes consequential facts available before the idea is grilled. It is
not the grill, spec, phase plan, or slice research.

## Inputs

- refined idea, usually `idea.md`
- optional repo paths or product context
- optional output directory, usually `strike/initiatives/<initiative-id>/research/`

## Process

1. Read the refined idea and `PROJECT_LANGUAGE.md`.
2. Do light reconnaissance to identify research topics. Inspect enough repo
   context to recognize external APIs, models, database/schema concerns, queues,
   files/uploads, auth, payments, provider integrations, platform constraints,
   and existing architecture surfaces.
3. Propose a concrete research scope in `research/scope.md`. Use one item per
   dependency, model, API, provider, repo pattern, schema/data concern, or other
   material unknown. Do not combine distinct provider/model capabilities into
   one vague item.
4. Initiate a user checkpoint before running the full research. Tell the user
   what you think should be researched, why, and ask what to add, remove, or
   refocus.
5. Wait for the user's answer. Update `research/scope.md` with their response
   and the approved scope.
6. Research each approved item independently and write one concise report per
   item under `research/`.
7. Write `research/index.md` as the rollup used by Grill, Main Spec, phase
   specs, and slice planning.

## Research Scope

The scope must be specific enough to prevent accidental under-research.

Examples of separate items:

- `openai-image-generation`
- `nano-banana-pro`
- `nano-banana-2`
- `repo-image-generation-pipeline`
- `repo-file-upload-and-persist-pattern`
- `repo-database-migrations`
- `inngest-payload-boundaries`

Bad scope shapes:

- `AI models`
- `image stuff`
- `look at APIs`
- `check the repo`

## Evidence Rules

- For third-party APIs, models, frameworks, SDKs, cloud services, standards, or
  other current/unstable facts, use official or primary sources when available.
- For OpenAI APIs and models, use official OpenAI documentation or source-backed
  OpenAI references when available.
- For provider/model work, capture capabilities and constraints individually:
  supported inputs, outputs, sizes/aspect ratios, formats, parameters, limits,
  lifecycle, failure modes, unsupported cases, and cost/rate-limit implications
  when knowable.
- For repo research, inspect actual files. Record representative files reviewed
  and the existing pattern to reuse.
- For database/schema work, inspect existing schema, migration, seed, fixture,
  and environment patterns. Do not recommend ad hoc schema fixes.
- For file/blob/image/PDF/large-payload workflows, inspect existing flow,
  upload/store, render, persist, queue, and job helpers before proposing any
  data movement.
- Label weak or missing evidence as unknown. Do not fill gaps with guesses.

## Output

Write all artifacts under:

```text
strike/initiatives/<initiative-id>/research/
```

### `scope.md`

Use this shape:

```md
# Initiative Research Scope

## Source Inputs
-

## Research Items
- ID:
  Topic:
  Category:
  Why it matters:
  Questions to answer:
  Expected sources:

## Not Researching
-

No material research needed: yes / no

## User Checkpoint
Prompt:
User response:
Ready to research: yes / no
```

### Per-item reports

Use stable lowercase kebab-case filenames such as
`openai-image-generation.md`.

Use this shape:

```md
# Research: <Topic>

## Scope

## Sources
- Source:
  Date checked:
  Why this source:

## Findings
- Finding:
  Evidence:
  Implication:

## Capability / Constraint Summary
- Supported:
- Unsupported:
- Unknown:
- Limits / caveats:

## Existing Repo Pattern
- Files inspected:
- Pattern to reuse:
- Pattern not to copy:

## Decisions For Grill
-

## Planning Implications
-
```

Omit `## Existing Repo Pattern` only when the item is purely external and no
repo precedent is relevant.

### `index.md`

Use this shape:

```md
# Initiative Research Index

## Reports
- ID:
  File:
  Topic:
  Status: complete / partial / not needed

## Capability Matrix
| Item | Supported | Unsupported | Unknown | Implementation implication |
| --- | --- | --- | --- | --- |

## Cross-Cutting Constraints
-

## Decisions For Grill
-

## Spec / Planning Inputs
-

## Open Questions
-

## Ready For Grill
Ready for grill: yes / no
Reason:
```

If no material research is needed, still write `scope.md` and `index.md`.
`scope.md` must show the user confirmed that no pre-grill research is needed
and say `No material research needed: yes`. `index.md` should say
`Ready for grill: yes` and explain why.

## Rules

- Do not run Grill from this skill.
- Do not create `decisions.md`, `main-spec.md`, phases, slices, code, tests, or
  verification artifacts.
- Do not compress multiple material dependencies into one report.
- Do not let a provided plan, schema, previous decision file, or repo doc skip
  the user checkpoint.
- Do not complete this gate until `scope.md` records a user response and
  `Ready to research: yes`.
- Do not write `Ready for grill: yes` unless the approved reports are enough for
  Grill to make decisions without guessing about material dependencies.
- If research reveals an unresolved consequential question, write `Ready for
  grill: no`, list the blocker in `Open Questions`, and ask the user before
  continuing.
