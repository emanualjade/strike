# Changelog

All notable changes to Strike will be recorded here.

## 0.10.15 - 2026-06-02

- Split Strike workflow state so root `strike/state.json` is a compact
  initiative index and detailed progress lives in
  `strike/initiatives/<initiative-id>/state.json`.
- Kept helper commands stable while adding v1-to-v2 migration on the next helper
  write, plus compact initiative summaries for list/add/set/finish outputs.
- Made helper reads and writes selective so missing or stale inactive initiative
  detail files do not block active initiative progress or get rewritten by
  unrelated active-scope operations.
- Made root initiative status authoritative, removed lifecycle status from new
  initiative detail files, and validated split-state IDs and detail paths before
  hydrating or writing initiative state.
- Tuned slice sizing language toward small cohesive vertical slices and small
  focused buildable slices, with medium slices now sized around 5-10 likely
  files when the work is cohesive.
- Clarified that completed slice verification returns control to `go`; after the
  slice git checkpoint, `go` should continue to the next slice's `research-slice`
  when `next-step` says it is ready.
- Updated Strike instructions, README, tests, and validation to keep state reads
  focused on the active initiative instead of every historical initiative.

## 0.10.14 - 2026-06-02

- Clarified that phase verification returns control to `go` after
  `allSlicesVerified`; phase boundaries are workflow handoffs, not automatic
  pauses when `next-step` points to the next phase.

## 0.10.13 - 2026-06-02

- Tightened slice-specific and planning-time research so agents start from
  `research/index.md`, relevant initiative research reports, and their audits
  before adding narrower research.
- Required new slice or planning research to use official or primary sources for
  external/current/high-stakes facts and record how it changes, narrows, or
  confirms initiative research.
- Updated the Strike handoff so `research-slice`, `plan-slice`, and
  `verify-slice-plan` receive relevant initiative research reports and audits,
  not just a vague research summary.

## 0.10.12 - 2026-06-02

- Relaxed slice sizing from strict thin-slice file counts to a cohesion-based
  rubric: medium slices may include tightly coupled behavior clusters, larger
  slices require justification, and splitting is driven by independent outcomes,
  weak cohesion, or unclear verification.
- Updated slice planning and plan verification to allow broader UI/API/data/test
  work when it belongs to one verifiable behavior flow, while still routing back
  slices that bundle unrelated work.

## 0.10.11 - 2026-06-02

- Added a mandatory `Decision Review` gate to Grill before
  `decisionsResolved` can complete.
- Required `decisions.md` to record a passing or accepted-risk decision review
  with `Must Fix count: 0`, so blind spots, unsupported assumptions, unresolved
  decision nodes, and spec-blocking ambiguity are checked before Main Spec.

## 0.10.10 - 2026-06-02

- Added a mandatory per-item research audit loop inside `research-initiative`.
- Required each approved initiative research item to have a non-empty audit file
  under `research/audits/` before `Ready for grill: yes`.
- Updated the state helper, host smoke test, and validation checks so
  `initiativeResearchComplete` requires passing or accepted-risk audits with no
  unresolved Must Fix findings.
- Updated Grill with a simple decision-tree core loop: facts are resolved by the
  agent, tradeoffs get recommendations, user choices are asked one at a time,
  and new consequential branches keep the loop going.

## 0.10.9 - 2026-06-02

- Added a mandatory pre-grill `research-initiative` workflow gate between idea
  refinement and grilling.
- Added initiative research artifacts under `research/`: a user-approved
  `scope.md`, one concise report per approved topic, and a rollup `index.md`
  with `Ready for grill`.
- Updated the state helper to require a research scope user checkpoint and a
  ready research index with a non-empty report file for every approved research
  item before the workflow can advance to Grill.
- Added workflow normalization and `sync-helper` so existing Strike workspaces
  refresh copied helpers and receive new workflow gates after plugin updates.
- Updated Grill, Main Spec, phase, slice research, and slice planning guidance
  so provider/model/API, database/schema, file/blob, queue/job, auth/payment,
  and repo-pattern constraints carry forward from initiative research.
- Added optional `supporting-artifacts/` notes for Grill discussions that need
  concise schema, architecture, provider-routing, data-lifecycle, permissions,
  or operational context outside the main decision record.
- Updated host-smoke and state-helper tests for the new initiative research
  gate.

## 0.10.8 - 2026-06-02

- Added a shared verification evidence taxonomy that separates static/build
  checks, unit/component/integration tests, E2E tests, browser clickthrough,
  visual evidence, and skipped/not-applicable evidence.
- Updated slice planning, build, and verification skills to use grouped
  verification evidence instead of one generic test/check bucket.
- Made browser-visible slice verification require actual browser clickthrough:
  route opened, representative data used, feature controls clicked, expected
  states observed, and screenshots captured.
- Added repo-precedent gates so integration, provider, workflow, upload,
  storage, asset, queue, job, and dataflow work must search for existing repo
  patterns before inventing or patching a solution.
- Added a planning-time Repo Pattern Scan so agents classify the work and inspect
  matching repo patterns before proposing how to build it.
- Added mandatory user checkpoints for idea refinement and grilling, including
  state-helper enforcement that `idea.md` and `decisions.md` record a user
  response before the workflow can continue.
- Added verification environment-scope rules so automated tests stay in the
  repo's test/E2E environment and browser clickthrough stays in the dev/local app
  environment unless explicitly overridden.
- Added browser-clickthrough recovery rules so a single blocked local URL,
  navigation timeout, or browser-tool failure cannot be treated as enough
  evidence to abandon browser verification.
- Added dogfood guidance for nested browser harness failures so observer-side
  clickthrough can classify a target browser/tooling issue without replacing
  target-agent browser evidence.

## 0.10.7 - 2026-06-02

- Renamed the workflow state prompt from `current` to `next-step` and made
  completion receipts direct agents back to `next-step` before continuing.
- Hardened workflow state completion so phase, slice, and verification checks
  require real artifacts before they can be marked complete.
- Improved final verification guidance for CLI/API workflows, including
  preserved-path smoke checks and non-UI screenshot status as `Not applicable`.
- Tightened dogfood and host-smoke guidance around honest workflow runs and
  installed-runtime confidence.

## 0.10.6 - 2026-06-01

- Simplified the primary Strike entry skills to `new-initiative` and `go`.
- Aligned generated workspace paths, docs, tests, and validators on `strike/`.
- Added workflow step-discipline guidance so agents complete one returned check
  and rerun `next-step` before continuing.
- Changed finished/no-active workflow state from `blocked` to `idle`.
- Removed the retired workflow backup tree so the repo keeps one active Strike
  shape.

## 0.10.5 - 2026-06-01

- Published README customization polish in the release tag, including the new
  `Customize strike` section and customization benefit copy.

## 0.10.4 - 2026-06-01

- Consolidated user-owned workflow guidance under
  `strike/user-guidance/`.
- Added stage-specific implementation discipline and additive review lens files,
  with each stage reading `global.md` plus its own file.
- Updated planning, build, fix, and verification stages to apply user guidance
  while checking surrounding code, upstream/downstream impact, shared utility
  placement, and user-requested review lenses.

## 0.10.1 - 2026-06-01

- Refreshed README positioning and usage examples for the new Strike
  workflow.
- Clarified Codex `$strike:<skill>` invocation syntax and the split between
  plugin runtime Node requirements and repo development Node requirements.

## 0.10.0 - 2026-05-31

- Added the draft lean staged workflow orchestrator file and state helper for
  workflow-matrix based progress tracking.
- Added standalone workflow skills for idea refinement, grilling, specs,
  development phases, phase specs, phase slices, slice planning/building, and
  slice/phase/main verification gates.
- Added `PROJECT_LANGUAGE.md` bootstrap behavior for new Strike
  workspaces and aligned early workflow skills on durable language updates.
- Added state-helper tests and host-smoke coverage for bootstrap, current state,
  artifact resolution, phase/slice creation, and completion checks.

## 0.9.0 - 2026-05-31

- Removed the retired board/card workflow skills and repo-local
  `init`/`customize` setup path.
- Kept Strike focused on the core workflow plus standalone `demo`,
  `system-visualizer`, `language`, and `handoff` utilities.
- De-boardified retained utilities so they no longer require `docs/strike/`
  state or the removed customization runtime.
- Updated manifests, docs, validation, and host smoke checks for the new
  Strike-centered package shape.

## 0.8.32 - 2026-05-31

- Expanded System Visualizer diagram-mode references so each supported mode has
  concise basics, quality guidance, and links for deeper syntax/features.

## 0.8.31 - 2026-05-31

- Added the manual-only `system-visualizer` utility skill for reusable
  diagram/model code across systems, schemas, APIs, workflows, dependencies,
  and architecture.
- Added System Visualizer to Strike customization so repos can set diagram
  format preferences, privacy defaults, source-inspection depth, and output
  style.

## 0.8.30 - 2026-05-31

- Renamed Strike's intermediate planning layer from features to delivery phases, making `phases/<phase-slug>/phase-spec.md` the canonical path between initiative specs and slices.
- Renamed Strike workflow progress docs from Phase Ledger/Phase Tasks to Mode Ledger/Mode Tasks so brainstorm, spec, build, review, and readiness are clearly workflow modes rather than delivery phases.
- Aligned Strike helper warnings, readiness ledger parsing, and allowed `Current mode` values with the canonical workflow modes.
- Kept one-release compatibility warnings for legacy `Feature:` fields, `features/<feature-slug>/feature-spec.md` paths, and `Phase Ledger` headings.

## 0.8.29 - 2026-05-31

- Rewrote Codex install and update guidance around the deterministic
  `codex plugin add strike@strike` flow, Desktop relaunches, fresh threads, and
  clean reinstall troubleshooting.
- Added a non-colliding `strike-dev` local dogfood workflow for testing this
  checkout without disturbing a normal published `strike@strike` install.
- Made Strike visible as the primary Codex entry skill with
  `allow_implicit_invocation: true` while keeping smaller Strike workflow step
  skills manual-only.

## 0.8.28 - 2026-05-29

- Added Strike Stripe guidance for official-docs research, Stripe CLI
  sandbox verification, and required webhook/Stripe object evidence.
- Added Stripe Connect handling that tells Strike to start from an
  installed `stripe-connect` skill when available.
- Added helper validation for missing Stripe CLI sandbox evidence and missing
  Stripe Connect skill research notes.

## 0.8.27 - 2026-05-29

- Fixed Strike helper parsing for normal Markdown links in `Active Work`
  and `Key Docs`, so links resolve to their target paths instead of labels.
- Reduced Strike UI review false positives for plain `.js` / `.ts` files
  that live under UI-shaped directories but do not contain browser-facing code.
- Aligned Strike inspect output with the canonical `Next:` field wording.

## 0.8.26 - 2026-05-28

- Added a shared Strike language contract and aligned workflow and utility
  skills on root `PROJECT_LANGUAGE.md` as the durable project language file.
- Removed Strike's `strike/language.md` requirement and stopped
  warning when no glossary exists yet.
- Aligned local package-manager policy on standalone pnpm `11.4.0`, with pnpm
  downloading the declared version and failing rather than auto-installing stale
  dependencies before scripts.
- Removed previously packaged third-host plugin manifests, marketplace metadata,
  install docs, and smoke workflow coverage so Strike now ships only Codex and
  Claude Code packaging.

## 0.8.25 - 2026-05-27

- Bounded Strike review loops: after fixes, agents run one focused
  re-review and continue only for new or still-open blockers.
- Made review lens coverage explicit: meaningful slices require at least one
  read-only review subagent for baseline lenses, with surface-specific lenses
  added when touched.
- Kept Strike slice/readiness commits mandatory while making push
  conditional on user request, repo policy, or release flow.
- Set Strike host metadata to explicit user invocation only.

## 0.8.24 - 2026-05-26

- Reissued the Strike quality-gate release under a fresh plugin version so
  host installs and caches pick up the `playwright-cli`-only browser guidance
  instead of stale `0.8.23` skill content.

## 0.8.23 - 2026-05-26

- Made Strike UI/browser verification first-class with a dedicated
  `Browser Verification Capability` record for UI/user-flow slices.
- Standardized UI/browser verification on `playwright-cli` as the only approved
  browser path unless the user explicitly overrides it.
- Tightened helper validation so real browser evidence, blocked browser
  fallbacks, and code-only replacement evidence are distinguished instead of
  collapsing into generic verification.
- Reduced false-positive contradiction warnings when checked smoke/API tasks
  coexist with clearly skipped browser verification.
- Tightened slice sizing pressure with `Why Not Split` checks for L/XL and
  broad UI + route/API + state/data + test slices.
- Added stale final-index warnings when closed readiness still leaves
  active-build, planned-later, or future-slice language in `index.md`.
- Tightened Grill Decision Depth wording so agents ask the user once, default
  to Standard, and treat depth as questioning pressure rather than permission to
  lower build quality.

## 0.8.22 - 2026-05-26

- Tightened Strike stack/setup guidance so user- or repo-named tooling
  constraints, especially security-driven pnpm/no-npm policies, cannot be
  bypassed by choosing a different runtime or package manager as a no-install
  workaround.
- Added helper validation for possible runtime/tooling conflicts when Strike
  docs combine pnpm/no-npm constraints with non-matching stack decisions.

## 0.8.21 - 2026-05-25

- Made Strike review subagents mandatory for completed meaningful slices:
  missing read-only review subagent evidence is now a validation error.
- Tightened UI/user-flow verification guidance so browser checks are explicit
  and curl, static HTML, and code review are not treated as browser evidence.
- Added helper checks for checked todo, checkpoint, and execution-task claims
  that conflict with skipped evidence or lack matching verification evidence.
- Rejected pending, skipped, blocked, self-review, or "not run" evidence as
  positive review or verification proof.

## 0.8.20 - 2026-05-25

- Added a Strike recovery reference for interrupted, missing, stale, or
  contradictory workspace state.
- Tightened helper validation so build/review/readiness modes treat missing
  active docs, features, or slice docs as recovery blockers instead of ordinary
  warnings.

## 0.8.19 - 2026-05-25

- Added an explicit slice `## Evidence` template so completed slices record
  `Changed`, `Verified`, `Reviewed`, `Skipped`, and `Review Findings` before
  their user-facing closeout receipt.
- Tightened build and slice exit guidance so agents run helper validation and
  address evidence, active-work, review, and boundary warnings before claiming
  the phase or slice is done.
- Improved helper active-slice resolution when `Doc:` points at a slice file
  but `Slice:` is prose, and added warnings for closeout summaries without
  evidence plus next-slice activation without explicit user continuation.
- Reduced false-positive weak-planning checks when real product text uses words
  like "placeholder" rather than placeholder-only content.

## 0.8.18 - 2026-05-25

- Tightened Strike slice closeout validation so next-slice skeletons after
  a completed slice warn unless execution prep has actually begun.
- Reduced multi-slice dogfood noise by treating completed slice `Changed`
  evidence as accounted for when checking uncommitted Git changes.
- Made closeout summary validation accept concise equivalent labels such as
  `Validation:` while reporting which required receipt labels are missing.
- Reduced false-positive batched-title warnings for small `and`-titled slices
  that record a clear one-behavior rationale.
- Clarified that ad hoc smoke/walkthrough scripts should fail fast on stale
  servers, bad response statuses, missing IDs, or empty responses.

## 0.8.17 - 2026-05-25

- Tightened Strike phase-boundary language so agents do not ask for one
  decision and promise to close grill, write specs, and slice the build in the
  same next action.
- Added a helper warning when `strike/index.md` records a batched next
  action that combines spec and slice work, or slice planning and build work.
- Tightened build closeout boundaries so completed slices stop with a receipt
  instead of activating the next slice, and refined checkpoint warnings so
  future slice milestones do not fire before their due slice is complete.
- Required explicit `Current mode` in Strike Active Work and stopped the
  helper from inferring build-mode slice prep from a slice doc path alone.
- Reduced false-positive helper warnings for future Phase Ledger rows and
  legitimate grill checkpoint syntax such as date comparisons.

## 0.8.16 - 2026-05-25

- Strengthened Strike phase boundaries so brainstorm, grill, spec, slice,
  and build are not collapsed into one pass; completed phases should stop with
  a receipt and next action unless the user explicitly skips the boundary.
- Tightened spec and slice guidance so specs cannot include numbered slice
  lists or future slice-file links, and slice planning records review plus exit
  evidence before build starts.
- Added helper warnings for over-detailed Slice Handoffs, missing spec review or
  exit evidence before slicing/building, missing slice review or exit evidence
  before build, and missing grill decision depth after later phases begin.

## 0.8.15 - 2026-05-25

- Tightened Strike dependency guidance so pnpm-only repos must use
  `pnpm view` or official docs/registry pages even for read-only package
  metadata checks; agents should not use `npm` or `npx` as a shortcut.
- Added helper warnings for duplicate Active Work fields and duplicate Phase
  Ledger rows, while resolving the most useful non-placeholder state so later
  checks can still run.
- Improved slice validation so oversized slice warnings still fire when active
  state is dirty, and clarified that `M` slices should not hide `L/XL` signals.

## 0.8.14 - 2026-05-25

- Tightened Strike phase boundaries so spec mode can write specs and a
  concise Slice Handoff, but not create Slice Maps or slice files before spec
  exit evidence.
- Added helper warnings when detailed slice planning appears inside spec docs,
  or when slice artifacts exist while spec is still in progress.

## 0.8.13 - 2026-05-25

- Clarified Strike invocation-reference resolution so agents use the
  plugin-root `references/invocation.md` file instead of looking under the
  skill-local references folder.
- Added a small skill-local invocation pointer as a fallback for hosts or agents
  that resolve reference paths from the skill folder first.

## 0.8.12 - 2026-05-25

- Clarified Strike question handling so failed or unavailable host question
  tooling must fall back to a plain-text user question and stop, rather than
  being treated as permission to accept defaults or proceed.
- Added helper warnings when brainstorm or grill phases are completed,
  compressed, or skipped after a question-tool failure.

## 0.8.11 - 2026-05-25

- Tightened Strike phase commitment so meaningful feature/MVP work must
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

- Tightened Strike validation after dogfood so implementation evidence now
  warns when `index.md` still points at early phases, missing active
  feature/slice pointers, stale open decisions, or "no code written".
- Added helper warnings for missing referenced Strike docs, stale slice
  task/checkpoint checklists after build evidence, and curl/localhost checks
  being mistaken for browser/user-flow evidence.
- Clarified build closeout guidance so agents do not leave long-running local
  servers blocking the final response, and added runtime-version guidance for
  built-in platform APIs such as `node:sqlite`.

## 0.8.9 - 2026-05-25

- Added a Strike initiative Phase Ledger so brainstorm, grill, spec,
  slice, build, review, and validation are visibly done, compressed, skipped, or
  pending instead of silently blurred.
- Added helper warnings for later-phase work that lacks a substantive Phase
  Ledger, plus tests for missing, weak, and accepted ledger examples.
- Required root `language.md` plus per-initiative `decisions.md` and `spec.md`
  as mandatory current-truth docs, with helper warnings and tests for missing or
  weak artifacts.
- Strengthened Strike review expectations so completed meaningful slice
  reviews need fresh read-only reviewer evidence or an explicit unavailable-host
  rationale, not only main-agent self-review.
- Tightened blocked browser/user-flow fallback evidence so skipped browser
  checks must name the host/manual option checked, blocker, replacement
  evidence, and residual risk.

## 0.8.8 - 2026-05-25

- Added Strike slice closeout summary guidance so completed slices end with
  a compact user-facing receipt covering built work, validation, review status,
  skipped/residual risk, docs, and next action.
- Added helper warnings when active completed slice evidence has Changed,
  Verified, and Reviewed entries but no substantive `Closeout Summary`.
- Tightened Strike grill guidance around one-decision-node-at-a-time
  pressure testing, recommended answers, concise Decision Depth, and helper
  warnings for missing or unknown grill depth.
- Reworked Strike workspace structure around deterministic
  initiative -> feature -> slice directories, with helper parsing, validation,
  review scoping, and tests updated for the new shape.
- Fixed Codex metadata so the standalone `strike` skill is discoverable and
  invocable in dogfood runs, while the smaller Strike workflow skills remain
  manual-only.

## 0.8.7 - 2026-05-25

- Added Strike verification-capability guidance so slices record available
  repo checks, host/manual browser or user-flow options, install constraints,
  blocked checks, replacement evidence, and residual risk before accepting
  skipped verification.
- Added helper warnings when reviewable UI/auth/integration evidence or skipped
  checks lack a concrete verification-capability record.

## 0.8.6 - 2026-05-25

- Removed Tiny/Fast/Full paths as first-class workflow routes. Strike now
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
- Condensed the Strike main skill into the routing contract, split detailed
  behavior into phase-specific files, and removed the redundant `flow.md` phase
  map.
- Clarified that phase order is the ideal default workflow, not a mandated
  waterfall, while preserving mode commitment.
- Reframed research guidance as just-in-time source-backed recommendation work
  that keeps momentum unless a real product/risk blocker appears.

## 0.8.5 - 2026-05-25

- Added Strike `review-plan` to recommend review lenses from active
  `Changed:` evidence.
- Added `implementation-plan`, `ui-regression`, and `state-data-integrity`
  review lenses for pre-build planning, frontend regressions, and state/data
  integrity risks.
- Added validation warnings for weak pre-build slice prep, missing required
  review lens evidence, UI work without visual/static UI review evidence, and
  drift between active `Changed:` evidence and the Git worktree.
- Updated Strike workflow docs to require slice execution research,
  concrete implementation plans, critical plan review, `Reviewed:` evidence, and
  explicit skipped-review rationales before trusting a slice.

## 0.8.4 - 2026-05-25

- Scoped Strike `review-context` evidence to the active slice first, then
  the active feature, and only falls back to workspace-wide evidence when needed.
- Grouped review packet source paths into active docs, changed files, workspace
  docs, and context docs so reviewers can prioritize implementation changes.
- Added review-readiness warnings when active evidence lacks `Changed:` or
  `Verified:` sections.
- Added multi-feature tests that prevent stale feature evidence from leaking
  into active review packets.

## 0.8.3 - 2026-05-24

- Improved Strike review packets so `review-context` includes changed
  implementation files parsed from slice evidence `Changed:` sections.
- Added tests that verify changed-path extraction and review packet source
  paths for focused reviewer agents.

## 0.8.2 - 2026-05-24

- Added a read-only `strike` workspace helper with `inspect`, `validate`,
  and `review-context` commands for agent-internal workspace auditing.
- Added fixture tests for absent workspaces, unrelated folder collisions, Tiny
  Path flexibility, Fast/Large Path evidence, repo-level key docs, and review
  context packets.
- Documented the helper as an optional guardrail that does not create features,
  slices, planning docs, next actions, or workflow state.

## 0.8.1 - 2026-05-24

- Hardened `strike` for greenfield and thin repositories by requiring
  stack discovery, explicit dependency approval, and a no-install fallback path.
- Added collision handling for pre-existing root `strike/` directories
  before the skill writes workspace state.
- Strengthened `strike` review guidance so multiple review agents can run
  in parallel with distinct lenses and return findings to the main agent for
  synthesis and evaluation.

## 0.8.0 - 2026-05-24

- Added the user-invoked `strike` utility skill for moving a fuzzy idea
  toward a working MVP with a standalone root `strike/` workspace.
- Kept `strike` independent from the normal Strike board/card workflow.

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
  and Claude Code.
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
- Added Codex and Claude Code plugin manifests.
- Added Codex and Claude Code marketplace entries.
- Added MIT licensing and repo validation for cross-agent release hygiene.
- Kept `0.1.0` as the first private testing release version.
- Verified the available local, Git-backed, and Claude host smoke checks.
