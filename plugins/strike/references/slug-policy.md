# Strike Slug Policy

Use the bundled helper for Strike file and folder names that come from user or
model text:

```bash
node <plugin-root>/references/scripts/slugify.mjs feature --text "Add user profile page"
node <plugin-root>/references/scripts/slugify.mjs phase --text "Profile form foundation" --index 1
node <plugin-root>/references/scripts/slugify.mjs demo --text "Mobile flow options" --index 2
```

Do not inline host-specific `!` commands, hand-roll slug rules, or create
different per-skill filename conventions.

The helper flags are for bundled Strike scripts and skill instructions, not for
normal user-facing Strike prompts. User-facing skill flags should be documented
in that skill's `SKILL.md` and README examples.

## Shared Rules

- Slugs are lowercase ASCII with numbers and hyphens only.
- Whitespace, punctuation, emoji, and unsafe path characters collapse to
  hyphens.
- Repeated hyphens and leading/trailing hyphens are removed.
- Slug generation fails when no ASCII letter or number remains.
- Collisions use `-2`, `-3`, and so on while staying inside the max length.

## Shapes

Feature slugs are stable workflow identifiers:

```txt
user-profile-page
```

Feature body max length is 48 characters. Generated feature slugs drop common
leading task verbs and articles, so `Add a user profile page` becomes
`user-profile-page`. Explicit `--slug` values are still sanitized, shortened,
and deduplicated, but the caller can preserve leading words.

Phase folders are ordered artifacts:

```txt
01-profile-form-foundation/
```

The numeric prefix is two digits, accepts indexes from 1 to 99, and only
indicates build order. The phase body max length is 40 characters.

Demo files are ordered planning artifacts:

```txt
02-mobile-flow-options.html
```

The numeric prefix is two digits, accepts indexes from 1 to 99, the default
extension is `.html`, and the demo body max length is 40 characters.

## Collision Inputs

Pass existing names as `--taken` values:

- feature: existing card folder names and board pointer basenames
- phase: existing phase folder names such as `01-profile-form`
- demo: existing demo filenames such as `02-mobile-flow-options.html`

The helper prints newline-separated `key=value` fields so shell scripts and
agents can parse the result without guessing:

```txt
slug=user-profile-page
```

```txt
slug=01-profile-form-foundation
body=profile-form-foundation
```

```txt
filename=02-mobile-flow-options.html
slug=02-mobile-flow-options
body=mobile-flow-options
```
