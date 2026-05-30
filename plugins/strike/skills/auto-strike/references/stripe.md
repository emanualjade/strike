# Stripe Work

Load this reference for any Stripe-related Auto Strike work: Checkout,
PaymentIntents, Subscriptions, Billing Portal, invoices, customers, products,
prices, refunds, disputes, webhooks, Tax, Connect, connected accounts,
transfers, payouts, application fees, account links, embedded components, or
capability/requirement handling.

## Research

Use current official Stripe docs and any installed official Stripe skills before
making binding product, API, webhook, money-movement, billing, Connect, or
subscription decisions. Record only decision-useful implications in the active
initiative, feature spec, research note, or slice plan.

For Stripe Connect, first use the installed `stripe-connect` skill when it is
available. Treat it as the starting point for account type, onboarding,
capabilities, requirements, platform-vs-connected-account API calls, charge
type, transfers, payouts, application fees, webhooks, and risk decisions. Record
that the `stripe-connect` skill was used, or record why it was unavailable.

Do not guess Stripe state machines, webhook event shape, idempotency behavior,
Connect account requirements, money movement, fee behavior, transfer timing,
payout behavior, subscription lifecycle, tax behavior, or dispute/refund flow.
When in doubt, go back to official docs and sandbox verification.

## Verification

Stripe implementation is not done until it has sandbox evidence. Use the Stripe
CLI and sandbox/test account configured in the consuming repo. Do not expose
secret keys or webhook signing secrets in docs or final output.

Record compact evidence such as:

- `stripe --version` and sandbox/test-mode access confirmed.
- The exact Stripe CLI/API command or repo flow exercised.
- Created/retrieved sandbox object IDs, redacted if useful but still traceable
  enough for review, such as `pi_...`, `cs_test_...`, `sub_...`, `evt_...`, or
  `acct_...`.
- Webhook forwarding and event triggering with Stripe CLI when webhooks are in
  scope, including the event type and local endpoint.
- For Connect, connected-account sandbox evidence: account creation/retrieval,
  capability or requirement state, account link/session creation, platform vs
  connected account request behavior, and transfer/application-fee/payment-flow
  evidence when relevant.

If Stripe CLI or sandbox access is blocked, do not call the Stripe slice done.
Record the blocker, replacement evidence, residual risk, and the exact command
or sandbox flow that still needs to run. Only accept code-only Stripe
verification when the user explicitly accepts that risk for the current slice.

## Readiness

Before feature or initiative readiness, verify that every accepted Stripe path
has sandbox evidence or an explicit user-accepted residual risk. Webhook,
Connect, subscription, refund, dispute, tax, transfer, and payout paths need
negative or lifecycle checks when they are inside accepted scope.
