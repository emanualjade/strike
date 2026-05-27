---
name: auto-strike
description: Use when the user asks for Auto Strike to turn an idea into a shipped feature or MVP with a standalone workspace.
argument-hint: "[idea]"
allowed-tools: Read Write Edit MultiEdit Bash Grep Glob WebFetch WebSearch Agent
---

# Auto Strike

Use this skill to move a fuzzy idea toward a shipped feature or MVP in any repo.
It borrows the highest-value Strike habits without using the normal Strike
board/card workflow. From a cold start, create the root `auto-strike/`
workspace and grow it from there.

## Boundaries

- This skill is user-invoked only.
- This skill does not use `docs/strike/`, Strike board pointers, Strike cards,
  or handoffs to other Strike skills.
- This skill creates and maintains a standalone root `auto-strike/` workspace in
  the consuming repo.
- The user only needs to invoke `auto-strike` and provide the idea; this skill
  owns the docs, questions, recommendations, planning, build, review, and
  verification loop.

## Host Invocation

When showing future prompts, use the plugin-root
`../../references/invocation.md` file, resolved from this `SKILL.md`, to render
the current host's syntax. Do not look for it under this skill's local
`references/` folder. When the host is unknown, show the skill name and
arguments as a plain next action.

Normal kickoff:

```text
auto-strike [idea]
```

Durable goal kickoff:

```text
Use the auto-strike skill to help build my idea: [idea].
```

Example idea:

```text
auto-strike Build an MVP web app where a user can upload a video, extract the
content, and re-edit it into something funny. This is the basic idea.
```

## Reference Loading

Do not load every reference by default. Load the smallest set that makes the
current work safe. Resolve `references/*` paths relative to this `SKILL.md`:

- `references/workspace.md`: cold start, resume, repeated run, workspace
  writes, doc shape.
- Current phase ref: `references/brainstorm.md`, `references/grill.md`,
  `references/spec.md`, `references/slice.md`, `references/build.md`,
  `references/review.md`, or `references/readiness.md`.
- `references/research.md`: stack docs, standards, domain modeling,
  architecture, security, privacy, cost, compliance, blast radius.
- `references/code-quality.md`: implementation edits, boundaries, data
  integrity, UI quality, env/secrets, observability.
- `references/verification.md`: tests, browser checks, user-flow checks,
  readiness checks.
- `references/dependencies.md`: packages, installs, upgrades, lockfiles,
  migrations.
- `references/recovery.md`: interrupted runs, missing docs, stale pointers,
  contradictory helper output, or untrustworthy state.

## Routing Loop

At the start of every run:

1. Read `references/workspace.md`, inspect `auto-strike/`, and run helper
   `inspect` when available.
2. Identify the current mode from user intent plus the active artifact.
3. Keep `auto-strike/index.md` as the small front door: initiative, mode,
   feature, doc/slice, state, next action, blocker.
4. Load the current phase ref and do that phase's work.
5. Before claiming done, run helper `validate` when available. Resolve errors.
   Treat warnings as prompts for judgment.
6. If state is missing or contradictory, use `recovery.md` before build, review,
   or readiness.

Do not expose workflow mechanics to the user unless they help with a decision.
The user should only need to provide the idea and respond to consequential
questions.

Auto Strike is usually unnecessary for trivial one-off edits. If the request is
only a tiny copy/style/single-file fix, handle it directly outside Auto Strike
unless the user explicitly wants Auto Strike state.

## Mode Commitment

Default phase order: brainstorm, grill, spec, slice, build, review, readiness.
This is the ideal workflow, not a blind waterfall. Move backward or sideways
when judgment says it improves the work.

Do not silently skip phases. Skip or compress a phase only when the user
explicitly opts out, asks to move along, prior artifacts already satisfy it, or
the phase truly does not apply. Record the artifact and reason.

A real brainstorm or grill means user engagement or exact prior answers.
Internal interpretation is not enough. If the question UI fails, ask in plain
text and stop. Tool failure, timeout, cancellation, or no answer is not
permission to proceed.

The kickoff prompt is input, not a spec. Extract facts, unknowns, assumptions,
and consequential decisions into phase artifacts before hardening scope, stack,
dependencies, persistence, auth/identity, feature count, or validation depth.
Words like `small`, `simple`, `MVP`, or `real workflow` are not settled
requirements until brainstorm/grill translates them into constraints.

Treat user- or repo-named tooling as a hard constraint. Do not switch runtime,
language, package manager, or build tool as a workaround unless the user
explicitly approves the tradeoff.

Do one phase at a time. A phase may leave a handoff, but it must record its own
state, review/exit evidence, and next mode before the next phase creates
artifacts. Do not blend work "in one pass" unless the user explicitly skips that
boundary.

After a slice closeout, name the next natural slice/action. Do not move Active
Work to the next slice or create the next slice doc unless the user explicitly
continues across that boundary.

Keep the initiative Phase Ledger current once work reaches slice, build, review,
or validation.

| Mode | Load | Exit Evidence |
| --- | --- | --- |
| brainstorm | `references/brainstorm.md` | First useful outcome, target moment, constraints, and first-version non-goals are clear. |
| grill | `references/grill.md` | Consequential product, domain, workflow, permission, data, integration, and success-check decisions are clear. |
| spec | `references/spec.md`, `references/code-quality.md` | Initiative overview and feature specs are clear enough to slice without guessing; no slice map or slice files are created yet. |
| slice | `references/slice.md`, `references/code-quality.md`, `references/verification.md` | Initiative feature split is explicit; active feature slices have size, dependencies, acceptance criteria, execution tasks, surfaces, checks, and checkpoints when needed. |
| build | `references/build.md`, `references/code-quality.md`, `references/verification.md` | One slice is implemented and evidence is recorded. |
| review | `references/review.md`, `references/code-quality.md`, `references/verification.md` | Findings are returned to the main agent, evaluated, fixed or accepted, and recorded. |
| readiness | `references/readiness.md`, `references/code-quality.md`, `references/verification.md`, `references/review.md` | The active feature or initiative passes spec, checks, representative flows, docs, and accepted residual-risk review. |

## Helper Use

Use the skill-local read-only helper with
`node <auto-strike skill dir>/scripts/auto-strike.mjs <command>`. It audits
state; it does not create docs, choose scope, advance modes, dispatch agents, or
replace judgment.

- `inspect`: cold start, resume, or before workspace writes.
- `validate`: before done, readiness, or clean handoff.
- `review-plan`: after recording `Changed:` and `Verified:` evidence.
- `review-context --lens <lens>`: prepare compact read-only reviewer packets.

For pre-build plan review, use the `implementation-plan` lens after the active
slice has implementation research and a concrete plan. For post-build review,
record slice evidence first so reviewers receive implementation files and
checks, not only planning docs.

## Operating Contract

- Drive toward the smallest useful production-shaped scope as quickly as quality
  allows.
- Inspect code and docs before asking questions the repo can answer.
- Ask one consequential question at a time.
- Make and record local, reversible, repo-pattern, docs-backed, or obvious
  first-version decisions without waiting on the user.
- Ask for user input on core domain language, schema/model shape, lifecycle
  states, ownership, permissions, business rules, privacy/legal posture,
  destructive behavior, tooling/security policy, or hard-to-reverse
  architecture.
- If user input is needed and the host question UI fails, ask in plain text and
  wait. Do not interpret tool failure as a user opt-out.
- Do not convert an initial prompt directly into a full build spec. Run the
  phase docs and decision checkpoint first unless the user explicitly opts out
  of questions or phases.
- Keep docs current as source of truth, not ceremony. Add files only when the
  work needs them.
- Keep `index.md` current as the resume pointer. Always record `Current mode`;
  once feature/slice/build evidence exists, do not leave it pointing at
  brainstorm, stale open decisions, no active feature/slice, or no verification.
- Keep root `language.md` plus the active initiative's `decisions.md` and
  `spec.md` current, even when they are minimal.
- Build, verify, review, and fix in loops until the stopping condition is met or
  a real blocker needs the user.
- Completed meaningful slices MUST run a read-only review subagent. A main-agent
  self-review is never sufficient on its own. Use `review.md`.
- UI/user-flow work follows `verification.md`: use `playwright-cli` only. If it
  is blocked, report code-verified rather than browser-verified.
- After each completed slice, commit and push the slice checkpoint before
  starting another slice. Do not include unrelated user work. If commit or push
  cannot complete, stop and report the exact blocker.

## Completion Standard

Auto Strike work is complete when the requested scope is production-shaped for
its declared purpose, not merely demoable. Use `readiness.md` for final
completion criteria. Follow-ups are allowed, but not as a hiding place for
defects inside the accepted scope.

If blocked, state the exact blocker, the decision or external change needed, and
the next action after it is resolved. If repeatedly looping on the same issue
without likely progress, stop and explain the blocker clearly.

## Output

Keep responses short and user-facing. Report:

- what changed or was clarified
- which Auto Strike docs were created or updated
- what was built or verified, when code changed
- for completed slices, the slice `Closeout Summary`: built, validation, review,
  skipped/residual risk, docs, commit and push, and next
- for UI/user-flow work, `playwright-cli` status; if blocked, say code-verified
  rather than browser-verified
- for completed readiness, a short receipt: shipped, run command, checks,
  review status, residual risk, commit and push, next action
- blockers, human/live checks, or skipped checks with reasons
- the next best action

Do not show raw workflow mechanics. Do not route to normal Strike board/card
skills. If continuing later would help, show the current host's `auto-strike`
prompt form using plugin-root `../../references/invocation.md`.
