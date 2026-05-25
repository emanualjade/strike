# Grill

Pressure-test the idea until the important decisions are clear enough to write a
spec. Ask only for decisions that matter.

Default path:

- `auto-strike/features/<feature-slug>/grill.md`

Good grill areas:

- affected user/system/workflow and success
- scope, non-goals, and first useful outcome
- domain language and overloaded terms
- core nouns, relationships, and model shape
- flows, lifecycle, state, and invariants
- permissions, ownership, privacy, and data integrity
- integrations, external side effects, and failure cases
- UI/API/CLI behavior when relevant
- validation evidence

When naming models or concepts, prefer the core noun before qualifiers. If the
language starts creating sibling nouns like `ManualReport` and
`ScheduledReport`, ask whether the qualifier is better as a field, enum, state,
permission, relationship, configuration, placement, ownership, or usage context.

Update `language.md` and `decisions.md` as decisions crystallize. Do not keep
contradictory history unless it explains the current choice.

Use `grill.md` as the grill work packet:

```md
# [Feature/MVP] Grill

## Phase Tasks
- [ ] Review the brainstorm handoff and repo context.
- [ ] Identify consequential product/domain/data/workflow decisions.
- [ ] Ask or answer only decisions that change product behavior or risk.
- [ ] Update `language.md` and `decisions.md` with current truth.
- [ ] Record exit evidence and handoff to spec.

## Pressure Points
- Scope:
- Domain language:
- Models/relationships:
- Flows/states:
- Permissions/ownership:
- Data integrity/privacy:
- Integrations/failures:
- Validation evidence:

## Open Questions
- [Question] - [why it matters / recommendation]

## Decisions Made
- [Decision] - [where recorded]

## Exit Evidence
- [Why the feature is clear enough to spec without guessing.]

## Handoff To Spec
- [Rules, constraints, flows, and risks the spec must preserve.]
```

Exit when consequential product, domain, workflow, permission, data,
integration, and success-check decisions are clear enough to spec without
guessing. If no user question is needed, record why repo context or the user's
input already answered the consequential decisions.
