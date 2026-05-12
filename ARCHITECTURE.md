# Architecture — Marketing Brief → Campaign Agent

This document explains the technical decisions behind this project. The code implements them; this explains why.

---

## Why this project exists

This is a portfolio project for an AI Prompt Engineer role. The goal is not to ship a product — it is to demonstrate that I can design and reason about prompts as a technical artefact: schema design, mode-selection logic, guardrails, failure modes, and adaptation when model behaviour changes.

Everything that would hide the prompt (LangChain, Vercel AI SDK, the Anthropic tools API) is intentionally excluded. The system prompt, message construction, response parsing, and validation are all visible in plain TypeScript with no abstractions between them.

---

## Structured output: why JSON-in-system-prompt instead of the tools API

The Anthropic SDK has a `tools` API that enforces JSON structure at the API level via a JSON Schema definition. I chose not to use it.

The tools API works well in production. But for a portfolio demonstrating prompt engineering skill, using it would move the interesting work (schema definition, output instruction, mode-selection logic) into SDK configuration rather than the system prompt. A reviewer reading the code would see a JSON Schema object passed to the SDK and learn nothing about how I think about prompts.

The approach used here — describing the schema in the system prompt as a literal JSON example, then parsing and validating the response server-side — keeps every decision visible:

- The schema is defined in `src/lib/systemPrompt.ts` as a human-readable example with inline field descriptions
- The validation logic is in `src/lib/validateOutput.ts` as a hand-rolled type guard
- The rendering logic is in `src/components/CampaignOutput.tsx` as typed React props

Three files, no magic. A reviewer can trace the full data contract from prompt to UI without understanding any SDK-specific abstractions.

---

## The discriminated union: why one endpoint, two shapes

The agent response is a discriminated union:

```ts
type AgentResponse =
  | { mode: "plan"; data: CampaignPlan }
  | { mode: "clarify"; questions: string[] }
```

An alternative design would use two endpoints: `/api/generate` returns a plan, `/api/clarify` returns questions. I chose one endpoint with two shapes for a specific reason: it puts the routing decision inside the model.

The system prompt teaches Claude when to plan and when to ask for clarification. That decision is based on brief quality — something the model can assess but the server cannot without duplicating the logic. A two-endpoint design would require either client-side routing (the client decides which endpoint to call, which means duplicating the quality-assessment logic) or a pre-flight classification call (wasteful).

One endpoint, one call, one parse path. The `mode` field is the discriminator.

---

## System prompt design

The system prompt (`src/lib/systemPrompt.ts`) has eight sections. Each is intentional.

**Role anchoring**
```
You are a senior marketing strategist and creative director.
```
"Senior" shifts the output register toward strategic reasoning rather than generic suggestions. Naming both strategist and creative director holds the model in the productive overlap between coherent strategy and executable creative. The phrase "grounded in audience psychology — not vague positioning statements" is a behavioral constraint embedded in the role definition — it tells Claude what failure looks like before it starts.

**JSON-only output instruction (appears twice)**
The instruction to respond with JSON only, beginning with `{` and ending with `}`, appears near the top of the prompt and again as the final line. LLMs have a strong prior toward wrapping JSON in markdown fences or adding a preamble. Repetition at start and end is the most reliable way to suppress these defaults.

**Literal JSON examples with inline field descriptions**
The schema is shown as a complete literal example for both modes. Field values are descriptive strings rather than empty placeholders:
```json
"insight": "One or two sentences. The specific audience truth... not a generic observation..."
```
Descriptive values communicate what quality looks like for each field — length, specificity, what to avoid. They serve as inline instructions without needing a separate prose section per field.

**Mode-selection rules with a planning bias**
Rather than vague instructions like "ask if unclear", the prompt gives explicit criteria for when to clarify (product too generic, audience too broad, goal contradicts channels) and a stated default: *"When you can make a reasonable inference from context, plan."*

This default is deliberate. A concrete plan a marketer can react to and refine is more valuable than an abstract question. Marketers can edit a plan; they can only answer a question.

**Tone calibration with per-tone definitions**
Six tones are supported. Each has a definition rather than just a name:
```
Playful: energetic, light wordplay only when it lands cleanly, avoid forced puns
```
Without definitions, "playful" and "friendly" produce nearly identical output. The definitions give each tone a distinct behavioral fingerprint. The instruction that "the JSON structure itself is always precise and neutral" prevents tone from bleeding into the data structure.

**Anti-hallucination guardrail**
```
Do not cite statistics unless the marketer included them in the brief.
Write around the gap — "position the brand as the fastest option" not "87% of users report saving time."
```
Marketing copy with invented statistics is legally dangerous. The guardrail pairs a prohibition with an alternative technique so the model maintains persuasiveness without fabrication.

**Regulated industries — flag, don't refuse**
If a brief is for a regulated product (pharmaceuticals, financial advice, alcohol, etc.), the model adds a compliance risk item rather than refusing to plan. Refusing would make the agent useless for a large segment of legitimate marketing work. The professional response is to plan while flagging the requirement — which is what a senior marketer at an agency would do.

**Harmful briefs — route to clarify, not error**
If a brief appears designed to cause harm, the model routes to `mode: "clarify"` with a neutral question rather than refusing with an error message. This keeps the output format consistent (always valid JSON, always parseable by the client) and avoids confrontational language appearing in the clarification UI.

---

## Assistant-turn prefill: the original design and why it was removed

The original design used assistant-turn prefill — appending `{ role: "assistant", content: "{" }` to force Claude to continue from `{`, guaranteeing JSON-shaped output. Server reconstruction: `'{' + response.content[0].text` → `JSON.parse`.

During development, Claude 4 (`claude-sonnet-4-6`) returned a 400 error: `This model does not support assistant message prefill`.

Rather than treating this as a failure, I adapted: removed the prefill, strengthened the prompt-level JSON instruction (the double repetition described above), and verified that Claude 4's instruction-following is reliable enough to produce parseable JSON without the API-level enforcement.

The prefill technique remains documented as the correct pattern for Claude 3.x models. The adaptation demonstrates that prompt engineering work involves real-world constraints and model version differences — not just writing prompts in the abstract.

---

## Output validation with retry

After `JSON.parse`, the response is run through a type guard (`src/lib/validateOutput.ts`) that checks every field of the `AgentResponse` discriminated union. On mismatch, the route retries the Claude call once before returning a 502.

The logic is separated into two concerns:

- `callClaude()` — returns `null` if the response parses but fails shape validation, throws if the API call itself fails
- The retry loop in `POST` — retries on `null` (shape failure), returns 502 immediately on a thrown error (API errors, auth failures, rate limits won't be fixed by retrying)

Retry is capped at 2 total attempts. If both fail validation, a 502 is returned with a clean message. The SDK error and raw model output never reach the client.

---

## Input sanitization

All form data is validated server-side in `src/lib/validateBrief.ts` before reaching Claude:

- Field presence and length caps (product name ≤100 chars, description ≤1000, audience ≤500)
- Enum validation for goal, channels, and tone
- Prompt injection detection — six regex patterns covering common injection attempts (`ignore previous instructions`, `system:`, `[INST]`, `<|im_start|>`, `you are now`, `forget everything`)

Client-side validation (which disables the submit button) is a UX layer only. The server-side check is the actual security boundary.

---

## Prompt caching

The system prompt is sent with `cache_control: { type: "ephemeral" }`. Anthropic's prompt caching stores the system prompt in a fast-access cache for up to 5 minutes. On repeated calls within that window, the system prompt is read from cache rather than re-processed, reducing latency and cost.

For this app — where every request uses the same system prompt — caching provides a meaningful benefit on the second and subsequent requests within a session.

---

## Eval harness

`evals/` is a separate uv-managed Python project that calls the live `/api/generate` endpoint and asserts response shape and mode against known test cases:

- `happy_path.json` — specific, complete brief → expects `mode: "plan"` with full shape validation
- `vague_brief.json` — generic product and audience → expects `mode: "clarify"`
- `adversarial.json` — prompt injection in audience field → expects HTTP 400 before Claude is called

The evals are the executable proof that the system prompt works as designed. If the mode-selection rules are later loosened or tightened, the eval will catch regressions.

Run with:
```bash
cd evals
UV_PROJECT_ENVIRONMENT=marketing_agent uv run python run_evals.py
```

---

## What I would change in a production version

- **Streaming** — non-streaming was chosen to keep the demo simple. A production version would stream the response and render sections as they arrive.
- **Structured output via the tools API** — for production reliability, the tools API's JSON Schema enforcement would replace the prompt-level schema description. The prompt design work here would remain; the enforcement mechanism would change.
- **Eval cases** — three cases are enough to demonstrate the pattern. A production eval harness would cover a wider range of brief quality, edge cases in each tone, and all regulated-industry categories.
- **Model versioning** — `MODEL_ID` is a single constant in `src/lib/anthropic.ts`. In production this would be an environment variable, allowing model upgrades without code changes.
