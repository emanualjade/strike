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
- Interrupted runs, workspace wipes, missing active docs/slices, stale pointers,
  or helper errors that contradict the current mode: read
  `references/recovery.md`.

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
3. Keep `auto-strike/index.md` as a small front door: active initiative,
   explicit current mode, active feature when relevant, active doc or slice,
   short state, next action, and blocker if any.
4. Load the reference files for that mode, then do that mode's work until its
   purpose is satisfied or a better mode is needed.
5. Before claiming done, run the helper's `validate` command when available and
   resolve errors. Treat warnings as prompts for judgment, not automatic
   blockers.
6. If validation shows missing or contradictory Auto Strike state, read
   `references/recovery.md` and re-establish the current truth before building,
   reviewing, or claiming readiness.

Do not expose workflow mechanics to the user unless they help with a decision.
The user should only need to provide the idea and respond to consequential
questions.

Auto Strike is usually unnecessary for trivial one-off edits. If the request is
only a tiny copy/style/single-file fix, handle it directly outside Auto Strike
unless the user explicitly wants Auto Strike state.

## Mode Commitment

For meaningful feature or MVP work, treat the phase order as the required
default workflow: brainstorm, grill, spec, slice, build, review, readiness.
Move backward or sideways when judgment says another mode would better serve the
work, but do not silently skip a phase. A phase may be skipped or compressed
only when the user explicitly opts out, explicitly asks to move along, prior
artifacts already satisfy it, or the phase truly does not apply; record the
artifact and reason.

A proper brainstorm or grill means the agent either engaged the user on the
phase's consequential questions, or the user already answered those exact
questions explicitly. Internal interpretation is not enough.
If the host's question tool is unavailable, rejected, or errors, ask the same
question in the normal user-facing response and stop. A failed question tool,
cancelled prompt, timeout, or missing answer is not permission to skip,
compress, pick defaults, or proceed.

The kickoff prompt is input, not a spec. Even when it is detailed, extract facts,
unknowns, assumptions, and consequential decisions into the phase artifacts
before hardening scope, stack, dependencies, persistence, auth/identity, feature
count, or validation depth. Do not treat words like "small", "simple", "MVP",
or "real workflow" as settled requirements until brainstorm/grill translates
them into explicit constraints.

Treat user- or repo-named tooling as a hard constraint, especially when framed
as security policy. Do not choose a different runtime, language, package
manager, or build tool as a no-install workaround unless the user explicitly
approves that stack change after you name the tradeoff.

Each mode still has a purpose. When moving modes, leave enough state for a fresh
context to know whether the active doc is complete, paused, skipped, replaced,
or being revisited. This can be one line in `index.md` or the active phase doc:
what changed, what is still open, and why moving modes is the right next step.
Do not claim a mode is complete after a shallow pass that did not produce its
intended result.

Do not blend phase work "in one pass." A phase may prepare a concise handoff for
the next phase, but it must record its own review and exit evidence before the
next phase's artifacts are created. In particular, spec mode writes initiative
specs, feature specs, and a brief `Slice Handoff`; slice mode writes
`slices/index.md` and `slices/slice-*.md`.

A work unit should complete at most one major phase transition. Creating cold
start skeleton docs is fine, but after you mark brainstorm, grill, spec, or
slice complete, stop the current unit with a short user-facing receipt and the
next natural mode. Do not mark spec and slice done, or slice done and build in
progress, in the same unit unless the user explicitly asked to skip that phase
boundary. In durable goal mode, the next continuation can resume from
`index.md` and the active phase doc.

The same boundary applies between build slices. After a slice closeout, name the
next natural slice/action, but do not move Active Work to that next slice, create
its slice doc, or promise "write, research, plan, implement, and verify" as one
next action unless the user explicitly asked to continue across slice
boundaries.

When asking for a decision, do not promise a bundled downstream run such as
"answer this and I will close grill, write specs, and slice the build." Phrase
the next action as the current phase closeout plus the immediate next mode only:
"answer this and I will close grill with spec as the next action." The next
continuation can then load the next phase reference and commit to that phase.

For initiative work that reaches slice, build, review, or validation, keep the
initiative `Phase Ledger` from `workspace.md` current. Earlier phases may be
compressed or skipped only with explicit user opt-out, prior-artifact evidence,
or a clear not-applicable reason.

| Mode | Load | Exit Evidence |
| --- | --- | --- |
| brainstorm | `brainstorm.md` | First useful outcome, target moment, constraints, and first-version non-goals are clear. |
| grill | `grill.md` | Consequential product, domain, workflow, permission, data, integration, and success-check decisions are clear. |
| spec | `spec.md`, `code-quality.md` | Initiative overview and feature specs are clear enough to slice without guessing; no slice map or slice files are created yet. |
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
- For completed meaningful slices: You MUST run a read-only review subagent.
  A main-agent self-review is never sufficient on its own. Use `review.md`.

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
prompt form using plugin-root `../../references/invocation.md`.
