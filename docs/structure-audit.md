# Structure Audit

Last checked: 2026-06-01.

This file records the "is this grounded, invented, and idiomatic?" pass for the scaffold.

## Sources Used

- OpenAI Codex: [Agent Skills](https://developers.openai.com/codex/skills), [Plugins](https://developers.openai.com/codex/plugins), [Build plugins](https://developers.openai.com/codex/plugins/build), [Codex app commands](https://developers.openai.com/codex/app/commands), [CLI slash commands](https://developers.openai.com/codex/cli/slash-commands), [Subagents](https://developers.openai.com/codex/subagents), [AGENTS.md](https://developers.openai.com/codex/guides/agents-md)
- Claude Code: [Create plugins](https://code.claude.com/docs/en/plugins), [Plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces), [Plugins reference](https://code.claude.com/docs/en/plugins-reference), [Skills](https://code.claude.com/docs/en/skills), [Subagents](https://code.claude.com/docs/en/sub-agents), [Memory](https://code.claude.com/docs/en/memory)
- Open standard: [Agent Skills specification](https://agentskills.io/specification)

## Decisions

### `plugins/strike/skills/<skill-name>/SKILL.md`

- Grounded in research: Yes.
- Made up or over-structured: No.
- Idiomatic: Yes.

Codex, Claude Code, and the Agent Skills spec all use skill directories containing `SKILL.md`. The shared skill tree is the right source of truth for portable skills. Requiring explicit `name` and `description` frontmatter is this repo's portability policy; Claude Code can infer the name from the directory and treats skill frontmatter fields as optional.

### Skill-local `scripts/`, `references/`, and `assets/`

- Grounded in research: Yes.
- Made up or over-structured: No, as long as they are skill-local and added only when a skill needs them.
- Idiomatic: Yes.

The Agent Skills spec and Codex docs name these optional directories. Claude Code supports supporting files and documents `scripts/`, but does not special-case `references/` or `assets/`; those names are portable conventions that only help when `SKILL.md` points agents to them. They should live inside a skill folder, not as empty top-level plugin scaffolding.

### `plugins/strike/references/`

- Grounded in research: Partly.
- Made up or over-structured: No, because multiple Strike skills share these
  lightweight package references.
- Idiomatic: Acceptable as package support material, not as a host-discovered component path.

The Strike plugin uses root `references/` for lightweight package support
material cited by multiple skills. Hosts should not be expected to discover
this directory automatically; skills and README files should point to specific
files when they matter.

2026-05-17 update: `plugins/strike/references/scripts/` is allowed for shared
deterministic package helpers that multiple skills call by explicit absolute
path. These scripts are not a host-discovered component type and should not
replace skill-local `scripts/` for behavior that belongs to exactly one skill.

2026-05-28 update: `plugins/strike/references/language.md` is the shared
Strike language contract. It is package support material, not a host-discovered
component. Strike workflow and utility skills point to it and use the consuming
repo root `PROJECT_LANGUAGE.md` as the durable project language file. This is Strike
workflow policy, not a host schema requirement.

2026-06-01 update: Strike now uses a lean staged workflow orchestrator with
Markdown artifacts under `strike/initiatives/<initiative-id>/`. The user-facing
entrypoints are explicit: `new-initiative` starts new work and `go` resumes the
active initiative. This is Strike workflow policy, not a host schema
requirement.

2026-06-02 update: Strike split workflow progress state so `strike/state.json`
is a compact initiative index and the authoritative source for initiative
lifecycle status. Detailed workflow progress lives in
`strike/initiatives/<initiative-id>/state.json`. The state helper still reads
old single-file v1 state and migrates it to split v2 state on the next write.
Agents may inspect state when needed, but should read root state for initiative
selection and only the relevant initiative-local state file for detailed
progress. This is Strike workflow policy, not a host schema requirement.

2026-06-03 update: Phase research is now the official implementation research
gate after `create-phase-spec` and before `create-phase-slices`.
`research-phase` writes the phase's `research.md` and `research-audit.md`,
inherits audited initiative research, and fills granular phase-specific
implementation gaps before slicing. It should research the official, canonical,
idiomatic way to use the exact APIs, packages, plugins, SDKs, models, provider
features, and domain mechanics the phase will touch, then audit those findings
before `phaseResearchComplete` can pass. Slice planning may add narrow
source-backed deltas, but `research-slice` is no longer a workflow gate.

2026-06-02 update: slice sizing is cohesion-based rather than strict
file-count slicing. `create-phase-slices`, `plan-slice`, and
`verify-slice-plan` allow broader UI/API/data/test work when it belongs to one
cohesive buildable unit with a clear verification story, while still requiring
split, route-back, or concrete justification for independent outcomes, weak
cohesion, unclear verification, and overly broad slice boundaries. This is
Strike workflow policy, not a host schema requirement.

2026-06-02 update: `create-phase-slices` owns primary slice sizing. Later slice
stages work from the accepted slice boundary and route back only when phase
research, planning, or implementation evidence changes that boundary. This keeps
`plan-slice`, `verify-slice-plan`, and `build-slice` from repeating the same
size rubric while preserving boundary-change safety. This is
Strike workflow policy, not a host schema requirement.

2026-06-04 update: The canonical slice boundary standard now lives in
`plugins/strike/references/slice-boundaries.md`. `create-phase-slices`,
`plan-slice`, and `verify-slice-plan` point to that shared reference instead of
carrying separate versions of the good-slice, split, justify, cross-stack, and
non-vertical slice guidance. This uses the already researched
`plugins/strike/references/` package-support pattern above; hosts should not be
expected to discover the file automatically. This is Strike workflow policy and
package support material, not a host schema requirement.

2026-06-02 update: `verify-slice-build` now starts with a compact verification
packet: `build.md`, `plan.md`, and `slice.md`. It checks
workflow state or `plan-verification.md` for plan readiness and reads deeper
context such as full plan verification, phase `research.md`,
`research-audit.md`, or `phase-spec.md` only when evidence, scope, risk,
contradiction, or route-back questions require it.
This is Strike workflow policy, not a host schema requirement.

2026-06-03 update: `verify-slice-plan` now starts with a compact verification
packet: `slice.md`, phase `research.md`, phase `research-audit.md`, `plan.md`,
and `phase-spec.md`. It reads `supporting-artifacts/` and focused repo paths
only when plan readiness, artifact references, or local precedent evidence
require them. Phase spec stays required at plan verification because this gate
checks the slice plan against phase intent before build. This keeps plan
verification centered on the slice handoff without front-loading every upstream
context file. This is Strike workflow policy, not a host schema requirement.

2026-06-03 update: `verify-slice-plan` embeds the verification categories inside
the `plan-implementation-readiness-audit`: Static / Build Checks, Unit /
Component / Integration Tests, E2E Tests, Browser Clickthrough, Visual Evidence,
and Skipped / Not Applicable. This avoids a per-run shared taxonomy reference
read for this verifier while keeping the evidence language in the audit that
uses it. This is Strike workflow policy, not a host schema requirement.

2026-06-03 update: `verify-slice-plan` now separates verifier orchestration from
read-only review-agent work. The Process section loads the packet, confirms the
research gate, runs reviews, synthesizes findings, and decides readiness. The
detailed build-readiness checklist lives in the required
`plan-implementation-readiness-audit` review agent. This keeps the verifier
prompt easier to scan and makes review responsibility explicit. Its final rules
are grouped into verifier conduct, `Ready: yes` requirements,
research/boundary blockers, fix/route-back, and completion so readiness
conditions are easier to scan. This is Strike workflow policy, not a host schema
requirement.

2026-06-03 update: Slice verification prompts now label review entries with
explicit `SUBAGENT:` and `USER REVIEW LENSES:` prefixes. This keeps built-in
read-only review agents, conditional subagents, and user-provided review
customization visually distinct while preserving the same parallel verification
batch behavior. Required and conditional slice verification subagents now load
their longer rubrics and shared output discipline from bundled
`references/review-agents/` files so the hot verifier prompt stays focused on
orchestration. This is Strike workflow policy, not a host schema requirement.

2026-06-02 update: `verify-slice-build` no longer reads the shared
`references/verification-evidence.md` file on each run. Its own output shape and
rules embed the evidence categories it needs for build verification. This is
Strike workflow policy, not a host schema requirement.

2026-06-02 update: `verify-slice-build` now uses a parallel pre-browser
verification batch for automated slice checks, `built-slice-acceptance-audit`,
`built-slice-code-audit`, and `built-slice-common-issues-audit`, then runs final
Browser Clickthrough in the dev/local environment. This replaces five mandatory
per-slice review lenses with three focused audits while keeping specialized risk
lenses conditional and leaving broader cross-slice review to phase verification.
Relevant user review-lens audits from `strike/user-guidance/review-lenses/` join
the same parallel pre-browser batch. The batch now synthesizes into a compact
`Ready for browser` gate with blocking issue IDs and stops before browser work
when accepted-scope blockers remain. Browser Checks are condensed around actual
execution: use the accepted feature in the browser, and fail verification when
the feature cannot be used successfully. The final rules are grouped into
verifier conduct, `Verified: yes` requirements, browser blockers,
fix/route-back, and completion so pass conditions are easier to scan. This is
Strike workflow policy, not a host schema requirement.

2026-06-03 update: `verify-phase` now starts from the assembled phase evidence:
the phase spec, each slice stub, and each slice build-verification result.
Passed slice verification is treated as the normal source of slice-local
confidence; phase verification reads deeper phase research, phase research
audit, slice plans, build evidence, supporting artifacts, or repo paths only
when evidence is missing, thin, contradictory, skipped, risky, or needed to
judge cross-slice phase behavior. This keeps phase verification focused on phase
coverage and cross-slice integration instead of replaying every slice-local
gate. This is Strike workflow policy, not a host schema requirement.

2026-06-03 update: `verify-phase` now uses the same parallel read-only review
shape as the slice verifiers. Required phase review agents
`phase-spec-coverage` and `cross-slice-integration` load bundled rubrics from
`plugins/strike/references/review-agents/`, user review lenses join the same
parallel batch, and conditional phase-level lenses reuse shared rubrics for user
flows, state/data integrity, security/privacy, and integration risk. This keeps
phase verification broad enough to catch assembled-work gaps without replaying
full slice-local audits. This is Strike workflow policy, not a host schema
requirement.

2026-06-02 update: `plan-slice` uses planning dialogue plus a compact
plain-English development plan shape instead of a large category matrix. The
planning obligations still require existing repo patterns, complete-system
touchpoints, blast-radius reasoning, completeness, and verification, while
`verify-slice-plan` audits those obligations before build. This is Strike
workflow policy, not a host schema requirement.

2026-06-02 update: Initiative research is now a first-class pre-grill Strike
workflow step. `research-initiative` runs after `refine-idea` and before
`grill-idea`, writes a user-approved research scope plus per-topic reports under
`research/`, and rolls findings into `research/index.md` for Grill, Main Spec,
phase specs, and slice planning. This is Strike workflow policy, not a host
schema requirement.

2026-06-02 update: `supporting-artifacts/` is an optional initiative-level
directory for concise decision-discussion notes created during Grill, such as
schema reasoning, architecture tradeoffs, provider routing, data lifecycle, and
permissions notes. Downstream stages may scan it when present, but it is not
hidden source of truth; required decisions and constraints still belong in
`decisions.md` and `main-spec.md`. This is Strike workflow policy, not a host
schema requirement.

2026-06-02 update: the copied workspace state helper now has a `sync-helper`
command and normalizes old workflow state to the current packaged workflow. This
keeps existing workspaces on new gates such as initiative research after plugin
updates without asking agents to hand-edit `strike/state.json` or helper files.
This is Strike runtime policy, not a host schema requirement.

2026-06-02 update: initiative research now requires one read-only audit artifact
under `research/audits/` for each approved research item before Grill can run.
The audit checks report claims against official or primary sources and actual
repo code, then the research stage fixes the reports and records the audit
rollup in `research/index.md`. This is Strike workflow policy, not a host schema
requirement.

2026-06-03 update: phase and planning-time research must inherit audited
initiative research before adding narrower findings. `research-phase`,
`plan-slice`, and `verify-slice-plan` receive `research/index.md`, relevant
per-item reports, and relevant audit files so agents do not redo or contradict
global provider/model/API, repo-pattern, schema, queue, file/blob, or
auth/payment research. `research-phase` owns broader phase-level deltas; slice
planning adds only narrow deltas when the phase research still lacks a
slice-local fact. This is Strike workflow policy, not a host schema requirement.

2026-06-02 update: Grill now requires a read-only `Decision Review` section in
`decisions.md` before `decisionsResolved` can complete. The review checks for
blind spots, unsupported assumptions, unresolved consequential decision nodes,
contradictions with research/docs/code, and spec-blocking ambiguity. This is
Strike workflow policy, not a host schema requirement.

2026-06-01 update: Strike now has explicit route-back mechanics. Workflow
artifacts should return `Ready: no`, `Built: no`, or `Verified: no` plus
`Route Back` when an earlier artifact is missing or weak. The state helper
exposes `reopen-check <check-name>` to move the active scope back without
hand-editing `state.json`, `reopen-phase-check <phase-id> <check-name>` lets
main verification route back to a specific phase, and `reopen-slice-check
<phase-id> <slice-id> <check-name>` lets phase or main verification route back
to a specific slice. Reopening a check also reopens later dependent checks so
research, plans, builds, phase verification, and main verification are not
trusted after upstream work changes.

2026-06-01 update: Strike init now creates `strike/user-guidance/`
as user-owned runtime project memory. It contains
`implementation-discipline/` for project-specific coding guidance and
`review-lenses/` for additive verifier guidance. Each folder has a `global.md`
plus stage-specific files, so stages can read focused guidance without parsing
one large mixed file. This deliberately lives in the consuming repo's Strike
workspace rather than `plugins/strike/references/`, because it is
editable project memory, not bundled package documentation or a host-discovered
component. User review lenses are additive and do not replace built-in Strike
verification gates.

2026-06-02 update: Planning, build, fix, and verification skills now name
`strike/user-guidance/` files as required user-provided customization from the
consuming repo's Strike workspace. Planning/build/fix stages read
implementation discipline `global.md` plus their stage file. Verifiers read
review lenses `global.md` plus their stage file and implementation discipline
`global.md` plus their stage file. This makes user-owned guidance part of the
workflow contract instead of optional local context.

2026-05-31 update: Strike `0.9.0` removes the retired board/card workflow
skills and keeps the Strike workflow plus standalone utility skills. Root references
are now limited to shared language, demo slug policy, and the slug helper.
`plugins/strike/references/customization/`,
`board-model.md`, and `stage-contracts.md` were removed because no retained
skill depends on them. This remains idiomatic: Codex and Claude both load
skills from the plugin-root `skills/` directory, and arbitrary support files are
read only when a skill explicitly points to them.

2026-06-01 update: `plugins/strike/references/invocation.md` was removed.
Host invocation syntax is docs/package guidance, not runtime skill behavior.
Active skills should describe their own work and outputs; Strike routing comes
from `strike/state.json` and the state helper.

2026-06-02 update: `plugins/strike/references/verification-evidence.md` is the
shared Strike taxonomy for verification evidence categories. It keeps static
checks, unit/component/integration tests, E2E tests, browser clickthrough, visual
evidence, and skipped/not-applicable evidence separate across planning, build,
and verification skills. This is Strike workflow policy and package support
material, not a host-discovered component path.

2026-06-03 update: `plugins/strike/references/review-agents/` stores bundled
Markdown rubrics for required and conditional Strike review subagents that are
shared by slice, phase, and final initiative verification skills. The skills
still own orchestration, subagent names, input loading, parallelism, and output
shape; the reference files hold longer audit checklists and the shared
review-agent output discipline. These are portable package references, not
host-discovered custom agent definitions.

### Host Invocation Documentation

- Grounded in research: Yes.
- Made up or over-structured: No.
- Idiomatic: Yes when kept in README/docs instead of every skill.

Claude Code plugin skills use `/plugin-name:skill-name`. Codex app uses `$`
skill mentions and `@` plugin or bundled-skill selection; Codex CLI uses
`/skills` for skill browsing. Strike keeps `/strike:*` only in Claude Code
examples, not as portable skill instructions.

### `.codex-plugin/plugin.json`

- Grounded in research: Yes.
- Made up or over-structured: No.
- Idiomatic: Yes for Codex.

Codex requires `.codex-plugin/plugin.json` as the plugin entry point. The manifest keeps `skills: "./skills/"` because Codex uses manifest fields to point at bundled components.

### `.agents/plugins/marketplace.json`

- Grounded in research: Yes.
- Made up or over-structured: No.
- Idiomatic: Yes for Codex.

Codex documents repo marketplaces at `.agents/plugins/marketplace.json`, with `source.path` relative to the marketplace root and pointing to `./plugins/<plugin-name>`.

### `.claude-plugin/plugin.json`

- Grounded in research: Yes.
- Made up or over-structured: No.
- Idiomatic: Yes for Claude Code.

Claude Code uses `.claude-plugin/plugin.json` for plugin metadata. It auto-discovers default `skills/` and `agents/` directories, so the manifest does not need to repeat those default paths unless we customize them.

### `.claude-plugin/marketplace.json`

- Grounded in research: Yes.
- Made up or over-structured: No.
- Idiomatic: Yes for Claude Code.

Claude Code documents `.claude-plugin/marketplace.json` at the marketplace root. Relative plugin sources like `./plugins/strike` are explicitly supported for Git-backed marketplaces.

### `plugins/strike/agents/`

- Grounded in research: Yes, when we actually ship agents.
- Made up or over-structured: An empty committed folder would be premature.
- Idiomatic: Yes when populated with host-supported agent files.

Claude Code uses plugin-root `agents/`. Codex custom agents currently live in `.codex/agents/` or `~/.codex/agents/`, not inside Codex plugins.

### `AGENTS.md`

- Grounded in research: Yes.
- Made up or over-structured: No.
- Idiomatic: Yes.

Codex documents `AGENTS.md` as repository guidance, and the `agentsmd/agents.md` site describes it as an open format for coding agents.

### `CLAUDE.md`

- Grounded in research: Yes.
- Made up or over-structured: No.
- Idiomatic: Yes.

Claude Code documents repository memory at `./CLAUDE.md`. This repo keeps it as a thin import of `@AGENTS.md` so there is one canonical instruction source.

### `templates/`

- Grounded in research: Partly.
- Made up or over-structured: Putting templates under the installable plugin
  root would be too eager.
- Idiomatic: Acceptable only as repo development aid outside the plugin package.

Plugin hosts discover known component directories inside the plugin root. Templates are useful for authors but should not be shipped as plugin components or placed under `skills/`, where they could be discovered as real skills.

### Root `package.json` and `scripts/validate.mjs`

- Grounded in research: The validator is repository tooling, not host schema.
- Made up or over-structured: No, because it guards the known host structures without inventing runtime behavior.
- Idiomatic: Acceptable repo tooling.

The hosts provide some validation, but not one command that checks the combined Codex, Claude, and Agent Skills layout. `pnpm run validate` is repo-local quality control, not a host-schema validator or proof of publishability. It intentionally enforces some stricter repo policies, such as version alignment, Codex skill metadata presence, space-separated `allowed-tools`, explicit host invocation guidance in skills, known next-skill handoff targets, balanced Markdown fences, and host-neutral Strike handoffs in skills, even when a host schema marks equivalent fields optional. Use `pnpm run validate:publish` and host-native validators before release.

## 2026-06-03 Reviewed Gate Integrity

- Grounded in research: Grounded in local source workflow-check evidence.
- Made up or over-structured: No. The marker is a small durable artifact fact,
  not a new workflow stage.
- Idiomatic: Yes for Strike's existing state-helper pattern.

Reviewed gates now require artifacts to say `Review results returned: yes`
before the helper allows their `complete-check` to pass. This applies to Grill
decision review plus slice-plan, slice-build, phase, and final verification
artifacts. The prompt layer already told agents to synthesize review findings;
the helper now enforces a durable marker so an agent cannot complete a reviewed
gate while a required review or re-review is still running.

Dogfood documentation now separates installed-plugin dogfood from local source
workflow checks. Local source checks are useful for testing unreleased prompt or
state-machine changes without upgrading the maintainer's installed Strike
plugin, but they are not pure installed-plugin dogfood evidence.

## Things We Should Not Add By Default

- Do not add `.agents/skills`, `.claude/skills`, or `.github/skills` copies of the same skills. Those are repository-scope skill locations, not installable plugin packaging, and would duplicate the plugin content during development.
- Do not add empty plugin-root `scripts/`, `assets/`, `hooks/`, `.mcp.json`, `.app.json`, or `.lsp.json` until a real component needs them.
- Do not add Codex custom agents inside the plugin until Codex documents plugin-shipped custom agents.
- Do not publish while `plugins/strike/skills/` is empty. An empty plugin may be useful during setup, but it should never be a release artifact.
- Do not force every host marketplace into one source format. Codex and Claude support more than local string paths, and their valid source objects differ.
