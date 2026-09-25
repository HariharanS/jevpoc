# Runtime contract

**Current behavioral authority.** Exact structures: [../contracts/mvp.schema.json](../contracts/mvp.schema.json). TypeScript is generated, not separately edited. This specification is not a claim of implementation; see [../STATUS.md](../STATUS.md).

## 1. Ownership and toolchain

Application target: pnpm workspaces, TypeScript, React/Vite, Fastify, Zod, Vitest, Biome, plain SQL and node:sqlite. Pin exact tested runtime/package versions and a lockfile in B00. On Node 22 the unflagged SQLite compatibility floor is 22.13; this floor is not a security-update policy. See [RESEARCH.md](RESEARCH.md).

Core imports no HTTP, UI, SQLite or provider SDK. One process coordinates sessions. State and audit use the same database transaction helper. OpenTelemetry is an optional operational mirror, not application state or replay authority. Runtime validators must conform to the canonical JSON Schema; do not maintain an independently looser Zod definition.

## 2. Immutable evidence

Each accepted input has inputId, session ownership, source, revision, text snapshot and receive time. Transcript revisions are snapshots of a named segment; adapters assemble provider deltas before this boundary. Retain superseded snapshots. A provider correction to transcription is distinct from a new user statement correcting meaning.

Field evidence points to inputId + revision + inclusive-start/exclusive-end UTF-16 code-unit range + exact quote. Check bounds, surrogate pairs and quote equality. UI edits retain structured input evidence and explicit field paths; never attribute a form value to speech. Provenance is data, not a generated explanation.

Transcript finality means only that a provider finalized transcription. It does not authorize sealing, approval or execution. Session-scoped evidence may precede any semantic processing run.

## 3. Interpretation and extraction

```text
input ledger / explicit submit
  -> checkpoint and bounded frame
  -> versioned preflight where useful
  -> explicit candidate extraction
  -> bounded relation / target / completeness decisions
  -> deterministic validation and ordered mutation batch
  -> atomic commit
  -> snapshot / cards / optional explanation
```

M1 uses a declared ScriptedInterpreter and FakeDecisionEngine. Both paragraph and incremental golden cases are scripted. Trace/UI show simulation. Unknown text produces unsupported/needs-clarification, never a pretend successful result. Fake decisions preserve Noul/Choice/Score answer shapes. Fixtures and expected labels are never part of live model inputs.

M2 documents the bounded parser grammar, extraction method/version, source ranges, unsupported language and ambiguity behavior. A number found in text is not proof of the target field. JEV's relation/target labels do not magically produce arbitrary field values. Missing coverage waits, clarifies or explicitly escalates once an LLM is available.

M3 may use one bounded structured extraction/reasoning call. Validate its candidates through the same policy. Count extraction, reconciliation, fallback and retries in latency/cost.

Routine question sets are versioned application artifacts. Canonical concepts: semantic_relation, target_event, domain, input_complete, needs_reasoning. Instructions explicitly identify each candidate; IDs alone are not prompts. Batch independent questions sharing state. If one answer changes candidate state, make a separate bounded stage. Single-pass means no autonomous loop, not necessarily one network call.

## 4. State and mutations

SemanticEvent is a discriminated union. Canonical fields include amountMl, expressedEmotions and structured time. Server assigns stable event IDs; models do not choose another session's identity.

An ordered mutation batch is validated completely before writing. CREATE uses a fresh ID/version 1. PATCH requires matching event type/version, at least one changed field and bindings for the changed values. Replace array fields as a whole validated value; continuation preserves earlier facts unless explicitly corrected. Every patch increments event version once. Each committed batch increments session stateVersion once.

Same-batch creation/correction resolves internal candidate aliases before validation. Reject an invalid batch atomically, or create a smaller explicitly valid proposal with unresolved candidates retained. Never partially commit an invalid batch.

M1 implements CREATE, PATCH, WAIT; SEAL is typed but optional. MERGE, CLOSE, semantic-item cancellation and post-execution corrective actions are later explicit commands. No arbitrary model JSON Patch.

Semantic statuses: draft, soft_committed, sealed, closed, cancelled. Every status may be persisted. Sealed means stable interpretation, not immutable history, approval, scheduling or completion. A sealed unexecuted item needs an explicit amendment policy; an executed action needs a new corrective action.

Run statuses are separate: queued, running, awaiting_approval, completed, needs_clarification, denied, failed, cancelled, superseded, limited. The first three are non-terminal. quality=degraded is orthogonal. A completed interpretation may leave a draft reminder.

## 5. Ordering and commit

One bounded semantic queue/worker per session; different sessions can progress concurrently. Explicit edits use the same validation/commit boundary. Never drop unconsumed inputs while coalescing.

Accept (sessionId, requestId) once with a canonical body digest. Same key/body returns the existing run; same key/different body is 409 idempotency_conflict. Provider dedupe includes connection epoch, segment and revision. Conflicting text for the same revision is an error.

A frame pins stateVersion and exact evidence dependencies. Recheck both before commit. New unrelated evidence is not automatically stale; a revision to a depended-on segment is. Input order is retained; edits/cancellation invalidate conflicting work.

Within a short SQLite transaction: check versions/dependencies; validate/write the whole batch; increment versions; persist run transition and canonical audit events/cursors; commit. Publish wakeups only afterwards. Never await a provider or client inside the transaction. No separate delayed state-change logging transaction.

At most one bounded rebase/recompute on an ordinary semantic conflict; otherwise mark superseded/needs-clarification and retain evidence. Cancellation prevents a future commit, not rollback of already committed state.

## 6. Storage and restart

Initial tables: sessions, input_evidence, semantic_events, turns, trace_events. turns.trace_id is the processing-run identity; no second runId. Persist request digest/status/recovery data.

Unique constraints: session/requestId, session/inputId/revision, session/eventId, session/sessionSequence, and trace/sequence for run events. Foreign keys, indexed lookups and transactional migrations are required. JSON is acceptable for evolving payloads.

Persist queued input and run.accepted before 202. Restart safely requeues accepted-but-unstarted semantic work. Interrupted running work becomes failed/process_restarted, with explicit user retry under a new requestId. Never reuse that policy to blindly repeat a later external tool. Awaiting approval and unknown action outcomes have their own durable recovery rules.

## 7. HTTP

| Route | Required behavior |
|---|---|
| POST /api/sessions | 201 validated locale/timeZone and empty snapshot. |
| GET /api/sessions/:id | Authorized snapshot with stateVersion, eventCursor, cards and runs. |
| POST /api/sessions/:id/runs | Persist text/simulated transcript/UI edit then 202 traceId, queued, duplicate=false. Duplicate returns existing status. |
| GET /api/sessions/:id/events?after=N | Session-cursor SSE; public state/run summaries. |
| GET /api/traces/:id | Run summary and bounded paginated history. |
| GET /api/traces/:id/events?after=N | Inspector projection of the same stored stream. |
| POST /api/traces/:id/cancel | Cancel unfinished semantic work; terminal run returns current status. |
| GET /api/health | Readiness and declared provider mode, no secrets. |

Use JSON content types, size limits and typed error bodies. Invalid input 400/422; unknown 404; version/idempotency conflict 409; oversized 413; exhausted capacity 429. Unknown/schema-failed input must not return fake success.

Reset creates a new session, not deletion of audit history. Last-session ID in local storage suffices for M1 resume. Session deletion, production identity, approval and voice endpoints are later scope.

## 8. Replay, trace and UI

Canonical TraceEvent has a sessionSequence and optional traceId/trace sequence. Pre-run evidence has null run identifiers. Server cursors, not timestamps, define order.

SQLite is Inspector history authority; the in-process bus is a wakeup convenience. Register a latched wakeup before reading durable rows, drain bounded pages after cursor, then wait with a short poll fallback. This closes the replay/live gap without external infrastructure.

SSE id is sessionSequence. Last-Event-ID overrides initial after on reconnect. Client deduplicates. Gaps are normal on a trace-filtered stream. Expired retention cursor causes reset_required, close, fresh snapshot, resume at eventCursor. Bound buffers; disconnect slow clients rather than block state commits.

state.committed notifies stateVersion/affected IDs. App state comes from authorized snapshots, not reconstructing possibly redacted model traces. Ignore a late snapshot with an older stateVersion. Trace content modes cannot break the cards.

OTel owns its standard trace/span IDs and uses app.trace_id as correlation. Inspector shows inputs, bounded decisions, policy and changes, never hidden chain-of-thought.

## 9. Limits and failure

Starting development guardrails, not calibrated product targets: text 32 KiB, JSON body 256 KiB, 32 candidates/submission, 32 queued inputs/session, history page 100/max 500. Reject or explicitly defer excess, never silently truncate and call it processed.

Inject clock/fake delays for tests. Real adapters receive an overall deadline and AbortSignal. One retry owner; SDK/application retries must not multiply. Fallback fits the remaining deadline. JEV failure cannot become a guessed successful decision.

## 10. Later voice scheduler

Deduplicate content before final/end branching. Track content frontier and boundary progress separately. Use real timer callbacks with injected clock, word/age/pause/finality/correction-hint triggers and one in-flight interpretation. Lexical hints only accelerate a checkpoint.

Preserve every unconsumed segment during coalescing. A new depended-on revision supersedes speculative work. Target options include unresolved/out-of-window; bounded context is not proof that no older target exists. Thresholds, horizon and hysteresis are measured configuration.

## 11. Real decision adapter

Read the official TypeSafe reference/skill before M2; do not invent SDK fields. Normalize behind DecisionEngine. Validate answer IDs, question types, finite numbers, choice membership, distribution keys/sums, score rubric and usage/model metadata. Fractional Score is allowed; empty distributions are not zero risk. Noul has no confidence field.

Stage-specific fallback: semantic classification may use a configured baseline or wait; consequential checks fail safe; completion obeys bounds. Probabilities are not authorization. Pin model/SDK/question-set versions for evaluation, not guessed current aliases or prices.

## 12. Later boundaries

Control-first transcription and native speech-to-speech are different paths. In native mode the voice model hears audio before JEV; application control is enforced at tools, state and memory. Capability evidence is provider + surface + model/version specific, with supported/unsupported/unverified values. See [RESEARCH.md](RESEARCH.md) and [SAFETY.md](SAFETY.md). These sections do not expand M1 scope.
