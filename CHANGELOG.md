# Changelog

All notable changes to Strike will be recorded here.

## 0.8.5 - 2026-05-25

- Added Auto Strike `review-plan` to recommend review lenses from active
  `Changed:` evidence.
- Added `implementation-plan`, `ui-regression`, and `state-data-integrity`
  review lenses for pre-build planning, frontend regressions, and state/data
  integrity risks.
- Added validation warnings for weak pre-build slice prep, missing required
  review lens evidence, UI work without visual/static UI review evidence, and
  drift between active `Changed:` evidence and the Git worktree.
- Updated Auto Strike workflow docs to require slice execution research,
  concrete implementation plans, critical plan review, `Reviewed:` evidence, and
  explicit skipped-review rationales before trusting a slice.

## 0.8.4 - 2026-05-25

- Scoped Auto Strike `review-context` evidence to the active slice first, then
  the active feature, and only falls back to workspace-wide evidence when needed.
- Grouped review packet source paths into active docs, changed files, workspace
  docs, and context docs so reviewers can prioritize implementation changes.
- Added review-readiness warnings when active evidence lacks `Changed:` or
  `Verified:` sections.
- Added multi-feature tests that prevent stale feature evidence from leaking
  into active review packets.

## 0.8.3 - 2026-05-24

- Improved Auto Strike review packets so `review-context` includes changed
  implementation files parsed from slice evidence `Changed:` sections.
- Added tests that verify changed-path extraction and review packet source
  paths for focused reviewer agents.

## 0.8.2 - 2026-05-24

- Added a read-only `auto-strike` workspace helper with `inspect`, `validate`,
  and `review-context` commands for agent-internal workspace auditing.
- Added fixture tests for absent workspaces, unrelated folder collisions, Tiny
  Path flexibility, Fast/Large Path evidence, repo-level key docs, and review
  context packets.
- Documented the helper as an optional guardrail that does not create features,
  slices, planning docs, next actions, or workflow state.

## 0.8.1 - 2026-05-24

- Hardened `auto-strike` for greenfield and thin repositories by requiring
  stack discovery, explicit dependency approval, and a no-install fallback path.
- Added collision handling for pre-existing root `auto-strike/` directories
  before the skill writes workspace state.
- Strengthened `auto-strike` review guidance so multiple review agents can run
  in parallel with distinct lenses and return findings to the main agent for
  synthesis and evaluation.

## 0.8.0 - 2026-05-24

- Added the user-invoked `auto-strike` utility skill for moving a fuzzy idea
  toward a working MVP with a standalone root `auto-strike/` workspace.
- Kept `auto-strike` independent from the normal Strike board/card workflow.

## 0.7.0 - 2026-05-19

- Renamed the final `accept` workflow step to `readiness-review` with no
  compatibility alias.
- Renamed the final board lane and output artifact to `07-readiness` and
  `outputs/readiness/readiness.md`.
- Added customization support for `spec-review`, `slice-review`,
  `phase-review`, and `readiness-review`.
- Added optional read-only review lens files under each review skill's
  `reviews/*.md` directory.

## 0.6.1 - 2026-05-19

- Added single-file customization support for `phase-build`, `phase-fix`, and
  `accept`.
- Extended `init`, `customize list`, `check-setup`, `review-instructions`, and
  `preview` coverage to those entries without changing the runtime packet
  format.
- Clarified that rerunning `init` refreshes repo-local managed runtime files
  after Strike updates.

## 0.6.0 - 2026-05-19

- Added the `init` setup skill for first-run Strike repository initialization.
- Split customization state into Strike-managed runtime files under
  `strike/customize/system/` and user-owned files under
  `strike/customize/user/`.
- Changed supported workflow skills to require the repo-local loader at
  `strike/customize/system/customize.mjs` before material work.
- Removed user-facing `customize init`; the `customize` utility now focuses on
  `list`, `check-setup`, `review-instructions <entry|all>`, and diagnostic
  `preview <skill>`.
- Renamed customization utility modes from `check`, `review <entry|all>`, and
  `load <skill>` to `check-setup`, `review-instructions <entry|all>`, and
  `preview <skill>`.
- Moved setup into `plugins/strike/skills/init/scripts/init.mjs` so
  `customize.mjs` is only the repo-local runtime and inspection tool.

## 0.5.1 - 2026-05-19

- Clarified host-specific Strike invocation guidance for Codex app, Codex CLI,
  Claude Code, and GitHub Copilot CLI.
- Updated the shared invocation reference to distinguish Codex app `$`/`@`
  selection from Codex CLI `/skills` and `/clear` behavior.
- Fixed stale customization notes so the implemented `customize review
  <entry|all>` command is listed with the current utility modes.
- Slimmed runtime customization loading so `customize load <skill>` is silent
  when no customization is present, emits a lean packet when customization
  exists, and uses a short warning-only message for oversized skipped files.

## 0.5.0 - 2026-05-19

- Moved `customize` command wording into Markdown templates under
  `plugins/strike/references/customization/messages/`.
- Moved customization entry-point details and skill-specific load meanings into
  `plugins/strike/references/customization/entry-points.json`.
- Moved generated `how-to-customize-*.md` wording into
  `plugins/strike/references/customization/templates/how-to.md`.
- Moved the maintainer-facing customization explanation out of shipped plugin
  references to `docs/customization-reference.md`.
- Added validation to keep `plugins/strike/references/` limited to explicit
  runtime-loaded assets.
- Reworked customization guidance for extra docs/assets so Strike asks when the
  destination or per-project/shared intent is unclear and recommends
  `strike/user-docs/...` paths instead of old per-card custom folders.
- Made `customize load <skill>` print a short status message instead of the full
  packet when no repo-local customization is present.

## 0.4.2 - 2026-05-18

- Clarified `customize init` next steps so `check` is described as setup health
  validation and `review` is described as workflow safety review.
- Added skill guidance to avoid calling customization review "linting" or
  customization check "layout" validation.

## 0.4.1 - 2026-05-18

- Hardened `customize review` packets by emitting customization content as JSON
  data records instead of raw Markdown fences.
- Made `customize check` fail when expected customization entry directories are
  blocked by files.
- Hid the internal `review-packet` mode from public script help while keeping it
  available to the `customize` skill.

## 0.4.0 - 2026-05-18

- Added `customize review <entry|all>` for LLM semantic review of repo-local
  customization language.
- Added an internal `review-packet` mode so customization file discovery stays
  deterministic while language safety is judged by the active agent.
- Reframed `customize check` as setup-only validation for paths and size limits.

## 0.3.0 - 2026-05-18

- Moved repo-local customization from `docs/strike/customize/` to
  `strike/customize/`.
- Changed generated customization files to start blank and moved guidance into
  sidecar `how-to-customize-*.md` files.
- Moved global customization to `strike/customize/global/global.md`.
- Hardened `customize init` so existing `strike/` content is preserved and
  blocked paths fail clearly.
- Relaxed `customize check` so extra user notes under `strike/customize/` are
  allowed and ignored by the loader.

## 0.2.1 - 2026-05-18

- Clarified the `customize` skill description so host command pickers show the
  supported `init`, `list`, `check`, and `load <skill-name>` inputs.
- Tightened the customization usage docs with shorter guidance on initializing,
  editing, and checking repo-local preferences.

## 0.2.0 - 2026-05-18

- Added the `customize` utility skill for initializing, listing, checking, and
  inspecting repo-local customization files.
- Added a deterministic customization loader for selected single-file skills.
- Wired `brainstorm`, `grill`, `research`, `spec`, `slice`,
  `phase-research`, `phase-plan`, `retro`, `demo`, and `language` to load
  framed repo-local customization packets before material work.
- Documented the customization rollout and updated tests, manifests, and
  marketplaces for the `0.2.0` release.

## 0.1.16 - 2026-05-18

- Normalized shipped skill `allowed-tools` frontmatter to the portable
  Agent Skills space-separated form.
- Added validation to reject comma-separated `allowed-tools` values.

## 0.1.15 - 2026-05-18

- Renamed Strike's top-level work unit to Project across shipped
  skills, docs, prompts, manifests, and generated starter card text.
- Updated the shared slug helper and tests to use project slug wording.
- Reworded repo-root guidance so Projects are not confused with repositories.

## 0.1.14 - 2026-05-18

- Updated plugin, marketplace, and license owner metadata to Emanual Jade.

## 0.1.13 - 2026-05-18

- Completed a shipped-skill-by-shipped-skill portability pass.
- Broadened remaining product-only planning, research, review, fix, and retro
  wording to include technical, workflow, and domain decisions where relevant.
- Renamed the remaining spec template success-check heading from
  code-verifiable to repo-verifiable.

## 0.1.12 - 2026-05-18

- Simplified maintainer docs and package guidance around the current portable
  package.
- Updated generated starter cards to describe product, technical, or workflow
  direction.

## 0.1.11 - 2026-05-17

- Broadened brainstorm, grill, spec, and stage-contract guidance so early
  planning can frame product, technical, workflow, maintainer/operator, and
  downstream-system work.
- Kept product and UI examples where useful while adding repo/workflow-oriented
  prompts and template language.

## 0.1.10 - 2026-05-17

- Broadened research, spec, demo, and acceptance examples to include CLI, API,
  config, generated artifact, docs, data, and tooling evidence alongside UI/web
  examples.
- Renamed success-check guidance from code-verifiable to repo-verifiable.

## 0.1.9 - 2026-05-17

- Replaced product-specific language and modeling examples with neutral repo
  examples.
- Generalized access-boundary wording in research and spec guidance.

## 0.1.8 - 2026-05-17

- Generalized skill and stage wording from app-specific surfaces to
  implementation, source, test, and documentation files.
- Updated local run guidance so UI checks do not imply every repository is a web
  app.

## 0.1.7 - 2026-05-17

- Simplified acceptance, routing, board, and stage guidance around one workflow
  path from implementation through retro.
- Added a neutral acceptance argument gate so invalid extra arguments stop
  before writing acceptance evidence.

## 0.1.6 - 2026-05-17

- Clarified the user-facing `start` options and kept edge-case parsing guidance
  in the skill instructions instead of the README.

## 0.1.5 - 2026-05-17

- Quieted `brainstorm` progress guidance so routine board/card/context reads
  are not narrated as user-facing updates.

## 0.1.4 - 2026-05-17

- Added a shared deterministic slug helper for project slugs, phase folders,
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
- Allowed unquoted multi-word project names and descriptions in the start
  helper script.
- Deduplicated explicit `--slug` values the same way generated slugs are
  deduplicated.
- Treated flag-like words such as `--dry-run` as project/description text when
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
