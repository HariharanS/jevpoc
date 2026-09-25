# Safety, privacy and later integration gates

These are scoped requirements, not extra M1 features. They apply before the corresponding capability is enabled.

## Local boundary

The first application binds loopback by default. Validate Host/Origin and protect mutation endpoints against unsolicited browser requests; CORS alone is not authentication. Keys remain server-side and outside Git. Bound input sizes, queue length, model deadlines, stream buffers and output lengths.

The prototype server exposes only an explicit allowlist of prototype assets and fixtures, never the whole working directory. It has no write API or provider credentials. Do not deploy this development server publicly.

Raw audio is off by default. Secrets/auth headers are redacted before every sink, including stdout/OTel, even in full trace mode. Full-content traces are reserved for deliberately synthetic/local work. Real-user use needs retention and access settings; deployed default is redacted. Metadata-only tracing must not disable the authorized state snapshot.

Provider/tool/document content is untrusted data. It cannot alter tool allowlists, system instructions, identity, approval policy or memory ownership. Validate generated objects. No arbitrary generated HTML/JS, shell execution, unsafe URL retrieval or direct provider-MCP action bypass.

## Tool Gateway and approvals — F04

Normalize concrete proposals. Check tool exists, input schema, trusted actor identity, ownership, hard permissions/policy, then optional semantic judgment. Approval exists only for a validated concrete proposal. The first tool is harmless/local, not a live payment or medical action.

Bind approval to proposal ID/version and canonical payload digest, actor/session, required role, event versions, policy version and expiry. Revalidate at resume. Edits invalidate old approval. Duplicate decisions are idempotent; invalid role/expired proposal fails closed. Demo roles self/dad/mum/kid are labelled fixtures, not production auth. An agent cannot avoid a denied proposal by renaming an equivalent action.

Persist paused run/proposal/approval. Resume at the validated proposal, not by replaying the original prompt. Start with maxSteps=4 and maxToolCalls=3; enforce wall-clock and cancellation too. JEV unavailable does not authorize a consequential action.

The action ledger has not_started, in_progress, succeeded, failed, cancelled and unknown_outcome. A timeout may mean the provider executed. Use stable provider idempotency where supported; reconcile unknown outcomes before retry. Do not promise general exactly-once external execution.

## Time

Store original phrase, local time, date, IANA zone and resolved instant separately. Required-field policy decides when a scheduling tool is eligible. Ambiguous dates, past times and DST overlap/gap require explicit resolution; do not silently roll forward. A reminder draft is not a notification service. No inferred medication names/doses.

## Voice — F06/F6C and native comparison

Keep control-first STT and native speech-to-speech distinct. Capability records specify provider/surface/model/version and evidence status. Pin provider segment identity and connection epoch. Handle revisions, duplicate/out-of-order events, turn resume, disconnect and cancellation.

Native providers can hear and speak before backend judgments finish. Tool/state control does not retract spoken output. Output interruption must stop the browser playback queue as well as cancel the provider response. A barge-in is not necessarily cancellation of an already-started external action; preserve its ledger/outcome.

## Memory — F05

Extract bounded candidates from structured events; classify scope; deterministic code chooses persistence. Use owner/session/project scoping, evidence, accepted-vs-proposed state, expiry/supersession and explicit review for sensitive long-term data. Never infer a health/psychological profile from the journal demonstration.

Memory is lower-trust context, never permission or policy. Current explicit input beats superseded memory. Retrieve a bounded deterministic kind/key/recent set first. No vector DB until a measured retrieval problem justifies it. Test cross-user isolation, deletion, contradiction and readback.

## Deployment — F08

Choose a host after the local proof. A long-lived Node container is the least-change candidate, not a preselected vendor. Workers, Durable Objects, Convex or serverless functions require explicit process/transport/storage compatibility work; they are not guaranteed drop-in substitutions.

Before real-user hosting: real auth, scoped authorization for state/traces/streams, durable disk/database, migrations/backups, restart/reconnect tests, secrets, retention/deletion, rate/cost limits, origin policy and incident visibility. Never use ephemeral container storage as a durable SQLite claim.

## API Journey Compiler — later E08

The harness/LLM proposes an evidence-backed graph; JEV evaluates bounded alternatives; deterministic validators check source/spec and graph constraints. Valid endpoints and connected nodes do not establish business correctness.

Preserve operation/version/source evidence and unresolved assumptions. Validate authentication, asynchronous webhooks, duplicate/out-of-order delivery, authorization expiry, partial capture/refund constraints, idempotency and compensation. Use sandbox/mock calls only for its POC. No auto-execution of payment journeys. Changed business requirements patch affected graph elements with traceable dependency impact.
