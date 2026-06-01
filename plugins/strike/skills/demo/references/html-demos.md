# Strike HTML Demo Guidance

Static HTML demos are planning artifacts. Use them when seeing or lightly
interacting with a concept would help the user choose, compare, understand, or
explain.

They are not limited to final UI mockups. They can be visual thinking tools.

## When To Use

Use a demo for:

- UI direction choices
- layout or information architecture options
- dashboard or tool concepts
- command output or CLI flow comparisons
- API, config, or data-shape explainers
- multi-step flow comparisons
- before/after experiences
- decision maps or tradeoff comparisons
- user journey maps
- data/state explainers
- workflow, lifecycle, or dependency maps
- lightweight interactive choices
- visual hierarchy, density, tone, or state comparisons

Skip demos for purely textual questions, business tradeoffs, or technical
decisions unless a simple diagram would materially help.

## Where Demos Live

Save demos where they will be useful without turning them into production
assets:

```txt
auto-strike/initiatives/<initiative-slug>/demos/
docs/demos/
```

Use the Auto Strike path when the demo belongs to an initiative. Use
`docs/demos/` for standalone repo-local planning demos, or another repo-safe
path the user explicitly provides or confirms.

Use numbered semantic filenames:

```txt
01-three-directions.html
02-mobile-flow.html
03-dashboard-states.html
```

Generate demo filenames with the plugin's shared slug helper and
`references/slug-policy.md`. Pass existing demo filenames as `--taken` values
and use the returned `filename=` value.

## Rules

- Planning artifact only; never production implementation.
- Do not modify repo source files.
- Do not install packages.
- Do not use build tools.
- Do not use external CDNs, fonts, scripts, or image URLs.
- Use mock data.
- Keep the file self-contained: HTML, CSS, optional tiny JS.
- Label the page clearly as a planning demo.
- Show two or three options when the user is choosing direction.
- Show states when behavior matters: empty, loading, success, error, edge.
- Keep the demo focused on one question.

## Suggested Structure

- Top banner: what the demo explores.
- One to three concept screens, cards, diagrams, command outputs, or states.
- Short labels for the intended user, maintainer, operator, or system moment.
- Optional buttons/tabs to switch options or states.
- Final questions to answer.

## Visual Quality

Keep it simple and good:

- system fonts
- responsive layout
- realistic mock content
- clear labels and hierarchy
- accessible contrast
- restrained color palette with one accent
- no lorem ipsum
- no blurry atmospheric hero images
- no production-brand claims unless existing docs already establish them

The demo should feel like a useful product thinking artifact, not a throwaway
wireframe and not a polished production promise.

## After Creating A Demo

Tell the user:

- the demo path
- what it is trying to test
- what feedback would be useful

Keep the demo lightweight. It should make the conversation clearer, not become
a design deliverable.
