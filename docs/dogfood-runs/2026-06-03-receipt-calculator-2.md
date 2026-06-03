# Dogfood Run

Date: 2026-06-03
Host: Codex desktop local source workflow check
Workspace: `/Users/cracklehat/Sites/receipt-calculator-2`
Scenario: Dependency-free local receipt calculator
Installed-plugin behavior proven: no

## Result

The workflow reached final verification in the target workspace. The helper
returned `status: "idle"` after `allPhasesVerified`, meaning the initiative was
complete and no active initiative remained.

Built app:
- dependency-free static receipt calculator
- editable line items
- tax and discount totals
- localStorage draft persistence
- clear/reset behavior
- local HTTP server
- focused dependency-free checks
- browser clickthrough screenshots

## Evidence

Checks:
- `sfw pnpm run check`: passed after slice-01 and slice-02.
- Browser clickthrough: passed on `http://127.0.0.1:4173` using bundled
  Playwright with system Chrome.
- Final helper status: `node strike/scripts/state.mjs next-step` returned idle.

Browser evidence:
- `strike/initiatives/receipt-calculator/phases/phase-01/slices/slice-01/browser-screenshot.png`
- `strike/initiatives/receipt-calculator/phases/phase-01/slices/slice-02/browser-restored.png`
- `strike/initiatives/receipt-calculator/phases/phase-01/slices/slice-02/browser-cleared.png`

Local commits:
- `ab3c415` Complete receipt calculator slice 01
- `8864a02` Complete receipt calculator slice 02

## Strike Findings

### S-001 Browser-Visible Slice Proof Could Be Deferred Too Easily

Severity: Must Fix
Status: fixed in Strike source during the run

What happened:
The slice-01 plan deferred all Browser Clickthrough and Visual Evidence to
slice-02 even though slice-01 created browser-visible calculator behavior. During
verify-slice-build this was correctly treated as a failed verifier result and
fixed in the target by adding local HTTP browser support and rerunning browser
proof.

Why it matters:
A later phase or slice browser pass can supplement local slice proof, but it
should not excuse a browser-visible slice from proving its own accepted controls,
states, and screenshots. Otherwise an agent can keep saying "later" and pass
partly visible work without ever clicking the feature at the correct gate.

Strike change made:
- `plugins/strike/skills/plan-slice/SKILL.md`: added explicit guidance that a
  browser-visible slice cannot defer all Browser Clickthrough to a later slice.
- `plugins/strike/skills/verify-slice-plan/SKILL.md`: added the matching
  readiness check.

Follow-up:
- Validate Strike repo after the dogfood run.

## Dogfood Harness / Environment Findings

### H-001 Helper Commands Must Not Be Parallelized

Status: noted, no Strike code change

The observer accidentally ran `complete-check` and `next-step` in parallel twice.
`next-step` read stale state once, and `complete-check phasesCreated` correctly
failed before `add-phase` had completed. This reinforces the existing Strike
step-discipline rule. It did not indicate a helper bug.

### H-002 Browser Tooling Required Fallbacks

Status: noted, no Strike code change

The in-app browser controls were not exposed in this thread through tool
discovery. The bundled Node runtime had Playwright, but the bundled Playwright
browser binary was not installed. The run used system Chrome via Playwright's
`executablePath` fallback.

This matches the dogfood/browser guidance: try another browser surface before
declaring browser verification blocked.

### H-003 Target Workspace Had No Remote

Status: noted, no Strike code change

The dogfood target started without git and no remote. The observer initialized
local git and made local slice checkpoint commits. Push was unavailable and was
recorded as residual risk in verification artifacts.

## App Findings

### A-001 Strict Floating-Point Equality Failed The First Check

Status: fixed in target app

The initial `scripts/check.mjs` used strict equality for decimal tax math. The
check failed on `1.2750000000000001` vs `1.275`. The target app check was fixed
to use a small tolerance.

## Process Notes

- This was a local source workflow check driven from the Strike checkout, not an
  installed-plugin dogfood run with a separate target agent.
- Observer-created artifacts mean this run is useful for workflow mechanics and
  prompt hardening, but it should not be counted as pure installed-plugin
  product dogfood.
- The new phase research gate worked cleanly: phase research inherited
  initiative research, avoided duplicate research, produced an audit, and the
  stricter helper accepted `Ready For Slicing`.
- The workflow continued automatically from slice-01 to slice-02 after
  `buildVerified` and a local checkpoint commit.
- The final `allPhasesVerified` gate completed the initiative and left no active
  initiative.
