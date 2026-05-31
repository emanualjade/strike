# Validation Checklist

Use this before finalizing a diagram/model output.

## Universal checks

- Did the output answer the user's actual visualization goal?
- Did the recommendation explain why this format was chosen?
- Are alternatives listed only when useful?
- Is the diagram scoped enough to be readable?
- Are arrows/relationships labeled with data, events, or responsibilities?
- Are uncertain details marked as `UNKNOWN`, `TODO`, or `ASSUMPTION`?
- Are real names from the codebase preserved when available?
- Are secrets, tokens, API keys, private credentials, and sensitive user data excluded?
- Is there a `View this visually` section with the correct viewer/editor link?
- Is there a privacy/local rendering note when the system may be sensitive?
- Are useful next moves included?

## Mermaid checks

- Code fence language is `mermaid`.
- Diagram type is valid: `flowchart`, `sequenceDiagram`, `stateDiagram-v2`, `erDiagram`, or `classDiagram`.
- Flowchart direction is chosen intentionally (`TD` for process, `LR` for architecture).
- Edge labels explain what flows between nodes.
- Large diagrams are split.

## DBML checks

- Code fence language is `dbml`.
- Tables have primary keys when known.
- Foreign keys are represented with `Ref:`.
- Cardinality assumptions are noted.
- Enums are used only when values are known or marked as assumptions.
- Important indexes and uniqueness constraints are included when known.
- Business rules that do not fit schema syntax are included as notes.

## Structurizr/C4 checks

- Code fence language is `structurizr` or plain text if renderer does not support the language tag.
- Workspace includes both `model` and `views`.
- Elements are defined before relationships.
- Views include `systemContext`, `container`, or `component` as appropriate.
- `autoLayout` is included for generated views.
- External systems are not modeled as internal containers.

## OpenAPI checks

- Code fence language is `yaml` unless JSON requested.
- Spec includes `openapi`, `info`, `paths`, and `components` when possible.
- Endpoint paths and methods are not invented.
- Request/response schemas are included when known.
- Auth and error responses are represented when known.

## AsyncAPI checks

- Code fence language is `yaml` unless JSON requested.
- Spec includes `asyncapi`, `info`, `channels`, and messages when known.
- Producers/consumers are not invented.
- Payload schema is included when known.
- Event/topic names match source material or are marked as assumptions.

## D2 checks

- Code fence language is `d2`.
- Diagram has a clear direction if needed.
- Arrows are labeled.
- Names are readable.

## Graphviz DOT checks

- Code fence language is `dot`.
- Graph uses `digraph` for directed dependencies.
- `rankdir=LR` is used for most architecture/dependency graphs.
- Clusters are used only when they clarify domains/layers.

## PlantUML checks

- Code fence language is `plantuml`.
- Diagram starts with `@startuml` and ends with `@enduml`.
- Diagram type matches the user's goal: sequence, component, class, activity, or state.

## IDEF0 / DFD / BPMN checks

- IDEF0 includes Inputs, Controls, Outputs, Mechanisms, and Downstream.
- DFD uses external entities, processes, data stores, and labeled data flows.
- BPMN text includes start/end events, tasks, gateways, lanes/pools when useful, and exception paths.
- BPMN XML is only generated when specifically requested.
- A Mermaid/D2 companion is included when the user needs immediate visual preview.
