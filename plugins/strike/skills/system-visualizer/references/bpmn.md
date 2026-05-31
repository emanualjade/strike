# BPMN Mode Reference

Use BPMN when the user wants to model a business process, approval, handoff, fulfillment flow, cancellation/refund path, waitlist, escalation, or other stakeholder workflow.

Use BPMN-style text by default. Produce BPMN XML only when the user asks for importable `.bpmn`, names a BPMN tool or workflow engine, or needs a saved artifact that can be opened in a BPMN modeler.

## Quick basics

- BPMN is process-centric. It is not the best choice for architecture boundaries, database schemas, or raw data movement.
- The practical core is small: pools/lanes show participants and responsibility, events show things that happen, tasks show work, gateways show branching/merging, and flows show order or cross-participant messages.
- Model the business-level process first. Do not include every screen, click, API call, table write, or implementation detail unless it changes ownership, timing, decision logic, or exception handling.
- Start with the happy path, then add the important exceptions.
- If the user needs an immediate visual but not importable BPMN, provide BPMN-style text plus a Mermaid or D2 companion.

## BPMN-style text

```markdown
## BPMN-style process

**Pool:** Customer registration

**Lanes**
- Customer
- Web App
- Payment Provider
- Operations

**Main path**
1. Start event: Customer selects event/session.
2. User task: Customer submits registration form.
3. Service task: System validates eligibility and capacity.
4. Exclusive gateway: Space available?
   - Yes -> Service task: Create pending registration.
   - No -> User task: Offer waitlist.
5. User task: Customer completes checkout.
6. Intermediate message event: Payment completed webhook received.
7. Service task: Mark registration paid.
8. Service task: Send confirmation email.
9. End event: Registration confirmed.

**Exception paths**
- Payment failed -> Customer retries checkout or registration expires.
- Capacity filled before payment -> System cancels checkout and offers waitlist.
- Admin cancels registration -> System issues refund or credit.
```

## Core elements

- Pools represent participants or process boundaries, such as `Customer`, `Marketplace`, or `Payment Provider`. Use multiple pools when separate participants exchange messages.
- Lanes divide responsibility inside one pool. Use roles, teams, or major systems only when ownership matters.
- Events are things that happen: start, intermediate, boundary, or end. Name them as outcomes or triggers, such as `Payment received`, `Timer expired`, or `Application rejected`.
- Tasks are work performed by a person, system, or rule. Name them as verb-object phrases, such as `Validate application`, `Approve refund`, or `Send receipt`.
- Gateways control branching and merging. Use exclusive for one path, parallel for all paths, inclusive for one or more paths, and event-based when whichever event happens first decides the path.
- Sequence flows show order inside a pool. Message flows show communication between pools. Do not use sequence flow across pool boundaries.
- Associations attach notes or data objects; keep them secondary to the process flow.

## BPMN XML

Generate BPMN XML only for importable or executable artifacts. If the target tool matters, ask or infer the target because engine extensions and executable properties differ.

When producing XML:

- Use BPMN 2.0 XML with `bpmn:` process elements and `bpmndi:` diagram interchange layout when the user needs a visual import.
- Keep names stable and human-readable; use generated IDs only as internal identifiers.
- Include start/end events, tasks, gateways, sequence flows, lanes/pools, and message flows that match the text model.
- Avoid vendor-specific execution fields unless the user names the engine and the needed behavior is known.
- Validate by opening the `.bpmn` in a BPMN modeler such as
  [bpmn.io online modeler](https://demo.bpmn.io/).

## Quality rules

- Every model should have a clear scope, at least one start event, and intentional end state(s).
- Keep the main path readable before adding edge cases.
- Label gateway decisions as questions and label outgoing paths with concrete conditions.
- Put decision work in a task before the gateway; the gateway routes, it does not perform analysis.
- Split and merge parallel/inclusive paths deliberately, or make it clear when paths end separately.
- Keep lanes focused on responsibility, not deployment architecture.
- Use message flows for cross-pool communication and sequence flows only within a pool.
- Mark unknown owners, events, or decisions as `UNKNOWN`, `TODO`, or `ASSUMPTION` instead of inventing them.

## Advanced features

Keep most agent-produced BPMN simple. For deeper models, use the official BPMN spec or bpmn.io docs before adding sub-processes, call activities, boundary events, event sub-processes, compensation, transactions, data objects, choreography, collaboration, or executable engine properties.

- OMG BPMN specification page: https://www.omg.org/spec/BPMN/
- BPMN 2.0.2 PDF: https://www.omg.org/spec/BPMN/2.0.2/PDF
- bpmn.io toolkit and bpmn-js docs: https://bpmn.io/toolkit/bpmn-js/
- bpmn.io examples: https://bpmn.io/toolkit/bpmn-js/examples/
- bpmn.io online modeler: https://demo.bpmn.io/
