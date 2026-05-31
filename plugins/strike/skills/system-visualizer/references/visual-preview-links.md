# Visual Preview Links

Every diagram/model output should include a `View this visually` section when a practical viewer/editor exists.

Do not make the user read diagram code as the final experience. The code is the portable source; the user needs a quick way to see the visual result.

## Privacy rule

If the diagram contains private architecture, private schema names, customer data, internal APIs, credentials, or anything sensitive, recommend repo-local or local rendering first. Public paste-in tools are convenient but may not be appropriate for sensitive systems.

Use this privacy note when relevant:

```markdown
Privacy note:
- If this describes private architecture, prefer repo-local rendering or a trusted internal/local renderer instead of pasting it into a public website.
```

## Mermaid

Fastest visual preview:

- Mermaid Live Editor: https://mermaid.live

Repo-native:

- GitHub Markdown renders Mermaid fenced code blocks: https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams

Polished/export option:

- Mermaid Chart: https://www.mermaidchart.com/app

Local/automation:

- Mermaid CLI: https://github.com/mermaid-js/mermaid-cli

Suggested block:

```markdown
## View this visually

Fastest option:
- Open Mermaid Live Editor: https://mermaid.live
- Paste the Mermaid code above.
- The diagram renders immediately and can be exported.

Repo option:
- Save this in a Markdown file such as `docs/architecture.md` inside a fenced `mermaid` code block.
- GitHub will render it visually in the repo.

Private/local option:
- Save the diagram as a `.mmd` file and render it with Mermaid CLI.
```

## DBML

Fastest visual preview:

- dbdiagram.io: https://dbdiagram.io/d

Docs:

- DBML syntax docs: https://dbml.dbdiagram.io/docs/

Suggested block:

```markdown
## View this visually

Fastest option:
- Open dbdiagram.io: https://dbdiagram.io/d
- Paste the DBML code above.
- The database relationship diagram renders visually.

Private/local option:
- Keep the DBML source in the repo and render/export with an approved internal database diagramming tool.
```

## Structurizr DSL / C4

Fastest visual preview:

- Structurizr Playground: https://playground.structurizr.com/

Local/private:

- Structurizr local docs: https://docs.structurizr.com/local

DSL docs:

- Structurizr DSL docs: https://docs.structurizr.com/dsl

Suggested block:

```markdown
## View this visually

Fastest option:
- Open Structurizr Playground: https://playground.structurizr.com/
- Paste the Structurizr DSL workspace.
- Render the C4 views.

Private/local option:
- Save the DSL as `workspace.dsl` and view it with Structurizr local.
```

## D2

Fastest visual preview:

- D2 Playground: https://play.d2lang.com/

Docs:

- D2 docs: https://d2lang.com/

Suggested block:

```markdown
## View this visually

Fastest option:
- Open D2 Playground: https://play.d2lang.com/
- Paste the D2 code above.
- The diagram renders visually.

Private/local option:
- Save the source as `.d2` and render locally with the D2 CLI.
```

## PlantUML

Fastest visual preview:

- PlantUML Web Editor: https://editor.plantuml.com/
- PlantUML Web Server: https://www.plantuml.com/plantuml/uml/

Docs/server:

- PlantUML server docs: https://plantuml.com/server

Suggested block:

```markdown
## View this visually

Fastest option:
- Open PlantUML Web Editor: https://editor.plantuml.com/
- Paste the PlantUML code above.
- The UML diagram renders in the browser.

Private/local option:
- Render locally using PlantUML or a trusted internal PlantUML server.
```

## Graphviz DOT

Fastest visual preview:

- Graphviz Online: https://dreampuf.github.io/GraphvizOnline/
- Edotor: https://edotor.net/

Docs:

- Graphviz: https://graphviz.org/
- DOT language: https://graphviz.org/doc/info/lang.html

Suggested block:

```markdown
## View this visually

Fastest option:
- Open Graphviz Online: https://dreampuf.github.io/GraphvizOnline/
- Paste the DOT code above.
- The graph renders visually.

Private/local option:
- Save the source as `.dot` and render locally with Graphviz.
```

## OpenAPI

Fastest visual preview:

- Swagger Editor: https://editor.swagger.io/

Docs/tools:

- Swagger Editor docs/tool page: https://swagger.io/tools/swagger-editor/

Suggested block:

```markdown
## View this visually

Fastest option:
- Open Swagger Editor: https://editor.swagger.io/
- Paste the OpenAPI YAML/JSON above.
- The API documentation preview appears beside the spec.

Private/local option:
- Save this as `openapi.yaml` and preview it with your repo's API docs tooling or local Swagger UI.
```

## AsyncAPI

Fastest visual preview:

- AsyncAPI Studio: https://studio.asyncapi.com/

Docs/tools:

- AsyncAPI: https://www.asyncapi.com/

Suggested block:

```markdown
## View this visually

Fastest option:
- Open AsyncAPI Studio: https://studio.asyncapi.com/
- Paste the AsyncAPI YAML/JSON above.
- Validate and preview the event-driven API documentation.

Private/local option:
- Save this as `asyncapi.yaml` and preview it with approved local/internal AsyncAPI tooling.
```

## BPMN

Fastest visual preview:

- bpmn.io demo: https://demo.bpmn.io/

Alternative editor:

- Camunda BPMN tool/modeler: https://camunda.com/bpmn/tool/

Suggested block for BPMN XML:

```markdown
## View this visually

Fastest option:
- Open bpmn.io demo: https://demo.bpmn.io/
- Import or paste the BPMN XML.
- The BPMN process renders visually.

Alternative:
- Use Camunda Modeler/Web Modeler if this process may become executable.
```

## IDEF0 / DFD-style text

There is no single default paste-in viewer for simple IDEF0-style text.

When the user wants a visual result, provide a Mermaid or D2 companion diagram.

Suggested block:

```markdown
## View this visually

Fastest option:
- IDEF0/DFD text is mainly a structured explanation.
- Use the companion Mermaid/D2 diagram above for a visual preview.
- For Mermaid, open https://mermaid.live and paste the Mermaid code.
```
