# Request lifecycle and harness integration

> **Status:** Normative architecture plus evaluated integration patterns  
> **Research snapshot:** 2026-09-25

This document answers a central project question:

> **Where does JEV run relative to the raw user request, model selection, the agent harness, tools, and post-turn state?**

## Target lifecycle

~~~text
RAW INPUT
   |
   v
INGRESS / NORMALIZATION
   |
   v
PRE-TURN JEV CONTROL PLANE
   |
   v
DETERMINISTIC POLICY
   |
   +-------------------+----------------------+
   |                   |                      |
   v                   v                      v
NO LLM            SELECT MODEL/AGENT      ASK/WAIT
   |                   |
   |                   v
   |              AGENT HARNESS
   |                   |
   |          +--------+--------+
   |          |                 |
   |          v                 v
   |      MODEL CALL         TOOL CALL
   |          |                 |
   |          |          JEV TOOL GUARD
   |          |                 |
   |          +--------+--------+
   |                   |
   v                   v
             POST-STEP / COMPLETION JEV
                       |
                       v
                STATE / MEMORY / RETRO
~~~

The essential property is that the application can inspect the **raw semantic request before committing to a reasoning model**.

## Stage 1 — ingress

Ingress may be:

- text;
- voice semantic checkpoint;
- tool result;
- approval response;
- UI action;
- follow-up message.

A canonical envelope can look like:

~~~ts
type RuntimeInput = {
  sessionId: string;
  source: "text" | "voice" | "ui" | "tool" | "approval";
  rawText?: string;
  utteranceId?: string;
  transcriptRevision?: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
};
~~~

No LLM is required here.

## Stage 2 — deterministic normalization

Before JEV, normal code can add facts that do not require semantic judgment:

- session/user IDs;
- timestamps;
- source type;
- available tool IDs;
- hard permission information;
- active workflow IDs;
- current state version;
- STT revision/finality metadata;
- explicit UI form values;
- request correlation IDs.

Do not ask JEV to rediscover facts the application already knows.

## Stage 3 — build the JEV semantic frame

The runtime builds a bounded state object.

Typical fields:

~~~ts
type SemanticFrame = {
  input: {
    text: string;
    source: "text" | "voice";
    isFinal?: boolean;
  };

  recentContext: {
    transcriptTail?: string;
    recentMessages?: string[];
  };

  activeState: {
    events: ActiveEvent[];
    workflow?: WorkflowState;
    unresolvedFields?: string[];
  };

  runtime: {
    availableTools: ToolSummary[];
    allowedModelClasses: string[];
    hardConstraints: string[];
  };

  evidence?: EvidenceRef[];
};
~~~

The objective is not to send the entire session every time.

Send the smallest state that contains the evidence required for the current decision.

## Stage 4 — select a question set

The application should **not ask an LLM to invent JEV questions on every request**.

Instead, maintain a deterministic question registry keyed by lifecycle stage/use case.

Examples:

~~~text
PRE_TURN
VOICE_SEMANTIC_UPDATE
TOOL_PROPOSAL
TOOL_RESULT
COMPLETION
MEMORY_CLASSIFICATION
API_JOURNEY_EDGE
~~~

Each stage has a versioned, testable set of JEV questions.

An LLM may be used upstream to generate candidates for an open-ended problem, but the questions JEV answers should still be explicit and bounded.

See docs/11-jev-request-modeling.md.

## Stage 5 — JEV

JEV evaluates supplied state against typed questions.

Examples:

- Is this a correction?
- Which active event does it modify?
- Does this need open-ended reasoning?
- Which allowed model class best fits?
- Is this tool proposal consistent with the user's intent?
- Is this result sufficient?
- Is the goal complete?
- Is this a reusable project constraint?

JEV returns signals, not side effects.

## Stage 6 — deterministic policy

Policy converts probabilities/choices into a runtime decision.

Example:

~~~ts
if (completeProbability < 0.55) {
  return { kind: "wait_or_clarify" };
}

if (riskScore >= policy.approvalThreshold) {
  return { kind: "approval_required" };
}

return { kind: "execute" };
~~~

Thresholds are calibrated per decision. Do not assume 0.5 is universally correct.

## Stage 7 — choose execution path

The runtime can:

- handle deterministically;
- continue collecting input;
- ask the user;
- select a model class;
- select an agent/workflow;
- make a bounded LLM call;
- initiate an approval state;
- reject/stop.

This is the point at which the reasoning harness becomes relevant.

# Harness strategy

The JEV control plane should be harness-neutral.

We evaluated several ways to gain the needed interception points.

## Option A — application-owned thin orchestrator

~~~text
app receives raw input
  -> JEV pre-turn
  -> policy
  -> invoke selected runtime/model
  -> intercept tools
  -> post-turn JEV
~~~

### Advantages

- complete control of raw input;
- easiest mental model;
- no framework lock-in;
- easiest to trace;
- works with any provider/harness.

### Cost

We own a small amount of orchestration code.

### Project position

**Preferred starting point.**

This is not an ambition to build a giant custom framework. It is a small control layer around existing SDKs.

## Option B — Microsoft Agent Framework

Microsoft Agent Framework has a layered middleware architecture.

For normal agents:

- **agent middleware** wraps the whole agent run;
- **chat middleware** wraps each model call;
- **function middleware** wraps tool/function invocation;
- context providers can add history/context/tools.

This makes it possible to run a JEV control decision around raw incoming messages before the model call.

Important nuance:

GitHubCopilotAgent and other specialized/remote agents still support agent-level middleware, but Microsoft documents that they do **not** expose the normal local chat-client middleware layer.

Implication:

~~~text
MAF agent middleware
    |
    +--> can inspect incoming request
    +--> can run JEV
    +--> can short-circuit / route at outer level

GitHubCopilotAgent internals
    |
    +--> remote/internal model loop remains more opaque
~~~

So MAF is useful as an outer control/workflow runtime, but it does not magically give us visibility into every internal GitHub Copilot model/tool step.

### Sources

- Microsoft Agent Framework middleware:
  https://learn.microsoft.com/en-us/agent-framework/journey/adding-middleware
- Agent pipeline architecture:
  https://learn.microsoft.com/en-us/agent-framework/agents/agent-pipeline

## Option C — GitHub Copilot SDK directly

The Copilot SDK exposes application-controlled session configuration such as:

- model;
- tools/available tools;
- system message;
- reasoning effort;
- MCP servers;
- session state.

The model is chosen when a session is created/resumed.

The documented SDK surface is a session API, not a generic middleware stack that gives us a pre-model callback inside the Copilot loop.

Therefore the useful pattern is:

~~~text
our app receives raw request
       |
       v
      JEV
       |
       v
select model/tools/session configuration
       |
       v
Copilot session.send(...)
~~~

If model routing must occur for each user request, keep the raw input **above** Copilot and select/reconfigure the session before sending.

Copilot can remain the execution harness without owning the JEV control plane.

### Sources

- Copilot SDK backend/session examples:
  https://github.com/github/copilot-sdk/blob/main/docs/setup/backend-services.md
- Session persistence/resume options:
  https://github.com/github/copilot-sdk/blob/main/docs/features/session-persistence.md

## Option D — LangChain / LangGraph agent middleware

LangChain exposes lifecycle hooks including:

- before_agent;
- before_model;
- wrap_model_call;
- after_model;
- wrap_tool_call;
- after_agent.

This is a natural place for:

- JEV pre-turn routing;
- dynamic model selection;
- tool gating;
- context management;
- completion checks.

LangChain itself published **Building a Harness with Jev** on 2026-09-17.

The project does not need LangChain simply because this integration is possible, but it is an excellent reference implementation of the pattern.

### Sources

- LangChain: Building a Harness with Jev:
  https://www.langchain.com/blog/building-a-harness-with-jev
- Agent middleware architecture/reference:
  https://github.com/langchain-ai/langchain/blob/master/openwiki/agent-execution.md

## Option E — Strands Agents

Strands has a first-class ModelRouter.

Its routing strategy receives context including:

- request messages;
- agent instructions;
- tool specifications;
- candidate models;
- invocation state;
- previous attempts.

That is a strong interception point for a JEV-backed model-routing strategy.

Strands also has an experimental BidiAgent supporting realtime/bidirectional providers including:

- OpenAI Realtime;
- Gemini Live;
- Amazon Nova Sonic.

This makes Strands interesting as a **harness experiment**, especially because one framework spans ordinary agents, model routing and realtime voice.

However, BidiAgent is explicitly experimental, so it should not become a hard dependency of the application core.

### Sources

- Model routing:
  https://strandsagents.com/docs/user-guide/concepts/model-providers/model-routing/
- Bidirectional streaming:
  https://strandsagents.com/docs/user-guide/sdk/bidirectional-streaming/
- BidiAgent:
  https://strandsagents.com/docs/user-guide/sdk/bidirectional-streaming/agent/

## Option F — Pi

Pi is especially interesting as a research/reference harness because its before_agent_start hook exposes a raw turn before model execution.

Community JEV integrations demonstrate patterns including:

- per-turn model routing;
- tool selection;
- context prefetch;
- tool result trimming;
- loop/failure checks;
- action guards.

One practical finding from a Pi JEV harness is that dynamically hiding tool schemas can hurt prompt caching when those schemas are part of the cached system prompt.

This is a useful reminder that "fewer tools every turn" is not automatically cheaper.

Pi is a pattern source; it does not need to be the production runtime.

### Sources

- pi-jev-harness:
  https://github.com/MoonTory/pi-jev-harness
- pi-jev:
  https://github.com/iefnaf/pi-jev
- DAIR tutorial:
  https://academy.dair.ai/resources/jev-decisions-in-a-pi-sdk-harness

# Recommended integration model

Keep a small application-owned JEV control plane with adapters into whichever harness is used.

Conceptually:

~~~ts
interface HarnessAdapter {
  run(request: HarnessRequest): AsyncIterable<HarnessEvent>;
  cancel(runId: string): Promise<void>;
}
~~~

The core application owns:

- semantic frame;
- JEV question registry;
- deterministic policy;
- session/application state;
- Tool Gateway;
- memory policy;
- trace model.

A selected harness owns some combination of:

- model invocation;
- tool-call loop;
- provider transport;
- context window mechanics;
- built-in agent features.

## Three interception layers

### Before agent/model

Use JEV for:

- intent;
- completeness;
- model class;
- required tools;
- context relevance;
- task complexity;
- whether an LLM is needed at all.

### During the loop

Use JEV selectively for:

- tool-call intent match;
- risk;
- repeated/failing approach;
- whether a tool result still matters;
- whether retry/replan is useful.

Do not insert a JEV call at every possible hook simply because one exists.

### After a step/turn/session

Use JEV for:

- completion;
- answer sufficiency;
- state extraction/classification;
- retrospective signal;
- memory candidate;
- next-action category.

## Key constraint

The harness must not become the owner of business truth.

State, permissions, approvals, policy, tool authorization and audit remain application-owned even if MAF, Copilot, LangChain, Strands or another runtime performs the reasoning loop.
