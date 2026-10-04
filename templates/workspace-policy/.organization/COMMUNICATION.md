# Coordination and handoff protocol

Read this file when Misa creates a multi-agent task, reports a blocker, or closes a
delivery thread.

Use a stable work or ticket identifier whenever one exists.

```text
[<work-id>][<status>][<sender> → <recipient>]
Summary: one factual sentence.
Impact: scope, dependency, or verification effect.
Evidence: path, command result, ticket, or report.
Next: explicit owner and action.
```

Valid high-signal statuses are `REQUEST`, `UPDATE`, `DECISION`, `BLOCKER`,
`HANDOFF`, and `DONE`. A completion handoff names changed paths, verification result,
remaining risk, and any decision still required. Runtime chat is transient; link a
durable plan, report, work snapshot, or Git change whenever future work depends on it.
