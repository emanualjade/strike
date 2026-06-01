# Strike Plugin

Strike packages Auto Strike plus focused planning utilities for
agent-assisted delivery.

## Auto Strike

Auto Strike is the core workflow. It automates an idea toward a
feature-complete change by moving through staged skills.

It creates and maintains a workspace in the consuming repository:

```text
auto-strike/
  user-guidance/
    implementation-discipline/
      global.md
      plan-slice.md
      build-slice.md
      fix.md
      verify-slice-plan.md
      verify-slice-build.md
      verify-phase.md
      verify-main-spec.md
    review-lenses/
      global.md
      verify-slice-plan.md
      verify-slice-build.md
      verify-phase.md
      verify-main-spec.md
PROJECT_LANGUAGE.md
```

`auto-strike/state.json` stores workflow progress. Markdown files under
`auto-strike/initiatives/<initiative-id>/` store idea, decision, spec, phase,
slice, research, plan, build, and verification artifacts.
`auto-strike/user-guidance/implementation-discipline/` is user-owned project
guidance for how Auto Strike should plan, build, fix, and verify code in this
repo. `auto-strike/user-guidance/review-lenses/` contains user-owned additive
verifier guidance. Stages read `global.md` plus their own stage file.

The workflow is:

```text
refine-idea
grill-idea
create-main-spec
create-development-phases
create-phase-spec
create-phase-slices
research-slice
plan-slice
verify-slice-plan
build-slice
verify-slice-build
fix (only when verification fails)
verify-phase
verify-main-spec
```

## Skills

### Main Workflow

- `auto-strike-new-initiative`: start a fresh initiative from a new idea.
- `auto-strike-go`: continue the active initiative from workflow state.

### Useful Standalone Planning Skills

Call these directly when you want one focused planning artifact without running
the whole Auto Strike workflow.

- `refine-idea`: clarify a raw idea into a useful first outcome.
- `grill-idea`: pressure-test decisions, assumptions, and blockers.
- `create-main-spec`: write a durable main spec.
- `create-development-phases`: split a main spec into buildable phases.

### Auto Strike Stage Skills

Auto Strike uses these as workflow stages. They are exposed so the workflow
stays modular; in normal use, let Auto Strike call them with the right context
and output paths.

- `create-phase-spec`: define one phase clearly enough to slice.
- `create-phase-slices`: split one phase into implementation slices.
- `research-slice`: research one implementation slice before planning.
- `plan-slice`: create one concrete implementation plan.
- `verify-slice-plan`: check that a slice plan is ready to build.
- `build-slice`: implement one planned slice.
- `verify-slice-build`: verify one built slice.
- `fix`: fix issues from a failed verification pass, then return to the same verifier.
- `verify-phase`: verify one completed phase.
- `verify-main-spec`: verify the completed main spec.

### Utilities

These are useful to call on their own, with or without an Auto Strike workflow.

- `demo`: create a small self-contained HTML planning demo.
- `system-visualizer`: create diagram or model code for systems and workflows.
- `language`: assess and update durable project language in
  `PROJECT_LANGUAGE.md`.
- `handoff`: compact the current conversation into a handoff document.

Common skill argument shapes:

```txt
auto-strike-new-initiative <idea>
auto-strike-go [optional context]
demo [initiative-slug|path|idea] "<what the demo should explore>"
system-visualizer [initiative-slug|path|goal]
language [term|path|initiative-slug] [assess|trace|add|update|remove|clarify|apply]
handoff <next-session focus>
```

## Calling Skills

Strike skills are portable; call them with the current host's normal skill
syntax.

| Host | Invocation form |
| --- | --- |
| Claude Code plugin | `/strike:<skill> <args>` |
| Codex | App: use `$strike:<skill> <args>` directly, type `$` to select an installed skill, or `@` to choose Strike or one of its bundled skills. CLI: use `/skills` to browse. |

Examples:

```txt
$strike:auto-strike-new-initiative Build an MVP for this idea
$strike:auto-strike-go Continue the active initiative
$strike:demo auto-strike/initiatives/my-idea "Compare onboarding options"
$strike:system-visualizer auto-strike/initiatives/my-idea
$strike:language checkout clarify
```

## Runtime State

Auto Strike creates and updates runtime state in the repository where it runs:

```text
auto-strike/
  user-guidance/
    implementation-discipline/
      global.md
      plan-slice.md
      build-slice.md
      fix.md
      verify-slice-plan.md
      verify-slice-build.md
      verify-phase.md
      verify-main-spec.md
    review-lenses/
      global.md
      verify-slice-plan.md
      verify-slice-build.md
      verify-phase.md
      verify-main-spec.md
PROJECT_LANGUAGE.md
```

`auto-strike/state.json` stores workflow progress. Markdown files under
`auto-strike/initiatives/<initiative-id>/` store the artifacts for each staged
skill. `PROJECT_LANGUAGE.md` is the project language file that Auto
Strike and the `language` utility keep current as durable language
crystallizes. `auto-strike/user-guidance/implementation-discipline/` is the
user's editable implementation guidance folder.
`auto-strike/user-guidance/review-lenses/` is the user's editable verifier
guidance folder. The plugin does not ship runtime project artifacts.

## Portability

The portable plugin package is this directory:

```text
.claude-plugin/
.codex-plugin/
skills/
references/
README.md
```

It can be moved into its own repository as-is. Runtime Auto Strike files,
repo-local marketplace files, and repo-local skill folders are not part of the
portable package.

The plugin has no package-manager install step. Bundled helpers use Node.js 18
or newer at runtime. The repo `package.json` engine of Node.js 22.13 or newer
applies only to developing and releasing this repo with pnpm 11.4.0.

## Local Development

Claude Code can load the plugin directly:

```bash
claude --plugin-dir ./plugins/strike
```

Codex can load the plugin through a local marketplace entry that points to this
plugin checkout path. When dogfooding this repo on a machine that also has the
published Strike plugin installed, use a separate local marketplace name such
as `strike-dev` so `strike@strike-dev` does not disturb the normal
`strike@strike` install.

When iterating in Codex, remember that local plugins are installed into Codex's
plugin cache. Refresh or reinstall the local plugin with `codex plugin add` if
edits do not appear. The Codex marketplace upgrade command applies to remote
marketplaces, not local path marketplaces.
