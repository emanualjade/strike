# Strike

Strike is a skills plugin that helps an AI coding agent move Project work from
a rough idea to a planned, built, reviewed, accepted, and remembered change.

It gives your agent a repeatable workflow. You start a project card, ask Strike
what should happen next, and then move through planning, research, specification,
implementation, review, readiness, and retro steps.

A Project is one unit of work Strike plans inside your existing repository. It
can be tiny, like `Docs Refresh`, or broad, like `Payments`; it is not a new
repo. A larger Project spec can include multiple smaller capabilities or product
features.

Strike stores its working notes in the repository where you use it:

```text
docs/strike/board/
docs/strike/cards/
```

## Auto Strike

Strike also includes `auto-strike`, a standalone utility skill for moving a
fuzzy idea toward a working MVP without the full board/card workflow.

Use it when you want the agent to create a root `auto-strike/` workspace, refine
the idea, research where useful, write an initiative spec, split the initiative
into delivery phases with `phase-spec.md` files, then build and review small
slices inside each phase.

Auto Strike's planning shape is:

```text
auto-strike/initiatives/<initiative-slug>/spec.md
auto-strike/initiatives/<initiative-slug>/phases/<phase-slug>/phase-spec.md
auto-strike/initiatives/<initiative-slug>/phases/<phase-slug>/slices/slice-0-[name].md
```

Example:

```text
auto-strike Build an MVP web app where a user can upload a video, extract the content, and re-edit it into something funny.
```

Run Strike from the repo root you want the agent to work on.

## Before You Install

You need one of these AI coding tools:

- Codex
- Claude Code

You also need Node.js 18 or newer available as `node`. Strike uses bundled
deterministic Node scripts for card and filename setup.

## Install Strike

Choose the install path that matches the host and scope you want.

| Host | Scope | Use When |
| --- | --- | --- |
| Codex | Global | You want Strike available across your Codex setup. |
| Codex | One repository | You want Strike available only from one repository. |
| Claude Code | User | Personal install across all repositories. |
| Claude Code | Repository shared | Shared install for everyone using one repository. |
| Claude Code | Repository private | Personal install in one repository only. |

Claude Code also has a managed scope for administrator-controlled plugins. It
is not a normal user install path, so this README does not list commands for it.

<details>
<summary>Install globally in Codex</summary>

Use this when you want Strike available across your local Codex setup,
including Codex CLI and Codex Desktop.

Run these terminal commands:

```bash
codex plugin marketplace add emanualjade/strike --ref main --sparse .agents/plugins --sparse plugins/strike
codex plugin add strike@strike
codex plugin list --marketplace strike
```

`codex plugin marketplace add` registers the Strike marketplace.
`codex plugin add strike@strike` installs and enables the Strike plugin from
that marketplace. The selector format is `plugin-name@marketplace-name`.

Strike's bundled skills are installed with the plugin. Do not install the
individual Strike skills separately.

For Codex CLI, start a fresh Codex session from the repo where you want Strike
to work:

```bash
cd /path/to/your/repo
codex
```

Inside Codex CLI, you can inspect plugins and skills with:

```text
/plugins
/skills
```

For Codex Desktop, open the workspace:

```bash
cd /path/to/your/repo
codex app "$PWD"
```

If Codex Desktop was already running, fully quit and relaunch it before testing
Strike. Closing the window may leave the app process alive; use **Cmd+Q** on
macOS or quit Codex from the Windows system tray. Then start a new blank thread
from the workspace.

Invoke Strike with `@Strike`, or invoke a bundled skill explicitly with `$`.
For example:

```text
$auto-strike Build an MVP for this idea: ...
$start Add user profile page
```

</details>

<details>
<summary>Install in one Codex repository</summary>

Use this when one repository should offer Strike through its own Codex plugin
catalog.

Codex repository marketplaces are added by creating or editing this file in the
repo root:

```text
.agents/plugins/marketplace.json
```

If your repository already has this file, add the Strike plugin entry to the
existing `plugins` list instead of replacing the file.

For a repository that does not already have `.agents/plugins/marketplace.json`,
create the directory:

```bash
mkdir -p .agents/plugins
```

Then create `.agents/plugins/marketplace.json` with this content. Replace the
top-level `name` with a unique kebab-case catalog name for your repository; that
name is the marketplace name used by Codex. Strike is just one entry in the
`plugins` list.

```json
{
  "name": "example-project-plugins",
  "interface": {
    "displayName": "Example Project Plugins"
  },
  "plugins": [
    {
      "name": "strike",
      "source": {
        "source": "git-subdir",
        "url": "https://github.com/emanualjade/strike.git",
        "path": "./plugins/strike",
        "ref": "main"
      },
      "policy": {
        "installation": "AVAILABLE",
        "authentication": "ON_INSTALL"
      },
      "category": "Coding"
    }
  ]
}
```

For the plugin browser flow, fully restart Codex, open Codex from this same repo
root, then open the plugin browser and install Strike from your repository
marketplace:

```bash
codex
```

```text
/plugins
```

For a deterministic CLI install from that repository marketplace, register the
repo root as a local marketplace source first:

```bash
cd /path/to/your/repo
codex plugin marketplace add "$PWD"
codex plugin add strike@example-project-plugins
codex plugin list --marketplace example-project-plugins
```

Use the marketplace name from your own `.agents/plugins/marketplace.json`; do
not use `strike@strike` unless the marketplace name is actually `strike`.

After installing, fully quit and relaunch Codex Desktop if you use the desktop
app, then start a new blank thread from the same repo root.

</details>

<details>
<summary>Install Claude Code user scope</summary>

Run these terminal commands:

```bash
claude plugin marketplace add emanualjade/strike --sparse .claude-plugin plugins --scope user
claude plugin install strike@strike --scope user
```

Claude Code user scope makes Strike available for you across all repositories.

After installing, run this app prompt inside Claude Code to activate Strike:

```text
/reload-plugins
```

</details>

<details>
<summary>Install Claude Code repository scope, shared</summary>

Run these terminal commands from the repo root:

```bash
claude plugin marketplace add emanualjade/strike --sparse .claude-plugin plugins --scope project
claude plugin install strike@strike --scope project
```

Claude Code `project` scope writes shared plugin settings to
`.claude/settings.json`. Commit those settings only when you want collaborators
to get the same Strike setup.

After installing, run this app prompt inside Claude Code to activate Strike:

```text
/reload-plugins
```

</details>

<details>
<summary>Install Claude Code local scope, private</summary>

Run these terminal commands from the repo root:

```bash
claude plugin marketplace add emanualjade/strike --sparse .claude-plugin plugins --scope local
claude plugin install strike@strike --scope local
```

Claude Code local scope writes personal repository settings to
`.claude/settings.local.json`, which should stay out of source control.

After installing, run this app prompt inside Claude Code to activate Strike:

```text
/reload-plugins
```

</details>

## Update Strike

<details>
<summary>Update Codex</summary>

For a global Codex install, refresh the marketplace snapshot and then reinstall
Strike from that refreshed snapshot:

```bash
codex plugin marketplace upgrade strike
codex plugin add strike@strike
codex plugin list --marketplace strike
```

`marketplace upgrade` refreshes the configured Git marketplace. `plugin add`
refreshes the installed Strike plugin cache and leaves Strike enabled.

For a repository marketplace, run the install command again with that
repository's marketplace name:

```bash
cd /path/to/your/repo
codex plugin add strike@example-project-plugins
codex plugin list --marketplace example-project-plugins
```

After updating, fully quit and relaunch Codex Desktop if you use the desktop
app, then start a new blank thread. In Codex CLI, exit the current session and
start a fresh one from the repo root.

If the install still looks stale, force a clean reinstall:

```bash
codex plugin remove strike@strike
codex plugin marketplace upgrade strike
codex plugin add strike@strike
codex plugin list --marketplace strike
```

</details>

<details>
<summary>Update Claude Code</summary>

Claude Code keeps a local marketplace clone and a versioned plugin cache under
`~/.claude/plugins/`. Refresh the marketplace first so Claude can see the latest
Strike version, then update the installed plugin for the scope where you use it.

For a user-scope install, run these terminal commands:

```bash
claude plugin marketplace update strike
claude plugin update strike@strike --scope user
```

For a Claude Code `project`-scope install, run these terminal commands from the repo root:

```bash
claude plugin marketplace update strike
claude plugin update strike@strike --scope project
```

For a local-scope install, run these terminal commands from the repo root:

```bash
claude plugin marketplace update strike
claude plugin update strike@strike --scope local
```

After updating, run this app prompt inside Claude Code to activate the update:

```text
/reload-plugins
```

To confirm the active installed version, run:

```bash
claude plugin list --json
```

Old version directories may remain in `~/.claude/plugins/cache/` for up to 7
days. That does not matter unless `claude plugin list --json` still shows Strike
using the old version.

</details>

After updating Strike in any host, rerun `init` from each repository where you
use Strike if you need to refresh Strike-managed runtime files under
`strike/customize/system/`. Existing user customization files under
`strike/customize/user/` are preserved.

## Codex Troubleshooting

<details>
<summary>Strike marketplace appears, but Strike is not installed</summary>

Check the marketplace and install the plugin:

```bash
codex plugin list --marketplace strike
codex plugin add strike@strike
codex plugin list --marketplace strike
```

For a repository marketplace, replace `strike` with the marketplace name from
that repository's `.agents/plugins/marketplace.json`.

</details>

<details>
<summary>Strike is installed, but skills do not appear</summary>

Start a fresh session after installing or updating. Codex loads skills when a
thread starts, so an already-open thread can keep the old skill list.

For Codex CLI:

```bash
cd /path/to/your/repo
codex
```

Then inspect:

```text
/plugins
/skills
```

For Codex Desktop, fully quit and relaunch the app, then open a new blank
thread from the repo root. If the plugin browser still looks stale, open
`/plugins`, toggle Strike off and back on, quit and relaunch Codex Desktop, then
start another new thread.

</details>

<details>
<summary>Clean reinstall in Codex</summary>

Use this when an update still appears stale after a normal refresh:

```bash
codex plugin remove strike@strike
codex plugin marketplace remove strike
codex plugin marketplace add emanualjade/strike --ref main --sparse .agents/plugins --sparse plugins/strike
codex plugin add strike@strike
codex plugin list --marketplace strike
```

Codex does not currently expose a supported `codex --clear-cache` command. The
commands above remove and recreate the supported marketplace and plugin cache
state.

</details>

<details>
<summary>Dogfood Strike from this checkout</summary>

Maintainers can install this local checkout without disturbing a normal
published `strike@strike` install by creating a separate local marketplace
named `strike-dev`. The plugin inside that marketplace is still named `strike`.

```bash
cd /path/to/strike

DEV_MARKETPLACE="$HOME/.codex/strike-dev-marketplace"
mkdir -p "$DEV_MARKETPLACE/.agents/plugins" "$DEV_MARKETPLACE/plugins"
ln -sfn "$PWD/plugins/strike" "$DEV_MARKETPLACE/plugins/strike"
cat > "$DEV_MARKETPLACE/.agents/plugins/marketplace.json" <<'JSON'
{
  "name": "strike-dev",
  "interface": {
    "displayName": "Strike Dev"
  },
  "plugins": [
    {
      "name": "strike",
      "source": {
        "source": "local",
        "path": "./plugins/strike"
      },
      "policy": {
        "installation": "AVAILABLE",
        "authentication": "ON_INSTALL"
      },
      "category": "Coding"
    }
  ]
}
JSON

codex plugin marketplace add "$DEV_MARKETPLACE"
codex plugin add strike@strike-dev
codex plugin list --marketplace strike-dev
```

Use `strike@strike` for the published GitHub install and `strike@strike-dev`
for this local checkout. After local edits, run `codex plugin add
strike@strike-dev` again, then restart Codex and start a new thread.

</details>

<details>
<summary>Codex web and workspace sharing</summary>

A local CLI or Desktop install does not automatically publish Strike to Codex
web/cloud. Until public Plugin Directory publishing is available, share a local
plugin through the Codex app: open **Plugins**, go to **Created by you**, open
Strike, select **Share**, and invite workspace members or copy a share link.
Recipients can install it from **Shared with you**.

</details>

## Uninstall Strike

<details>
<summary>Uninstall Codex</summary>

Remove the installed plugin:

```bash
codex plugin remove strike@strike
```

Or open the Codex plugin browser:

```text
/plugins
```

Select Strike, then choose **Uninstall plugin**.

If you added the global Strike marketplace, remove it:

```bash
codex plugin marketplace remove strike
```

If you installed the local development marketplace from this repo, remove it:

```bash
codex plugin remove strike@strike-dev
codex plugin marketplace remove strike-dev
```

If you added Strike to a repository marketplace, edit or delete:

```text
.agents/plugins/marketplace.json
```

Delete the file if it only lists Strike. If it lists other plugins, remove only
the Strike entry from `plugins`.

Strike project files stay in `docs/strike/` until you delete them.

</details>

<details>
<summary>Uninstall Claude Code</summary>

From the repo root, run only the uninstall command for the scope you installed:

```bash
claude plugin uninstall strike@strike --scope user
claude plugin uninstall strike@strike --scope project
claude plugin uninstall strike@strike --scope local
```

Remove the Strike marketplace. This also uninstalls Strike plugins installed
from that marketplace:

```bash
claude plugin marketplace remove strike
```

Verify:

```bash
claude plugin list
claude plugin marketplace list
```

Refresh active Claude Code plugins:

```text
/reload-plugins
```

Strike project files stay in `docs/strike/` until you delete them.

</details>

## Start A Project

Before running normal Strike workflow skills in a repository, initialize Strike
once from that repo root.

Claude Code:

```text
/strike:init
```

Codex:

```text
$init
```

`init` installs or refreshes Strike-managed runtime files under
`strike/customize/system/` and creates user customization files under
`strike/customize/user/`.

In Claude Code, use the Strike command form:

```text
/strike:start Add CSV export --description Let users export a CSV report.
```

In Codex, use the skill shortcut. The short form is:

```text
$start Add CSV export --description Let users export a CSV report.
```

The namespaced form also works if Codex shows or inserts it:

```text
$strike:start Add CSV export --description Let users export a CSV report.
```

Codex can also let you choose an installed plugin or bundled skill with `@`;
select Strike's `start` skill and pass the same arguments.

`start` creates a short slug automatically. Common leading task verbs are
dropped, so `Add CSV export` becomes `csv-export`. You can still pass
`--slug <slug>` when you want to choose the slug yourself.

Supported `start` options:

| Option | Meaning |
| --- | --- |
| `--description <text>` | Saves a short description in the card. If omitted, Strike writes a placeholder. |
| `--slug <slug>` | Chooses the card slug yourself. Strike still sanitizes, shortens, and deduplicates it. |

After the card is created, ask Strike what to do next.

Claude Code:

```text
/strike:go csv-export
```

Codex:

```text
$go csv-export
```

Strike will tell you the next skill to run and the arguments to use.

## Between Strike Steps

Strike is designed to reset context between most workflow steps.

That matters because each skill should start with the saved card files, not a
long chat history from earlier planning. This keeps the context window smaller
and helps review, build, and readiness steps stay independent.

When Strike shows this:

```text
Reset context first: yes
Next Strike skill: spec
Arguments: csv-export
```

reset the host conversation before running the next skill.

In Claude Code, type this app prompt:

```text
/clear
```

Then run the next Strike command:

```text
/strike:spec csv-export
```

Do not run `/clear` as a shell command. Type it inside Claude Code.

In Codex CLI, `/clear` starts a fresh chat in the same session. In the Codex
app, start a new thread from the same repo root. Then use the next Strike skill
shortcut:

```text
$spec csv-export
```

## Example Project Run

Here is what a small Claude Code run might look like from start to finish.
Assume the project slug is `csv-export`.

```text
/strike:init
/strike:start Add CSV export --description Let users export a CSV report.
/clear
/strike:brainstorm csv-export
/clear
/strike:grill csv-export
/clear
/strike:research csv-export
/clear
/strike:spec csv-export
/clear
/strike:spec-review csv-export
/clear
/strike:slice csv-export
/clear
/strike:slice-review csv-export
```

After slicing, Strike usually works phase by phase. The exact phase slug comes
from the phase files Strike creates.

```text
/clear
/strike:phase-research csv-export phase:export-query
/clear
/strike:phase-plan csv-export phase:export-query
/clear
/strike:phase-build csv-export phase:export-query
/clear
/strike:phase-review csv-export phase:export-query
```

Repeat the phase commands for each remaining phase. When all phases are built
and reviewed, finish the project:

```text
/clear
/strike:readiness-review csv-export
/clear
/strike:retro csv-export
```

This is the happy path. Strike may send you backward when it finds missing
decisions, research gaps, review findings, or readiness failures. In that case,
follow the `Next Strike skill` handoff it gives you.

In Codex, use the same skill names and arguments with `$` skill shortcuts. The
short form is usually enough:

```text
$spec csv-export
$phase-build csv-export phase:export-query
```

If Codex shows namespaced Strike skills, the namespaced form also works:

```text
$strike:spec csv-export
$strike:phase-build csv-export phase:export-query
```

## All Skills

Canonical Strike skill names are not prefixed. Host syntax may add a namespace,
such as `/strike:` in Claude Code or `$strike:` in Codex when Codex inserts it.

Strike prompts mostly use plain positional arguments. `start` is the only
normal user-facing skill with double-dash options today:

```text
init
customize list|check-setup|review-instructions <entry|all>|preview <supported-skill>
start <project name words> [--slug <slug>] [--description <description words>]
```

Phase skills use a named token instead of a dash flag:

```text
phase-build <project-slug> phase:<phase-slug>
```

Some skills accept one optional plain word, such as `research <project-slug>
skip` or `go <project-slug> verbose`.

- `init`: initialize or refresh Strike repo-local runtime and customization
  files.
- `customize`: list files, check setup, review instructions, or preview
  runtime customization for supported skills and review lenses.
- `start`: create a new project card.
- `go`: inspect the board and recommend the next step.
- `brainstorm`, `grill`, `research`: shape and pressure-test the idea.
- `spec`, `spec-review`: write and review the project specification.
- `slice`, `slice-review`: split the project into buildable phases.
- `phase-research`, `phase-plan`, `phase-build`, `phase-review`, `phase-fix`:
  work through one implementation phase at a time.
- `readiness-review`: check whether the assembled project is ready against the
  spec.
- `retro`: record what happened and move ready work to done.
- `language`: keep repo terminology consistent.
- `demo`: create a small planning demo for a card.

## Customize Strike

You can customize each step in Strike so it works the way you like in this
repo. Give Strike extra instructions for how to brainstorm, research, write
specs, review, plan phases, build, fix, make demos, or handle project language.

For example, you can tell Strike:

- how direct or exploratory brainstorm should be
- what kind of evidence research should look for
- how detailed specs should be
- what planning style you prefer
- how strict build verification and readiness review should be
- what focused review lenses should check
- what tone or terminology to use in this repo

Strike still follows its normal workflow, required files, checks, and stage
gates. Your customization gives it extra guidance for how to do the work.

### How To Customize

Initialize Strike in the repo:

```text
init
```

Then edit user customization files under:

```text
strike/customize/user/
```

Start with:

```text
strike/customize/user/global/global.md
strike/customize/user/brainstorm/brainstorm.md
strike/customize/user/spec/spec.md
strike/customize/user/phase-review/phase-review.md
```

Write your instructions in the matching file. Each folder also includes a
`how-to-customize-*.md` guide with ideas for what to write.
Strike-managed loader files live under `strike/customize/system/`; rerun
`init` after updating Strike if you need to refresh them.

Review skills can also load optional read-only lens files, such as:

```text
strike/customize/user/phase-review/reviews/accessibility.md
strike/customize/user/readiness-review/reviews/release-readiness.md
```

Each lens is an extra review perspective. The active Strike skill still owns
writes, board movement, and final synthesis.

If you want Strike to create extra docs or assets, tell it whether they are for
one project or shared across projects, and give it a save path. Handy defaults
are `strike/user-docs/<project-slug>/<skill>/...` for project notes and
`strike/user-docs/shared/...` for shared notes.

Check that the setup is healthy:

```text
customize check-setup
```

Ask Strike to review whether your instructions are safe for the workflow:

```text
customize review-instructions global
customize review-instructions brainstorm
customize review-instructions all
```

## Troubleshooting

If GitHub says the repository cannot be found, you probably do not have access
to the repository yet, or your tool is not authenticated with GitHub.

If Strike is installed but the skills are not available, restart the host tool.
For Codex, also check `/plugins` to make sure Strike is enabled. For Claude Code,
you can run this terminal command:

```bash
claude plugin list
```

If Strike says there is no board or card, run `start` first from the repo root
where you want Strike to create `docs/strike/`.

If an update does not seem to change anything, make sure a newer Strike release
has actually been published. Some hosts only treat a plugin as updated after its
version changes.

For Claude Code, uninstalling and reinstalling a plugin does not necessarily
refresh a stale marketplace cache. If `claude plugin list --json` shows an old
Strike version, run:

```bash
claude plugin marketplace update strike
claude plugin update strike@strike --scope project
```

Replace `project` with `user` or `local` if that is where Strike is installed.

## License

MIT.
