# Invocation Pointer

Auto Strike's canonical invocation reference lives at the plugin root:

```text
../../references/invocation.md
```

Resolve that path from `skills/auto-strike/SKILL.md`. This skill-local pointer
exists only for hosts or agents that first look under the skill's own
`references/` folder.

If the shared file is unavailable, use the active host's normal Auto Strike
syntax, or fall back to this plain prompt form:

```text
auto-strike [idea or current goal]
```
