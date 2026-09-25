# POC and prototype candidates

Each experiment answers one uncertainty and has a stop/decision criterion. The table is not an instruction to build all candidates. No paid providers are invoked by the current prototypes.

## E01 — Interaction and taste prototype

**State:** executable scripted prototype in prototypes/workspace. **Question:** can people understand streaming input → stable cards → correction without a permanent technical dashboard?

Try replay, step, selected-card evidence, timeline disclosure, reset while processing and reduced motion. Current visual direction: warm brown, mono transcript, listening bars, a small pending interpretation marker, restrained cards. Do not mistake scripted animation for measured STT/AI latency.

Deliverable: the runnable page plus recorded browser checks. Exit: four cards, same hydration ID, mixed journal feelings, honest missing fields, no context reset when details open. User taste approval and accessibility audit remain separate from functional checks.

## E02 — State and race probe

**State:** executable in-memory model and Node tests in prototypes/runtime, shared with E01. **Question:** do version checks, atomic batches and evidence bindings prevent stale corrections and partial updates?

Inject stale session/event versions, duplicate IDs, invalid quotes, unknown fields, a failing second mutation, cancellation and replay/reset. Exit: invalid/stale batches leave prior state unchanged; golden fields match. This does not prove SQLite transactions, HTTP idempotency, SSE, crash recovery or real concurrent processes; those belong to B02/B04/B06/B07.

## E03 — JEV plus bounded extraction

**State:** planned; after B08, owned by F02. **Question:** which parts of mixed speech can be handled without an open-ended extractor?

Use real JEV behind DecisionEngine, a written parser grammar and reviewed held-out fixtures. Include unseen drinks/quantities, two similar targets, long paragraph, corrections without cue words and unsupported requests. Trace candidate values/provenance separately from JEV decisions. No expected labels in provider input.

Exit: publish supported coverage, abstentions, false patches, parse failures and total call cost. Continue only when useful coverage has acceptable identity/correction quality. Narrow the grammar or explicitly use LLM extraction when evidence fails; never conceal fixture matching.

## E04 — Matched JEV/LLM benchmark

**State:** planned; F03 after F02. **Question:** does the extra decision layer improve quality/cost/latency for equivalent work?

Four cells from EVALUATION.md: final/hybrid × JEV/LLM. Same evidence, schemas, state mutation and safety. Include extraction/retries/fallback/audio costs. Pin config and hold out examples.

Exit: reproducible report with sample counts, p50/p95, semantic success/coverage, duplicate rate and total cost. Retain, narrow or simplify the JEV path based on results; no architecture loyalty requirement.

## E05 — Control-first voice evidence spike

**State:** planned; F06 after F03. **Question:** does real STT preserve the evidence needed for corrections without sluggish or noisy checkpoints?

One provider first. Candidate sources: Deepgram Flux; a verified Gemini transcription surface; OpenAI dedicated transcription; xAI streaming STT. RESEARCH.md is the source index, not a capability guarantee. Choose by current access and documented event semantics. Test 10 scripts including 60–90 seconds continuous speech, false starts, proper names, mid-thought pause and Coke/no/water.

Exit: recorded event mapping, correction-evidence preservation, first useful-state latency, checkpoint/call counts, no duplicate final/end processing, disconnect/resume behavior. Add a second provider only to test a concrete remaining uncertainty. No native speech-to-speech before the control-first comparison is understood.

## E06 — One local tool and approval probe

**State:** planned; F04 after F03. **Question:** can a concrete action pause/resume without stale authorization or accidental duplication?

Use a local task/reminder record or mock external tool. Inject approval after an edit, wrong actor, expiry, duplicate decision, timeout and unknown result. Exit: bound approvals and durable action ledger; fail closed. Family routine Dad/exception Mum is an optional later variation, not first-tool scope.

## E07 — Harness interception / native voice comparison

**State:** deferred until a real requirement. **Question:** can an existing harness remove code without hiding raw-request/model/tool control?

Compare the current thin runtime with **one** of Copilot SDK, MAF, LangChain/LangGraph, Strands or Pi. Test raw input before selection, model route, tools, cancellation and trace linkage. Distinguish standard MAF from specialized Copilot-agent middleware. Count custom glue and lost control, not feature-list length.

Native realtime is a separate arm: one provider, one governed delegated tool, no provider-direct policy bypass. Measure barge-in/playback, tool roundtrip and evidence visibility. Exit: adopt only with demonstrated reduction in work while preserving contracts; record the exact SDK/model and decision.

## E08 — API Journey Compiler

**State:** future domain POC, not part of the personal workspace build. **Question:** can the harness translate payment requirements + versioned API docs into an editable, evidence-backed integration journey?

Input: one pinned sandbox specification, one requirement such as authorize at checkout/capture after stock confirmation. Output: business/provider states, API calls, webhook paths, failure/compensation, evidence and unresolved assumptions. No live charges. A requirement correction recomputes affected edges rather than appending another chat answer.

Exit: all operation references resolve; paths are tested against mocked success/failure/duplicate/out-of-order events; unknown business/provider semantics remain explicit. Follow SAFETY.md. A valid graph alone is not payment correctness.

## A new experiment needs

Hypothesis; owner task; dependencies; smallest scope; excluded work; reproducible fixtures/setup; success/failure/stop criteria; dated result and adopted decision. Update STATUS.md only with executed evidence. Do not create competing prototypes indefinitely: retire a losing experiment from the active tree once its useful result is captured.
