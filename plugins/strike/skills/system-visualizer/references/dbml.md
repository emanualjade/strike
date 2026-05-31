# DBML Reference

Use DBML when the user wants a database-first representation: tables, fields, relationships, indexes, enums, and schema rules.

## When to use DBML

Use DBML for:

- Prisma/SQL/Drizzle/Rails/Django model visualization
- database schema review
- entity relationships
- registration/payment/membership schemas
- schema documentation that can be pasted into dbdiagram.io

## Rendering links

Use `references/visual-preview-links.md` for the `View this visually` block.

Default link: https://dbdiagram.io/d

## Basic DBML template

```dbml
Project app_schema {
  database_type: 'PostgreSQL'
  Note: 'Generated from available schema information. Review assumptions before relying on this.'
}

Enum registration_status {
  pending
  paid
  cancelled
  refunded
}

Table users {
  id uuid [pk]
  email varchar [not null, unique]
  name varchar
  created_at timestamp [not null]
}

Table events {
  id uuid [pk]
  title varchar [not null]
  starts_at timestamp
  capacity integer
  created_at timestamp [not null]
}

Table registrations {
  id uuid [pk]
  user_id uuid [not null]
  event_id uuid [not null]
  status registration_status [not null]
  created_at timestamp [not null]

  indexes {
    (user_id, event_id) [unique]
    event_id
    status
  }
}

Table payments {
  id uuid [pk]
  registration_id uuid [not null, unique]
  amount_cents integer [not null]
  currency varchar [not null]
  status varchar [not null]
  created_at timestamp [not null]
}

Ref: registrations.user_id > users.id
Ref: registrations.event_id > events.id
Ref: payments.registration_id > registrations.id
```

## Relationship direction

Use these patterns:

```dbml
Ref: orders.user_id > users.id              // many orders belong to one user
Ref: profiles.user_id - users.id            // one-to-one relationship
Ref: memberships.organization_id > organizations.id
```

If cardinality is uncertain, use a note:

```dbml
Table memberships {
  id uuid [pk]
  user_id uuid [not null, note: 'ASSUMPTION: user can have many memberships']
}
```

## Notes and assumptions

Use `Note` for business rules, uncertainty, and source limitations.

```dbml
Table registrations {
  id uuid [pk]
  status varchar [not null, note: 'TODO: replace with enum if statuses are confirmed']

  Note: 'ASSUMPTION: a registration belongs to exactly one event and one user.'
}
```

## Quality rules

- Include primary keys.
- Include foreign keys.
- Include join tables.
- Include uniqueness and important indexes when known.
- Include enums when status values are known.
- Do not invent indexes unless marked as assumptions.
- Preserve real table/field names from the codebase when available.
- Prefer snake_case if the database uses snake_case.
- Add notes for business rules that are not expressible as fields/refs.
- If source schema is incomplete, mark missing pieces as `TODO` or `UNKNOWN`.

## When not to use DBML

Do not use DBML for:

- runtime request flow
- web app architecture
- external API contracts
- event-driven payload contracts
- business process approval flows

Use Mermaid sequence/flowchart, Structurizr/C4, OpenAPI/AsyncAPI, or BPMN instead.
