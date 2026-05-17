# Strike Todo

Last updated: 2026-05-17.

This is the maintainer checklist for Strike. The public `README.md` is for
plugin users; this file tracks release, validation, and setup work.

## Remaining Work

### User Decisions Needed

- [ ] Decide whether the first public release stays `0.1.0`.
  - Owner: user decides; Codex can update versions and tag the release.
  - When it matters: before the first public release tag.
  - Suggested default: keep `0.1.0` for the first public testing release.

### User Tool Or UI Access Needed, Then Codex Can Continue

- [ ] Confirm Strike in the Codex `/plugins` UI.
  - Owner: user, unless the user asks Codex to drive the app UI with Computer
    Use.
  - When it matters: before we claim Codex install and skill visibility are
    fully smoke-tested.
  - How: open Codex, type `/plugins`, find Strike, install or enable it, then
    start a fresh conversation and confirm Strike skills are visible.
- [ ] Run Agent Skills reference validation with `skills-ref`.
  - Owner: user makes the `skills-ref` command available; Codex runs the check.
  - When it matters: before claiming reference-validator coverage.
  - How once available:
    ```bash
    skills-ref validate plugins/strike/skills/start
    skills-ref validate plugins/strike/skills/go
    skills-ref validate plugins/strike/skills/spec
    ```
- [ ] Run GitHub Copilot CLI smoke tests.
  - Owner: user installs/authenticates the `copilot` command; Codex runs the
    checks.
  - When it matters: before claiming Copilot CLI support is fully verified.
  - How once available:
    ```bash
    copilot plugin marketplace add emanualjade/strike
    copilot plugin install strike@strike
    copilot plugin list
    ```
    Then in Copilot CLI, confirm `/skills list` and a low-risk Strike skill.

### Codex Can Do Later

- [ ] After the next versioned Strike release, rerun host update checks.
  - Owner: Codex.
  - When it matters: after a behavior change, skill change, or version bump is
    committed and pushed.
  - How:
    ```bash
    codex plugin marketplace upgrade strike
    claude plugin marketplace update strike
    claude plugin update strike@strike
    ```
- [ ] Update `README.md` with any exact invocation details learned from the
  Codex UI check or Copilot CLI smoke test.
  - Owner: Codex.
  - When it matters: after those checks are completed.
- [ ] Keep improving local validation when new release risks show up.
  - Owner: Codex.
  - When it matters: whenever we change plugin structure, skill metadata,
    invocation language, or host manifests.

## Completed

- [x] Moved the production Strike plugin into `plugins/strike`.
- [x] Made `strike` the installable plugin identity.
- [x] Added Codex, Claude Code, and GitHub Copilot CLI manifests and marketplace
  entries.
- [x] Preserved production skills and Codex `skills/*/agents/openai.yaml`
  metadata.
- [x] Added `plugins/strike/references/invocation.md` for host-neutral Strike
  handoffs.
- [x] Reworked portable skill docs so shared instructions do not assume
  Claude-only `/strike:*` syntax.
- [x] Reviewed imported skills as executable workflow behavior.
- [x] Fixed host-neutral handoff drift in shared stage contracts.
- [x] Fixed cross-lane routing so lane-bound upstream work moves the board
  pointer first.
- [x] Defined the acceptance-fix loop: acceptance can move work back to
  implementation, `phase-fix` repairs phase-scoped acceptance findings, and
  `phase-review` verifies before acceptance reruns.
- [x] Extended local validation for skill handoff targets, Codex
  `agents/openai.yaml` metadata, host-neutral skill docs, host-neutral stage
  contracts, version alignment, MIT licensing, and balanced Markdown fences.
- [x] Set the package license to MIT and added `LICENSE`.
- [x] Added the initial `0.1.0` changelog.
- [x] Rewrote `README.md` as a user-only install and usage guide.
- [x] Pushed `main` to `emanualjade/strike`; GitHub reports `main` as the
  default branch.
- [x] Confirmed `emanualjade/strike` is currently private.
- [x] Decided to keep `emanualjade/strike` private for now.
- [x] Confirmed Codex can add `git@github.com:emanualjade/strike.git` as a
  Git-backed marketplace and run `codex plugin marketplace upgrade strike`.
- [x] Confirmed Claude Code can add `emanualjade/strike` as a Git-backed
  marketplace, install `strike@strike`, update it, and invoke `/strike:go`.
- [x] Confirmed Claude Code local plugin smoke test with `/strike:go`.
- [x] Confirmed `npm run validate` and `npm run validate:publish` pass.
- [x] Confirmed both Claude validators pass.
- [x] Confirmed `claude plugin tag --dry-run --force ./plugins/strike` passes.
- [x] Smoke-checked the `start` script.

## Release Checklist

Run these before the first public release and before later releases:

```bash
npm run validate
npm run validate:publish
claude plugin validate ./plugins/strike
claude plugin validate ./.claude-plugin/marketplace.json
claude plugin tag --dry-run --force ./plugins/strike
```

Also run `skills-ref validate` and Copilot CLI smoke tests when those tools are
available.
