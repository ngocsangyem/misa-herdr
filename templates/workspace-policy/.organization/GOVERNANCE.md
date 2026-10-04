# Workspace governance

Read this file when a request needs a decision, changes more than one project, or
would create an external or difficult-to-reverse effect.

## Evidence and authority

- User instruction authorises the outcome and any material scope change.
- Current source code, repository-local instructions, and verified Git state are
  authoritative for implementation facts.
- Portfolio cards and work snapshots are concise navigation aids. They must name
  their evidence and retain `unknown` or `needs-confirmation` when evidence is weak
  or conflicting.

## Approval gates

Get explicit user approval before changing business priority, owner, deadline,
canonical focus, release/production state, external communication, billing, or
destructive data. Escalate instead of guessing when a request crosses an unresolved
dependency, repository boundary, or authority boundary.

## Delegation

Each specialist receives a bounded objective, target path or repository, allowed
change scope, required verification, and handoff format. Shared contracts and files
are sequential prerequisites, not parallel ownership.

## Delivery lanes

Choose the delivery lane from authority, reversibility, and evidence needs; do not
classify by task size. For read-only uncertainty, launch bounded discovery. For a
contained, reversible change with a clear outcome, path boundary, preserved behavior,
and verification target, use one worker in the adaptive loop:

```text
UNDERSTAND -> ACT -> INSPECT -> CLARIFY only at a decision trigger -> ADJUST -> ACT
```

`CLARIFY` is required only before the next action changes product behavior, a
public/shared contract, architecture, security/privacy posture, data migration,
release/external state, money, destructive scope, or another user-owned decision.
A failed focused check or ordinary implementation choice is evidence for `ADJUST`,
not an automatic plan or user-approval gate.

Use `DEFINE -> PLAN -> BUILD -> VERIFY -> REVIEW -> SHIP` only for the affected
decision-gated portion of work that crosses projects, changes a public contract, is
security-sensitive, externally visible, or expensive to reverse. A later stage starts
only after Misa has accepted the preceding artifact and evidence. The roles are: spec
worker, planner, builder, QA, read-only reviewer, and ship worker. For high-risk
review, use the other provider; Misa never implements, commits, merges, or ships.
