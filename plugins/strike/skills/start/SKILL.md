---
name: start
description: Create a new Strike project card and first board pointer in docs/strike.
argument-hint: "<project name words> [--slug <slug>] [--description <short description words>]"
disable-model-invocation: true
allowed-tools: Read Write Edit MultiEdit Bash Grep Glob
---

# Strike Start

## Communication

When speaking to the user or asking questions, use relaxed, friendly language,
like two friends talking through the work over coffee. Explain things in simple
terms without assumptions, guide with context, and simplify concepts so the
conversation feels easy to follow. Keep the conversation centered on the work
in progress; avoid explaining Strike mechanics unless that context helps the
user decide what to do next.

Keep progress updates quiet. It is fine to say what you are about to do when it
affects the user's repository, but do not narrate internal mechanics such as
reading this skill, checking bundled script syntax, or inspecting invocation
rules. If the current directory is not a Git repo, mention the fallback once:
"This is not a Git repo, so I will create Strike files in `<path>`."

## Purpose

Create the smallest useful Strike project card: a stable card folder plus a
tiny board pointer in `docs/strike/board/01-brainstorm/`.

Generated slugs should stay short enough to repeat in later Strike commands.
The bundled start script uses `references/scripts/slugify.mjs` and the shared
`references/slug-policy.md` rules to sanitize slugs, drop common leading task
verbs from generated project names, cap project slugs at 48 characters, and
deduplicate collisions with numeric suffixes.

User-facing `start` options are only `--slug <slug>` and
`--description <text>`. Flag-like words after the project name has started are
plain project text, not options. For example, `Add --dry-run flag` describes a
project about a `--dry-run` flag; it does not enable a Strike dry-run mode.

## Host Invocation

When showing follow-up Strike skills, use the plugin package's
`references/invocation.md` to render the current host's syntax. Do not copy
`/strike:*` examples unchanged unless the current host is Claude Code. When
the host is unknown, show the skill name and arguments as a plain next action
without raw field labels.

## Procedure

1. Require a project name unless the user clearly points at an existing card.
2. Resolve the consuming repository root before running the script. Prefer
   `git rev-parse --show-toplevel` from the user's current repo directory;
   fall back to `pwd` only when no git root is available.
3. Run the bundled `scripts/start-card.sh` by absolute path, passing the
   consuming repository root with `--repo-root <path>`. Do not `cd` into the
   skill directory before running it, do not hand-create the files, and do not
   look for a consuming-repo script with that name.
4. Report only the user-facing result: the card path, the board pointer, and
   the next prompt to run. Use the host rendering rules in the plugin package's
   `references/invocation.md`; `/strike:*` is Claude Code syntax, not portable
   syntax.

## State Model

The board pointer location is the workflow state. Do not add a status field to
`card.md`, update a separate project index, or write hidden metadata blocks.

## Output

Use a short plain-English response that helps the user take the next step. Do
not expose internal handoff fields such as `Reset context first`, `Next Strike
skill`, or `Arguments`. Do not show the starter checklist in the chat response;
it is saved in the card file for Strike to use later.

Preferred shape:

```txt
Created the Strike card for `<project-slug>`.

Card: docs/strike/cards/<project-slug>/card.md
Board: docs/strike/board/01-brainstorm/<project-slug>.md

Next: start a fresh conversation from `<repo-root>`, then run:

<rendered next prompt>
```

When showing the current host's rendered command, label it `Next prompt:` only
if the label is needed. Do not label it `Codex form`, `Claude form`, or another
host-specific label.

## Gates

- Do not create production files.
- Do not create brainstorm, grill, spec, slice, acceptance, or retro outputs.
- Do not migrate or edit unrelated Strike artifacts.
