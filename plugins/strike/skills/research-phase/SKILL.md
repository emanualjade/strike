---
name: research-phase
description: Run and audit official phase-level implementation research after a phase spec and before slicing, inheriting initiative research and filling only phase-specific gaps.
argument-hint: "[phase spec/context]"
disable-model-invocation: true
allowed-tools: Read Write Edit Bash Grep Glob WebFetch WebSearch Agent
---

# Research Phase

Run the official implementation research gate for one phase before slicing.

This step uses the phase spec as the target. It is not the initiative research
gate, the phase spec, slice creation, or slice planning.

## Inputs

- current phase's `phase-spec.md`
- main spec and development plan when relevant
- initiative research index, relevant reports, and relevant audits
- supporting artifacts relevant to this phase, when present
- legacy slice research files from
  `phases/<phase-id>/slices/<slice-id>/research.md`, when an upgraded
  workspace already has them
- optional repo paths or product context

## What Matters

- Start from initiative research. Read `research/index.md` and any relevant
  per-item reports and audit files it references before doing new research.
- When an upgraded workspace contains legacy slice `research.md` files, inspect
  them before writing phase research. Fold still-valid slice facts into the
  phase research or explicitly supersede them with current phase research.
- Do not duplicate research already covered by passing or accepted-risk
  initiative research.
- Use this step to fill phase-specific implementation gaps that affect slicing:
  granular API/model/provider capabilities, repo architecture patterns, schema
  or migration concerns, file/blob/job/queue/persistence flows, auth or
  permission constraints, testing/E2E/browser environment constraints, and risks
  that affect slice boundaries.
- Research the official canonical, idiomatic, recommended way to use the
  specific third-party APIs, packages, plugins, SDKs, models, or platform
  features this phase will touch. Initiative research may prove a provider is
  viable; phase research should answer the more granular "how should we use this
  exact API/plugin/feature correctly here?" questions.
- Capture recommended usage patterns, integration flows, lifecycle expectations,
  error handling, data model implications, limits, unsupported cases, and
  provider-endorsed examples when they affect the phase.
- For mature domains such as payments, refunds, coupons, invoices, accounting,
  taxes, subscriptions, credits, ledgers, reconciliation, auth, privacy, or
  permissions, research the specific domain rule or official provider guidance
  that applies to this phase instead of inventing a local interpretation.
- For external, current, unstable, or high-stakes facts, use official or primary
  sources when available. Label weak evidence as weak or unknown.
- For repo facts, inspect actual files and name representative paths. Check
  existing flow, run-step, upload, render, persist, migration, fixture, seed,
  test, and environment patterns before recommending implementation direction.
- If no additional phase-specific research is needed, say so plainly and explain
  which initiative research already covers the phase.
- Keep the artifact concise. Record implications for slicing, not a research
  diary.

## Phase Research Audit

Audit the finished phase research before it can say `Ready for slicing: yes`.

- Use a separate read-only reviewer for the finished phase research.
- Give the audit reviewer the phase spec, finished `research.md`, relevant
  initiative research reports and audits, relevant supporting artifacts, and the
  source/repo expectations. Do not give it private reasoning or excuses from the
  research pass.
- The reviewer must check phase research against official or primary source docs
  for external APIs/models/services, actual repo code for local architecture and
  data/file/queue/migration/provider/persistence patterns, and the cited sources
  in `research.md`.
- The reviewer must also check whether the phase research missed granular
  official/canonical/idiomatic usage for the exact APIs, packages, plugins, SDKs,
  models, provider features, and domain mechanics this phase touches.
- The reviewer must not edit files. The main research agent assesses findings,
  fixes `research.md`, and writes the final audit artifact.

Use this audit prompt shape:

```text
Read-only audit this phase research against the phase spec, official/primary
source docs, cited sources, initiative research reports/audits, and actual repo
code. Verify each material claim and whether the research covers the canonical,
idiomatic way to use the exact APIs, packages, plugins, SDKs, models, provider
features, and domain rules this phase touches. Return accurate claims,
unsupported/stale/overstated/contradicted claims, missing source-backed facts,
missing repo precedent or files that should have been inspected, severity
Must Fix / Follow-Up / Accepted Risk, exact affected research sections or claims,
and source links or repo paths used as evidence. Do not edit files.
```

## Process

1. Read the phase spec and relevant initiative research.
2. Identify phase-specific unknowns that would change slice boundaries,
   implementation direction, verification, or risk.
3. For each unknown, first check whether initiative research already covers it.
4. Research only the remaining phase-specific gaps, with emphasis on granular
   API/package/plugin/model behavior, canonical usage patterns, and relevant
   domain rules.
5. Inspect repo precedent when the phase touches data, schema, migrations,
   files/blobs, queues/jobs, providers, auth, permissions, tests, browser
   checks, or shared architecture.
6. Write a draft `research.md` with a concise baseline, findings, slicing
   implications, and readiness result.
7. Run the read-only phase research audit.
8. Fix `research.md` for audit `Must Fix` findings, record any accepted risk,
   and write `research-audit.md`. If `research.md` changes after audit findings
   are returned, rerun the phase research audit and use the fresh audit result
   before writing `Ready for slicing: yes`.

## Output

Write phase research to:

```text
strike/initiatives/<initiative-id>/phases/<phase-id>/research.md
```

Write the phase research audit to:

```text
strike/initiatives/<initiative-id>/phases/<phase-id>/research-audit.md
```

Use this shape:

```md
# Phase Research

## Research Basis
Initiative research used:
Relevant audits:
Supporting artifacts:

## Additional Phase Research
Additional phase research needed: yes / no
Reason:

## Findings
- Source:
  Finding:
  Slicing / planning implication:
- None. Use this when no additional phase-specific research was needed.

## Repo Patterns
- Files inspected:
  Pattern to reuse:
  Pattern not to copy:
- None. Use this only when no repo precedent is relevant.

## Slice Boundary Implications
- None.

## Questions Or Blockers
- None.

## Research Audit
Audit file: research-audit.md
Verdict: pass / needs-fix / accepted-risk
Must Fix count:
Notes:

## Ready For Slicing
Ready for slicing: yes / no
Reason:
```

Use this audit shape:

```md
# Phase Research Audit

## Scope

## Sources / Repo Evidence Checked
- Source or file:
  Why checked:

## Review Status
Review results returned: yes / no

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
Must Fix count:
Reason:
```

## Rules

- Research one phase.
- Do not create slices, slice plans, implementation files, tests, or
  verification artifacts.
- Do not silently redo initiative-level research. Inherit it, then add only
  phase-specific deltas.
- Do not treat supporting artifacts as hidden source of truth. Use them to
  understand reasoning and constraints already represented upstream.
- Prefer official or primary sources for external, current, or high-stakes
  facts.
- Do not write `Ready for slicing: yes` unless `research-audit.md` exists,
  `research.md` has a `## Research Audit` entry, the audit says
  `Review results returned: yes`, the audit verdict is `pass` or
  `accepted-risk`, and `Must Fix count: 0`.
- If `research.md` changes after audit findings are returned, rerun the phase
  research audit before writing `Ready for slicing: yes`.
- If a material phase fact is missing and cannot be resolved, write
  `Ready for slicing: no` and record the blocker.
- If a product, security, data, permission, architecture, or phase-boundary
  decision is needed, write `Ready for slicing: no` and name the decision.
- In `## Ready For Slicing`, write `Ready for slicing: yes` only when the phase
  can be sliced without guessing about phase-specific implementation facts.
