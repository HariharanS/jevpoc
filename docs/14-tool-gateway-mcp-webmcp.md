# Tool Gateway, MCP and WebMCP boundary

> **Status:** Normative architecture with deferred integration notes  
> **Purpose:** Keep action execution governed and provider-neutral.

## Core principle

The application owns a **typed Tool Gateway**.

JEV, LLMs, voice models, MCP clients, WebMCP adapters and agent frameworks may all **propose** tool calls.

They do not bypass application policy.

~~~text
proposal
   |
   v
Tool Gateway
   |
   +--> schema validation
   +--> hard permissions
   +--> JEV semantic checks where useful
   +--> deterministic policy
   +--> human approval if required
   |
   v
execute
   |
   v
result + evidence + trace
~~~

## Tool definition

Start small.

~~~ts
type ToolDefinition = {
  id: string;
  description: string;
  inputSchema: unknown;

  riskClass: "read" | "local_mutation" | "external_mutation" | "high_impact";

  approval:
    | "never"
    | "policy"
    | "always";

  execute(input: unknown, ctx: ToolContext): Promise<ToolResult>;
};
~~~

Risk/approval metadata is deterministic configuration.

JEV can add semantic signals but should not be the only safety boundary.

## Proposal envelope

Prefer provider-native function/tool calling where supported.

If a provider has no native tool call protocol, its adapter may use structured JSON internally, but core must never interpret arbitrary prose as an executable action.

Normalize every model/framework proposal:

~~~ts
type ToolProposal = {
  callId: string;
  sessionId: string;
  traceId: string;
  source:
    | "llm"
    | "realtime_voice"
    | "workflow"
    | "ui";

  toolId: string;
  input: unknown;

  semanticContext: {
    userGoal?: string;
    activeEventIds?: string[];
  };
};
~~~

Do not let provider-specific function-call objects flow through core code.

## Validation order

A sensible order is:

1. tool exists;
2. parse/schema validate input;
3. authenticate actor/session;
4. apply hard authorization/allowlists;
5. apply deterministic hard policy;
6. ask JEV semantic questions if the action needs interpretation;
7. request human approval when required;
8. execute;
9. validate/normalize result;
10. trace and feed result back to the harness/provider.

## Useful JEV tool questions

JEV can help with questions such as:

- Does this action match the user's current intent?
- Is this a duplicate of an action already completed?
- Does the tool argument appear to contradict the active semantic state?
- Is the action high-impact in this context?
- Is the result sufficient for the active subgoal?
- Would retry likely help?

JEV should **not** replace exact checks such as:

- "is amount > configured limit?";
- "does this user have role X?";
- "is this URL on the allowlist?";
- "is this JSON valid?";
- "has this idempotency key already executed?".

## Human approval

Approval is explicit state and begins **only after a concrete ToolProposal exists and has passed basic validation**.

Do not create a route such as needs_approval before the runtime knows exactly what action is being approved.

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

Approval state:

~~~text
pending
  |
  +--> approved -> resume at validated tool execution
  |
  +--> rejected -> return structured rejection
  |
  +--> cancelled
~~~

The first local demo uses a clearly-labelled development identity and self-approval. The family demo later can route routine requests to dad and exceptions/high-impact requests to mum.

This is demo workflow state, not production authentication.

A model waiting for approval must not silently retry or call an equivalent tool under another name.

See docs/18-runtime-contracts.md for Approval shape, demo identity and resume behavior.

## Idempotency

Every externally consequential action should support a stable application-level idempotency/correlation key where possible.

Do not rely on the model to remember whether it already performed the action.

## Tool result

Normalize tool results:

~~~ts
type ToolResult = {
  callId: string;
  status: "success" | "failure" | "partial" | "cancelled";
  data?: unknown;
  error?: {
    code: string;
    message: string;
  };
  evidenceRefs?: string[];
};
~~~

The harness/model can receive a concise representation while Inspector mode retains operational metadata.

## MCP position

MCP is a useful protocol for exposing or consuming tools.

It is **not** the domain model.

Possible adapter:

~~~text
MCP tool
   |
   v
McpToolAdapter
   |
   v
ToolDefinition
   |
   v
Tool Gateway
~~~

If we expose our own tools through MCP later, the server should call the same underlying Tool Gateway/policy instead of implementing separate business behavior.

## WebMCP position

We discussed WebMCP for web interaction.

The working position is:

> **WebMCP is an adapter over the provider-neutral tool registry, not a foundation of the runtime.**

Why:

- the core app should also work with normal functions/MCP/direct SDK tools;
- JEV policy/approval semantics must remain identical regardless of tool transport;
- a browser/web capability can evolve independently.

Conceptually:

~~~text
browser/web capability
       |
       v
WebMCP adapter
       |
       v
Tool Gateway
       |
       v
policy / approval / execution
~~~

Do not couple semantic state or JEV question sets to WebMCP wire details.

## Framework integration

### Microsoft Agent Framework

Function middleware can wrap tool invocation for standard agents.

Map that interception to the Tool Gateway.

### GitHub Copilot SDK

Custom tool handlers should delegate to the Tool Gateway.

### LangChain/LangGraph

wrap_tool_call or tool wrappers should delegate to the Tool Gateway.

### Strands

Strands tool functions should delegate to the same gateway/policy layer.

### Native realtime voice

Provider function calls are normalized into ToolProposal, gated, executed, and then the structured ToolResult is sent back to the realtime session.

## Inspector

Useful tool timeline:

~~~text
tool.proposed
  callId: tc_42
  source: realtime_voice
  tool: create_reminder

tool.validated

jev.tool_intent
  matches_user_goal: 0.97

policy.action
  approval: required

approval.requested

approval.approved

tool.executed
  status: success

tool.result_returned_to_model
~~~

## Paused run / resume semantics

When approval is required:

1. persist Approval;
2. mark the semantic run awaiting_approval;
3. stop the step loop;
4. return/display the approval card;
5. after a decision, resume from the already-validated ToolProposal;
6. do not blindly rerun the original user prompt.

Endpoint:

~~~http
POST /api/approvals/:approvalId/decision
~~~

The approval record retains toolCallId, traceId, proposal, requested approver role and decision evidence.

## Initial implementation

Implement one harmless/reversible tool first.

Good proof:

- local task/reminder record;
- mock external action.

The point is to prove:

- proposal normalization;
- JEV/policy boundary;
- approval;
- execution trace.

Do not begin by building an MCP marketplace or large plugin system.
