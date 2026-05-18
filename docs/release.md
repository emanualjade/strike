# Release Workflow

Use this workflow when publishing a Strike version for Claude and Codex users.

## Normal Work

Before committing ordinary changes, run:

```bash
npm test
npm run validate
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
npm run release:check
```

This validates the repo, validates the Claude plugin and marketplace manifests,
and asks Claude to rehearse the tag creation with `--dry-run`.

If the check passes, publish the tag:

```bash
npm run release:tag
```

That creates and pushes the `strike--v<version>` git tag.

## Command Meanings

- `npm run release:validate`: safe validation for the package and Claude
  manifests. It does not check tag availability.
- `npm run release:check`: pre-release validation. It includes Claude's tag
  dry-run, so it fails if the current version tag already exists.
- `npm run release:tag`: creates and pushes the release tag. Run it only after
  `npm run release:check` passes.

Do not put `release:check` in normal GitHub Actions. After a release tag exists,
that command should fail until the next version bump. Normal CI should answer
"is this commit healthy?"; release checks answer "can this pushed commit become
a new release?"
