# Current implementation status

Updated 25 September 2026. **The repository is a consolidated specification plus executable prototypes, not the completed production application.** This file records implementation; tasks.json records dependencies.

| Area | Actual state |
|---|---|
| Documentation adoption D00 | Canonical current docs, one schema, root instructions, plan, review/migration ledger and scoped experiments written. Superseded active numbered docs/old SVGs retired; Git history preserved. |
| E01 interaction prototype | Implemented. Fixed script, warm workspace, four cards, same-ID correction, selected evidence, optional timeline and stale-result probe. |
| E02 state probe | Implemented and tested: 16 passing in-memory tests. |
| Contract/data checks | Eight scenarios, 16 requests, 13 expected events, 31 exact evidence spans; 14 negative cases; generated TypeScript compiled; actual E02 outputs schema-validated. |
| Browser smoke | Passed at 1440/768/360px in explicitly offline injected-DOM mode. Local browser network navigation was blocked by the environment; served-browser mode remains a separate CI/manual check. |
| Prototype HTTP server | Allowlisted asset serving and untrusted Host rejection tested separately. Not an application API. |
| M0–1 application B00–B08 | **Not started.** No React/Fastify/SQLite production implementation yet. |
| Real JEV / LLM / voice / tools / memory / hosting | **Not implemented or benchmarked.** No paid provider requests made. |

Verification commands, limitations and CI entry point: [docs/VALIDATION.md](docs/VALIDATION.md).

## Next coding-agent task

Start **B00** from [BUILD.md](BUILD.md), then follow dependency-ready tasks in [tasks.json](tasks.json). The first assignment stops at B08/M1. Do not redo documentation adoption, resurrect retired designs, or claim the prototypes satisfy production database/HTTP/recovery acceptance tests.

## Handoff discipline

On each implementation change update task status and this file with the commit/task, actual commands, passed/failed/unrun checks, limitations and next unblocked task. Synthetic labels are not human-reviewed ground truth. A successfully generated schema is not a successfully implemented runtime.
