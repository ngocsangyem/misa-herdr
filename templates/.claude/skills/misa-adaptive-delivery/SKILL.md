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

Give an adaptive worker this sequence:

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
- **Clarify:** stop before changing any user-owned decision in the table above. Tell
  the user the observed evidence, the affected behavior, and the concrete options.

Use AgentKit deliberately: `ak:scout` for bounded discovery, the applicable domain
skill for implementation, `ak:test` for focused verification, and `ak:fix` for a
concrete defect. Use `ak:plan` and `ak:cook` only after the decision-gated lane has
produced an accepted plan. Do not invoke Cook merely to create a ceremonial plan for
a clear local change.

## Multi-agent control

One writer owns one worktree. Parallelize read-only discovery freely when scopes are
independent; parallel writers require separate worktrees and non-overlapping path
ownership. Misa aggregates only compact reports, not chat transcripts.

Read [handoff and escalation](references/handoff-and-escalation.md) before launching
an adaptive writer, accepting its result, or handling a decision trigger.
