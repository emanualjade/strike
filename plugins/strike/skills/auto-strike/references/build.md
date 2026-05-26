# Build

Do not create a separate build document by default. Build mode uses the active
slice file as its work packet: `Execution Tasks`, `Plan`, `Verification`, and
`Evidence` should show what is active, done, blocked, and ready for review.

For each slice:

1. Set `index.md` to `Current mode: build` and point `Doc`/`Slice` at the active
   slice file before treating slice execution prep warnings as build blockers.
2. Confirm the initiative Phase Ledger shows brainstorm, grill, spec, and slice
   as done, compressed, or skipped with artifact and reason.
3. Confirm slice execution prep is done: implementation research is captured,
   the plan is concrete, and plan review findings are fixed or consciously
   accepted before coding.
4. Implement the smallest complete behavior inside the slice.
5. Use `verification.md` to run the checks from the spec/slice plus any focused
   checks the code makes necessary.
6. Record build evidence in the active slice's `## Evidence` section using the
   exact labels `Changed:`, `Verified:`, `Reviewed:`, `Skipped:`, and
   `Review Findings:`. Keep it compact: files changed, checks run, skipped
   checks with reasons, important implementation choices, rollback notes, and
   review focus.
7. Keep `index.md`, the Phase Ledger, and slice checkboxes current as the build
   advances. Once code exists, do not leave Active Work pointing at brainstorm,
   stale open decisions, no active feature/slice, or "no code written".
8. Use `review.md` for the required review pass when the slice is meaningful,
   risky, UI/user-visible, or ready to claim complete. Completed meaningful
   slices should use a fresh read-only reviewer when the host supports it, or
   record why that review surface is unavailable.
9. Fix blocking findings and re-review.
10. When the slice is complete, write `## Closeout Summary` in the slice and use
   it as the final user-facing receipt: built, validation, review,
   skipped/residual risk, docs, and next.
11. Before claiming the slice done, run the helper's `validate` command when
   available and fix or consciously record warnings about evidence, active work,
   review, and slice boundaries.
12. After closeout, do not switch Active Work to the next slice, create the next
   slice doc, or start the next slice's research/plan/build in the same work
   unit unless the user explicitly asked to keep going across slice boundaries.
   Keep the completed slice as the active slice, record the next natural slice
   in `Next`, and stop with the closeout receipt.
13. Do not add features that were not asked for. Do not remove existing features
   unless asked.

For local servers, avoid blocking the final response on a long-running command.
Start the server only as needed for checks, record the URL/log, run the checks,
and stop any server you started before closeout unless the user explicitly wants
it left running. If a server should remain running for the user, say that in the
Closeout Summary with the URL and process/stop details.

Do not fold in unrelated cleanup, speculative abstractions, or future slices.
If implementation exposes a missing product, model, permission, UX, or
architecture decision, stop broadening the build, update the docs, and return to
grill/spec/slice as needed.
