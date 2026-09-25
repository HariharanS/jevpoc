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

Normalize every model/framework proposal:

~~~ts
type ToolProposal = {
  callId: string;
  sessionId: string;
  source:
    | "llm"
    | "realtime_voice"
    | "workflow"
    | "ui"
    | "user";

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

Approval is explicit state.

~~~text
tool proposal
   |
   v
approval_required
   |
   +--> pending
   |
   +--> approved -> execute
   |
   +--> rejected -> return structured rejection
~~~

A model waiting for approval should not silently retry or call an equivalent tool under a different name.

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
