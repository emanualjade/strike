# Dogfood Observations

Last updated: 2026-06-04.

This is the running inbox for user-reported Strike dogfood observations. Keep
items compact here; put full transcript notes, artifacts, and reproduction
details under `docs/dogfood-runs/` when they need more context.

## Open

- [ ] Codex workflow-skill discovery fallback.
  - Reported: 2026-06-04.
  - Source: `docs/dogfood-runs/2026-06-04-indesign-plugin-auth-observation.md`.
  - Observation: `tool_search` did not surface `refine-idea`, so the agent fell
    back to installed local Strike plugin files while still treating the state
    helper as authoritative.
  - Follow-up: reproduce in a disposable Codex workspace and check whether
    `refine-idea` is present in the installed cache and discoverable in a fresh
    thread.

- [ ] Review-agent rubric path clarity during `verify-slice-plan`.
  - Reported: 2026-06-04.
  - Source: `docs/dogfood-runs/2026-06-04-indesign-plugin-auth-observation.md`.
  - Observation: the agent described a path wrinkle where verifier review-agent
    references were named relative to the plugin bundle rather than the skill
    folder.
  - Follow-up: reproduce from both an installed plugin cache and a local source
    workflow check, then decide whether this needs prompt clarity, helper
    support, or no change.

- [ ] `refine-idea` should feel more conversational and confirming.
  - Reported: 2026-06-04.
  - Source: `docs/dogfood-runs/2026-06-04-indesign-plugin-auth-observation.md`.
  - Observation: even with substantial upfront plans from the user, the idea
    refinement phase did not pull the user into enough friendly conversation to
    verify ownership and shared understanding before moving on. It felt more
    like "got it, ready to move on, are you cool too?" than a dialogue that
    showed what the agent had actually understood.
  - Desired feel: like friends over coffee. The agent should warmly summarize
    the context, reiterate what it thinks the user is really trying to do, and
    invite the user to say "yes, that's mine" or correct the framing.
  - Product requirement: `refine-idea` is not only for the model to gather
    enough input. It should create mutual confidence: the user understands the
    idea, the model understands the idea, the user knows the model understands,
    and the model has checked that the user agrees with the framing.
  - Follow-up: review `refine-idea` instructions for whether they encourage a
    real dialogue, summary, and human confirmation moment before `ideaRefined`,
    especially when the user has provided many plans up front.

- [ ] `grill-idea` should communicate the decision work more clearly.
  - Reported: 2026-06-04.
  - Source: `docs/dogfood-runs/2026-06-04-indesign-plugin-auth-observation.md`.
  - Observation: the grill stage felt curt and under-explained. It asked one
    question, accepted the answer, and moved on without giving the user
    confidence that the agent understood the decision space or what would be
    built next.
  - Desired intro: explain what this stage is doing now, what context it is
    carrying forward, and why the next question matters.
  - Desired middle: do more than ask a question. Share what Strike thinks,
    offer recommendations or suggested framing, and explain what is being
    resolved at that moment.
  - Desired close: summarize what the user and agent just did together,
    communicate that the decision tree has been explored and exhausted enough
    for this stage, state what Strike now understands will be built next, and
    give a friendly completion signal.
  - Follow-up: review `grill-idea` instructions for whether they require a
    confidence-building opening, explanatory decision dialogue, and closure
    summary before `decisionsResolved`.

- [ ] Strike should continue after verified slice checkpoints unless paused.
  - Reported: 2026-06-04.
  - Source: `docs/dogfood-runs/2026-06-04-indesign-plugin-auth-observation.md`.
  - Observation: during actual dogfood use, the agent stopped at phase 01,
    slice 03 `plan-slice` after slice 02 had been verified, committed, and
    pushed. The user expected it to continue because they had asked it to
    "carry on."
  - Agent explanation: no Strike skill explicitly told it to pause. It
    interpreted the project rule "Checkpoint verified goal work before starting
    broad new slices" as a clean handoff boundary, even though the skill
    supported returning control to `go`, running `next-step`, and continuing.
  - Desired behavior: after completing and checkpointing a verified slice,
    continue to the next Strike step unless the user asked to pause or the next
    step requires a user decision.
  - Follow-up: review orchestration/checkpoint language so agents understand a
    checkpoint is not a stop request when the user has asked Strike to continue.

## Positive Signals To Preserve

- The agent kept `refine-idea` narrow: produce the initiative `idea.md` and
  satisfy `ideaRefined` before moving on.
- The agent synced the helper before `verify-slice-plan`, confirmed the current
  phase/slice gate, and planned read-only audits before marking the plan ready.

## Closed

- None yet.
