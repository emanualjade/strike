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
- [ ] Run GitHub Actions host smoke workflows from a feature branch and iron
  out failures.
  - Owner: user starts the manual workflows in GitHub Actions after the workflow
    files are on a branch GitHub can run; Codex iterates on failures.
  - When it matters: before promoting host smoke workflows to a release gate.
  - Notes: see `docs/host-smoke-tests.md` before implementing or editing the
    workflow files.

### Codex Can Do Later

- [ ] Iron out host smoke workflow failures and decide which checks can become
  release gates.
  - Owner: Codex.
  - When it matters: after the manual GitHub workflows have real run history.
  - Notes: keep live model invocation out of required checks until auth and
    cost behavior are explicit.
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
- [ ] Reconsider host-specific generated skill packages only if the portable
  customization loader becomes insufficient.
  - Owner: Codex.
  - When it matters: if a supported host offers a clearly better, documented way
    to preload repo-local customization without weakening portability.
- [ ] Decide whether custom executable review scripts should exist.
  - Owner: Codex.
  - When it matters: only if Markdown review lenses are not enough.
  - Notes: define trust, allowlist, execution, and validation rules before adding
    any executable customization surface.

## Release Checklist

Run these before versioned releases:

```bash
pnpm run release:check
pnpm run release:tag
```

See `docs/release.md` for the difference between normal validation, release
validation, and publishing a release tag.

Also run `skills-ref validate` when that tool is available.
