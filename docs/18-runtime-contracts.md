# Runtime contracts and ambiguity resolution

> **Status:** Normative / implementation-blocking decisions
> **Last updated:** 2026-09-25
> **Purpose:** Resolve the concrete ambiguities identified during external repo review so an AI coding agent can start implementation without inventing contracts.

## 1. First product demo is chosen

The first product demo is:

> **Live Intent Workspace — text-first mixed-intent decomposition with correction, then the same scenario over streaming voice.**

The first implementation does **not** begin with model routing as the primary demo.

Model routing is a supporting benchmark/control-plane feature.

### Demo scenario

Input is supplied incrementally:

~~~text
today I drank 200 ml Coke
ah no, I mean water
pick up my Australia Post parcel at 2pm
remind me to take my medicine
today is the happiest day of my life because my dream car arrived
but I'm sad about letting my old car go
~~~

Expected evolving state:

~~~text
hydration:
  200 ml Water

task:
  Pick up Australia Post parcel
  14:00

reminder:
  Take medicine
  missing time -> draft / needs clarification

journal:
  Dream car delivered
  happy + sad / mixed reflection
~~~

The demo proves:

- one input can contain multiple intents;
- provisional state appears before the whole input ends;
- a correction PATCHes an existing event rather than duplicating it;
- incomplete events remain draft;
- Jev decisions are visible in Inspector;
- a general-purpose LLM is skipped when bounded decisions are sufficient.

### Build progression

~~~text
A. typed whole text
B. typed incremental chunks / simulated transcript events
C. real Jev
D. real streaming STT
E. optional LLM route
F. governed tool
~~~

This order lets agents prove the semantic runtime before fighting microphone/provider issues.

## 2. Concrete identity / correlation model

Use these IDs:

~~~ts
type SessionId = string;
type TraceId = string;
type UtteranceId = string;
type SemanticEventId = string;
type ToolCallId = string;
type ApprovalId = string;
~~~

For the POC:

- **sessionId**: one user workspace/conversation;
- **traceId**: one semantic processing run, created before processing begins;
- **utteranceId**: one voice speech unit;
- **SemanticEventId**: stable event/card identity across PATCHes;
- **toolCallId**: one normalized tool proposal/execution;
- **approvalId**: one approval state machine.

Do not introduce both runId and traceId in the first implementation. traceId is the processing-run correlation ID.

A voice session can contain many utterances and many traceIds.

## 3. A semantic turn is single-pass until tools are introduced

Milestones 1-3:

> one semantic input/checkpoint -> one bounded control pass -> one result.

There is no open-ended autonomous loop.

Flow:

~~~text
input/checkpoint
  -> Jev preflight/semantic questions
  -> deterministic policy
  -> optional one LLM generation
  -> state mutation / response
  -> completion check
  -> stop
~~~

### Tool-loop behavior from Milestone 4 onward

When tool calling exists, allow a **bounded step loop**.

Defaults:

~~~text
maxSteps = 4
maxToolCalls = 3
~~~

One step may be:

~~~text
model result
  -> zero or one tool proposal
  -> gate / approval / execute
  -> normalized tool result
  -> completion check
~~~

Terminal conditions:

- goal_complete;
- needs_clarification;
- awaiting_approval;
- denied;
- unrecoverable_failure;
- max_steps_reached.

Do not implement an unbounded "keep thinking until done" loop.

## 4. Decision contracts

Remove the overly-generic Decision<T> abstraction from implementation code.

The real answer shape depends on question type.

Use:

~~~ts
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

type DecisionQuestion =
  | NoulDecisionQuestion
  | ChoiceDecisionQuestion
  | ScoreDecisionQuestion;

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

Policy helpers can create strongly-typed views for a specific question set.

Example:

~~~ts
type VoiceSemanticAnswers = {
  relation: ChoiceDecisionAnswer<
    "new_event" | "continuation" | "correction" | "cancel" | "aside" | "unclear"
  >;
  complete: NoulDecisionAnswer;
  stability: ScoreDecisionAnswer;
};
~~~

Never read Noul as confidence.

## 5. Semantic input contract

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

The orchestration layer builds the richer SemanticFrame by loading current state and registered capabilities.

## 6. Session state contract

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

The transcript is **not** the session state.

Voice transcript evidence lives in the Transcript Ledger / speech_events.

## 7. Trace creation and live Inspector flow

The previous API shape implied the client only learned traceId after the turn finished. That is wrong for live Inspector.

Use a two-step start/stream contract.

### Start a semantic run

~~~http
POST /api/sessions/:sessionId/runs
~~~

Request:

~~~json
{
  "source": "text",
  "text": "today I drank 200 ml Coke"
}
~~~

Response is returned **immediately** after durable trace creation:

~~~http
202 Accepted
~~~

~~~json
{
  "traceId": "tr_...",
  "status": "running"
}
~~~

The same server process schedules the run asynchronously after the trace record exists.

No external queue is needed.

### Subscribe

~~~http
GET /api/traces/:traceId/events
Accept: text/event-stream
~~~

The UI can subscribe immediately while processing continues.

### Final state

~~~http
GET /api/traces/:traceId
~~~

returns:

~~~json
{
  "traceId": "tr_...",
  "status": "completed",
  "result": {},
  "startedAt": 0,
  "completedAt": 0
}
~~~

## 8. Trace source of truth

There are not three independent trace systems.

Use:

~~~text
TraceRecorder
    |
    +--> SQLite trace_events   <-- durable source of truth for Inspector
    |
    +--> in-process TraceBus   <-- live fan-out to SSE subscribers
    |
    +--> OpenTelemetry         <-- operational export / spans
    |
    +--> stdout JSON           <-- developer convenience only
~~~

Rules:

- SQLite trace_events is the Inspector's replay/history source of truth.
- TraceBus publishes the same event after/beside persistence for live SSE.
- OpenTelemetry is a mirrored operational representation, not application state.
- stdout is never read by the app.

Use one application interface:

~~~ts
interface TraceRecorder {
  append(event: TraceEvent): Promise<void>;
  read(traceId: TraceId): Promise<TraceEvent[]>;
  subscribe(traceId: TraceId): AsyncIterable<TraceEvent>;
}
~~~

Do not create separate TraceSink and TraceStore concepts in core.

## 9. Trace event contract

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
    | "memory.classified"
    | "run.completed"
    | "run.failed";

  data: JsonValue;
};
~~~

sequence is monotonic within a trace.

## 10. Approval design

Approval only exists **after a concrete normalized tool proposal exists**.

Do not route to needs_approval before the application knows what action is being approved.

Flow:

~~~text
model / workflow proposes tool
        |
        v
normalize ToolProposal
        |
        v
schema + hard permission checks
        |
        v
Jev semantic/risk checks if needed
        |
        v
deterministic policy
        |
        +--> execute
        +--> deny
        +--> create Approval
~~~

### Approval record

~~~ts
type Approval = {
  id: ApprovalId;
  traceId: TraceId;
  sessionId: SessionId;
  toolCallId: ToolCallId;

  requestedByActorId: string;
  requiredApproverRole: "self" | "dad" | "mum";

  status: "pending" | "approved" | "rejected" | "cancelled";

  proposal: ToolProposal;

  createdAt: number;
  decidedAt?: number;
  decidedByActorId?: string;
};
~~~

### First tool-demo identity

Full authentication is deferred.

For local demos use a clearly-labelled **demo identity** from a fixed fixture/UI selector:

~~~text
user:local
dad
mum
kid
~~~

This is **not security**.

The first tool demo uses requiredApproverRole = self.

The family approval demo later uses:

~~~text
routine request -> dad
exception/high-impact -> mum
~~~

A deployed product must replace demo identity with real authentication before relying on roles.

### Resume

When approval is required:

- persist Approval;
- mark trace/run awaiting_approval;
- stop processing;
- POST decision later;
- resume from validated tool execution, not from the original model prompt.

Endpoint:

~~~http
POST /api/approvals/:approvalId/decision
~~~

~~~json
{
  "decision": "approved",
  "actorId": "user:local"
}
~~~

## 11. Tool proposal format

Prefer provider-native function/tool calling when supported.

Every adapter normalizes it into:

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

For a provider without native function calling, structured JSON may be used **inside that adapter only**.

Core never consumes arbitrary model prose as a tool call.

## 12. JEV unavailable fallback

Fallback is stage-specific.

### Semantic/pre-turn classification

If Jev is unavailable:

1. mark trace as degraded;
2. if baseline LLM classifier is configured, route the bounded state/question intent to the baseline adapter;
3. otherwise WAIT / ask clarification rather than inventing semantic state.

For Milestone 2, include a FakeDecisionEngine fallback only in dev/test, not production-like behavior.

### Consequential tool gating

**Fail safe, not open.**

If a required Jev semantic/risk check is unavailable:

- hard policy still applies;
- require human approval for a reversible action where that is acceptable;
- deny/stop for high-impact action if safe approval is insufficient.

Never execute a consequential action merely because Jev is down.

### Completion

If completion Jev fails:

- stop at max step bound;
- return a degraded/incomplete result or request clarification;
- do not loop indefinitely.

## 13. Memory write and read path

Memory is not write-only.

Initial persistence:

~~~text
memory_signals
  id
  scope
  kind
  key?
  summary
  structured_json
  evidence_refs
  session_id?
  created_at
  superseded_by?
~~~

### Read into a new semantic frame

Milestone 5 supports only deterministic retrieval:

- active session short-term signals;
- non-superseded long-term signals with matching explicit kind/key;
- a small recent set relevant to the active demo domain.

Do not add vector retrieval yet.

Example:

~~~text
active reminder policy
project constraint: "do not auto execute reminders without time"
stable preference explicitly keyed to current feature
~~~

The memory candidate extractor initially consumes **structured trace/state events**, not a mysterious hidden model.

An LLM summarizer can be added later for long prose episodes.

## 14. Package / tooling choices

Lock these choices so agents do not debate them during Milestone 1.

~~~text
package manager: pnpm workspaces
Node: 22+
language: TypeScript
web: React + Vite
server: Fastify
runtime validation: Zod
tests: Vitest
lint + format: Biome
database: built-in node:sqlite + plain SQL initially
telemetry: OpenTelemetry
live inspector stream: SSE
voice transport: WebSocket where server-mediated
~~~

Why node:sqlite for the first local build:

- no native npm addon build step;
- simpler Windows onboarding;
- sufficient for a one-process POC.

Do not add an ORM until queries make plain SQL painful.

## 15. First general-purpose LLM adapter

Milestone 3 reference implementation:

> **OpenAI Responses/official JS SDK behind the LanguageModel port.**

Reason:

- direct/simple reference implementation;
- native tool calling is available later;
- easy baseline for comparing Jev vs LLM-first decisions.

The exact model ID is configuration:

~~~text
LLM_PROVIDER=openai
LLM_MODEL=<configured model>
OPENAI_API_KEY=...
~~~

Do not encode a model name into domain code.

GitHub Copilot SDK, Microsoft Agent Framework, LangChain and Strands remain harness experiments described in research docs.

## 16. Inspector mode is a runtime UI toggle

Inspector is **not** a build-time feature flag.

The application always records the same trace events.

UI toolbar:

~~~text
[ App ] [ Lab / Inspector ]
~~~

Persist mode in localStorage.

Optional URL:

~~~text
?inspector=1
~~~

App mode hides internals.

Inspector mode renders the same underlying state/trace.

## 17. Privacy starts in Milestone 1

Do not wait until cloud deployment.

Rules:

- raw microphone audio is never persisted by default;
- secrets/API keys are never placed in TraceEvent data;
- known secret fields are redacted before trace persistence;
- provider authorization headers are never logged;
- trace events may contain user text locally because the product explicitly needs transcript inspection;
- deployed environments must have configurable content retention and redaction.

Configuration:

~~~text
TRACE_CONTENT_MODE=full | redacted | metadata-only
~~~

Default:

~~~text
local development: full
deployed: redacted
~~~

## 18. Success / failure semantics

Every run ends with a status:

~~~ts
type RunStatus =
  | "running"
  | "awaiting_approval"
  | "completed"
  | "needs_clarification"
  | "degraded"
  | "failed";
~~~

A completed status means the runtime reached its intended semantic result for that run. It does not necessarily mean every active event in the entire session is complete.

## 19. What is intentionally still a spike

These are **not** blocking implementation of Milestones 1-2:

- permanent agent harness;
- permanent STT provider;
- native realtime voice provider;
- CopilotKit/AG-UI;
- cloud host.

The contracts above are application-owned specifically so those choices can remain experiments.
