# Diagram Language Picker

Use this reference to choose the right diagram/model format before producing output.

## Default recommendation hierarchy

When the user is vague, pick the simplest useful default:

1. Mermaid flowchart for a general system overview.
2. Mermaid sequence diagram for a runtime user/service flow.
3. DBML for database/schema work.
4. Structurizr DSL/C4 for durable architecture documentation.
5. OpenAPI for HTTP APIs.
6. AsyncAPI for event-driven systems, queues, and webhooks.
7. D2 for polished diagram-as-code.
8. Graphviz DOT for dependency graphs.
9. PlantUML for formal UML.
10. IDEF0/DFD/BPMN for process, inputs/outputs, data movement, or business workflows.

## Decision matrix

| User says / implies | Use | Add companion? |
|---|---|---|
| "diagram this app" | Mermaid flowchart | C4 if architecture-heavy |
| "help me visualize the system" | Mermaid flowchart or C4 bundle | Sequence diagram for key flow |
| "show the architecture" | Structurizr DSL/C4 | Mermaid quick overview |
| "what talks to what" | Mermaid flowchart or C4 container view | Sequence if time-ordered |
| "what happens when user does X" | Mermaid sequence diagram | State diagram if lifecycle-heavy |
| "state/status/lifecycle" | Mermaid state diagram | Table of states/transitions |
| "schema/database/tables/relations" | DBML | Mermaid ER if Markdown-first |
| "Prisma/Drizzle/SQL schema" | DBML | Notes on cardinality/indexes |
| "API/endpoints/routes" | OpenAPI or endpoint inventory | Mermaid sequence for one path |
| "GraphQL/tRPC" | Endpoint/router inventory or Mermaid | Schema if requested |
| "events/webhooks/queues/pubsub" | AsyncAPI | Mermaid sequence/flowchart |
| "inputs and outputs" | IDEF0-style text | Mermaid/D2 companion for visual |
| "data flow" | DFD-style model | Mermaid flowchart companion |
| "business process" | BPMN-style summary | BPMN XML only if requested |
| "dependencies/modules/import graph" | Graphviz DOT | D2 if presentation-oriented |
| "formal UML" | PlantUML | Mermaid if GitHub-native |
| "make it look nicer" | D2 | Mermaid source as fallback |
| "something I can paste into GitHub" | Mermaid | DBML/OpenAPI if domain-specific |
| "something I can render locally" | Mermaid CLI, D2 CLI, Graphviz, PlantUML, Structurizr local | Include commands |

## Recommended bundles

### General web app

Use when the user says "web app", "system", or "how it works".

1. Mermaid flowchart for the system overview.
2. Mermaid sequence diagram for the main flow.
3. View links and useful next moves.

### Architecture documentation

Use when the user says "architecture", "C4", "containers", "system boundaries", "services", or "durable docs".

1. Structurizr DSL/C4.
2. Mermaid quick overview.
3. View links and useful next moves.

### Database understanding

Use when the user asks about schema, tables, migrations, Prisma, SQL, or relations.

1. DBML.
2. Relationship notes.
3. View links and useful next moves.

### API/event understanding

Use when the user asks about endpoints, contracts, webhooks, events, queues, or payloads.

1. OpenAPI for HTTP endpoints or AsyncAPI for events.
2. Mermaid sequence diagram for one key flow.
3. View links and useful next moves.

### Process/input-output understanding

Use when the user says "inputs", "outputs", "controls", "mechanisms", "business workflow", or "data movement".

1. IDEF0-style or DFD-style text.
2. Mermaid or D2 companion for immediate visual rendering.
3. View links and useful next moves.

## Selection principles

- Choose the representation that answers the user's question, not the most impressive language.
- If the user wants understanding, prefer Mermaid first.
- If the user wants durable architecture docs, prefer Structurizr/C4.
- If the user wants database clarity, prefer DBML.
- If the user wants exact contracts, prefer OpenAPI/AsyncAPI.
- If the user wants a visual immediately, prefer a format with a clear online viewer or local renderer.
- If the user gives incomplete information, mark assumptions rather than inventing details.
- If a single diagram would be crowded, split into multiple focused views.
