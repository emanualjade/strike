---
name: customize
description: Run init, list, check, or load <skill-name> for repo-local Strike customization files.
argument-hint: "init|list|check|load <skill-name>"
disable-model-invocation: true
allowed-tools: Read Bash Grep Glob
---

# Strike Customize

## Communication

When speaking to the user, use relaxed, friendly language. Keep the focus on
the repo-local customization files and what the user can edit next. Do not
over-explain Strike mechanics unless the result needs that context.

## Purpose

Manage repo-local Strike customization files for the single-file customization
surface.

This is a utility skill. It does not use board lanes, cards, or project
artifacts. Its job is to run the bundled deterministic customization script and
summarize the result.

This utility supports single-file customization for:

- `global.md`
- `brainstorm/brainstorm.md`
- `grill/grill.md`
- `research/research.md`
- `spec/spec.md`
- `slice/slice.md`
- `phase-research/phase-research.md`
- `phase-plan/phase-plan.md`
- `retro/retro.md`
- `demo/demo.md`
- `language/language.md`

## Host Invocation

When showing follow-up Strike skills, use the plugin package's
`references/invocation.md` to render the current host's syntax. Do not copy
`/strike:*` examples unchanged unless the current host is Claude Code. When
the host is unknown, show the skill name and arguments as a plain next action
without raw field labels.

## Procedure

1. Parse the requested mode:
   - `init`
   - `list`
   - `check`
   - `load <skill-name>`
2. Resolve the consuming repository root. Prefer
   `git rev-parse --show-toplevel`; fall back to `pwd` when no git root is
   available.
3. Resolve the bundled script by absolute path from this installed plugin
   package. This skill lives at `<plugin-root>/skills/customize/SKILL.md`; the
   script lives at `<plugin-root>/references/scripts/customize.mjs`.
4. Run the script by absolute path from the consuming repository root. Pass
   `--repo-root <repo-root>` to the script. Do not hand-create or edit
   customization files.
5. Summarize the script output for the user.

## Modes

`init` creates the supported customization tree:

```txt
docs/strike/customize/global.md
docs/strike/customize/brainstorm/brainstorm.md
docs/strike/customize/grill/grill.md
docs/strike/customize/research/research.md
docs/strike/customize/spec/spec.md
docs/strike/customize/slice/slice.md
docs/strike/customize/phase-research/phase-research.md
docs/strike/customize/phase-plan/phase-plan.md
docs/strike/customize/retro/retro.md
docs/strike/customize/demo/demo.md
docs/strike/customize/language/language.md
```

It preserves existing user files.

`list` reports which supported customization files are missing, template-only or
blank, or contain user customization.

`check` validates the supported customization tree. Structural and size problems
are errors. Suspicious mechanic-changing language is a warning.

`load <skill-name>` prints the same customization packet used by the supported
workflow skills. Treat it as a diagnostic command for inspecting what a skill
would receive.

## Output

Keep the final response short and user-facing:

- mode run
- files created, existing, loaded, or flagged
- whether check passed or failed
- next useful prompt, when obvious, such as editing the created Markdown files
  or running `customize check`

Do not expose script-only flags as normal user-facing skill options.

## Gates

- Do not move board pointers.
- Do not edit cards or project artifacts.
- Do not hand-create customization files; use the bundled script.
- Do not run or create custom executable scripts.
- Do not broaden customization to review skills, acceptance, phase-build, or
  phase-fix in this rollout.
