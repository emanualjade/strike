---
name: refine-idea
description: Clarify a raw idea into a useful first outcome, with explicit facts, assumptions, constraints, and non-goals.
argument-hint: "[idea] [--output path]"
disable-model-invocation: true
allowed-tools: Read Write Edit Grep Glob WebFetch WebSearch
---

# Refine Idea

Clarify a raw idea into a useful first outcome.

## Inputs

- raw idea
- optional context files or repo paths
- optional output path

## Process

- Separate explicit facts from assumptions.
- Name the target user, maintainer, operator, system, or workflow moment.
- Clarify the painful moment, current workaround, or opportunity.
- Propose the first useful outcome.
- Identify constraints and first-version non-goals.
- Initiate a user checkpoint before finishing, even when provided docs, decision
  files, schemas, or existing plans seem complete. Briefly summarize the refined
  outcome and ask whether the user is ready to move on or wants to discuss more.
- Wait for the user's answer to that checkpoint. Existing artifacts can inform
  the refined idea, but they do not replace hearing from the user.
- Ask one consequential question if the first useful outcome cannot be clarified.

Do light research only when it can change the first useful outcome, constraints,
privacy/cost risk, or feasibility.

## Language

Read `PROJECT_LANGUAGE.md` before settling durable terms.

Update it when this work clarifies a stable term, accepted alias, conflict, or
meaningful ambiguity.

Alert the user when a language change affects model shape, lifecycle,
ownership, permissions, privacy, destructive behavior, or user-facing promises.

## Output

If an output path is provided, write the refined idea there.

If no output path is provided, ask the user whether they want to save it or keep
it in chat.

Use this shape:

```md
# Refined Idea

## Explicit Facts
-

## Assumptions
-

## Target Moment

## First Useful Outcome

## Constraints
-

## Non-Goals
-

## Open Questions
-

## User Checkpoint
Prompt:
User response:
Ready to continue: yes / no
```

## Rules

- Do not create durable project state unless an output path is provided.
- Do not choose stack, dependencies, persistence, auth, or phase count unless
  the idea requires that decision now.
- Prefer a small useful outcome over a broad feature wish.
- Keep open questions limited to decisions that would change outcome, scope, or
  risk.
- Do not mark the idea ready to continue without `## User Checkpoint` showing
  that you asked the user whether to move on and received their answer.
- Do not treat provided docs, prior schemas, planning files, or silence as the
  user's checkpoint response.
