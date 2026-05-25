# Spec

Write one or more specs only when they are useful. A spec is the durable source
of truth for what is being built, not an implementation script.

Default path:

- `auto-strike/features/<feature-slug>/spec.md`
- additional specs only for genuinely separate capabilities or audiences

Useful spec shape:

```md
# [Feature/MVP] Spec

## Summary
## Who Or What This Serves
## What We Are Building
## Flows
## Scope
## Product Rules
## Domain Language
## State, Lifecycle, And Invariants
## Security, Privacy, Permissions, And Data Integrity
## Technical Constraints
## Success Checks
### Repo-Verifiable
### Live / Human
## Risks And Assumptions
## Open Questions
## Slice Handoff
## Phase Tasks
## Spec Review
## Exit Evidence
```

Omit empty sections. Include "out of scope and why" so later work does not
silently expand. Split success checks into repo-verifiable checks and live or
human checks.

During active spec work, keep the process sections concise:

```md
## Phase Tasks
- [ ] Pull current truth from idea, grill, language, and decisions.
- [ ] Write product behavior, scope, non-goals, rules, and flows.
- [ ] Define repo-verifiable and live/human success checks.
- [ ] Record risky surfaces, constraints, assumptions, and open questions.
- [ ] Review the spec for sliceability and fix gaps.

## Spec Review
- [pass/blocker/warning] - [scope, rules, checks, risks, or missing decisions]

## Exit Evidence
- [Why this spec can be sliced without guessing.]
```

Do focused research before or during spec when current docs, codebase precedent,
domain pitfalls, or architecture tradeoffs can change the decision. Use primary
sources for unstable or external facts.

Before calling the spec ready, check it against the research discipline,
dependency discipline when packages or setup are involved, and code quality
checklist. The spec should name the expected code organization,
architecture boundaries, risky shared surfaces, and blast radius where those
choices matter. If the repo is greenfield, be more explicit: the first structure
will anchor future agents and should be clean from slice one.

Before moving from spec to slices, do a quick spec review. Check that scope,
non-goals, success checks, domain language, data/state rules, permissions,
failure paths, research implications, and code organization are clear enough to
slice without guessing. Fix obvious gaps in the spec; ask only for decisions
that would change the product or risk.
