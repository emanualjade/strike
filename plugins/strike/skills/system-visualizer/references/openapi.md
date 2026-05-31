# OpenAPI Reference

Use OpenAPI when the user needs an HTTP API surface modeled as a reusable
contract: endpoints, request inputs, response payloads, auth, errors, and shared
schemas. If route facts are incomplete, produce an endpoint inventory first and
mark missing details as `UNKNOWN`, `TODO`, or `ASSUMPTION`.

OpenAPI is a contract model, not a flowchart. Model the externally visible HTTP
interface. Add a Mermaid sequence diagram only when the user also needs the
runtime story for one important request path.

## Quick Basics

- Use YAML unless the user asks for JSON.
- Use the repo's existing OpenAPI version when one exists. For new specs, prefer
  `openapi: 3.1.0` for broad tool support; use `3.2.0` only when requested or
  when the target tooling supports it.
- Required root fields are `openapi` and `info`; include at least one of
  `paths`, `components`, or `webhooks`. For normal HTTP APIs, include `paths`.
- Include `servers` when the base URL is known. Mark unknown URLs explicitly.
- Group operations with `tags` when it improves readability.
- Keep examples realistic but remove secrets, tokens, PII, and private data.

Minimal shape:

```yaml
openapi: 3.1.0
info:
  title: Example API
  version: 0.1.0
servers:
  - url: https://api.example.com
paths:
  /registrations/{registrationId}:
    get:
      summary: Get a registration
      operationId: getRegistration
      tags: [Registrations]
      security:
        - bearerAuth: []
      parameters:
        - name: registrationId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        "200":
          description: Registration found
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Registration"
        "401":
          description: Unauthorized
        "404":
          description: Registration not found
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
  schemas:
    Registration:
      type: object
      required: [id, status]
      properties:
        id:
          type: string
          format: uuid
        status:
          type: string
          enum: [pending, paid, cancelled]
```

## Paths And Operations

- A path is a URL template such as `/users/{userId}`. It must start with `/`.
- An operation is an HTTP method under a path: `get`, `post`, `put`, `patch`,
  `delete`, and so on.
- Path template variables must have matching `in: path` parameters with
  `required: true`.
- Use stable, unique `operationId` values when known; prefer verb-plus-noun
  names like `createRegistration` or `listInvoices`.
- Put shared path parameters at the Path Item level only when every operation
  on that path uses them.
- Do not invent routes, methods, query filters, pagination, or status codes.

## Requests

- Use `parameters` for path, query, header, and cookie inputs.
- Use `requestBody` for JSON, form, multipart, XML, or other HTTP payloads.
- Include `required: true` on `requestBody` only when the body is mandatory.
- Always include `content` media types when payload format is known, especially
  `application/json`.
- Prefer `$ref` to shared schemas for domain objects that appear in multiple
  places.
- Represent file uploads, form posts, custom header serialization, and complex
  query strings only when the source material supports them.

## Responses

- Every operation needs `responses`.
- Quote HTTP status codes: `"200"`, `"201"`, `"400"`, `"404"`.
- Include the main success response and common errors when known.
- Every response needs a `description`.
- Include `content` and schema for responses with bodies. Omit `content` for
  bodyless responses such as `"204"`.
- Use shared `components.responses` for repeated error shapes when useful.

## Components

Use `components` to avoid repeating contract pieces:

- `schemas` for request/response objects and value objects.
- `parameters` for repeated path/query/header parameters.
- `requestBodies` and `responses` for repeated payload envelopes.
- `securitySchemes` for auth definitions.
- `headers` and `examples` when they clarify a real contract.

Keep component names domain-specific and stable. When a `$ref` needs extra
constraints or composition, prefer a valid schema pattern such as `allOf` rather
than mixing conflicting inline schema fields beside the reference.

## Security Patterns

- Define auth under `components.securitySchemes`.
- Apply default auth at the root `security` field when it covers most
  operations.
- Override auth per operation when an endpoint is public, uses different auth,
  or needs OAuth/OpenID scopes.
- Use `- bearerAuth: []` for HTTP bearer tokens and `- apiKeyAuth: []` for API
  key schemes without scopes.
- For OAuth 2.0 and OpenID Connect, list required scopes in the security
  requirement when known.
- If auth is visible in code but details are incomplete, model the scheme and
  mark unknown fields. Do not guess secrets, issuers, token formats, or scopes.

Supported security scheme types include `apiKey`, `http`, `mutualTLS`, `oauth2`,
and `openIdConnect`.

## Quality Rules

- Preserve real route names, parameter names, schema fields, and status codes.
- Mark uncertainty in notes; do not smuggle guesses into the spec as facts.
- Include auth, request schemas, response schemas, and error responses when
  known.
- Keep public API contracts separate from internal-only handlers unless the user
  asks for an internal inventory.
- Prefer specific schemas over loose `type: object` placeholders.
- Use consistent naming for tags, component schemas, and operation IDs.
- Validate with the repo's OpenAPI tooling or a trusted editor when practical.
- Add a `View this visually` block using `references/visual-preview-links.md`
  when delivering an OpenAPI artifact.

## Advanced Features

Use official docs before modeling deeper OpenAPI features:

- Latest OpenAPI Specification: https://spec.openapis.org/oas/latest.html
- OpenAPI Learn: https://learn.openapis.org/specification/
- Paths and operations: https://learn.openapis.org/specification/paths.html
- Parameters and request bodies: https://learn.openapis.org/specification/parameters.html
- Security: https://learn.openapis.org/specification/security.html

Reach for the spec/docs when using callbacks, webhooks, links, polymorphism,
discriminators, multipart uploads, complex parameter serialization,
multi-document `$ref`s, overlays, or other features that affect tool
compatibility.
