# Dogfood Run

Date: 2026-06-01
Host: Codex CLI
Workspace: `/Users/cracklehat/Sites/strike-dogfood-billing-ledger`
Scenario: Medium Stress - local billing ledger

## Result

Strike completed the initiative and marked it `complete` in
`strike/state.json`.

Independent checks after the run:

- `node --test`: passed, 17 tests.
- Browser smoke: passed in the in-app browser.
- State helper: final state contains one complete initiative, one phase, and
  four verified slices.

## What Worked

- New initiative bootstrap found the installed skill helper and created
  workspace state.
- The host-neutral fallback of reading each workflow skill directly worked.
- Slice research was concise and source-backed where it mattered.
- Verification artifacts recorded inline review lenses, browser evidence,
  residual risk, and final readiness.
- Browser verification found a small UI copy bug during the run, and the workflow
  fixed it before final verification.

## Issues Found

- The target agent repeatedly printed full artifact and diff content into the
  transcript after the work was already complete.
- Inline verifier notes said subagents were run inline because the user had not
  explicitly requested delegation. The real reason was host/session tooling.
- The generated project used `npm test` / `npm start` even though no package
  dependency workflow was needed. Direct commands would have been cleaner.
- Codex printed icon warnings from installed primary-runtime skills. No Strike
  icon metadata was present in the Strike plugin cache.

## Potential Strike Improvements To Discuss

- Consider whether Strike should say anything about compact progress and
  avoiding large transcript dumps. This would change agent behavior, so do not
  apply it without an explicit decision.
- Consider whether inline verifier wording should distinguish unavailable
  subagent tooling from user choice.
- Consider whether dogfood workspaces should include normal project guidance
  such as package-manager policy, rather than teaching that through Strike
  prompts.
- Consider whether validators should enforce any of the above only after the
  prompt behavior is approved.

## Recommendations

- Keep dogfooding before release; the workflow is fundamentally working.
- Do one more small resume-oriented dogfood run after these output-discipline
  changes to see if transcript size improves.
- Treat the Codex icon warnings as external unless a future Strike manifest
  change reproduces them in the Strike cache.
