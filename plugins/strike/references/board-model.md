# Strike Board Model

## Source Of Truth

The source of truth for a project's workflow state is structural:

```txt
docs/strike/board/<lane>/<project-slug>.md
```

Project, phase, and demo names that become file or folder paths must follow
`references/slug-policy.md` and use the bundled slug helper rather than
hand-rolled naming rules.

There should be exactly one board pointer file for an active project. The card
itself should not store a second status field.

## Pointer Shape

Pointer files are intentionally tiny Markdown documents:

```md
# Image Generator

Card: ../../cards/image-generator/card.md

Current intent: Sharpen the fuzzy idea enough for decision-tree grilling.
```

The pointer file can include a short human note, but it should not accumulate
stage output. Stage output belongs in the card folder.

## Moving A Card

Move the pointer file between lanes:

```txt
docs/strike/board/01-brainstorm/image-generator.md
docs/strike/board/02-grill/image-generator.md
```

Use a normal filesystem move, not `git mv`. Board pointers may be untracked,
and the workflow should not depend on git index state to move a card.

After moving, verify exactly one pointer exists for the slug:

```txt
find docs/strike/board -mindepth 2 -maxdepth 2 -type f -name '<project-slug>.md'
```

Do not move `cards/<project-slug>/`. Stable card paths keep artifact links
boring.

## Card Folder

`card.md` is the project's working surface:

- a short project description
- the current working checklist
- open questions
- constraints and decisions in prose
- links to stage outputs and phases

Stage outputs and planning demos live near the card:

```txt
cards/<project-slug>/outputs/brainstorm/
cards/<project-slug>/outputs/grill/
cards/<project-slug>/outputs/research/
cards/<project-slug>/outputs/spec/
cards/<project-slug>/outputs/acceptance/
cards/<project-slug>/outputs/retro/
cards/<project-slug>/demos/
```

Implementation phases live here:

```txt
cards/<project-slug>/phases/<phase-slug>/
```

The `slice` skill is the Project-level act of cutting the work into vertical
implementation phases. The phase folder keeps the small plan, build brief,
build evidence, review, and any optional phase research or fix notes local to
that phase:

```txt
cards/<project-slug>/phases/<phase-slug>/plan.md
cards/<project-slug>/phases/<phase-slug>/research.md
cards/<project-slug>/phases/<phase-slug>/build-brief.md
cards/<project-slug>/phases/<phase-slug>/build.md
cards/<project-slug>/phases/<phase-slug>/review.md
cards/<project-slug>/phases/<phase-slug>/fix.md
```

`research.md` and `fix.md` are optional. They appear only when phase research
runs or phase review finds blocking work.

## No IDs By Default

Use prose headings and checkboxes before IDs.

Good:

```md
## Blocking Fixes

- [ ] The gallery does not refresh after deleting an image.
- [ ] Failed uploads show a raw storage error.
```

Avoid structured routing rows until a real ambiguity proves they are needed.

If a future stage needs to reference a prior item, quote or link the plain
English checkbox. If that becomes unreliable in practice, add the smallest
local naming convention then, not before.

## Blocked Work

Blocked work moves to `board/blocked/`. The unresolved work should be visible
as unchecked items in `card.md`, not hidden in the pointer.

When the blocker is resolved, move the pointer back to the lane where work
should resume.
