# AsyncAPI Reference

Use AsyncAPI when the user needs a durable contract for event-driven systems: events, queues, topics, pub/sub, message buses, webhooks, background jobs, and message payloads.

## How to model properly

AsyncAPI is a contract model, not a general architecture diagram. Model the asynchronous interface from the perspective of the application being described.

- Use `channels` for routing surfaces: topics, queues, routing keys, event types, or webhook paths.
- Use `operations` for what this application does on those channels.
- Use `action: send` when this application publishes/emits/sends a message.
- Use `action: receive` when this application consumes/handles/receives a message.
- Use `messages` for the named event or command contract.
- Use `payload` for the message body schema and `headers` for application headers.
- Add a companion Mermaid sequence or flowchart when the user needs an immediate visual flow.

Do not use AsyncAPI to show every internal function, database write, retry, or side effect. Use it to make producer/consumer contracts precise.

## Rendering links

Use `references/visual-preview-links.md` for the `View this visually` block.

Default link: https://studio.asyncapi.com/

Official docs: https://www.asyncapi.com/docs

Official spec: https://www.asyncapi.com/docs/reference/specification/v3.1.0

## Quick basics

Prefer YAML unless the user asks for JSON. Prefer AsyncAPI `3.1.0` unless the existing project or target tooling already uses another version.

Core shape:

```yaml
asyncapi: 3.1.0
info:
  title: Example Events
  version: 0.1.0
defaultContentType: application/json
servers:
  production:
    host: broker.example.com:9092
    protocol: kafka
channels:
  registrationPaid:
    address: registration.paid
    messages:
      RegistrationPaid:
        $ref: '#/components/messages/RegistrationPaid'
operations:
  publishRegistrationPaid:
    action: send
    channel:
      $ref: '#/channels/registrationPaid'
    messages:
      - $ref: '#/channels/registrationPaid/messages/RegistrationPaid'
components:
  messages:
    RegistrationPaid:
      name: RegistrationPaid
      title: Registration paid
      contentType: application/json
      payload:
        $ref: '#/components/schemas/RegistrationPaidPayload'
  schemas:
    RegistrationPaidPayload:
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
```

## Channels

- Name channel IDs for readability, such as `registrationPaid`.
- Put the real topic, routing key, queue, event type, or webhook path in `address`.
- Use `address: null` or omit `address` only when it is genuinely unknown or generated at runtime.
- Use channel parameters for templated addresses such as `users.{userId}`.
- Use channel `servers` only when the channel is available on a subset of declared servers.
- Do not invent topics or queues; mark unknown names as `UNKNOWN` or `ASSUMPTION`.

## Operations

- Operation IDs should describe application behavior, such as `publishRegistrationPaid` or `receivePaymentFailed`.
- Always set `action` from this application's point of view: `send` for produced messages, `receive` for consumed messages.
- Reference the channel with `$ref`; do not inline the channel inside an operation.
- Add operation `messages` when the channel accepts multiple message types and the operation handles only some of them.
- Use short summaries for business intent, not implementation detail.

## Messages and payloads

- Prefer reusable `components.messages` and `components.schemas`.
- Keep message names stable and machine-friendly.
- Include `contentType` when known, usually `application/json`.
- Include `headers` for application-level metadata such as correlation IDs, tenant IDs, or idempotency keys. Do not model protocol headers there.
- Include `correlationId` when message tracing or request/reply matching is known.
- Use `required`, `enum`, `format`, `additionalProperties`, and examples when source material confirms them.
- If schema details are incomplete, model known fields and mark the rest as `TODO` or `UNKNOWN`.

## Security patterns

Define reusable schemes in `components.securitySchemes`, then reference them from `servers` or sensitive `operations`.

```yaml
servers:
  production:
    host: broker.example.com:9092
    protocol: kafka
    security:
      - $ref: '#/components/securitySchemes/bearerAuth'
operations:
  receivePaymentFailed:
    action: receive
    channel:
      $ref: '#/channels/paymentFailed'
    security:
      - $ref: '#/components/securitySchemes/bearerAuth'
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

Use server-level security for connection requirements. Use operation-level security when permissions differ by topic, queue, webhook, or action. Never include real secrets, tokens, usernames, or passwords.

## Quality rules

- Include `asyncapi`, `info`, `channels`, and relevant `operations`.
- Include `servers` when host/protocol details are known.
- Distinguish produced vs consumed messages accurately.
- Preserve real event/topic/message names from source material.
- Include payload schemas for every important message.
- Represent auth/security when known.
- Keep one contract focused on one application or bounded event surface.
- Add assumptions/unknowns instead of guessing.
- Use a companion Mermaid diagram for producer -> broker/webhook -> consumer -> database when visual flow matters.

## Advanced features

Keep generated first drafts simple. For deeper needs, use official AsyncAPI docs:

- Protocol bindings for Kafka, AMQP, MQTT, WebSockets, HTTP, SNS/SQS, NATS, and others: https://www.asyncapi.com/docs/reference/bindings
- Request/reply, replies, and correlation IDs: https://www.asyncapi.com/docs/reference/specification/v3.1.0
- Traits and reusable components: https://www.asyncapi.com/docs/reference/specification/v3.1.0
- Migration from older AsyncAPI versions: https://www.asyncapi.com/docs/migration/migrating-to-v3
- AsyncAPI Studio and tooling: https://studio.asyncapi.com/ and https://www.asyncapi.com/docs/tools
