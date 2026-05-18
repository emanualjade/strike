# Strike

Strike is a skills plugin that helps an AI coding agent move Project work from
a rough idea to a planned, built, reviewed, accepted, and remembered change.

It gives your agent a repeatable workflow. You start a project card, ask Strike
what should happen next, and then move through planning, research, specification,
implementation, review, acceptance, and retro steps.

A Project is one unit of work Strike plans inside your existing repository. It
can be tiny, like `Docs Refresh`, or broad, like `Payments`; it is not a new
repo. A larger Project spec can include multiple smaller capabilities or product
features.

Strike stores its working notes in the repository where you use it:

```text
docs/strike/board/
docs/strike/cards/
```

Run Strike from the repo root you want the agent to work on.

## Before You Install

You need one of these AI coding tools:

- Codex
- Claude Code
- GitHub Copilot CLI

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
| GitHub Copilot CLI | CLI user | You want to try the packaged Copilot CLI plugin. |

Claude Code also has a managed scope for administrator-controlled plugins. It
is not a normal user install path, so this README does not list commands for it.

<details>
<summary>Install globally in Codex</summary>

Run this terminal command:

```bash
codex plugin marketplace add emanualjade/strike --sparse .agents/plugins --sparse plugins
```

This registers the Strike marketplace. It does not install Strike into the
current conversation yet.

Open Codex. You can use the Codex app, or run this terminal command:

```bash
codex
```

In the Codex prompt, open the plugin browser:

```text
/plugins
```

Find Strike and install or enable it. After that, start a fresh Codex
conversation and run Strike from the repo root you want it to work on.

</details>

<details>
<summary>Install in one Codex repository</summary>

Use this when one repository should offer Strike, and you do not want to add the
Strike marketplace to your general Codex setup.

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

Then create `.agents/plugins/marketplace.json` with this content. The top-level
`name` and `interface.displayName` describe your repository's plugin catalog;
Strike is just one entry in the `plugins` list.

```json
{
  "name": "my-project-plugins",
  "interface": {
    "displayName": "My Project Plugins"
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

Open Codex from this same repo root. You can use the Codex app, or run this
terminal command from the repo root:

```bash
codex
```

In the Codex prompt, open the plugin browser:

```text
/plugins
```

Find Strike in the repository marketplace and install or enable it. After that,
start a fresh Codex conversation from the same repo root.

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

<details>
<summary>Install in GitHub Copilot CLI</summary>

Copilot CLI support is packaged, but the live Copilot smoke test has not been
completed yet. If you want to try it, run these terminal commands:

```bash
copilot plugin marketplace add emanualjade/strike
copilot plugin install strike@strike
copilot plugin list
```

Before using a Strike skill in Copilot CLI, confirm the visible skill names:

```text
/skills list
```

</details>

## Uninstall Strike

<details>
<summary>Uninstall Codex</summary>

Open the Codex plugin browser:

```text
/plugins
```

Select Strike, then choose **Uninstall plugin**.

If you added the global Strike marketplace, remove it:

```bash
codex plugin marketplace remove strike
```

If you installed Strike from a repository marketplace, edit or delete:

```text
.agents/plugins/marketplace.json
```

Delete the file if it only lists Strike. If it lists other plugins, remove only
the Strike entry from `plugins`.

</details>

<details>
<summary>Uninstall Claude Code</summary>

From the repo root, uninstall any scopes you used:

```bash
claude plugin uninstall strike@strike --scope user
claude plugin uninstall strike@strike --scope project
claude plugin uninstall strike@strike --scope local
```

Remove the Strike marketplace:

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

<details>
<summary>Uninstall from GitHub Copilot CLI</summary>

Run these terminal commands:

```bash
copilot plugin uninstall strike
copilot plugin marketplace remove strike
```

</details>

## Start A Project

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
and helps review, build, and acceptance steps stay independent.

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

Do not run `/clear` in your terminal. It is a Claude Code app prompt.

In Codex, start a fresh conversation from the same repo root, then use the
next Strike skill shortcut:

```text
$spec csv-export
```

In GitHub Copilot CLI, start a fresh Copilot CLI session if there is no visible
context-reset command, then run the next Strike skill from the same repo root.

## Example Project Run

Here is what a small Claude Code run might look like from start to finish.
Assume the project slug is `csv-export`.

```text
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
/strike:accept csv-export
/clear
/strike:retro csv-export
```

This is the happy path. Strike may send you backward when it finds missing
decisions, research gaps, review findings, or acceptance failures. In that case,
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

Strike prompts mostly use plain positional arguments. `start` is the only
normal user-facing skill with double-dash options today:

```text
start <project name words> [--slug <slug>] [--description <description words>]
```

Phase skills use a named token instead of a dash flag:

```text
phase-build <project-slug> phase:<phase-slug>
```

Some skills accept one optional plain word, such as `research <project-slug>
skip` or `go <project-slug> verbose`.

- `start`: create a new project card.
- `go`: inspect the board and recommend the next step.
- `brainstorm`, `grill`, `research`: shape and pressure-test the idea.
- `spec`, `spec-review`: write and review the project specification.
- `slice`, `slice-review`: split the project into buildable phases.
- `phase-research`, `phase-plan`, `phase-build`, `phase-review`, `phase-fix`:
  work through one implementation phase at a time.
- `accept`: check the assembled project against the spec.
- `retro`: record what happened and move accepted work to done.
- `language`: keep repo terminology consistent.
- `demo`: create a small planning demo for a card.

## Update Strike

<details>
<summary>Update Codex</summary>

For a global Codex marketplace, run this terminal command:

```bash
codex plugin marketplace upgrade strike
```

Then open Codex and check `/plugins` if Codex shows an available plugin update.

For a repository Codex marketplace, open Codex from that repo root and check
`/plugins`.

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

Old version directories may remain in `~/.claude/plugins/cache/` for a while.
That does not matter unless `claude plugin list --json` still shows Strike
using the old version.

</details>

<details>
<summary>Update GitHub Copilot CLI</summary>

Run this terminal command:

```bash
copilot plugin update strike
```

</details>

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
