# Research: harness/framework evaluation

> **Status:** Research/reference — not all items are selected architecture  
> **Snapshot date:** 2026-09-25  
> **Use:** Read before changing the harness choice or claiming a framework cannot expose the raw request.

## What we require from a harness

The project cares about **control points**, not only "can it run an agent?"

Required or valuable hooks:

1. raw user request before model selection;
2. ability to select model/model class per semantic task;
3. access to available tools before a model call;
4. tool-call interception/validation;
5. tool-result interception;
6. cancellation/interruption;
7. session state access;
8. traceability;
9. voice support or an easy way to place voice outside the harness.

## Summary matrix

| Option | Raw request before model | Per-model interception | Tool interception | Model routing | Realtime voice | Project fit |
|---|---|---|---|---|---|---|
| Thin app-owned orchestrator | Full | Whatever adapter exposes | Full via Tool Gateway | Full | Provider adapters | **Best starting control plane** |
| Microsoft Agent Framework standard Agent | Yes, agent middleware | Yes, chat middleware | Yes, function middleware | Supported/customizable | Voice kept external/optional | Strong enterprise runtime candidate |
| MAF GitHubCopilotAgent | Yes, outer agent middleware | No normal local chat-client middleware | Specialized/remote surface | Route outside/around it | Not our voice control plane | Useful wrapper, internals more opaque |
| GitHub Copilot SDK | App sees raw input before send | No generic documented middleware inside Copilot loop | Custom tools/events available | Configure model on create/resume; app routes before send | No first-class voice runtime | Good execution harness behind our control plane |
| LangChain/LangGraph | Yes via lifecycle middleware | Yes via before_model / wrap_model_call | Yes | Natural fit; published JEV example | Voice not the main reason to choose it | Strong reference/possible harness |
| Strands Agent | Request visible; router context is rich | Router/provider hooks | Tools integrated | First-class ModelRouter | Experimental BidiAgent | Very interesting experiment |
| Pi | Yes via before_agent_start | Hook/event system | Yes | Community JEV examples | Not production voice target | Excellent reference implementation |

## Microsoft Agent Framework

### Current documented pipeline

For a standard Agent, Microsoft Agent Framework provides:

- agent middleware around the whole run;
- context/history providers;
- chat middleware around model calls;
- function middleware around tool execution;
- OpenTelemetry instrumentation.

This gives us several legitimate JEV interception points.

### Raw request

~~~text
agent.run(messages)
    |
    v
Agent Middleware   <-- raw input can be inspected/changed here
    |
    v
Context / history
    |
    v
Chat Middleware    <-- per-model-call checks for normal Agent
    |
    v
Model
~~~

### GitHubCopilotAgent nuance

Microsoft documents specialized agents such as GitHubCopilotAgent as still supporting agent-level middleware, but not the normal local chat-client middleware layer.

Therefore:

- raw run input can be observed at the outer layer;
- the inner Copilot model/tool loop is not equivalent to a standard local Agent pipeline;
- JEV should route/control around GitHubCopilotAgent rather than assuming full internal interception.

### Why it remains interesting

- controlled enterprise runtime;
- workflows;
- human-in-the-loop;
- middleware;
- context providers;
- telemetry;
- model-provider abstraction for normal agents.

### Why it is not mandatory for the POC

The experiment should survive changing harnesses.

Semantic state, JEV question sets, policy, tool authorization and traces should not become MAF-specific.

### Sources

- https://learn.microsoft.com/en-us/agent-framework/journey/adding-middleware
- https://learn.microsoft.com/en-us/agent-framework/agents/agent-pipeline
- https://learn.microsoft.com/agent-framework

## GitHub Copilot SDK

### Useful surface

Current Copilot SDK documentation exposes session configuration including:

- model;
- reasoning effort;
- custom/available tools;
- system message;
- MCP servers;
- custom agents;
- session ID/state.

A resumed session can be reconfigured, including changing the model.

### Control-plane implication

The model/session is configured before the application sends the user prompt.

So the natural pattern is:

~~~text
our app receives raw request
       |
       v
      JEV
       |
       v
select/reconfigure Copilot session
       |
       v
session.send(...)
~~~

If per-request model routing matters, keep the raw request **above** Copilot.

### Tool implication

Copilot custom-tool handlers should route consequential actions through our Tool Gateway instead of directly executing privileged mutations.

### Sources

- https://github.com/github/copilot-sdk/blob/main/docs/setup/backend-services.md
- https://github.com/github/copilot-sdk/blob/main/docs/features/session-persistence.md
- https://github.com/github/copilot-sdk

## LangChain / LangGraph

### Why it maps naturally

Current LangChain agent middleware exposes lifecycle hooks such as:

- before_agent;
- before_model;
- wrap_model_call;
- after_model;
- wrap_tool_call;
- after_agent.

That maps well to:

- JEV pre-turn routing;
- model selection;
- tool gating;
- context relevance;
- loop/completion checks.

LangChain also published **Building a Harness with Jev** on 2026-09-17.

### Project interpretation

This validates the pattern, but does not require us to adopt LangChain.

Our DecisionEngine, policy, state and Tool Gateway should remain application-owned.

### Sources

- https://www.langchain.com/blog/building-a-harness-with-jev
- https://github.com/langchain-ai/langchain/blob/master/openwiki/agent-execution.md
- https://github.com/langchain-ai/langchain/blob/master/openwiki/architecture.md

## Strands Agents

### Model routing

Strands ModelRouter supports request-aware routing.

The documented routing context includes:

- request messages;
- agent instructions;
- tool specifications;
- candidate models;
- invocation state;
- previous attempts.

This is an excellent fit for a custom JEV routing strategy.

~~~text
RoutingContext
    |
    v
bounded JEV state
    |
    v
JEV choice/score
    |
    v
RoutingCandidate
~~~

### Voice

Strands experimental BidiAgent currently supports realtime/bidirectional models including:

- OpenAI Realtime;
- Gemini Live;
- Amazon Nova Sonic.

The BidiAgent docs also describe:

- persistent bidirectional sessions;
- interruption;
- streaming events;
- concurrent tool execution;
- session persistence;
- OpenTelemetry support.

### Caveat

The bidirectional feature is explicitly experimental.

Use it as a harness/adapter experiment, not as a core domain dependency.

### Sources

- https://strandsagents.com/docs/user-guide/concepts/model-providers/model-routing/
- https://strandsagents.com/docs/user-guide/sdk/bidirectional-streaming/
- https://strandsagents.com/docs/user-guide/sdk/bidirectional-streaming/agent/
- https://strandsagents.com/docs/user-guide/sdk/bidirectional-streaming/observability/

## Pi

Pi is particularly useful as a research pattern because before_agent_start exposes a pre-model turn.

Community JEV integrations demonstrate:

- request difficulty/model routing;
- semantic tool activation;
- context prefetch;
- compaction/relevance decisions;
- loop/failure checks;
- action guards.

### Prompt-cache lesson

One Pi JEV harness notes that dynamically hiding tool schemas may save little and can reduce prompt-cache reuse when tool definitions live in the cached system prompt.

That means "JEV selects fewer tools" must be benchmarked rather than assumed to be cheaper.

### Sources

- https://github.com/MoonTory/pi-jev-harness
- https://github.com/iefnaf/pi-jev
- https://pi.dev/packages/pi-jev
- https://academy.dair.ai/resources/jev-decisions-in-a-pi-sdk-harness

## Current working decision

1. Build the application-owned semantic/JEV/policy layer first.
2. Implement the thinnest harness adapter needed for the first demo.
3. Delegate model-loop machinery to an existing SDK/framework where useful.
4. Do not let framework-specific types escape into core.
5. Keep alternatives documented and testable.
6. Record a later ADR only after a vertical slice shows one runtime is the better long-term choice.
