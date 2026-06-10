# Research Library

The research library is Strike's durable, cross-initiative research memory in
the consuming repo:

```text
strike/research/
  index.md
  <topic-slug>.md
```

A library entry answers "what do we know about this surface, period."
Initiative and phase research artifacts answer "what does this work need to
know." Research stages read the library first, research only what it does not
cover, and write durable findings back.

Use stable lowercase kebab-case topic slugs such as `stripe.md`,
`better-auth.md`, or `repo-upload-pipeline.md`.

## Admission

A fact belongs in the library when it is likely to be reused across
initiatives and expensive to rediscover: provider/API/SDK behavior, framework
and package usage patterns, domain rules, and repo architecture patterns.
Initiative-specific reasoning, decisions, and scope stay in the initiative.

## Entry Discipline

- An entry's job is to let a future run use this surface correctly without
  re-deriving it. Everything that serves that job stays; everything else
  goes. Some claims need a paragraph and a code shape; some need six words.
- Claims name their sources: an official doc link or a repo file path. A
  claim without a source cannot be safely reused.
- Record the package or API version a claim was verified against when one
  exists, such as `verified against better-auth 1.3`. Do not date-stamp
  entries.
- Keep entries at current truth, not history. Replace a stale claim instead
  of layering an update beside it. When touching an entry, remove claims that
  no longer earn their place.

## Reuse

- Before researching a topic, read `strike/research/index.md` and any
  relevant entries.
- Verify only the claims the current work will lean on, against their named
  sources, when they could plausibly have changed. Do not re-audit whole
  entries on read, and do not verify claims the current work does not depend
  on.
- Fix what verification finds: update the entry, then continue.
- Write new durable findings back into the entry, following the entry
  discipline above.

## Index

`strike/research/index.md` lists each entry with a short description of what
it covers, so a research pass can see what the library holds without opening
every file.
