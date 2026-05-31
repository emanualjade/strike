# Slice

Slice mode turns a ready phase spec into a Slice Map and small build packets.
Default to vertical slices: observable user/system behavior that can be planned,
built, reviewed, verified, and fixed in one focused loop.

Before slicing:

- Confirm brainstorm, grill, and spec are done, explicitly skipped, or compressed
  with artifact evidence in the initiative Mode Ledger.
- Confirm spec review and exit evidence exist. Spec may leave a short `Slice
  Handoff`; slice mode creates `phases/.../slices`.
- Confirm the initiative phase map and the active phase spec. Slices belong to
  one phase folder inside the active initiative.
- If the phase split or phase spec is missing, stale, or too vague, return to
  spec mode instead of inventing phase scope inside slice mode.
- Do not create new initiatives in slice mode. If the work looks like a separate
  initiative, ask the user.
- Choose one active phase. Do not hide multiple phases inside one slice map.

## Sizing

Use this sizing guide:

| Size | Shape |
| --- | --- |
| XS | 1 file; tiny config, function, copy, or style change. |
| S | 1-2 files; one component, endpoint, helper, or adapter. |
| M | 3-5 files; one complete vertical behavior path. |
| L | 5-8 files; challenge and split unless clearly justified. |
| XL | 8+ files; too large for one slice. |

Break or challenge a slice when it has:

- more than 5 likely files
- more than 3 acceptance criteria
- a broad title: `and`, `full`, `complete`, `MVP`, `setup frontend/backend`
- multiple independent subsystems
- repo setup plus package decisions plus frontend/backend behavior

Do not label a slice `M` while accepting `L/XL` signals. Split it or record why
the larger blast radius is still the smallest safe move.

L slices require `## Why Not Split`. If a slice touches UI + route/API +
state/data + tests, split it unless one behavior truly cannot work smaller.

Non-vertical slices are allowed only when they reduce risk or unlock near-term
vertical behavior. Keep them XS/S unless clearly justified. Explain why a
vertical slice is worse first and name the next vertical slice they unblock.

## Slice Index

For multi-slice work, keep a lightweight dependency map in
`slices/index.md`. Order slices so dependencies are satisfied, high-risk
assumptions happen early, and each slice leaves the app in a working state. Use
`Depends On: None` when there is no prerequisite.

```md
# Slices

## Slice Map

| Slice | Size | Depends On | Unblocks | Risk | Verification |
| --- | --- | --- | --- | --- | --- |
| 0. Minimal setup | S | None | Registration | High | App starts; auth smoke check |

## Checkpoint: After Slices 1-3
- [ ] App builds or starts without errors.
- [ ] Focused tests or checks pass.
- [ ] Core user/system flow works end to end.
- [ ] Review findings are resolved or accepted.
- [ ] Human decision needed? If yes, pause and ask.

## Mode Tasks
- [ ] Confirm spec review and exit evidence exist.
- [ ] Confirm the active phase and phase spec.
- [ ] Draft the Slice Map and dependency order.
- [ ] Split or justify any L/XL, batched, or non-vertical slice.
- [ ] Create the slice docs with execution tasks.
- [ ] Review slice size, order, risk placement, and verification coverage.
- [ ] Record exit evidence and handoff to build.

## Slice Review
- [pass/blocker/warning] - [size, dependency, risk, working-state, or verification finding]

## Exit Evidence
- [Why this phase can enter build one slice at a time without guessing.]
```

## Slice Doc

Default paths:

- `auto-strike/initiatives/<initiative-slug>/phases/<phase-slug>/slices/index.md`
- `auto-strike/initiatives/<initiative-slug>/phases/<phase-slug>/slices/slice-0-[name].md`
- `auto-strike/initiatives/<initiative-slug>/phases/<phase-slug>/slices/slice-1-[name].md`

Use this template:

```md
# Slice [N]: [Name]

## Size
[XS/S/M/L/XL]

## Outcome
[One sentence describing the observable behavior that works after this slice.]

## Acceptance Criteria
- [ ] [User/system-visible result.]
- [ ] [Important state, error, permission, or edge case.]
- [ ] [Verification-ready done condition.]

## Why This Slice Exists
[Why this slice is next, what risk it reduces, or what user value it unlocks.]

## Depends On
- None / Slice [N]: [Name]

## In Scope
- [Only work this slice will build.]

## Out Of Scope
- [Deferred work that should not sneak into this slice.]

## Likely Surfaces
- `[path]` - [why it may change]

## Execution Tasks
- [ ] Research official docs, current package/framework behavior, and nearby repo
      patterns that can change this slice.
- [ ] Write/update the plan with exact surfaces, edge cases, verification, and
      rollback/recovery notes.
- [ ] Review the plan with a read-only review subagent; the main agent evaluates
      findings before coding.
- [ ] Build only the in-scope behavior path for this slice.
- [ ] Add or update focused tests/checks for the acceptance criteria.
- [ ] For UI/user-flow work, record browser verification capability per
      `verification.md`.
- [ ] Verify the acceptance criteria and required browser/user-flow checks.
- [ ] Record Changed, Verified, Reviewed, Skipped, and Review Findings evidence.
- [ ] Write the Closeout Summary and use it as the final user-facing receipt.
- [ ] Commit the slice checkpoint before starting another slice; push only when
      requested, repo policy requires it, or release flow needs it.

## Implementation Research
[Docs, versions, local precedent, or why no extra research is needed.]

## Plan
[Concrete build plan: files/surfaces, sequencing, edge cases, checks.]

## Plan Review
[Read-only review subagent outcome, main-agent assessment, findings, and fixes before coding.]

## Browser Verification Capability
- Applies: yes / no, with reason.
- Playwright CLI:
- Target URL / route:
- Viewports / flows:
- Status: verified / BLOCKED; replacement evidence; residual user-facing risk.

## Verification
[Commands, browser/user-flow checks, expected result.]

## Watchouts
[Risks, blast radius, rollback/recovery notes, accepted limits.]

## Evidence
Changed:
- [files/surfaces]

Verified:
- [command/check/browser route/state] - [result]

Reviewed:
- read-only review subagent - passed / passed after fixes; returned findings to
  main agent for synthesis.
- [lens] - [pass / blocker / warning and short finding]

Skipped:
- [check or lens] - [reason, risk, replacement evidence]

Review Findings:
- [open blocker or "None"]

## Closeout Summary
Implemented Slice [N]: [Name].

Built:
- [User-facing/code-facing result.]
- [Important behavior, permission, state, or integration result.]

Validation passed:
- [command/check/browser flow]

Review:
- [lens/group]: passed / passed after fixes / skipped with reason.
- Final re-review: no remaining blocking findings.

Skipped / residual risk:
- [None / skipped check, reason, replacement evidence, residual risk.]

Docs:
- [primary Auto Strike docs updated]

Commit / push:
- [commit hash and push status if pushed]

Next:
- [next natural slice/action]
```

Add `## Non-Vertical Justification` only for a non-vertical slice. Add
`## Why Not Split` only for L slices or broad-stack slices that cannot be made
smaller.

Keep `Execution Tasks` live. Update checkboxes as research, plan review, build,
verification, and review finish.

## Execution Prep

Before coding a meaningful slice, do a short research, plan, and review loop:

1. Research details that can change the implementation. Check current official
   docs for third-party APIs, frameworks, browser/platform behavior, dependency
   versions, and external standards. If using a third-party package, read the
   latest docs and understand the idiomatic recommended approach. Do not guess
   when docs or local precedent are practical to check. If the slice appears to
   need a non-recommended approach, consider whether that signals a larger issue
   to discuss with the user.
2. Research nearby repo code so the plan follows local patterns instead of
   inventing a parallel style.
3. Write/update the plan. Name likely files, concern boundaries, sequencing,
   edge cases, UI/state/error cases, data/integration risks, verification
   commands, and rollback or recovery notes.
4. Review the plan before coding. Use `review.md`; a read-only review subagent
   returns findings and the main agent evaluates and fixes or accepts them.
5. For UI/user-flow work, record browser capability and follow `verification.md`.

If the plan cannot name likely surfaces, verification checks, important edge
cases, and unresolved assumptions, tighten the plan before broad implementation.
Ask the user only when the gap changes product behavior, risk, or a
hard-to-reverse choice.

Plan review should check verticality, size, dependency order, working-state
guarantee, risk placement, research/local precedent, likely surfaces,
verification, blast radius, edge cases, and non-vertical justification when
relevant.

## Edge And Flow Pass

Before build and again during review, check only edge cases and flows that can
change the plan, implementation, verification, or user experience.

Relevant edge categories:

- Inputs: missing, malformed, duplicate, out of order, unsupported, hostile, too
  large.
- State: empty, loading, success, failure, retry, partial, stale, race, illegal
  transition.
- Permissions: unauthenticated, unauthorized, wrong owner, wrong role, expired
  access, cross-tenant access.
- Data integrity: duplicate writes, destructive actions, rollback, idempotency,
  migrations, background jobs, external side effects.
- Integrations: timeout, rate limit, webhook retry, provider outage, partial
  response, version mismatch, cost limits.
- UI/device: mobile/desktop layout, keyboard, focus, accessibility basics, long
  text, empty content, visible error recovery.
- Operations: logs/debugging, secrets exposure, deploy/runtime env, safe failure.

Relevant flow categories:

- primary success, first-time, returning, interrupted/resumed
- permission, ownership, or role variations
- empty, partial, invalid, duplicate, and recovery flows
- mobile/constrained-device flows for UI work
- admin/operator/support flows when required
- external system, webhook, background job, or integration flows when relevant

For each important edge case or flow, choose one outcome:

- build it now
- cover it with a test, `playwright-cli` check, or command/API check
- defer it to a named later slice
- record it as an accepted limit with risk
- ask the user if it changes product behavior or risk

## Exit

After the Slice Map, slice docs, slice review, and exit evidence are recorded,
run the helper's `validate` command when available and address slicing warnings.
Keep `index.md` in `Current mode: slice`, point `Doc`/`Slice` at the active
slice doc, and stop with build as the next action.

Do not mark build in progress, write slice execution prep, or start building
slice 0 until build mode actually starts, unless the user explicitly asked to
skip that boundary.
