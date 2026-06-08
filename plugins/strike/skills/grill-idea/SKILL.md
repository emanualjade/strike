---
name: grill-idea
description: Interview the user relentlessly about a refined idea until shared decisions, assumptions, and blockers are clear enough for a spec.
argument-hint: "[refined idea or context] [--depth lean|standard|deep] [--output path]"
disable-model-invocation: true
allowed-tools: Read Write Edit Grep Glob WebFetch WebSearch Agent
---

# Grill Idea

Interview the user relentlessly about the idea until there is shared
understanding. Walk each branch of the decision tree, resolve dependencies
between decisions one by one, and give a recommended answer for every user
question.

Ask one question at a time. If a question can be answered from the codebase,
provided docs, initiative research, or official sources, answer it yourself
instead of asking the user.

This is a conversation first and an artifact second. Artifact second means the
record follows the conversation; it does not mean waiting until the end to write
down decisions.

## Inputs

- refined idea
- initiative research scope, reports, and index when present
- optional context files or repo paths
- optional decision depth: `lean`, `standard`, or `deep`
- optional output path

## Core Loop

Open by briefly restating what you understand and naming the first decision
branch you want to test.

Then stay in this loop until the decision tree is exhausted:

1. Pick the most consequential unresolved decision node.
2. If it is factual, investigate it yourself and record the evidence.
3. If it needs user preference, product intent, scope choice, risk tolerance,
   priority, business rule, or ownership, ask exactly one question.
4. With every user question, explain why it matters, give your recommended
   answer, and name the tradeoff if there is one.
5. After the user answers, record the current truth and follow any new
   consequential branches that answer created. When an output path is provided,
   update that file before asking the next question.

If the answer opens another meaningful branch, ask the next question. If dozens
of questions are needed, ask dozens across turns. Do not treat one answer, a
draft document, or a polite checkpoint as proof that the tree is done.

Facts: agent resolves. Tradeoffs: agent recommends. Choices: user decides. New
branches: keep walking.

## What To Grill

Use these as prompts for finding branches, not as a form to fill out:

- scope, non-goals, first useful outcome, and what would be too much
- target users, operators, maintainers, systems, and workflow moments
- domain language, especially overloaded terms and core nouns
- model shape, relationships, lifecycle, states, and invariants
- UI, API, CLI, docs, or tooling behavior
- auth, security, privacy, payments, ownership, and permissions
- data integrity, destructive behavior, migrations, storage, and retention
- integrations, provider limits, unsupported cases, failure behavior, and cost
- validation, browser checks, live checks, human review, and accepted risk

Prefer concrete scenarios for abstract decisions: "When X happens, should the
system do A or B?" Show alternatives only when they help the user decide.

## Decision Depth

Use `standard` depth when no depth is provided.

- `lean`: resolve consequential decisions; assume only reversible low-risk
  details.
- `standard`: resolve enough product, domain, workflow, data, validation, and
  risk decisions that the spec agent will not have to guess.
- `deep`: keep exploring tradeoffs, edge cases, implications, and follow-on
  decisions for important nodes.

Lean does not mean casual. Do not assume auth, security, privacy, payments,
destructive data, ownership, permissions, compliance-sensitive choices,
dependency risk, or hard-to-reverse architecture without the user's explicit
answer.

## Research And Language

Read `research/scope.md`, `research/index.md`, and relevant per-topic research
reports when present. Turn researched constraints, unknowns, unsupported cases,
or repo patterns into decision nodes.

Do focused research only when it can change a decision. Substantial missing
research belongs back in `research-initiative`, not as a hidden side quest
inside Grill.

Read `PROJECT_LANGUAGE.md` before settling durable terms. Prefer the core noun
before qualifiers. If sibling terms such as `ManualReport` and
`ScheduledReport` appear, ask whether the qualifier is really a field, enum,
state, permission, relationship, configuration, placement, ownership, or usage
context.

## Output

If an output path is provided, write the decision record there and keep it as
current truth while the conversation progresses. Update it after each answered
consequential decision node, accepted assumption, deferral, blocker, or
supporting artifact link before asking the next question. Do not rely on chat
memory for decisions that belong in the output file.

If no output path is provided, keep the decision record in chat unless the user
asks to save it.

Use this shape:

```md
# Idea Decisions

## Decision Depth
Level:
Why:

## Decisions
- Decision:
  Source: user / evidence / assumption / deferred
  Why / impact / revisit if:

## Decision Tree
- Node:
  Status: resolved / assumed / deferred / blocked
  Evidence / user question / recommendation / follow-on nodes:

## Accepted Assumptions
-

## Deferred Decisions
-

## Spec-Owned Details
-

## Supporting Artifacts
- File:
  Why / decisions informed:

## Decision Review
Reviewer: subagent / inline
Review results returned: yes / no
Verdict: pass / needs-fix / accepted-risk
Must Fix count:
Findings addressed / accepted risks:

## User Checkpoint
Prompt:
User response:
Ready to continue: yes / no
```

Supporting artifacts may go under `supporting-artifacts/` when a discussion
needs a concise note outside `decisions.md`. Do not let supporting artifacts
become hidden source of truth; summarize every planning-relevant decision or
constraint in `decisions.md`.

Decision review prompt:

```text
Read-only review this decisions.md before it goes to Main Spec. Check for
unresolved consequential decision nodes, unsupported assumptions,
contradictions with initiative research, official sources, repo code, or
provided docs, missing owners for deferrals, spec-blocking ambiguity, and
anything that would make the spec agent guess. Return Must Fix / Follow-Up /
Accepted Risk findings. Do not edit files.
```

## Finish

When you think the tree is exhausted, run a read-only decision review. If the
review finds a `Must Fix`, resolve it in the record or re-enter the Core Loop
with the next user question, then review again.

After the final review passes or the user accepts the remaining risk, summarize
what Strike now understands: resolved decisions, accepted assumptions, deferred
decisions, blockers, and what the spec should build next. Then ask whether the
user is ready to continue or wants to discuss more, and wait for the answer.

Do not complete Grill without `## Decision Review` showing
`Review results returned: yes`, `Verdict: pass` or `Verdict: accepted-risk`, and
`Must Fix count: 0`, followed by a later `## User Checkpoint` with a non-empty
`User response:` and `Ready to continue: yes`.

## Guardrails

- Do not create durable project state unless an output path is provided.
- When an output path is provided, do not defer decision recording until the
  final review or checkpoint.
- Do not turn the idea into a spec.
- Do not ask the user factual questions you can answer yourself.
- Do not silently decide product, scope, risk, priority, business-rule, or
  ownership choices for the user.
- Do not infer user answers from silence, provided docs, prior schemas, planning
  files, or failed tools.
- Do not silently draft around a consequential fork. Ask the next question.
- Do not move to the final checkpoint while consequential decision nodes remain.
- Do not let decision review replace user questioning.
- Existing artifacts can inform the decision record, but they do not replace
  hearing from the user.
