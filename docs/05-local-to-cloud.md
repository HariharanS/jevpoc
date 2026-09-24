# Local-to-cloud evolution

## Stage 0 — local development

```
browser
  -> Vite web app
  -> local Fastify API
  -> SQLite
  -> external JEV / LLM APIs
```

Run with one command using a workspace script or Docker Compose if necessary.

No cloud account should be required to contribute.

## Stage 1 — simple hosted deployment

Package API as a container.

Reasonable targets include:

- Cloudflare Containers / Workers where runtime compatibility fits,
- Vercel for the web tier plus a compatible API host,
- AWS App Runner / ECS Fargate,
- Fly.io / Render / similar container hosts.

The application should not care which one is selected.

For a first hosted demo, choose the path with the least operational work rather than the theoretically perfect platform.

## Stage 2 — managed persistence

Replace SQLite with Postgres when one of these becomes true:

- multiple application instances need shared state,
- concurrency exceeds SQLite's comfortable write pattern,
- hosted ephemeral disks make SQLite awkward,
- operational querying/backups justify it.

Only the `SessionStore` / `TraceStore` adapters should change.

## Where Durable Objects may fit

Cloudflare Durable Objects become interesting if the product needs a strongly coordinated stateful actor per active session/user.

Potential mapping:

```
sessionId -> Durable Object
```

That can be elegant for long-lived conversational/session coordination, but it is not required for the first POC.

Do not design the local system around Durable Objects before proving that session concurrency/coordination needs them.

## Where Convex may fit

Convex is attractive when fast product iteration, reactive data and a managed backend are more valuable than infrastructure portability.

It can replace a meaningful part of API + persistence.

Trade-off: application code becomes more coupled to the platform.

For this POC, keep the core domain portable first. A Convex adapter/host can be explored later.

## AWS path

If organisational requirements eventually prefer AWS:

```
CloudFront/S3 or Amplify
       |
       v
API Gateway / ALB
       |
       v
ECS Fargate or Lambda
       |
       +--> RDS Postgres
       +--> external AI providers
       +--> OTEL -> CloudWatch/X-Ray/other
```

Do not start with Step Functions, EventBridge, SQS or multiple Lambdas unless asynchronous workload requirements actually appear.

## Cloud rule

Cloud migration should mostly change adapters and deployment configuration, not the orchestration/domain model.
