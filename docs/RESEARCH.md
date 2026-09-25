# External source register

**Checked/curated 25 September 2026.** This file is reference evidence, not another build contract. A historical link does not mean the current endpoint, SDK or capability was integration-tested. Recheck only the provider surface needed by an assigned task. No provider calls or pricing benchmark have run.

## Checks repeated during consolidation

- Node SQLite: https://nodejs.org/docs/latest-v22.x/api/sqlite.html — the Node 22 unflagged boundary is 22.13. Pin a tested maintained patch at B00; do not interpret 22+ as exact compatibility or security guidance.
- OpenAI transcription: https://developers.openai.com/api/docs/guides/realtime-transcription and https://developers.openai.com/api/docs/guides/realtime-vad — current model-specific guidance requires explicit audio-turn commits for gpt-live-transcribe and no server_vad/semantic_vad. A generic Realtime VAD capability cannot be assigned to every transcription model. Cached documentation variants were inconsistent; prefer the current model-specific guidance and verify it in F06.
- TypeSafe introduction/API/SDK URLs below could not be re-fetched through this review's web reader. Treat the previous integration research as a starting reference, **not freshly verified SDK compatibility**. F02 must read the official skill/current docs and exercise the pinned SDK before marking the adapter supported.

## TypeSafe / JEV references

https://docs.typesafe.ai/introduction
https://docs.typesafe.ai/api
https://docs.typesafe.ai/primitives
https://docs.typesafe.ai/confidence
https://docs.typesafe.ai/sdk/javascript
https://docs.typesafe.ai/models
https://docs.typesafe.ai/patterns/fan-out
https://docs.typesafe.ai/agent-skill
https://github.com/typesafe-ai/skills/blob/main/skills/typesafe-ai/SKILL.md

Project adapter direction retained from the reviewed design: official @typesafe-ai/sdk inside DecisionEngine; state + versioned typed questions; normalized Noul/Choice/Score responses. The core schema is application-owned and not a promise that SDK fields never change. Read the skill; global plugin installation is not a prerequisite. Do not blindly execute remote setup commands.

No copied model alias, rate limit, price or latency claim is an architectural constant. Capture official source/date/currency/billing units at benchmark time.

## Voice investigation sources — selection pending

OpenAI: https://developers.openai.com/api/docs/guides/realtime-transcription ; https://developers.openai.com/api/docs/guides/realtime
Gemini: https://ai.google.dev/gemini-api/docs/live-api ; https://ai.google.dev/gemini-api/docs/live-api/live-transcribe
xAI: https://docs.x.ai/developers/model-capabilities/audio/speech-to-text ; https://docs.x.ai/developers/model-capabilities/audio/speech-to-speech
Deepgram: https://developers.deepgram.com/docs/flux/quickstart ; https://developers.deepgram.com/docs/flux/state
ElevenLabs: https://elevenlabs.io/docs/eleven-agents/libraries/web-sockets
Azure: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live-sdk

Except the explicit OpenAI check above, these are retained source pointers, not freshly reverified capability rows. F06 records provider/surface/model/SDK/version, transcript delta-vs-snapshot behavior, interim/final/turn events, revision handling, browser/server auth, interruption, resume, source date and test result. Status is supported, unsupported or unverified—not a misleading boolean. Start with evidence preservation, not voice naturalness. Cleaned/smart transcription may remove spoken corrections; test a verbatim path where available.

## Harness investigation sources — not selected dependencies

MAF pipeline: https://learn.microsoft.com/en-us/agent-framework/agents/agent-pipeline
MAF middleware: https://learn.microsoft.com/en-us/agent-framework/journey/adding-middleware
Copilot SDK: https://github.com/github/copilot-sdk
LangChain/JEV: https://www.langchain.com/blog/building-a-harness-with-jev
Strands routing: https://strandsagents.com/docs/user-guide/concepts/model-providers/model-routing/
Strands bidirectional: https://strandsagents.com/docs/user-guide/sdk/bidirectional-streaming/
Pi examples: https://github.com/MoonTory/pi-jev-harness ; https://github.com/iefnaf/pi-jev

Preserved research questions: outer request access is not full internal-loop access; custom tools must delegate to our gateway; dynamically trimming tools can hurt prompt-cache reuse; experimental bidirectional frameworks need measured adapter tests. E07 rechecks the exact candidate before adoption.

## Research hygiene

Keep factual source claims separate from project choices and measured results. New reports belong under docs/results only after a spike runs. Include commit/config/data versions, raw evidence and limitations. Never label a copied matrix as current merely by changing its date.
