# Built Slice Common Issues Audit

Use this read-only audit when `verify-slice-build` runs SUBAGENT:
`built-slice-common-issues-audit`.

Review changed code for recurring slice-level failure patterns. Check proper use
of existing types, error handling integrity, ephemeral React UI/action state
isolation, form architecture, post-submit data consistency, and design-system
component reuse.

## Checks

- proper use of types: use the strongest existing type source before inventing
  local shapes. Prefer package-exported types, SDK error classes/enums/status
  fields, Prisma generated types, and Zod-inferred types when they already
  describe the data. Flag avoidable `any`, unsafe casts, duplicated ad hoc
  objects, made-up package error shapes, or local types that hide real
  schema/API/model mismatches.
- error handling integrity: when the slice touches errors, API responses,
  provider results, validation, retries, filtering/blocking, or user-facing
  failure states, inspect the relevant package/SDK/ORM validation error types
  before accepting local error handling. Use exported error classes, enums,
  status/code fields, response error fields, Prisma structured error types, and
  Zod error types where available. Flag made-up error objects, guessed
  `{ code/status/message }` shapes, brittle `.message.includes` or regex checks,
  incomplete finite outcome handling, unread blocked/filtered/error response
  fields, or useful user-facing messages swallowed by generic fallbacks. Only
  flag type/error issues when a better typed contract actually exists or the
  changed code creates a real correctness risk; Prisma documented error codes
  such as `P2002` are acceptable when used through Prisma's structured error
  type.
- ephemeral UI/action state isolation: when the slice touches React UI, check
  that mutation, pending, saving, success, delete, create, and form-submission
  state lives at the lowest self-contained unit of work. Flag shared parent
  `useMutation` instances, parent-owned `isSaving/isPending` flags, parent
  delete dialogs/mutations, or create/navigate callbacks passed to independent
  children when they can be owned by the button/card/list item itself. The smell
  is user-visible bleed: clicking action A disables, spins, or changes unrelated
  action B. Read-only query state, layout orchestration, pure UI state such as
  tabs/modals/view mode, and genuinely shared multi-step flows are not this
  issue.
- form architecture and submission state: when the slice touches forms, check
  that the repo's established form pattern is used. Prefer `react-hook-form`
  when the repo uses it for comparable forms, especially with validation, dirty
  state, reset, errors, or async submission. Flag ad hoc `useState` form
  handling when it bypasses an established `react-hook-form` pattern without a
  clear reason.
- post-submit data consistency: when a form or mutation changes
  persisted/server-backed data, check that cache invalidation, cache update,
  refetch, optimistic update, router refresh, or local state reconciliation is
  intentional and matches repo patterns. Flag submissions that appear successful
  but leave stale UI, duplicate rows, missing new data, or inconsistent related
  views.
- design-system component reuse: when the slice touches UI, check that existing
  shadcn/ui or repo design-system components are used where they already fit.
  Flag custom buttons, dialogs, inputs, selects, menus, tables, cards, toasts, or
  form controls that recreate existing components without a clear reason.

## Output

Follow `references/review-agents/output-discipline.md`.
