# Strike Todo

Last updated: 2026-05-17.

Use this as the running checklist for work that is not done yet, especially host validation that depends on tools or accounts outside this repo.

## Current Split

### Codex Can Still Do In This Repo

- Add a first changelog/release note.
- Keep improving local validation and smoke checks when new risks show up.
- Prepare Copilot CLI smoke-test notes once the `copilot` command is available.

### Completed Locally

- Reviewed every imported skill as executable agent behavior before public release.
- Fixed host-neutral handoff drift in shared stage contracts.
- Fixed cross-lane routing so skills that recommend lane-bound upstream work also move the board pointer first.
- Defined the acceptance-fix loop: acceptance can move work back to implementation, phase-fix repairs phase-scoped acceptance findings, and phase-review verifies before acceptance reruns.
- Extended local validation for skill handoff targets, Codex `agents/openai.yaml` metadata, host-neutral skill docs, and host-neutral stage contracts.
- Set the package license to MIT and added `LICENSE`.
- Pushed `main` to `emanualjade/strike`; GitHub now reports `main` as the
  default branch. The repository is currently private.
- Confirmed Codex can add `git@github.com:emanualjade/strike.git` as a
  Git-backed marketplace and run `codex plugin marketplace upgrade strike`.
- Confirmed Claude Code can add `emanualjade/strike` as a Git-backed
  marketplace, install `strike@strike`, update it, and invoke `/strike:go`.

### User Action Needed

- Decide whether `emanualjade/strike` should stay private for initial testing
  or become public for release.
- Install or expose unavailable external tools if we want those checks:
  - `skills-ref`
  - GitHub Copilot CLI / `copilot`
- Open Codex's `/plugins` browser when we need to confirm the Codex UI install and skill visibility, unless Codex exposes a noninteractive install command later.

### Externally Gated

- Copilot CLI testing requires the `copilot` command.
- Agent Skills reference validation requires the `skills-ref` command.

## Tooling Gaps

- [ ] Install or locate the Agent Skills reference validator, then run `skills-ref validate` against representative production skills.
- [ ] Install or enable GitHub Copilot CLI, then run the local plugin smoke test:
  - `copilot plugin install ./plugins/strike`
  - `copilot plugin update strike`
- [x] Confirm whether the final GitHub repo slug is `emanualjade/strike`; update README and marketplace metadata if the published repo uses a different slug.

## Invocation Portability

- [x] Add `plugins/strike/references/invocation.md` to define the canonical Strike skill flow separately from host-specific command syntax.
- [x] Update `plugins/strike/README.md` with a host invocation matrix:
  - Claude Code: `/strike:<skill> <args>`.
  - Codex: use the installed Strike plugin/skill mention or natural-language skill selection; do not document `/strike:*` as a Codex command.
  - GitHub Copilot CLI: use the skill-name command form after confirming it with `/skills list` and `/skills info`.
- [x] Update `plugins/strike/skills/start/scripts/start-card.sh` so generated handoffs include host-neutral fields such as `next_skill=brainstorm` and `next_args=<feature-slug>` instead of only a Claude-specific next action.
- [x] Review imported skill `Next:` and handoff sections so `/strike:*` is either clearly labeled as Claude Code syntax or replaced with host-neutral "next Strike skill" language.
- [x] Extend `scripts/validate.mjs` to catch concrete `/strike:<skill>` and `/clear` instructions inside portable `SKILL.md` files and shared stage contracts.
- [x] Smoke-check docs and skills for stale universal invocation claims, old package paths, and old command prefixes.

## Host Smoke Tests

- [x] Codex: add this repo as a local marketplace with `codex plugin marketplace add ./`.
- [ ] Codex: open `/plugins`, install Strike from the local marketplace, confirm Strike skills are visible, and record the exact invocation form Codex exposes.
- [x] Codex: add `git@github.com:emanualjade/strike.git` as a Git-backed marketplace and run `codex plugin marketplace upgrade strike`.
- [ ] Codex: after the next versioned change, rerun `codex plugin marketplace upgrade strike` to confirm it pulls a newer revision.
- [x] Claude Code: run `claude --plugin-dir ./plugins/strike` and invoke a low-risk skill such as `/strike:go`; it returned the expected no-board result plus a canonical next-skill handoff.
- [x] Claude Code: rerun `/strike:go smoke-test` after the release-readiness skill audit; expected no-board behavior still works.
- [x] Claude Code: add this repo as a local marketplace, install `strike@strike`, run `claude plugin update strike@strike --scope local`, and invoke `/strike:go` from the installed plugin.
- [x] Claude Code: add the Git-backed marketplace from `emanualjade/strike`, install `strike@strike`, run `claude plugin update strike@strike --scope local`, and invoke `/strike:go` from the installed plugin.
- [ ] Claude Code: after the next versioned change, rerun `claude plugin update strike@strike --scope local` to confirm it pulls a newer revision.
- [ ] GitHub Copilot CLI: install from the local path, run `/skills list` and `/skills info`, invoke a low-risk Strike skill, and confirm whether plugin skills use plain `/skill-name` commands.
- [ ] GitHub Copilot CLI: after publication, install from the marketplace entry and run `copilot plugin update strike`.

## Release Readiness

- [x] Review every imported skill as executable agent behavior before public release.
- [x] Use MIT for the public package and keep manifests/docs consistent.
- [ ] Before the first published release, decide whether the initial public
  version stays `0.1.0`; after publication, bump all host manifest and
  marketplace versions whenever shipped behavior changes.
- [ ] Run before release:
  - `npm run validate`
  - `npm run validate:publish`
  - `claude plugin validate ./plugins/strike`
  - `claude plugin validate ./.claude-plugin/marketplace.json`
  - `claude plugin tag --dry-run --force ./plugins/strike`
  - `skills-ref validate` when available
- [x] Current release-readiness pass on 2026-05-17 ran the available checks:
  `npm run validate`, `npm run validate:publish`, both Claude validators,
  `claude plugin tag --dry-run --force ./plugins/strike`, start-script smoke,
  and Claude `/strike:go smoke-test`.

## Nice-To-Have

- [ ] Add a short changelog once the first public release is cut.
- [ ] Add screenshots or examples to the Codex plugin interface only if they help users understand Strike faster.
- [ ] Evaluate an optional APM manifest only after the native Codex, Claude, and Copilot plugin paths are working.
- [x] Add scripted validation for skill frontmatter, host invocation references, balanced Markdown fences, and host-neutral Strike handoffs.
