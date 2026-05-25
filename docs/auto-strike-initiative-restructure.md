# Auto Strike Initiative Restructure

Working checklist for moving Auto Strike from a loose `features/<slug>/` model to
a deterministic initiative -> feature -> slice model.

## Core Model To Lock

- [x] `initiative` means one Auto Strike session/request/campaign.
- [x] `feature` means one spec-able capability inside an initiative.
- [x] `slice` means one small vertical implementation step inside a feature.
- [x] New initiative directories are created only when starting a new Auto
      Strike run/session/request.
- [x] Decomposition creates feature folders inside the active initiative, not
      new initiatives.
- [x] If active work appears to need a separate initiative, ask the user before
      creating it.
- [x] Backwards compatibility with the old `auto-strike/features/<slug>/` shape
      is not required for this restructure.

## Filesystem Contract

Draft target shape:

```text
auto-strike/
  index.md
  language.md
  decisions.md
  todo.md
  initiatives/
    <initiative-slug>/
      idea.md
      grill.md
      spec.md
      readiness.md
      todo.md
      research/
      extras/
      features/
        <feature-slug>/
          feature-spec.md
          readiness.md
          research/
          extras/
          slices/
            index.md
            slice-0-[name].md
```

- [x] Initiative-level `readiness.md` is required before claiming the whole
      initiative complete, but does not need to exist on cold start.
- [x] Feature-level `readiness.md` is required before claiming that feature
      complete, but does not need to exist until feature readiness.
- [x] Initiative-level `todo.md` is optional for larger initiatives. Root
      `todo.md` remains the cross-initiative operational front door.
- [x] Feature specs are named `feature-spec.md` to avoid confusing initiative
      overview specs with buildable feature specs.
- [x] Cross-feature workflows live in initiative `spec.md` by default. Use
      `extras/workflows.md` only when the workflow detail would bloat the spec.
- [x] `research/` is allowed at root, initiative, and feature levels. Use the
      lowest level that owns the decision; root research is only for
      cross-initiative/repo-wide facts.
- [x] `extras/` is allowed at root, initiative, feature, and slice levels. Use
      it as the sanctioned drawer for useful supporting docs such as schema,
      routes, architecture notes, workflow diagrams, or exploratory sketches.
      Prefer the lowest relevant level and do not put primary workflow state in
      `extras/`.

## Implementation Checklist

- [x] Update `workspace.md` to define initiative, feature, slice, research, and
      extras directories.
- [x] Update `SKILL.md` routing language from active feature to active
      initiative / active feature / active slice.
- [x] Update brainstorm guidance so brainstorm creates or updates an initiative.
- [x] Update grill guidance so grill happens at initiative level and discovers
      feature candidates.
- [x] Update spec guidance so initiative `spec.md` is an overview, feature map,
      readiness target, and cross-feature constraints.
- [x] Update feature spec guidance so feature folders own detailed buildable
      specs.
- [x] Update slice guidance so slices always live under one feature folder.
- [x] Update build/review/readiness guidance to roll up from slice -> feature ->
      initiative.
- [x] Update helper parsing for active initiative, active feature, and active
      slice.
- [x] Remove old `auto-strike/features/<slug>` assumptions if the migration is a
      clean break.
- [x] Update helper messages to use initiative/feature terminology correctly.
- [x] Rewrite Auto Strike helper tests around the new workspace shape.
- [x] Update changelog/version surfaces for the breaking structural change.

## Final Workflow Checks

- [x] Cold start creates one initiative for one new user request.
- [x] A second unrelated Auto Strike request creates a second initiative.
- [x] A broad initiative can split into multiple feature folders before slicing.
- [x] Decomposition never creates a new initiative without user confirmation.
- [x] A single-feature initiative still feels lightweight, not over-modeled.
- [x] Feature specs are small enough to slice without guessing.
- [x] Slices remain vertical, dependency-aware, and feature-scoped.
- [x] Research and extras drawers prevent random docs from spreading across the
      workspace.
- [x] `index.md` lets a fresh context resume active initiative, feature, doc, and
      next action.
- [x] Review packets still scope changed files and evidence correctly.
- [x] Browser/user-flow, fresh-review, verification-capability, and closeout
      warnings still work.
- [x] Readiness can prove both feature completion and initiative completion.
- [x] Dogfood broad request: `auth-and-payments` becomes one initiative with
      sensible feature folders.
- [x] Dogfood second request: `image-generator` becomes a separate initiative.

## Validation Commands

- [x] `pnpm run test`
- [x] `pnpm run validate`
- [x] `pnpm run validate:publish`
- [x] `git diff --check`
- [x] `pnpm run release:validate`
