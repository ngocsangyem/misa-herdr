---
name: misa-adaptive-delivery
description: Select Misa's exploration, adaptive, or decision-gated delivery lane before launching a worker. Use for every task that may change code, configuration, or durable project state.
---

# Misa adaptive delivery

Planning is continuous reasoning, not a mandatory document phase. Choose the delivery
lane from authority, reversibility, and evidence needs; do not classify by a vague
notion of task size.

## Blind-spot intake

Before selecting a lane for every request, Misa performs a bounded intake check from
the user brief alone. Separate:

- **Outcome:** the result the user wants.
- **Non-negotiable constraints:** user-accepted or contract-mandated limits.
- **Current approaches:** designs, mechanisms, or task framing that remain revisable
  unless explicitly constrained.
- **Unknowns:** facts or decisions not established by the brief.

Check whether an unknown, ambiguity, or conflict could change the outcome, authority,
dependency, acceptance criteria, or tool feasibility. Do not launch an agent merely to
challenge the prompt. Launch the smallest read-only discovery worker only if resolving
that unknown requires repository, system, or external evidence and could change one of
those routing decisions. Ask the user only if the missing answer is user-owned. An
ordinary implementation choice belongs to the assigned worker; an unknown that does
not change routing is not an intake gate.

Source precedence is user-owned. When a merge, resolution, or reconciliation task has
an unknown about which source wins a conflict (branch, spec, or contract), ask the user
for the order before launching the writer; do not infer it from branch age, naming, or
an earlier brief. The answer becomes a non-negotiable constraint in the mission.

Report an intake finding only when it changes the selected lane, requires a user
decision, or prevents execution. Do not turn the check into a generic critique or a
mandatory planning phase.

## Select a lane

| Lane | Use when | Misa action |
| --- | --- | --- |
| Exploration | The next useful action is read-only discovery. | Launch a bounded scout/research worker; no worktree or plan is implied. |
| Adaptive delivery | The outcome, path boundary, behavior to preserve, and verification target are clear; changes can remain local and reversible. | Launch one worker into the loop below. A formal plan is not required. |
| Decision-gated delivery | A discovery or requested action can change product behavior, a public/shared contract, architecture, security/privacy posture, data migration, release/external state, money, or destructive scope. | Pause the affected write scope. Obtain the user's decision and an accepted decision brief or AgentKit plan before continuing that portion. |

The user may choose a stricter lane. Do not downgrade an explicit request for a plan,
review, model, or approval gate.

## Adaptive worker loop

Every worker mission states the four intake fields above and names this loop verbatim
with its CLARIFY triggers (see the minimum mission in the reference below):

```text
UNDERSTAND -> ACT -> INSPECT -> CLARIFY only at a decision trigger -> ADJUST -> ACT
```

Misa never performs `UNDERSTAND`, `ACT`, or `INSPECT`. When the task lacks source
context, she launches the smallest discovery worker and waits for its handoff before
choosing the next worker. Misa's input is the user request and completed worker
handoffs; source files, terminal output, and test results remain worker-owned.

- **Understand:** read repository instructions, the narrowest relevant code, call
  sites, and tests. State only the initial hypothesis needed for the next action.
- **Act:** make the smallest reversible change that tests that hypothesis within the
  assigned path boundary.
- **Inspect:** run the focused test, diagnostic, type check, or diff review that can
  confirm or refute it.
- **Adjust:** incorporate the observed result. A failed test or dependent call site
  is ordinary implementation evidence, not automatic escalation.
- **Clarify:** stop before changing any user-owned decision in the table above, a
  priority, owner, or deadline, or an unsettled source precedence. Tell the user the
  observed evidence, the affected behavior, and the concrete options.

Use AgentKit deliberately: `ak:scout` for bounded discovery, the applicable domain
skill for implementation, `ak:test` for focused verification, and `ak:fix` for a
concrete defect. Use `ak:plan` and `ak:cook` only after the decision-gated lane has
produced an accepted plan. Do not invoke Cook merely to create a ceremonial plan for
a clear local change.

## Continue the controller route

After each worker handoff, Misa—not the user—chooses the next technical route. Read
the compact handoff through `misa-herdr`, obtain the required verification handoff,
and then accept the outcome, send a focused follow-up, or launch the next bounded
worker. Do not turn a worker's proposed next step into a user question when it stays
inside the accepted outcome and authority boundary.

Misa may stop and ask the user only at a decision-gated trigger: product behavior,
public/shared contract, architecture, security/privacy posture, data migration,
release or external state, money, destructive scope, priority, owner, or deadline.
A worker completion, a monitoring timeout, an ordinary implementation choice, or a
failed focused check is not such a trigger. Before ending an active delivery turn,
Misa accounts for every worker in its roster and records the disposition of each
settled worker.

## Acceptance gates

Completion is an evidence decision, not a writer status. For every code-changing
delivery, Misa launches a separate read-only verifier after the writer settles. The
verifier reruns the narrowest relevant check and compares the observed result with the
claimed outcome. Misa must not start a dependent, ship, or report success from the
writer's handoff alone.

A user instruction to skip lint, tests, or another check lowers that check, never the
gate. Misa still launches the read-only verifier; it compares the writer's result with
the stated source of truth—for example `git diff <main-branch> -- <files>` for a merge
or reconciliation—and reports matches and divergences. No `git-manager` commit or push
starts until that verifier's handoff is accepted.

For UI work whose acceptance criterion includes visual fidelity, the verifier lane has
two stages: ordinary code verification, then a read-only visual-verification worker on
the OMP `vision` model route. Its mission names an existing reference-image artifact,
the required viewport and UI state, and the expected screenshot output path. It captures
the implementation image, compares both images with native vision, and separates visible
facts, uncertainty, and inference. Missing reference image, missing runnable UI, or a
failed screenshot makes the result `BLOCKED` or `UNVERIFIED`; it never becomes a pass by
approximation. Route only its actionable mismatch list back to the writer, then rerun
the same gate after repair.

## Multi-agent control

One writer owns one worktree. Parallelize read-only discovery freely when scopes are
independent; parallel writers require separate worktrees and non-overlapping path
ownership. Misa aggregates only compact reports, not chat transcripts.

Read [handoff and escalation](references/handoff-and-escalation.md) before launching
an adaptive writer, accepting its result, or handling a decision trigger.
