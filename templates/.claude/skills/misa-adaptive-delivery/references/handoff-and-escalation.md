# Handoff and escalation

Use this reference after selecting the adaptive-delivery lane.

## Minimum worker mission

```text
Outcome: <requested result>
Scope: <repository/worktree and allowed paths>
Preserve: <observable behavior, contract, or explicit “unknown”>
Verify: <focused command/check or how to discover it>

Work iteratively: understand the relevant code and call sites, make only a small
reversible change, inspect the result, then adjust. You may resolve ordinary local
implementation choices inside Scope. Stop before changing product behavior, a
public/shared contract, architecture, security/privacy posture, migration, release or
external state, money, destructive scope, priority, owner, or deadline.

Report: OUTCOME, ASSUMPTIONS (tested/rejected/open), SCOPE, VERIFICATION,
DECISION/BLOCKER, NEXT. Do not return a transcript.
```

## Compact control record

Misa accepts a handoff only after the worker identifies:

| Field | Purpose |
| --- | --- |
| Outcome and scope | What changed and where. |
| Assumptions | Which premises were tested, rejected, or remain open. |
| Verification | Fresh command/check output, or a reason it was not run. |
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
