# Technical design

> **Status:** Normative implementation reference
> **Read with:** docs/17-typesafe-ai-reference.md and docs/18-runtime-contracts.md

## Locked initial stack

Use a boring TypeScript stack:

~~~text
Node.js          22+
package manager  pnpm workspaces
language         TypeScript
web              React + Vite
API              Fastify
validation       Zod
database         node:sqlite + plain SQL
tests            Vitest
lint/format      Biome
telemetry        OpenTelemetry
Inspector live   Server-Sent Events
voice transport  WebSocket where server-mediated
~~~

Do not add an ORM until plain SQL becomes painful.

Do not add CopilotKit initially. A standard React UI keeps semantic state and orchestration visible. Revisit agent-UI frameworks only after the base interaction works.

## Repository shape

~~~text
/
├─ AGENTS.md
├─ README.md
├─ apps/
│  ├─ api/
│  └─ web/
├─ packages/
│  └─ core/
├─ docs/
│  ├─ adr/
│  ├─ examples/
│  └─ research/
└─ tests/
   └─ evals/
~~~

Do not split into more packages before real code pressure exists.

## External AI adapters

### Jev / TypeSafe

Use the official TypeScript SDK inside the adapter:

~~~bash
pnpm add @typesafe-ai/sdk
~~~

Environment:

~~~text
TYPESAFE_API_KEY=...
TYPESAFE_MODEL=jev-1.13.0
~~~

Use a pinned model version for eval work. jev-latest can be used during exploration.

Read docs/17-typesafe-ai-reference.md before implementing.

### General-purpose LLM

The first reference adapter uses the official OpenAI JavaScript SDK / Responses API behind our LanguageModel port.

Environment:

~~~text
OPENAI_API_KEY=...
LLM_PROVIDER=openai
LLM_MODEL=<configured model>
~~~

The exact model ID is deployment config, not domain code.

GitHub Copilot SDK, Microsoft Agent Framework, LangChain and Strands remain harness experiments described in docs/10 and docs/research.

## Identity / correlation types

~~~ts
type SessionId = string;
type TraceId = string;
type UtteranceId = string;
type SemanticEventId = string;
type ToolCallId = string;
type ApprovalId = string;
~~~

For the POC, traceId is also the semantic processing-run ID. Do not introduce a separate runId yet.

## Jev question and answer types

Do not use one generic Decision<T> shape.

~~~ts
type NoulDecisionQuestion = {
  type: "noul";
  instructions: JsonValue;
  criteria?: {
    true?: JsonValue;
    false?: JsonValue;
  };
};

type ChoiceDecisionQuestion = {
  type: "choice";
  instructions: JsonValue;
  criteria: Record<string, JsonValue | null>;
};

type ScoreDecisionQuestion = {
  type: "score";
  instructions: JsonValue;
  criteria: JsonValue[];
};

type DecisionQuestion =
  | NoulDecisionQuestion
  | ChoiceDecisionQuestion
  | ScoreDecisionQuestion;

type NoulDecisionAnswer = {
  type: "noul";
  noul: number;
};

type ChoiceDecisionAnswer<T extends string = string> = {
  type: "choice";
  choice: T;
  probabilities: Record<T, number>;
  confidence: number;
};

type ScoreDecisionAnswer = {
  type: "score";
  score: number;
  legend: Record<string, string>;
  probabilities: Record<string, number>;
  confidence: number;
};

type DecisionAnswer =
  | NoulDecisionAnswer
  | ChoiceDecisionAnswer
  | ScoreDecisionAnswer;

type DecisionRequest = {
  state: JsonValue;
  questions: Record<string, DecisionQuestion>;
  model?: string;
};

type DecisionResponse = {
  model: string;
  answers: Record<string, DecisionAnswer>;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  latencyMs: number;
};
~~~

Noul does not have a separate confidence value.

## Core ports

Keep application-owned interfaces small.

~~~ts
interface DecisionEngine {
  decide(request: DecisionRequest): Promise<DecisionResponse>;
}

interface LanguageModel {
  generate(request: GenerationRequest): Promise<GenerationResponse>;
}

interface ToolGateway {
  proposeAndMaybeExecute(proposal: ToolProposal): Promise<ToolGatewayResult>;
}

interface SessionStore {
  load(id: SessionId): Promise<SessionState | null>;
  save(state: SessionState): Promise<void>;
}

interface TraceRecorder {
  append(event: TraceEvent): Promise<void>;
  read(traceId: TraceId): Promise<TraceEvent[]>;
  subscribe(traceId: TraceId): AsyncIterable<TraceEvent>;
}
~~~

Initial DecisionEngine implementations:

~~~text
FakeDecisionEngine
TypeSafeDecisionEngine
~~~

The fake returns the **same typed answer union** as the real adapter.

## Semantic input

Text submissions and voice semantic checkpoints enter the same core operation.

~~~ts
type SemanticInput = {
  traceId: TraceId;
  sessionId: SessionId;
  source: "text" | "voice" | "ui" | "tool" | "approval";
  text?: string;
  voice?: {
    utteranceId: UtteranceId;
    fromRevision: number;
    toRevision: number;
    isSpeechEnded: boolean;
  };
  at: number;
};
~~~

Raw transcript deltas do not call orchestration directly. The voice coordinator / checkpoint scheduler decides when to create SemanticInput.

## Semantic frame

The application enriches SemanticInput with facts it already owns:

~~~ts
type SemanticFrame = {
  input: SemanticInput;

  recentContext: {
    transcriptTail?: string;
    recentMessages?: string[];
  };

  activeState: {
    events: SemanticEvent[];
    unresolvedFields: string[];
  };

  runtime: {
    availableTools: ToolSummary[];
    allowedModelClasses: Array<"fast" | "reasoning">;
    hardConstraints: string[];
  };

  memory: MemorySignal[];

  evidence: EvidenceRef[];
};
~~~

No LLM is required to build this frame.

## Session state

~~~ts
type SessionState = {
  id: SessionId;
  version: number;
  activeEvents: SemanticEvent[];
  pendingApprovalIds: ApprovalId[];
  shortTermSignals: MemorySignal[];
  lastTraceId?: TraceId;
  createdAt: number;
  updatedAt: number;
};
~~~

Transcript evidence lives in speech_events / Transcript Ledger, not as the only session model.

## Semantic event

~~~ts
type SemanticEvent = {
  id: SemanticEventId;
  type: string;
  status:
    | "draft"
    | "soft_committed"
    | "sealed"
    | "closed"
    | "cancelled";
  fields: Record<string, unknown>;
  version: number;
  createdAt: number;
  updatedAt: number;
};
~~~

The application mutation vocabulary is:

~~~text
CREATE
PATCH
MERGE
CLOSE
CANCEL
IGNORE
WAIT
~~~

## Execution semantics

### Milestones 1-3

One semantic input is one bounded single-pass execution:

~~~text
frame
 -> Jev
 -> policy
 -> deterministic mutation OR optional one LLM call
 -> completion check
 -> stop
~~~

No autonomous loop.

### Milestone 4+

Tool-capable paths may use a bounded step loop:

~~~text
maxSteps = 4
maxToolCalls = 3
~~~

Stop on:

- completed;
- needs clarification;
- awaiting approval;
- denied;
- unrecoverable failure;
- max steps.

Never run an unbounded agent loop.

## Orchestrator sketch

~~~ts
async function processSemanticInput(input: SemanticInput): Promise<void> {
  const state = await sessions.loadOrCreate(input.sessionId);
  const frame = await buildSemanticFrame(input, state);

  await traces.append(traceEvent("input.received", frame));

  const answers = await decisionEngine.decide(
    questionRegistry.build("pre_turn_v1", frame),
  );

  const route = policy.route(frame, answers);

  switch (route.kind) {
    case "wait":
      await finish("needs_clarification");
      return;

    case "deterministic":
      await applySemanticMutation(route.mutation);
      await finish("completed");
      return;

    case "llm":
      await runOneLlmStep(frame, route);
      await finish("completed");
      return;
  }
}
~~~

The concrete implementation will include error/fallback handling from docs/18-runtime-contracts.md.

## Voice event model

Provider SDK objects must not leak into core.

~~~ts
type SpeechEvent =
  | {
      type: "speech.started";
      sessionId: SessionId;
      utteranceId: UtteranceId;
      at: number;
    }
  | {
      type: "transcript.partial";
      sessionId: SessionId;
      utteranceId: UtteranceId;
      revision: number;
      text: string;
      at: number;
    }
  | {
      type: "transcript.revised";
      sessionId: SessionId;
      utteranceId: UtteranceId;
      revision: number;
      replacesRevision: number;
      text: string;
      at: number;
    }
  | {
      type: "transcript.final";
      sessionId: SessionId;
      utteranceId: UtteranceId;
      revision: number;
      text: string;
      at: number;
    }
  | {
      type: "speech.ended";
      sessionId: SessionId;
      utteranceId: UtteranceId;
      at: number;
    }
  | {
      type: "response.interrupted";
      sessionId: SessionId;
      responseId: string;
      at: number;
    };
~~~

The Transcript Ledger preserves revisions.

The Semantic Checkpoint Scheduler decides **when** to ask Jev. Jev decides **what** the evidence means.

See docs/16-streaming-checkpoint-scheduler.md.

## Voice ports

Control-first mode:

~~~ts
interface SpeechInput {
  pushAudio(frame: AudioFrame): Promise<void>;
  events(): AsyncIterable<SpeechEvent>;
}

interface SpeechOutput {
  speak(request: SpeakRequest): AsyncIterable<OutputAudioEvent>;
  cancel(responseId: string): Promise<void>;
}
~~~

Native realtime mode:

~~~ts
interface RealtimeVoiceSession {
  sendAudio(frame: AudioFrame): Promise<void>;
  sendToolResult(result: ToolResult): Promise<void>;
  cancelResponse(): Promise<void>;
  events(): AsyncIterable<RealtimeVoiceEvent>;
}
~~~

Do not flatten these into one misleading abstraction.

## API surface

### Create semantic run

~~~http
POST /api/sessions/:sessionId/runs
~~~

Returns immediately after trace creation:

~~~http
202 Accepted
~~~

~~~json
{
  "traceId": "tr_...",
  "status": "running"
}
~~~

The same process schedules the run asynchronously. No external queue is required.

### Trace

~~~http
GET /api/traces/:traceId
GET /api/traces/:traceId/events
~~~

The events endpoint is SSE.

### Session

~~~http
GET /api/sessions/:sessionId
~~~

### Approval

~~~http
POST /api/approvals/:approvalId/decision
~~~

### Voice

~~~text
WS /api/voice/sessions/:sessionId
~~~

for the first server-mediated control-first path.

## Trace architecture

There is one application trace abstraction.

~~~text
TraceRecorder
  -> SQLite trace_events       source of truth / replay
  -> in-process TraceBus       live SSE
  -> OpenTelemetry            operational mirror/export
  -> stdout JSON              debug convenience
~~~

Inspector reads SQLite history and the live TraceBus stream.

OpenTelemetry and stdout are not application state.

See docs/04-observability.md.

## Tool proposal

Prefer provider-native function/tool calling when available.

Normalize every proposal:

~~~ts
type ToolProposal = {
  callId: ToolCallId;
  sessionId: SessionId;
  traceId: TraceId;
  source: "llm" | "realtime_voice" | "workflow" | "ui";
  toolId: string;
  input: JsonValue;
  semanticContext: {
    userGoal?: string;
    activeEventIds: SemanticEventId[];
  };
};
~~~

Adapters without native tools may use structured JSON internally, but core consumes only ToolProposal.

## Approvals

Approval is created only after a concrete validated ToolProposal exists.

First local demo identity is a fixed development fixture, not real authentication.

Persist approvals in SQLite and resume a paused run after approval.

See docs/18-runtime-contracts.md.

## Persistence

Initial SQLite tables:

~~~text
sessions
semantic_events
turns
trace_events
speech_events
approvals
tool_calls
memory_candidates
memory_signals
~~~

Suggested minimal responsibilities:

- sessions: session metadata/version;
- semantic_events: current card/event state;
- turns: submitted text/semantic run summary;
- trace_events: ordered Inspector source of truth;
- speech_events: Transcript Ledger evidence;
- approvals: pending/resolved approval state;
- tool_calls: normalized proposal/result lifecycle;
- memory_candidates: uncommitted classifications;
- memory_signals: persisted readable memory.

Store JSON for evolving schemas. Normalize only fields needed for lookup/indexing.

Raw audio is not persisted by default.

## Memory read path

Milestone 5 reads memory into SemanticFrame.

Initial retrieval is deterministic:

- all active short-term signals for current session;
- non-superseded long-term signals matching explicit kind/key;
- small recent domain-relevant set.

Do not add vector search yet.

See docs/13-session-retro-memory.md.

## Provider capabilities

Voice adapters can publish capability metadata:

~~~ts
type VoiceCapabilities = {
  nativeSpeechToSpeech: boolean;
  streamingInputTranscript: boolean;
  hasInterimTranscript: boolean;
  hasFinalTranscript: boolean;
  inputTranscriptRevisions: boolean;
  outputTranscript: boolean;
  serverVad: boolean;
  semanticTurnDetection: boolean;
  bargeIn: boolean;
  toolCalling: boolean;
  asyncTools: boolean;
  sessionResumption: boolean;
  browserEphemeralAuth: boolean;
};
~~~

Use this for tests/session setup, not as a reason to build a huge provider framework.

See docs/research/2026-09-25-voice-api-capability-matrix.md.

## Model routing

Separate:

1. voice-session provider/model selection;
2. per-semantic-task reasoning route.

A live voice model may remain the conversational shell while a backend reasoning model handles a complex task.

## Jev fallback

Fallback is explicit and stage-specific.

- semantic/pre-turn: use configured baseline LLM classifier if available, otherwise wait/clarify;
- tool gating: fail safe; require approval or deny rather than execute;
- completion: respect step bound and return degraded/incomplete rather than loop.

Trace all fallback use.

## Privacy

Milestone 1 already enforces:

- no persisted raw audio by default;
- no API keys/auth headers in traces;
- redaction before trace persistence;
- configurable trace content mode.

~~~text
TRACE_CONTENT_MODE=full | redacted | metadata-only
~~~

Defaults:

~~~text
local:    full
deployed: redacted
~~~

## Inspector toggle

Inspector is runtime UI state, not a build-time flag.

~~~text
[ App ] [ Lab / Inspector ]
~~~

The same execution always records traces.

## Failure handling

- Jev timeout/unavailable -> explicit stage fallback;
- rate limit/overload -> SDK retry/backoff, then fallback;
- LLM timeout -> typed failure, bounded retry at most once;
- invalid tool proposal -> reject;
- voice disconnect -> preserve ledger/session state;
- barge-in -> cancel stale output and trace interruption;
- late transcript revision -> patch only still-revisable semantic state;
- max steps -> stop and return degraded/needs clarification.

## Evaluation

Implementation claims are measured against the LLM-first baseline and checked-in fixtures.

Read docs/19-first-demo-and-evaluation.md.

## Important cross-references

- TypeSafe concrete API: docs/17-typesafe-ai-reference.md
- runtime/approval/trace decisions: docs/18-runtime-contracts.md
- first demo + evals: docs/19-first-demo-and-evaluation.md
- UI: docs/20-ui-ux-design.md
- voice scheduler: docs/16-streaming-checkpoint-scheduler.md
