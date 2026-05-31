# Auto Strike Phase Restructure

Working checklist for moving Auto Strike from the previous deterministic
initiative -> feature -> slice model to an initiative -> phase -> slice model.

## Core Model To Lock

- [x] `initiative` means one Auto Strike session/request/campaign.
- [x] `phase` means one delivery phase inside an initiative with its own
      spec-able scope.
- [x] `slice` means one small vertical implementation step inside a phase.
- [x] New initiative directories are created only when starting a new Auto
      Strike run/session/request.
- [x] Decomposition creates phase folders inside the active initiative, not
      new initiatives.
- [x] If active work appears to need a separate initiative, ask the user before
      creating it.
- [x] Backwards compatibility with the old
      `auto-strike/initiatives/<initiative-slug>/features/<feature-slug>/`
      shape is retained with warnings for one release.

## Filesystem Contract

Draft target shape:

```text
auto-strike/
  index.md
  todo.md
  initiatives/
    <initiative-slug>/
      idea.md
      decisions.md
      grill.md
      spec.md
      readiness.md
      todo.md
      research/
      extras/
      phases/
        <phase-slug>/
          phase-spec.md
          readiness.md
          research/
          extras/
          slices/
            index.md
            slice-0-[name].md
```

- [x] Initiative-level `readiness.md` is required before claiming the whole
      initiative complete, but does not need to exist on cold start.
- [x] Phase-level `readiness.md` is required before claiming that phase
      complete, but does not need to exist until phase readiness.
- [x] Initiative-level `todo.md` is optional for larger initiatives. Root
      `todo.md` remains the cross-initiative operational front door.
- [x] Durable language lives in repo root `UBIQUITOUS_LANGUAGE.md`, not inside
      `auto-strike/`.
- [x] Phase specs are named `phase-spec.md` to avoid confusing initiative
      overview specs with buildable phase specs.
- [x] Cross-phase workflows live in initiative `spec.md` by default. Use
      `extras/workflows.md` only when the workflow detail would bloat the spec.
- [x] `research/` is allowed at root, initiative, and phase levels. Use the
      lowest level that owns the decision; root research is only for
      cross-initiative/repo-wide facts.
- [x] `extras/` is allowed at root, initiative, phase, and slice levels. Use
      it as the sanctioned drawer for useful supporting docs such as schema,
      routes, architecture notes, workflow diagrams, or exploratory sketches.
      Prefer the lowest relevant level and do not put primary workflow state in
      `extras/`.

## Implementation Checklist

- [x] Update `workspace.md` to define initiative, phase, slice, research, and
      extras directories.
- [x] Update `SKILL.md` routing language from active phase to active
      initiative / active phase / active slice.
- [x] Update brainstorm guidance so brainstorm creates or updates an initiative.
- [x] Update grill guidance so grill happens at initiative level and discovers
      phase candidates.
- [x] Update spec guidance so initiative `spec.md` is an overview, phase map,
      readiness target, and cross-phase constraints.
- [x] Update phase spec guidance so phase folders own detailed buildable
      specs.
- [x] Update slice guidance so slices always live under one phase folder.
- [x] Update build/review/readiness guidance to roll up from slice -> phase ->
      initiative.
- [x] Update helper parsing for active initiative, active phase, and active
      slice.
- [x] Keep legacy `features/<slug>/feature-spec.md` parsing as a compatibility
      path, but make `phases/<slug>/phase-spec.md` canonical.
- [x] Update helper messages to use initiative/phase terminology correctly.
- [x] Rewrite Auto Strike helper tests around the new workspace shape.
- [x] Update changelog/version surfaces for the breaking structural change.

## Final Workflow Checks

- [x] Cold start creates one initiative for one new user request.
- [x] A second unrelated Auto Strike request creates a second initiative.
- [x] A broad initiative can split into multiple phase folders before slicing.
- [x] Decomposition never creates a new initiative without user confirmation.
- [x] A single-phase initiative still feels lightweight, not over-modeled.
- [x] Phase specs are small enough to slice without guessing.
- [x] Slices remain vertical, dependency-aware, and phase-scoped.
- [x] Research and extras drawers prevent random docs from spreading across the
      workspace.
- [x] `index.md` lets a fresh context resume active initiative, phase, doc, and
      next action.
- [x] Review packets still scope changed files and evidence correctly.
- [x] Browser/user-flow, fresh-review, verification-capability, and closeout
      warnings still work.
- [x] Readiness can prove both phase completion and initiative completion.
- [x] Dogfood broad request: `auth-and-payments` becomes one initiative with
      sensible phase folders.
- [x] Dogfood second request: `image-generator` becomes a separate initiative.

## Validation Notes

- [x] `node scripts/test-slugify.mjs`
- [x] `node scripts/test-customize.mjs`
- [x] `node scripts/test-auto-strike.mjs`
- [x] `bash scripts/test-start-card.sh`
- [x] `node scripts/validate.mjs`
- [x] `node scripts/validate.mjs --publish`
- [x] `git diff --check`
- [ ] `pnpm run test`, `pnpm run validate`, and release validation were blocked
      by pnpm's `ERR_PNPM_VERIFY_DEPS_BEFORE_RUN` guard. Do not run
      `pnpm install` without maintainer approval.
