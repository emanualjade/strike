---
name: fix
description: Fix issues from a failed Strike verification pass, then return to the same verifier.
argument-hint: "[failed verification context]"
disable-model-invocation: true
allowed-tools: Read Write Edit MultiEdit Bash Grep Glob WebFetch WebSearch Agent
---

# Fix

Fix issues from a failed Strike verification pass.

## Inputs

- failed verification artifact
- current initiative, phase, or slice artifacts named by the verifier
- prior fix reports for the same verifier, when present
- Required user-provided customization from the consuming repo's Strike
  workspace:
  - user implementation-discipline guidance:
    - `strike/user-guidance/implementation-discipline/global.md`
    - `strike/user-guidance/implementation-discipline/fix.md`
- repo files, commands, or paths needed to understand and repair the issue

## Process

- Read the failed verification artifact first.
- Read required user-provided customization and apply relevant guidance to the
  repair:
  - `strike/user-guidance/implementation-discipline/global.md`
  - `strike/user-guidance/implementation-discipline/fix.md`
- Fix the verifier's `Must Fix` items. They may be broken behavior,
  incomplete accepted scope, missing evidence, weak artifacts, or regressions.
- Treat `P0` and `P1` `Must Fix` items as required before the verifier can
  pass. Treat `P2` and `P3` findings as follow-up unless the verifier says they
  are required by accepted scope.
- Read whatever project docs, artifacts, code, or source-backed references are
  needed to fix the real issue.
- Before patching a technical symptom, search the codebase for how this repo
  already handles the same class of problem. Use error terms, provider names,
  object names, workflow step names, storage/upload paths, and nearby adapters or
  callers as search anchors.
- If the repair creates or modifies utilities, helpers, adapters, schemas, or
  shared modules, search for existing repo patterns and inspect likely callers
  before editing.
- For integration, provider, workflow, upload, asset, storage, queue, job,
  callback, webhook, or dataflow repairs, name the existing repo precedent used
  or record that none was found before making code changes.
- Keep the repair focused on passing the failed verification, not expanding the
  feature.
- Repairs may deviate from the planned route under the same contract as
  `build-slice`: stay inside the accepted boundary and acceptance criteria,
  create no new product outcome, make no user-class decision, and record the
  deviation in the fix report. When the repair cannot stay inside that
  contract, write `Fixed: no` with route-back so Strike can adjust the
  boundary and return to this verifier. Ask the user only when the repair
  needs a decision Strike cannot safely make.
- Treat `Follow-Up` and `Accepted Risk` items as context. Do not fix them unless
  they are necessary to resolve a `Must Fix` item.
- Review prior fix reports for the same verifier. If the same issue repeats
  after a reasonable repair attempt, write `Fixed: no` with the repeated issue
  instead of broadening the work.
- Run focused checks that prove the repair, plus any repo-level check that is
  appropriate for the changed surface.
- When diagnosing or repairing the failure teaches a durable lesson about a
  package, framework, provider, or tooling surface, write it back to
  `strike/research/` following the plugin's `references/research-library.md`.
- Name the re-verification scope in `## Return`: the failed evidence
  categories plus the repair's changed surfaces, so the verifier can re-run
  only what the failure and the fix touched. Write `full` when the repair
  reached beyond the failed scope.
- When the repair requires a real user, product, data, security, accounting,
  scope, or architecture decision, write `Fixed: no`, explain the needed
  decision, and return to the verifier or route-back flow without inventing the
  answer.
- When the repair would edit audited phase `research.md` or
  `research-audit.md`, write `Fixed: no` with `Route Back` to
  `phaseResearchComplete` so Strike reruns the phase research step and its audit.
- If the issue belongs to an earlier workflow step instead of a contained
  repair, write `Fixed: no` and fill in `## Route Back`.

## Output

Write a compact fix report next to the affected workflow evidence.

Use the next unused numeric path:

```text
strike/initiatives/<initiative-id>/phases/<phase-id>/slices/<slice-id>/fixes/fix-001.md
strike/initiatives/<initiative-id>/phases/<phase-id>/fixes/fix-001.md
strike/initiatives/<initiative-id>/fixes/fix-001.md
```

Use the most local path that matches the failed verification.

Use this shape:

```md
# Fix

## Source Verification
Verifier:
Artifact:

## Fix Status
Fixed: yes / no
Reason:

## Issues Addressed
- I1 —

## Changes Made
-
- Plan deviations: None / <short note>

## Repo Precedent
Searched:
Closest existing pattern:
How the repair follows or intentionally differs:

## Checks
-

## Not Fixed / Blockers
- None.

## Follow-Up / Accepted Risk
- None.

## Return
Verifier:
Artifact:
Re-verification scope: full / <failed evidence categories and the repair's changed surfaces>
Ready for re-verification: yes / no

## Route Back
Needed: yes / no
Command: None / reopen-check / reopen-phase-check / reopen-slice-check
Phase: None / <phase-id>
Slice: None / <slice-id>
Check: None / <state-check>
Reason:
```

## Rules

- Fix only from a failed verification artifact.
- Use one of three outcomes: `Fixed: yes` and return to the same verifier;
  `Fixed: no` with `Route Back` when an earlier workflow step owns the repair;
  or `Fixed: no` without route-back only for a genuinely unresolved decision.
- When writing route-back, use the exact helper command Strike should run.
  Use `reopen-check` for the current scope, `reopen-phase-check` for a phase
  check, and `reopen-slice-check` for a specific slice check.
- Do not decide that the work is verified. The same verifier must run again.
- Do not complete workflow state checks.
- Do not chase open-ended improvements.
- Do not treat a failed check, provider response, workflow error, payload limit,
  upload/storage issue, or dataflow mismatch as novel until you have searched
  the repo for existing handling of that class of problem.
- Do not hide accepted-scope defects as follow-up work.
- Do not rewrite the failed verification artifact; it remains the source for
  this repair loop.
- Preserve unrelated user work.
