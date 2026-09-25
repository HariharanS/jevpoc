# JEV decision model

> **Status:** Normative conceptual model
> **Concrete API/types:** docs/17-typesafe-ai-reference.md and docs/18-runtime-contracts.md

## Principle

JEV returns typed probabilistic signals.

Code makes application decisions.

Do not let one probability directly cause a consequential side effect without deterministic policy.

## The three answer shapes

Use TypeSafe's real primitives rather than one generic Decision<T> abstraction.

### Noul

Yes/no probability.

~~~ts
{
  type: "noul",
  noul: 0.91
}
~~~

Use noul as P(true).

Examples:

- is this complete enough?
- does this tool match user intent?
- is goal complete?

### Choice

One selection from a closed set plus full distribution/confidence.

~~~ts
{
  type: "choice",
  choice: "correction",
  probabilities: {
    new_event: 0.02,
    continuation: 0.04,
    correction: 0.92,
    aside: 0.02
  },
  confidence: 0.88
}
~~~

Examples:

- semantic relation;
- target active event;
- model class;
- memory scope.

### Score

Ordered rubric evaluation.

~~~ts
{
  type: "score",
  score: 2,
  legend: {
    "0": "read-only",
    "1": "low-impact reversible",
    "2": "meaningful external effect",
    "3": "high-impact"
  },
  probabilities: {},
  confidence: 0.84
}
~~~

Examples:

- contextual risk;
- interpretation stability;
- urgency/severity.

## Initial question families

A single Jev request should batch **independent** questions over the same state when practical.

### Pre-turn / request understanding

- needs_reasoning — Noul
- task_class — Choice
- model_class — Choice when an LLM path is allowed
- input_complete — Noul or task-class wait option

### Streaming semantic update

- semantic_relation — Choice:
  - new_event
  - continuation
  - correction
  - cancel
  - aside
  - unclear
- target_event — Choice from actual active event IDs + none
- actionable_complete — Noul
- interpretation_stability — Score or bounded Choice
- needs_reasoning — Noul

### Tool/action control

- tool_call_matches_user_intent — Noul
- contextual_action_risk — Score
- semantic_approval_signal — Noul where useful
- result_satisfies_subgoal — Noul

Hard auth, role checks, amount limits, schema validation and idempotency remain deterministic code.

### Bounded loop control

Only after tools exist:

- step_succeeded — Noul
- goal_complete — Noul
- retry_likely_to_help — Noul
- next_control_action — Choice:
  - continue
  - retry
  - replan
  - clarify
  - stop

These questions do not imply an unbounded autonomous loop.

The runtime limits are defined in docs/18-runtime-contracts.md.

### Session / memory

- memory_scope — Choice:
  - ephemeral
  - short_term
  - retrospective
  - long_term
  - discard
- accepted_decision — Noul
- stable_constraint — Noul
- evidence_sufficient — Noul
- duplicate_or_conflict — Choice where candidates are known

## Question registry

Routine questions are application-owned/versioned.

Examples:

~~~text
pre_turn_v1
voice_semantic_update_v1
tool_proposal_v1
completion_v1
memory_v1
~~~

Do not ask an LLM to invent these question sets on every request.

When wording or criteria change materially:

1. bump version;
2. rerun tests/evals;
3. inspect changed errors;
4. recalibrate policy if needed.

## Example routing policy

The following illustrates **policy consuming real typed answers**. The numeric thresholds are examples only.

~~~ts
type PreTurnAnswers = {
  needsReasoning: NoulDecisionAnswer;
  taskClass: ChoiceDecisionAnswer<
    "deterministic_action" |
    "simple_language" |
    "reasoning" |
    "wait_for_more_input"
  >;
  modelClass: ChoiceDecisionAnswer<"fast" | "reasoning">;
};

function chooseRoute(a: PreTurnAnswers): Route {
  if (a.taskClass.choice === "wait_for_more_input") {
    return { kind: "wait" };
  }

  if (
    a.taskClass.choice === "deterministic_action" &&
    a.needsReasoning.noul < 0.35
  ) {
    return { kind: "deterministic" };
  }

  return {
    kind: "llm",
    modelClass: a.modelClass.choice,
  };
}
~~~

There is no generic intentConfidence field unless a specific Choice answer actually supplies it.

## Independent vs dependent questions

Questions in one Jev request are evaluated independently against the same state.

Good batch:

~~~text
same state:
  relation?
  target_event?
  complete?
  needs_reasoning?
~~~

If Question B truly requires the **answer of Question A to change its state/candidates**, make a second request after code updates state.

Do not pretend question order creates a procedural chain inside one Jev request.

## Calibration

For every important question family:

1. create reviewed JSONL fixtures;
2. pin Jev model version for benchmark runs;
3. record raw answers/distributions;
4. apply policy thresholds;
5. evaluate the **business outcome**;
6. tune only after inspecting false positives/false negatives;
7. version threshold/question changes.

Do not use one universal 0.5 rule.

See:
- docs/19-first-demo-and-evaluation.md
- tests/evals/

## Confidence behavior

Choice and Score expose confidence.

Noul does not; the noul value itself is P(true).

Use low certainty deliberately:

- wait for more input;
- ask clarification;
- route to LLM;
- preserve current interpretation via hysteresis;
- require approval;
- fail safe.

Do not add confidence thresholds everywhere just because the field exists.

## Where Jev should not be used

Do not use Jev to:

- generate user-facing prose;
- perform long-form/open-ended reasoning;
- invent arbitrary plans;
- execute tools;
- hold hidden workflow state;
- replace schema validation;
- replace authentication/authorization;
- enforce exact numeric policy code can evaluate;
- make irreversible business decisions by probability alone.

## First demo

The first implemented demo is no longer open.

Build:

> **Live Intent Workspace — mixed-intent semantic state + correction, text first and then streaming voice.**

The key proof:

~~~text
"I drank 200 ml Coke"
        -> CREATE hydration draft

"no, I mean water"
        -> Jev: correction + target event
        -> deterministic PATCH same event
~~~

Other concepts remain reference/future demos:

- session retrospective/memory;
- API Journey Compiler;
- family approval workflow;
- model router.

## TypeSafe reference

Before implementing or changing this design, read:

- docs/17-typesafe-ai-reference.md
- docs/11-jev-request-modeling.md
- official TypeSafe agent skill
- tests/evals/
