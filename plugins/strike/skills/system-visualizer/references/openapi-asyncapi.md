# OpenAPI / AsyncAPI Reference

Use OpenAPI for HTTP APIs and AsyncAPI for event-driven systems, queues, pub/sub, and webhooks.

## When to use OpenAPI

Use OpenAPI when the user asks about:

- HTTP endpoints
- REST APIs
- request/response contracts
- API documentation
- route inventory
- client/server integration contracts

## When to use AsyncAPI

Use AsyncAPI when the user asks about:

- events
- queues
- pub/sub
- message buses
- webhooks
- background jobs triggered by messages
- event payload contracts

## Rendering links

Use `references/visual-preview-links.md` for the `View this visually` block.

OpenAPI quick link: https://editor.swagger.io/

AsyncAPI quick link: https://studio.asyncapi.com/

## OpenAPI starter template

Use YAML unless the user asks for JSON.

```yaml
openapi: 3.1.0
info:
  title: Example API
  version: 0.1.0
  description: Generated from available route information. Review assumptions before relying on this.
servers:
  - url: https://api.example.com
    description: UNKNOWN production API base URL
paths:
  /registrations:
    post:
      summary: Create a registration
      operationId: createRegistration
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - eventId
              properties:
                eventId:
                  type: string
                  format: uuid
                participantId:
                  type: string
                  format: uuid
      responses:
        '201':
          description: Registration created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Registration'
        '400':
          description: Invalid request
        '401':
          description: Unauthorized
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
  schemas:
    Registration:
      type: object
      required:
        - id
        - eventId
        - status
      properties:
        id:
          type: string
          format: uuid
        eventId:
          type: string
          format: uuid
        status:
          type: string
          enum: [pending, paid, cancelled]
```

## OpenAPI quality rules

- Include `openapi`, `info`, `paths`, and `components` when known.
- Include auth/security when known.
- Include request body and response schemas.
- Include common error responses.
- Use `UNKNOWN` or comments in surrounding notes for missing base URLs, auth, or payload details.
- Do not invent endpoints.
- If route details are incomplete, produce an endpoint inventory first.

## AsyncAPI starter template

Use this for event/message contracts.

```yaml
asyncapi: 2.6.0
info:
  title: Example Events
  version: 0.1.0
  description: Generated from available event, queue, and webhook information. Review assumptions before relying on this.
channels:
  registration.paid:
    subscribe:
      summary: Registration paid event consumed by the application
      message:
        $ref: '#/components/messages/RegistrationPaid'
  payment.failed:
    subscribe:
      summary: Payment failed event consumed by the application
      message:
        $ref: '#/components/messages/PaymentFailed'
components:
  messages:
    RegistrationPaid:
      name: RegistrationPaid
      title: Registration paid
      contentType: application/json
      payload:
        type: object
        required:
          - registrationId
          - paymentId
        properties:
          registrationId:
            type: string
            format: uuid
          paymentId:
            type: string
          paidAt:
            type: string
            format: date-time
    PaymentFailed:
      name: PaymentFailed
      title: Payment failed
      contentType: application/json
      payload:
        type: object
        required:
          - registrationId
          - reason
        properties:
          registrationId:
            type: string
            format: uuid
          reason:
            type: string
```

## AsyncAPI quality rules

- Identify channels/topics/queues clearly.
- Distinguish produced vs consumed events when known.
- Include payload schemas.
- Include content type if known.
- Include event names and versioning if known.
- Mark webhook source as `UNKNOWN` if unclear.
- Do not invent message topics.

## Useful companion diagrams

For OpenAPI, add a Mermaid sequence diagram for one key request path when helpful.

For AsyncAPI, add a Mermaid sequence or flowchart showing producer -> broker/webhook -> consumer -> database.
