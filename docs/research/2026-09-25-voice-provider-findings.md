# Research: voice providers and architecture implications

> **Status:** Research/reference  
> **Snapshot date:** 2026-09-25  
> **Important:** Provider APIs change quickly. Re-check official docs when implementing an adapter.

This document preserves the research behind the voice architecture in docs/08-voice-architecture.md.

## Why provider research matters

We have two different architectural goals:

1. **control-first voice** — obtain revisable transcript evidence before the main reasoning/action loop;
2. **native realtime voice** — optimize natural latency and interruption while accepting that the voice model itself hears audio before JEV does.

Do not compare providers only on "does it support voice?"

The useful questions are:

- Do we get interim/partial transcription?
- Can the transcript be revised?
- Can we correlate final segments/turns?
- Is VAD configurable?
- Does barge-in cancel model output?
- Can tools be intercepted by our application?
- Can browser/mobile clients authenticate safely?
- Can conversation/session state resume?
- What events can we trace?
- Can speech and reasoning be decoupled?

# OpenAI

## Native realtime

Current OpenAI Realtime documentation describes:

- direct speech-to-speech;
- WebRTC for browser/client scenarios;
- WebSocket for server scenarios;
- low-latency turn-taking;
- barge-in/interruptions;
- realtime tool use;
- ephemeral client credentials;
- server-side controls.

OpenAI's current getting-started guide says the realtime model works directly with audio, maintains conversation state and can call tools.

### Architectural implication

In a native Realtime/GPT-Live session:

~~~text
user audio
   |
   v
OpenAI realtime voice model
   |
   +--> conversation/audio
   |
   +--> tool proposal
~~~

JEV cannot be assumed to inspect the user's semantic intent **before the realtime voice model itself processes the audio**.

Our reliable control boundary is therefore:

- tool execution;
- approval;
- durable application-state mutation;
- memory persistence;
- delegated backend work.

## Live transcription

OpenAI also exposes dedicated live/realtime transcription.

Current docs show:

- transcript delta events;
- completed transcript events;
- item IDs for correlation;
- configurable transcription delay/latency tradeoff;
- application responsibility for revising partial UI;
- gpt-live-transcribe does not expose word-level confidence/timestamps/speaker labels.

### Architectural implication

Dedicated transcription is a better fit for our **control-first** path because we receive text evidence before choosing a reasoning path.

Our Transcript Ledger should use provider item IDs and our own revision/correlation IDs.

## Sources

- Realtime getting started:
  https://developers.openai.com/api/docs/guides/realtime
- Realtime/live transcription:
  https://developers.openai.com/api/docs/guides/realtime-transcription

# Gemini

## Gemini Live conversational mode

Current Gemini Live documentation describes:

- persistent bidirectional WebSocket sessions;
- realtime audio/video/text input;
- native audio output;
- input and output transcription;
- function calling;
- automatic VAD;
- user interruption/barge-in;
- session resumption.

Gemini explicitly documents an interrupted server-content event and instructs the client to stop/discard queued playback.

### Architectural implication

Gemini Live is a strong candidate for the native realtime path.

Like other native speech-to-speech models, JEV is not a semantic pre-filter for the audio the Gemini model already received.

Tool execution can still be application-controlled.

## Gemini Live Transcription

Gemini also documents a dedicated realtime transcription model/path.

Current docs distinguish:

- interim input transcription — speculative/partial;
- finalized input transcription — committed/final;
- Smart vs verbatim transcription;
- custom vocabulary;
- VAD controls.

### Architectural implication

This is especially attractive for experiments around:

- semantic checkpoints;
- partial/final transcript handling;
- correction horizon;
- live provisional UI.

We should preserve provider partial/final semantics in metadata while normalizing them into our canonical SpeechEvent model.

## Sources

- Live API:
  https://ai.google.dev/gemini-api/docs/live-api
- Live API quickstart:
  https://ai.google.dev/gemini-api/docs/live-api/get-started-sdk
- Capabilities/VAD:
  https://ai.google.dev/gemini-api/docs/live-api/capabilities
- Live transcription:
  https://ai.google.dev/gemini-api/docs/live-api/live-transcribe
- Session management:
  https://ai.google.dev/gemini-api/docs/live-api/session-management

# xAI / Grok

## Native voice

Current xAI Voice documentation describes:

- realtime speech-to-speech over WebSocket;
- sub-second target experience;
- server VAD;
- function/tool calling;
- browser-safe ephemeral tokens;
- streamed audio response events;
- conversation resumption options.

### Architectural implication

Grok Voice can be wrapped as a native realtime provider behind our RealtimeVoiceSession adapter.

Its OpenAI-like event model may reduce adapter effort, but we should still normalize events rather than make the core depend on xAI/OpenAI wire formats.

## Streaming STT

Current xAI Speech-to-Text documentation describes:

- WebSocket streaming STT;
- interim results;
- transcript.partial events;
- final markers;
- endpointing configuration;
- raw binary audio frames.

### Architectural implication

xAI's separate STT path is a useful control-first candidate.

This lets us compare:

~~~text
xAI STT -> Transcript Ledger -> JEV -> reasoning/tool path
~~~

against:

~~~text
xAI native Voice -> conversation model -> Tool Gateway
~~~

without changing the core semantic/policy model.

## Sources

- Voice overview:
  https://docs.x.ai/developers/model-capabilities/audio/voice
- Speech-to-speech:
  https://docs.x.ai/developers/model-capabilities/audio/speech-to-speech
- Speech-to-text:
  https://docs.x.ai/developers/model-capabilities/audio/speech-to-text

# Strands BidiAgent as an abstraction experiment

Strands' experimental BidiAgent currently provides adapters for:

- OpenAI Realtime;
- Gemini Live;
- Amazon Nova Sonic.

The framework handles:

- persistent bidirectional streaming;
- interruptions;
- streaming events;
- tool execution;
- session persistence;
- telemetry.

This is worth testing because it may remove provider-specific transport work.

However:

- it is experimental;
- it does not remove the architectural distinction between STT-first and native speech-to-speech;
- our Tool Gateway/policy and Transcript Ledger should remain application concepts.

Sources:

- https://strandsagents.com/docs/user-guide/sdk/bidirectional-streaming/
- https://strandsagents.com/docs/user-guide/sdk/bidirectional-streaming/quickstart/
- https://strandsagents.com/docs/user-guide/sdk/bidirectional-streaming/models/openai/
- https://strandsagents.com/docs/user-guide/sdk/bidirectional-streaming/models/google/

# Provider-neutral capability model

Adapters should publish capabilities rather than force all providers into identical semantics.

~~~ts
type VoiceCapabilities = {
  nativeSpeechToSpeech: boolean;
  streamingInputTranscript: boolean;
  hasInterimTranscript: boolean;
  hasFinalTranscript: boolean;
  inputTranscriptRevisions: boolean;
  outputTranscript: boolean;
  serverVad: boolean;
  semanticTurnDetection: boolean;
  bargeIn: boolean;
  toolCalling: boolean;
  asyncTools: boolean;
  sessionResumption: boolean;
  browserEphemeralAuth: boolean;
};
~~~

A capability can be false, unknown, or provider/version-specific.

Do not invent emulation merely to make every adapter report true.

# Working project interpretation

## For the first voice proof

Prefer a dedicated streaming STT path:

~~~text
microphone
  -> streaming STT
  -> Transcript Ledger
  -> semantic checkpoint
  -> JEV
  -> policy
  -> optional LLM/tools
  -> TTS/response
~~~

Why:

- it visibly proves JEV's role;
- we can inspect revisions before action;
- it is easier to test correction semantics;
- model routing remains independent of voice transport.

## For best conversational UX later

Add native realtime speech-to-speech as a second mode.

The native provider can remain the conversational shell while a backend model/harness performs a difficult delegated task.

~~~text
realtime voice model
     |
     +--> easy conversation
     |
     +--> delegated complex task
              |
              v
             JEV
              |
        reasoning model/agent
              |
           result
              |
              v
       voice model speaks
~~~

This preserves natural speech UX without forcing the realtime voice model to be our only reasoning model.

# Tests the provider spike must run

Do not choose a provider from marketing/docs alone.

Use the same recorded/live scenarios and measure:

1. speech-start to first partial transcript;
2. speech-end to final transcript;
3. transcript revision behavior;
4. correction example: "Coke... no, water";
5. mixed-intent utterance;
6. barge-in audio stop latency;
7. tool-call round trip;
8. reconnect/session resume;
9. output transcript/event quality;
10. cost metadata;
11. ease of correlating events in Inspector mode.

The result should be checked into the repository as an eval/report when the spike is implemented.
