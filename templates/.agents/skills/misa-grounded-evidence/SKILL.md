---
name: misa-grounded-evidence
description: Build and verify task-scoped evidence ledgers for Misa's Herdr workers during research, review, audit, debugging, and completion verification.
---

# Misa grounded evidence

Use this with `misa-herdr` whenever a Herdr worker's handoff will contain factual
claims, audit findings, root-cause conclusions, or verification results.

The canonical Misa workflow and implementation live at:

- `.claude/skills/misa-grounded-evidence/SKILL.md`
- `.claude/skills/misa-grounded-evidence/scripts/evidence_ledger.py`

Read the canonical `SKILL.md` in full before launching the worker. It defines the
task-local ledger, exact-quote gate, worker prompt contract, and Misa's independent
acceptance check. Do not copy URLs, paths, lines, command output, or IDs from memory;
the ledger renders them from retrieved evidence.
