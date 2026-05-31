# IDEF0 Reference

Use IDEF0-style text when the user wants to understand functions, transformations, responsibilities, inputs, outputs, controls, or mechanisms. It is best for "what changes what, under which rules, using which resources"; it is not a sequence diagram, data-flow diagram, or BPMN workflow.

## Quick basics

- Model functions as verb-noun actions, such as `Register participant` or `Approve refund`.
- Treat each function as a box with Inputs, Controls, Outputs, and Mechanisms.
- Focus on functional relationships and system boundaries, not UI steps or implementation order.
- Prefer structured text unless the user asks for a visual; add a Mermaid or D2 companion when immediate rendering matters.

## IDEF0-style text

```markdown
## IDEF0-style model

### Context: Register participant for event

**Scope**
- From submitted registration details to confirmation, waitlist, or rejection

**Inputs**
- Registration form data
- Selected event/session
- Participant identity

**Controls**
- Eligibility rules
- Capacity limits
- Pricing and payment requirements

**Outputs**
- Pending or confirmed registration
- Checkout session
- Error, rejection, or waitlist state

**Mechanisms**
- Web app
- API server
- Database
- Payment provider
- Email service

**Downstream**
- Payment processing
- Attendance reporting
```

## ICOM rules

- Inputs are transformed or consumed by the function.
- Controls constrain, govern, trigger, or validate the function; they are not consumed.
- Outputs are produced results: artifacts, decisions, records, messages, or state changes.
- Mechanisms are the people, systems, services, tools, or roles that perform or support the function.
- Use concrete noun phrases for ICOM items. Mark uncertain items as assumptions instead of inventing them.

## Decomposition

- Start with a context function that defines the boundary and purpose.
- Break a broad function into 3-6 child functions when one box hides meaningful work.
- Number child functions when useful: `A0` for the parent, then `A1`, `A2`, `A3`.
- Keep child functions at the same abstraction level.
- Parent inputs, controls, outputs, and mechanisms should appear in the child view where they matter.
- Stop decomposing when the model answers the user's question clearly.

## Quality rules

- Use active function names, not vague nouns.
- Do not mix IDEF0 with chronology: if order matters, add a separate sequence, flowchart, or BPMN view.
- Do not label a rule, policy, or requirement as an input; put it under Controls.
- Do not label an actor or service as an input; put it under Mechanisms.
- Every function should have at least one output.
- Avoid giant lists. Split the function or group related items when the model gets crowded.
- Include a short assumptions note when source facts are incomplete.

## Advanced features

For formal diagram syntax, node numbering, tunneled arrows, call arrows, feedback arrows, glossary conventions, and deeper model-development rules, use the NIST specification: [FIPS PUB 183, Integration Definition for Function Modeling (IDEF0)](https://nvlpubs.nist.gov/nistpubs/Legacy/FIPS/fipspub183.pdf).
