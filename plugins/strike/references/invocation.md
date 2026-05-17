# Strike Invocation

Strike skills are portable Agent Skills. The stable workflow identity is the
skill name plus its arguments, not one host's command syntax.

## Canonical Handoff

When a Strike skill recommends a next step, represent it in this order:

```txt
Next Strike skill: <skill-name>
Arguments: <args>
```

Use `Reset context first: yes` when the workflow wants a fresh conversation or
host session before the next skill. Render the reset with the current host's
native session-reset command or UI. If the host does not expose a reset command,
tell the user to start a fresh session.

## Host Rendering

| Host | Render the same handoff as |
| --- | --- |
| Claude Code plugin | `/strike:<skill-name> <args>` |
| Codex | Mention/select the installed Strike skill or ask Codex to use Strike, for example: `Use the Strike <skill-name> skill with <args>.` |
| GitHub Copilot CLI | `/<skill-name> <args>` after confirming the skill is visible with `/skills list` or `/skills info <skill-name>` |

Examples:

```txt
Next Strike skill: brainstorm
Arguments: checkout-redesign
Claude Code: /strike:brainstorm checkout-redesign
Codex: Use the Strike brainstorm skill with checkout-redesign.
GitHub Copilot CLI: /brainstorm checkout-redesign
```

```txt
Next Strike skill: phase-plan
Arguments: checkout-redesign phase:api-contract
Claude Code: /strike:phase-plan checkout-redesign phase:api-contract
Codex: Use the Strike phase-plan skill with checkout-redesign phase:api-contract.
GitHub Copilot CLI: /phase-plan checkout-redesign phase:api-contract
```

## Writing Rule

Use `/strike:*` only when the text is explicitly a Claude Code example. In
portable skill instructions, board notes, and generated handoffs, prefer the
canonical `Next Strike skill` plus `Arguments` form.
