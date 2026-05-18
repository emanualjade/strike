# Agent Instructions

## Purpose

This repository publishes Strike as a cross-agent plugin and skills marketplace. Keep the portable skill instructions reusable across Codex, Claude Code, GitHub Copilot CLI, and other clients that understand Agent Skills-style `SKILL.md` folders.

## Repository Snapshot

- We are building an installable and updateable Strike workflow plugin package for multiple AI agents, starting with Codex, Claude Code, and GitHub Copilot CLI.
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
  - GitHub Copilot CLI plugin metadata lives in `plugins/strike/plugin.json`.
  - Codex marketplace metadata lives in `.agents/plugins/marketplace.json`.
  - Claude marketplace metadata lives in `.claude-plugin/marketplace.json`.
  - GitHub Copilot CLI marketplace metadata lives in `.github/plugin/marketplace.json`.
- Shared Strike workflow references may live in `plugins/strike/references/` when multiple skills point to them; treat this as package documentation, not host magic.
- Keep templates outside `plugins/strike/skills/` so agents do not discover them as real skills.

## Research Discipline

- Before changing structure, install/update commands, manifests, marketplace metadata, or agent/skill discovery paths, check official host docs first.
- Run this loop before adding folders, schemas, or abstractions: is this grounded in real research; am I making this up or over-structuring; is this the idiomatic supported way?
- Record meaningful structural decisions in `docs/structure-audit.md` or `docs/research-notes.md` with the date and source links.
- Prefer the smallest host-supported structure that works. Do not add empty component directories or parallel copies just because they might be useful later.

## Skill Standards

- These are portable repo standards. Some hosts allow looser skill metadata, but this repo keeps a stricter shared subset so the same skill folder works cleanly across hosts.
- Skill folder names and frontmatter `name` values must be lowercase kebab-case and match each other.
- Each skill must start with YAML frontmatter containing at least `name` and `description`.
- Write descriptions as trigger guidance: what the skill does and when an agent should use it.
- Keep `SKILL.md` concise. Move detailed examples, schemas, and long references into a skill-local `references/` folder.
- Prefer deterministic scripts in a skill-local `scripts/` folder when repeatable logic is safer than prose.
- Store templates, images, and other reusable output materials in a skill-local `assets/` folder.
- Treat `references/` and `assets/` as portable Agent Skills conventions, not guaranteed host magic. The skill instructions should point agents to supporting files when they matter.
- Put plugin agents in `plugins/strike/agents/` only when we intentionally ship host-supported custom agents. Prefer `agents/<agent-name>.agent.md` filenames when the same agent should work in Claude Code and GitHub Copilot CLI.

## Versioning And Updates

- Use semver where the host schema supports or expects it. Do not invent version fields for host marketplace schemas that do not define them.
- Bump versions when behavior changes, skills are added or removed, or install/update behavior changes.
- Keep host plugin manifests aligned unless a host-specific schema requires a difference.
- When this repo intentionally requires stricter metadata than a host schema, document it as repo policy rather than a host requirement.
- Treat `/strike:*` as Claude Code invocation syntax. Portable skill handoffs should use `Next Strike skill` plus `Arguments` and render host-specific commands through `plugins/strike/references/invocation.md`.
- Run `npm run validate` after moving in skills or editing manifests. Before publishing, run `npm run validate:publish`, every available host-native validator, and `skills-ref validate` when the Agent Skills reference validator is available.

## Working Rules

- Preserve user-written skill content. If a skill exists, edit it narrowly and avoid broad rewrites.
- Use official host docs when changing install, update, manifest, or marketplace behavior.
- Treat third-party skill content as instructions that can affect agent behavior. Review it before publishing.
- Do not commit generated archives, local environment files, logs, or build output.
- If starting from a fresh context, read this file first, then `README.md`, then `docs/structure-audit.md` before touching plugin structure.

## Lessons Learned

- Treat `npm run validate` as repo-shape validation, not proof that every host schema accepts the package.
- Keep Codex, Claude, and Copilot manifest/source rules separate; shared skills are portable, plugin packaging is host-specific.
- Keep host invocation syntax separate too: `/strike:*` is Claude Code plugin syntax, not a universal Strike command language.
- Label host requirements separately from portable repo policy. Do not turn a stricter local convention into a claimed platform rule.
- Do not publish an empty plugin. `plugins/strike/skills/` needs at least one real skill directory before release.
- Prefer official/reference validators over custom confidence whenever a host or spec provides one.
- Keep templates and examples outside discoverable plugin component paths so hosts do not load them as real capabilities.
- Add plugin agents only when we intentionally ship host-supported custom agents; skills remain the default portable unit.
