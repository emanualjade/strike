# Strike Plugin

Strike is a board-and-card workflow for agent-assisted project delivery. It
keeps durable state in the consuming repository under `docs/strike/`, while the
workflow skills and bundled references live in this plugin package.

In Strike, a Project is the unit of work moving through the board. It can be a
small change like `CSV Export`, a docs pass like `Docs Refresh`, or a larger
effort like `Payments` with smaller capabilities inside the spec. It lives
inside an existing repository; it is not a new repo.

## Skills

Strike skills are portable; each host renders the same skill differently.

| Host | Invocation form |
| --- | --- |
| Claude Code plugin | `/strike:<skill> <args>`; when a handoff says `Reset context first: yes`, run `/clear` first. |
| Codex | Type `$` and select the installed Strike skill, or use `/skills` to browse. The short form is `$<skill> <args>`; namespaced `$strike:<skill> <args>` also works. |
| GitHub Copilot CLI | `/<skill> <args>` after confirming the installed skills with `/skills list` or `/skills info`. |

Canonical skill names:

```txt
customize init|list|check|load <supported-skill>
start <project name words> [--slug <slug>] [--description <description words>]
go <project-slug>
brainstorm <project-slug>
grill <project-slug>
research <project-slug>
spec <project-slug>
spec-review <project-slug>
slice <project-slug>
slice-review <project-slug>
phase-research <project-slug> phase:<phase-slug>
phase-plan <project-slug> phase:<phase-slug>
phase-build <project-slug> phase:<phase-slug>
phase-review <project-slug> phase:<phase-slug>
phase-fix <project-slug> phase:<phase-slug>
accept <project-slug>
retro <project-slug>
demo <project-slug> "<what the demo should explore>"
language <term|project-slug|path>
```

`start` is the only normal user-facing Strike skill with double-dash options.
Other skills use positional arguments, plain optional words such as `skip`, or
the `phase:<phase-slug>` token for phase-scoped work.

`customize` is a utility for repo-local customization of supported single-file
skills. Run `customize init` to create files under `docs/strike/customize/`,
then write preferences below the HTML comment in those files and run
`customize check`. Use it for repo-specific research standards, spec style,
slicing preferences, demo tone, or language guidance; supported skills load the
matching file automatically.

Claude Code examples:

```txt
/strike:customize init
/strike:start Add user profile page
/strike:go <project-slug>
/strike:brainstorm <project-slug>
/strike:grill <project-slug>
/strike:research <project-slug>
/strike:spec <project-slug>
/strike:spec-review <project-slug>
/strike:slice <project-slug>
/strike:slice-review <project-slug>
/strike:phase-research <project-slug> phase:<phase-slug>
/strike:phase-plan <project-slug> phase:<phase-slug>
/strike:phase-build <project-slug> phase:<phase-slug>
/strike:phase-review <project-slug> phase:<phase-slug>
/strike:phase-fix <project-slug> phase:<phase-slug>
/strike:accept <project-slug>
/strike:retro <project-slug>
/strike:demo <project-slug> "<what the demo should explore>"
/strike:language <term|project-slug|path>
```

See `references/invocation.md` for the shared handoff format and host-specific
rendering rules.

## Runtime State

Strike creates and updates runtime state in the repository where it runs:

```txt
docs/strike/board/
docs/strike/cards/
```

The plugin does not ship active board cards. Consuming repositories only need
the packaged workflow files listed below.

## Portability

The portable plugin package is this directory:

```txt
plugin.json
.claude-plugin/
.codex-plugin/
skills/
references/
README.md
```

It can be moved into its own repository as-is. Runtime board/card files,
repo-local marketplace files, and repo-local skill folders are not part of the
portable package.

The plugin has no package-manager install step. The bundled `start` skill uses
its included shell script plus common local tools: `bash`, `git` when available,
`find`, `sed`, `mkdir`, and `touch`. The `customize` utility and slug helpers
use the bundled Node scripts and require Node.js 18 or newer.

## Local Development

Claude Code can load the plugin directly. From a standalone plugin repository,
run:

```bash
claude --plugin-dir .
```

When the plugin is nested in another repo at `plugins/strike`, run:

```bash
claude --plugin-dir ./plugins/strike
```

Codex can load the plugin through a local marketplace entry that points to the
plugin checkout path. In this app repo, that path is `./plugins/strike`; in a
standalone plugin repo or a different checkout layout, point the marketplace
entry at that location instead.

When iterating in Codex, remember that local plugins are installed into Codex's
plugin cache. Refresh or reinstall the local plugin if edits do not appear. The
Codex marketplace upgrade command applies to Git-backed marketplaces, not local
path marketplaces.
