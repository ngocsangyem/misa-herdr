---
name: misa-cross-agent-review
description: Orchestrate an independent, read-only Claude↔Codex review through Herdr for high-risk completed work, then return grounded findings to a development worker.
---

# Misa cross-agent review

Use this skill with `misa-herdr` and `misa-grounded-evidence` for high-risk,
ambiguous, security-sensitive, or expensive-to-reverse completed work.

The canonical Misa workflow and reviewer prompt contract are at:

- `.claude/skills/misa-cross-agent-review/SKILL.md`
- `.claude/skills/misa-cross-agent-review/references/reviewer-contract.md`

Read the canonical `SKILL.md` in full before launching a reviewer. It defines the
author-to-reviewer routing, the authorised bypass flags, separate-review-ledger
requirement, read-only boundary, final-report-only intake, and handoff back to the
development worker.
