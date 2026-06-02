# Host Smoke Tests

Last updated: 2026-05-20.

This is the private maintainer playbook for proposed Strike host install smoke
tests. Keep user install instructions in `README.md`; keep experimental workflow
notes here until the checks are stable.

Terminology:

- `target CLI` means Claude Code or Codex.
- `local workstation` means the maintainer's machine.
- `GitHub runner` means the disposable machine running GitHub Actions.

## Branch Policy

Develop host smoke-test workflow changes on a separate branch. Keep
`workflow_dispatch` on every host workflow so maintainers can rerun checks on
demand. During the PR hardening phase, host workflows may also use
`pull_request` so every proposed change proves the target CLI smoke path before
merge.

Do not make a host smoke workflow a required PR check or release gate while it
still depends on uncertain CLI behavior, secrets, UI steps, or live model
conversations.

## Research Baseline

The proposed GitHub workflows should stay inside documented host behavior:

- GitHub Actions supports manual workflows with `workflow_dispatch`, but the
  workflow file must exist on the default branch before it can be triggered
  manually from the UI/API.
- GitHub Actions supports combining `workflow_dispatch` and `pull_request` in a
  workflow's event map. Strike keeps both: manual dispatch for on-demand
  debugging and PR triggers for normal hardening.
- GitHub Actions exposes failures through the Actions tab, notifications for
  completed runs triggered by a user, job logs, failed-step logs, annotations,
  debug re-runs, and downloadable artifacts.
- Claude Code documents npm installation with `@anthropic-ai/claude-code`,
  `claude --version`, `DISABLE_AUTOUPDATER`, `claude plugin validate`,
  non-interactive marketplace commands, `claude plugin install`, JSON list
  output, and plugin cache behavior under `~/.claude/plugins/cache`.
- Codex documents npm installation with `@openai/codex` in the OpenAI Codex
  CLI repository, and documents `codex plugin marketplace add`, `upgrade`, and
  `remove` in the official Codex plugin docs. Codex docs also say marketplace
  plugins are installed into `~/.codex/plugins/cache/...`. Codex CLI `0.131.0`
  exposes `codex plugin add` and `codex plugin remove`, so Strike can exercise
  deterministic installed-plugin runtime checks without opening an interactive
  Codex session.

## Best-Practice Use By Target CLI

Use host-native validation and install surfaces wherever they exist. Do not
normalize all hosts into one invented flow.

## Local Workstation Checks Vs. GitHub Runner Checks

Local workstation checks must assume target CLIs are already installed. They
must not install, update, or authenticate target CLIs. Their job is quick feedback without
touching the maintainer's real `~/.claude`, `~/.codex`, platform
cache directories, or saved credentials.

If a target CLI is missing on the local workstation, Codex should ask the user
to install it manually or suggest running the GitHub workflow. Do not run
`npm install`, `npm install -g`, `npx`, `pnpm install`, `pnpm dlx`, curl installers, host setup flows, or
target CLI auto-update flows from local workstation checks.

Use this split:

| Scope | Local workstation tooling | GitHub runner tooling |
| --- | --- | --- |
| Repo validation | `pnpm run test`, `pnpm run validate`, and `pnpm run validate:publish` before release. | Run the same repo checks from a clean checkout with pnpm before every host smoke. |
| Target CLI availability | Print already-installed target CLI versions only. Do not install target CLIs locally as part of the smoke loop. | Install each target CLI from its documented npm package on a fresh runner and print Node/pnpm/npm/target CLI versions. |
| Claude Code | Run native validators, the marketplace install/update/uninstall lifecycle, and installed runtime checks in a temp `HOME` plus temp `CLAUDE_CODE_PLUGIN_CACHE_DIR`. | Run the same lifecycle after installing latest Claude Code, then upload cache/config/runtime diagnostics on failure. |
| Codex | Run `codex --version`, local marketplace add/list, plugin add/runtime/remove, marketplace remove, and inspect temp `CODEX_HOME/config.toml`. Do not run `upgrade` against a local marketplace; current CLI rejects that because the source is not Git-backed. | Add the marketplace from the GitHub repo source, run `upgrade`, add Strike from that marketplace, run installed runtime checks, remove the plugin, and remove the marketplace. |
| Auth/model behavior | Do not run live model sessions or commands that require host login. | Keep auth/model checks separate, manual, and secret-gated if they are ever added. They should not be required PR checks. |

The local workstation loop is therefore safe and useful, but intentionally
narrower. GitHub runner checks are more exhaustive because they prove fresh
target CLI installation, clean-runner behavior, Git-backed marketplace behavior,
and drift against current published target CLIs.

### Local Environment Pattern

Use the same isolation pattern for every local workstation smoke command:

- create a temp root with `mktemp -d`
- set `HOME`, `XDG_CACHE_HOME`, and `XDG_CONFIG_HOME` inside it
- set target-CLI-specific cache/config variables inside it
- run the target CLI command
- inspect only files under the temp root
- remove the temp root even on failure

Known local findings as of 2026-05-19:

- Claude Code `2.1.144` successfully validates the Strike marketplace and
  plugin package, installs `strike@strike` from this checkout, updates it,
  copies all skill files into the temp plugin cache, uninstalls it, and removes
  the marketplace.
- Codex CLI `0.130.0` successfully uses a temp `HOME` for version checks and
  local marketplace add/remove. On macOS it prints a warning about refusing to
  create helper binaries under the system temp directory; the command still
  exits successfully. Local marketplace `upgrade` fails because the local source
  is not Git-backed, so reserve `upgrade` for GitHub/source-backed checks.
### Local Workstation Commands

Local pnpm scripts are allowed to call `scripts/host-smoke.mjs` only. They must
not install or update target CLIs.

- `pnpm run host:smoke:local`: run every target CLI found on `PATH`; skip missing
  CLIs with a no-install message.
- `pnpm run host:smoke:claude`: run Claude checks only; fail if `claude` is not
  already installed locally.
- `pnpm run host:smoke:codex`: run Codex checks only; fail if `codex` is not
  already installed locally.

### Claude Code

Use the official validator before install:

- `claude plugin validate .` from the marketplace root when checking the whole
  marketplace.
- `claude plugin validate ./plugins/strike` when checking only the Strike
  plugin package.

Use documented plugin management commands for the install lifecycle:

- `claude plugin marketplace add <source> --scope user`
- `claude plugin marketplace list --json`
- `claude plugin install strike@strike --scope user`
- `claude plugin list --json`
- `claude plugin update strike@strike --scope user`
- `claude plugin uninstall strike@strike --scope user`
- `claude plugin marketplace remove strike`

Use documented CI/container environment controls:

- `HOME` pointed at a temp directory, so no runner-level state leaks between
  commands.
- `DISABLE_AUTOUPDATER=1`, to keep CLI self-update noise out of smoke tests.
- `CLAUDE_CODE_DISABLE_OFFICIAL_MARKETPLACE_AUTOINSTALL=1`, so the official
  marketplace is not auto-added during first-run setup.
- `CLAUDE_CODE_PLUGIN_CACHE_DIR=<temp>/claude-plugins`, so marketplace clones
  and plugin caches are isolated and easy to archive.
- `CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1`, so CI does not need SSH agent setup for
  GitHub shorthand sources.
- `CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS=300000` if GitHub-hosted runner network
  slowness causes git operation timeouts.

After install, inspect the cache, not only command output. Claude copies
marketplace plugins into a versioned cache, so the workflow should assert:

- cached `.claude-plugin/plugin.json` has `name: strike`
- cached version matches `package.json`
- representative skill files exist under the cached plugin root
- installed runtime support files exist under the cached plugin root
- installed Strike helper commands, the new state helper bootstrap/next-step
  path, and the demo slug helper run successfully in a temp consumer repository

### Codex

Use documented marketplace lifecycle commands first:

- `codex plugin marketplace add <source>`
- `codex plugin marketplace upgrade strike`
- `codex plugin marketplace remove strike`

Use the current Codex CLI install lifecycle after the marketplace snapshot is
available:

- `codex plugin list --marketplace strike`
- `codex plugin add strike@strike`
- `codex plugin remove strike@strike`

Use a temp `HOME` so Codex writes any config, marketplace, and cache state into
the runner's disposable workspace. Also set `CODEX_HOME` inside the temp root
so a caller's existing Codex config cannot be touched.

After `codex plugin add`, inspect the installed plugin cache, not only command
output:

- cached `.codex-plugin/plugin.json` has `name: strike`
- cached version matches `package.json`
- representative skill files and deterministic runtime support files exist
  under the cached plugin root
- installed Strike helper commands, the new state helper bootstrap/next-step
  path, and the demo slug helper run successfully in a temp consumer repository

## Proposed Workflows

The GitHub Actions host smoke pass should be deterministic. It should check host
CLI installation, marketplace registration, plugin install or refresh behavior
where documented, and installed package contents. It should not invoke a model
or run an interactive agent session.

Current workflows run on `pull_request` and remain manually dispatchable. They
also use cancel-in-progress concurrency per workflow and PR so outdated smoke
runs do not continue after a new commit lands.

| Workflow | File | Trigger | Scope |
| --- | --- | --- | --- |
| Claude Code host smoke | `.github/workflows/host-smoke-claude.yml` | `pull_request`, `workflow_dispatch` | Install Claude Code, validate the marketplace/plugin, install Strike from the checked-out repo marketplace, check cached skills and installed runtime scripts, update, then uninstall. |
| Codex host smoke | `.github/workflows/host-smoke-codex.yml` | `pull_request`, `workflow_dispatch` | Install Codex CLI, verify Git-backed marketplace add/upgrade, install Strike, check installed skills and installed runtime scripts, remove the plugin, and remove the marketplace. |

## Failure Model

Expect failures in five buckets:

- Target CLI install failure: npm registry issue, platform dependency issue,
  package rename, Node version mismatch, or upstream release regression.
- Target CLI command drift: a documented command changes flags or output shape.
- Marketplace/package issue: Strike manifests validate locally but fail under a
  host-native install/cache path.
- GitHub runner/environment issue: transient network, GitHub-hosted runner outage,
  cache/path difference, permissions, or missing system package.
- Auth/model boundary issue: a command unexpectedly requires login, billing, or
  live model access despite being intended as deterministic plugin management.

## Detection And Diagnostics

Each workflow should make failures self-explaining before any automation tries
to repair them:

- Print target CLI versions.
- Print Node/pnpm versions, and print npm on GitHub runners when target CLI
  installation uses npm.
- Use a clean temp home/cache so logs show every file the target CLI created.
- Emit `::error` annotations for missing expected files or skills.
- Upload diagnostic artifacts on failure: host command outputs, marketplace
  lists, installed plugin manifests, runtime consumer-repo trees, and a
  sanitized tree of target CLI config/cache directories.
- Keep command output in step logs and use `gh run view --log-failed` for fast
  inspection.
- Use debug re-runs for runner-level failures rather than guessing.

## Automatic Fix Strategy

Do not let the workflow silently paper over real packaging failures. Automatic
handling should be limited to known transient or diagnostic work:

- Retry only network/package-install steps, and keep retries small.
- Do not retry assertion failures about missing skills, wrong versions, bad
  manifests, or changed command semantics. Those should fail loudly.
- On failure, upload artifacts and optionally create or update a maintainer
  issue only after the workflows are stable enough that noise is low.
- Treat "auto-fix" as a later maintainer workflow that opens an issue or branch
  with evidence. Do not let a smoke test mutate plugin manifests or docs by
  itself.
- If a target CLI requires auth for deterministic plugin commands, move that
  coverage behind explicit repository secrets and keep it manual or scheduled,
  not required on every PR.

## Promotion Path

1. Keep `workflow_dispatch` so any host smoke workflow can be rerun manually.
2. Run host smoke workflows on `pull_request` while command details are being
   ironed out.
3. Fix CLI install, path, cache, and cleanup failures until the workflows are
   reliable.
4. Document any host-specific behavior learned in `docs/research-notes.md` or
   `docs/structure-audit.md`.
5. Only then decide whether to add `push`, `schedule`, release-tag triggers, or
   required-check status.

## What Counts As Passing

For Claude Code and Codex, a passing smoke test should
prove:

- the target CLI installs on a GitHub runner
- a clean temp home/config/cache is used
- the local Strike marketplace can be registered
- `strike` can be installed from that marketplace
- the installed plugin has the expected version from `package.json`
- representative skills and deterministic runtime support files exist in the
  installed plugin copy
- installed `state.mjs init` creates `PROJECT_LANGUAGE.md`,
  `strike/state.json`, and `strike/scripts/state.mjs`; the copied
  workspace helper can report the next workflow step, complete the first check
  with a receipt, then report the following workflow step
- installed `slugify.mjs demo` returns a deterministic demo filename
- update and uninstall commands complete without leaving the workflow broken

## Local Reproduction

Local temp-home runs are in scope as quick, non-polluting diagnostics. They
assume the relevant target CLI is already installed on the local workstation and
should not install or update target CLIs themselves. Docker and `act` remain
optional later debugging tools; they should not be treated as equivalent to
GitHub runner workflow results.

GitHub runner workflow results are the source of truth for release confidence.
