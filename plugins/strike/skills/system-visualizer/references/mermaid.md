# Mermaid Reference

Use Mermaid when the user wants diagrams that are readable in Markdown, easy to paste into GitHub docs, and quick to preview visually.

## When to use Mermaid

Use Mermaid for:

- quick system overview diagrams
- runtime sequence diagrams
- state lifecycle diagrams
- simple ER diagrams
- simple class/domain diagrams
- repo documentation that GitHub can render

## Rendering links

Use `references/visual-preview-links.md` for the `View this visually` block.

Default link: https://mermaid.live

## Flowchart template

Use for high-level app, service, or data flow.

```mermaid
flowchart TD
  user[User]
  web[Web App]
  api[API Server]
  db[(Database)]
  external[External Service]

  user -->|action/request| web
  web -->|HTTP request| api
  api -->|read/write| db
  api -->|API call| external
```

Quality rules:

- Use `flowchart TD` or `flowchart LR`.
- Prefer `LR` for left-to-right architecture diagrams.
- Prefer `TD` for process flows.
- Label arrows with what moves across the boundary.
- Use database cylinder syntax `[(Database)]` for data stores.
- Use subgraphs for domains/layers when helpful.
- Do not create a huge hairball. Split large diagrams.

## Sequence diagram template

Use for runtime interactions over time.

```mermaid
sequenceDiagram
  actor User
  participant Web as Web App
  participant API as API Server
  participant DB as Database
  participant Stripe as Stripe

  User->>Web: Submit registration form
  Web->>API: POST /registrations
  API->>DB: Create pending registration
  API->>Stripe: Create checkout session
  Stripe-->>API: checkout.session.completed webhook
  API->>DB: Mark registration paid
  API-->>Web: Return confirmation
```

Quality rules:

- Use actor for humans.
- Use participants for systems/services.
- Use `->>` for calls and `-->>` for async returns/events.
- Include key failure branches with `alt` / `else` when relevant.

Failure branch example:

```mermaid
sequenceDiagram
  actor User
  participant Web
  participant API
  participant Payment

  User->>Web: Submit payment
  Web->>API: POST /checkout
  API->>Payment: Create payment session
  alt Payment succeeds
    Payment-->>API: payment.completed
    API-->>Web: Show success
  else Payment fails
    Payment-->>API: payment.failed
    API-->>Web: Show retry path
  end
```

## State diagram template

Use for lifecycle/status transitions.

```mermaid
stateDiagram-v2
  [*] --> Draft
  Draft --> PendingPayment: submit registration
  PendingPayment --> Paid: payment completed
  PendingPayment --> Expired: payment window expires
  Paid --> Cancelled: user/admin cancels
  Paid --> Refunded: refund issued
  Cancelled --> [*]
  Refunded --> [*]
  Expired --> [*]
```

Quality rules:

- Include terminal states.
- Include failure/timeout/cancellation states when relevant.
- Label transitions with trigger events.

## ER diagram template

Use for simple schema diagrams when the user wants Markdown-native output.

```mermaid
erDiagram
  USER ||--o{ REGISTRATION : creates
  EVENT ||--o{ REGISTRATION : receives
  REGISTRATION ||--o| PAYMENT : has

  USER {
    uuid id PK
    string email
    datetime created_at
  }

  EVENT {
    uuid id PK
    string title
    datetime starts_at
  }

  REGISTRATION {
    uuid id PK
    uuid user_id FK
    uuid event_id FK
    string status
  }

  PAYMENT {
    uuid id PK
    uuid registration_id FK
    integer amount_cents
    string status
  }
```

Quality rules:

- Use DBML instead when the user wants a reusable database modeling language.
- Use Mermaid ER when the user wants quick GitHub/Markdown rendering.
- Mark uncertain cardinality with notes outside the diagram.

## Class/domain diagram template

Use sparingly for domain objects or code-level classes.

```mermaid
classDiagram
  class User {
    +uuid id
    +string email
  }

  class Registration {
    +uuid id
    +string status
    +submit()
    +cancel()
  }

  User "1" --> "many" Registration : creates
```

## Common mistakes

Avoid:

- unlabeled arrows in system diagrams
- too many nodes in one diagram
- mixing deployment, runtime, and database concerns in one crowded chart
- inventing services or tables not present in source material
- using Mermaid ER as a replacement for detailed database documentation when DBML is a better fit
