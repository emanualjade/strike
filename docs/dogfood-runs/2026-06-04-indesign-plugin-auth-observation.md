# Dogfood Observation

Date: 2026-06-04
Host: Codex
Host version: not recorded
Workspace: not recorded
Scenario: InDesign plugin auth initiative startup and slice-plan verification
Run mode: observed Strike use in another project
Installed-plugin behavior proven: no

## Observation

The user reported that the target model said during startup:

> The workflow gate is narrow: produce `strike/initiatives/p1-02-indesign-plugin-auth/idea.md` and satisfy `ideaRefined`. I'm locating the Strike refine-idea instructions so I follow its handoff rules instead of improvising the artifact.
>
> `tool_search` didn't surface the workflow skill, so I'm falling back to the local Strike plugin files that were installed with the new-initiative skill. The state helper is still the source of truth for which step owns the artifact.

The user later reported that the target model said during slice-plan
verification:

> Thanks, I'll carry on with the real sub-agent path now. First I'm reading the Strike verifier instructions and syncing the helper so the workflow state and artifact expectations stay canonical.
>
> Explored 2 files, 1 list, ran 1 command
> The workflow confirms we're at `verify-slice-plan` for phase 01, slice 01. I've got the slice plan in view; now I'm launching the three required read-only plan audits against that packet before marking it ready.
>
> Explored 12 files
> Tiny Strike path wrinkle: the verifier names the review-agent references relative to the plugin bundle, not the skill folder. I'm locating those rubrics now and then I'll launch the audits.

The user also reported a product-feel concern about the idea refinement stage:
even though the user had provided substantial plans up front, the agent did not
pull the user into enough friendly conversation to verify shared understanding.
The desired feel is closer to friends over coffee: summarize the context,
reiterate what Strike thinks the work really is, and give the user a clear
moment to say "yes, that's mine" or correct the framing before moving on.
The user clarified that `refine-idea` is meant to be a dialogue between user
and agent that teases out ideas, checks the user's thinking, demonstrates the
agent's understanding, and creates shared confidence. The output should not
only satisfy the model's need for information; it should leave both sides with
the feeling that the user understands the idea, the model understands the idea,
the user knows the model understands, and the model has checked the user's
agreement with that framing.

The user later reported a similar product-feel concern about `grill-idea`.
The stage asked one question, accepted the answer, and moved on in a curt way
that did not give confidence that the agent understood the decision space. The
intro did not explain what the skill was doing or what context it was carrying
forward. The middle asked a question but did not give enough recommendation,
suggestion, or explanation of what was happening in that moment. The ending did
not summarize what the user and agent had just done together, state that the
decision tree had been explored and exhausted enough for this stage, or
communicate what Strike now understood it would build next.

The user also reported that the actual dogfood session paused partway through
even though the user expected Strike to keep going. The agent stopped at phase
01, slice 03 `plan-slice` for manageable Publication grant options. When the
user asked why it paused, the agent explained that nothing in the Strike skill
explicitly told it to pause. Instead, it interpreted the project rule
"Checkpoint verified goal work before starting broad new slices" as a clean
handoff boundary after slice 02 was verified, committed, and pushed. The agent
said that, given the user had asked it to "carry on," it should probably have
continued by running `next-step` and starting slice 03 planning. It described
the skill-supported flow as "return control to go so the orchestrator can run
next-step," not "stop and wait for the user."

## Interpretation

- Positive signal: the model recognized that `refine-idea` owns `idea.md`, kept the gate narrow, and treated the state helper as the workflow authority.
- Positive signal: during verification, the model synced the helper, confirmed the current gate was `verify-slice-plan`, and planned to run the required read-only audits before marking the plan ready.
- Discovery concern: `tool_search` did not surface the next workflow skill during the handoff, so the model used installed plugin files as a fallback.
- Path concern: the model described a "path wrinkle" where review-agent references were named relative to the plugin bundle rather than the skill folder. Reproduce before deciding whether this is a prompt clarity issue, a host path-resolution issue, or expected progressive-disclosure behavior.
- Product-feel concern: `refine-idea` may be mechanically satisfied while still not giving the user enough warm confirmation, context reflection, summary, and mutual-understanding check before `ideaRefined`.
- Product-feel concern: `grill-idea` may be mechanically satisfied while still not giving the user enough context, recommendations, shared decision confidence, and completion summary before `decisionsResolved`.
- Workflow-control concern: after a verified slice checkpoint, an agent may conservatively stop at a clean boundary even though Strike supports continuing to the next step and the user asked it to carry on.
- Evidence limit: this is a transcript observation, not a full installed-plugin dogfood run or a validated host-smoke result.

## Follow-Up

- Reproduce in a disposable Codex workspace before changing skill text or plugin packaging.
- During reproduction, check whether `refine-idea` is present in the installed plugin cache and whether a fresh thread can discover it through normal skill/tool discovery.
- During reproduction, check whether `verify-slice-plan` can resolve `plugins/strike/references/review-agents/` rubrics cleanly from an installed plugin cache and from a local source workflow check.
- Review whether `refine-idea` should explicitly ask for a friendly shared-understanding confirmation before completing `ideaRefined`, especially when the user provided extensive plans up front. The review should consider whether the stage needs to summarize back the current understanding and create a clear "we both get it" moment, not just collect enough input for the next artifact.
- Review whether `grill-idea` should explicitly provide a clearer opening, decision-dialogue guidance, recommendations or suggested framing, and closing summary before completing `decisionsResolved`.
- Review whether orchestration/checkpoint language should say that after completing and checkpointing a verified slice, the agent should continue to the next Strike step unless the user asked to pause or the next step requires a user decision.
- Do not update the locally installed Strike plugin for this finding unless the maintainer explicitly approves that local update.
