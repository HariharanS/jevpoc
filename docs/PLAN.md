# Implementation plan

**Task status/dependencies:** [../tasks.json](../tasks.json). **Current evidence:** [../STATUS.md](../STATUS.md). **Application assignment:** B00–B08, then stop. Documentation adoption and prototypes do not mark M0–1 complete.

## First application slice

| Task | Dependency | Deliverable | Acceptance IDs |
|---|---|---|---|
| D00 | none | Adopt canonical docs; remove superseded active instructions; preserve Git history. | A01 (documentation portion) |
| B00 | D00 | Pinned pnpm workspace, apps/web, apps/api, packages/core, lockfile, env example, CI and scripts. | A01 |
| B01 | B00 | Runtime validators conforming to canonical schema; generated types and negative tests. | A02 |
| B02 | B01 | SQLite evidence/state/run tables; atomic state/audit commit; version and unique constraints. | A05 A06 A08 |
| B03 | B01 B02 | Declared scripted candidates/fake decisions; whole paragraph and chunked four-card story. | A03 A04 A17 |
| B04 | B02 B03 | Session/run/edit/cancel APIs; durable acceptance, dedupe, queue and local-origin limits. | A07 A09 A13 A19 |
| B05 | B01 B04 | App-first UI, evidence explanation, explicit field edit, responsive disclosure. | A14 A15 A16 A18 |
| B06 | B02 B04 | Durable cursor SSE, snapshot refresh, reconnect and Inspector. | A10 A11 |
| B07 | B04 B05 B06 | Real integration tests: races, transaction failure, restart, replay boundary and reload. | A06 A08 A10 A11 A12 A13 |
| B08 | B07 | Exact test log, demonstrated replay, updated status and honest handoff. | A20 |

Only B05/B06 are natural parallel tracks after shared contracts/API. Do not split core ownership between agents writing incompatible types. Each task owns its acceptance; a prototype test does not replace a database/HTTP test.

## Definition of done for M1

A clean checkout runs pnpm install --frozen-lockfile, pnpm dev, pnpm lint, pnpm typecheck and pnpm test without AI keys. The application—not just fixtures—demonstrates the paragraph/chunk story, stable IDs, missing data, selected evidence, persistence/reload, ordered trace, cancellation and restart recovery. Record actual browser checks separately from automated tests.

## After M1

| Task | Stage | Deliverable / experiment |
|---|---|---|
| F02 | M2 | Real JEV adapter + documented bounded extraction; E03. |
| F03 | M3 | One structured-output LLM adapter and matched benchmark; E04. |
| F06 | M6A/B | One control-first STT provider, revision ledger, scheduler and correction measurements; E05. |
| F04 | M4 | One harmless local tool, immutable approval and durable action ledger; E06. |
| F6C | M6C | One output-audio adapter and playback cancellation. |
| F05 | M5 | Structured memory candidates, scoped persistence and readback. |
| F08 | M8 | One tested host profile with real identity, durable storage and retention. |

Recommended learning order: M2 → M3 → M6A/B, before expanding broadly into tools/memory. F04 can follow M3 when governance is the concrete next goal. This is not a demand to build all later nodes. Native realtime, permanent harness selection and API journey compilation are later experiments in [EXPERIMENTS.md](EXPERIMENTS.md).

## Handoff record

Every completed task updates tasks.json and STATUS.md with commit, changed paths, decisions, commands/results, manual checks, unrun/failed tests, limitations and next unblocked task. Allowed status vocabulary: not_started, in_progress, implemented_not_tested, implemented_and_tested, deferred. Do not label a design resolved as a runtime bug fixed.
