# Product intent

## What we are building

This POC explores a simple proposition:

> Put a fast typed decision layer between raw user/session/tool state and expensive or consequential agent behavior.

JEV is useful when software needs a structured decision with confidence rather than generated prose. The LLM remains available for open-ended reasoning and generation.

The system should make it easy to demonstrate decisions such as:

- what kind of request is this?
- does this need an LLM at all?
- which model tier should handle it?
- is the user's request complete enough to act on?
- is this tool call risky or approval-worthy?
- did the current step succeed?
- what information from a session is worth keeping?
- is a signal short-lived, retrospective, or long-term memory?
- should the system continue, ask, stop, retry, or escalate?

## First demo shape

A user interacts through a normal web UI, initially text-first.

A single request can produce a visible execution trace:

```
input
  -> normalize
  -> JEV decisions
  -> deterministic route
  -> optional LLM
  -> optional tool
  -> post-action JEV checks
  -> result
  -> memory/retro classification
```

The UI has two modes:

- **App mode** — normal user experience.
- **Inspector mode** — shows decisions, confidence, thresholds, model/tool calls, latency, token/cost metadata and state transitions.

## Why this architecture

The POC is not trying to replace an LLM with JEV. It is testing whether many small decisions around an agent can become faster, cheaper, inspectable and more deterministic when expressed as typed questions.

## Product principles

1. Outcome first.
2. Local first.
3. Deterministic before agentic.
4. JEV before LLM where the task is classification/decision.
5. LLM only where semantic reasoning or generation adds value.
6. Human approval before consequential side effects.
7. Everything important is traceable.
8. Cloud is a deployment concern, not an application architecture.
