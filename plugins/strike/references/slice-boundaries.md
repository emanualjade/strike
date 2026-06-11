# Slice Boundaries

Use this reference when creating, planning, or verifying Strike slices. The goal
is not the smallest possible slice. The goal is a cohesive buildable unit with a
clear verification story.

## Core Standard

A slice is one cohesive buildable increment with a clear verification story that
can be planned, built, reviewed, and verified as one coherent unit.

A good slice:

- proves one user or system capability, a tightly coupled behavior cluster that
  shares the same state/data/API flow, or a specific near-term risk reduction
- has clear acceptance criteria
- leaves the repo in a working state
- is cohesive enough to complete without bundling unrelated outcomes

A vertical slice proves one user or system capability through the layers needed
to make that capability work. It is not "frontend work," "backend work," or
"database setup" by itself.

A slice may touch UI, API, data, and tests when those pieces must land together
to prove one capability. It may include tightly coupled variants when splitting
them would create fake work. Split it when the pieces are independent, have
different risk centers, or cannot be verified as one coherent capability.

One slice is correct when splitting would create fake work.

## Slice Economics

Every slice pays the same fixed workflow overhead regardless of size: a plan,
a plan verification with parallel review agents, a build, a build verification
with parallel review agents and browser evidence, and a git checkpoint. Slice
count, not slice size, is the main cost multiplier for a phase.

Size slices for the fewest verification loops that each remain one honest
verification story. Do not pre-split work to make individual slices look
safer; the verification gates own safety, and they run at full strength on
every slice. The honest cap on slice size is verifiability, not file count: a
slice is too big only when it can no longer be planned, built, reviewed, and
verified as one coherent unit.

Default to M or L slices. Use XS or S only when a tiny outcome is genuinely
standalone or a narrow non-vertical enabler is justified.

## Size Guide

Use size as a rough shape signal, not a file-count rule.

| Size | Shape |
| --- | --- |
| XS | Tiny local change, such as config, copy, style, or one small function. |
| S | Small single-surface outcome when other needed layers already exist, or a justified non-vertical enabler. Do not use `S` for a horizontal task unless that task is the complete accepted outcome. |
| M | The default shape: one cohesive capability or behavior path across the needed surfaces; often a handful of files. |
| L | One broader cross-stack capability with a shared data/API/auth/UI/test story. A normal shape when one capability genuinely spans the stack; add a short `Why Not Split` note naming the splits considered. |
| XL | Multiple capabilities, independent flows, or a change too broad to verify as one coherent unit. Split or route back unless the phase explicitly accepts the larger boundary and `Why Not Split` proves it. |

## Examples

Good vertical slice examples:

- user can create one listing and see it persisted in the list
- admin can approve one pending request and the requester sees the new status
- customer can enter one discount code and see the corrected total
- user can issue and revoke one kind of plugin API key through the required UI,
  server, storage, and tests because those layers share one security lifecycle

Good non-vertical risk slice example:

- prove a platform constraint with a minimal plugin panel, manifest setting,
  storage probe, and verification note before the next vertical plugin flow

## Complex Interaction Fields

Simple form fields belong in the parent form slice. Promote a field to its own
slice only when the field behaves like a small feature with its own meaningful
state, data, or interaction contract.

Examples may include search/autocomplete fields, mention pickers, permission
pickers, file-upload fields, rich text fields, date range pickers, or other
fields with async data, custom option rendering, non-trivial selection state,
reusable component risk, meaningful loading/empty/error states, or accessibility
and keyboard behavior that materially affects the field's correctness.

Multi-select and tag fields are not automatically complex. Keep simple static
multi-selects, checkbox groups, or tag inputs inside the parent form slice when
they use existing primitives and ordinary validation. They do deserve their own
slice when they have their own meaningful behavior, such as async search,
creating or removing options, tokenization rules, permission-sensitive
selections, custom option rendering, reusable component work, or substantial
selected-item state.

Do not split merely because a field has a small interaction detail such as an
Escape key handler, a clear button, a simple validation message, or ordinary
focus behavior. Keep those inside the parent form slice when the field is
otherwise straightforward.

A complex-field slice may include the UI, API/search endpoint, state wiring,
validation, accessibility behavior, focused tests, and browser evidence needed
to prove that field as one coherent capability. Do not split the field into
UI-only and API-only slices unless one side is independently useful and
verifiable.

When a form has multiple complex fields, slice them separately unless they share
one component/data model and can be verified together cleanly.

Usually bad slice shapes:

- set up database tables
- build all backend endpoints
- create the whole UI
- build a complete payment system with multiple independent flows such as
  checkout, refunds, disputes, webhooks, and admin tools

## Challenge Signals

Crossing layers is not a challenge signal. A vertical slice is supposed to
cross UI, API, state/data, and tests when its capability needs them.

Break or challenge a slice when it has:

- acceptance criteria that describe multiple independent outcomes, unrelated
  state changes, or separate verification stories
- more outcomes than one coherent verification story can honestly cover
- multiple independent subsystems, behavior paths, or risk centers
- a title that signals broad or bundled scope, such as `full`, `complete`,
  `MVP`, or `X and Y` when the joined pieces are independent capabilities
- repo setup plus package decisions plus frontend/backend behavior

When a slice looks overly broad, decide whether it is broad because one cohesive
capability crosses several surfaces or because it bundles independent work. Split
bundled work, or record why the broader slice is still the most coherent
buildable unit.

## Merge Signals

Merge signals point the other way. Treat adjacent slices as one slice when
they:

- share one capability boundary, risk center, and verification story
- cannot be honestly verified alone, such as a data layer with no consumer or
  UI whose accepted behavior only works after the next slice
- exist mainly to keep individual slices small, splitting one user-visible
  outcome into setup-shaped fragments
- share most of their planning and verification context — the same models,
  screens, fixtures, and test setup — so splitting re-establishes identical
  context twice for pure fixed overhead. Merge these even when each could
  stand alone, as long as the merged slice still forms one honest
  verification story

During slicing, merge them before registering slices. During planning, use a
`merge` boundary recommendation so Strike can absorb the later slice before
build.

## Non-Vertical Slices

Non-vertical slices are allowed when they reduce risk or unlock near-term
vertical behavior. Keep them tightly scoped to the risk or enabling capability.
Explain why a vertical slice is worse first and name the next vertical slice they
unblock.

Non-vertical slices should stay narrow by default. If a non-vertical slice grows
beyond a small enabling change, add `Why Not Split`. If it becomes broad enough
to carry multiple risk centers or setup concerns, route back unless the phase
explicitly accepts that larger enabling boundary.

## Why Not Split

`Why Not Split` is required for L slices, non-vertical slices that grow beyond a
small enabling change, or any slice that looks overly broad but remains one
coherent buildable unit.

For L slices and grown non-vertical slices, a short note is enough: name the
split options considered and why each would create fake, throwaway, or
unverifiable work. A few sentences carry the judgment; do not pad them into a
form.

Use the full form only for XL slices whose larger boundary the phase explicitly
accepts. The full form must explain:

- split options considered
- why each split would create fake, throwaway, or unverifiable work
- the shared capability boundary and risk center
- the concrete verification story for the broader slice
- scope guardrails that keep the slice from becoming bundled work

Good full-form example:

```md
## Why Not Split

Split options considered:
- Separate API key storage from key-management UI.
- Separate revocation from key creation.

Why not split:
- The storage, masked display, and revocation states are one key lifecycle. A
  storage-only slice would create schema that cannot be verified through the
  accepted user workflow, and a UI-only slice would be throwaway without the
  server state transitions.

Shared capability / risk center:
- One plugin API-key lifecycle with one security invariant: raw keys are shown
  once, stored hashed, displayed masked, and rejected after revocation.

Verification story:
- Unit tests cover create/hash/mask/revoke/reject.
- Browser evidence creates one key, observes masked display, revokes it, and
  confirms the revoked state.

Scope guardrails:
- No plugin-side storage.
- No plugin connection validation.
- No first authenticated product action.
```

## Ready Slice Stubs

A fresh context should be able to open any `slice.md` and understand:

- outcome and acceptance criteria
- dependency order
- in-scope and out-of-scope boundaries
- likely surfaces and verification intent
- important edge, flow, risk, or working-state notes

Add `## Why Not Split` when required by this reference. Normal M vertical slices
that cross several surfaces to prove one capability do not need `Why Not Split`
unless they carry unusual breadth or multiple risk signals.

Add `## Non-Vertical Justification` only for non-vertical slices.
