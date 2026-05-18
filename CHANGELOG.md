# Changelog

All notable changes to Strike will be recorded here.

## 0.1.4 - 2026-05-17

- Added a shared deterministic slug helper for feature slugs, phase folders,
  and demo filenames.
- Refactored `start` to use the shared helper while preserving card and board
  pointer behavior.
- Documented the shared slug policy and updated slice/demo guidance to call the
  helper instead of hand-rolling filename rules.
- Added focused tests for the shared slug helper and kept start-card integration
  coverage.

## 0.1.3 - 2026-05-17

- Made `start` generate shorter command-friendly slugs by dropping common
  leading task verbs and capping generated paths at 48 characters.
- Allowed unquoted multi-word feature names and descriptions in the start
  helper script.
- Deduplicated explicit `--slug` values the same way generated slugs are
  deduplicated.
- Treated flag-like words such as `--dry-run` as feature/description text when
  they appear inside the natural-language start input.
- Included existing board pointers in start-card slug collision checks.
- Added focused tests for start-card slugging, dedupe, and text normalization.

## 0.1.2 - 2026-05-17

- Cleaned up stage skill output guidance so follow-up prompts are shown as
  user-facing next actions instead of internal handoff fields.
- Added validation that prevents raw handoff fields from returning to skill
  `## Output` sections.

## 0.1.1 - 2026-05-17

- Tightened the `start` skill's user-facing output so it shows the created
  card, board pointer, and next prompt without exposing internal handoff fields.
- Updated shared invocation guidance so Strike skills translate canonical
  handoffs into concise host-specific next actions.

## 0.1.0 - 2026-05-17

- Imported the production Strike skill set into `plugins/strike`.
- Added Codex, Claude Code, and GitHub Copilot CLI plugin manifests.
- Added Codex, Claude Code, and GitHub Copilot CLI marketplace entries.
- Added MIT licensing and repo validation for cross-agent release hygiene.
- Kept `0.1.0` as the first private testing release version.
- Verified the available local, Git-backed, and Claude host smoke checks.
