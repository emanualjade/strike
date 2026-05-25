# Readiness

When all slices pass review, use `verification.md` and `review.md` to check the
assembled feature against the spec:

- every planned slice is built or intentionally removed
- repo-verifiable success checks pass or have explicit gaps
- required human/live checks are complete or clearly awaiting signoff
- representative user/system flows pass through the built product, or gaps are
  documented as accepted limitations or follow-up slices
- tests/checks cover the important risks, or missing coverage is justified
- the code quality checklist is satisfied, or remaining quality issues are
  written as readiness fixes
- docs, language, decisions, and todo reflect the final state

Use `auto-strike/features/<feature-slug>/readiness.md` as the readiness work
packet:

```md
# [Feature/MVP] Readiness

## Phase Tasks
- [ ] Compare built slices against the spec and accepted scope.
- [ ] Run or confirm repo-verifiable success checks.
- [ ] Check representative user/system flows end to end.
- [ ] Confirm review findings are fixed, accepted, or moved to follow-up.
- [ ] Record live/human checks, skipped checks, and residual risks.
- [ ] Update docs, todo, and final next action.

## Acceptance Review
- Spec coverage:
- User/system flows:
- Tests/checks:
- Review findings:
- Docs/state:

## Live / Human Checks
- [Check] - [done / waiting / not needed and why]

## Skipped Or Accepted Gaps
- [Gap] - [reason, risk, follow-up]

## Exit Evidence
- [Why the feature/MVP is ready or what blocks readiness.]
```

If readiness finds fixable issues, assign them to the smallest affected slice
and loop through fix and review. When ready, mark the relevant `todo.md` items
complete and leave a concise final note with changed files and checks.

## User Control

Honor these steering signals immediately:

- "include me more" - ask before major recommendations and show tradeoffs.
- "be more automated" - make reasonable decisions and keep moving.
- "go back to brainstorm" - reopen the idea and update downstream docs after.
- "jump to spec/build" - proceed if the missing decisions are safe to assume;
  otherwise ask the smallest blocking question.
- "stop and summarize" - report current docs, decisions, todo state, checks,
  and next best action.

## Completion Criteria

Auto Strike work is complete when the requested scope is production-shaped for
its declared purpose, not merely demoable.

For code changes, features, and MVPs, completion means:

- the user can run, open, or use the changed work with documented steps
- the accepted scope and slice acceptance criteria pass end to end
- core success flows and important failure, recovery, empty, invalid,
  permission, state, data, integration, and UI/device flows are handled or
  explicitly out of scope
- validation, errors, state handling, persistence, security/privacy boundaries,
  and integrations are implemented to the level the current scope requires
- repo-verifiable checks, focused tests, and browser/user-flow checks pass where
  relevant
- review blockers are fixed, and non-blocking findings are accepted with clear
  rationale or moved to follow-up only when outside the current scope
- docs, decisions, evidence, todo, and next action reflect the final state

For planning, spec, research, or review-only work, completion means the artifact
is decision-ready for its purpose: reviewed at the right depth, grounded in
known repo/docs evidence, clear about assumptions and risks, and explicit about
the next action or blocking decision.

Follow-ups are allowed, but not as a hiding place for defects inside the
accepted scope.
