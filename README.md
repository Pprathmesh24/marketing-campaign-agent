# marketing-campaign-agent

Turn a marketing brief into a full campaign plan — concept, headlines, channel strategy, metrics, and risks — powered by Claude.

---

## What it does

Submit a brief describing your product, audience, goal, channels, and tone. The agent returns one of two responses:

- **Campaign plan** — a complete structured plan with an audience insight, campaign concept, 3–5 headlines, per-channel angles and formats, measurable KPIs, and honest risk flags
- **Clarification questions** — when the brief is too vague to plan meaningfully, the agent asks up to three targeted questions instead of producing a hallucinated plan

The output can be copied as Markdown or JSON for use downstream.

---

## Stack

- **Next.js 16** — App Router, TypeScript, Tailwind v4
- **Claude** (`claude-sonnet-4-6`) via `@anthropic-ai/sdk` directly
- **shadcn/ui** — component library
- **pnpm** — package manager
- **Vercel** — deployment

---

## Setup

```bash
cp .env.local.example .env.local
# Add your Anthropic API key to .env.local

pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How it works

### Structured output — JSON schema in the system prompt

The system prompt describes the exact JSON shape Claude must return, with literal field-by-field examples and inline quality descriptions for each field. Claude is instructed to respond with JSON only — no markdown fences, no preamble — beginning with `{` and ending with `}`.

This approach keeps the full data contract visible in plain code: schema defined in `src/lib/systemPrompt.ts`, validated in `src/lib/validateOutput.ts`, rendered in `src/components/CampaignOutput.tsx`. No LLM abstraction libraries, no tools API.

### Discriminated union response

The agent returns one of two shapes, determined by the model based on brief quality:

```json
// Specific brief — full campaign plan
{
  "mode": "plan",
  "data": {
    "insight": "The specific audience truth this campaign is built on",
    "concept": {
      "name": "Campaign name",
      "bigIdea": "The single creative idea connecting all executions"
    },
    "headlines": ["Headline one", "Headline two"],
    "channelPlan": [
      {
        "channel": "Social",
        "angle": "The specific message angle for this channel",
        "format": "e.g. LinkedIn carousel, 5 slides"
      }
    ],
    "metrics": ["Specific measurable KPI mapped to the campaign goal"],
    "risks": ["Honest risk flag or compliance requirement"]
  }
}

// Vague brief — clarification questions
{
  "mode": "clarify",
  "questions": [
    "Targeted question with a note on why it affects strategy"
  ]
}
```

The mode-selection logic lives in the system prompt: explicit criteria for when to clarify (product too generic, audience too broad, goal contradicts channels), with a stated default to plan when reasonable inferences can be made.

### Output validation with retry

After `JSON.parse`, the response is checked against a hand-rolled type guard that validates every field of the discriminated union. If validation fails — malformed JSON, missing fields, wrong types — the route retries the Claude call once before returning a 502.

API-level errors (auth failures, rate limits) skip the retry entirely since re-attempting won't fix them. The raw error and model output never reach the client.

### Input sanitization

All form data is validated server-side before reaching Claude: field presence, length caps (product name ≤100 chars, description ≤1000, audience ≤500), enum checks for goal/channels/tone, and prompt injection detection across six regex patterns. Client-side validation is a UX layer only — the server is the security boundary.

### Prompt caching

The system prompt is sent with `cache_control: { type: "ephemeral" }`. Anthropic's prompt caching stores the system prompt for up to 5 minutes, reducing latency and cost on repeated requests within a session.

---

## Running evals

The `evals/` directory is a separate uv-managed Python project that calls the live `/api/generate` endpoint and asserts response shape and mode.

```bash
# With the dev server running at localhost:3000
cd evals
UV_PROJECT_ENVIRONMENT=marketing_agent uv run python run_evals.py
```

Three cases are included: happy path (expects `mode: plan`), vague brief (expects `mode: clarify`), and a prompt injection attempt (expects HTTP 400).

---

## Deployment

The app deploys to Vercel with no additional configuration — Next.js is auto-detected.

1. Push the repo to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Add `ANTHROPIC_API_KEY` as an environment variable in Vercel project settings
4. Deploy

---

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for a detailed breakdown of every technical decision — system prompt design section by section, the discriminated union rationale, retry logic, input sanitization, prompt caching, and what would change at production scale.
