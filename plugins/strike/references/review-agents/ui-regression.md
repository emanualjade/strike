# UI Regression Review

Use this read-only audit when a verifier launches SUBAGENT: `ui-regression`.

Use this lens when the slice touches UI structure, HTML, CSS, components,
layout, responsive behavior, browser-visible states, or design-system usage.

## Checks

- layout and responsive behavior: check that changed UI fits desktop and mobile
  constraints, avoids overlap, preserves stable dimensions, and handles loading,
  empty, success, error, disabled, and recovery states.
- design-system fit: check that existing components, tokens, shadcn/ui, icons,
  forms, dialogs, menus, tables, cards, toasts, and controls are reused when
  appropriate instead of custom recreations.
- state isolation: check that ephemeral mutation/loading/success/error state is
  owned by the lowest self-contained unit of work and does not bleed into
  unrelated controls.
- visual evidence plan/proof: for plan verification, check that visual evidence
  is planned for browser-visible changes. For build verification, check that
  screenshots show the actual changed state after representative interaction.
- regression surface: check adjacent views/components/routes likely to be
  affected by shared styles, component props, state, or data changes.

## Output

Follow `references/review-agents/output-discipline.md`.
