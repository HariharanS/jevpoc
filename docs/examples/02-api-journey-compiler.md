# Example: API Journey Compiler

> **Status:** Reference concept / future demo  
> **Domain:** Payments/API integration

## User problem

A developer/product owner has an API specification and a business outcome, but needs to derive the actual integration journey.

Example request:

> "Use Stripe for physical goods. Authorize at checkout, capture only after stock is confirmed, support customer authentication, allow partial refunds, and make retries safe so we never double-charge."

The desired output is not only generated prose.

It is an editable, evidence-backed integration model.

## Desired outputs

### Business state machine

~~~text
cart
  -> checkout_started
  -> payment_authorized
  -> stock_confirmed
  -> captured
  -> fulfilled
  -> partially_refunded / refunded
~~~

### Provider state mapping

Map business states to provider objects/statuses/events.

### API sequence

For each edge:

- client action;
- server API call;
- webhook/event;
- polling only if necessary;
- idempotency requirements;
- retry policy.

### Failure/compensation paths

Examples:

- authentication required;
- authorization fails;
- capture fails;
- stock not available;
- webhook delayed;
- duplicate request;
- partial refund fails;
- human intervention.

### Evidence

Every proposed API operation/transition should link back to:

- OpenAPI operation;
- provider documentation;
- event schema;
- explicit business requirement.

## Why this needs LLM + JEV + deterministic validation

### LLM

Good at:

- reading large API docs/specs;
- generating candidate integration approaches;
- translating business requirements into candidate states/edges;
- explaining the result.

### JEV

Good at bounded decisions over candidates:

- which candidate provider object best represents this concept?
- is this transition initiated by API call, webhook, client action, or polling?
- should failure retry, compensate, wait, or escalate?
- does this state transition have sufficient evidence?
- is this edge ambiguous?
- is the proposed operation consistent with the business requirement?

### Deterministic validator

Owns objective truth:

- operation exists;
- HTTP method/path exists;
- required fields exist;
- schema/type validation;
- event name exists;
- idempotency rules where represented in source;
- state graph integrity;
- no unreachable nodes;
- no duplicate edge identifiers.

## Proposed pipeline

~~~text
business request
    +
API/OpenAPI/docs
    |
    v
retrieval / document parsing
    |
    v
LLM proposes candidate graph
    |
    v
JEV evaluates bounded choices/edges
    |
    v
deterministic API/schema validator
    |
    +--> evidence missing -> retrieve / revise
    |
    +--> valid -> editable UI
~~~

## Example JEV edge state

~~~json
{
  "businessRequirement": "Capture only after stock confirmation.",
  "candidateEdge": {
    "from": "payment_authorized",
    "to": "captured",
    "operationCandidate": "POST /payment_intents/{id}/capture"
  },
  "evidence": [
    {
      "source": "provider-doc",
      "summary": "Candidate capture endpoint description..."
    }
  ]
}
~~~

## Example JEV edge questions

### Edge mechanism — Choice

~~~json
{
  "mechanism": {
    "type": "choice",
    "instructions": "What kind of integration mechanism is the primary driver of this transition?",
    "criteria": {
      "server_api": "Our backend initiates an API call.",
      "client_action": "Browser/mobile client must initiate the action.",
      "webhook": "Provider event drives the transition.",
      "poll": "Our system must query provider state.",
      "internal": "No external provider interaction is needed."
    }
  }
}
~~~

### Failure behavior — Choice

~~~json
{
  "failure_behavior": {
    "type": "choice",
    "instructions": "Given this business requirement and candidate transition, what is the safest primary failure handling category?",
    "criteria": {
      "retry": "Retry is expected and can be made idempotent.",
      "wait": "Wait for an external/eventual condition.",
      "compensate": "Run a compensating action.",
      "human": "Escalate for manual intervention.",
      "fail_terminal": "Mark the business process failed."
    }
  }
}
~~~

### Evidence sufficiency — Noul

"Is the supplied evidence sufficient to justify this provider transition without inventing undocumented behavior?"

## Important rule

JEV must not hallucinate an API operation.

The LLM must not be trusted merely because it generated a plausible endpoint.

All API operations and event names are checked against source/spec data before they become executable implementation artifacts.

## UI concept

This is a strong demonstration of "Describe the problem. The interface appears."

The app could project:

- state-machine canvas;
- API call cards;
- webhook lane;
- retry/idempotency badges;
- ambiguity warnings;
- evidence drawer;
- editable business requirements.

Changing a requirement such as:

> "Actually capture 20% as a deposit now and the rest on fulfilment"

should patch/recompute the relevant graph, not append a chat answer beneath the old plan.

## Why this is a later demo

It is powerful but has more moving parts:

- document retrieval;
- LLM synthesis;
- graph/state-machine UI;
- schema validation.

The mixed voice/intention demo is a simpler first proof of the JEV control plane.

This concept is preserved here so future agents do not lose the payment-space direction or redo the reasoning from scratch.
