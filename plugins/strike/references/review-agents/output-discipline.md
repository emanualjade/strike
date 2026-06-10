# Review Agent Output Discipline

Use this output discipline for every Strike read-only review subagent,
including custom verifier-authored audits that have no bundled rubric.

## Return Shape

```md
Lens:
Verdict: pass / issues found / blocked
Triggered by:
Findings:
- ID:
  Severity:
  Suggested Category: Must Fix / Follow-Up / Accepted Risk
  Issue:
  Evidence:
  Required fix:
```

If there are no findings, write `Findings: None`.
Include any extra field required by the specific rubric, such as
`Browser Proof Needed`.

## Reporting Rules

- Return every `Must Fix` finding.
- Return only material `Follow-Up` findings.
- Group repeated examples under one finding with multiple evidence points.
- Do not report low-value nits unless they affect correctness,
  maintainability, safety, or verification.
- Do not restate the rubric, explain the process, or write a broad summary.
- Evidence must be concrete: cite a file, section, command, source, or observed
  behavior.
- Keep the review read-only. Do not edit files, run fixes, or decide the final
  verifier outcome.
