# Strike

Strike is an installable skills plugin. It gets you from a fuzzy idea to well built feature in a way that covers all the proper planning, research and validation automatically. Strike takes large features and automatically breaks them into manageable phases and thin vertical slices that an LLM can handle effectively.

## Standard use is easy
- Install the plugin
- Run the Auto Strike new-initiative skill from the root of the project you are working in.
**Example**
```
$auto-strike-new-initiative hey codex I want to add a payments system to my app. I'm not sure how or what to use. Help me get this done properly
```
Strike will walk you through all the steps to get this built and built well. To
resume the active initiative later, run `$auto-strike-go`. In Claude Code, use
`/strike:auto-strike-new-initiative` and `/strike:auto-strike-go`.

## How Auto Strike Works

Auto-strike walks through a number of steps starting with helping you refine your idea and then taking over to get it built in a robust way.

The workflow moves through these skills:

- refine the idea - helps you refine your initial idea.
- grill the decisions - helps ensure the essential decisions are answered before building.
- create the main spec - Strike pretty much takes over at this point and builds on its own from here.
- create development phases
- create one phase spec at a time
- create slices for a phase
- research, plan, verify, build, and verify each slice
- fix failed verification issues and run the same verifier again when needed
- verify the completed phase
- verify the completed main spec

## Under the hood

Auto Strike creates and maintains its own workspace:

```text
auto-strike/
PROJECT_LANGUAGE.md
```

`auto-strike/state.json` tracks workflow progress. Markdown files under
`auto-strike/initiatives/<initiative-id>/` store the artifacts:

```text
auto-strike/state.json
auto-strike/initiatives/<initiative-id>/idea.md
auto-strike/initiatives/<initiative-id>/decisions.md
auto-strike/initiatives/<initiative-id>/main-spec.md
auto-strike/initiatives/<initiative-id>/development-plan.md
auto-strike/initiatives/<initiative-id>/phases/phase-01/phase.md
auto-strike/initiatives/<initiative-id>/phases/phase-01/phase-spec.md
auto-strike/initiatives/<initiative-id>/phases/phase-01/slices/slice-01/slice.md
auto-strike/initiatives/<initiative-id>/phases/phase-01/slices/slice-01/research.md
auto-strike/initiatives/<initiative-id>/phases/phase-01/slices/slice-01/plan.md
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

## Before You Install

You need one of these AI coding tools:

- Codex
- Claude Code

You also need Node.js 18 or newer available as `node`. Strike uses bundled
deterministic Node scripts for Auto Strike state checks and demo filenames.

## Install Strike

### Codex Global

```bash
codex plugin marketplace add emanualjade/strike --ref main --sparse .agents/plugins --sparse plugins/strike
codex plugin add strike@strike
codex plugin list --marketplace strike
```

For Codex CLI, start a fresh session from the repo where you want Strike to
work:

```bash
cd /path/to/your/repo
codex
```

For Codex Desktop, fully quit and relaunch the app after install, then start a
new blank thread from the workspace.

Invoke bundled skills with `$` or choose Strike with `@`:

```text
$auto-strike-new-initiative Build an MVP for this idea: ...
$auto-strike-go Continue the active initiative.
$demo auto-strike/initiatives/my-idea "Compare onboarding options"
$system-visualizer auto-strike/initiatives/my-idea
$language checkout clarify
```

### Codex Repository Marketplace

Create or edit `.agents/plugins/marketplace.json` in the consuming repo:

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

Then register and install from that repository marketplace:

```bash
cd /path/to/your/repo
codex plugin marketplace add "$PWD"
codex plugin add strike@example-project-plugins
codex plugin list --marketplace example-project-plugins
```

Use your marketplace name, not `example-project-plugins`.

### Claude Code

User scope:

```bash
claude plugin marketplace add emanualjade/strike --sparse .claude-plugin plugins --scope user
claude plugin install strike@strike --scope user
```

Project scope:

```bash
claude plugin marketplace add emanualjade/strike --sparse .claude-plugin plugins --scope project
claude plugin install strike@strike --scope project
```

Local repository-private scope:

```bash
claude plugin marketplace add emanualjade/strike --sparse .claude-plugin plugins --scope local
claude plugin install strike@strike --scope local
```

Refresh active Claude Code plugins after install:

```text
/reload-plugins
```

Claude Code plugin skills are namespaced:

```text
/strike:auto-strike-new-initiative Build an MVP for this idea
/strike:auto-strike-go Continue the active initiative
/strike:demo auto-strike/initiatives/my-idea "Compare onboarding options"
/strike:system-visualizer auto-strike/initiatives/my-idea
/strike:language checkout clarify
```

## Update Strike

### Codex

```bash
codex plugin marketplace upgrade strike
codex plugin add strike@strike
codex plugin list --marketplace strike
```

Fully quit and relaunch Codex Desktop after updating, then start a new thread.

### Claude Code

```bash
claude plugin marketplace update strike
claude plugin update strike@strike --scope user
```

Replace `user` with `project` or `local` if that is where Strike is installed.
Then run:

```text
/reload-plugins
```

## Uninstall Strike

### Codex

```bash
codex plugin remove strike@strike
codex plugin marketplace remove strike
```

If Strike was added to a repository marketplace, edit or delete that repo's
`.agents/plugins/marketplace.json`.

### Claude Code

```bash
claude plugin uninstall strike@strike --scope user
claude plugin marketplace remove strike
```

Replace `user` with `project` or `local` if needed.

## Local Development

This repo uses standalone `pnpm` only. Do not use `npm`, `npx`, or Corepack for
local package work.

Useful checks:

```bash
pnpm run test
pnpm run validate
pnpm run validate:publish
```

If `pnpm run ...` fails because dependency metadata is stale, follow
`AGENTS.md` and use the frozen/no-scripts metadata refresh path.

For release work, see [docs/release.md](docs/release.md).
