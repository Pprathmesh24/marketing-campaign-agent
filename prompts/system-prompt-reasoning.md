# System Prompt — Design Reasoning

Every section of the system prompt is intentional. This document explains the WHY behind each decision so the prompt can be iterated intelligently.

---

## 1. Role anchoring

```
You are a senior marketing strategist and creative director.
```

**Why "senior":** Role priming shapes output register. "Senior" pushes Claude toward experienced-level reasoning — strategic tradeoffs, not surface-level suggestions. Without it, you get generic campaign ideas. With it, you get prioritisation and rationale.

**Why both "strategist" and "creative director":** These are complementary tensions. Pure strategists produce dry analysis with no executable ideas. Pure creatives produce exciting executions with no strategic grounding. Naming both roles keeps Claude in the overlap — plans that are both coherent and interesting.

**Why "grounded in audience psychology — not vague positioning statements":** This is a behavioral constraint embedded in the role definition. It tells Claude what *not* to do before it starts. Without it, you get a flood of positioning language ("the market leader in...") that sounds good but means nothing. The phrasing makes the failure mode explicit.

---

## 2. JSON-only output + prefill alignment

```
You respond with valid JSON only. No markdown fences, no preamble, no commentary.
Your response begins immediately with { and ends with }.
```

**Why this matters:** LLMs have a strong prior toward wrapping JSON in markdown fences (```json ... ```) or adding a preamble ("Here's the campaign plan:"). Both break `JSON.parse`. This instruction appears twice — once near the top, once as the final instruction — because repetition at start and end is the most reliable way to suppress these defaults.

**Why "begins immediately with {":** This aligns with the assistant-turn prefill in the API call (`{ role: "assistant", content: "{" }`). The model continues from `{` rather than generating it fresh. Stating this in the system prompt reinforces the constraint from two directions — API-level enforcement (prefill) and instruction-level enforcement (the prompt). Both are needed; neither is sufficient alone.

**Why no tool use:** Tool use via `input_schema` would enforce JSON structure at the API level. We chose not to use it because the purpose of this portfolio is to demonstrate prompt-level structured-output technique — the schema, the guardrails, and the mode-selection logic should all be visible in the system prompt itself, not delegated to the SDK.

---

## 3. Inline field descriptions inside the JSON example

The JSON examples in the prompt use descriptive strings as field values rather than placeholder symbols like `"..."`:

```json
"insight": "One or two sentences. The specific audience truth..."
```

**Why descriptions, not empty strings:** Empty strings show structure but don't communicate intent. Descriptive values tell Claude what quality looks like for that field — length, specificity, what to avoid. They act as inline instructions without needing a separate prose section for each field.

**Why the insight field says "not a generic observation":** The most common failure mode for insight fields is something like "People want to save time" — technically true, strategically useless. The negative instruction ("not a generic observation") suppresses this prior.

**Why headlines say "Each should feel distinct — vary structure, length, and angle":** Without this, Claude writes 3-5 headlines that are essentially the same idea with different words. The variance instruction produces a range that actually demonstrates the concept from multiple angles.

---

## 4. Mode-selection rules

```
Return mode clarify only when at least one of these is true:
- The product description is too generic...
- The audience is too broad...
- The goal and channels contradict each other...
```

**Why explicit criteria:** Without rules, the model either always asks for clarification (safe but annoying) or always tries to plan (confident but sometimes hallucinatory). Explicit criteria give Claude a decision framework it can apply consistently.

**Why "default toward planning":** A concrete plan a marketer can react to is more useful than an abstract question. Marketers can edit a plan; they can only answer a question. The tiebreaker favors action.

**Why max three questions:** Without this cap, the model asks 5-8 questions that feel like a form. Three forces prioritisation — Claude has to decide which unknowns matter most. The questions that survive the cut are usually the genuinely consequential ones.

**Why "followed by a brief note on why it affects strategy":** Clarification questions without context feel arbitrary ("Why do you want to know that?"). Adding the strategic reason makes the question feel like it comes from a knowledgeable collaborator, not a bureaucratic checklist.

---

## 5. Tone calibration

```
Professional: clear, direct, no filler, respects the reader's time
Playful: energetic, light wordplay only when it lands cleanly, avoid forced puns
...
```

**Why six definitions instead of just passing the tone name:** Without definitions, "playful" and "friendly" produce nearly identical output. "Bold" and "authoritative" blur together. The definitions give each tone a distinct behavioral fingerprint Claude can apply mechanically.

**Why "the JSON structure itself is always precise and neutral":** Without this, Claude sometimes makes the JSON itself casual (e.g., headlines written in a casual register that bleeds into field values, or extra commentary in the `risks` field that sounds "friendly"). The separation prevents tone from infecting the data structure.

**Why "light wordplay only when it lands cleanly, avoid forced puns":** Left to its own devices, Claude's "playful" mode produces groan-worthy puns. The qualifier suppresses this while preserving genuine wit.

---

## 6. Anti-hallucination: no invented data

```
Do not cite statistics, market size figures, or research findings unless the marketer included them in the brief.
Write around the gap — "position the brand as the fastest option in this category" not "87% of users report saving time."
```

**Why this is the most important guardrail:** Marketing copy that includes fake statistics is legally and reputationally dangerous. Without this instruction, Claude routinely invents plausible-sounding research to support campaign claims. The model's confidence makes invented statistics especially risky — they read as credible.

**Why provide the "write around the gap" technique:** Telling Claude not to do something (no statistics) can cause it to produce weaker output unless you also tell it what to do instead. The alternative technique — directional claims without false precision — maintains persuasiveness without fabrication.

**Why "unless the marketer included them in the brief":** Marketers often have real data they want to use. A blanket "no statistics" rule would prevent them from leveraging legitimate research. The exception preserves this while blocking fabrication.

---

## 7. Channel scope

```
Only include channelPlan entries for the channels listed in the brief.
Do not suggest additional channels or note that they would be beneficial.
```

**Why this seems obvious but isn't:** Claude's "helpful" prior leads it to add channels the marketer didn't ask for, wrapped in suggestions ("and you should also consider TikTok for this audience"). This clutters structured output and defeats the point of having a channel selector in the form. The rule must be explicit.

---

## 8. Regulated industries

```
If the product is in [regulated categories], include a risk item explicitly stating that all copy and claims require compliance and legal review before use. Do not refuse to plan — flag the requirement as a risk.
```

**Why flag rather than refuse:** Refusing to plan for alcohol or financial products would make the agent useless for a huge segment of legitimate marketing work. The professional response is to plan while explicitly noting the compliance requirement — that's what a senior marketer at an agency would do.

**Why put it in `risks` rather than a separate field:** The risks array is designed for exactly this kind of "things to watch before you use this plan" information. It's where a reviewer would look for caveats. Adding a separate `complianceWarning` field would complicate the type and the output display.

---

## 9. Harmful briefs via clarification

```
If the brief appears to promote deception, harassment, or harm, route to mode clarify with a question asking the marketer to describe what the product does and who it is for. Do not reference your concern within the JSON.
```

**Why route to clarify rather than refuse with an error:** We need the output format to always be valid JSON. An error response (plain text, or a JSON error object) breaks the type contract and requires special client-side handling. Routing to `mode: "clarify"` keeps the output parseable and the UI consistent.

**Why "do not reference your concern":** If Claude adds something like `"questions": ["Can you clarify? I'm concerned this may be promoting harm."]`, the clarification UI would render that question to the marketer, which is weird and confrontational. The question should be neutral — "Can you describe what this product does and who it's for?" gets the information we need without telegraphing concern.

---

## 10. renderBrief — the user-turn format

```ts
export function renderBrief(brief: Brief): string {
  return `Please create a campaign plan for the following brief:

Product name: ${brief.productName}
...`
}
```

**Why key-value format instead of prose or JSON:** Structured key-value is the most reliable input format for extracting structured output. It's unambiguous (no parsing of prose required), easy to read, and aligns with how Claude processes labelled data. Sending the brief as JSON would work too, but looks odd as a user-turn message.

**Why "Please create a campaign plan":** The polite request framing signals this is a genuine user instruction, not a continuation of the system prompt. It also gives the model a clear task statement even if the system prompt becomes large.

**Why include channel names as comma-separated strings:** The `channelPlan` in the output must match channels from the brief. Rendering them as readable names ("Social, Email") rather than IDs lets the model match them directly without a lookup table.

**Why this function lives in `systemPrompt.ts`:** How the brief is formatted for the model is a prompt engineering decision — it affects what the model sees and how it interprets the input. Co-locating `renderBrief` with `SYSTEM_PROMPT` makes it obvious that these two things are designed together. Putting it in the API route would treat it as a data transformation concern, which it isn't.

---

## What to iterate on

These are the sections most likely to need tuning after real testing:

1. **Mode-selection threshold** — the criteria for when to clarify may be too strict or too loose. Watch for: always-plan (hallucinated plans for vague briefs) vs always-clarify (questions even for well-specified briefs).

2. **Insight field quality** — this is the hardest field to get right. If insights feel generic, add a negative example: "Not acceptable: 'Developers value efficiency.' Acceptable: 'Engineers at growth-stage startups spend more time managing tooling than building product — and they feel the cost every sprint.'"

3. **Headline diversity** — if all headlines sound alike, add an explicit instruction to vary the rhetorical device (question, statement, command, contrast).

4. **Tone definitions** — the six definitions are first-pass. Some may produce outputs that feel identical. Test each tone with the same brief and compare the headlines.
