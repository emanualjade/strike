# Research Notes

Checked on 2026-05-18.

## Portable Skills

The [Agent Skills specification](https://agentskills.io/specification) defines skills as directories containing `SKILL.md`, with optional `references/`, `scripts/`, and `assets/` folders. It emphasizes progressive disclosure: short frontmatter for discovery, concise main instructions, and deeper resources loaded only when needed.

The repo follows that model by keeping production skills under `plugins/strike/skills/<skill-name>/SKILL.md` and keeping templates outside `skills/`. It also requires explicit `name` and `description` frontmatter as portable repo policy, even where a host can infer or omit some metadata.

The Strike plugin also keeps shared board/workflow references under
`plugins/strike/references/`. Those files are package support material for
skills to cite explicitly; they are not treated as a host-discovered component
directory.

## Claude Code

[Claude Code plugin docs](https://code.claude.com/docs/en/plugins) describe plugins as GitHub or local packages with a `.claude-plugin/plugin.json` manifest. The [plugin reference](https://code.claude.com/docs/en/plugins-reference) lists supported plugin components such as skills and agents. The [marketplace docs](https://code.claude.com/docs/en/plugin-marketplaces) describe `.claude-plugin/marketplace.json` for plugin marketplaces.

Claude Code supports local development with `--plugin-dir` and marketplace installation from GitHub. The docs also call out plugin versions for update behavior, so this repo keeps host plugin versions aligned and bumps versions before publishing meaningful changes.

Claude Code's skill frontmatter fields are optional, with `description` recommended and `name` inferred from the directory when omitted. Claude supports scripts and arbitrary supporting files; `references/` and `assets/` are portable Agent Skills conventions rather than Claude-specific discovery paths.

2026-05-18 update: Claude Code plugin install scope should be documented with
Claude's own scope names: `user`, `project`, `local`, and administrator-managed
`managed`. The [Claude Code plugin reference](https://code.claude.com/docs/en/plugins-reference)
maps `user` to `~/.claude/settings.json`, `project` to
`.claude/settings.json`, `local` to `.claude/settings.local.json`, and
`managed` to read-only managed settings. Marketplace add accepts
`--scope user|project|local`, plugin install/uninstall accept
`--scope user|project|local`, and plugin update also accepts `managed`.
The [marketplace docs](https://code.claude.com/docs/en/plugin-marketplaces)
document marketplace remove as name-based rather than scoped, and say removing a
marketplace also uninstalls plugins installed from it. Strike therefore keeps
per-scope uninstall instructions focused on `claude plugin uninstall ... --scope`
and documents marketplace removal separately as an all-catalog cleanup step.

2026-05-18 uninstall audit: Claude's [discover plugins docs](https://code.claude.com/docs/en/discover-plugins)
describe marketplace use as a two-step process: add the marketplace, then install
individual plugins. The [plugin reference](https://code.claude.com/docs/en/plugins-reference)
documents `claude plugin uninstall <plugin> --scope user|project|local` and says
`--keep-data` preserves the plugin's persistent data directory. The
[marketplace docs](https://code.claude.com/docs/en/plugin-marketplaces) document
`claude plugin marketplace remove <name>` and say the name is the marketplace
name from `marketplace.json`, not the source passed to `add`; removing a
marketplace also uninstalls plugins installed from it. A disposable CLI smoke
test with a temporary home and repository confirmed that project-scope
marketplace add writes `extraKnownMarketplaces`, project-scope plugin install
writes `enabledPlugins`, plugin uninstall removes only `enabledPlugins`, and
marketplace remove clears `extraKnownMarketplaces`.

## Codex

OpenAI documents `AGENTS.md` as the repository-level instruction file for Codex in the [Codex AGENTS.md guide](https://developers.openai.com/codex/guides/agents-md). The local Codex plugin creator guidance in this environment defines a `.codex-plugin/plugin.json` manifest and a repo marketplace at `.agents/plugins/marketplace.json`, with entries pointing to `./plugins/<plugin-name>`.

The repo keeps `AGENTS.md` as the canonical agent guidance file and adds `CLAUDE.md` plus `.github/copilot-instructions.md` as thin pointers. Current Codex CLI commands manage marketplaces; plugin install and enable flows happen through the Codex plugin browser.

## GitHub Copilot CLI

[GitHub Copilot agent skills docs](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills) describe skills as folders of instructions, scripts, and resources using the Agent Skills specification. Copilot supports repository-local skills under `.github/skills`, `.claude/skills`, or `.agents/skills`, but for installable bundles the [Copilot CLI plugin reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference) defines plugins with a root `plugin.json`, default `skills/` and `agents/` directories, and marketplaces at `.github/plugin/marketplace.json`. Copilot CLI also looks in `.claude-plugin/marketplace.json`, but this repo includes the GitHub-native path too.

## Invocation Syntax

Host invocation syntax is not portable. Claude Code plugin skills are
namespaced as `/plugin-name:skill-name`. Codex documents explicit skill use
through `/skills`, `$` skill mentions, and plugin/skill selection; it does not
document custom `/strike:*` slash commands for plugin skills. GitHub Copilot CLI
documents skill invocation as `/SKILL-NAME` and deduplicates plugin skills by
the `name` field inside `SKILL.md`.

Strike therefore treats the stable handoff as `Next Strike skill` plus
`Arguments`, with host-specific rendering documented in
`plugins/strike/references/invocation.md`.

## Design Decision

This repo is both a marketplace and the plugin source:

- `.agents/plugins/marketplace.json` exposes the plugin to Codex.
- `.claude-plugin/marketplace.json` exposes the plugin to Claude Code.
- `.github/plugin/marketplace.json` exposes the plugin to GitHub Copilot CLI.
- `plugins/strike/` contains host manifests, shared workflow references, and one portable skills content tree.

That shape gives us install and update paths for the major hosts while keeping the actual skills singular.

2026-05-18 accuracy audit: The Agent Skills specification defines
`allowed-tools` as a space-separated string. Strike now keeps shipped skill
frontmatter in that portable form and the repo validator rejects comma-separated
`allowed-tools` values.

## Validation

`npm run validate` is a repo-shape smoke test for our combined layout. It is not a substitute for host-native validation or current official docs. It intentionally enforces stricter repo policy for portability and release hygiene in a few places, including explicit skill frontmatter, space-separated `allowed-tools`, version alignment, Codex `agents/openai.yaml` metadata, host invocation references, known next-skill handoff targets, balanced Markdown fences, and avoiding Claude-only `/strike:<skill>` or `/clear` instructions inside portable skill docs and shared stage contracts. Use `npm run validate:publish` before release so empty skill packages fail, and pair it with available host validators such as `claude plugin validate`.
