---
name: auto-strike-new-initiative
description: Use when the user asks Auto Strike to start a new initiative from a new idea or request.
argument-hint: "[idea or request]"
disable-model-invocation: true
allowed-tools: Read Write Edit MultiEdit Bash Grep Glob WebFetch WebSearch Agent
---

# Auto Strike New Initiative

Start a fresh Auto Strike initiative for a new idea. Preserve existing
initiatives.

## New Initiative Behavior

Use this skill only when the user wants new work. If the user wants to resume,
continue, pick up, or inspect existing work, use `auto-strike-go`.

Choose a short kebab-case initiative ID from the request, such as
`checkout-redesign` or `payment-system`. Use the optional name argument for the
human title.

If `auto-strike/state.json` does not exist, initialize the workspace:

```text
node <this skill dir>/scripts/state.mjs init <initiative-id> [name]
```

This creates `PROJECT_LANGUAGE.md` if missing, creates `auto-strike/state.json`,
copies the helper to `auto-strike/scripts/state.mjs`, and creates the first
initiative directory. It does not overwrite an existing project language file.

If `auto-strike/state.json` already exists, add a new active initiative:

```text
node auto-strike/scripts/state.mjs add-initiative <initiative-id> [name]
```

This preserves all existing initiatives, pauses the previous active initiative,
and starts the new one at `refine-idea`.

If the chosen initiative ID already exists, ask for a different ID or confirm
that the user meant to resume existing work with `auto-strike-go`.

## Continue The Workflow

After initialization, continue with the same workflow mechanics as
`auto-strike-go`:

```text
node auto-strike/scripts/state.mjs current
```

Invoke the returned workflow skill with the original user request, the returned
artifact path, and the returned completion check.

If the work is interrupted after initialization, resume later with
`auto-strike-go`.
