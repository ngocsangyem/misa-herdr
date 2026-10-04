---
name: misa-grounded-evidence
description: Build and verify a task-scoped evidence ledger for Misa's Herdr workers. Use when Misa delegates research, code review, audit, debugging, or completion verification that will make factual claims or findings.
---

# Misa grounded evidence

Use this skill **after** `misa-herdr` has established safe pane control and
**before** Misa launches a worker whose handoff must be auditable. It makes the
worker's claims traceable to a source rather than asking Misa to trust a pane
transcript.

This is a task-local ledger, not portfolio memory. It stores only source
locators, short verified quotes, and titles. Never add secrets, customer data,
raw transcripts, or unredacted production logs.

## Start a grounded task

1. Choose a ledger path owned by the task: `<task-dir>/.evidence/ledger.json`.
   If no task artifact exists, use a uniquely named directory under
   `/private/tmp/misa-evidence/`. Do not reuse a ledger across unrelated tasks.
2. Reset it before the first retrieval. Give every worker the same absolute
   ledger path and a dedicated evidence directory for fetched pages or command
   output.

```bash
E=".claude/skills/misa-grounded-evidence/scripts/evidence_ledger.py"
python3 "$E" --ledger <ledger-path> reset
```

3. Include the worker contract below. The worker registers a source *while
   retrieving it*, then writes only returned IDs (`[E1]`, `[E2]`) in its report.
   It never writes a URL, file path, line number, or command result from memory.
4. Before accepting a report, Misa launches a separate verification worker to run
   `verify`. A producer's statement that verification passed is not evidence, and
   Misa does not execute ledger commands or inspect source evidence herself.

## Source registration

```bash
# Web/repository source: fetch text first, retain it in the task evidence dir.
python3 "$E" --ledger <ledger-path> add-url <url> --title "<title>"
python3 "$E" --ledger <ledger-path> quote 1 --text "<exact quote>" --from page.txt

# Current source code or configuration. Capture the narrowest relevant range.
python3 "$E" --ledger <ledger-path> add-file path/to/file --lines 42:58
python3 "$E" --ledger <ledger-path> quote 2 --text "<exact code/text>" --from path/to/file

# A command is executed outside this script; save a redacted result, then register it.
python3 "$E" --ledger <ledger-path> add-command --label "npm test" --from test-output.txt
python3 "$E" --ledger <ledger-path> quote 3 --text "<exact result>" --from test-output.txt
```

`quote` rejects text that is not present in the supplied evidence file (case and
whitespace insensitive). Copy evidence; do not paraphrase it. Register the URL
before drafting and use the ledger ID only; this prevents invented URLs and stale
`file:line` references.

## Claim contract by work type

| Work | Must cite | May remain uncited |
| --- | --- | --- |
| Research | externally verifiable factual claim | clearly marked `[unverified]` model knowledge |
| Review/audit | every finding and its impact | recommendation labelled as an inference |
| Debug | reproduced symptom, eliminated hypotheses, root cause | an explicit `Hypothesis:` awaiting a test |
| Completion | changed behavior and command outcome | next-step suggestion |

Use no more than three IDs on one claim. If evidence conflicts, cite each source
and state the conflict. `[unverified]` declares a gap; it is never a shortcut for
skipping retrieval.

## Worker contract

Append this to the normal `misa-herdr` worker prompt when grounding is required:

```text
Evidence ledger: <absolute-ledger-path>
Evidence directory: <absolute-evidence-dir>
Register sources at retrieval time with misa-grounded-evidence. Every factual
claim, review finding, debug conclusion, and verification result in the handoff
must end in [E#] or be explicitly marked [unverified] / Hypothesis. Copy exact
quotes from evidence files; do not invent URLs, paths, lines, test output, or IDs.
Before completion, render and verify your report:
python3 <ledger-script> --ledger <ledger-path> render --replace-in <report.md>
python3 <ledger-script> --ledger <ledger-path> verify <report.md> --evidence
Reply with the report path and the commands run, not a transcript.
```

## Verify and render

```bash
python3 "$E" --ledger <ledger-path> render --replace-in report.md
python3 "$E" --ledger <ledger-path> verify report.md --evidence
```

`verify --evidence` fails unknown IDs, a hand-written or stale Evidence block,
and any cited source without an exact quote. It does not establish that a source
is globally true; it establishes the claim → cited locator → exact-text chain.

## Herdr integration

- One ledger per work item; parallel workers may share it only when their outputs
  will be merged. The lock prevents ID collisions.
- A verification worker renders the report, runs `verify --evidence`, and returns a
  compact result with the decisive evidence IDs. Misa decides whether to advance the
  dependency from that handoff; she does not open the source locators herself.
- Portfolio cards and work snapshots retain only the concise conclusion plus the
  report/ledger path. They never absorb raw evidence or pane output.
- For ordinary implementation work with no factual handoff, do not invoke this
  skill. `misa-herdr` remains sufficient.
