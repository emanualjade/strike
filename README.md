# Strike

Strike is a cross-agent skills plugin for a board-and-card workflow that turns rough feature ideas into scoped implementation, review, acceptance, and retro artifacts. The repo is shaped so one portable set of `SKILL.md` folders can be installed through Codex, Claude Code, GitHub Copilot CLI, and other Agent Skills-compatible hosts without maintaining separate copies.

For AI agents starting in a fresh context, read `AGENTS.md` first. It records the project direction, source-of-truth paths, validation rules, and lessons learned from the initial research pass.

Ongoing release and validation tasks live in `docs/todo.md`. Release notes live
in `CHANGELOG.md`.

## Structure

```text
.agents/plugins/marketplace.json      # Codex marketplace entry
.claude-plugin/marketplace.json       # Claude Code marketplace entry
.github/plugin/marketplace.json       # GitHub Copilot CLI marketplace entry
plugins/strike/
  plugin.json                         # GitHub Copilot CLI plugin manifest
  .codex-plugin/plugin.json           # Codex plugin manifest
  .claude-plugin/plugin.json          # Claude Code plugin manifest
  skills/                             # Production portable Strike skills
  references/                         # Shared Strike board/workflow references
templates/                            # Starter files, not installed as components
```

## Install During Development

For Claude Code local testing:

```bash
claude --plugin-dir ./plugins/strike
```

For Codex local testing, add this repo as a marketplace, then install from the Codex plugin browser:

```bash
codex plugin marketplace add ./
codex
# then open /plugins and install Strike
```

Codex local path marketplaces are for development install testing. The
`codex plugin marketplace upgrade` command expects a Git-backed marketplace, so
test the update path after installing from the GitHub marketplace.

For GitHub Copilot CLI local testing:

```bash
copilot plugin install ./plugins/strike
```

## Install From GitHub

After the repo is pushed to GitHub, Claude Code users can add the marketplace and install the plugin:

```bash
claude plugin marketplace add emanualjade/strike
claude plugin install strike@strike
```

Codex users can add the marketplace from GitHub and include both the marketplace file and plugin directory:

```bash
codex plugin marketplace add emanualjade/strike --sparse .agents/plugins --sparse plugins
codex
# then open /plugins and install Strike
```

GitHub Copilot CLI users can add the marketplace and install the plugin:

```bash
copilot plugin marketplace add emanualjade/strike
copilot plugin install strike@strike
```

## Invocation

Strike skill names are portable, but command syntax is host-specific:

- Claude Code plugin: `/strike:<skill> <args>`
- Codex: select or mention the installed Strike plugin/skill, or ask Codex to
  use the Strike `<skill>` skill with the same args
- GitHub Copilot CLI: `/<skill> <args>` after confirming the skill is visible
  with `/skills list` or `/skills info`

See `plugins/strike/references/invocation.md` for the shared handoff format.

## Updates

The supported hosts use the GitHub marketplace as the update source once installed from the repo. Bump version fields where the host schema defines them before publishing a release.

```bash
claude plugin marketplace update strike
claude plugin update strike@strike
```

```bash
codex plugin marketplace upgrade strike
# then open /plugins if Codex shows an available plugin update
```

```bash
copilot plugin update strike
```

## Development

Production skills live in `plugins/strike/skills/`. By repo policy, each production skill should include a `SKILL.md` with `name` and `description` frontmatter, even when a host allows looser metadata. Shared Strike workflow references live in `plugins/strike/references/`; skill-specific supporting files should stay inside the relevant skill directory.

Strike writes runtime state to the consuming repository, not the plugin package:

```text
docs/strike/board/
docs/strike/cards/
```

Validate the repo before publishing. The local validator is intentionally stricter than some host schemas where that helps cross-host release hygiene, including skill frontmatter, Codex skill metadata, version alignment, balanced Markdown fences, known next-skill handoff targets, and host-neutral Strike handoffs:

```bash
npm run validate
```

Before release, require real skills and run host-native checks where the host CLI is available:

```bash
npm run validate:publish
claude plugin validate ./plugins/strike
claude plugin validate ./.claude-plugin/marketplace.json
claude plugin tag --dry-run --force ./plugins/strike
```

When the Agent Skills reference validator is installed, also run `skills-ref validate` against each production skill directory.

## License

MIT.
