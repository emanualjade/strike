# Release Workflow

Use this workflow when publishing a Strike version for Claude Code, Codex, and
GitHub Copilot CLI users.

## Local Prerequisite

Install the Agent Skills reference validator once on maintainer workstations:

```bash
uv tool install 'git+https://github.com/agentskills/agentskills.git@1f2afe4d5428d12b0f22781b04b81a769b5fa4ce#subdirectory=skills-ref'
```

This provides the `skills-ref` command used by `pnpm run validate:skills-ref`.
GitHub Actions installs the same pinned validator in disposable runner
environments.

## Normal Work

Before committing ordinary changes, run:

```bash
pnpm run test
pnpm run validate
pnpm run validate:skills-ref
```

Then commit and push as usual:

```bash
git commit
git push
```

GitHub Actions runs the normal repo checks after push. Normal pushes do not
create release tags.

## Release Work

A release tag says that one exact pushed commit is a published plugin version.
For Claude plugins, the tag format is:

```text
strike--v<version>
```

Release only after the version and changelog changes are committed and pushed.

1. Update `CHANGELOG.md` and all versioned package surfaces:
   `package.json`, `plugins/strike/.codex-plugin/plugin.json`,
   `plugins/strike/.claude-plugin/plugin.json`, `plugins/strike/plugin.json`,
   `.claude-plugin/marketplace.json`, and
   `.github/plugin/marketplace.json`. Do not add a version to
   `.agents/plugins/marketplace.json`.
2. Commit the release changes.
3. Push the commit to GitHub.
4. Run:

```bash
pnpm run release:check
```

This validates the repo, validates the Claude plugin and marketplace manifests,
validates every production skill with the Agent Skills reference validator,
and asks Claude to rehearse the tag creation with `--dry-run`.

5. Confirm the pushed release commit has green GitHub Actions checks:

- `CI`
- `Host Smoke - Claude Code`
- `Host Smoke - GitHub Copilot CLI`
- `Host Smoke - Codex`

If any host smoke workflow has not run on the release commit, trigger it
manually with `workflow_dispatch` from the Actions tab and wait for it to pass.
These host smoke checks are the release gate for fresh install/update confidence.

If the local release check and GitHub host smoke checks pass, publish the tag:

```bash
pnpm run release:tag
```

That creates and pushes the `strike--v<version>` git tag.

## Command Meanings

- `pnpm run release:validate`: safe validation for the package and Claude
  manifests, including Agent Skills reference validation. It does not check tag
  availability.
- `pnpm run validate:skills-ref`: validates every production skill with the
  external Agent Skills reference validator. It requires `skills-ref` on
  `PATH`; GitHub Actions installs the pinned validator automatically.
- `pnpm run release:check`: pre-release validation. It includes Claude's tag
  dry-run, so it fails if the current version tag already exists.
- `pnpm run release:tag`: creates and pushes the release tag. Run it only after
  `pnpm run release:check` passes.

Do not put `release:check` in normal GitHub Actions. After a release tag exists,
that command should fail until the next version bump. Normal CI should answer
"is this commit healthy?"; release checks answer "can this pushed commit become
a new release?"
