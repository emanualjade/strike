# Strike Dogfood Protocol

Use this when a maintainer wants Codex to dogfood Strike against a real local
workspace.

Dogfooding is different from host smoke testing. Smoke tests prove install and
runtime mechanics. Dogfooding checks whether Strike produces good software
when used through Codex or Claude Code like a normal user would use it.

Dogfooding is a learning loop, not a release gate. Use it to find workflow,
skill, and software-quality problems before release. Host smoke tests remain the
deterministic release gate.

## Workspace

Use `~/Sites` for local dogfood projects.

Default reusable workspace:

```text
~/Sites/strike-dogfood
```

Reuse the workspace when it is useful. Do not reinstall packages just to get a
fresh directory. Create a new dogfood directory only when an old run would
confuse the scenario.

Keep dogfood output outside this repo unless the user explicitly asks to bring
specific learnings or fixtures back into Strike.

## Host Choice

Choose Codex or Claude Code based on what we need to learn.

- Use Codex when checking the normal Codex plugin experience.
- Use Claude Code when checking Claude plugin invocation, pacing, or behavior.
- Use both when comparing host behavior is the point of the run.

Record the host, version, scenario, workspace path, and date in the dogfood
workspace notes.

## Preflight

Before starting the target agent, confirm the host is using the intended Strike
source and version.

- Codex: run `codex plugin list --marketplace strike` and confirm
  `strike@strike` points at this checkout and the expected version.
- Claude Code: run `claude plugin list --json` and confirm `strike@strike`
  has the expected installed version and path.

If the installed plugin is stale or from the wrong source, refresh it before the
dogfood run. Record that in the dogfood notes because stale installs make the
results misleading.

When dogfooding unreleased local changes, make sure the target host points at
this checkout, not public `main`. For Codex local checkout runs, refresh with:

```bash
codex plugin remove strike@strike
codex plugin add strike@strike
codex plugin list --marketplace strike
```

For Claude Code, use the documented local plugin install or update path from
the README and confirm the installed path before starting.

## Safety Boundaries

Dogfood in a disposable local workspace.

- Do not use production data, real customer data, secrets, or private `.env`
  values.
- Do not point the target agent at real payment, email, auth, analytics, or
  external-write providers.
- Do not use an authenticated browser profile unless the scenario explicitly
  needs it and the user approves.
- Prefer local files, local storage, mock data, and local servers.

## No-Hints Rule

Do not tell the target agent that it is being tested, dogfooded, benchmarked, or
observed.

Prompt it like a normal user:

- ask for the feature naturally
- guide it only as a user would
- do not include the expected answer
- do not mention hidden acceptance criteria beyond the real request
- do not expose internal review notes, suspected bugs, or intended fixes

Observe the run from the outside: what it asks, what it creates, how it uses
Strike, whether it follows state, and whether the software quality is good.

## Authentic Run Rules

A dogfood run must exercise Strike through the target agent. Do not simulate the
workflow by hand.

- Do not manually create Strike artifacts for the target agent.
- Do not manually fill in phase, slice, research, plan, build, review, or
  verification documents.
- Do not manually advance `strike/state.json` or run state-helper completion
  commands on behalf of the target agent.
- Do not replace a real staged run with a script that writes the expected files.
- Do not count host smoke tests, helper tests, or manual state-machine checks as
  dogfood evidence.

The observer may run setup, install/update checks, and external verification
after the target agent finishes a step. The observer may also inspect files,
record notes, and answer product questions. If the observer has to create
artifacts, edit code, or advance state to make the run pass, the dogfood run is
invalid and should be restarted or recorded as failed.

## Review Handling

Keep build prompts natural. Do not tell the build agent that review subagents
will inspect the work, that it is being evaluated, or that the dogfood is
checking a particular failure mode.

Run reviews only at the normal Strike verification stages. Review agents should
be independent and read-only. They return findings to the verifier; they do not
edit files, coach the builder in advance, update state, or decide whether the
stage passes.

## Package Safety

Prefer scenarios that do not need new packages.

When packages are needed:

- use `pnpm`
- do not use `npm`, `npx`, or Corepack
- identify exact package versions before installing
- prefer stable, boring packages with release versions roughly 10 to 20 days old
- record package names, versions, release dates, and why they are acceptable
- reuse an existing installed dogfood workspace when it already has the needed
  packages
- do not install ad hoc packages during the run
- do not approve dependency build scripts automatically

If a package choice is uncertain, pause and ask the user before installing it.

## Browser Checks

For browser-visible work, verify in a real browser or with Playwright CLI when
available. Static review, curl, and DOM inspection are useful, but they are not
browser verification.

If browser verification is blocked, record what should have run, what blocked
it, what replacement evidence was checked, and the remaining user-facing risk.

## Dogfood Scenarios

Use a quick smoke scenario for routine checks. Before release, run at least one
medium stress scenario.

### Quick Smoke

Natural prompt:

```text
I want a tiny local issue board where I can add issues, set status, filter by
status, and keep the data after refresh.
```

This is useful for checking install, state setup, basic artifacts, a small slice
loop, and browser-visible behavior.

### Medium Stress

Natural prompt:

```text
I want a small local billing ledger I can run in the browser. It should let me
create customers, record charges, payments, refunds, and adjustments, show each
customer's balance, preserve an audit trail, filter the ledger, and keep the
data after refresh. This is local-only for now, but I want it built carefully so
the money/state logic is not made up.
```

Observer-only coverage to look for, without giving these hints to the target
agent:

- clear initiative state and resumable workflow
- concise project language updates
- useful grilling around money, audit trail, reversals, and local-only scope
- source-backed research for money/accounting and browser storage choices
- phases and slices that stay thin enough to build
- focused tests for balance math, reversals, invalid amounts, and persistence
- browser or Playwright verification for the accepted UI flow
- verification/fix loop behavior when issues appear

## How To Run

1. Pick a quick smoke or medium stress scenario.
2. Pick Codex or Claude Code.
3. Start in the dogfood workspace.
4. Run the preflight check for the chosen host.
5. Invoke Strike as a user would: start a new Strike initiative or resume
   with `go`.
6. Let the target agent move through the workflow and create the artifacts.
7. Intervene only as a user would when it asks questions, gets blocked, or needs
   product direction.
8. Do not create or repair Strike artifacts for the target agent. If that seems
   necessary, record the run as failed or restart it.
9. Inspect generated artifacts and code after the run.
10. Confirm the target agent actually went through the expected stages: idea,
   decisions, main spec, development phases, phase spec, slices, research,
   plan, plan verification, build, build verification/review, phase
   verification, and main-spec verification.
11. Run the dogfood project's own checks when available.
12. Record what worked, what failed, and what should change in Strike.

## What To Record

Keep notes compact.

```md
# Dogfood Run

Date:
Host:
Host version:
Workspace:
Scenario:

## Result

## Artifacts Created

## Software Quality

## Workflow Issues

## Package Notes

## Strike Improvements
- Skill text:
- State helper:
- Docs:
- Tests:
```

Turn dogfood findings into repo changes only after deciding whether the problem
belongs in skill instructions, helper behavior, docs, tests, or release notes.
