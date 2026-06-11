---
name: verify-slice-plan
description: Verify one slice plan is clear, scoped, researched, and ready to build.
argument-hint: "[slice plan/context]"
disable-model-invocation: true
allowed-tools: Read Write Edit MultiEdit Bash Grep Glob WebFetch WebSearch Agent
---

# Verify Slice Plan

Verify one slice plan is ready to build.

Standard-tier plans normally skip this verifier: when `plan.md` declares
`Plan Verification Tier: standard` with every trigger answered `no`, `go`
completes `planVerified` from that declaration and this skill does not run.
Run the full verification below when the tier is `deep`, the declaration is
missing or contested, or the user asks for it. Once this verifier writes
`plan-verification.md`, that artifact becomes the gate's source of truth for
the slice.

## Inputs

- Required verification packet:
  - `strike/initiatives/<initiative-id>/phases/<phase-id>/slices/<slice-id>/slice.md`
  - `strike/initiatives/<initiative-id>/phases/<phase-id>/slices/<slice-id>/plan.md`
  - `strike/initiatives/<initiative-id>/phases/<phase-id>/phase-spec.md`
  - `strike/initiatives/<initiative-id>/phases/<phase-id>/research.md`
  - `strike/initiatives/<initiative-id>/phases/<phase-id>/research-audit.md`
- optional context when needed:
  - `strike/initiatives/<initiative-id>/supporting-artifacts/`
  - focused repo paths
- shared slice-boundary standard from the Strike plugin root's
  `references/slice-boundaries.md`
- Required user-provided customization from the consuming repo's Strike
  workspace:
  - user review lenses:
    - `strike/user-guidance/review-lenses/global.md`
    - `strike/user-guidance/review-lenses/verify-slice-plan.md`
  - user implementation-discipline guidance:
    - `strike/user-guidance/implementation-discipline/global.md`
    - `strike/user-guidance/implementation-discipline/verify-slice-plan.md`
- Bundled Strike review-agent instructions. Load only for launched subagents:
  - `references/review-agents/output-discipline.md`
  - `references/review-agents/plan-implementation-readiness-audit.md`
  - `references/review-agents/canonical-readiness-audit.md`

## Process

1. Read the required verification packet:
   - `strike/initiatives/<initiative-id>/phases/<phase-id>/slices/<slice-id>/slice.md`
   - `strike/initiatives/<initiative-id>/phases/<phase-id>/slices/<slice-id>/plan.md`
   - `strike/initiatives/<initiative-id>/phases/<phase-id>/phase-spec.md`
   - `strike/initiatives/<initiative-id>/phases/<phase-id>/research.md`
   - `strike/initiatives/<initiative-id>/phases/<phase-id>/research-audit.md`
2. Read bundled `references/slice-boundaries.md` and use it as the canonical
   standard for slice boundary findings.
3. Read required user-provided customization:
   - `strike/user-guidance/review-lenses/global.md`
   - `strike/user-guidance/review-lenses/verify-slice-plan.md`
   - `strike/user-guidance/implementation-discipline/global.md`
   - `strike/user-guidance/implementation-discipline/verify-slice-plan.md`
4. Load optional context only when needed:
   - read `strike/initiatives/<initiative-id>/supporting-artifacts/` when the
     slice, phase research, or plan references supporting artifacts, or when
     schema, architecture, provider-routing, data-lifecycle, permission, or
     operational notes may affect plan readiness
   - inspect focused repo paths when local pattern claims, file/surface names,
     blast radius, or precedent evidence need verification
5. Confirm the research basis:
   - `strike/initiatives/<initiative-id>/phases/<phase-id>/research.md` is
     present and says `Ready for slicing: yes`
   - `strike/initiatives/<initiative-id>/phases/<phase-id>/research-audit.md`
     is present and says `Review results returned: yes` and `Verdict: pass` or
     `Verdict: accepted-risk` with `Must Fix count: 0`
   - the plan's `Research And Artifacts Used` names relevant initiative
     research, phase research, phase research audit, supporting artifacts, and any
     slice-specific research delta
   - any slice-specific research delta is source-backed when external, current,
     unstable, or high-stakes
   - no material provider/model/API, repo-pattern, data/schema, file/blob,
     queue/job, auth/permission, or verification fact is left for the builder to
     guess
6. Run the required plan review batch described below in parallel: the base
   plan audit, the canonical readiness audit when its trigger applies, plus
   any applicable user review-lens agents in the same parallel batch. When
   launching a built-in SUBAGENT, include the named bundled
   `references/review-agents/` file in that subagent's prompt as its required
   audit rubric.
7. Synthesize packet evidence, optional context, and review-agent findings into
   `Must Fix`, `Follow-Up`, and `Accepted Risk`.
8. Decide build readiness:
   - set `Ready: yes` only when the plan is complete, cohesive, buildable, and
     contained within the accepted slice
   - set `Fix Needed` and `Route Back` according to the rules below

## Review

Review agents are read-only. They return findings only; they do not edit files,
fix issues, update state, build the slice, or decide whether the plan is ready.
Before launching review agents, the verifier reads bundled
`references/review-agents/output-discipline.md` and includes that output
contract in each review-agent prompt. Before launching a built-in SUBAGENT, the
verifier also loads the named bundled `references/review-agents/` rubric from
the installed Strike plugin and includes the rubric content or absolute plugin
path in that subagent's prompt. When launching
`plan-implementation-readiness-audit`, also include the loaded
`references/slice-boundaries.md` content or absolute plugin-root path so the
reviewer applies the canonical Strike slice-boundary standard.

### 1. Run Required Plan Audits In Parallel

Run the required read-only base audit, plus the canonical audit when its
trigger applies, in one parallel batch:

- SUBAGENT: `plan-implementation-readiness-audit`: always required. This is the
  single base audit: a senior-engineer review of whether the plan makes sense
  as a whole and is ready to build. It checks that the plan is complete,
  cohesive, buildable, inside the accepted slice boundary, aligned with the
  phase spec, grounded in research and repo patterns, sound across blast
  radius, security/privacy, state/data, UI/browser behavior, tests, and edge
  cases, and ready for an agent to build without guessing. This is still a
  plan audit, not a code audit; it verifies that the builder has enough context
  and proof requirements to implement safely. Use
  `references/review-agents/plan-implementation-readiness-audit.md` as the
  required rubric and `references/slice-boundaries.md` as the canonical
  slice-boundary standard.
- SUBAGENT: `canonical-readiness-audit`: required whenever the slice or plan
  touches a mature solved domain such as payments, refunds, discounts, billing,
  accounting, taxes, auth, sessions, or permissions, or uses a third-party API,
  package, SDK, framework feature, or provider/model in a way that has no
  existing repo precedent. A newly added dependency is always a no-precedent
  surface. Skip it only when no solved domain is touched and every touched
  third-party surface follows existing repo precedent; record the skip and its
  reason in the artifact, naming the precedent file(s) when precedent is the
  reason. It checks whether the plan uses the
  official, idiomatic, recommended way to solve this class of problem according
  to official docs, audited research, generated/package types, framework
  conventions, and existing repo precedent. This audit should catch plausible
  invented APIs, custom systems, handmade types, guessed provider behavior, and
  missed package/plugin primitives before build begins. Use
  `references/review-agents/canonical-readiness-audit.md` as the required
  rubric.

### 2. Add User Review Lenses To The Same Parallel Batch

- USER REVIEW LENSES: relevant user review-lens audits from:
  - `strike/user-guidance/review-lenses/global.md`
  - `strike/user-guidance/review-lenses/verify-slice-plan.md`

User review lenses are user-provided customization. They may add review agents,
stricter checks, or additional lenses for this verifier. They are additive and
cannot disable built-in Strike review agents or readiness gates. When a user
review lens asks for an audit, review agent, review pass, or otherwise applies
to this slice plan, add it to the same parallel review batch.

### 3. Synthesize Review Results

The verifier synthesizes packet evidence, optional context, and review-agent
findings into `Must Fix`, `Follow-Up`, and `Accepted Risk`. Require every
review agent to follow the bundled output discipline: return every `Must Fix`, return
only material `Follow-Up` findings, group repeated examples, avoid low-value
nits, and avoid restating the rubric.

## Output

Write the slice plan verification to the current slice's
`plan-verification.md`:

```text
strike/initiatives/<initiative-id>/phases/<phase-id>/slices/<slice-id>/plan-verification.md
```

Use this shape:

```md
# Slice Plan Verification

## Research Basis

## Supporting Artifacts

## Plan Review

## Read-Only Review
Review results returned: yes / no
- Required plan audits:
- Canonical audit: run / skipped
- Canonical skip reason: None / no solved-problem surface touched / precedented: <repo file paths>
- User review lenses:
- Summary:

## Remaining Questions
- None.

## Issues
### Must Fix
- None.

### Follow-Up
- None.

### Accepted Risk
- None.

## Build Readiness
Ready: yes / no
Reason:
Fix Needed: yes / no

## Route Back
Needed: yes / no
Command: None / reopen-check / reopen-phase-check
Phase: None / <phase-id>
Slice: None / <slice-id>
Check: None / phaseResearchComplete / slicesCreated / planCreated
Reason:
```

## Rules

### Verifier Conduct

- Verify one slice plan.
- Categorize findings in `## Issues`. `Must Fix` items prevent readiness from
  passing; `Follow-Up` and `Accepted Risk` do not unless required by the slice,
  phase spec, or acceptance criteria.
- Give every `Must Fix` item a stable short issue ID, such as `I1`. Add severity
  when useful, such as `I1 [P1]`.
- Do not edit `plan.md`; write issues for `fix` when the plan needs changes.
- Do not build the slice.
- Do not verify the slice build.

### `Ready: yes` Requires

- Phase research is present, useful enough for planning, not placeholder-only,
  not contradicted without evidence, and says `Ready for slicing: yes`.
- Phase research audit is present, not contradicted without evidence, and says
  `Review results returned: yes`, `Verdict: pass` or
  `Verdict: accepted-risk`, and `Must Fix count: 0`.
- The plan's `Research And Artifacts Used` identifies relevant initiative
  research, phase research, phase research audit, supporting artifacts, and any
  slice-specific research delta.
- Slice-specific research deltas are narrow, source-backed when needed, and do
  not duplicate initiative or phase research.
- The plan is complete, cohesive, buildable, and contained within the accepted
  slice.
- The accepted slice boundary follows `references/slice-boundaries.md`, or the
  plan records the required boundary concern and route-back.
- Relevant implementation discipline guidance is applied, and the plan does not
  scatter duplicate utilities or shared code.
- `Codebase Patterns` names relevant repo examples or credible no-precedent
  findings and explains which patterns the plan will reuse.
- `System Touchpoints` and `Blast Radius` cover relevant adjacent features,
  shared code, data flow, user workflows, tests, integrations, and existing
  assumptions.
- Relevant `supporting-artifacts/` notes are represented by the plan, or the
  plan explains why they do not apply to this slice.
- Integration, provider, workflow, upload, asset, storage, queue, job, callback,
  webhook, or dataflow work includes a repo-precedent scan.
- `Verification Plan` is concrete, not collapsed into a generic "test" bucket,
  and names required evidence.
- Verification environments are correct and not chosen merely to make checks
  easier. Browser Clickthrough belongs in the dev/local app environment;
  automated tests belong in the repo's test/E2E environment unless explicitly
  overridden by repo instructions or the user.
- Browser-visible work has a Browser Clickthrough plan naming the actual feature
  route/page, dev/local environment and DB/runtime, representative data,
  controls/actions, expected states/results, and Visual Evidence screenshots.
- Browser-visible work has a proportionate Browser Clickthrough or Visual
  Evidence plan for the behavior the current slice makes usable. When the
  current slice only prepares UI that becomes usable in a near-term later slice,
  the plan records the limited evidence this slice can provide and names the
  later integrated clickthrough that must cover it.
- E2E Tests name specs to add/update when repo infrastructure and workflow risk
  require E2E coverage.
- No accepted-scope `Must Fix` issue remains from required plan audits or user
  review lenses.
- The `canonical-readiness-audit` ran whenever the plan touches a mature
  solved domain such as payments or auth, or uses a third-party API, package,
  SDK, framework feature, or provider/model with no existing repo precedent.
  A recorded skip is valid only when no solved domain is touched and every
  touched third-party surface follows repo precedent named in the skip
  reason.
- All required review agents and applicable user review lenses have returned.
  The artifact says `Review results returned: yes` only after their returned
  findings have been synthesized into `## Issues`.

### Research And Boundary Blockers

- Mark `Ready: no` when required phase research is missing, placeholder-only,
  contradicted without evidence, or says `Ready for slicing: no`.
- Mark `Ready: no` when required phase research audit is missing, lacks
  `Review results returned: yes`, is contradicted without evidence, or has
  unresolved `Must Fix` findings.
- Mark `Ready: no` when the plan omits relevant initiative or phase research,
  hides a material research gap, or leaves the builder to guess.
- Route broad missing research back to `phaseResearchComplete`.
- Mark `Ready: no` when plan evidence shows the accepted boundary contains
  independent outcomes, lacks one clear verification story, or would force
  unrelated changes into the same build. Write the boundary finding in
  `Must Fix`, set `Fix Needed: no`, and route back to `slicesCreated` or
  `phaseResearchComplete` so Strike can revise phase research or slice
  boundaries before rerunning planning.

### Fix Or Route Back

- When readiness fails because the plan or slice-local artifact can be repaired
  inside accepted scope, write `Fix Needed: yes`.
- If the fix would edit phase `research.md` or `research-audit.md`, route back
  to `phaseResearchComplete` instead so the phase research audit can be rerun.
- Route back only when a real decision, scope change, or untrustworthy upstream
  artifact cannot honestly be repaired by `fix`.

### Completion

- `complete-check planVerified` validates this artifact; trust its gate error
  if it refuses.
