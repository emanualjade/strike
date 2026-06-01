# Agent Instructions

## Purpose

This repository publishes Strike as a cross-agent plugin and skills marketplace. Keep the portable skill instructions reusable across Codex, Claude Code, and other clients that understand Agent Skills-style `SKILL.md` folders.

## Repository Snapshot

- We are building an installable and updateable Strike workflow plugin package for multiple AI agents, starting with Codex and Claude Code.
- The repo contains researched manifests, marketplaces, validation tooling,
  templates, documentation, and the production Strike skill package.
- The next milestone is to validate install/update flows in each supported host
  by using the normal Strike workflow.
- The core design is one shared Agent Skills content tree plus thin host-specific packaging. Cross-agent support does not mean forcing every host into one invented schema.

## Source Of Truth

- Put production skills in `plugins/strike/skills/<skill-name>/SKILL.md`.
- Keep one portable skill implementation. Do not fork the same skill into separate Codex and Claude copies unless an incompatibility is unavoidable.
- Put agent-specific metadata beside the portable content:
  - Codex plugin metadata lives in `plugins/strike/.codex-plugin/plugin.json`.
  - Claude plugin metadata lives in `plugins/strike/.claude-plugin/plugin.json`.
  - Codex marketplace metadata lives in `.agents/plugins/marketplace.json`.
  - Claude marketplace metadata lives in `.claude-plugin/marketplace.json`.
- Shared Strike workflow references may live in `plugins/strike/references/` when multiple skills point to them; treat this as package documentation, not host magic.
- Keep templates outside `plugins/strike/skills/` so agents do not discover them as real skills.

## Research Discipline

- Before changing structure, install/update commands, manifests, marketplace metadata, or agent/skill discovery paths, check official host docs first.
- Run this loop before adding folders, schemas, or abstractions: is this grounded in real research; am I making this up or over-structuring; is this the idiomatic supported way?
- Record meaningful structural decisions in `docs/structure-audit.md` or `docs/research-notes.md` with the date and source links.
- Prefer the smallest host-supported structure that works. Do not add empty component directories or parallel copies just because they might be useful later.

## Skill Standards

- These are portable repo standards. Some hosts allow looser skill metadata, and some host-specific fields carry real runtime behavior.
- Skill folder names and frontmatter `name` values must be lowercase kebab-case and match each other.
- Each skill must start with YAML frontmatter containing at least `name` and `description`.
- Use host-specific frontmatter only when it has documented value. For Claude
  Code, `argument-hint` improves slash-command UX and
  `disable-model-invocation: true` keeps Strike workflow skills manually
  invoked instead of auto-triggered.
- Write descriptions as trigger guidance: what the skill does and when an agent should use it.
- Keep `SKILL.md` concise. Move detailed examples, schemas, and long references into a skill-local `references/` folder.
- Prefer deterministic scripts in a skill-local `scripts/` folder when repeatable logic is safer than prose.
- Store templates, images, and other reusable output materials in a skill-local `assets/` folder.
- Treat `references/` and `assets/` as portable Agent Skills conventions, not guaranteed host magic. The skill instructions should point agents to supporting files when they matter.
- Put plugin agents in `plugins/strike/agents/` only when we intentionally ship host-supported custom agents.

## Versioning And Updates

- Use semver where the host schema supports or expects it. Do not invent version fields for host marketplace schemas that do not define them.
- Bump versions when behavior changes, skills are added or removed, or install/update behavior changes.
- Keep host plugin manifests aligned unless a host-specific schema requires a difference.
- When this repo intentionally requires stricter metadata than a host schema, document it as repo policy rather than a host requirement.
- Treat `/strike:*` as Claude Code invocation syntax. Keep portable skill instructions free of host-specific invocation details; put host-specific examples in README or host docs.
- Local workstation package work uses pnpm only. Never use `npm` or `npx` locally for repo scripts, installs, or one-off package execution. Use `pnpm run` for scripts and `pnpm exec` for installed binaries.
- Use the normal `pnpm` command so local Socket Firewall aliases or wrappers can apply. Do not bypass wrappers with `command pnpm` or an absolute pnpm binary path.
- Use standalone `pnpm` for this repo. Do not use Corepack commands such as `corepack`, `corepack pnpm`, `corepack enable`, or `corepack prepare`. If pnpm reports a version mismatch, stop and alert the user. Do not try to resolve it.
- Do not run local package installs unless the user explicitly approves. If pnpm is missing or the version is wrong, ask the user to install or enable standalone pnpm 11.
- If `pnpm run ...` fails with `ERR_PNPM_VERIFY_DEPS_BEFORE_RUN` because local
  workspace metadata is stale, Codex may run
  `pnpm install --frozen-lockfile --ignore-scripts` without separate approval,
  only to refresh local install metadata. If pnpm wants to change the lockfile,
  download packages outside the lockfile, run dependency build scripts, use a
  different pnpm version, or otherwise do more than refresh local install
  metadata, stop and ask.
- Never approve pnpm dependency build scripts unilaterally. If pnpm asks for build-script approval, stop and work with the user to validate each package before allowlisting it.
- Run `pnpm run validate` after moving in skills or editing manifests. Before publishing, run `pnpm run validate:publish` and every available host-native validator. Treat `skills-ref` as an optional research/debugging tool unless it gains a documented way to handle useful host-specific fields.

## Release Checklist

- Use `docs/release.md` for the full release workflow.
- If installed users need to receive a change through normal plugin update, make a semver release instead of only pushing to `main`.
- Before committing the release, update `CHANGELOG.md` and bump every versioned surface that exists: `package.json`, `plugins/strike/.codex-plugin/plugin.json`, `plugins/strike/.claude-plugin/plugin.json`, and `.claude-plugin/marketplace.json`.
- Do not add a version to `.agents/plugins/marketplace.json`; that marketplace entry intentionally uses the Codex local-path shape.
- Run `pnpm run release:validate` before the release commit when practical, then commit and push the version/changelog changes.
- After the release commit is pushed, run `pnpm run release:tag`; it reruns the release checks, creates `strike--v<version>`, and pushes the tag.

## Host Smoke Workflows

- Use precise terms: `target CLI` means Claude Code or Codex; `local workstation` means the maintainer's machine; `GitHub runner` means the disposable Actions machine.
- Develop GitHub Actions host smoke-test changes on a separate branch first.
- Keep `workflow_dispatch` on host smoke workflows so maintainers can rerun them on demand.
- Host smoke workflows may also run on `pull_request` once the team is actively hardening them on PRs. Do not add `push`, `schedule`, release, or required-check behavior until the PR-triggered workflows have passed reliably.
- Do not make host smoke workflows required PR or release gates until their CLI install, auth, cache, and cleanup behavior is stable.
- Keep host smoke-test implementation notes in `docs/host-smoke-tests.md`, not the public `README.md`.
- Never install or update target CLIs from local workstation checks. Local checks may use target CLIs already on `PATH`; if one is missing, ask the user to install it or run the GitHub workflow.
- GitHub runner workflows may install target CLIs because runners are disposable. Treat GitHub-hosted workflows as the source of truth for fresh-install and update confidence. Local Docker, temp-home, or `act` runs are debugging aids unless the repo explicitly promotes them later.
- Keep each host isolated in its own workflow so Claude Code and Codex failures can be debugged independently.

## Working Rules

- Preserve user-written skill content. If a skill exists, edit it narrowly and avoid broad rewrites.
- Use official host docs when changing install, update, manifest, or marketplace behavior.
- Treat third-party skill content as instructions that can affect agent behavior. Review it before publishing.
- Do not commit generated archives, local environment files, logs, or build output.
- If starting from a fresh context, read this file first, then `README.md`, then `docs/structure-audit.md` before touching plugin structure.

## Lessons Learned

- Treat `pnpm run validate` as repo-shape validation, not proof that every host schema accepts the package.
- Keep Codex and Claude manifest/source rules separate; shared skills are portable, plugin packaging is host-specific.
- Keep host invocation syntax separate too: `/strike:*` is Claude Code plugin syntax, not a universal Strike command language or skill instruction.
- Label host requirements separately from portable repo policy. Do not turn a stricter local convention into a claimed platform rule.
- Do not publish an empty plugin. `plugins/strike/skills/` needs at least one real skill directory before release.
- Prefer official/reference validators over custom confidence whenever a host or spec provides one.
- Keep templates and examples outside discoverable plugin component paths so hosts do not load them as real capabilities.
- Add plugin agents only when we intentionally ship host-supported custom agents; skills remain the default portable unit.
