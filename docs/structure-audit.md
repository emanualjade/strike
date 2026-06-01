# Structure Audit

Last checked: 2026-05-31.

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
component. Auto Strike and utility skills point to it and use the consuming repo
root `PROJECT_LANGUAGE.md` as the durable project language file. This is Strike
workflow policy, not a host schema requirement.

2026-06-01 update: Auto Strike now uses a lean staged workflow orchestrator
with `auto-strike/state.json` as the progress source of truth and Markdown
artifacts under `auto-strike/initiatives/<initiative-id>/`. The old long-form
Auto Strike runtime, mode-ledger guidance, and related restructure notes are
preserved under `backup/auto-strike-legacy/` and are not part of the active
plugin package. The user-facing entrypoints are explicit:
`auto-strike-new-initiative` starts new work and `auto-strike-go` resumes the
active initiative. This is Strike workflow policy, not a host schema
requirement.

2026-06-01 update: Slice research is now a first-class Auto Strike workflow
step. `research-slice` runs before `plan-slice`, writes compact research to the
slice's `research.md`, and the slice plan verification step checks that research
was either used or explicitly unnecessary.

2026-06-01 update: Auto Strike now has explicit route-back mechanics. Workflow
artifacts should return `Ready: no`, `Built: no`, or `Verified: no` plus
`Route Back` when an earlier artifact is missing or weak. The state helper
exposes `reopen-check <check-name>` to move the active scope back without
hand-editing `state.json`, `reopen-phase-check <phase-id> <check-name>` lets
main verification route back to a specific phase, and `reopen-slice-check
<phase-id> <slice-id> <check-name>` lets phase or main verification route back
to a specific slice. Reopening a check also reopens later dependent checks so
research, plans, builds, phase verification, and main verification are not
trusted after upstream work changes.

2026-05-31 update: Strike `0.9.0` removes the retired board/card workflow
skills and keeps Auto Strike plus standalone utility skills. Root references
are now limited to shared language, demo slug policy, and the slug helper.
`plugins/strike/references/customization/`,
`board-model.md`, and `stage-contracts.md` were removed because no retained
skill depends on them. This remains idiomatic: Codex and Claude both load
skills from the plugin-root `skills/` directory, and arbitrary support files are
read only when a skill explicitly points to them.

2026-06-01 update: `plugins/strike/references/invocation.md` was removed.
Host invocation syntax is docs/package guidance, not runtime skill behavior.
Active skills should describe their own work and outputs; Auto Strike routing
comes from `auto-strike/state.json` and the state helper.

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

## Things We Should Not Add By Default

- Do not add `.agents/skills`, `.claude/skills`, or `.github/skills` copies of the same skills. Those are repository-scope skill locations, not installable plugin packaging, and would duplicate the plugin content during development.
- Do not add empty plugin-root `scripts/`, `assets/`, `hooks/`, `.mcp.json`, `.app.json`, or `.lsp.json` until a real component needs them.
- Do not add Codex custom agents inside the plugin until Codex documents plugin-shipped custom agents.
- Do not publish while `plugins/strike/skills/` is empty. An empty plugin may be useful during setup, but it should never be a release artifact.
- Do not force every host marketplace into one source format. Codex and Claude support more than local string paths, and their valid source objects differ.
