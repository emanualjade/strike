# Readiness

When all slices for a feature pass review, use `verification.md` and `review.md`
to check the assembled feature against its `feature-spec.md`:

- every planned slice is built or intentionally removed
- repo-verifiable success checks pass or have explicit gaps
- required human/live checks are complete or clearly awaiting signoff
- representative user/system flows pass through the built product, or gaps are
  documented as accepted limitations or follow-up slices
- tests/checks cover the important risks, or missing coverage is justified
- the code quality checklist is satisfied, or remaining quality issues are
  written as readiness fixes
- docs, root language, initiative decisions, and todo reflect the final state

Use feature readiness for one feature and initiative readiness for the whole
request:

- `auto-strike/initiatives/<initiative-slug>/features/<feature-slug>/readiness.md`
- `auto-strike/initiatives/<initiative-slug>/readiness.md`

Feature readiness proves the feature's slices satisfy the feature spec.
Initiative readiness proves cross-feature flows, dependencies, docs, accepted
residual risk, and the initiative readiness target.

Use this readiness work packet:

```md
# [Feature/Initiative] Readiness

## Phase Tasks
- [ ] Compare built slices or feature readiness docs against the accepted scope.
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
- [Why the feature/initiative is ready or what blocks readiness.]
```

If readiness finds fixable issues, assign them to the smallest affected slice
or feature and loop through fix and review. When ready, mark the relevant
`todo.md` items complete and leave a concise final note with changed files,
checks, review status, skipped/residual risk, docs, and next action. For
completed slices, use the slice's `Closeout Summary` as that final user-facing
note.

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
- docs, root language, initiative decisions, evidence, todo, and next action reflect the final state

For planning, spec, research, or review-only work, completion means the artifact
is decision-ready for its purpose: reviewed at the right depth, grounded in
known repo/docs evidence, clear about assumptions and risks, and explicit about
the next action or blocking decision.

Follow-ups are allowed, but not as a hiding place for defects inside the
accepted scope.
