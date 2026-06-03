# Strike

Strike helps AI coding agents turn fuzzy feature ideas into planned, sliced, researched, built, and verified software changes.

> Strike was born out of my own need to build large features in large codebases with AI coding agents. It combines ideas from Superpowers, GSD, Addy Osmani's agent skills, Matt Pocock's skills, and Gstack into one opinionated workflow for planning, slicing, researching, building, verifying, and resuming real software work.

## Why use Strike?

Strike is still early, so you may not want to depend on it for critical production work yet. But the goal is clear: make AI coding agents better at turning rough ideas into finished, verified features.

✅ **From fuzzy idea to build path:**<br>
Strike helps turn a loose feature idea into a refined plan, clear decisions, a durable spec, phases, and buildable slices.

✅ **Better decisions before code:**<br>
Strike forces early refinement and decision grilling so the agent does not rush into implementation with vague requirements.

✅ **Codes with small cohesive vertical slices:**<br>
Large features are broken into phases and small cohesive vertical slices that help achieve quality results.

✅ **Research before planning:**<br>
Each slice has an explicit research step so the agent checks docs, standards, examples, and known patterns before guessing.

✅ **Durable artifacts, not disposable chat:**<br>
Strike writes the idea, decisions, specs, plans, research, and verification notes into files so progress survives context loss.

✅ **Workflow state you can resume:**<br>
Strike tracks where the initiative is, what is complete, and what still needs to happen, so work can stop and resume cleanly.

✅ **Plan verification before build:**<br>
Slice plans are checked before coding starts, reducing the chance that the agent builds from a weak or incomplete plan.

✅ **Verification and fix loops:**<br>
Strike does not pretend work is done. Failed verification routes through a fix loop, then runs the same verifier again.

✅ **Phase and spec-level validation:**<br>
Strike verifies not only individual slices, but also completed phases and the full main spec.

✅ **Project language consistency:**<br>
Strike tracks important naming, domain terms, and language choices so the project stays coherent as it grows.

✅ **Customizable to your project:**<br>
Teach Strike your coding preferences, review expectations, and local patterns so it gets better at working the way your project works.

✅ **Useful checkpoints:**<br>
Verified slices can be committed and pushed before moving on, keeping work reviewable and recoverable.

✅ **Standalone utilities included:**<br>
Strike also includes focused tools for demos, system visualization, project language, and handoff documents.

✅ **Portable across agent tools:**<br>
Strike is designed as one portable skill package that works across Codex and Claude Code.


## How to use it

**Build things with strike** it's easy

- Install the plugin as described below in the installation section.
- Run it from the root of the project you are working like so.

#### Codex Example

<sub>Start something new. Strike will clarify the idea, then continue through the build workflow.</sub>
```text
$strike:new-initiative Add password reset to this app
```

<sub>Resume later from the same repo, even in a new chat window. Pick up where you left off without losing context.</sub>
```text
$strike:go
```

#### Claude Code Example

<sub>Start something new. Strike will clarify the idea, then continue through the build workflow.</sub>
```text
/strike:new-initiative Add password reset to this app
```

<sub>Resume later from the same repo, even in a new chat window. Pick up where you left off without losing context.</sub>
```text
/strike:go
```

## How Strike Works

Strike walks through a staged workflow from rough idea to verified software change.

The workflow moves through the following steps:

- refine the idea - helps you refine your initial idea.
- research the initiative - identifies dependency, API, model, repo-pattern,
  schema, and file/workflow facts before decisions harden.
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

Strike creates and maintains its own workspace:

```text
strike/
PROJECT_LANGUAGE.md
```

`strike/state.json` keeps a compact initiative index and is authoritative for
initiative lifecycle status. Each initiative's detailed workflow progress lives
in `strike/initiatives/<initiative-id>/state.json`.
Markdown files under `strike/initiatives/<initiative-id>/` store the artifacts.

```text
strike/state.json
strike/initiatives/<initiative-id>/state.json
strike/initiatives/<initiative-id>/idea.md
strike/initiatives/<initiative-id>/research/scope.md
strike/initiatives/<initiative-id>/research/<research-item-id>.md
strike/initiatives/<initiative-id>/research/audits/<research-item-id>.md
strike/initiatives/<initiative-id>/research/index.md
strike/initiatives/<initiative-id>/decisions.md
strike/initiatives/<initiative-id>/supporting-artifacts/<topic>.md
strike/initiatives/<initiative-id>/main-spec.md
strike/initiatives/<initiative-id>/development-plan.md
strike/initiatives/<initiative-id>/phases/phase-01/phase.md
strike/initiatives/<initiative-id>/phases/phase-01/phase-spec.md
strike/initiatives/<initiative-id>/phases/phase-01/slices/slice-01/slice.md
strike/initiatives/<initiative-id>/phases/phase-01/slices/slice-01/research.md
strike/initiatives/<initiative-id>/phases/phase-01/slices/slice-01/plan.md
```

## Customize strike

Strike is meant to get more useful the longer you work with it. If it makes a
choice you do not like twice, you should not have to keep correcting it in chat.
Write the preference down once, in the project, and future Strike stages
can pick it up.

Use **implementation discipline files** for how you want work done. These are
good for things like where shared utilities belong, how much surrounding code to
inspect before editing, what package manager rules matter, or what your team
considers a clean boundary.

Use **review lens files** for extra scrutiny during verification. They are a
good place to say things like:

- check likely callers when shared code changes
- run an accessibility pass for meaningful UI work
- look extra carefully at auth, payments, privacy, or destructive actions
- make sure schema changes account for downstream consumers

Strike reads `global.md` for guidance that always matters, plus the file
for the current stage:

```text
strike/
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
```

For example, you might add this to
`strike/user-guidance/implementation-discipline/build-slice.md`:

```md
- Before creating a utility, search the existing utility folders first. If a new
  shared utility is needed, place it where this repo already keeps that kind of
  code.
```

And this to
`strike/user-guidance/review-lenses/verify-slice-build.md`:

```md
- If shared utilities, schemas, adapters, or public APIs changed, run a
  caller-impact review and do not pass verification until likely downstream
  consumers were checked.
```

The files are yours. Keep them short, plain, and opinionated. Strike's built-in
checks still run; your guidance just gives it better local taste.

## Skills

### Main Workflow

- `new-initiative`: start a fresh initiative from a new idea.
- `go`: continue the active initiative from workflow state.

### Useful Standalone Planning Skills

Call these directly when you want one focused planning artifact without running
the whole Strike workflow.

- `refine-idea`: clarify a raw idea into a useful first outcome.
- `research-initiative`: run pre-grill research with a user-approved scope and
  concise per-topic reports.
- `grill-idea`: pressure-test decisions, assumptions, and blockers.
- `create-main-spec`: write a durable main spec.
- `create-development-phases`: split a main spec into buildable phases.

### Strike Stage Skills

Strike uses these as workflow stages. They are exposed so the workflow
stays modular; in normal use, let Strike call them with the right context
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

These are useful to call on their own, with or without a Strike workflow.

- `demo`: create a small self-contained HTML planning demo.
- `system-visualizer`: create diagram or model code for systems and workflows.
- `language`: assess and update durable project language in
  `PROJECT_LANGUAGE.md`.
- `handoff`: compact the current conversation into a handoff document.

## Install Strike

<sub><strong>Requirements:</strong> Codex or Claude Code, plus Node.js 18 or
newer available as <code>node</code>. Local repo development uses the stricter
Node version in <code>package.json</code>.</sub>

<details>
<summary><strong>Codex</strong></summary>

### Install For All Projects

Use this when you want Strike available anywhere you use Codex on this machine.

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
$strike:new-initiative Build an MVP for this idea: ...
$strike:go Continue the active initiative.
$strike:demo strike/initiatives/my-idea "Compare onboarding options"
$strike:system-visualizer strike/initiatives/my-idea
$strike:language checkout clarify
```

### Install For One Project

Use this when you want Strike available only through this repository's plugin
marketplace.

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

Pick one install option:

### Install For All Projects

Use this when you want Strike available anywhere you use Claude Code on this
machine.

```bash
claude plugin marketplace add emanualjade/strike --sparse .claude-plugin plugins --scope user
claude plugin install strike@strike --scope user
```

### Install For This Project Team

Use this when you want Strike registered for the current project so teammates
using the project can share the same plugin setup.

```bash
claude plugin marketplace add emanualjade/strike --sparse .claude-plugin plugins --scope project
claude plugin install strike@strike --scope project
```

### Install Privately For This Repo

Use this when you want Strike available only for your local copy of this
repository.

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
/strike:new-initiative Build an MVP for this idea
/strike:go Continue the active initiative
/strike:demo strike/initiatives/my-idea "Compare onboarding options"
/strike:system-visualizer strike/initiatives/my-idea
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

When resuming an existing Strike workspace after a plugin update, run the
current `go` skill first so it can refresh `strike/scripts/state.mjs` with
`sync-helper`. Do not rely on an older copied workspace helper before it is
synced.

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
