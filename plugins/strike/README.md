# Strike Plugin

Strike is a board-and-card workflow for agent-assisted feature delivery. It
keeps durable state in the consuming repository under `docs/strike/`, while the
workflow skills and bundled references live in this plugin package.

## Skills

Strike skills are portable; each host renders the same skill differently.

| Host | Invocation form |
| --- | --- |
| Claude Code plugin | `/strike:<skill> <args>`; when a handoff says `Reset context first: yes`, run `/clear` first. |
| Codex | Type `$` and select the installed Strike skill, or use `/skills` to browse. The short form is `$<skill> <args>`; namespaced `$strike:<skill> <args>` also works. |
| GitHub Copilot CLI | `/<skill> <args>` after confirming the installed skills with `/skills list` or `/skills info`. |

Canonical skill names:

```txt
start <feature name words>
go <feature-slug>
brainstorm <feature-slug>
grill <feature-slug>
research <feature-slug>
spec <feature-slug>
spec-review <feature-slug>
slice <feature-slug>
slice-review <feature-slug>
phase-research <feature-slug> phase:<phase-slug>
phase-plan <feature-slug> phase:<phase-slug>
phase-build <feature-slug> phase:<phase-slug>
phase-review <feature-slug> phase:<phase-slug>
phase-fix <feature-slug> phase:<phase-slug>
accept <feature-slug>
retro <feature-slug>
demo <feature-slug> "<what the demo should explore>"
language <term|feature-slug|path>
```

Claude Code examples:

```txt
/strike:start Add user profile page
/strike:go <feature-slug>
/strike:brainstorm <feature-slug>
/strike:grill <feature-slug>
/strike:research <feature-slug>
/strike:spec <feature-slug>
/strike:spec-review <feature-slug>
/strike:slice <feature-slug>
/strike:slice-review <feature-slug>
/strike:phase-research <feature-slug> phase:<phase-slug>
/strike:phase-plan <feature-slug> phase:<phase-slug>
/strike:phase-build <feature-slug> phase:<phase-slug>
/strike:phase-review <feature-slug> phase:<phase-slug>
/strike:phase-fix <feature-slug> phase:<phase-slug>
/strike:accept <feature-slug>
/strike:retro <feature-slug>
/strike:demo <feature-slug> "<what the demo should explore>"
/strike:language <term|feature-slug|path>
```

See `references/invocation.md` for the shared handoff format and host-specific
rendering rules.

## Runtime State

Strike creates and updates runtime state in the repository where it runs:

```txt
docs/strike/board/
docs/strike/cards/
```

The plugin does not ship active board cards, and consuming repositories do not
need Strike's private development notes.

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
repo-local marketplace files, and old standalone Claude skill folders are not
part of the portable package.

The plugin has no package-manager install step. The bundled `start` skill uses
its included shell script plus common local tools: `bash`, `git` when available,
`find`, `sed`, `mkdir`, and `touch`.

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
