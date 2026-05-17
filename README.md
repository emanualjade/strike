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

You also need access to this GitHub repository. If the repository is private,
installing works only for people who have been granted access and whose tool can
clone the repository from GitHub.

In the instructions below:

- Terminal commands go in your macOS Terminal or another shell.
- App prompts go inside the AI coding tool's chat or command prompt.

## Install In Codex

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
/strike:start "Add CSV export" --slug csv-export --description "Let users export a CSV report."
```

In Codex, ask for the installed Strike skill by name:

```text
Use the Strike start skill for "Add CSV export" with slug csv-export and description "Let users export a CSV report."
```

After the card is created, ask Strike what to do next.

Claude Code:

```text
/strike:go csv-export
```

Codex:

```text
Use the Strike go skill for csv-export.
```

Strike will tell you the next skill to run and the arguments to use.

## Common Skills

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
