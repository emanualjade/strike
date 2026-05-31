# Release Workflow

Use this workflow when publishing a Strike version for Claude Code and Codex
users.

## Normal Work

If `pnpm run ...` reports `ERR_PNPM_VERIFY_DEPS_BEFORE_RUN`, the local pnpm
workspace receipt is stale. Refresh it before continuing:

```bash
pnpm install --frozen-lockfile --ignore-scripts
```

This command is for local metadata refresh only. If it wants to change the
lockfile, download packages outside the lockfile, run dependency build scripts,
or otherwise do more than refresh the existing install state, stop and inspect
the change before continuing.

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
   `plugins/strike/.claude-plugin/plugin.json`, and
   `.claude-plugin/marketplace.json`. Do not add a version to
   `.agents/plugins/marketplace.json`.
2. If package metadata changed since the last local install, refresh stale pnpm
   workspace metadata with:

```bash
pnpm install --frozen-lockfile --ignore-scripts
```

3. Run `pnpm run test` and `pnpm run validate:publish` locally when practical.
4. Commit the release changes.
5. Push the commit to GitHub.
6. Run:

```bash
pnpm run release:check
```

This validates the repo, validates the Claude plugin and marketplace manifests,
and asks Claude to rehearse the tag creation with `--dry-run`.

7. Confirm the pushed release commit has green GitHub Actions checks:

- `CI`
- `Host Smoke - Claude Code`
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
- `pnpm run release:check`: pre-release validation. It includes Claude's tag
  dry-run, so it fails if the current version tag already exists.
- `pnpm run release:tag`: creates and pushes the release tag. Run it only after
  `pnpm run release:check` passes.

Do not put `release:check` in normal GitHub Actions. After a release tag exists,
that command should fail until the next version bump. Normal CI should answer
"is this commit healthy?"; release checks answer "can this pushed commit become
a new release?"

`skills-ref` is not a release gate right now. The current reference validator
rejects useful Claude Code top-level fields such as `argument-hint` and
`disable-model-invocation`, while Strike intentionally ships those fields for
Claude behavior. Reconsider it only if the validator gains a host-extension
configuration or Strike adds an explicit reference-only package projection.
