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

The canonical handoff fields are routing data for Strike. In a user-facing
response, translate them into one clear next action instead of dumping the raw
fields. Usually that means one short sentence about starting fresh, followed by
the rendered next prompt.

When the handoff says `Reset context first: yes`, render the reset before the
next command:

| Host | Render the same handoff as |
| --- | --- |
| Claude Code plugin | `/clear`, then `/strike:<skill-name> <args>` |
| Codex | Start a fresh conversation from the same repo root, then type `$` and select the installed Strike skill, or use `/skills` to browse. The short form is `$<skill-name> <args>`; namespaced `$strike:<skill-name> <args>` also works. |
| GitHub Copilot CLI | Start a fresh session if no reset command is visible, then `/<skill-name> <args>` after confirming the skill is visible with `/skills list` or `/skills info <skill-name>`. |

When the handoff does not ask for a reset, run only the skill command for the
current host.

When showing the current host's rendered command to the user, label it `Next
prompt:`. Do not label it `Codex form`, `Claude form`, or similar host-specific
wording. The host name belongs in docs and examples, not in the short handoff a
user sees while working.

Do not include `Reset context first`, `Next Strike skill`, or `Arguments` in the
final user response unless the user asks for the raw Strike handoff.

Examples:

```txt
Reset context first: yes
Next Strike skill: brainstorm
Arguments: checkout-redesign
Claude Code:
/clear
/strike:brainstorm checkout-redesign
Codex: $brainstorm checkout-redesign
Codex namespaced: $strike:brainstorm checkout-redesign
GitHub Copilot CLI: /brainstorm checkout-redesign
```

```txt
Reset context first: yes
Next Strike skill: phase-plan
Arguments: checkout-redesign phase:api-contract
Claude Code:
/clear
/strike:phase-plan checkout-redesign phase:api-contract
Codex: $phase-plan checkout-redesign phase:api-contract
Codex namespaced: $strike:phase-plan checkout-redesign phase:api-contract
GitHub Copilot CLI: /phase-plan checkout-redesign phase:api-contract
```

## Writing Rule

Use `/strike:*` only when the text is explicitly a Claude Code example. In
portable skill instructions, board notes, and generated handoffs, prefer the
canonical `Next Strike skill` plus `Arguments` form.
