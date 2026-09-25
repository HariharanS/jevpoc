# Observability and Inspector

> **Status:** Normative implementation reference
> **Purpose:** Make every important runtime decision inspectable without creating multiple competing trace systems.

Observability is part of the POC product, not a later operations task.

## The source-of-truth rule

There is one application trace abstraction:

~~~text
TraceRecorder
    |
    +--> SQLite trace_events   <-- durable Inspector source of truth
    |
    +--> in-process TraceBus   <-- live fan-out to SSE subscribers
    |
    +--> OpenTelemetry         <-- operational mirror / external export
    |
    +--> stdout JSON           <-- developer convenience only
~~~

Rules:

- SQLite trace_events is the durable replay/history source of truth for Inspector.
- TraceBus publishes the same canonical TraceEvent stream live.
- OpenTelemetry mirrors important spans/attributes for operational tooling.
- stdout is never read back by application code.
- Do not maintain separate TraceSink and TraceStore contracts in core.

Core interface:

~~~ts
interface TraceRecorder {
  append(event: TraceEvent): Promise<void>;
  read(traceId: TraceId): Promise<TraceEvent[]>;
  subscribe(traceId: TraceId): AsyncIterable<TraceEvent>;
}
~~~

## A trace ID exists before processing begins

The client must be able to open the live Inspector while the run is still executing.

Therefore:

~~~http
POST /api/sessions/:sessionId/runs
~~~

first:

1. creates traceId;
2. persists run.started;
3. returns immediately.

Response:

~~~http
202 Accepted
~~~

~~~json
{
  "traceId": "tr_123",
  "status": "running"
}
~~~

The same server process then runs the semantic work asynchronously.

No external queue is required.

The UI subscribes immediately:

~~~http
GET /api/traces/:traceId/events
Accept: text/event-stream
~~~

When reconnecting, the server can replay persisted trace_events and then continue from TraceBus.

## Correlation model

Use explicit IDs instead of log ordering:

- sessionId — one user workspace/conversation;
- traceId — one semantic processing run/checkpoint;
- utteranceId — one voice speech unit;
- transcript revision — evidence version within an utterance;
- SemanticEventId — stable card/event identity;
- toolCallId — one normalized tool proposal/execution;
- approvalId — one approval lifecycle;
- responseId — one assistant audio/text response where needed.

Do not introduce a second runId in the first implementation.

A long voice session can contain many utterances and many traceIds.

## Canonical TraceEvent

~~~ts
type TraceEvent = {
  id: string;
  traceId: TraceId;
  sessionId: SessionId;

  sequence: number;
  at: number;

  type:
    | "run.started"
    | "input.received"
    | "voice.session.started"
    | "voice.speech.started"
    | "voice.transcript.partial"
    | "voice.transcript.revised"
    | "voice.transcript.final"
    | "checkpoint.created"
    | "jev.started"
    | "jev.completed"
    | "policy.decided"
    | "state.created"
    | "state.patched"
    | "state.sealed"
    | "llm.started"
    | "llm.completed"
    | "tool.proposed"
    | "tool.approval_required"
    | "tool.started"
    | "tool.completed"
    | "approval.requested"
    | "approval.decided"
    | "voice.output.started"
    | "voice.output.completed"
    | "voice.output.interrupted"
    | "memory.classified"
    | "run.completed"
    | "run.failed";

  data: JsonValue;
};
~~~

sequence is monotonically increasing within one trace.

Provider-native event names may be preserved in data.providerMetadata for debugging, but Inspector renders canonical events.

## What Inspector must answer

For any run:

- what evidence arrived?
- which transcript revisions occurred?
- why was a semantic checkpoint created?
- which JEV question set/version ran?
- what state did Jev receive?
- what typed answers/probabilities came back?
- which threshold/policy branch fired?
- was an LLM called? which configured model class/provider?
- which SemanticEvent was created/patched/sealed?
- which tools were proposed/executed?
- was approval required?
- did a fallback path run?
- how long did each stage take?
- what token/cost metadata was reported?
- what memory signal was classified/persisted?

Do not expose private model chain-of-thought. This is an execution/state trace.

## Text / semantic run timeline

Example:

~~~text
run.started
  -> input.received
  -> jev.started
  -> jev.completed
  -> policy.decided
  -> state.patched
  -> run.completed
~~~

If an LLM is required:

~~~text
run.started
  -> input.received
  -> jev.completed
  -> policy.decided: route llm
  -> llm.started
  -> llm.completed
  -> state.created
  -> run.completed
~~~

## Voice timeline

The useful unit is an episode:

~~~text
voice.speech.started
  -> transcript.partial r17
  -> transcript.final r18
  -> checkpoint.created
  -> jev.completed
  -> state.created
  -> transcript.final r19
  -> checkpoint.created: correction-hint
  -> jev.completed
  -> state.patched
  -> speech ended
~~~

For the Coke -> Water fixture, Inspector should visibly show that one existing event was PATCHed rather than a second event created.

## Checkpoint telemetry

Record:

- trigger reason;
- consumed revision range;
- elapsed time since previous checkpoint;
- amount of new transcript text;
- provider turn/end-of-turn metadata if any;
- correction-hint present?;
- Jev latency;
- policy result;
- state mutation;
- LLM route/skip.

This allows us to tune the checkpoint scheduler from evidence.

## Tool / approval telemetry

Example:

~~~text
tool.proposed
  tool = create_reminder
  input = {...}

policy.decided
  approval = required

approval.requested
  approvalId = ap_42

approval.decided
  approved by user:local

tool.started
tool.completed
run.completed
~~~

Approval begins only after a concrete ToolProposal exists.

## Runtime UI toggle

Inspector is **not** a build-time feature flag.

The same execution always records the same trace events.

UI:

~~~text
[ App ] [ Lab / Inspector ]
~~~

Persist the user's display preference in localStorage.

Optional URL shortcut:

~~~text
?inspector=1
~~~

App mode hides internal panels.

Lab/Inspector mode renders the three-column pipeline and trace drawer defined in docs/20-ui-ux-design.md.

## Local implementation

Initially:

- append canonical TraceEvent records to SQLite;
- publish appended events to the in-process TraceBus;
- stream TraceBus to SSE subscribers;
- create OpenTelemetry spans for significant operations;
- log concise structured JSON to stdout.

Do not require a hosted observability service locally.

Later, export OTLP to whichever deployment backend is selected.

## Metrics

Track only metrics that help validate the architecture:

### Jev / LLM

- Jev latency per question set;
- Jev input tokens / estimated cost;
- LLM latency/tokens/cost;
- percentage of bounded checkpoints that skip LLM;
- fallback rate.

### Streaming voice

- speech start -> first partial transcript;
- speech end/provider EOT -> checkpoint;
- checkpoint -> useful SemanticEvent mutation;
- transcript revisions per utterance;
- checkpoints per minute;
- Jev calls per minute;
- correction -> visible PATCH latency;
- interruption -> audio stop latency.

### Semantic state

- duplicate-event rate;
- correction patch accuracy;
- missing-information detection;
- visible card-type flaps;
- end-to-end fixture success.

See docs/19-first-demo-and-evaluation.md for benchmark targets and baseline comparisons.

## Privacy begins in Milestone 1

Do not postpone trace privacy until cloud deployment.

Rules:

- raw microphone audio is not persisted by default;
- API keys and authorization headers are never written to TraceEvent.data;
- known secret fields are redacted before persistence;
- user text/transcript can be retained in local development because Inspector needs it;
- deployed environments default to redacted content;
- retention policy must be configurable before deployed use with real user data.

Configuration:

~~~text
TRACE_CONTENT_MODE=full | redacted | metadata-only
~~~

Defaults:

~~~text
local development: full
deployed: redacted
~~~

## Reconnection

For SSE reconnect:

1. client retains traceId and last received sequence;
2. server replays persisted SQLite events after that sequence;
3. server then follows TraceBus live.

This is enough for the POC. Do not add Kafka/event streaming infrastructure.

## Definition of success

A reviewer watching Lab mode should be able to determine, without opening source code:

1. what the user said;
2. when/why the runtime chose to process it;
3. what Jev decided;
4. whether an LLM was called;
5. which event/card changed;
6. whether a tool/approval occurred;
7. the order and latency of those operations.

If the trace system cannot answer those questions, it is not fulfilling the purpose of the POC.
