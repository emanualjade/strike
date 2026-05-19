# Strike Todo

Last updated: 2026-05-19.

This is the maintainer checklist for Strike. The public `README.md` is for
plugin users; this file tracks release, validation, and setup work.

## Remaining Work

### User Decisions Needed

- None right now.

### User Tool Or UI Access Needed, Then Codex Can Continue

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
    claude plugin update strike@strike --scope user
    claude plugin update strike@strike --scope project
    claude plugin update strike@strike --scope local
    ```
    Run only the Claude update command for the scope being checked.
- [ ] Update `README.md` with any exact invocation details learned from the
  Codex UI check or Copilot CLI smoke test.
  - Owner: Codex.
  - When it matters: after those checks are completed.
- [ ] Keep improving local validation when new release risks show up.
  - Owner: Codex.
  - When it matters: whenever we change plugin structure, skill metadata,
    invocation language, or host manifests.

## Release Checklist

Run these before versioned releases:

```bash
npm run release:check
npm run release:tag
```

See `docs/release.md` for the difference between normal validation, release
validation, and publishing a release tag.

Also run `skills-ref validate` when that tool is available.
