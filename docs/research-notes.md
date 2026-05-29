# Research Notes

Checked on 2026-05-19.

## Portable Skills

The [Agent Skills specification](https://agentskills.io/specification) defines skills as directories containing `SKILL.md`, with optional `references/`, `scripts/`, and `assets/` folders. It emphasizes progressive disclosure: short frontmatter for discovery, concise main instructions, and deeper resources loaded only when needed.

The repo follows that model by keeping production skills under `plugins/strike/skills/<skill-name>/SKILL.md` and keeping templates outside `skills/`. It also requires explicit `name` and `description` frontmatter as portable repo policy, even where a host can infer or omit some metadata.

The Strike plugin also keeps shared board/workflow references under
`plugins/strike/references/`. Those files are package support material for
skills to cite explicitly; they are not treated as a host-discovered component
directory.

2026-05-20 reference-validation update: the
[Agent Skills specification](https://agentskills.io/specification) defines the
portable frontmatter fields as `name`, `description`, `license`,
`compatibility`, `metadata`, and experimental `allowed-tools`, and documents
`skills-ref validate` as the reference validator. The
[Claude Code skills docs](https://code.claude.com/docs/en/skills) separately
support host-specific fields such as `argument-hint`,
`disable-model-invocation`, and `user-invocable`. `disable-model-invocation` is
specifically useful for workflows with side effects or manual timing, which
matches Strike's slash-invoked workflow skills.

The current `skills-ref` validator has no host-extension allowlist and rejects
those useful Claude fields at top level. A small survey of active
Claude-oriented skill repositories also showed top-level host fields in common
use rather than hiding them under `metadata`: Anthropic's official plugin
examples use fields such as `argument-hint`, `user-invocable`, and `version`;
Matt Pocock's skills use `disable-model-invocation`; Daymade's Claude Code
skills use fields such as `context`, `agent`, and `argument-hint`. Strike
therefore keeps useful Claude fields in the shared shipped skills and does not
make `skills-ref` a release gate unless it gains extension support or Strike
adds a separate reference-only package projection.

## Customization Imports

2026-05-18 customization audit: do not treat `!strike/customize/...` as a
portable `SKILL.md` import. Codex Agent Skills and the Agent Skills
specification document `SKILL.md` plus referenced
supporting files; they do not define a shared `!` file-include syntax. Claude
Code skills document `!` as dynamic shell context injection, not a plain file
include, and that behavior is host-specific. Strike therefore uses a bundled
deterministic loader script for repo-local customization in portable skills.
Host-specific generated skill builds may reconsider Claude-only `!` injection
later, but it is not the shared source of truth.

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

2026-05-18 update/cache audit: Claude's [marketplace docs](https://code.claude.com/docs/en/plugin-marketplaces)
say users refresh a marketplace with `claude plugin marketplace update`, and the
[plugin reference](https://code.claude.com/docs/en/plugins-reference) says
marketplace plugins are copied into `~/.claude/plugins/cache`, each installed
version is stored in a separate directory, and previous version directories are
marked orphaned and removed automatically later. The docs also say Claude uses
the resolved plugin version as the cache key and skips updates when the resolved
version matches the installed one. A disposable fresh install of Strike from the
public GitHub marketplace resolved `strike@strike` to the then-current
`0.1.16`, while an older local marketplace cache in this machine still
contained `0.1.0`; therefore Strike docs should direct Claude users to run
marketplace update before plugin update when checking for a new release.

## Codex

OpenAI documents `AGENTS.md` as the repository-level instruction file for Codex in the [Codex AGENTS.md guide](https://developers.openai.com/codex/guides/agents-md). The [Codex plugin docs](https://developers.openai.com/codex/plugins/build) define a `.codex-plugin/plugin.json` manifest and a repo marketplace at `.agents/plugins/marketplace.json`, with entries pointing to `./plugins/<plugin-name>`.

The repo keeps `AGENTS.md` as the canonical agent guidance file and adds
`CLAUDE.md` as a thin pointer. Current Codex CLI commands manage marketplaces;
plugin install and enable flows happen through the Codex plugin browser. Codex
app docs say `$` invokes skills and enabled skills appear in the slash command
list; Codex plugin docs also say `@` can invoke a plugin or bundled skill
directly. Codex CLI docs document `/skills` for skill browsing and `/clear` for
a fresh chat in the same CLI session.

## Invocation Syntax

Host invocation syntax is not portable. Claude Code plugin skills are
namespaced as `/plugin-name:skill-name`. Codex app documents `$` skill mentions
and `@` plugin/bundled-skill selection, while Codex CLI documents `/skills` and
`/clear`. Codex does not document custom `/strike:*` slash commands for plugin
skills.

Strike therefore treats the stable handoff as `Next Strike skill` plus
`Arguments`, with host-specific rendering documented in
`plugins/strike/references/invocation.md`.

2026-05-25 utility skill note: Agent Skills do not require every skill to be a
Strike board/card workflow step. Standalone utility skills can still live in
`plugins/strike/skills/<skill-name>/SKILL.md` when they are useful as plugin
capabilities and do not participate in `Next Strike skill` handoffs. The repo
validator therefore allows explicitly named standalone utilities, currently
`handoff`, to omit Strike-specific host invocation guidance while still
requiring portable frontmatter and Codex `agents/openai.yaml` metadata.

## Design Decision

This repo is both a marketplace and the plugin source:

- `.agents/plugins/marketplace.json` exposes the plugin to Codex.
- `.claude-plugin/marketplace.json` exposes the plugin to Claude Code.
- `plugins/strike/` contains host manifests, shared workflow references, and one portable skills content tree.

That shape gives us install and update paths for the major hosts while keeping the actual skills singular.

2026-05-28 update: the active installable hosts are Codex and Claude Code,
while the shared `SKILL.md` tree remains portable Agent Skills-style content.

2026-05-18 accuracy audit: The Agent Skills specification defines
`allowed-tools` as a space-separated string. Strike now keeps shipped skill
frontmatter in that portable form and the repo validator rejects comma-separated
`allowed-tools` values.

## Validation

`pnpm run validate` is a repo-shape smoke test for our combined layout. It is not a substitute for host-native validation or current official docs. It intentionally enforces stricter repo policy for portability and release hygiene in a few places, including explicit skill frontmatter, space-separated `allowed-tools`, version alignment, Codex `agents/openai.yaml` metadata, host invocation references, known next-skill handoff targets, balanced Markdown fences, and avoiding Claude-only `/strike:<skill>` or `/clear` instructions inside portable skill docs and shared stage contracts. Use `pnpm run validate:publish` before release so empty skill packages fail, and then run available host validators such as `claude plugin validate`.

## Package Manager Hardening

2026-05-19 pnpm research pass, updated 2026-05-28: npm registry metadata lists
pnpm `11.4.0` as the current latest release and requires Node `>=22.13`, so
Strike pins `packageManager` and `engines.pnpm` to `11.4.0` while keeping the
repo engine floor at Node `>=22.13`. pnpm 11 documents `minimumReleaseAge`,
`minimumReleaseAgeStrict`, `minimumReleaseAgeIgnoreMissingTime`,
`trustPolicy`, `trustPolicyExclude`, `blockExoticSubdeps`, `allowBuilds`,
`strictDepBuilds`, `engineStrict`, `pmOnFail`, and `verifyDepsBeforeRun` in
`pnpm-workspace.yaml`. Strike uses these settings to delay fresh package
versions, require strict release-age behavior, block transitive exotic package
sources, avoid trust downgrades, require explicit build-script approval,
download and run the declared standalone pnpm version when needed, and fail
instead of auto-installing stale dependencies before `pnpm run`.

pnpm 11 audit docs say `auditConfig.ignoreGhsas` replaces the older
`auditConfig.ignoreCves` filter, so Strike keeps an empty GHSA ignore list
instead of a CVE ignore list.

## GitHub Actions Host Smoke Tests

2026-05-19 research pass: keep the first host smoke workflows manual
(`workflow_dispatch`) and deterministic. GitHub documents manual workflow
dispatch, workflow notifications, logs, failed-step log filtering with
`gh run view --log-failed`, debug re-runs, error annotations, and artifacts for
persisting logs or other diagnostic files after a run.

Claude Code documents npm installation with `@anthropic-ai/claude-code`,
`claude --version`, `DISABLE_AUTOUPDATER`, non-interactive plugin marketplace
commands, `claude plugin validate`, `claude plugin install`, `claude plugin
list --json`, and plugin cache behavior under `~/.claude/plugins/cache`.

Codex documents `codex plugin marketplace add`, `upgrade`, and `remove`, and
the OpenAI Codex CLI repository documents npm installation with `@openai/codex`.
The Codex plugin docs say marketplace plugins are installed into
`~/.codex/plugins/cache/$MARKETPLACE_NAME/$PLUGIN_NAME/$VERSION/` and can be
enabled/disabled, but they do not currently document a Claude-style
non-interactive `codex plugin install` command in the same reference. Therefore
Codex GitHub smoke coverage should start as marketplace-lifecycle coverage and
must not be described as full non-interactive plugin install coverage until a
documented command path is confirmed and tested.

2026-05-20 update: Codex CLI `0.131.0` exposes `codex plugin add
<plugin@marketplace>` and `codex plugin remove <plugin@marketplace>` in
`codex plugin --help`. A disposable temp-home probe with `CODEX_HOME` isolated
confirmed that `codex plugin add strike@strike` installs Strike into
`$CODEX_HOME/plugins/cache/strike/strike/0.7.0` with the expected
`.codex-plugin/plugin.json`, shared references, scripts, and skill files. The
host smoke workflow can therefore add deterministic installed-runtime coverage
for Codex without opening an interactive Codex session or invoking a model.

2026-05-19 best-practice note: Claude has the richest native validation and CI
surface for plugin smoke tests. Use `claude plugin validate`, JSON list output,
and documented plugin-cache environment variables such as
`CLAUDE_CODE_PLUGIN_CACHE_DIR`, `CLAUDE_CODE_PLUGIN_PREFER_HTTPS`,
`CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS`, and
`CLAUDE_CODE_DISABLE_OFFICIAL_MARKETPLACE_AUTOINSTALL`. Codex should use a temp
`HOME` and documented marketplace lifecycle commands until the install/enable
command surface is clearer.

2026-05-19 local tooling probe: Claude Code `2.1.144` and Codex CLI `0.130.0`
were available locally. With `HOME`, `XDG_CACHE_HOME`, and `XDG_CONFIG_HOME`
set to temp directories, Claude
successfully ran `claude plugin validate .`, `claude plugin validate
./plugins/strike`, marketplace add, `plugin install strike@strike`, JSON list,
update, uninstall, and marketplace remove without touching the maintainer's real
home directory. The installed cache contained `.claude-plugin/plugin.json`,
`.codex-plugin/plugin.json`, and all Strike skill `SKILL.md` files under the
temp `CLAUDE_CODE_PLUGIN_CACHE_DIR`. Codex
successfully ran version checks and local marketplace add/remove with temp
`HOME`; on macOS it warned that it would not create helper binaries under the
system temp directory, but exited successfully. `codex plugin marketplace
upgrade strike` failed for a local marketplace because the source is not
Git-backed, so local Codex coverage should be add/remove only while GitHub
coverage can test upgrade from the repository source.

2026-05-19 PR hardening decision: host smoke workflows now keep
`workflow_dispatch` and add `pull_request`, matching GitHub Actions' documented
event syntax for workflows that need both manual and PR-triggered execution.
The first PR-triggered phase intentionally uses no path filters so every PR can
exercise the fresh target CLI install paths. Each host workflow keeps its own
job and cancel-in-progress concurrency so Claude Code and Codex failures remain
independently diagnosable.

## Codex Skill Invocation

2026-05-25 dogfood note: OpenAI's Codex skills documentation describes explicit
skill invocation with `$skill-name` and says `agents/openai.yaml` can set
`policy.allow_implicit_invocation`. A pre-release Codex CLI dogfood run
installed Strike `0.8.8` successfully, but `auto-strike` was not advertised to
the model while every Strike skill used `allow_implicit_invocation: false`.
Auto Strike is the primary user-invoked standalone workflow, so its Codex
metadata now keeps it visible with `allow_implicit_invocation: true` plus
`interface` display metadata, while the smaller board/card step skills remain
manual-only. Source checked: https://developers.openai.com/codex/skills
