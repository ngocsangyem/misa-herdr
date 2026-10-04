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

Valid high-signal statuses are `REQUEST`, `UPDATE`, `DESIGN_CHANGE_REQUEST`,
`DECISION`, `BLOCKER`, `HANDOFF`, and `DONE`. `DESIGN_CHANGE_REQUEST` identifies a
current approach or premise challenged by concrete evidence; it names the affected
owner and dependency, bounded options, and the requested disposition. It does not
authorise the sender to change another owner's scope. When its disposition changes
future work, the owning report, plan, or work snapshot records the decision, evidence,
owner, affected dependents, and disposition before affected work advances. A completion
handoff names changed paths, verification result, remaining risk, and any decision
still required. Runtime chat is transient; link a durable plan, report, work snapshot,
or Git change whenever future work depends on it.
