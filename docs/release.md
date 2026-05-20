# Release Workflow

Use this workflow when publishing a Strike version for Claude Code, Codex, and
GitHub Copilot CLI users.

## Normal Work

Before committing ordinary changes, run:

```bash
pnpm run test
pnpm run validate
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
and asks Claude to rehearse the tag creation with `--dry-run`.

5. If the Agent Skills reference validator is available on this workstation,
   run:

```bash
pnpm run validate:skills-ref
```

This validates every production skill under `plugins/strike/skills/` with the
reference Agent Skills validator. Skip this only when `skills-ref` is not
available; do not auto-install it during the release check.

6. Confirm the pushed release commit has green GitHub Actions checks:

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
  manifests. It does not check tag availability.
- `pnpm run validate:skills-ref`: validates every production skill with the
  external Agent Skills reference validator when `skills-ref` is already on
  `PATH`. It does not install that validator.
- `pnpm run release:check`: pre-release validation. It includes Claude's tag
  dry-run, so it fails if the current version tag already exists.
- `pnpm run release:tag`: creates and pushes the release tag. Run it only after
  `pnpm run release:check` passes.

Do not put `release:check` in normal GitHub Actions. After a release tag exists,
that command should fail until the next version bump. Normal CI should answer
"is this commit healthy?"; release checks answer "can this pushed commit become
a new release?"
