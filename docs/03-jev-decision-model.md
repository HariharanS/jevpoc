# JEV decision model

## Principle

JEV returns signals. Code makes decisions.

Do not let a probability directly cause a side effect without a deterministic policy layer.

## Initial question families

A single JEV request should batch independent questions over the same state when practical.

### Request understanding

- `intent`
- `is_complete`
- `needs_reasoning`
- `urgency`
- `ambiguity`

### Model routing

- `complexity`
- `needs_long_context`
- `needs_code_reasoning`
- `needs_external_facts`

Application policy maps these to an allowed model class.

### Tool/action control

- `action_risk`
- `needs_human_approval`
- `tool_call_matches_user_intent`
- `contains_sensitive_side_effect`

### Loop control

- `step_succeeded`
- `goal_complete`
- `retry_likely_to_help`
- `needs_replan`

### Session and memory classification

- `signal_value`
- `scope`: ephemeral | short_term | retrospective | long_term | discard
- `is_user_preference`
- `is_task_fact`
- `is_reusable_learning`

## Example policy

```ts
function chooseRoute(d: PreflightDecisions): Route {
  if (d.isComplete < 0.55) {
    return {
      kind: "needs_clarification",
      reason: "request lacks required information"
    };
  }

  if (d.needsReasoning < 0.35 && d.intentConfidence >= 0.85) {
    return {
      kind: "deterministic",
      handler: mapIntentToHandler(d.intent)
    };
  }

  return {
    kind: "llm",
    modelClass: d.complexity >= 0.7 ? "reasoning" : "fast"
  };
}
```

Thresholds above are examples, not calibrated production values.

## Calibration

For every important classifier:

1. collect labelled examples,
2. record JEV outputs,
3. evaluate threshold behavior,
4. choose thresholds based on false-positive/false-negative cost,
5. version the threshold change.

Do not use a universal `0.5` rule.

## Confidence behavior

Low confidence should have an explicit meaning.

Possible policies:

- ask the user,
- use the LLM,
- require approval,
- choose a safe deterministic fallback,
- stop.

## Where JEV should not be used

Do not use JEV to:

- generate user-facing prose,
- perform long-form reasoning,
- invent a plan,
- execute tools,
- hold hidden workflow state,
- replace normal validation,
- replace authentication/authorization,
- make irreversible business decisions without deterministic controls.

## Candidate demos

The same harness should support multiple small demos without architecture changes:

1. **mixed voice/text utterance decomposition** — identify reminders, facts, corrections, emotion/noise and completion;
2. **agent-session retrospective** — classify trace signals into retro, short-term or long-term memory;
3. **API journey planner** — LLM proposes an API/state-machine plan while JEV classifies states, required checks and completion conditions;
4. **family approval flow** — policy + JEV decide whether an action is auto-allowed, delegated or escalated;
5. **model router** — classify request complexity before selecting an LLM tier.

Only implement one thin vertical slice first.
