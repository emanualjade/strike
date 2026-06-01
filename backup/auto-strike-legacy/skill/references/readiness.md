# Readiness

Readiness is the final trust gate. Use it when a phase's slices have passed
review, or when the user asks whether a phase, MVP, or initiative is done.

Use phase readiness for one phase and initiative readiness for the whole
request:

- `auto-strike/initiatives/<initiative-slug>/phases/<phase-slug>/readiness.md`
- `auto-strike/initiatives/<initiative-slug>/readiness.md`

Phase readiness proves the phase's slices satisfy the phase spec.
Initiative readiness proves cross-phase flows, dependencies, docs, accepted
residual risk, and the initiative readiness target.

Before closeout, update `auto-strike/index.md`: Active Work, Key Docs,
Verification, State, and Next must describe the final truth. No stale active
build/slice or planned-later language.
Also update the initiative Mode Ledger so build, review, and readiness are not
left pending or in progress after the work is closed.

## Check

Use `verification.md`, `review.md`, and `code-quality.md`. Check:

- accepted scope: every planned slice is built, intentionally removed, or
  explicitly out of scope
- run/open path: the user can run, open, or use the result with documented steps
- success flows: accepted scope and slice acceptance criteria pass end to end
- failure/edge flows: important recovery, empty, invalid, permission, state,
  data, integration, and UI/device cases are handled or explicitly out of scope
- checks: repo-verifiable checks, focused tests, and browser/user-flow checks
  pass where relevant
- Stripe status: accepted Stripe, Billing, webhook, or Connect paths have Stripe
  CLI sandbox evidence, or a user-accepted residual-risk note when sandbox
  verification is blocked
- browser status: UI/user-flow work is verified with `playwright-cli`, or
  clearly reported as code-verified because `playwright-cli` is blocked
- review status: blockers are fixed; non-blocking findings are accepted with
  rationale or moved to follow-up only when outside accepted scope
- docs/state: docs, root `UBIQUITOUS_LANGUAGE.md`, initiative decisions,
  evidence, todo, and
  next action reflect the final state
- checkpoint: readiness changes are committed before final completion is
  reported; push when requested, repo policy requires it, or release flow needs
  it

Do not call the work complete when accepted-scope defects, stale docs, review
blockers, or missing required checks remain unresolved.

## Work Packet

```md
# [Phase/Initiative] Readiness

## Mode Tasks
- [ ] Compare built slices or phase readiness docs against accepted scope.
- [ ] Run or confirm repo-verifiable success checks.
- [ ] Check representative user/system flows end to end.
- [ ] Confirm review findings are fixed, accepted, or moved to follow-up.
- [ ] Record live/human checks, skipped checks, and residual risks.
- [ ] Update docs, todo, index, and final next action.

## Acceptance Review
- Scope:
- Run/open path:
- User/system flows:
- Tests/checks:
- Browser status:
- Review findings:
- Docs/state:

## Live / Human Checks
- [Check] - [done / waiting / not needed and why]

## Skipped Or Accepted Gaps
- [Gap] - [reason, risk, follow-up]

## Exit Evidence
- [Why the phase/initiative is ready or what blocks readiness.]

## Final Receipt
Shipped:
- [What is complete.]

Run:
- [Command/path/user steps.]

Checks passed:
- [command/check/browser flow]

Review:
- [passed / passed after fixes / remaining accepted risk]

Skipped / residual risk:
- [None / gap, reason, risk, follow-up]

Docs:
- [primary docs updated]

Commit / push:
- [commit hash and push status if pushed]

Next:
- [next action]
```

If readiness finds fixable issues, assign them to the smallest affected slice or
phase and loop through fix, verify, review, and readiness once. Continue only
for new or still-open blockers.

Use the `Final Receipt` as the user-facing terminal summary when the whole
phase or initiative is done. For a single completed slice, use the slice's
`Closeout Summary` instead.

If readiness changes code or docs, commit those changes before the final
receipt. Push only when requested, repo policy requires it, or release flow
needs it. If commit cannot complete, report the exact blocker and do not call
readiness fully complete.

## User Control

Honor these steering signals immediately:

- "include me more" - ask before major recommendations and show tradeoffs.
- "be more automated" - make reasonable decisions and keep moving.
- "go back to brainstorm" - reopen the idea and update downstream docs after.
- "jump to spec/build" - proceed if missing decisions are safe to assume;
  otherwise ask the smallest blocking question.
- "stop and summarize" - report current docs, decisions, todo state, checks,
  blockers, and next best action.

## Completion Standard

Auto Strike work is complete when the requested scope is production-shaped for
its declared purpose, not merely demoable. Follow-ups are allowed, but not as a
hiding place for defects inside the accepted scope.

Planning, spec, research, or review-only work is complete when the artifact is
decision-ready for its purpose: reviewed at the right depth, grounded in known
repo/docs evidence, clear about assumptions and risks, and explicit about the
next action or blocking decision.
