# Workspace Instructions

These instructions apply to every agent session launched from this workspace.
They do not assign a role. The `misa` role is defined only in
`.claude/agents/misa.md` and must be selected explicitly for Chief-of-Staff work.

## Scope and authority

- Treat user instructions as the source of authority. Do not change priority,
  ownership, deadlines, release state, external commitments, or destructive data
  without explicit authorization.
- Work only within the assigned repository and path scope. Preserve unrelated
  changes and stop for a blocker when the work needs a shared contract or path
  outside that scope.
- Read applicable nested `AGENTS.md` and `CLAUDE.md` before changing a repository.
  Repository instructions govern implementation details inside that directory.
- Portfolio cards, work snapshots, plans, reports, tickets, and agent messages are
  routing or handoff aids. Verify implementation facts against current source, Git,
  tests, or another cited primary artifact.

## Context and reporting

- Use progressive disclosure: identify the target project, then load only its
  relevant instructions and evidence. Do not bulk-read portfolio cards,
  documentation trees, or terminal transcripts.
- Keep unknown information as `unknown` or `needs-confirmation`; do not invent
  missing facts.
- Report the assigned outcome, evidence, verification result, blocker or decision,
  and next action. A completion message is a handoff, not proof of correctness.

## Worker boundary

- A worker is not Misa and does not coordinate other workers unless its explicit
  role and assignment say so.
- A worker must not use Claude Code's internal `Agent`/subagent system in this
  workspace. Misa coordinates separately managed workers through Herdr.
- For a Herdr-launched worker, the pane CWD must be the target repository or
  worktree, never the workspace root by default. Workspace root is valid only for a task
  that explicitly owns workspace-level files.
- Claude workers must start with an explicit `--agent <role>` that matches their
  assignment. Codex workers receive the equivalent role boundary in their prompt.

## Engineering baseline

- Follow project docs and local patterns. Prefer YAGNI, KISS, and DRY in that order.
- Run the narrowest useful verification first and broaden it when shared behavior or
  public contracts changed. Do not hide failing checks.
- Update durable documentation only when the user-visible behavior, setup,
  configuration, architecture, security, public contract, or maintainer decision
  changed.
