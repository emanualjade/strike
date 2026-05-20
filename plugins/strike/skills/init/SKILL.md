---
name: init
description: Initialize or refresh Strike repo-local setup, including managed customization runtime and user customization files.
disable-model-invocation: true
allowed-tools: Read Bash Grep Glob
---

# Strike Init

## Communication

Keep the response short and practical. Focus on what was initialized or
refreshed, what user files were preserved, and what the user can do next.

## Purpose

Initialize Strike in the consuming repository before normal workflow skills run.

This skill installs or refreshes Strike-managed customization runtime files under
`strike/customize/system/` and creates missing user customization files under
`strike/customize/user/` without overwriting user edits.

## Host Invocation

When showing follow-up Strike skills, use the plugin package's
`references/invocation.md` to render the current host's syntax. Do not copy
`/strike:*` examples unchanged unless the current host is Claude Code. When the
host is unknown, show the skill name and arguments as a plain next action
without raw field labels.

## Procedure

1. Resolve the consuming repository root. Prefer
   `git rev-parse --show-toplevel`; fall back to `pwd` when no git root is
   available.
2. Run this skill's bundled initialization script by absolute path from the
   consuming repository root:

```bash
node <plugin-root>/skills/init/scripts/init.mjs --repo-root <repo-root>
```

3. Summarize the script output for the user.

## Output

Keep the final response concise:

- repo root initialized
- system runtime files installed or refreshed
- user customization files created or already existing
- next useful prompt, usually `customize check-setup`

## Gates

- Do not move board pointers.
- Do not edit cards or project artifacts.
- Do not overwrite user customization files.
- Only use this skill's bundled initialization script for setup.
