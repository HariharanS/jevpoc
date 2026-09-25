# JEV request modeling

> **Status:** Normative JEV integration design  
> **Research snapshot:** 2026-09-25

This document answers:

> How do we turn a raw request into a useful JEV call without putting another LLM in front of JEV?

## JEV's role

JEV is a decision model.

The useful contract is conceptually:

~~~text
{ state, model, questions }
      |
      v
{ answers }
~~~

Questions are typed:

- **Noul** — yes/no-like probability;
- **Choice** — select among explicit candidates and return probabilities/confidence;
- **Score** — evaluate against an ordered scale/criteria.

JEV does not need to generate prose.

## Design rule

> **Do not use an LLM to decide what questions to ask JEV for routine runtime decisions.**

If we need an LLM to interpret the request before every JEV call, we lose much of JEV's value as a fast/low-cost System One decision layer. The actual latency/cost benefit must still be measured against the checked-in LLM-first baseline; see docs/19.

Instead:

1. application code identifies the runtime stage;
2. application code builds a bounded semantic frame;
3. application code selects a versioned question template;
4. JEV evaluates it;
5. application policy interprets the answer.

## The semantic frame

A JEV request should carry relevant **world state**, not merely the last user sentence.

Recommended shape:

~~~ts
type JevState = {
  request: {
    text: string;
    source: "text" | "voice" | "tool" | "ui";
  };

  recent?: {
    transcriptTail?: string;
    previousUserMessage?: string;
    previousAssistantMessage?: string;
  };

  activeEvents?: Array<{
    id: string;
    domain: string;
    status: "draft" | "soft_committed" | "sealed";
    fields: Record<string, unknown>;
  }>;

  runtime?: {
    stage:
      | "pre_turn"
      | "semantic_update"
      | "tool_proposal"
      | "tool_result"
      | "completion"
      | "memory";
    availableTools?: Array<{ id: string; description: string }>;
    allowedModelClasses?: string[];
    hardConstraints?: string[];
  };

  evidence?: Array<{
    id: string;
    type: string;
    summary: string;
  }>;
};
~~~

Not every call needs every field.

## What should remain deterministic before JEV?

Anything the system already knows exactly:

- timestamps;
- user/session identity;
- permission roles;
- tool registry;
- hard policy limits;
- UI field values;
- workflow state;
- STT event type;
- transcript revision number;
- active event IDs;
- API schema facts already parsed by a validator;
- exact numeric values extracted by a deterministic parser when reliable.

Do not ask JEV "is this user Dad?" when authenticated session state already says it is Dad.

## Question registry

Questions should be versioned application artifacts.

Example:

~~~ts
const questionSets = {
  pre_turn_v1: { /* ... */ },
  voice_semantic_update_v1: { /* ... */ },
  tool_proposal_v1: { /* ... */ },
  completion_v1: { /* ... */ },
  memory_v1: { /* ... */ },
};
~~~

This gives us:

- reproducibility;
- evals;
- calibration;
- prompt/change review;
- stable telemetry.

## Pre-turn question set

Purpose: decide whether/how to invoke a reasoning agent.

### Needs open-ended reasoning — Noul

~~~json
{
  "needs_reasoning": {
    "type": "noul",
    "instructions": "Does satisfying this request require open-ended reasoning or generation rather than a deterministic application handler?"
  }
}
~~~

### Task class — Choice

~~~json
{
  "task_class": {
    "type": "choice",
    "instructions": "Classify the primary work needed for this request.",
    "criteria": {
      "deterministic_action": "Known application action with sufficient structured information.",
      "simple_language": "Language transformation or explanation that does not need deep reasoning.",
      "reasoning": "Multi-step reasoning, planning, synthesis, or ambiguous problem solving.",
      "wait_for_more_input": "The user is still forming or correcting the request."
    }
  }
}
~~~

### Model class — Choice

Only ask this if an LLM path is allowed.

~~~json
{
  "model_class": {
    "type": "choice",
    "instructions": "Which allowed model class is sufficient for the semantic task?",
    "criteria": {
      "fast": "Straightforward language/reasoning with low ambiguity.",
      "reasoning": "Complex, multi-step, high ambiguity, code/architecture or higher-cost-of-error reasoning."
    }
  }
}
~~~

Application code maps these abstract classes to a configured provider/model.

JEV should not need provider credentials or deployment details.

## Voice semantic-update question set

Input:

~~~text
new text
+ rolling transcript tail
+ active structured events
+ transcript/STT metadata
~~~

Useful questions:

### Relationship to active state — Choice

~~~json
{
  "semantic_relation": {
    "type": "choice",
    "instructions": "How does the newest speech relate to the current active structured events?",
    "criteria": {
      "new_event": "Starts a distinct intent/event.",
      "continuation": "Adds information to the current event.",
      "correction": "Changes a previously interpreted field or event.",
      "cancel": "Withdraws a current event/action.",
      "aside": "Not useful application state.",
      "unclear": "Insufficient evidence yet."
    }
  }
}
~~~

### Target event — Choice

Populate criteria from the **actual active event IDs**.

~~~json
{
  "target_event": {
    "type": "choice",
    "instructions": "If the newest speech continues, corrects, or cancels an existing event, which event is affected?",
    "criteria": {
      "evt_hydration_1": "Hydration entry: 200 ml Coke",
      "evt_parcel_1": "Parcel pickup at 2pm",
      "none": "No existing event is the target"
    }
  }
}
~~~

### Complete enough — Noul

~~~json
{
  "actionable_complete": {
    "type": "noul",
    "instructions": "Is there enough stable information to create or update a structured event without guessing a required field?"
  }
}
~~~

### Commit or wait — Choice

~~~json
{
  "commit_state": {
    "type": "choice",
    "instructions": "Given the evidence so far, how stable is this interpretation?",
    "criteria": {
      "draft": "Useful provisional interpretation but likely to change.",
      "soft_commit": "Stable enough to materialize as pending state but still within a correction horizon.",
      "seal": "Stable enough to persist as final semantic state, subject to normal action policy.",
      "wait": "Do not materialize yet; more speech is needed."
    }
  }
}
~~~

Code owns CREATE/PATCH/MERGE/SEAL semantics.

## Tool-proposal question set

A tool proposal should include:

- user goal;
- relevant active task;
- tool name/description;
- proposed arguments;
- current permissions;
- prior tool results if relevant.

Questions:

### Intent match — Noul

"Does this proposed tool call directly support the user's current requested outcome?"

### Risk — Score

Example criteria:

~~~text
0 = read-only/no external effect
1 = reversible local mutation
2 = meaningful external/reversible effect
3 = financial/account/publication/permission/high-impact effect
~~~

### Approval — Noul

"Given the action and current state, should explicit user/human approval be required before execution?"

The application still has hard rules that can force approval regardless of JEV.

## Tool-result / loop question set

JEV can cheaply judge whether the loop should continue.

Examples:

- Did the tool result satisfy the requested subgoal?
- Is retry likely to help?
- Is this essentially the same failed approach as before?
- Does the result contain information still relevant to the active plan?
- Is replanning needed?

This is a useful place for JEV because a full frontier-model call merely to answer "did that work?" can be expensive.

## Completion question set

Inputs:

- user goal;
- current plan/state;
- tool results;
- proposed answer.

Questions:

- Is the user's requested outcome complete?
- Is required evidence missing?
- Is there an unresolved action?
- Would returning now misrepresent success?

Policy decides STOP / CONTINUE / ASK / ESCALATE.

## Memory/retro question set

Operate on a bounded episode/window rather than automatically the whole transcript.

### Signal type — Choice

~~~json
{
  "memory_scope": {
    "type": "choice",
    "instructions": "How useful is this signal beyond the current moment?",
    "criteria": {
      "ephemeral": "Useful only for the immediate interaction.",
      "short_term": "Useful for the current task/session.",
      "retrospective": "Useful when analysing what happened or improving the process.",
      "long_term": "Potentially reusable in future sessions/projects.",
      "discard": "No useful persistence value."
    }
  }
}
~~~

Additional independent questions:

- Is this a user correction?
- Is this a stable project constraint?
- Is this an accepted decision rather than a proposal?
- Is this a repeated failed approach?
- Is this duplicate/contradictory with existing memory?
- Is evidence sufficient to persist it?

Code owns the actual memory write.

## Independent vs dependent questions

JEV questions in one request share the same state and should be treated as independent evaluations.

If Question B depends on the **answer to Question A**, make another call with the result added to state.

Example:

1. Choice: which active event is targeted?
2. Then, with that target event explicitly included, ask whether field X is being corrected.

Do not encode a hidden dependency and assume the model executes the questions procedurally.

## When an LLM *is* appropriate before JEV

There are valid cases.

### Open-ended candidate generation

Example: API Journey Compiler.

The LLM reads a large Stripe/OpenAPI/documentation corpus and proposes candidates:

- likely API operation;
- possible provider objects;
- possible state transitions;
- candidate failure strategies.

Then JEV chooses/evaluates among bounded candidates.

~~~text
docs + business intent
       |
       v
LLM candidate generation
       |
       v
JEV bounded decisions
       |
       v
deterministic schema/evidence validator
~~~

### Text generation

JEV should not write the final explanation, email, UI prose or code.

### Complex synthesis

If the answer itself is open-ended, route to an LLM.

## When an LLM should *not* be used before JEV

Do not add an LLM merely to:

- classify intent;
- decide if input is complete;
- pick among known model classes;
- choose among known active events;
- score action risk;
- judge whether a step succeeded;
- classify memory scope.

Those are exactly the kind of bounded decisions JEV is intended to make.

## Hysteresis and anti-flapping

For streaming input, never let a single low-margin classification flip the UI/state repeatedly.

Possible policy:

- challenger interpretation must exceed current interpretation by a margin;
- or win on two consecutive semantic checkpoints;
- explicit user corrections bypass ordinary hysteresis;
- sealed actions are never silently rewritten.

Example:

~~~ts
if (candidate.id !== current.id) {
  const strongEnough =
    candidate.confidence >= 0.9 ||
    candidate.marginOverCurrent >= 0.2 ||
    candidate.consecutiveWins >= 2;

  if (!strongEnough) keepCurrent();
}
~~~

Exact thresholds require evals.

## Calibration and evals

Every important question family should have a checked-in dataset.

Example:

~~~text
tests/evals/
  pre-turn-routing.jsonl
  voice-semantic-update.jsonl
  scenarios.jsonl
  tool-gating.jsonl
  memory-scope.jsonl
~~~

For each example retain:

- state fixture;
- question-set version;
- expected business outcome;
- raw JEV answer;
- threshold/policy result.

We care about **decision quality at the policy boundary**, not merely whether the top JEV label matched a human label.

## Full request example

Illustrative voice semantic checkpoint:

~~~json
{
  "model": "jev-1.13.0",
  "state": {
    "request": {
      "text": "ah no, I mean water",
      "source": "voice"
    },
    "recent": {
      "transcriptTail": "today I drank 200 ml Coke ... ah no, I mean water"
    },
    "activeEvents": [
      {
        "id": "evt_hydration_1",
        "domain": "hydration",
        "status": "draft",
        "fields": {
          "quantityMl": 200,
          "drink": "Coke"
        }
      }
    ],
    "runtime": {
      "stage": "semantic_update"
    }
  },
  "questions": {
    "semantic_relation": {
      "type": "choice",
      "instructions": "How does the newest speech relate to the active structured event?",
      "criteria": {
        "new_event": "Starts a distinct event.",
        "continuation": "Adds information without replacing prior meaning.",
        "correction": "Intentionally replaces or changes previously interpreted meaning.",
        "aside": "Does not belong in structured application state."
      }
    },
    "target_event": {
      "type": "choice",
      "instructions": "Which active event is affected?",
      "criteria": {
        "evt_hydration_1": "Hydration event currently recorded as 200 ml Coke.",
        "none": "No active event is affected."
      }
    },
    "commit_state": {
      "type": "choice",
      "instructions": "How stable is the updated interpretation?",
      "criteria": {
        "draft": "Still tentative.",
        "soft_commit": "Stable pending a short correction horizon.",
        "seal": "Stable enough to persist.",
        "wait": "Need more input."
      }
    }
  }
}
~~~

Expected application behavior is not hard-coded from this example response.

The runtime reads JEV answers, applies calibrated policy, and patches evt_hydration_1 rather than creating an unrelated second event.

## Concrete TypeSafe reference

The implementation contract is now centralized in docs/17-typesafe-ai-reference.md.

Official sources:

- Introduction:
  https://docs.typesafe.ai/introduction
- API:
  https://docs.typesafe.ai/api
- JavaScript SDK:
  https://docs.typesafe.ai/sdk/javascript
- Primitives:
  https://docs.typesafe.ai/primitives
- Agent skill:
  https://docs.typesafe.ai/agent-skill

Implementation rules:

- use the official @typesafe-ai/sdk inside TypeSafeDecisionEngine;
- authenticate with TYPESAFE_API_KEY;
- use top-level state, model and questions;
- preserve Noul / Choice / Score answer shapes;
- pin a model version for benchmark runs;
- batch independent questions over the same state;
- version application question sets;
- keep TypeSafe SDK types inside the adapter.

For agent/harness context also see:
https://www.langchain.com/blog/building-a-harness-with-jev
