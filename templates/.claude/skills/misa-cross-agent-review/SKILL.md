---
name: misa-cross-agent-review
description: Orchestrate an independent, read-only cross-provider review through Herdr after meaningful code, research, audit, debug, or design work. Use an OMP reviewer pinned to the other provider for high-risk, ambiguous, security-sensitive, or expensive-to-reverse changes.
---

# Misa cross-agent review

Use this skill after an implementation or analysis worker has produced a stable
artifact. Use `misa-herdr` first for Herdr lifecycle and
`misa-grounded-evidence` for the task's evidence contract. This skill owns the
review wave and the handoff back to a development worker.

## Decide whether to review

Run one cross-provider review for auth, payments, permissions, data migration,
concurrency, security, production incidents, high-value architecture, or a
decision whose reversal is expensive. Skip it for contained refactors, docs, or
low-risk changes with decisive automated checks.

Route to the other provider. The reviewer still runs as an OMP agent, pinned to the
other provider's model, so every Misa-spawned worker uses the same Herdr lifecycle:

| Author | Reviewer |
| --- | --- |
| Anthropic | OMP with `openai-codex/gpt-6-sol` at `high` |
| OpenAI Codex | OMP with `anthropic/claude-sonnet-5-5` at `high` |
| Unknown/mixed | Choose the provider least used for the decisive authoring work |

Do not create a reviewer merely to compare brands. One independent review pass is
the default. A second pass is allowed only after material fixes or an unresolved
critical finding; never run an open-ended reviewer debate loop.

Use Opus 5.5 only when the existing Misa gate is met: a user request, user approval,
or verified evidence that the lower route was insufficient. Provider independence is
necessary; bypassing the escalation gate is not.

## Preflight and launch

1. Let the author finish editing; record the reviewed revision/diff and test state.
   Do not review a moving worktree.
2. Create a task-scoped **review ledger** separate from the author's ledger. The
   reviewer may read the author's report but must register its own code, diff, and
   command evidence.
3. Follow `misa-herdr` preflight, model routing, and pane-ownership rules. Use
   `herdr_control` with `pane_split`, `cwd: <target-cwd>`, and no focus; retain only
   its returned pane ID.
4. A split pane is a login shell, not a running worker. Use `herdr_control` with
   `agent_start` to launch OMP in that returned pane with the selected other-provider
   model and thinking tier. Supply valid escalation metadata if the selected model is
   Opus 5.5. Confirm the named worker with `agent_get`.
5. Send the reviewer mission with `agent_prompt`. The prompt explicitly names the
   reviewed revision, read-only authority, review ledger, report path, and required
   handoff. No raw Herdr CLI, pane environment injection, or automatic OMP startup is
   available to Misa.

Do not add `--auto-approve` for a reviewer. The pane is read-only by contract and
OMP's configured approval policy remains active. Never use reviewer automation for
production, credentials, customer data, external communication, billing, releases,
or destructive data operations unless the user explicitly authorises that scope.

## Reviewer contract

Read and append [`references/reviewer-contract.md`](./references/reviewer-contract.md)
to the prompt. The reviewer is read-only: no edits, commits, pushes, dependency
installs, migrations, destructive commands, or external side effects. It writes one
grounded Markdown report to the known task path, renders its Evidence block, and
returns only `REVIEW_REPORT: <path>` in the pane.

Misa waits for the settled agent state and reads the compact Herdr handoff rather
than a report file directly. Delegate evidence verification to a worker through
`misa-grounded-evidence`. Do not absorb or preserve terminal transcripts.
`NO_BLOCKING_FINDINGS` is valid only if the report names the reviewed target and
the checks/evidence inspected; “looks good” is not a handoff.

## Triage and return to development

For each accepted finding, Misa records severity, exact `[E#]` IDs, and the required
resolution. Then choose one:

- **No blocking findings:** accept the author artifact, subject to normal decisive
  verification.
- **Actionable finding:** give the report path and only the accepted finding IDs to
  the original development worker, or a replacement worker with explicit path
  ownership. The developer reproduces the evidence before editing.
- **Unresolved critical finding:** stop the delivery wave and surface the decision
  to the user; do not ask the author and reviewer to argue indefinitely.

After fixes, rerun relevant tests. Cross-review only the changed risk area when a
critical/warning finding caused the edit; do not restart the entire review by habit.
