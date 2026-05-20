# Structure Audit

Last checked: 2026-05-19.

This file records the "is this grounded, invented, and idiomatic?" pass for the scaffold.

## Sources Used

- OpenAI Codex: [Agent Skills](https://developers.openai.com/codex/skills), [Plugins](https://developers.openai.com/codex/plugins), [Build plugins](https://developers.openai.com/codex/plugins/build), [Codex app commands](https://developers.openai.com/codex/app/commands), [CLI slash commands](https://developers.openai.com/codex/cli/slash-commands), [Subagents](https://developers.openai.com/codex/subagents), [AGENTS.md](https://developers.openai.com/codex/guides/agents-md)
- Claude Code: [Create plugins](https://code.claude.com/docs/en/plugins), [Plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces), [Plugins reference](https://code.claude.com/docs/en/plugins-reference), [Skills](https://code.claude.com/docs/en/skills), [Subagents](https://code.claude.com/docs/en/sub-agents), [Memory](https://code.claude.com/docs/en/memory)
- GitHub Copilot: [Repository custom instructions](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions), [Agent skills](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills), [Adding agent skills for Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills), [Copilot CLI command reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference), [Copilot CLI plugin reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference)
- Open standard: [Agent Skills specification](https://agentskills.io/specification)

## Decisions

### `plugins/strike/skills/<skill-name>/SKILL.md`

- Grounded in research: Yes.
- Made up or over-structured: No.
- Idiomatic: Yes.

Codex, Claude Code, GitHub Copilot, and the Agent Skills spec all use skill directories containing `SKILL.md`. The shared skill tree is the right source of truth for portable skills. Requiring explicit `name` and `description` frontmatter is this repo's portability policy; Claude Code can infer the name from the directory and treats skill frontmatter fields as optional.

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

### `plugins/strike/references/invocation.md`

- Grounded in research: Yes.
- Made up or over-structured: No.
- Idiomatic: Yes as package guidance for a cross-host workflow.

Claude Code plugin skills use `/plugin-name:skill-name`. Codex app uses `$`
skill mentions and `@` plugin or bundled-skill selection; Codex CLI uses
`/skills` for skill browsing and `/clear` for a fresh chat. GitHub Copilot CLI
documents `/SKILL-NAME` invocation. Strike keeps `/strike:*` only as Claude
Code rendering and records portable handoffs as `Next Strike skill` plus
`Arguments`.

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

### `plugins/strike/plugin.json`

- Grounded in research: Yes.
- Made up or over-structured: No.
- Idiomatic: Yes for GitHub Copilot CLI.

Copilot CLI documents a root `plugin.json` as its primary plugin manifest. It also supports `.claude-plugin/plugin.json`, but keeping the root manifest makes Copilot support explicit and idiomatic.

### `.github/plugin/marketplace.json`

- Grounded in research: Yes.
- Made up or over-structured: No.
- Idiomatic: Yes for GitHub Copilot CLI.

Copilot CLI documents `.github/plugin/marketplace.json` as the preferred marketplace location. It also looks in `.claude-plugin/marketplace.json`, but the GitHub path makes this repo directly idiomatic for Copilot CLI.

### `plugins/strike/agents/`

- Grounded in research: Yes, when we actually ship agents.
- Made up or over-structured: An empty committed folder would be premature.
- Idiomatic: Yes when populated with host-supported agent files.

Claude Code and Copilot CLI both use plugin-root `agents/`. Codex custom agents currently live in `.codex/agents/` or `~/.codex/agents/`, not inside Codex plugins. For cross-host agents, prefer `agents/<agent-name>.agent.md`; Copilot requires `.agent.md`, and Claude Code accepts Markdown agent files.

### `AGENTS.md`

- Grounded in research: Yes.
- Made up or over-structured: No.
- Idiomatic: Yes.

Codex documents `AGENTS.md` as repository guidance, GitHub Copilot docs also recognize `AGENTS.md` for agent instructions, and the `agentsmd/agents.md` site describes it as an open format for coding agents.

### `CLAUDE.md`

- Grounded in research: Yes.
- Made up or over-structured: No.
- Idiomatic: Yes.

Claude Code documents repository memory at `./CLAUDE.md`. This repo keeps it as a thin import of `@AGENTS.md` so there is one canonical instruction source.

### `.github/copilot-instructions.md`

- Grounded in research: Yes.
- Made up or over-structured: No.
- Idiomatic: Yes for GitHub Copilot repository-wide custom instructions.

GitHub documents `.github/copilot-instructions.md` as repository-wide custom instructions. This file stays thin and points conceptually to `AGENTS.md`.

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

The hosts provide some validation, but not one command that checks the combined Codex, Claude, Copilot, and Agent Skills layout. `pnpm run validate` is repo-local quality control, not a host-schema validator or proof of publishability. It intentionally enforces some stricter repo policies, such as version alignment, Codex skill metadata presence, Agent Skills reference-schema frontmatter fields, space-separated `allowed-tools`, explicit host invocation guidance in skills, known next-skill handoff targets, balanced Markdown fences, and host-neutral Strike handoffs in skills and stage contracts, even when a host schema marks equivalent fields optional. Use `pnpm run validate:publish`, `pnpm run validate:skills-ref`, and host-native validators before release.

2026-05-19 update: the space-separated `allowed-tools` validator follows the
Agent Skills specification and Claude Code docs. GitHub Copilot CLI docs also
show and document its own `allowed-tools` handling, including CLI-specific
string or array forms, so Copilot behavior should stay on the smoke-test list
until the installed `copilot` CLI can validate the packaged skills directly.

## Things We Should Not Add By Default

- Do not add `.agents/skills`, `.claude/skills`, or `.github/skills` copies of the same skills. Those are repository-scope skill locations, not installable plugin packaging, and would duplicate the plugin content during development.
- Do not add empty plugin-root `scripts/`, `assets/`, `hooks/`, `.mcp.json`, `.app.json`, or `.lsp.json` until a real component needs them.
- Do not add Codex custom agents inside the plugin until Codex documents plugin-shipped custom agents. For now, plugin `agents/` is for Claude Code and Copilot CLI compatibility.
- Do not publish while `plugins/strike/skills/` is empty. An empty plugin may be useful during setup, but it should never be a release artifact.
- Do not force every host marketplace into one source format. Codex, Claude, and Copilot all support more than local string paths, and their valid source objects differ.
