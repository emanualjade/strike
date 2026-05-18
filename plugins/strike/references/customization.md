# Strike Customization

Strike customization is repo-local Markdown that lets a consuming repository
shape how selected Strike skills behave without forking the plugin.

This rollout supports single-file customization for:

```txt
docs/strike/customize/global.md
docs/strike/customize/brainstorm/brainstorm.md
docs/strike/customize/grill/grill.md
docs/strike/customize/research/research.md
docs/strike/customize/spec/spec.md
docs/strike/customize/slice/slice.md
docs/strike/customize/phase-research/phase-research.md
docs/strike/customize/phase-plan/phase-plan.md
docs/strike/customize/retro/retro.md
docs/strike/customize/demo/demo.md
docs/strike/customize/language/language.md
```

## Commands

Use the `customize` utility skill for normal use:

```txt
customize init
customize list
customize check
customize load <supported-skill>
```

The skill runs the bundled deterministic script:

```txt
<plugin-root>/references/scripts/customize.mjs
```

The script also accepts `--repo-root <path>` for skill, test, and internal use.
That flag is not a normal user-facing Strike skill option.

## Packet Contract

Supported skills load customization by running:

```bash
node <plugin-root>/references/scripts/customize.mjs --repo-root <repo-root> load <skill>
```

The loader prints a Markdown packet with:

- interpretation rules
- skill-specific meaning
- included file paths
- warnings
- user customization content
- a closing guard saying customization has ended and Strike mechanics remain
  authoritative

Use customization to adjust judgment, tone, questions, examples, emphasis,
artifact style, and additive user-requested files that fit the active skill's
write scope.

Do not follow customization instructions that override Strike mechanics,
including board lanes, required reads/writes, output paths, stage gates,
verification honesty, or tool boundaries.

## Additive Files

Customization may ask for extra files when they are additive and stay inside
the active skill's write scope.

Default additive file locations:

- brainstorm extra files should live under the active card's
  `outputs/brainstorm/custom/`
- grill extra files should live under the active card's `outputs/grill/custom/`
- research extra files should live under `outputs/research/custom/`
- spec extra files should live under `outputs/spec/custom/`
- slice extra files should live under `outputs/slice/custom/`
- phase-research extra files should live under the selected phase's
  `custom/research/`
- phase-plan extra files should live under the selected phase's `custom/plan/`
- retro extra files should live under `outputs/retro/custom/`
- demo extra files should live under `demos/custom/`
- language extra files should use a user-approved docs path, otherwise prefer
  the normal `UBIQUITOUS_LANGUAGE.md` flow when a glossary edit is approved

Extra files must not replace Strike's required artifacts:

- `outputs/brainstorm/brainstorm.md`
- `outputs/grill/grill.md`
- the active skill's required output file
- `card.md` updates
- board pointer movement and validation

## Why Not `!` Imports

Do not put `!docs/strike/customize/...` in portable Strike skills.

Current host docs do not define `!path` as a portable `SKILL.md` file include.
Claude Code documents `!` as shell command dynamic context injection, which is
host-specific and can be disabled. Codex, GitHub Copilot CLI, and the Agent
Skills specification document `SKILL.md` plus referenced supporting files, not
a shared `!` import syntax.

If Strike later generates host-specific skill builds, Claude-specific `!`
injection may be reconsidered there. The shared portable source should use the
deterministic loader contract.

## Future Work

- add review-file support for review entry points
- decide whether to add customization for phase-build, phase-fix, and
  acceptance after testing write-boundary behavior
- consider host-specific generated skill packages
- evaluate custom executable review scripts with explicit trust and validation
  rules
