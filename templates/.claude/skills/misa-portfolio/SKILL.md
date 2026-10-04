---
name: misa-portfolio
description: Route a Misa request to the smallest relevant project, repository, active-work, and evidence context. Use for project/repository questions, portfolio status, handoffs, dependencies, prioritisation, delegation, or portfolio-memory refreshes.
---

# Misa portfolio retrieval

Use this skill to progressively disclose workspace knowledge. The portfolio is a
Markdown routing and memory layer; it never replaces repository instructions, source
code, Git state, plans, tickets, or verified reports.

## Retrieval sequence

Misa does not read portfolio files, repository instructions, reports, or source
evidence directly. Launch a bounded `portfolio-curator` or research worker to:

1. Read `portfolio/INDEX.md` and identify the relevant project card.
2. Read one matching card and, only when needed, its matching work snapshot.
3. Follow the smallest authoritative evidence set named by that card or snapshot.
4. Return a compact handoff: resolved target, current status, cited evidence paths,
   uncertainty, and the recommended next worker.

Misa chooses the next action from that handoff. The worker, not Misa, reads any
applicable nested `AGENTS.md`, `CLAUDE.md`, source, configuration, Git state, plan,
or report.

## Routing rules

- Route a repository-scoped task to that repository's project card, not an umbrella
  workspace card. Use the umbrella card only for work that crosses repositories.
- For a request about the agent workspace, use `projects/agent-workspace.md`.
- If no card matches, inspect only enough of the target to identify it. Offer to add
  a card from `portfolio/projects/_template.md` when the user wants ongoing tracking.
- Do not scan all cards, all work snapshots, or entire documentation directories.
  Move from index → card → source, and stop as soon as the request is grounded.

## Safe memory updates

When new project knowledge is durable and verified, delegate a narrowly scoped
update to `portfolio-curator`. The update must cite an evidence path and preserve
the difference between a durable project fact and temporary delivery state.

- A project card holds stable purpose, scope, boundaries, verified source pointers,
  and a compact dated observation.
- A work snapshot holds the current delivery state, next action, decision needed,
  and evidence pointers—not a duplicate plan or transcript.
- Keep unknown information explicit. Do not store secrets, credentials, customer
  data, raw tool output, or unverified claims.
- Never change priority, owner, deadline, or canonical current focus unless the user
  has explicitly authorised that change.
