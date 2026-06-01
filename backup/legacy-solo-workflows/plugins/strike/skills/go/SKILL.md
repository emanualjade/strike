---
name: go
description: Inspect Strike board state and recommend the next explicit workflow step.
argument-hint: "[project-slug] [verbose]"
disable-model-invocation: true
allowed-tools: Read Bash Grep Glob
---

# Go

## Communication

When speaking to the user or asking questions, use relaxed, friendly language,
like two friends talking through the work over coffee. Explain things in simple
terms without assumptions, guide with context, and simplify concepts so the
conversation feels easy to follow. Keep the conversation centered on the work
in progress; avoid explaining Strike mechanics unless that context helps the
user decide what to do next.

## Purpose

Show where a Strike project card is on the board and recommend one next
action. This is intentionally read-only.

## Host Invocation

Use the plugin package's `references/invocation.md` when showing next actions.
The routing examples below use Strike's canonical handoff form. Render them for
the current host instead of assuming `/strike:*` is always valid. When the host
is unknown, show the skill name and arguments as a plain next action without raw
field labels.

## Read Order

1. List `docs/strike/board/*/*.md`.
2. Resolve the requested project by pointer filename, card folder name, or card
   title. If no argument is given and more than one active card exists, ask the
   user to choose.
3. Read the pointer and linked `cards/<project-slug>/card.md`.
4. Read only the current lane's likely output folder if it exists.

## Routing

Use the board lane as workflow state:

- `01-brainstorm` -> show:
  ```txt
  Reset context first: yes
  Next Strike skill: brainstorm
  Arguments: <project-slug>
  ```
- `02-grill` -> show:
  ```txt
  Reset context first: yes
  Next Strike skill: grill
  Arguments: <project-slug>
  ```
- `03-research` -> show:
  Research is optional before spec, even when recommended. If the card is in
  `03-research`, a prior stage decided focused evidence or guidance would help.
  Show both the recommended research action and the optional spec path:
  Recommended:
  ```txt
  Reset context first: yes
  Next Strike skill: research
  Arguments: <project-slug>
  ```
  Or skip research and go straight to creating the spec:
  ```txt
  Reset context first: yes
  Next Strike skill: research
  Arguments: <project-slug> skip
  ```
- `04-spec` -> show:
  Spec is the recommended next action. Also show research as an optional
  pre-spec pass if the user wants more evidence or guidance before writing the
  spec:
  ```txt
  Reset context first: yes
  Next Strike skill: spec
  Arguments: <project-slug>
  ```
  Optional before spec:
  ```txt
  Reset context first: yes
  Next Strike skill: research
  Arguments: <project-slug>
  ```
- `05-slice` -> show:
  Spec review is optional before slicing. Show both the optional quality pass
  and the direct slice path:
  Optional spec review before slicing:
  ```txt
  Reset context first: yes
  Next Strike skill: spec-review
  Arguments: <project-slug>
  ```
  Or skip spec review and create vertical phases:
  ```txt
  Reset context first: yes
  Next Strike skill: slice
  Arguments: <project-slug>
  ```
- `06-implementation` -> inspect the card and phase folders:
  - card has unchecked readiness-fix items assigned to a phase -> show the
    first affected phase fix handoff:
    ```txt
    Reset context first: yes
    Next Strike skill: phase-fix
    Arguments: <project-slug> phase:<phase-slug>
    ```
  - card has unchecked readiness-fix items that are not assigned to a phase ->
    report that the fixes need a phase assignment before repair and ask which
    phase should own the first fix. Do not guess a repair handoff.
  - phase has `plan.md`, `research.md`, and no `build-brief.md` -> say phase
    research exists, recommend phase-plan, and show rerun research only as an
    optional refresh:
    ```txt
    Reset context first: yes
    Next Strike skill: phase-plan
    Arguments: <project-slug> phase:<phase-slug>
    ```
    Optional rerun phase research:
    ```txt
    Reset context first: yes
    Next Strike skill: phase-research
    Arguments: <project-slug> phase:<phase-slug>
    ```
  - phase has `plan.md` and no `research.md` or `build-brief.md` -> show
    optional phase research and the direct phase-plan path:
    Optional phase research:
    ```txt
    Reset context first: yes
    Next Strike skill: phase-research
    Arguments: <project-slug> phase:<phase-slug>
    ```
    Or create the build brief:
    ```txt
    Reset context first: yes
    Next Strike skill: phase-plan
    Arguments: <project-slug> phase:<phase-slug>
    ```
  - phase has `build-brief.md` and no `build.md` -> show:
    ```txt
    Reset context first: yes
    Next Strike skill: phase-build
    Arguments: <project-slug> phase:<phase-slug>
    ```
  - phase has `build.md` and no `review.md` -> show:
    ```txt
    Reset context first: yes
    Next Strike skill: phase-review
    Arguments: <project-slug> phase:<phase-slug>
    ```
  - phase has `review.md` with blocking fix checkboxes and no `fix.md` -> show
    the review's next action in plain language, normally:
    ```txt
    Reset context first: yes
    Next Strike skill: phase-fix
    Arguments: <project-slug> phase:<phase-slug>
    ```
  - phase has `review.md` with blocking fix checkboxes and `fix.md` -> show:
    ```txt
    Reset context first: yes
    Next Strike skill: phase-review
    Arguments: <project-slug> phase:<phase-slug>
    ```
  - every listed phase has a clean review but the pointer is still here ->
    report the inconsistency and recommend rerunning:
    ```txt
    Reset context first: yes
    Next Strike skill: phase-review
    Arguments: <project-slug> phase:<last-phase-slug>
    ```
- `07-readiness` -> readiness review:
  ```txt
  Reset context first: yes
  Next Strike skill: readiness-review
  Arguments: <project-slug>
  ```
- `08-retro` -> retro.
  ```txt
  Reset context first: yes
  Next Strike skill: retro
  Arguments: <project-slug>
  ```
- `09-done` -> no next handoff.
- `blocked` -> print the unchecked blocker items from `card.md`.

Do not derive state from mtimes, separate indexes, fenced metadata blocks, or a
status field inside `card.md`.

## Output

Keep the response short and user-facing:

- resolved card and lane
- visible unchecked checklist items
- one recommended next action, rendered for the current host using
  `references/invocation.md`
- in `03-research`, also show the skip-research handoff that moves to spec
- in `04-spec`, also show optional research before spec
- in `05-slice`, also show optional spec review before slice and the direct
  slice handoff if the user wants to skip review
- in `06-implementation`, when a phase has `plan.md` but no `build-brief.md`,
  show optional phase research plus phase-plan; if `research.md` already exists,
  recommend phase-plan first and make research a rerun option

If a future or optional Strike skill referenced by a card is missing, say so plainly
and point to the plugin package's bundled `references/stage-contracts.md` as
the manual contract.

## Gates

- Do not write files.
- Do not move board pointers.
- Stay scoped to Strike board/card artifacts and the lane-specific evidence
  checks described above.
