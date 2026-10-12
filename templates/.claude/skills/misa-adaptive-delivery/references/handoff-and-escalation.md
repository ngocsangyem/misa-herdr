# Handoff and escalation

Use this reference after selecting the adaptive-delivery lane.

## Minimum worker mission

Every mission states all four intake fields; write `none known` rather than omitting one.

```text
Outcome: <requested result>
Non-negotiable constraints: <user-accepted or contract-mandated constraints and source>
Current approach (revisable): <the design or framing in use; revisable unless named above>
Unknowns: <premises the worker must test, or "none known">
Scope: <repository/worktree and allowed paths>
Preserve: <observable behavior, contract, or explicit “unknown”>
Verify: <focused command/check or how to discover it>

Loop: UNDERSTAND -> ACT -> INSPECT -> CLARIFY only at a decision trigger -> ADJUST -> ACT.
Understand the relevant code and call sites, make only a small reversible change,
inspect the result, then adjust. You may resolve ordinary local implementation choices
inside Scope. CLARIFY triggers (stop and report instead of acting): product behavior, a
public/shared contract, architecture, security/privacy posture, migration, release or
external state, money, destructive scope, priority, owner, deadline, or a source
precedence conflict this mission does not settle.

Treat a current approach as a hypothesis, not as a requirement, unless it is named as
a non-negotiable constraint. If evidence shows that it does not meet the goal, do not
hide that finding in a workaround solely to preserve the approach. Use
DESIGN_CHANGE_REQUEST when the finding needs a decision or work by another owner.

Report: OUTCOME, ASSUMPTIONS (tested/rejected/open), SCOPE, VERIFICATION,
DESIGN_CHANGE_REQUEST (if any), DECISION/BLOCKER, NEXT. Do not return a transcript.
```

## Design-change request

Use `DESIGN_CHANGE_REQUEST` only when concrete evidence challenges a current approach
and the outcome cannot be safely resolved as an ordinary local adaptation. It is not a
standing instruction to argue with the plan.

```text
Premise challenged: <current approach or assumption>
Evidence: <test, prototype, source trace, benchmark, or verified report>
Impact: <affected behavior, owner, paths, and dependent work>
Options: <bounded alternatives and trade-offs>
Requested outcome: <retain, adapt locally, route to owner, or user decision>
```

The worker may request change outside its ownership but must not make that change.
Misa evaluates the verified handoff and records one outcome: retain the approach with
reason, permit a local adaptation, route a change to the owning scope and pause only
affected dependents, or escalate the user-owned decision. A request that lacks a
concrete premise and evidence is feedback, not a delivery gate.

When a worker raises a question or `DESIGN_CHANGE_REQUEST`, record the disposition in
the task report (or the owning plan or work snapshot) before routing `git-manager` or
any dependent worker. The record names the decision, supporting evidence, responsible
owner, and affected dependents; do not rely on the transient agent message. If the
disposition touches a rule the user set in this session, ask the user before any
external write such as a push or PR.

## Compact control record

Misa accepts a handoff only after the worker identifies:

| Field | Purpose |
| --- | --- |
| Outcome and scope | What changed and where. |
| Assumptions | Which premises were tested, rejected, or remain open. |
| Verification | Fresh command/check output, or a reason it was not run. |
| Design-change request | The challenged premise, evidence, impact, and decided disposition when one exists. |
| Decision/blocker | The authority boundary, if one was reached. |
| Next | Accept, repair, review, ship, or a specific user decision. |

Store durable implementation facts in the normal plan/report/portfolio surface that
owns them. Do not create a transcript archive, parallel task list, or generic
checkpoint store.

## Escalation threshold

Ask the user only when the next action would select or change a product behavior,
public/shared API or data contract, architecture boundary, security/privacy policy,
migration, release, external communication, payment/cost commitment, destructive
operation, priority, owner, or deadline. Include observed evidence and bounded
options. Do not ask merely because the worker found an internal dependency, failed a
focused test, or needs to change a local implementation technique while preserving
the agreed behavior.
