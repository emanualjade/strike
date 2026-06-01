# Strike

Strike helps AI coding agents turn fuzzy feature ideas into planned, sliced, researched, built, and verified software changes.

> Strike was born out of my own need to build large features in large codebases with AI coding agents. It combines ideas from Superpowers, GSD, Addy Osmani's agent skills, Matt Pocock's skills, and Gstack into one opinionated workflow for planning, slicing, researching, building, verifying, and resuming real software work.

## Why use Strike?

Strike is still early, so you may not want to depend on it for critical production work yet. But the goal is clear: make AI coding agents better at turning rough ideas into finished, verified features.

* ✅ **From fuzzy idea to build path:**<br>
Strike helps turn a loose feature idea into a refined plan, clear decisions, a durable spec, phases, and buildable slices.

* ✅ **Better decisions before code:**<br>
Strike forces early refinement and decision grilling so the agent does not rush into implementation with vague requirements.

* ✅ **Thin slices agents can actually finish:**<br>
Large features are broken into phases and small vertical slices that fit the way LLM coding agents work best.

* ✅ **Research before planning:**<br>
Each slice has an explicit research step so the agent checks docs, standards, examples, and known patterns before guessing.

* ✅ **Durable artifacts, not disposable chat:**<br>
Strike writes the idea, decisions, specs, plans, research, and verification notes into files so progress survives context loss.

* ✅ **Workflow state you can resume:**<br>
Strike tracks where the initiative is, what is complete, and what still needs to happen, so work can stop and resume cleanly.

* ✅ **Plan verification before build:**<br>
Slice plans are checked before coding starts, reducing the chance that the agent builds from a weak or incomplete plan.

* ✅ **Verification and fix loops:**<br>
Strike does not pretend work is done. Failed verification routes through a fix loop, then runs the same verifier again.

* ✅ **Phase and spec-level validation:**<br>
Strike verifies not only individual slices, but also completed phases and the full main spec.

* ✅ **Project language consistency:**<br>
Strike tracks important naming, domain terms, and language choices so the project stays coherent as it grows.

* ✅ **Useful checkpoints:**<br>
Verified slices can be committed and pushed before moving on, keeping work reviewable and recoverable.

* ✅ **Standalone utilities included:**<br>
Strike also includes focused tools for demos, system visualization, project language, and handoff documents.

* ✅ **Portable across agent tools:**<br>
Strike is designed as one portable skill package that works across Codex and Claude Code.


## How to use it

**Build things with strike** it's easy

- Install the plugin as described below in the installation section.
- Run it from the root of the project you are working like so.

#### Codex Example

<sub>Start something new. Strike will clarify the idea, then continue through the build workflow.</sub>
```text
$strike:auto-strike-new-initiative Add password reset to this app
```

<sub>Resume later from the same repo, even in a new chat window. Pick up where you left off without losing context.</sub>
```text
$strike:auto-strike-go
```

#### Claude Code Example

<sub>Start something new. Strike will clarify the idea, then continue through the build workflow.</sub>
```text
/strike:auto-strike-new-initiative Add password reset to this app
```

<sub>Resume later from the same repo, even in a new chat window. Pick up where you left off without losing context.</sub>
```text
/strike:auto-strike-go
```

## How Strike Works

Strike walks through a staged workflow from rough idea to verified software change.

The workflow moves through the following steps:

- refine the idea - helps you refine your initial idea.
- grill the decisions - helps ensure the essential decisions are answered before building.
- create the main spec - defines the durable target for the whole feature.
- create development phases - breaks the feature into safe build phases.
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

For installed plugin use, you also need Node.js 18 or newer available as
`node`. Strike uses bundled deterministic Node scripts for Auto Strike state
checks and demo filenames. The stricter Node version in this repo's
`package.json` applies to local development and release work, not normal plugin
runtime.

## Install Strike

<details>
<summary><strong>Codex</strong></summary>

### Global Marketplace

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

Invoke bundled skills with the namespaced `$strike:<skill>` form or choose
Strike with `@`:

```text
$strike:auto-strike-new-initiative Build an MVP for this idea: ...
$strike:auto-strike-go Continue the active initiative.
$strike:demo auto-strike/initiatives/my-idea "Compare onboarding options"
$strike:system-visualizer auto-strike/initiatives/my-idea
$strike:language checkout clarify
```

### Repository Marketplace

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

</details>

<details>
<summary><strong>Claude Code</strong></summary>

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

</details>

## Update Strike

<details>
<summary><strong>Codex</strong></summary>

```bash
codex plugin marketplace upgrade strike
codex plugin add strike@strike
codex plugin list --marketplace strike
```

Fully quit and relaunch Codex Desktop after updating, then start a new thread.

</details>

<details>
<summary><strong>Claude Code</strong></summary>

```bash
claude plugin marketplace update strike
claude plugin update strike@strike --scope user
```

Replace `user` with `project` or `local` if that is where Strike is installed.
Then run:

```text
/reload-plugins
```

</details>

## Uninstall Strike

<details>
<summary><strong>Codex</strong></summary>

```bash
codex plugin remove strike@strike
codex plugin marketplace remove strike
```

If Strike was added to a repository marketplace, edit or delete that repo's
`.agents/plugins/marketplace.json`.

</details>

<details>
<summary><strong>Claude Code</strong></summary>

```bash
claude plugin uninstall strike@strike --scope user
claude plugin marketplace remove strike
```

Replace `user` with `project` or `local` if needed.

</details>

## Local Development

Local development and release work require Node.js 22.13 or newer because this
repo pins pnpm 11.4.0.

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
