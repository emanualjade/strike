# Brainstorm

Turn the raw idea into a clearer opportunity. Start with the user, maintainer,
operator, integration, or system moment, then work backward to the technology.
The kickoff prompt is source material, not a finished spec. Separate explicit
facts from assumptions before any stack, package, persistence, auth, or feature
count becomes locked.
Do not skip a proper brainstorm with the user unless the user explicitly says to
skip it, move along, or proceed without questions. If the user already answered
the brainstorm questions, record the explicit answers and keep going.
If a question tool or UI cannot deliver the question, ask in plain text and stop
for the answer. Do not treat tool failure, denial, timeout, or no response as
permission to choose defaults.

Find:

- who or what this is for
- the painful moment, risk, or workflow drag
- the current workaround or failure
- what would make the first version obviously useful
- constraints and first-version non-goals

Explore a few real directions when useful, then converge to a recommendation.
Challenge vague value, broad audiences, and attractive distractions.
Translate vague scope words like "small", "simple", "MVP", "local", or "real
workflow" into explicit first-version constraints and non-goals. If those words
hide consequential product or architecture choices, hand them to grill instead
of privately deciding.

Do light idea research when it can change the first-version target: comparable
workflows, current product expectations, difficult technical dependencies,
content/legal constraints, privacy risk, cost, or whether a key assumption is
obviously false. Save only decision-useful findings.

Save useful output in `auto-strike/initiatives/<initiative-slug>/idea.md` when
the idea is stable enough to preserve. Starting a new Auto Strike request may
create a new initiative. During existing initiative work, update the active
initiative instead of creating another one.

Use `idea.md` as the brainstorm work packet:

```md
# [Initiative] Idea

## Phase Ledger
| Phase | Status | Artifact | Reason |
| --- | --- | --- | --- |
| Brainstorm | in progress | `idea.md` | First useful outcome is being clarified. |
| Grill | pending |  |  |
| Spec | pending |  |  |
| Slice | pending |  |  |
| Build | pending |  |  |
| Review | pending |  |  |
| Validate | pending |  |  |

## Phase Tasks
- [ ] Separate explicit user facts from assumptions or inferred scope.
- [ ] Capture the target user/system moment.
- [ ] Name the painful moment, workaround, or workflow drag.
- [ ] Propose the first useful outcome and first-version non-goals.
- [ ] Note any idea-level research that can change the first-version target.
- [ ] Create or update root `language.md` and initiative `decisions.md` / `spec.md`.
- [ ] Record exit evidence and handoff to grill.

## Current Shape
- Explicit user facts:
- Assumptions / inferred scope:
- Who/what this serves:
- Painful moment:
- First useful outcome:
- Constraints:
- Non-goals:

## Options Considered
- [Direction] - [why use/defer/reject]

## Research Notes
- [Finding] - [decision impact]

## Exit Evidence
- [What is now clear enough to grill.]

## Handoff To Grill
- Suggested grill depth: Lean / Standard / Deep / Unknown.
- Why:
- Questions or decisions grill should pressure-test:
- Feature candidates, if any:
```

Exit when the first useful outcome, target user/system moment, constraints, and
first-version non-goals are clear enough to grill. If the idea is already clear,
record that fact briefly instead of pretending a brainstorm happened.
