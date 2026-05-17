# Changelog

All notable changes to Strike will be recorded here.

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
