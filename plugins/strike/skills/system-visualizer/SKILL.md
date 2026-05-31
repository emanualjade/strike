---
name: system-visualizer
description: Visualize, diagram, map, explain, reverse-engineer, or document a software system, schema, API, workflow, event flow, lifecycle, architecture, process, dependency graph, or codebase as reusable diagram/model code.
argument-hint: "[project-slug|path|goal]"
disable-model-invocation: true
allowed-tools: Read Write Edit MultiEdit Bash Grep Glob
---

# System Visualizer

## Communication

When speaking to the user or asking questions, use relaxed, friendly language,
like two friends talking through the work over coffee. Explain things in simple
terms without assumptions, guide with context, and simplify concepts so the
conversation feels easy to follow. Keep the conversation centered on the
system, flow, or model being visualized; avoid explaining Strike mechanics
unless that context helps the user decide what to do next.

## Purpose

Help the user turn a software system, database, API, business process, runtime
flow, event stream, or code dependency structure into the most useful text-first
diagram or model.

The goal is not merely to draw a diagram. The goal is to help the user pick the right representation, produce reusable diagram/model code, and immediately show the user where they can view it visually.

This is a standalone Strike utility, not a workflow stage. It may be called
directly by the user, or recommended by other Strike skills when a visual model
would clarify a project, initiative, spec, phase, slice, review, or existing
repository system.

## Host Invocation

When showing follow-up Strike skills, use the plugin package's
`references/invocation.md` to render the current host's syntax. Do not copy
`/strike:*` examples unchanged unless the current host is Claude Code. When
the host is unknown, show the skill name and arguments as a plain next action
without raw field labels.

## User Customization

Before doing any material system visualization work, you MUST run the repo-local
customization loader from the consuming repository root:

```bash
test -f strike/customize/system/customize.mjs || { echo 'Strike is not initialized in this repo yet. Run the Strike `init` skill first.'; exit 1; }
node strike/customize/system/customize.mjs --repo-root <repo-root> preview system-visualizer
```

## When to use this skill

Use this skill when the user says or implies any of the following:

- "Help me visualize the system."
- "Diagram this app."
- "Map the database/schema."
- "Show the signup/payment/webhook flow."
- "Represent the architecture."
- "What are the inputs and outputs?"
- "Create a Mermaid/DBML/C4/OpenAPI/AsyncAPI/D2/PlantUML/Graphviz/BPMN diagram."
- "Explain this codebase/system visually."
- "Give me diagram code I can paste somewhere."

## Core behavior

When activated:

1. Identify what the user is trying to understand or communicate.
2. Recommend the best diagram/model format.
3. Show a compact choice set when useful.
4. Load the matching reference file before producing the final diagram.
5. Produce the selected diagram-as-code or structured model.
6. Include a `View this visually` block with viewer/editor links for that specific diagram type.
7. Add assumptions/unknowns and useful next moves.

Prefer a good default over asking questions. Ask the user to choose only when the choice materially changes the output and no clear default exists.

Do not invent architecture, tables, APIs, services, queues, third-party integrations, or flows. If information is missing, mark it as `UNKNOWN`, `TODO`, or `ASSUMPTION`.

## Reference loading policy

Do not load every reference file automatically.

Use this pattern:

1. Load `references/diagram-language-picker.md` when choosing the format.
2. Load the specific syntax reference for the selected diagram/model type.
3. Load `references/visual-preview-links.md` before writing the `View this visually` block.
4. Load `references/validation-checklist.md` before finalizing.
5. Load `references/render-notes.md` only when discussing repo-local rendering commands.

Reference mapping:

- Mermaid: `references/mermaid.md`
- DBML: `references/dbml.md`
- Structurizr/C4: `references/structurizr-c4.md`
- OpenAPI or AsyncAPI: `references/openapi-asyncapi.md`
- D2, Graphviz DOT, or PlantUML: `references/d2-graphviz-plantuml.md`
- IDEF0, DFD, or BPMN: `references/idef0-dfd-bpmn.md`
- Repo-local rendering: `references/render-notes.md`

## Natural Strike Use

This is a utility, not a workflow stage. Do not move board pointers, create
required stage outputs, claim readiness, or route the project to another stage.

When called with a Strike project slug:

- read the board pointer if present
- read `docs/strike/cards/<project-slug>/card.md`
- read relevant planning outputs that exist, especially spec, slice, phase,
  demo, and review files
- produce diagrams inline unless the user asks to save them

When called from an Auto Strike initiative context:

- read `auto-strike/initiatives/<initiative-slug>/spec.md`
- read relevant phase specs and slice docs under
  `auto-strike/initiatives/<initiative-slug>/phases/`
- do not edit active-work, mode ledger/task, readiness, or closeout files
- produce diagrams inline unless the user asks to save them

When saving project-specific visualizations, prefer:

- `docs/strike/cards/<project-slug>/visuals/<topic>.<ext>` for card-local
  planning visuals
- `auto-strike/initiatives/<initiative-slug>/visuals/<topic>.<ext>` for
  initiative-local Auto Strike visuals
- `strike/user-docs/<project-slug>/system-visualizer/...` for user-requested
  durable docs/assets
- `strike/user-docs/shared/...` for shared or ongoing visual docs
- another repo-safe path the current user explicitly provides or confirms

Create folders only when saving a requested artifact. Do not edit repo source
files unless the user explicitly asks for documentation/spec files to be
updated.

## Source inspection order

When working inside a repository, inspect relevant source material before diagramming.

Useful places to check:

- `README.md`, docs, architecture notes, ADRs
- `package.json`, framework config, app entrypoints
- route files, controllers, API handlers, RPC definitions
- database schema files such as `schema.prisma`, migrations, SQL, Drizzle schemas, Rails models, Django models
- OpenAPI, AsyncAPI, GraphQL schema, tRPC routers
- queue, webhook, cron, worker, event handler, and background job code
- auth, billing, email, storage, and external service integrations
- deployment files such as Docker Compose, Terraform, Kubernetes, Vercel, App Engine, Fly, or Render config

When the user provides only a short description and no repo/files, produce a diagram based only on that description and clearly label assumptions.

## Diagram choice policy

Use this selection logic unless the user explicitly asks for a format.

| User need | Recommended output | Why |
|---|---|---|
| General web app overview | Mermaid flowchart | Fast, readable, works well in Markdown and GitHub |
| Whole-system architecture | Structurizr DSL / C4 model | Best for durable architecture views |
| Runtime interaction | Mermaid sequence diagram | Best for user/service/payment/webhook flows |
| Database schema | DBML | Best reusable database diagram language |
| Quick database sketch | Mermaid ER diagram | Good in Markdown when DBML is overkill |
| API surface | OpenAPI | Best for HTTP request/response contracts |
| Events, queues, webhooks | AsyncAPI | Best for event/message contracts |
| State lifecycle | Mermaid state diagram | Best for order/payment/subscription/status transitions |
| Business workflow | BPMN-style process summary, or BPMN XML only if requested | Best for business process and stakeholder workflows |
| Inputs, controls, outputs, mechanisms | IDEF0-style text model | Best for explaining transformations and responsibilities |
| Data movement | DFD-style text model plus Mermaid/D2 companion | Best for inputs, processes, data stores, outputs |
| Dependency graph | Graphviz DOT | Best for module/service dependency graphs |
| Polished diagram-as-code | D2 | Good when the user wants a nicer rendered diagram |
| Formal UML | PlantUML | Good for formal sequence/class/component/activity/state diagrams |

## Multi-output bundles

Often the best answer is a bundle, not one diagram.

Use these bundles when appropriate:

- Web app overview:
  1. Mermaid flowchart
  2. Mermaid sequence diagram for the main flow
  3. View links and useful next moves

- Database understanding:
  1. DBML
  2. Relationship/cardinality notes
  3. View links and useful next moves

- API understanding:
  1. OpenAPI or endpoint inventory
  2. Mermaid sequence diagram for one key request path
  3. View links and useful next moves

- Whole-system architecture:
  1. Structurizr DSL / C4 model
  2. Mermaid overview for quick Markdown use
  3. View links and useful next moves

- Inputs/outputs/process clarity:
  1. IDEF0-style model
  2. Mermaid flowchart companion
  3. View links and useful next moves

## Choice selector format

When the user is exploring or asks which diagram to use, show this compact selector before producing the diagram.

Do not show more than 5 options unless the user asks for all options.

```markdown
## Recommended diagram choice

**Recommended:** [diagram language / bundle]

**Why:** [one sentence tied to the user's goal]

### Choices

1. **[Option]** — [best for...]
2. **[Option]** — [best for...]
3. **[Option]** — [best for...]

Proceeding with **Option [n]** unless you want a different one.
```

If the user explicitly asked for a diagram now, do not pause after the selector. State the recommendation and proceed.

## Final output format

Use this structure for final output:

````markdown
## Diagram recommendation

**Recommended:** [language/bundle]

**Why this fits:** [short reason]

**Alternatives:**
- [Alternative 1] — [when to use it]
- [Alternative 2] — [when to use it]

## Diagram

```[language]
[diagram/model code]
```

## View this visually

Fastest option:
- [Viewer/editor name](https://example.com) — [one sentence instruction]

Repo/local option:
- [Repo/local rendering path] — [one sentence instruction]

Privacy note:
- If this describes private architecture, prefer repo-local rendering or a trusted internal tool over a public paste-in website.

## Assumptions / unknowns

- [Assumption or UNKNOWN item]

## Useful next moves

- Paste this into [tool/docs/location] to render it.
- Ask me to split this into smaller diagrams by domain.
- Ask me to convert this to [Mermaid/DBML/C4/OpenAPI/D2/PlantUML].
- Ask me to verify this against the repo/schema/routes.
````

Omit sections that do not apply, except always include `View this visually` when a viewer/editor exists.

## Visual preview rules

Every diagram/model output should include a `View this visually` block.

Use `references/visual-preview-links.md` to pick the right link.

Examples:

- Mermaid -> Mermaid Live Editor, GitHub Markdown, Mermaid CLI
- DBML -> dbdiagram.io
- Structurizr DSL -> Structurizr Playground or Structurizr local
- D2 -> D2 Playground or D2 CLI
- PlantUML -> PlantUML Web Editor/Server or local PlantUML
- Graphviz DOT -> Graphviz Online or local Graphviz
- OpenAPI -> Swagger Editor / Swagger UI
- AsyncAPI -> AsyncAPI Studio
- BPMN XML -> bpmn.io demo or Camunda Modeler
- IDEF0/DFD text -> provide a Mermaid/D2 companion when the user needs an immediate visual renderer

## Diagram quality rules

- Keep diagrams scoped. If a diagram becomes crowded, split it into separate views.
- Label arrows with the data, event, or responsibility being passed.
- Prefer domain language from the codebase over generic terms.
- Use stable names from files/classes/tables/routes when available.
- Mark uncertain relationships as `TODO`, `UNKNOWN`, or comments.
- Never expose secrets, API keys, tokens, private credentials, or sensitive user data.
- Do not include every low-level function unless the user asks for a code-level dependency graph.
- For architecture diagrams, separate people, frontend, backend, database, external services, workers, queues, and third-party APIs.
- For database diagrams, include primary keys, foreign keys, cardinality, join tables, and important indexes when known.
- For sequence diagrams, include happy path plus important failure branches when relevant.
- For state diagrams, include terminal states and invalid transitions when relevant.
- For API diagrams/specs, distinguish request body, response body, auth, errors, and webhooks/events.
- For generated code/specs, make the code block copy-pasteable.
- For public online viewers, include a privacy note when architecture or schema may be sensitive.
- Do not install packages, run package-manager commands, or use online renderers
  for private diagrams unless the user explicitly approves that path and the
  consuming repo allows it.

## Useful next moves examples

Pick 3-5 relevant one-liners after each diagram.

Examples:

- Paste this into Mermaid Live Editor to preview and export PNG/SVG.
- Put this in `docs/architecture.md` as the first system overview.
- Ask for a C4/Structurizr version if you want more durable architecture documentation.
- Ask for a DBML version if you want a database-first view.
- Ask for a sequence diagram for one specific flow.
- Ask me to verify this against the repo before you rely on it.
- Ask me to split this into admin, customer, payment, and worker diagrams.
- Ask me to convert this to D2 for a more polished render.
- Ask me to turn this into an image-generation brief.
- Ask me to create an API contract from this flow.
