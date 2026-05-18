---
name: demo
description: Create a small self-contained HTML planning demo for a Strike card.
argument-hint: "[project-slug] \"<what the demo should explore>\""
disable-model-invocation: true
allowed-tools: Read Write Edit MultiEdit Bash Grep Glob
---

# Strike Demo

## Communication

When speaking to the user or asking questions, use relaxed, friendly language,
like two friends talking through the work over coffee. Explain things in simple
terms without assumptions, guide with context, and simplify concepts so the
conversation feels easy to follow. Keep the conversation centered on the work
in progress; avoid explaining Strike mechanics unless that context helps the
user decide what to do next.

## Purpose

Create one small static HTML planning demo when seeing something would help the
user think, compare, or decide.

This skill is a thin entrance to its bundled demo guidance. Most demo standards
live in this skill's `references/html-demos.md`.

## Host Invocation

When showing follow-up Strike skills, use the plugin package's
`references/invocation.md` to render the current host's syntax. Do not copy
`/strike:*` examples unchanged unless the current host is Claude Code. When
the host is unknown, show the skill name and arguments as a plain next action
without raw field labels.

## Use When

- The user explicitly asks for an HTML demo, visual sketch, interactive
  explainer, or option comparison.
- A Strike planning skill has reached a visual or spatial decision that text
  is handling poorly.

Good demo topics include UI options, flow comparisons, before/after states,
decision maps, state explainers, command output comparisons, API contract
sketches, data lifecycle diagrams, product concept sketches, and lightweight
interactive choices.

## Reads

- the board pointer and `cards/<project-slug>/card.md`
- relevant current planning artifact when it exists
- bundled `references/html-demos.md`
- bundled `templates/demo.html` as a starting point when helpful

## Writes

- `docs/strike/cards/<project-slug>/demos/<nn-topic>.html`
- optional `docs/strike/cards/<project-slug>/demos/README.md`

Create the `demos/` folder if it does not exist.
Before creating a demo file, run the bundled slug helper by absolute path from
the plugin package:

```bash
node <plugin-root>/references/scripts/slugify.mjs demo \
  --text "<demo topic>" \
  --index <n> \
  --taken <existing-demo-file>
```

Pass every existing demo filename under `cards/<project-slug>/demos/` as a
separate `--taken` value. Use the returned `filename=` value as the demo file
name. Follow `references/slug-policy.md`; do not hand-roll demo filename rules.

## Boundaries

- Do not edit repo source files.
- Do not install packages or use build tools.
- Do not use external CDNs, fonts, scripts, or image URLs.
- Use mock data only.
- Keep demos self-contained.
- Do not move board pointers.
- Do not make demos required for any stage.

## Output

Keep the response short and user-facing:

- demo path
- what the demo explores
- the feedback question the user should answer

If this was created inside another Strike conversation, route back to the
current stage rather than changing board state.
