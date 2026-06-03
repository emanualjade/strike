# Accessibility Review

Use this read-only audit when a verifier launches SUBAGENT: `accessibility`.

Use this lens when the slice touches meaningful UI interaction, forms,
keyboard/focus behavior, user-facing recovery paths, or browser evidence is
available.

## Checks

- semantics: check labels, headings, landmarks, buttons, links, form fields,
  validation messages, status messages, and accessible names.
- keyboard and focus: check tab order, focus trapping, focus return, visible
  focus, disabled states, escape behavior, and keyboard access to changed
  controls.
- feedback and recovery: check loading, success, error, empty, blocked,
  destructive, and recovery states for understandable text and screen-reader
  visibility.
- visual accessibility: check contrast, target size, motion, responsive layout,
  truncation, text overflow, and non-color-only communication.
- evidence: for plan verification, check that meaningful accessibility evidence
  is planned when UI risk warrants it. For build verification, check the
  available browser/DOM evidence.

## Output

Follow `references/review-agents/output-discipline.md`.
