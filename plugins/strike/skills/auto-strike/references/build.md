# Build

Do not create a separate build document by default. Build mode uses the active
slice file as its work packet: `Execution Tasks`, `Plan`, `Verification`, and
`Evidence` should show what is active, done, blocked, and ready for review.

For each slice:

1. Confirm slice execution prep is done: implementation research is captured,
   the plan is concrete, and plan review findings are fixed or consciously
   accepted before coding.
2. Implement the smallest complete behavior inside the slice.
3. Use `verification.md` to run the checks from the spec/slice plus any focused
   checks the code makes necessary.
4. Record build evidence in the slice file or a nearby build note: files
   changed, checks run, results, skipped checks with reasons, important
   implementation choices, rollback notes, and review focus.
5. Use `review.md` for the required review pass when the slice is meaningful,
   risky, UI/user-visible, or ready to claim complete.
6. Fix blocking findings and re-review.
7. When the slice is complete, write `## Closeout Summary` in the slice and use
   it as the final user-facing receipt: built, validation, review,
   skipped/residual risk, docs, and next.
8. Do not add features that were not asked for. Do not remove existing features
   unless asked.

Do not fold in unrelated cleanup, speculative abstractions, or future slices.
If implementation exposes a missing product, model, permission, UX, or
architecture decision, stop broadening the build, update the docs, and return to
grill/spec/slice as needed.
