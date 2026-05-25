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

When showing future prompts, use the plugin package's `references/invocation.md`
to render the current host's syntax. Do not copy host-specific command examples
unchanged unless they match the active host. When the host is unknown, show the
skill name and arguments as a plain next action.

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

Do not load every reference file by default. Read only the references needed for
the current work, but always read the required one before doing material work in
that area.

Use this map:

- Cold start, resume, repeated run, doc restructuring, or any workspace write:
  read `references/workspace.md`.
- Research, standards, stack docs, domain modeling, architecture options,
  compliance, security, privacy, cost, or blast-radius decisions: read
  `references/research.md`.
- Brainstorm, grill, spec, slice, build, review, or readiness mode: read the
  matching phase file in `references/`.
- Code structure, boundaries, change safety, data integrity, observability,
  env/secrets, UI quality, or implementation edits: read
  `references/code-quality.md`.
- Verification, tests, browser/user-flow checks, or readiness checks: read
  `references/verification.md`.
- Dependencies, package installs/upgrades, migrations, lockfiles, package-shaped
  architecture choices, or greenfield setup decisions: read
  `references/dependencies.md`.

If a task crosses areas, read the small set of relevant references. For example,
first implementation in a new repo normally needs `workspace.md`,
the active phase file, `code-quality.md`, and `verification.md`; stack/domain
uncertainty also needs `research.md`, and package/install decisions also need
`dependencies.md`.

## Routing Loop

At the start of every run, route deliberately:

1. Read `references/workspace.md` and inspect existing `auto-strike/` state.
   Use the helper's `inspect` command when available.
2. Identify the current mode from user intent and the active artifact:
   brainstorm, grill, spec, slice, build, review, or readiness.
3. Keep `auto-strike/index.md` as a small front door: active initiative, active
   feature when relevant, active doc or slice, short state, next action, and
   blocker if any.
4. Load the reference files for that mode, then do that mode's work until its
   purpose is satisfied or a better mode is needed.
5. Before claiming done, run the helper's `validate` command when available and
   resolve errors. Treat warnings as prompts for judgment, not automatic
   blockers.

Do not expose workflow mechanics to the user unless they help with a decision.
The user should only need to provide the idea and respond to consequential
questions.

Auto Strike is usually unnecessary for trivial one-off edits. If the request is
only a tiny copy/style/single-file fix, handle it directly outside Auto Strike
unless the user explicitly wants Auto Strike state.

## Mode Commitment

Treat the phase order as the ideal default workflow, not a mandated waterfall.
Move forward, backward, or sideways when judgment says another mode would better
serve the work, and borrow another mode's principles when the current work
surfaces that kind of problem.

Each mode still has a purpose. When moving modes, leave enough state for a fresh
context to know whether the active doc is complete, paused, skipped, replaced,
or being revisited. This can be one line in `index.md` or the active phase doc:
what changed, what is still open, and why moving modes is the right next step.
Do not claim a mode is complete after a shallow pass that did not produce its
intended result.

| Mode | Load | Exit Evidence |
| --- | --- | --- |
| brainstorm | `brainstorm.md` | First useful outcome, target moment, constraints, and first-version non-goals are clear. |
| grill | `grill.md` | Consequential product, domain, workflow, permission, data, integration, and success-check decisions are clear. |
| spec | `spec.md`, `code-quality.md` | Initiative overview and feature specs are clear enough to slice without guessing. |
| slice | `slice.md`, `code-quality.md`, `verification.md` | Initiative feature split is explicit; active feature slices have size, dependencies, acceptance criteria, execution tasks, surfaces, checks, and checkpoints when needed. |
| build | `build.md`, `code-quality.md`, `verification.md` | One slice is implemented and evidence is recorded. |
| review | `review.md`, `code-quality.md`, `verification.md` | Findings are returned to the main agent, evaluated, fixed or accepted, and recorded. |
| readiness | `readiness.md`, `code-quality.md`, `verification.md`, `review.md` | The active feature or initiative passes spec, checks, representative flows, docs, and accepted residual-risk review. |

## Helper Use

Use the skill-local read-only helper at `scripts/auto-strike.mjs` when
available. It audits state; it does not create docs, choose scope, advance
modes, dispatch agents, or replace judgment.

- `inspect`: cold start, resume, or before workspace writes.
- `validate`: before done, readiness, or clean handoff.
- `review-plan`: after recording `Changed:` and `Verified:` evidence.
- `review-context --lens <lens>`: prepare compact read-only reviewer packets.

For pre-build plan review, use the `implementation-plan` lens after the active
slice has implementation research and a concrete plan. For post-build review,
record slice evidence first so reviewers receive implementation files and
checks, not only planning docs.

## Operating Contract

- Drive toward the smallest useful feature or MVP as quickly as quality allows.
- Inspect code and docs before asking questions the repo can answer.
- Ask one consequential question at a time.
- Make and record local, reversible, repo-pattern, docs-backed, or obvious
  first-version decisions without waiting on the user.
- Ask for user input on core domain language, schema/model shape, lifecycle
  states, ownership, permissions, business rules, privacy/legal posture,
  destructive behavior, or hard-to-reverse architecture.
- Keep docs current as source of truth, not ceremony. Add files only when the
  work needs them.
- Build, verify, review, and fix in loops until the stopping condition is met or
  a real blocker needs the user.
- Use subagents only when independent research or review clearly helps; use
  `review.md` for reviewer behavior and synthesis rules.

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
  skipped/residual risk, docs, and next
- blockers, human/live checks, or skipped checks with reasons
- the next best action

Do not show raw workflow mechanics. Do not route to normal Strike board/card
skills. If continuing later would help, show the current host's `auto-strike`
prompt form using `references/invocation.md`.
