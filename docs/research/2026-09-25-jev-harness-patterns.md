# Research: JEV harness patterns

> **Status:** Research/reference  
> **Snapshot date:** 2026-09-25

This file preserves useful patterns found in current JEV integrations so future agents do not rediscover them from scratch.

## External pattern: LangChain JEV harness

LangChain's 2026-09-17 article frames the agent loop as a set of frequent decisions that are expensive when each one requires a full LLM call.

Reference:

https://www.langchain.com/blog/building-a-harness-with-jev

Project takeaway:

JEV is valuable where the output is a **decision**, not prose.

Candidate control points:

- choose model;
- choose/limit tools;
- evaluate tool call;
- evaluate tool result;
- decide retry/replan;
- decide whether answer is complete.

## External pattern: Pi pre-turn routing

Reference:

https://github.com/MoonTory/pi-jev-harness

The implementation uses a pre-agent hook and demonstrates:

- turn routing;
- context prefetch;
- tool-set decisions;
- result trimming;
- loop/failure checks.

### Context prefetch pattern

A vague prompt can be used to retrieve candidate context, then JEV ranks bounded candidates before injecting a small number of windows.

Project implication:

~~~text
deterministic/cheap search
      |
      v
candidate snippets
      |
      v
JEV relevance decision
      |
      v
bounded context injection
~~~

Do not ask a frontier model to read every candidate simply to decide what it should read.

## External pattern: per-turn model routing

Reference:

https://github.com/iefnaf/pi-jev

The project uses JEV for:

- request difficulty;
- model routing;
- selective context compaction.

Project implication:

Model routing should use abstract **model classes/capabilities** in our core rather than hard-coded provider names.

Example:

~~~text
fast
reasoning
code_reasoning
long_context
~~~

Deployment config maps those to actual models.

## External pattern: semantic tool activation

Reference:

https://pi.dev/packages/pi-jev

A JEV-backed tool router can activate tools relevant to the prompt.

Project caveat:

Tool routing is useful when the catalog is large, but removing tools per turn is not always an optimization.

If tools are part of a provider/harness prompt cache, changing the tool list can invalidate cache reuse.

Therefore evaluate:

- token savings;
- cache behavior;
- model tool-selection quality;
- latency;
- false negatives that hide a needed tool.

## External pattern: action/safety checks

JEV community projects increasingly use typed judgments around:

- tool risk;
- prompt injection;
- secret leakage;
- action approval.

This is a useful pattern, but JEV is not a replacement for:

- authentication;
- authorization;
- allowlists;
- schema validation;
- hard policy;
- sandboxing.

Semantic judgment is an additional signal.

## Our extended pattern

The project goes beyond simple model routing/tool gating.

We want a common JEV control plane for:

~~~text
PRE-TURN
  request type
  completeness
  model class
  context relevance

STREAMING SEMANTICS
  new vs continuation vs correction
  target event
  commit/wait

TOOLS
  intent match
  risk
  approval
  result sufficiency

LOOP
  retry
  replan
  repeated failed approach

POST-TURN
  completion
  memory/retro signal
  next-action category
~~~

## Research questions to validate experimentally

### 1. How many JEV calls are useful per turn?

Too few:
- miss cheap control opportunities.

Too many:
- latency accumulates;
- complexity increases;
- semantic checks become noise.

Measure rather than assume.

### 2. Batch or separate?

Batch independent questions against the same state.

Separate dependent decisions when the answer to one changes the state/candidate set for the next.

### 3. Tool list trimming vs prompt cache

Run an experiment.

Compare:

- static full tool catalog;
- JEV-filtered catalog;
- provider-native deferred/tool-search approach.

Metrics:

- prompt tokens;
- cache hits;
- tool selection accuracy;
- end-to-end latency.

### 4. When should JEV replace a deterministic rule?

Usually it should not.

If a rule can be expressed accurately and cheaply in code, keep it in code.

Use JEV when semantic interpretation is the hard part.

### 5. When should an LLM precede JEV?

Only when the candidate set itself is open-ended.

Examples:

- deriving candidate API operations from large docs;
- synthesizing candidate plans;
- generating candidate explanations.

Then JEV evaluates bounded choices.

## Research source index

- LangChain JEV harness:
  https://www.langchain.com/blog/building-a-harness-with-jev
- Pi JEV harness:
  https://github.com/MoonTory/pi-jev-harness
- Pi model routing/compaction:
  https://github.com/iefnaf/pi-jev
- Pi package:
  https://pi.dev/packages/pi-jev
- DAIR custom harness tutorial:
  https://academy.dair.ai/resources/jev-decisions-in-a-pi-sdk-harness
- TypeSafe/JEV community tools index:
  https://www.typesafeai.org/tools
