# Current decision register

**Adopted for this repository on 25 September 2026 under the request to fix the repo.** Accepted design is not implemented behavior; STATUS.md records implementation.

Preserved principles: local modular monolith; application-owned state/policy; JEV as a bounded primitive, not the harness; provider SDK isolation; typed UI; control-first voice before native comparison; no agent loop for each transcript partial; human approval for consequential actions; deferred permanent harness/cloud.

| ID | Decision | Canonical owner |
|---|---|---|
| P01 | One JSON Schema + generated types, one behavioral contract. Superseded docs remain in Git history, not an active archive. | RUNTIME.md / contracts |
| P02 | Explicit scripted, bounded-parser or LLM extraction with provenance; no values-from-nowhere. | RUNTIME.md §3 |
| P03 | Per-session coordinator; version/evidence checks; atomic state and audit transaction. | RUNTIME.md §§4–6 |
| P04 | Session cursor; durable replay; snapshots independent of trace redaction. | RUNTIME.md §8 |
| P05 | Queued acceptance, explicit run status, restart and cancellation semantics. | RUNTIME.md §§5–7 |
| P06 | Local time/date/timezone/instant separated; capture is not scheduling. | PRODUCT.md / schema |
| P07 | Immutable approval binding and explicit unknown external outcome. | SAFETY.md |
| P08 | Matched final/hybrid × JEV/LLM evaluation; full-path cost. | EVALUATION.md |
| P09 | Recommend voice proof before broad tools/memory expansion. | PLAN.md |
| P10 | Pin tested toolchain at scaffold; Node 22 compatibility floor 22.13. | RUNTIME.md §1 |
| P11 | Warm, restrained input/cards workspace, mono accents, listening bars and optional details; old light/dashboard SVG is retired. Pixel choices remain prototype-level. | UI.md |

The retired ADR 0003 port names TraceSink and ToolExecutor are not current interfaces. TraceRecorder describes canonical audit access; state/audit share a transaction helper; ToolGateway is the later governed action boundary. The local-first, decision-plane and two-voice-mode principles of the earlier ADRs remain intact here.

Open experiments: exact extraction grammar, JEV thresholds, scheduler timing/horizon, first STT model, reasoning model IDs, permanent harness, native voice provider, hosted identity/storage. No agent should settle all of these during M1. Provider documentation is evidence, not permission to install or use every provider.

Change durable decisions in this file and their canonical owner/tests together. Do not use a newly dated note to conceal a contradictory old instruction.
