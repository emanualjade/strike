# Built Slice Acceptance Audit

Use this read-only audit when `verify-slice-build` runs SUBAGENT:
`built-slice-acceptance-audit`.

Review the completed slice as local acceptance work, not as the whole phase.
Check whether the build satisfies the slice outcome and acceptance criteria,
stays inside accepted slice scope, follows plan intent, and has the non-browser
evidence needed for this slice.

Treat final Browser Clickthrough and final Visual Evidence as pending, not
failed. Return a concise `Browser Proof Needed` checklist with route/page,
representative data, controls/actions, expected states/results, screenshots,
and any browser concerns the final pass must prove.

## Checks

- acceptance fit: compare built behavior against the current slice's `slice.md`
  outcome and acceptance criteria.
- plan fit: compare the build evidence against the verified slice plan without
  expanding into whole-phase review.
- scope fit: flag work that escaped accepted slice scope or omitted required
  local slice behavior.
- plan amendments: if `build.md` records plan amendments, judge each one
  against the slice contract: inside the accepted boundary, serving the same
  acceptance criteria, no new product outcome, and no user-class decision made
  for the user. Flag amendment trails that replace the plan rather than repair
  the route, and work that should have been planned and verified as its own
  slice.
- non-browser evidence: confirm static/build checks, focused automated tests,
  E2E evidence, and skipped/not-applicable reasons are present or credibly
  accounted for before final browser proof. Do not fail the pre-browser audit
  because final Browser Clickthrough screenshots have not been captured yet.
- final browser proof checklist: name the route/page, representative data,
  controls/actions, expected states/results, screenshots, and concerns that the
  verifier must prove in the dev/local Browser Clickthrough.

## Output

Follow `references/review-agents/output-discipline.md`. Also include
`Browser Proof Needed`.
