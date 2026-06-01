# How To Customize {{title}}

Write real customization in `{{entry_point}}.md`.

This how-to file is guidance for humans. Strike never loads this file with
`customize preview`, so keep actual instructions in `{{entry_point}}.md`.

This customization affects {{target}}.

Useful customization can describe:

{{ideas}}

Boundaries:

- {{boundary}}
- Do not override Strike board mechanics, required outputs, stage gates,
  verification honesty, or tool boundaries.

{{review_lenses}}

Extra docs/assets:

- If you want Strike to create, append, collect, or maintain an extra doc or
  asset, say whether it should be per-project or shared/ongoing.
- Give a repo-safe save path. Useful defaults are
  `strike/user-docs/<project-slug>/{{entry_point}}/<file-name>.md` for
  per-project output and `strike/user-docs/shared/<file-name>.md` for shared
  output.
- If the path or shared/per-project intent is unclear, Strike should ask before
  creating the file.
