# Strike

Strike is a skills plugin that helps an AI coding agent move feature work from
a rough idea to a planned, built, reviewed, accepted, and remembered change.

It gives your agent a repeatable workflow. You start a feature card, ask Strike
what should happen next, and then move through planning, research, specification,
implementation, review, acceptance, and retro steps.

Strike stores its working notes in the project where you use it:

```text
docs/strike/board/
docs/strike/cards/
```

Run Strike from the root of the project you want the agent to work on.

## Before You Install

You need one of these AI coding tools:

- Codex
- Claude Code
- GitHub Copilot CLI

You also need Node.js 18 or newer available as `node`. Strike uses bundled
deterministic Node scripts for card and filename setup.

You also need access to this GitHub repository. If the repository is private,
installing works only for people who have been granted access and whose tool can
clone the repository from GitHub.

In the instructions below:

- Terminal commands go in your macOS Terminal or another shell.
- App prompts go inside the AI coding tool's chat or command prompt.

## Install In Codex

Choose one Codex install style.

### Codex Project Install And Uninstall

Use this when one project should offer Strike, and you do not want to add the
Strike marketplace to your general Codex setup.

Codex does not currently provide a project-scope `marketplace add` command.
Project marketplaces are added by creating or editing this file in the project:

```text
.agents/plugins/marketplace.json
```

If your project already has this file, add the Strike plugin entry to the
existing `plugins` list instead of replacing the file. Do not run a command that
overwrites this file unless you have checked that it is safe to replace.

For a project that does not already have `.agents/plugins/marketplace.json`,
create the directory:

```bash
mkdir -p .agents/plugins
```

Then create `.agents/plugins/marketplace.json` with this content:

```json
{
  "name": "strike-project",
  "interface": {
    "displayName": "Strike"
  },
  "plugins": [
    {
      "name": "strike",
      "source": {
        "source": "git-subdir",
        "url": "git@github.com:emanualjade/strike.git",
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

What this does:

- `.agents/plugins/marketplace.json` tells Codex that this project has a plugin
  marketplace.
- `git@github.com:emanualjade/strike.git` is the Git repository Codex should
  fetch Strike from.
- `path: "./plugins/strike"` tells Codex where the Strike plugin lives inside
  that repository.

Open Codex from this same project root. You can use the Codex app, or run this
terminal command from the project root:

```bash
codex
```

In the Codex prompt, open the plugin browser:

```text
/plugins
```

Find Strike in the project marketplace and install or enable it. After that,
start a fresh Codex conversation from the same project root.

To uninstall Strike from the project, first remove the installed plugin:

```text
/plugins
```

Select Strike, then choose **Uninstall plugin**.

Then remove the project marketplace entry. If `.agents/plugins/marketplace.json`
only exists for Strike, delete that file. If it lists other plugins too, remove
only the Strike entry from the `plugins` list.

Restart Codex from the project root after changing the project marketplace file.

### Codex Global Install And Uninstall

Use this when you want Strike available across your Codex setup.

Run this terminal command:

```bash
codex plugin marketplace add emanualjade/strike --sparse .agents/plugins --sparse plugins
```

What this does:

- `codex plugin marketplace add` tells Codex about a plugin marketplace.
- `emanualjade/strike` is the GitHub repository that contains the marketplace.
- `--sparse .agents/plugins --sparse plugins` tells Codex to fetch only the
  marketplace metadata and the plugin files, instead of cloning unrelated repo
  files.

This command registers the marketplace. It does not install Strike into the
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
conversation and run Strike from the root of the project you want it to work on.

To uninstall Strike globally, first remove the installed plugin from the Codex
plugin browser:

```text
/plugins
```

Select Strike, then choose **Uninstall plugin**.

Then remove the global Strike marketplace with this terminal command:

```bash
codex plugin marketplace remove strike
```

Use the global uninstall when you no longer want Strike available across Codex,
or when you want to switch from a global install to a project install.

## Install In Claude Code

Run these terminal commands:

```bash
claude plugin marketplace add emanualjade/strike --sparse .claude-plugin plugins
claude plugin install strike@strike
```

What these do:

- The first command registers the Strike marketplace with Claude Code.
- `--sparse .claude-plugin plugins` tells Claude Code to fetch only the Claude
  marketplace metadata and the plugin files.
- The second command installs the `strike` plugin from the `strike` marketplace.

Restart Claude Code after installing. If you are already inside a Claude Code
session, you can try this app prompt instead of restarting:

```text
/reload-plugins
```

## Install In GitHub Copilot CLI

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

## Start A Feature

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

You can type `$` or `/skills` to browse available skills. If more than one
`start` skill appears, choose the one from Strike.

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

In Codex, start a fresh conversation from the same project root, then use the
next Strike skill shortcut:

```text
$spec csv-export
```

In GitHub Copilot CLI, start a fresh Copilot CLI session if there is no visible
context-reset command, then run the next Strike skill from the same project
root.

## Example Feature Run

Here is what a small Claude Code run might look like from start to finish.
Assume the feature slug is `csv-export`.

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
and reviewed, finish the feature:

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
start <feature name words> [--slug <slug>] [--description <description words>]
```

Phase skills use a named token instead of a dash flag:

```text
phase-build <feature-slug> phase:<phase-slug>
```

Some skills accept one optional plain word, such as `research <feature-slug>
skip`, `accept <feature-slug> dogfood`, or `go <feature-slug> verbose`.

- `start`: create a new feature card.
- `go`: inspect the board and recommend the next step.
- `brainstorm`, `grill`, `research`: shape and pressure-test the idea.
- `spec`, `spec-review`: write and review the feature specification.
- `slice`, `slice-review`: split the feature into buildable phases.
- `phase-research`, `phase-plan`, `phase-build`, `phase-review`, `phase-fix`:
  work through one implementation phase at a time.
- `accept`: check the assembled feature against the spec.
- `retro`: record what happened and move accepted work to done.
- `language`: keep project terminology consistent.
- `demo`: create a small planning demo for a card.

## Update Strike

For Codex, run this terminal command:

```bash
codex plugin marketplace upgrade strike
```

Then open Codex and check `/plugins` if Codex shows an available plugin update.

For Claude Code, run these terminal commands:

```bash
claude plugin marketplace update strike
claude plugin update strike@strike
```

Restart Claude Code after updating, or run this app prompt:

```text
/reload-plugins
```

For GitHub Copilot CLI, run this terminal command:

```bash
copilot plugin update strike
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

If Strike says there is no board or card, run `start` first from the root of the
project where you want Strike to create `docs/strike/`.

If an update does not seem to change anything, make sure a newer Strike release
has actually been published. Some hosts only treat a plugin as updated after its
version changes.

## License

MIT.
