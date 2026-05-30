# Research And Planning

Research when the answer can change scope, architecture, implementation
strategy, verification, cost, UX, security, privacy, or blast radius. Treat
research as a momentum tool: do the smallest source-backed check that can
produce a defensible recommendation, reveal a standard or idiomatic pattern,
name the risk, or identify a real blocker.

Do not turn research into a separate stage by default. Keep moving with a
recommendation unless the missing fact changes product behavior, safety,
security/privacy, cost, dependency approval, data shape, or another hard-to-
reverse choice.

For third-party frameworks, APIs, SDKs, CLIs, auth, payments, uploads, video,
AI services, databases, queues, deployment platforms, accessibility, security,
or browser behavior, check current official docs before making binding decisions
or writing code. Prefer the idiomatic path for the actual version in the repo.
For Stripe work, load `stripe.md`. For Stripe Connect, use the installed
`stripe-connect` skill first when available and record the implications.

When a domain has known standards or common traps, do focused research before
locking in the model or workflow. Example domains include commerce, taxes,
billing, subscriptions, refunds, accounting, auth, permissions, healthcare,
legal, scheduling, file uploads, media processing, AI generation, privacy,
security, and data retention. If the user is heading toward a bespoke path where
a standard pattern would reduce risk, explain the tradeoff and recommend the
standard path.

## Standards Before Bespoke

When a feature touches a domain with established operational, financial,
security, legal, platform, or industry patterns, do not rely on intuition alone.
Do a quick standards check before locking the model, workflow, or code approach.

Common trigger domains include money movement, accounting, refunds, carts,
checkout, subscriptions, invoices, taxes, credits, permissions, auth, privacy,
data retention, scheduling, uploads, media processing, AI usage, background jobs,
notifications, and audit trails.

Useful research prompt:

- What would Stripe do? What would Shopify do? What would Amazon do? What would
  a bank, mature SaaS product, or trusted platform likely do here? Answer from
  current source-backed evidence, not intuition alone.

Use current public docs, API models, help docs, standards, or reputable
engineering/product references before locking the model, workflow, or code
approach.

Record the implication as a decision, model note, spec constraint, or slice
watchout. If the standard approach is heavier than the MVP needs, explicitly name
the safe simplification and when to revisit it.

Research at four levels:

- Idea research: check product, UX, technical, business, legal/privacy, domain,
  industry-standard, or comparable-product context only when it can change the
  MVP target.
- Domain/model research: check standards, workflows, data models, lifecycle
  rules, compliance expectations, and common traps before inventing a bespoke
  solution to a solved problem.
- Spec research: verify repo precedents, stack guidance, architecture options,
  data/model pitfalls, state/lifecycle risks, permissions, failure modes, and
  blast radius before writing durable constraints.
- Slice/plan research: before each slice build, confirm files and surfaces,
  local conventions, current docs, test/dev setup, data/auth/access boundaries,
  and the smallest safe verification path.

Record research as implications, not a diary. Good research says what changed,
why it matters, and where the evidence came from.
