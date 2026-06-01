---
name: demo
description: Create a small self-contained HTML planning demo for a Strike initiative, repo path, or idea.
argument-hint: "[initiative-slug|path|idea] \"<what the demo should explore>\""
disable-model-invocation: true
allowed-tools: Read Write Edit MultiEdit Bash Grep Glob
---

# Strike Demo

## Communication

Keep the conversation centered on the concept being explored. Explain the demo
in user-facing terms, and avoid exposing workflow mechanics unless that context
helps the user make a decision.

## Purpose

Create one small static HTML planning demo when seeing something would help the
user think, compare, or decide during Strike work or standalone planning.

This skill is a thin entrance to its bundled demo guidance. Most demo standards
live in this skill's `references/html-demos.md`.


## Use When

- The user explicitly asks for an HTML demo, visual sketch, interactive
  explainer, or option comparison.
- Strike has reached a visual or spatial decision that text is handling
  poorly.

Good demo topics include UI options, flow comparisons, before/after states,
decision maps, state explainers, command output comparisons, API contract
sketches, data lifecycle diagrams, product concept sketches, and lightweight
interactive choices.

## Reads

- relevant Strike initiative, phase, or slice docs when they exist
- relevant source docs or paths the user names
- bundled `references/html-demos.md`
- bundled `templates/demo.html` as a starting point when helpful

## Writes

- `strike/initiatives/<initiative-slug>/demos/<nn-topic>.html` when the
  demo belongs to a Strike initiative
- `docs/demos/<nn-topic>.html` for standalone repo-local planning demos
- another repo-safe path the current user explicitly provides or confirms

Create the `demos/` folder only when saving a requested artifact. Before
creating a demo file, run the bundled slug helper by absolute path from the
plugin package:

```bash
node <plugin-root>/references/scripts/slugify.mjs demo \
  --text "<demo topic>" \
  --index <n> \
  --taken <existing-demo-file>
```

Pass every existing demo filename in the target demos folder as a separate
`--taken` value. Use the returned `filename=` value as the demo file name.
Follow `references/slug-policy.md`; do not hand-roll demo filename rules.

## Boundaries

- Do not edit repo source files.
- Do not install packages or use build tools.
- Do not use external CDNs, fonts, scripts, or image URLs.
- Use mock data only.
- Keep demos self-contained.
- Do not edit Strike state or workflow artifacts unless the user
  explicitly asks to link the demo from them.
- Do not make demos required for Strike verification.

## Output

Keep the response short and user-facing:

- demo path
- what the demo explores
- the feedback question the user should answer

If this was created inside another Strike conversation, route back to the
current Strike workflow skill rather than changing workflow state.
