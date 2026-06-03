---
name: grill-idea
description: Pressure-test a refined idea until key decisions, assumptions, and blockers are explicit enough for a spec.
argument-hint: "[refined idea or context] [--depth lean|standard|deep] [--output path]"
disable-model-invocation: true
allowed-tools: Read Write Edit Grep Glob WebFetch WebSearch Agent
---

# Grill Idea

Pressure-test a refined idea until key decisions are explicit enough for a spec.

## Inputs

- refined idea
- initiative research scope, reports, and index when present
- optional context files or repo paths
- optional decision depth: `lean`, `standard`, or `deep`
- optional output path

## Core Loop

Walk the consequential decision tree until shared understanding.

Facts: agent resolves. Tradeoffs: agent recommends. Choices: user decides. New
branches: keep walking.

For each decision node:

1. Decide whether it is factual or a user/product judgment.
2. If it can be answered from repo code, provided docs, initiative research, or
   official sources, answer it yourself and record the evidence.
3. If it requires user preference, product intent, scope choice, risk tolerance,
   priority, business rule, or ownership, ask the user one question.
4. Give your recommended answer and why.
5. If the answer creates new consequential decision nodes, continue the loop.

A decision node is exhausted only when it is resolved, accepted as an explicit
assumption, intentionally deferred with a named stage or owner, or blocked.

Do not ask the user factual questions you can answer yourself. Do not silently
decide user choices. Do not move to the final checkpoint while consequential
decision nodes remain unresolved.

## Process

- Identify decisions that change product behavior, scope, model shape, workflow,
  risk, or validation.
- Read `research/scope.md`, `research/index.md`, and the relevant per-topic
  research reports before pressure-testing decisions. Use researched
  capabilities, unsupported cases, unknowns, and repo patterns as decision
  inputs.
- If a material third-party API, model, database/schema behavior, queue,
  file/blob workflow, auth/payment surface, or repo architecture pattern is
  missing from initiative research, do not paper over it. Ask whether to route
  back to initiative research before continuing.
- Inspect provided repo/docs context instead of asking when a factual answer is
  already knowable.
- Ask one consequential question at a time. Briefly say why it matters and give
  a recommended answer when that helps the user decide.
- Use concrete scenarios for abstract decisions. Show alternatives only when
  they help the user choose, then wait for the user's answer.
- For provider/model work, ask decisions from the capability matrix: supported
  sizes, formats, routing, fallbacks, rejection behavior, cost/rate-limit
  constraints, storage boundaries, and how to handle unsupported requests.
- Treat a detailed kickoff as possible decision evidence, not automatic
  completion. Record which nodes it answered and which remain vague.
- You may draft `decisions.md` as working notes, but do not treat a draft as a
  substitute for live Grill questioning. If drafting reveals a consequential
  fork, stop and ask the user before finalizing the decision record.
- Initiate a user checkpoint before finishing, even when provided decision files,
  schemas, planning docs, or repo context seem to answer the pressure points.
  Summarize the resolved decisions, accepted assumptions, and deferred decisions,
  then ask whether the user is ready to move on or wants to discuss more.
- Wait for the user's answer to that checkpoint. Existing artifacts can inform
  the decision record, but they do not replace hearing from the user.
- Before completing Grill, run a read-only decision review of the final
  `decisions.md`. Use a subagent or custom agent when available; otherwise run a
  separate inline review pass. The reviewer must not edit files.
- If the decision review finds `Must Fix` issues, address them in `decisions.md`
  or ask the next user question, then rerun the review before completing.
- Recommend defaults for reversible low-risk details.
- Record user-stated decisions, accepted assumptions, deferred decisions, and
  blockers.
- When a decision crystallizes, update the output document as current truth.
  Keep rejected options only when they still explain the final choice.
- When discussion gets deep enough that the decision record would become noisy,
  optionally write concise supporting artifacts under
  `supporting-artifacts/`. Use them for schema notes, architecture tradeoffs,
  provider routing, data lifecycle, permissions, migrations, operational
  constraints, or other reasoning that should not vanish into chat.
- If you create supporting artifacts, list them in `decisions.md` and summarize
  the actual decisions or constraints they informed.
- Do focused research only when it can change a decision.
  Substantial missing research belongs back in `research-initiative`, not as a
  hidden side quest inside Grill.

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

## Decision Tree
- Node:
  Type: factual / user-choice / tradeoff
  Status: resolved / assumed / deferred / blocked
  Evidence:
  User question:
  Recommendation:
  Follow-on nodes:

## Accepted Assumptions
-

## Deferred Decisions
-

## Spec-Owned Details
- Detail:
  Constraint:

## Supporting Artifacts
- File:
  Why it exists:
  Decisions informed:

## Pressure Points
- Scope:
- Domain language:
- Models / relationships:
- Flows / states:
- Permissions / ownership:
- Data integrity / privacy:
- Integrations / failures:
- Research constraints:
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

## User Checkpoint
Prompt:
User response:
Ready to continue: yes / no

## Decision Review
Reviewer: subagent / inline
Review results returned: yes / no
Verdict: pass / needs-fix / accepted-risk
Must Fix count:
Findings addressed:
-
Accepted risks:
-

## Blocking Question
None.

## Spec Handoff
-
```

Supporting artifacts use this lightweight shape:

```md
# <Topic> Notes

Status: supporting

## Summary

## Decisions Informed
-

## Important Constraints
-

## Open Questions
-

## Do Not Infer
-
```

Decision review prompt:

```text
Read-only review this decisions.md before it goes to Main Spec. Check for
blind spots, unsupported assumptions, contradictions with initiative research,
official sources, repo code, or provided docs, unresolved consequential decision
nodes, missing owners or stages for deferrals, spec-blocking ambiguity, and
anything that would make the spec agent guess. Pay special attention to scope,
data, permissions, provider behavior, failure cases, validation, browser checks,
cost, privacy, and ownership. Return Must Fix / Follow-Up / Accepted Risk
findings. Do not edit files.
```

## Rules

- Do not create durable project state unless an output path is provided.
- Do not turn the idea into a spec.
- Do not let supporting artifacts become hidden source of truth. Any accepted
  decision, requirement, constraint, non-goal, or blocker needed for planning
  must be summarized in `decisions.md` and later carried into `main-spec.md`.
- Do not write pseudo-code or pseudo-schema just to fill the directory. Create
  supporting artifacts only when they preserve useful reasoning, tradeoffs,
  constraints, diagrams-in-words, or domain notes from the decision discussion.
- Do not ask about details the repo or provided context already answers.
- Do not ask the user factual questions you can answer from repo code, provided
  docs, initiative research, or official sources.
- Do not silently decide product, scope, risk, priority, business-rule, or
  ownership choices for the user.
- Do not silently draft around a consequential fork. Ask the next question.
- Do not ignore initiative research. When research says a capability is
  unsupported, unknown, expensive, risky, or constrained, turn that into an
  explicit decision, accepted assumption, deferred decision, or blocker.
- Do not merge multiple provider/model/API constraints into one vague decision
  when the reports show they differ.
- Keep questions limited to decisions that would change outcome, scope, or risk.
- Use `standard` depth when no depth is provided.
- Do not infer user answers from silence, failed tools, or unavailable question
  UI. Ask plainly and wait when the answer matters.
- Do not mark decisions ready to continue without `## User Checkpoint` showing
  that you asked the user whether to move on and received their answer.
- Do not complete Grill without `## Decision Review` showing
  `Review results returned: yes`, `Verdict: pass` or
  `Verdict: accepted-risk`, and `Must Fix count: 0`.
- Do not let decision review replace user questioning. If review finds a
  spec-blocking choice, ask the user one question and rerun the review.
- Do not move to the final checkpoint while consequential decision nodes remain
  unresolved.
- Do not treat provided docs, prior schemas, planning files, or silence as the
  user's checkpoint response.
- Do not turn stale contradiction history into the decision record; keep the
  artifact focused on current truth.
- Once constraints are decided, leave drafting details to the spec handoff.
