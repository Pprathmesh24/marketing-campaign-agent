import { NextRequest, NextResponse } from "next/server"
import { anthropic, MODEL_ID } from "@/lib/anthropic"
import { SYSTEM_PROMPT, renderBrief } from "@/lib/systemPrompt"
import { validateBrief } from "@/lib/validateBrief"
import { isAgentResponse } from "@/lib/validateOutput"
import type { Brief, AgentResponse } from "@/types/campaign"

// Returns a validated AgentResponse, or null if Claude's output fails shape validation.
// Throws on API-level errors (auth, rate limit, network) — those should not be retried.
async function callClaude(brief: Brief): Promise<AgentResponse | null> {
  const response = await anthropic.messages.create({
    model: MODEL_ID,
    max_tokens: 2048,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: renderBrief(brief) }],
  })

  const block = response.content[0]
  if (!block || block.type !== "text") return null

  try {
    const parsed: unknown = JSON.parse(block.text)
    return isAgentResponse(parsed) ? parsed : null
  } catch {
    return null
  }
}

const MAX_ATTEMPTS = 2

export async function POST(req: NextRequest) {
  const body: unknown = await req.json()
  const validation = validateBrief(body)

  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  let result: AgentResponse | null = null

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      result = await callClaude(validation.brief)
      if (result) break
      console.warn(`Attempt ${attempt}: output shape invalid, retrying...`)
    } catch (err) {
      console.error(`Attempt ${attempt}: API error:`, err)
      return NextResponse.json({ error: "Model call failed" }, { status: 502 })
    }
  }

  if (!result) {
    console.error("Both attempts produced invalid output")
    return NextResponse.json({ error: "Model produced invalid output" }, { status: 502 })
  }

  return NextResponse.json(result)
}
