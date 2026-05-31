# Examples

These examples show how the skill should behave. They are not exhaustive.

## Example 1: General web app overview

User:

```text
Help me visualize this web app. It has a Next.js frontend, Node API, Postgres database, Stripe checkout, and SendGrid emails.
```

Expected behavior:

- Recommend Mermaid flowchart.
- Mention C4/Structurizr as an alternative for durable architecture docs.
- Produce a Mermaid flowchart with labeled arrows.
- Add Mermaid Live Editor and GitHub Markdown preview links.
- Add useful next moves.

## Example 2: Payment flow

User:

```text
Show me the signup/payment/webhook flow.
```

Expected behavior:

- Recommend Mermaid sequence diagram.
- Include user, web app, API, database, Stripe, and worker if known.
- Include happy path and at least one failure branch when relevant.
- Add Mermaid Live Editor link.

## Example 3: Database schema

User:

```text
Read this Prisma schema and give me a diagram I can view.
```

Expected behavior:

- Recommend DBML.
- Inspect the schema if repository access exists.
- Produce DBML with tables, fields, PKs, FKs, indexes, and enums.
- Add dbdiagram.io link.
- Note assumptions about cardinality or missing constraints.

## Example 4: Durable architecture docs

User:

```text
I want a proper architecture model for this app, not just a quick diagram.
```

Expected behavior:

- Recommend Structurizr DSL / C4.
- Produce a workspace with model and views.
- Include system context and container views.
- Add Structurizr Playground and Structurizr local links.
- Suggest a Mermaid quick overview companion if useful.

## Example 5: API contract

User:

```text
Map these routes into something useful.
```

Expected behavior:

- Recommend OpenAPI if the routes are HTTP endpoints.
- Produce OpenAPI YAML or endpoint inventory if details are incomplete.
- Add Swagger Editor link.
- Add a Mermaid sequence diagram if the user asks about flow.

## Example 6: Events and queues

User:

```text
Show the event flow for Stripe webhooks and background jobs.
```

Expected behavior:

- Recommend AsyncAPI plus Mermaid sequence/flowchart companion.
- Produce channels/messages for known events.
- Do not invent topics or queues.
- Add AsyncAPI Studio link.

## Example 7: Inputs and outputs

User:

```text
I want to understand the inputs and outputs of registration.
```

Expected behavior:

- Recommend IDEF0-style text model.
- Include Inputs, Controls, Outputs, Mechanisms, and Downstream.
- Add Mermaid companion if user wants a visual.
- Add Mermaid Live Editor link for the companion.

## Example 8: Dependency graph

User:

```text
Show me what modules depend on what.
```

Expected behavior:

- Recommend Graphviz DOT.
- Use clusters for domains/packages.
- Label edges if dependency type is known.
- Add Graphviz Online and local Graphviz links.

## Example 9: Private system

User:

```text
This is private infrastructure. Give me a diagram I can view.
```

Expected behavior:

- Include a privacy note.
- Prefer GitHub/private repo rendering or local rendering over public paste-in viewers.
- Still provide a public viewer link as optional if appropriate.

## Example 10: User explicitly chooses a format

User:

```text
Give me this as D2.
```

Expected behavior:

- Do not override the user's explicit format choice.
- Produce D2.
- Add D2 Playground and local D2 links.
- Add assumptions/unknowns if needed.
