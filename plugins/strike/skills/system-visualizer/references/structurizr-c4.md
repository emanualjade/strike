# Structurizr DSL / C4 Reference

Use Structurizr DSL when the user wants durable software architecture documentation rather than a one-off diagram.

## When to use Structurizr/C4

Use Structurizr DSL for:

- whole-system architecture
- C4 system context, container, and component views
- team architecture docs
- consistent multiple views from one model
- architecture diagrams that should evolve with the codebase

## Rendering links

Use `references/visual-preview-links.md` for the `View this visually` block.

Default quick link: https://playground.structurizr.com/

Private/local link: https://docs.structurizr.com/local

## Basic workspace template

```structurizr
workspace "Example System" "Software architecture model generated from available source material." {

  model {
    customer = person "Customer" "A person using the web application."

    system = softwareSystem "Example Web App" "Allows customers to register and pay." {
      web = container "Web App" "Browser-facing user interface." "Next.js"
      api = container "API Server" "Handles application requests and domain logic." "Node.js"
      db = container "Database" "Stores users, registrations, and payments." "PostgreSQL" {
        tags "Database"
      }
      worker = container "Background Worker" "Processes async jobs and webhooks." "Node.js"
    }

    stripe = softwareSystem "Stripe" "Processes payments."
    email = softwareSystem "Email Service" "Sends transactional emails."

    customer -> web "Uses"
    web -> api "Makes API requests to"
    api -> db "Reads from and writes to"
    api -> stripe "Creates checkout sessions with"
    stripe -> worker "Sends payment webhooks to"
    worker -> db "Updates payment and registration status in"
    worker -> email "Sends confirmation emails via"
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

## C4 view choices

Use these levels:

1. **System Context** — people and external systems around the system.
2. **Container** — apps, services, databases, workers, queues inside the system boundary.
3. **Component** — major components inside one container.
4. **Code** — classes/functions; usually avoid unless requested.

## Quality rules

- Define people, software systems, containers, and relationships in the model.
- Add at least one view; otherwise there may be nothing to render.
- Use `autoLayout` for generated diagrams.
- Separate system context from container-level details.
- Use external systems for third-party services such as Stripe, SendGrid, S3, Auth0, etc.
- Use containers for deployable/runnable units: web app, API server, worker, database, queue.
- Do not model every file/function as a component unless requested.
- Mark unknown technologies as `UNKNOWN` or omit the technology field.
- Avoid forward references: define elements before using them in relationships.

## Useful companion

For users who want a quick Markdown view too, add a Mermaid flowchart companion after the Structurizr DSL.
