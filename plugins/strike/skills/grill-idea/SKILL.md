---
name: grill-idea
description: Pressure-test a refined idea until key decisions, assumptions, and blockers are explicit enough for a spec.
argument-hint: "[refined idea or context] [--depth lean|standard|deep] [--output path]"
disable-model-invocation: true
allowed-tools: Read Write Edit Grep Glob WebFetch WebSearch
---

# Grill Idea

Pressure-test a refined idea until key decisions are explicit enough for a spec.

## Inputs

- refined idea
- optional context files or repo paths
- optional decision depth: `lean`, `standard`, or `deep`
- optional output path

## Process

- Identify decisions that change product behavior, scope, model shape, workflow,
  risk, or validation.
- Inspect provided repo/docs context instead of asking when a factual answer is
  already knowable.
- Ask one consequential question at a time. Briefly say why it matters and give
  a recommended answer when that helps the user decide.
- Use concrete scenarios for abstract decisions. Show alternatives only when
  they help the user choose, then wait for the user's answer.
- Treat a detailed kickoff as possible decision evidence, not automatic
  completion. Record which nodes it answered and which remain vague.
- Recommend defaults for reversible low-risk details.
- Record user-stated decisions, accepted assumptions, deferred decisions, and
  blockers.
- When a decision crystallizes, update the output document as current truth.
  Keep rejected options only when they still explain the final choice.
- Do focused research only when it can change a decision.

## Decision Depth

Use `standard` depth when no depth is provided.

- `lean`: resolve consequential decisions and assume only reversible low-risk
  details.
- `standard`: pressure-test major product, domain, workflow, data, validation,
  and risk decisions enough to spec without guessing.
- `deep`: examine tradeoffs, edge cases, implications, and follow-on decisions
  for important nodes.

Lean does not lower downstream quality. Do not assume auth, security, privacy,
payments, destructive data, ownership, permissions, compliance-sensitive choices,
dependency risk, or hard-to-reverse architecture unless the user explicitly
accepts it.

## Pressure Points

Use these as a menu, not a checklist:

- affected user, system, workflow, and success
- scope, non-goals, and first useful outcome
- domain language and overloaded terms
- core nouns, relationships, and model shape
- flows, lifecycle, state, and invariants
- ownership, permissions, privacy, and data integrity
- integrations, external side effects, and failure cases
- UI, API, CLI, docs, or tooling behavior when relevant
- validation evidence, browser checks, live checks, and human checks

Hardening decisions need explicit handling before spec when they affect stack,
dependencies, package installs, runtime, tooling constraints, data model,
persistence, auth, identity, session, permissions, ownership, lifecycle,
validation depth, browser/manual checks, security, cost, or privacy.

## Language

Read `PROJECT_LANGUAGE.md` before settling durable terms.

Update it when this work clarifies a stable term, accepted alias, conflict, or
meaningful ambiguity.

Alert the user when a language change affects model shape, lifecycle,
ownership, permissions, privacy, destructive behavior, or user-facing promises.

When naming domain concepts, prefer the core noun before qualifiers. If sibling
terms appear, such as `ManualReport` / `ScheduledReport`, pause and ask whether
the qualifier is better as a field, enum, state, permission, relationship,
configuration, placement, ownership, or usage context.

## Output

If an output path is provided, write the decision document there.

If no output path is provided, ask the user where they would like to save it.

Use this shape:

```md
# Idea Decisions

## Decision Depth
Level:
Why:

## Decisions Resolved
- Decision:
  Why:
  Rejected:
  Impact:
  Revisit if:

## Accepted Assumptions
-

## Deferred Decisions
-

## Spec-Owned Details
- Detail:
  Constraint:

## Pressure Points
- Scope:
- Domain language:
- Models / relationships:
- Flows / states:
- Permissions / ownership:
- Data integrity / privacy:
- Integrations / failures:
- Validation evidence:

## Decision Checkpoint
- Scope / size:
- Stack / dependencies / tooling constraints:
- Data / persistence / state:
- Auth / identity / permissions:
- Non-goals:
- Validation / browser or live checks:
- User-confirmed decisions:
- Accepted assumptions:
- Deferred decisions:

## Blocking Question
None.

## Spec Handoff
-
```

## Rules

- Do not create durable project state unless an output path is provided.
- Do not turn the idea into a spec.
- Do not ask about details the repo or provided context already answers.
- Keep questions limited to decisions that would change outcome, scope, or risk.
- Use `standard` depth when no depth is provided.
- Do not infer user answers from silence, failed tools, or unavailable question
  UI. Ask plainly and wait when the answer matters.
- Do not turn stale contradiction history into the decision record; keep the
  artifact focused on current truth.
- Once constraints are decided, leave drafting details to the spec handoff.
