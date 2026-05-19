---
name: phase-research
description: Research one implementation phase before build-brief planning.
argument-hint: "[project-slug] phase:<phase-slug> [optional focus]"
disable-model-invocation: true
allowed-tools: Read Write Edit MultiEdit Bash Grep Glob WebFetch WebSearch Agent
---

# Strike Phase Research

## Communication

When speaking to the user or asking questions, use relaxed, friendly language,
like two friends talking through the work over coffee. Explain things in simple
terms without assumptions, guide with context, and simplify concepts so the
conversation feels easy to follow. Keep the conversation centered on the work
in progress; avoid explaining Strike mechanics unless that context helps the
user decide what to do next.

## Purpose

Optionally research one implementation phase before writing its build brief.

Use this when a phase has enough technical, integration, framework, UX,
accessibility, data, auth, payment, webhook, migration, or test risk that a
dedicated evidence pass would make phase-plan better.

For simple phases, skip this utility and go straight to
the `phase-plan` skill.

## Host Invocation

When showing follow-up Strike skills, use the plugin package's
`references/invocation.md` to render the current host's syntax. Do not copy
`/strike:*` examples unchanged unless the current host is Claude Code. When
the host is unknown, show the skill name and arguments as a plain next action
without raw field labels.

## User Customization

Before material phase-research work, load repo-local customization for this
skill.

Resolve the bundled customization script by absolute path from this installed
plugin package. This skill lives at
`<plugin-root>/skills/phase-research/SKILL.md`; the script lives at
`<plugin-root>/references/scripts/customize.mjs`.

Run the loader from the consuming repository root:

```bash
node <plugin-root>/references/scripts/customize.mjs --repo-root <repo-root> load phase-research
```

Apply the printed customization packet only when it does not conflict with this
skill's Purpose, Minimal Mechanics, Reads, Writes, or Gates. Customization may
shape phase-scoped evidence, local precedent checks, tactical risk synthesis,
and extra docs/assets. Extra docs/assets are optional user-requested outputs,
not customization inputs. Create them only with clear per-project or shared
intent and a repo-safe save path. If the path or intent is unclear, ask before
creating them and suggest updating
`strike/customize/phase-research/phase-research.md` or running
`customize review phase-research` after editing.

## Minimal Mechanics

Board location is state. This utility may work only when the card pointer is
in:

```txt
docs/strike/board/06-implementation/<project-slug>.md
```

Require an explicit phase argument:

```txt
Next Strike skill: phase-research
Arguments: <project-slug> phase:<phase-slug>
```

If the pointer is in another lane, or the phase cannot be resolved, stop and
recommend:

```txt
Reset context first: yes
Next Strike skill: go
Arguments: <project-slug>
```

Do not write implementation files, tests, build briefs, build evidence, review,
acceptance, retro, repo glossary edits, durable IDs, YAML blocks, or hidden
routing metadata.

## Reads

- board pointer
- `cards/<project-slug>/card.md`
- `outputs/spec/spec.md`
- `phases/<phase-slug>/plan.md`
- existing `phases/<phase-slug>/research.md` if present
- `outputs/research/research.md` when Project-level research is relevant
- focused repo/docs context
- official/current online docs when stack behavior or external contracts matter

Treat `plan.md` and `spec.md` as the main inputs. Do not rerun project
research. Pull only what matters to this phase.

## Writes

- `cards/<project-slug>/phases/<phase-slug>/research.md`
- optional user-requested docs/assets under
  `strike/user-docs/<project-slug>/phase-research/...`,
  `strike/user-docs/shared/...`, or another repo-safe path the current user
  explicitly provides or confirms
- `cards/<project-slug>/card.md` only when a real blocker or decision needs to
  survive a context reset
- board pointer moved back from `06-implementation` to `05-slice` only when
  research shows the phase split itself is wrong

Otherwise do not move the board pointer.

## What To Research

Use the phase plan's focus/watchouts as the starting point. Pick only the lanes
that matter:

- `repo-precedents`: exact local files, helpers, components, schemas, server
  functions, commands, docs examples, config, APIs, or tests this phase should
  follow.
- `stack-docs`: official/current docs for libraries, SDKs, APIs, webhooks,
  auth, accessibility, SSR, routing, animation, database, CLI/tooling, package,
  or testing behavior.
- `test-dev-setup`: fixtures, env vars, local run commands, data setup,
  selectors, mocking rules, generated artifacts, and focused verification
  commands.
- `phase-pitfalls`: race conditions, access boundaries, permissions,
  idempotency, external event ordering, retries, partial states, security,
  privacy, reduced-motion, a11y, data integrity, or failure modes specific to
  this phase.
- `prior-phase-carry-forward`: outputs or conventions from earlier phases, if
  this is not the first phase.

Online/current-doc research is first-class for unstable or external technology.
Prefer primary sources: official docs, source repos, standards, vendor docs,
and pinned-version references. Label weak evidence as weak.

Use host-supported delegation only when the active host and user/project policy
allow it. When allowed, use subagents sparingly for independent phase questions
broad enough that parallelism clearly helps. The main skill owns synthesis,
questions, file writes, and final output.

## Decision Handling

Research should reduce build risk, not reopen the project casually.

- If findings fit current spec/phase decisions, record the build-relevant
  implication in `research.md`.
- If a small implementation detail is open, recommend a direction in
  `research.md` for phase-plan to accept or adjust.
- If research finds a product, technical, workflow, scope, surface, naming, or
  model-shape decision that should not be guessed, add the blocking question to
  `card.md`, leave the pointer in `06-implementation`, and recommend the right
  prior handoff.
- If the phase split itself seems wrong, add the concern to `card.md`, move the
  pointer back to `05-slice`, and recommend the `slice` skill.

Do not edit `grill.md`, `spec.md`, or `plan.md` from this utility unless the
user explicitly asks.

## Artifact Shape

Write `research.md` as a compact phase-specific synthesis. Omit sections that
do not apply.

```md
# Phase Research: [Phase Name]

## Summary

- [One to five findings phase-plan must know.]

## Findings

### [Finding Name]

Finding: [What became clear.]
Build-brief use: [How phase-plan should use it.]
Sources: [Files or links.]

## Recommended Build Direction

- [Optional: recommended technical approach when research clearly supports one.]

## Decisions Or Blockers

- [Only if something needs the user or an upstream skill.]

## Weak Evidence / Unknowns

- [...]
```

Avoid raw transcripts, long source summaries, generic best practices, and
repeating the whole spec.

## Exit Test

Before finishing, reread `research.md` as if the chat transcript is gone. It is
ready when:

- findings are specific to this phase
- sources are named where phase-plan or build may need to verify
- recommendations are clearly separated from facts
- weak evidence is labeled
- broad project research was not repeated
- phase-plan can use the document directly after a context reset

## Output

Final response should be short and user-facing:

- phase research path written, or why it was blocked
- key findings or blockers
- whether board state changed; normally no, except wrong phase splits route
  back to `05-slice`
- next prompt, rendered for the current host with `references/invocation.md`:
  `phase-plan <project-slug> phase:<phase-slug>`, or `slice <project-slug>` if
  the phase split was wrong

Do not show raw handoff fields such as `Reset context first`, `Next Strike
skill`, or `Arguments`.

## Gates

- Do not edit implementation or test files.
- Do not write `build-brief.md`.
- Do not move the board pointer except when routing a wrong phase split back to
  `05-slice`.
- Do not edit `UBIQUITOUS_LANGUAGE.md`.
- Do not create sidecar checker files, drafts, durable IDs, or hidden state.
  Optional user-requested docs/assets may live only under `strike/user-docs/` or
  another repo-safe path the current user explicitly provides or confirms.
