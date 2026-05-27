# Grill

Pressure-test the idea until the important decisions are clear enough to write a
spec. Walk the decision tree one consequential node at a time. Ask only for
decisions that matter, include a recommendation, and inspect repo docs/code
instead of asking when the repo can answer.

Default path:

- `auto-strike/initiatives/<initiative-slug>/grill.md`

Grill is not optional for meaningful feature or MVP work unless the user
explicitly opts out, says to move along, or asks the agent to proceed without
questions. A detailed kickoff prompt can answer decision nodes, but it does not
replace grill unless it explicitly answers those nodes. Record which decisions
were user-stated, which were accepted assumptions, and which need a question
before spec.
If a question tool or UI fails while asking grill questions, fall back to a
plain-text question and stop. A failed tool call, denied question, timeout, or
missing answer is not user permission to accept defaults or leave grill.

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

Hardening decisions require explicit handling before spec/slice/build:

- scope and meaning of vague words such as "small", "simple", "MVP", "local",
  "real workflow", "production", or "quick"
- stack, framework, dependency, package install, runtime, and build choices
- repo or user tooling constraints, especially security-driven ones; do not
  switch runtimes or package managers as a no-install workaround without
  explicit user approval
- data model, persistence, auth/identity/session, permissions, ownership, and
  lifecycle/state choices
- feature split, non-goals, validation depth, browser/manual checks, and any
  dependency/security/cost/privacy risk

Before a meaningful grill session, ask once unless the user already chose a
depth:

```md
How deeply should I pressure-test decisions before spec?

- Lean: ask only consequential questions; record safe assumptions.
- Standard: pressure-test major product, domain, workflow, and risk decisions.
- Deep: keep drilling until important decisions are explicit.

Default is Standard. You can change depth as we go.
```

If the user does not answer but grill can otherwise continue, use `Standard` and
record `Why: Default.` Do not choose `Lean` unless the user asks for speed or
accepts lean depth.

Decision Depth applies only to Grill. It controls how hard each decision node is
examined, not whether new branches are noticed. Capture consequential new
branches at every level. It never lowers spec, slice, build, review,
verification, readiness, security, or code-quality standards.

- Lean: resolve consequential decisions; assume reversible low-risk details only
  when they do not change scope, quality, or risk.
- Standard: resolve major decisions enough to spec without guessing.
- Deep: examine tradeoffs, edge cases, implications, and follow-on decisions for
  important nodes.

Lean must not assume auth/security, privacy, payments, destructive data,
ownership, permissions, compliance-sensitive choices, dependency risk, or
hard-to-reverse architecture unless the user explicitly accepts it.

If an area needs more depth, suggest it briefly and record the change after user
direction or a clearly safer move deeper. Going leaner for an area requires user
consent.

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
After recording the Decision Checkpoint and Exit Evidence, stop with spec as the
next action. Do not continue into spec in the same work unit unless the user
explicitly asked to skip that boundary.
When asking the user to resolve the active grill decision, do not promise to
write specs, create feature specs, slice the build, or begin implementation
after their answer. Promise only to record the decision, close grill, and leave
spec as the next action.

Use `grill.md` as the grill work packet:

```md
# [Initiative] Grill

## Phase Tasks
- [ ] Review the brainstorm handoff and repo context.
- [ ] Set or confirm Grill Decision Depth.
- [ ] Translate vague kickoff language into explicit constraints or questions.
- [ ] Identify consequential product/domain/data/workflow decisions.
- [ ] Capture consequential new branches as they appear.
- [ ] Suggest deeper or lighter area depth only when risk/profile justifies it.
- [ ] Ask or answer only decisions that change product behavior or risk.
- [ ] Record the Decision Checkpoint before spec.
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

## Decision Checkpoint
- Scope / size:
- Stack / dependencies / tooling constraints:
- Data / persistence / state:
- Auth / identity / permissions:
- Feature split / non-goals:
- Validation / browser or live checks:
- User-confirmed decisions:
- Accepted assumptions:
- Deferred decisions:

## Exit Evidence
- [Why the initiative is clear enough to spec at the selected depth, including
  accepted assumptions, deferred decisions, and unresolved blockers.]

## Handoff To Spec
- [Initiative feature map, rules, constraints, flows, and risks the spec must preserve.]
```

Exit when consequential product, domain, workflow, permission, data,
integration, and success-check decisions are clear enough to spec without
guessing. If no user question is needed, record why repo context, prior
artifacts, explicit user wording, or a user opt-out already answered the
consequential decisions. Do not leave grill by silently converting the kickoff
prompt into a spec.
