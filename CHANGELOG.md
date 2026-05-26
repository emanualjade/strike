# Changelog

All notable changes to Strike will be recorded here.

## 0.8.16 - 2026-05-25

- Strengthened Auto Strike phase boundaries so brainstorm, grill, spec, slice,
  and build are not collapsed into one pass; completed phases should stop with
  a receipt and next action unless the user explicitly skips the boundary.
- Tightened spec and slice guidance so specs cannot include numbered slice
  lists or future slice-file links, and slice planning records review plus exit
  evidence before build starts.
- Added helper warnings for over-detailed Slice Handoffs, missing spec review or
  exit evidence before slicing/building, missing slice review or exit evidence
  before build, and missing grill decision depth after later phases begin.

## 0.8.15 - 2026-05-25

- Tightened Auto Strike dependency guidance so pnpm-only repos must use
  `pnpm view` or official docs/registry pages even for read-only package
  metadata checks; agents should not use `npm` or `npx` as a shortcut.
- Added helper warnings for duplicate Active Work fields and duplicate Phase
  Ledger rows, while resolving the most useful non-placeholder state so later
  checks can still run.
- Improved slice validation so oversized slice warnings still fire when active
  state is dirty, and clarified that `M` slices should not hide `L/XL` signals.

## 0.8.14 - 2026-05-25

- Tightened Auto Strike phase boundaries so spec mode can write specs and a
  concise Slice Handoff, but not create Slice Maps or slice files before spec
  exit evidence.
- Added helper warnings when detailed slice planning appears inside spec docs,
  or when slice artifacts exist while spec is still in progress.

## 0.8.13 - 2026-05-25

- Clarified Auto Strike invocation-reference resolution so agents use the
  plugin-root `references/invocation.md` file instead of looking under the
  skill-local references folder.
- Added a small skill-local invocation pointer as a fallback for hosts or agents
  that resolve reference paths from the skill folder first.

## 0.8.12 - 2026-05-25

- Clarified Auto Strike question handling so failed or unavailable host question
  tooling must fall back to a plain-text user question and stop, rather than
  being treated as permission to accept defaults or proceed.
- Added helper warnings when brainstorm or grill phases are completed,
  compressed, or skipped after a question-tool failure.

## 0.8.11 - 2026-05-25

- Tightened Auto Strike phase commitment so meaningful feature/MVP work must
  run brainstorm and grill with the user unless the user explicitly opts out,
  asks to move along, or prior artifacts already answer the phase.
- Clarified that the kickoff prompt is source material, not a finished spec;
  vague terms like "small", "simple", "MVP", and "real workflow" must become
  explicit constraints before scope, stack, dependency, persistence, identity,
  or feature-split choices are hardened.
- Added grill Decision Checkpoint guidance plus helper warnings when spec,
  slice, or build work appears without `grill.md` or without a substantive
  checkpoint covering hardening decisions.

## 0.8.10 - 2026-05-25

- Tightened Auto Strike validation after dogfood so implementation evidence now
  warns when `index.md` still points at early phases, missing active
  feature/slice pointers, stale open decisions, or "no code written".
- Added helper warnings for missing referenced Auto Strike docs, stale slice
  task/checkpoint checklists after build evidence, and curl/localhost checks
  being mistaken for browser/user-flow evidence.
- Clarified build closeout guidance so agents do not leave long-running local
  servers blocking the final response, and added runtime-version guidance for
  built-in platform APIs such as `node:sqlite`.

## 0.8.9 - 2026-05-25

- Added an Auto Strike initiative Phase Ledger so brainstorm, grill, spec,
  slice, build, review, and validation are visibly done, compressed, skipped, or
  pending instead of silently blurred.
- Added helper warnings for later-phase work that lacks a substantive Phase
  Ledger, plus tests for missing, weak, and accepted ledger examples.
- Required root `language.md` plus per-initiative `decisions.md` and `spec.md`
  as mandatory current-truth docs, with helper warnings and tests for missing or
  weak artifacts.
- Strengthened Auto Strike review expectations so completed meaningful slice
  reviews need fresh read-only reviewer evidence or an explicit unavailable-host
  rationale, not only main-agent self-review.
- Tightened blocked browser/user-flow fallback evidence so skipped browser
  checks must name the host/manual option checked, blocker, replacement
  evidence, and residual risk.

## 0.8.8 - 2026-05-25

- Added Auto Strike slice closeout summary guidance so completed slices end with
  a compact user-facing receipt covering built work, validation, review status,
  skipped/residual risk, docs, and next action.
- Added helper warnings when active completed slice evidence has Changed,
  Verified, and Reviewed entries but no substantive `Closeout Summary`.
- Tightened Auto Strike grill guidance around one-decision-node-at-a-time
  pressure testing, recommended answers, concise Decision Depth, and helper
  warnings for missing or unknown grill depth.
- Reworked Auto Strike workspace structure around deterministic
  initiative -> feature -> slice directories, with helper parsing, validation,
  review scoping, and tests updated for the new shape.
- Fixed Codex metadata so the standalone `auto-strike` skill is discoverable and
  invocable in dogfood runs, while the smaller Strike workflow skills remain
  manual-only.

## 0.8.7 - 2026-05-25

- Added Auto Strike verification-capability guidance so slices record available
  repo checks, host/manual browser or user-flow options, install constraints,
  blocked checks, replacement evidence, and residual risk before accepting
  skipped verification.
- Added helper warnings when reviewable UI/auth/integration evidence or skipped
  checks lack a concrete verification-capability record.

## 0.8.6 - 2026-05-25

- Removed Tiny/Fast/Full paths as first-class workflow routes. Auto Strike now
  uses one phase workflow with judgment inside each phase.
- Replaced index-level phase ceremony with an artifact-led `Active Work` resume
  pointer. Phase docs now own tasks, decisions, and exit evidence.
- Strengthened review guidance so meaningful, high-risk, or multi-slice work
  uses fresh read-only review agents when supported, with findings returned to
  the main agent for synthesis before fixes.
- Tightened UI/browser review expectations so UI, auth/session, routing, forms,
  responsive layout, and user-visible state changes require browser/user-flow
  evidence or an explicit blocked-browser fallback.
- Clarified that missing repo browser dependencies are not enough to skip
  browser checks when host or manual browser tooling is available.
- Added helper warnings for missing or weak active-work pointers, missing or
  weak active phase docs, multi-slice review evidence without a fresh reviewer,
  and UI changes without browser/user-flow review evidence.
- Added slice sizing, dependency-map, checkpoint, execution-task checklist, and
  non-vertical justification guidance plus helper warnings for oversized or
  batched slice plans.
- Added an explicit feature-decomposition gate before slicing so broad work is
  grouped into feature/milestone folders before slice maps are created.
- Replaced MVP/happy-path done wording with broader production-shaped completion
  criteria for code changes, features, MVPs, plans, specs, research, and review.
- Consolidated duplicated review guidance into `review.md` so reviewer behavior,
  evidence shape, lens selection, and helper packet usage have one source of
  truth.
- Split verification and dependency/install guidance out of `code-quality.md`
  into focused `verification.md` and `dependencies.md` references.
- Shortened the main completion standard and left detailed completion criteria
  in `readiness.md`.
- Condensed the Auto Strike main skill into the routing contract, split detailed
  behavior into phase-specific files, and removed the redundant `flow.md` phase
  map.
- Clarified that phase order is the ideal default workflow, not a mandated
  waterfall, while preserving mode commitment.
- Reframed research guidance as just-in-time source-backed recommendation work
  that keeps momentum unless a real product/risk blocker appears.

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
