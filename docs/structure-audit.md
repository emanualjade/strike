# Structure Audit

Last checked: 2026-05-19.

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
  board/workflow references.
- Idiomatic: Acceptable as package support material, not as a host-discovered component path.

The Strike plugin uses root `references/` for shared board and stage contracts cited by multiple skills. Hosts should not be expected to discover this directory automatically; skills and README files should point to specific files when they matter.

2026-05-17 update: `plugins/strike/references/scripts/` is allowed for shared
deterministic package helpers that multiple skills call by explicit absolute
path. These scripts are not a host-discovered component type and should not
replace skill-local `scripts/` for behavior that belongs to exactly one skill.

2026-05-28 update: `plugins/strike/references/language.md` is the shared
Strike language contract. It is package support material, not a host-discovered
component. Normal Strike and Auto Strike both point to it and use the consuming
repo root `UBIQUITOUS_LANGUAGE.md` as the single durable glossary. This is
Strike workflow policy, not a host schema requirement.

2026-05-31 update: Auto Strike's runtime workspace now uses
`auto-strike/initiatives/<initiative-slug>/phases/<phase-slug>/phase-spec.md`
as the canonical delivery-phase layer between initiative specs and slices. The
workflow progress terms are now `Mode Ledger` and `Mode Tasks` so brainstorm,
grill, spec, slice, build, review, and readiness are not confused with delivery
phases. Legacy `features/<feature-slug>/feature-spec.md`, `Feature:` Active
Work fields, and `Phase Ledger` headings remain read-compatible with warnings
for one release. This is Strike workflow policy, not a host schema requirement;
see `docs/auto-strike-initiative-restructure.md` and
`plugins/strike/skills/auto-strike/references/workspace.md`.

### `plugins/strike/references/invocation.md`

- Grounded in research: Yes.
- Made up or over-structured: No.
- Idiomatic: Yes as package guidance for a cross-host workflow.

Claude Code plugin skills use `/plugin-name:skill-name`. Codex app uses `$`
skill mentions and `@` plugin or bundled-skill selection; Codex CLI uses
`/skills` for skill browsing and `/clear` for a fresh chat. Strike keeps
`/strike:*` only as Claude Code rendering and records portable handoffs as
`Next Strike skill` plus `Arguments`.

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

The hosts provide some validation, but not one command that checks the combined Codex, Claude, and Agent Skills layout. `pnpm run validate` is repo-local quality control, not a host-schema validator or proof of publishability. It intentionally enforces some stricter repo policies, such as version alignment, Codex skill metadata presence, space-separated `allowed-tools`, explicit host invocation guidance in skills, known next-skill handoff targets, balanced Markdown fences, and host-neutral Strike handoffs in skills and stage contracts, even when a host schema marks equivalent fields optional. Use `pnpm run validate:publish` and host-native validators before release.

## Things We Should Not Add By Default

- Do not add `.agents/skills`, `.claude/skills`, or `.github/skills` copies of the same skills. Those are repository-scope skill locations, not installable plugin packaging, and would duplicate the plugin content during development.
- Do not add empty plugin-root `scripts/`, `assets/`, `hooks/`, `.mcp.json`, `.app.json`, or `.lsp.json` until a real component needs them.
- Do not add Codex custom agents inside the plugin until Codex documents plugin-shipped custom agents.
- Do not publish while `plugins/strike/skills/` is empty. An empty plugin may be useful during setup, but it should never be a release artifact.
- Do not force every host marketplace into one source format. Codex and Claude support more than local string paths, and their valid source objects differ.
