# Strike Board Model

## Source Of Truth

The source of truth for a feature's workflow state is structural:

```txt
docs/strike/board/<lane>/<feature-slug>.md
```

There should be exactly one board pointer file for an active feature. The card
itself should not store a second status field.

A visible `Run kind` note on the card can say `dogfood`, `shippable`, or
undecided. That is context for humans and fresh agents, not workflow state.

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

Use a normal filesystem move, not `git mv`. During dogfooding these board
pointers may be untracked, and the workflow should not depend on git index
state to move a card.

After moving, verify exactly one pointer exists for the slug:

```txt
find docs/strike/board -mindepth 2 -maxdepth 2 -type f -name '<feature-slug>.md'
```

Do not move `cards/<feature-slug>/`. Stable card paths keep artifact links
boring.

## Card Folder

`card.md` is the feature's working surface:

- a short feature description
- the current working checklist
- open questions
- constraints and decisions in prose
- links to stage outputs and phases

Stage outputs and planning demos live near the card:

```txt
cards/<feature-slug>/outputs/brainstorm/
cards/<feature-slug>/outputs/grill/
cards/<feature-slug>/outputs/research/
cards/<feature-slug>/outputs/spec/
cards/<feature-slug>/outputs/acceptance/
cards/<feature-slug>/outputs/retro/
cards/<feature-slug>/demos/
```

Implementation phases live here:

```txt
cards/<feature-slug>/phases/<phase-slug>/
```

The `slice` skill is the feature-level act of cutting the work into vertical
implementation phases. The phase folder keeps the small plan, build brief,
build evidence, review, and any optional phase research or fix notes local to
that phase:

```txt
cards/<feature-slug>/phases/<phase-slug>/plan.md
cards/<feature-slug>/phases/<phase-slug>/research.md
cards/<feature-slug>/phases/<phase-slug>/build-brief.md
cards/<feature-slug>/phases/<phase-slug>/build.md
cards/<feature-slug>/phases/<phase-slug>/review.md
cards/<feature-slug>/phases/<phase-slug>/fix.md
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
English checkbox. If that becomes unreliable in real dogfooding, add the
smallest local naming convention then, not before.

## Blocked Work

Blocked work moves to `board/blocked/`. The unresolved work should be visible
as unchecked items in `card.md`, not hidden in the pointer.

When the blocker is resolved, move the pointer back to the lane where work
should resume.
