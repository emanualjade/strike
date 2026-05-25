# Grill

Pressure-test the idea until the important decisions are clear enough to write a
spec. Walk the decision tree one consequential node at a time. Ask only for
decisions that matter, include a recommendation, and inspect repo docs/code
instead of asking when the repo can answer.

Default path:

- `auto-strike/initiatives/<initiative-slug>/grill.md`

Good grill areas:

- affected user/system/workflow and success
- scope, non-goals, and first useful outcome
- domain language and overloaded terms
- core nouns, relationships, and model shape
- flows, lifecycle, state, and invariants
- permissions, ownership, privacy, and data integrity
- integrations, external side effects, and failure cases
- UI/API/CLI behavior when relevant
- validation evidence

When starting a meaningful grill session, ask once unless the user already gave
a clear depth signal:

```md
How hard should I grill decisions before spec?

- Lean: move fast, ask only consequential questions, record reversible assumptions.
- Standard: pressure-test major product/domain/workflow decisions.
- Deep: stress-test important decision points with scenarios, tradeoffs, and implications.

Default is Standard. You can change this as we go if you want more or less detail.
```

Decision Depth applies only to Grill. It controls how deeply each decision node
is examined, not whether new branches are noticed. Capture consequential new
branches at every level. It does not lower spec, slice, build, review,
verification, readiness, security, or code-quality standards.

- Lean: resolve or record consequential decisions; assume reversible low-risk
  details when they do not change scope, quality, or risk.
- Standard: resolve major decision points enough to spec without guessing.
- Deep: examine tradeoffs, implications, edge cases, and follow-on decisions for
  important decision points before spec.

Lean still must not assume auth/security, privacy, payments, destructive data,
ownership, permissions, compliance-sensitive choices, dependency risk, or
hard-to-reverse architecture unless explicitly out of scope or accepted by the
user.

If one area has a different risk profile, suggest a depth change briefly.
Suggestions are not active overrides. Record active overrides only after user
direction or a clearly justified move deeper. Going leaner for an area requires
user consent.

When naming models or concepts, prefer the core noun before qualifiers. If the
language starts creating sibling nouns like `ManualReport` and
`ScheduledReport`, ask whether the qualifier is better as a field, enum, state,
permission, relationship, configuration, placement, ownership, or usage context.

Update root `language.md` and the initiative `decisions.md` as language and
decisions crystallize. Do not keep contradictory history unless it explains the
current choice.
Grill happens at the initiative level. It may discover feature candidates, but
it does not create new initiatives. If the work looks like a separate
initiative, ask the user before splitting it out.
Update the initiative Phase Ledger when entering and leaving grill. If grill is
compressed because the prompt or repo already answered the consequential
decisions, record that as `compressed` with the artifact and reason.

Use `grill.md` as the grill work packet:

```md
# [Initiative] Grill

## Phase Tasks
- [ ] Review the brainstorm handoff and repo context.
- [ ] Set or confirm Grill Decision Depth.
- [ ] Identify consequential product/domain/data/workflow decisions.
- [ ] Capture consequential new branches as they appear.
- [ ] Suggest deeper or lighter area depth only when risk/profile justifies it.
- [ ] Ask or answer only decisions that change product behavior or risk.
- [ ] Update root `language.md` and initiative `decisions.md` with current truth.
- [ ] Record exit evidence and handoff to spec.

## Decision Depth
Level: Standard
Why: Default / user chose / inferred from user request.

Suggested Depth Changes:
- None.

Active Area Overrides:
- None.

Assumptions Accepted:
- None.

## Active Decision Node
Decision:
Why it matters:
Recommendation:
Question:

## Decision Tree
- [Node] - [resolved / open / deferred / assumed] - [summary]

## Pressure Points
- Scope:
- Feature candidates:
- Domain language:
- Models/relationships:
- Flows/states:
- Permissions/ownership:
- Data integrity/privacy:
- Integrations/failures:
- Validation evidence:

## Decisions Made
- [Decision] - [where recorded]

## Exit Evidence
- [Why the initiative is clear enough to spec at the selected depth, including
  accepted assumptions, deferred decisions, and unresolved blockers.]

## Handoff To Spec
- [Initiative feature map, rules, constraints, flows, and risks the spec must preserve.]
```

Exit when consequential product, domain, workflow, permission, data,
integration, and success-check decisions are clear enough to spec without
guessing. If no user question is needed, record why repo context or the user's
input already answered the consequential decisions.
