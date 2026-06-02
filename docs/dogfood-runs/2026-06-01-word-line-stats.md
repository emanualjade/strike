# Dogfood Run

Date: 2026-06-01
Host: Codex CLI
Host version: 0.135.0
Workspace: `/Users/cracklehat/Sites/strike-dogfood-proper-20260601-144334`
Scenario: Two quick CLI initiatives in one repo

## Result

Pass. The target Codex agent used the installed Strike plugin to complete two
initiatives in the same target repo without observer-created artifacts.

Target repo:
`/Users/cracklehat/Sites/strike-dogfood-proper-20260601-144334/word-stats`

Completed initiatives:

- `word-stats-cli`: built a dependency-free `word-stats` Node CLI.
- `line-stats`: added a second dependency-free `line-stats` command in the
  same package.

Independent checks after both target-agent runs:

- `node strike/scripts/state.mjs list-initiatives`: both initiatives complete.
- `npm test`: passed, 12 tests.
- `node bin/word-stats.js "hello world"`:
  `{"words":2,"characters":11,"readingMinutes":0.01}`.
- `node bin/line-stats.js $'hello\nworld'`:
  `{"lines":2,"empty":false}`.
- `package.json`: exposes both bins and has no dependencies.

## Artifacts Created

Both initiatives created the expected Strike artifact stack under
`strike/initiatives/`: idea, decisions, main spec, development plan, phase
spec, slice, research, plan, plan verification, build evidence, build
verification, phase verification, and final verification.

## Software Quality

The generated package is small, dependency-free, and tested with Node built-ins.
The second initiative reused the existing shared stats module instead of
scattering a separate utility.

## Workflow Issues

- The run was authentic: the target Codex agent invoked `$strike:new-initiative`,
  loaded Strike from its plugin cache, and drove `state.mjs` itself. The
  observer only installed the plugin, watched logs, and ran external checks
  after target runs completed.
- The second initiative correctly used `add-initiative`, preserved the first
  completed initiative, and ended with both initiatives complete.
- The second target run compressed several `complete-check` calls into one shell
  command after writing artifacts. This did not make the run fake, but it made
  state alone weaker evidence of stage-by-stage discipline.
- The workflow-position command returned `status: "blocked"` when no initiative
  was active after a successful finish, which read like a failure even though
  both initiatives were complete.
- Codex logged repeated icon warnings from other installed plugin metadata in
  the temporary Codex home. The installed Strike cache did not contain those
  icon fields.
- Codex telemetry warned about skill tags containing `strike:new-initiative`
  and `strike:go`; this appears host-side and did not block skill injection.

## Package Notes

No package install was needed. The target package used `npm test` only as a
script runner for `node --test`; no dependencies were installed.

## Strike Improvements

- Skill text: added step discipline so Strike agents complete one returned
  check, then ask the helper for the next step before continuing.
- State helper: changed the no-active-initiative current status from `blocked`
  to `idle`.
- Tests: updated state-helper tests for `idle` and added validator coverage for
  the no-batch `complete-check` guidance.
