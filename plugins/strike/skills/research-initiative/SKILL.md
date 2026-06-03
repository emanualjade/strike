---
name: research-initiative
description: Run mandatory pre-grill research for an initiative, including user-approved research scope, per-topic reports, and a concise research index for later decisions and planning.
argument-hint: "[idea/context] [--output-dir path]"
disable-model-invocation: true
allowed-tools: Read Write Edit Bash Grep Glob WebFetch WebSearch Agent
---

# Research Initiative

Run the pre-grill research gate for an initiative.

This step makes consequential facts available before the idea is grilled. It is
not the grill, spec, phase research, phase plan, or slice planning.

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
6. Research each approved item independently and write one final-quality report
   per item under `research/`. Use a separate research pass for each approved
   item and keep findings isolated by item.
7. Audit each report independently before writing the final index. Use a
   separate read-only audit reviewer per approved item.
8. Assess audit findings, fix the reports, and update each report's audit
   status. Do not delegate the final acceptance decision to the audit reviewer.
9. Write `research/index.md` as the rollup used by Grill, Main Spec, phase
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

## Research Pass

Treat each approved item as a final-quality research assignment. The research
worker or inline pass should receive the item scope, expected sources, and
relevant repo paths only. Do not tell the research worker to rely on a later
audit. Use this prompt shape:

```text
Produce a final-quality research report for this approved research item.
Every material claim must be source-backed or marked unknown. For external
facts, prefer official or primary sources. For repo facts, inspect actual files
and name representative paths. Do not combine this item with other research
items.
```

## Research Audit

Audit each per-item report before `research/index.md` can say
`Ready for grill: yes`.

- Use a separate read-only reviewer per approved report.
- Give the audit reviewer the finished report, the approved item scope, and the
  relevant source/repo expectations. Do not give it the research worker's
  private reasoning or excuses.
- The reviewer must verify the report against official or primary source docs
  for external APIs/models/services, actual repo code for local architecture and
  data/file/queue/migration/provider/persistence patterns, and the report's own
  cited sources.
- The reviewer must not edit files. The main research agent assesses findings,
  fixes reports, and writes the final audit rollup.

Use this audit prompt shape:

```text
Read-only audit this research report against official/primary source docs and
the actual repo code. Verify each material claim. Return accurate claims,
unsupported/stale/overstated/contradicted claims, missing source-backed facts,
missing repo precedent or files that should have been inspected, severity
Must Fix / Follow-Up / Accepted Risk, exact affected report sections or claims,
and source links or repo paths used as evidence. Do not edit files.
```

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

## Audit Status
Audit: pass / needs-fix / accepted-risk
Audit file:
Fixes applied:
Accepted risks:
```

Omit `## Existing Repo Pattern` only when the item is purely external and no
repo precedent is relevant.

### Per-item audits

Write audit files under `research/audits/` using stable lowercase kebab-case
filenames that match the report ID, such as `audits/openai-image-generation.md`.

Use this shape:

```md
# Research Audit: <Topic>

## Scope

## Sources / Repo Evidence Checked
- Source or file:
  Why checked:

## Accurate Claims
-

## Issues
### Must Fix
-

### Follow-Up
-

### Accepted Risk
-

## Verdict
Verdict: pass / needs-fix / accepted-risk
Reason:
```

### `index.md`

Use this shape:

```md
# Initiative Research Index

## Reports
- ID:
  File:
  Topic:
  Status: complete / partial / not needed

## Research Audit
- ID:
  Report:
  Audit file:
  Verdict: pass / needs-fix / accepted-risk
  Must Fix count:
  Notes:

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
- Do not write `Ready for grill: yes` unless every approved research item has a
  report, an audit file, a `## Research Audit` entry, and no unresolved audit
  `Must Fix` findings.
- If research reveals an unresolved consequential question, write `Ready for
  grill: no`, list the blocker in `Open Questions`, and ask the user before
  continuing.
