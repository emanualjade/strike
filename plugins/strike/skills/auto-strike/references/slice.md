# Slice

Split the spec into the smallest ordered vertical slices that leave observable,
reviewable behavior. Avoid horizontal layers unless a foundation phase genuinely
reduces risk or unlocks later behavior. Try to slice across the full range of the
stack in small slices rather than all the APIs at once then all the UI at once.

Before slicing, do a feature decomposition gate. Decide whether the request is
one coherent feature/milestone folder or a bundle of feature folders.

Use one feature folder when the work has one primary user/system outcome, one
readiness target, and slices that mostly depend on each other. Split into
multiple feature folders or milestones when the request combines independent
outcomes, workflows, roles, domains, readiness targets, or subsystems that can be
planned, reviewed, shipped, or paused separately.

If the request is a bundle, record the feature split in `auto-strike/index.md`
or `todo.md`, choose one active feature, and slice only that feature. Do not hide
multiple features inside one large slice map.

Use this sizing guide:

| Size | Shape |
| --- | --- |
| XS | 1 file; tiny config, function, copy, or style change. |
| S | 1-2 files; one component, endpoint, helper, or adapter. |
| M | 3-5 files; one complete vertical behavior path. |
| L | 5-8 files; challenge and split unless clearly justified. |
| XL | 8+ files; too large for one slice. |

For multi-slice work, keep a lightweight dependency map in `slices/index.md`:

```md
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
```

Order slices so dependencies are satisfied, high-risk assumptions happen early,
and each slice leaves the app in a working state. Use `Depends On: None` when a
slice has no prerequisite so dependency thinking is explicit. Add checkpoints
after every 2-3 slices or at milestone boundaries; every slice still needs its
own verification.

Break a slice down when it has more than 5 likely files, more than 3 acceptance
criteria, a title that hides multiple tasks (`and`, `full`, `complete`, `MVP`,
`setup frontend/backend`), multiple independent subsystems, or repo setup plus
package decisions plus frontend/backend product behavior.

Non-vertical slices are allowed only when they reduce risk or unlock near-term
vertical behavior. Keep them XS/S unless clearly justified, explain why a
vertical slice is worse first, and name the next vertical slice they unblock.

Default path:

- `auto-strike/features/<feature-slug>/slices/index.md`
- `auto-strike/features/<feature-slug>/slices/slice-0-[name].md`
- `auto-strike/features/<feature-slug>/slices/slice-1-[name].md`

Slice template:

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
- [ ] Research official docs, current package/framework behavior, and nearby
      repo patterns that can change this slice.
- [ ] Write/update the implementation plan with exact surfaces, edge cases,
      verification, and rollback/recovery notes.
- [ ] Review the plan with the main agent or a read-only reviewer; resolve or
      explicitly accept findings before coding.
- [ ] Build only the in-scope behavior path for this slice.
- [ ] Add or update focused tests/checks for the acceptance criteria.
- [ ] Record verification capability before accepting skipped checks or fallback
      evidence.
- [ ] Verify the acceptance criteria and any required browser/user-flow checks.
- [ ] Record Changed, Verified, Reviewed, Skipped, and Review Findings evidence.

## Implementation Research
[Docs, versions, local precedent, or why no extra research is needed.]

## Plan
[Concrete build plan: files/surfaces, sequencing, edge cases, checks.]

## Plan Review
[Reviewer/main-agent outcome, findings, and fixes before coding.]

## Verification Capability
- Repo scripts/checks:
- Host/browser/manual checks:
- Package installs allowed:
- Blocked checks:
- Replacement evidence:

## Verification
[Commands, browser/user-flow checks, expected result.]

## Watchouts
[Risks, blast radius, rollback/recovery notes, accepted limits.]
```

Add `## Non-Vertical Justification` only for a non-vertical slice.

Each slice should be small enough to plan, build, review, and fix in one focused
loop. If it is too broad, split it. Keep `Execution Tasks` as the slice's live
work packet: update checkboxes as prep, build, verification, and review complete
instead of treating the slice as a static concept doc.

Before coding a meaningful slice, do a lightweight slice execution prep pass.
This should usually be a short inline research/plan/review loop that keeps
momentum, not a reason to stall:

1. Research the slice-specific implementation details that can change the
   solution. Check current official docs for third-party APIs, framework
   behavior, browser/platform behavior, dependency versions, and any external
   standard the slice relies on. If using a third-party package, research the
   latest docs and understand the idiomatic, recommended way to implement the
   behavior you are about to build. Do not guess when the relevant docs or local
   precedent are practical to check. If the slice appears to need a
   non-recommended approach, consider why and whether that signals a larger
   problem to discuss with the user. Research nearby repo code so the plan
   follows local patterns instead of inventing a parallel style.
2. Write or update the implementation plan from that research. Name the exact
   repo surfaces likely to change, concern boundaries, verification commands,
   UI/state/error cases, data or integration risks, and any rollback or recovery
   notes.
3. Review the implementation plan before coding. Use `review.md` for when to
   use the main agent, a read-only reviewer, or a fresh-context pass.
4. Before verification, record what can actually be checked. For UI,
   auth/session, routing, forms, responsive layout, user-visible state,
   integrations, or skipped checks, do not treat missing repo browser packages
   as browser unavailable; use host/manual browser tooling when available.

If the plan cannot name the likely files/surfaces, verification checks,
important edge cases, and unresolved assumptions, tighten the plan before broad
implementation. Do a quick research/update pass and ask the user only if the gap
changes product behavior, risk, or a hard-to-reverse choice.

Each slice plan should include the slice-specific research and organization
guidance needed for a fresh build session:

- current official docs or local precedent to check before coding
- exact repo surfaces likely to change
- expected module/file placement
- likely shared utilities or adapters, with purpose-specific names
- test/dev setup and verification command
- blast radius and higher-risk boundaries
- edge cases to handle, verify, defer, or ask about
- code quality checklist items the reviewer should pay special attention to

Before building, the implementation-plan review should check verticality, size,
dependency order, working-state guarantee, risk placement, research/local
precedent, likely surfaces, verification, blast radius, edge cases, and
non-vertical justification when relevant. Fix plan gaps before coding.

## Edge Case Pass

Before building a slice, and again during review, do a short edge case pass
scaled to the risk of the work. Do not turn this into exhaustive speculation;
focus on cases that can change the plan, implementation, verification, or user
experience.

Check the relevant categories:

- Inputs: missing, malformed, too large, duplicate, out of order, unsupported, or
  hostile input.
- State: empty, loading, success, failure, retry, partial completion, stale data,
  race conditions, and illegal transitions.
- Permissions and ownership: unauthenticated, unauthorized, wrong owner, wrong
  role, expired access, and cross-tenant access.
- Data integrity: duplicate writes, destructive actions, rollback, idempotency,
  migrations, background jobs, and external side effects.
- Integrations: timeout, rate limit, webhook retry, provider outage, partial
  response, version mismatch, and cost limits.
- UI and device behavior: mobile/desktop layout, keyboard navigation, focus,
  accessibility basics, long text, empty content, and visible error recovery.
- Operations: logging, debugging evidence, secrets exposure, deploy/runtime env,
  and safe failure mode.

For each important edge case, choose one outcome:

- build into the current slice
- cover with a test, browser check, or command/API check
- document as accepted MVP limitation
- move to Soon/Later
- ask the user if it changes product behavior or risk

## User Flow Validation Pass

Before building a spec or major slice, and again during readiness, generate a
small set of realistic user or system flows to test whether the plan supports
needed behavior. Keep this practical; do not create a large story backlog unless
the project needs it.

Include:

- standard success flows for the primary user
- first-time user flows
- returning user flows when relevant
- interrupted or resumed flows
- permission, ownership, or role variations
- empty, partial, invalid, duplicate, and recovery flows
- mobile or constrained-device flows for UI work
- admin/operator/support flows when the product requires them
- external system, webhook, background job, or integration flows when relevant

For each flow, check:

- can the user or system start, continue, complete, cancel, recover, or retry?
- does the UI/API/CLI expose the right state and next action?
- are validation, permissions, errors, and data integrity handled?
- is the flow covered by the current spec, slice, tests, browser checks, or
  accepted MVP limitations?

If a generated flow reveals missing behavior, choose one outcome:

- build into the current slice
- add or adjust a future slice
- document as an accepted MVP limitation
- move to Soon/Later
- ask the user if it changes the product promise or risk
