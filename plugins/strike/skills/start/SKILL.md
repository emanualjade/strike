---
name: start
description: Create a new Strike feature card and first board pointer in docs/strike.
argument-hint: "\"<feature name>\" [--slug <slug>] [--description \"<short description>\"]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, MultiEdit, Bash, Grep, Glob
---

# Strike Start

## Communication

When speaking to the user or asking questions, use relaxed, friendly language,
like two friends talking through the work over coffee. Explain things in simple
terms without assumptions, guide with context, and simplify concepts so the
conversation feels easy to follow. Keep the conversation centered on the work
in progress; avoid explaining Strike mechanics unless that context helps the
user decide what to do next.

## Purpose

Create the smallest useful Strike feature card: a stable card folder plus a
tiny board pointer in `docs/strike/board/01-brainstorm/`.

## Host Invocation

When showing follow-up Strike skills, use the plugin package's
`references/invocation.md` to render the current host's syntax. Do not copy
`/strike:*` examples unchanged unless the current host is Claude Code. When
the host is unknown, show the canonical handoff first.

## Procedure

1. Require a feature name unless the user clearly points at an existing card.
2. Resolve the consuming repository root before running the script. Prefer
   `git rev-parse --show-toplevel` from the user's current project directory;
   fall back to `pwd` only when no git root is available.
3. Run the bundled `scripts/start-card.sh` by absolute path, passing the
   consuming repository root with `--repo-root <path>`. Do not `cd` into the
   skill directory before running it, do not hand-create the files, and do not
   look for a consuming-repo script with that name.
4. Report the card path, board pointer, and next brainstorm handoff. Use the
   host rendering rules in the plugin package's `references/invocation.md`;
   `/strike:*` is Claude Code syntax, not portable syntax.

## State Model

The board pointer location is the workflow state. Do not add a status field to
`card.md`, update a separate feature index, or write hidden metadata blocks.

## Output

Use a short plain-English response:

- created or reused card folder
- board lane
- starter checklist
- next handoff:
  ```txt
  Reset context first: yes
  Next Strike skill: brainstorm
  Arguments: <feature-slug>
  ```

## Gates

- Do not create production files.
- Do not create brainstorm, grill, spec, slice, acceptance, or retro outputs.
- Do not migrate or edit unrelated Strike artifacts.
