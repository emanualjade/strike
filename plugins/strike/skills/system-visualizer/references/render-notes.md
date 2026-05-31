# Render Notes

This skill is instruction-only and does not require scripts. These notes give
agents and users local rendering options when they prefer not to paste private
diagrams into public websites.

Do not install packages, run package-manager commands, or approve dependency
build scripts unless the consuming repo allows that workflow and the user
explicitly approves it.

## Mermaid local render

If Mermaid CLI is already available:

```bash
mmdc -i diagram.mmd -o diagram.svg
mmdc -i diagram.mmd -o diagram.png
mmdc -i diagram.mmd -o diagram.pdf
```

## D2 local render

If D2 is already available:

```bash
d2 diagram.d2 diagram.svg
d2 diagram.d2 diagram.png
```

## Graphviz local render

If Graphviz is already available:

```bash
dot -Tsvg diagram.dot -o diagram.svg
dot -Tpng diagram.dot -o diagram.png
```

## Structurizr local

Save the DSL as `workspace.dsl`, then use Structurizr local. See:

https://docs.structurizr.com/local

## PlantUML local render

If PlantUML is already available:

```bash
plantuml diagram.puml
```

Or render via a trusted internal PlantUML server.

## OpenAPI local preview

Save as `openapi.yaml` and preview with your chosen local Swagger UI or OpenAPI
tooling.

## AsyncAPI local preview

Save as `asyncapi.yaml` and preview or generate docs with your chosen AsyncAPI
tooling.

## BPMN local preview

Save as `.bpmn` and open with Camunda Modeler or another BPMN-compatible editor.
