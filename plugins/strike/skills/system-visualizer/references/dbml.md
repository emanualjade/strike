# DBML Mode Reference

Use DBML when the user wants a database-first diagram: tables, fields, keys, relationships, indexes, enums, and schema notes that can be pasted into dbdiagram.io.

## Use DBML for

- Prisma, SQL, Drizzle, Rails, Django, or migration schema visualization
- entity relationship diagrams that need real table and column names
- registration, payment, membership, tenant, or content schemas
- schema review, data modeling, and database documentation

Use Mermaid ER instead when the user needs quick Markdown-native rendering. Use OpenAPI, AsyncAPI, Mermaid sequence/flowchart, or BPMN for APIs, events, runtime flows, or business processes.

## Rendering links

Use `references/visual-preview-links.md` for the `View this visually` block.

Default link: https://dbdiagram.io/d

## Quick basics

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
  created_at timestamp [not null]
}

Table registrations {
  id uuid [pk]
  user_id uuid [not null]
  status registration_status [not null, note: 'Use confirmed statuses only']
  created_at timestamp [not null]

  indexes {
    user_id
    (user_id, status)
  }
}

Ref: registrations.user_id > users.id
```

## Core patterns

### Tables and columns

```dbml
Table table_name {
  id uuid [pk]
  required_text varchar [not null]
  optional_text varchar
  created_at timestamp [not null, default: `now()`]

  Note: 'ASSUMPTION: business rule that does not fit a field setting.'
}
```

- Preserve real database names and casing when known.
- Use practical SQL-ish types from the source schema; do not normalize every type into generic strings.
- Put uncertainty in `note`, `Note`, `TODO`, `UNKNOWN`, or `ASSUMPTION`, not in invented columns.

### Relationships

```dbml
Ref: orders.user_id > users.id                  // many orders belong to one user
Ref: profiles.user_id - users.id                // one-to-one
Ref: memberships.organization_id > organizations.id
Ref: memberships.user_id > users.id
```

- Prefer explicit `Ref:` lines for generated diagrams; they are easier to scan and edit.
- Model many-to-many relationships with a join table when the join has fields, indexes, timestamps, roles, or business meaning.
- Use direct `<>` many-to-many only for simple conceptual diagrams.
- If cardinality or optionality is unclear, keep the relationship and mark the assumption in a note.

### Indexes and constraints

```dbml
Table memberships {
  user_id uuid [not null]
  organization_id uuid [not null]
  role varchar [not null]

  indexes {
    (user_id, organization_id) [unique]
    organization_id
    role
  }
}
```

- Include primary keys, unique constraints, and important lookup indexes when known.
- Use composite indexes for join tables and natural uniqueness.
- Do not invent performance indexes unless clearly marked as assumptions.

### Enums

```dbml
Enum payment_status {
  pending
  succeeded
  failed
  refunded
}

Table payments {
  status payment_status [not null]
}
```

- Use enums only when values are confirmed or explicitly marked as assumptions.
- Keep enum names lowercase snake_case unless the source uses a different convention.

## Quality rules

- Answer the user's schema question; avoid dumping every table if a focused subset is clearer.
- Include all known primary keys, foreign keys, join tables, uniqueness rules, and key indexes.
- Preserve source table, field, enum, and status names.
- Separate database structure from runtime/service flow concerns.
- Keep large systems split into focused diagrams by bounded context or feature area.
- Add notes for source gaps, inferred relationships, optional cardinality, and business rules.
- Exclude secrets, credentials, sample user data, and irrelevant seed data.
- Make the output pasteable as one `dbml` code fence.

## Advanced features

For deeper syntax, use official docs instead of guessing:

- [DBML syntax](https://dbml.dbdiagram.io/docs) for schemas, aliases, checks, defaults, composite keys, composite refs, relationship settings, table partials, and records.
- [dbdiagram DBML docs](https://docs.dbdiagram.io/dbml) for dbdiagram-specific usage.
- [dbdiagram relationships](https://docs.dbdiagram.io/relationships/) for visual relationship behavior and inline relationship examples.
