# Recovery

Use this only when Auto Strike state is inconsistent, interrupted, partially
missing, or contradicted by the filesystem. Recovery is not a normal phase; it
is a short truth-finding pause before the agent resumes the right phase.

## Recovery Triage

Stop broad coding and answer these from evidence:

- What exists on disk?
- What is missing?
- What is contradicted by code, docs, helper output, or current artifacts?
- What was last actually completed?
- What can be verified now?
- What is the smallest correct place to resume?

Classify each affected phase, feature, or slice:

- Complete: artifact exists, evidence exists, and checks still pass or are
  clearly recorded.
- Recoverable: enough docs, code, artifact state, or conversation context remains to
  reconstruct minimal state without guessing.
- Unverified: artifact exists but needs checks before it can be trusted.
- Missing/stale: referenced docs or code are absent, stale, or contradicted.
- Unknown: requires user input before proceeding.

## Recovery Rules

- Do not keep building, reviewing, or claiming readiness while `index.md`, Key
  Docs, active feature, active slice, or active doc are incoherent.
- Do not assume a phase or slice is complete just because a doc says so.
- Do not recreate product, scope, schema, permission, lifecycle, dependency, or
  validation decisions from imagination. If evidence is missing, ask the user.
- Repair only enough state to resume safely. Do not rebuild the whole workspace
  or app in broad parallel batches just because recovery is needed.
- Prefer correcting stale pointers over inventing missing artifacts. Recreate
  missing minimal docs only when surviving evidence is strong.

## Resume

1. Inspect `auto-strike/index.md`, the active initiative, active feature, active
   slice, Key Docs, relevant code, and current artifacts.
2. Write or update a short recovery note in the active doc or `index.md`: what
   was trusted, repaired, still unverified, and why.
3. Run the helper `validate` command when available.
4. Resume from the earliest phase/slice that is not yet trustworthy.
5. If recovery cannot establish the current truth without guessing, stop with
   the blocker and the one user decision needed next.
