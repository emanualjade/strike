# Structurizr DSL / C4 Mode Reference

Use Structurizr DSL when the user needs durable software architecture
documentation with multiple views from one model. Prefer Mermaid for quick
Markdown-only sketches.

## Quick basics

- A Structurizr file is a `workspace` with a `model` and `views`.
- The `model` defines people, software systems, containers, components, and
  relationships.
- `views` choose what to show from the model; at least one view is required.
- Assign identifiers to elements you will reference, and define elements before
  using them in relationships.
- Use `autoLayout` for generated diagrams unless the user requested manual
  layout.

## Model/view pattern

Model the stable truth first, then create focused views:

```structurizr
workspace "Example System" "Architecture model." {
  model {
    customer = person "Customer" "Uses the product."

    system = softwareSystem "Example Web App" "Helps customers register and pay." {
      web = container "Web App" "Browser-facing UI." "Next.js"
      api = container "API" "Handles product requests." "Node.js"
      db = container "Database" "Stores product data." "PostgreSQL" {
        tags "Database"
      }
    }

    payments = softwareSystem "Payment Provider" "Processes payments."

    customer -> web "Uses"
    web -> api "Calls"
    api -> db "Reads from and writes to"
    api -> payments "Creates checkout sessions with"
  }

  views {
    systemContext system "SystemContext" {
      include *
      autoLayout
    }

    container system "Containers" {
      include *
      autoLayout
    }

    styles {
      element "Database" {
        shape Cylinder
      }
    }

    theme default
  }
}
```

## C4 levels

- **System Context:** the system, users, and external systems around it.
- **Container:** deployable/runnable parts inside the system boundary, such as
  web apps, APIs, workers, databases, queues, and mobile apps.
- **Component:** important internal parts of one container. Use only when it
  clarifies implementation structure.
- **Code:** classes, functions, or source-level detail. Usually avoid unless the
  user explicitly asks.

## Quality rules

- Keep each view at one abstraction level; do not mix container internals into
  a system context view.
- Use external `softwareSystem` elements for third-party services such as
  Stripe, SendGrid, S3, Auth0, or GitHub.
- Use containers for things that run, store data, or communicate across process
  boundaries.
- Relationship labels should be short verb phrases: `Calls`, `Publishes events
  to`, `Reads from and writes to`.
- Do not invent architecture. Mark uncertain parts as `UNKNOWN`, `TODO`, or
  `ASSUMPTION`.
- Do not model every file, route, table, or function unless the requested level
  requires it.
- Prefer clear names over clever styling. Use tags/styles sparingly for
  semantic distinctions such as databases, queues, or external systems.

## Rendering links

Use `references/visual-preview-links.md` for the `View this visually` block.

- Quick preview: https://playground.structurizr.com/
- Private/local rendering: https://docs.structurizr.com/local

## Advanced features

For deeper features such as groups, deployment views, dynamic views,
perspectives, themes, documentation blocks, includes, scripts, and workspace
extension, read the official docs instead of guessing:

- Structurizr DSL docs: https://docs.structurizr.com/dsl
- Structurizr DSL language reference: https://docs.structurizr.com/dsl/language
- C4 model docs: https://c4model.com/
