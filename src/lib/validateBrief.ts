import type { Brief } from "@/types/campaign"

const ALLOWED_GOALS = ["awareness", "consideration", "conversion", "retention"]
const ALLOWED_CHANNELS = ["social", "email", "display", "search", "content", "influencer"]
const ALLOWED_TONES = ["professional", "playful", "bold", "friendly", "authoritative", "empathetic"]

const INJECTION_PATTERNS = [
  /ignore\s+(previous|prior|all)\s+instructions/i,
  /system\s*:/i,
  /\[INST\]/i,
  /<\|im_start\|>/i,
  /you\s+are\s+now/i,
  /forget\s+(everything|all|your)/i,
]

function hasInjection(value: string): boolean {
  return INJECTION_PATTERNS.some((p) => p.test(value))
}

export type ValidationResult =
  | { valid: true; brief: Brief }
  | { valid: false; error: string }

export function validateBrief(body: unknown): ValidationResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { valid: false, error: "Request body must be a JSON object" }
  }

  const b = body as Record<string, unknown>

  if (typeof b.productName !== "string" || b.productName.trim().length === 0)
    return { valid: false, error: "productName is required" }
  if (b.productName.length > 100)
    return { valid: false, error: "productName must be 100 characters or fewer" }
  if (hasInjection(b.productName))
    return { valid: false, error: "productName contains invalid content" }

  if (typeof b.productDescription !== "string" || b.productDescription.trim().length === 0)
    return { valid: false, error: "productDescription is required" }
  if (b.productDescription.length > 1000)
    return { valid: false, error: "productDescription must be 1000 characters or fewer" }
  if (hasInjection(b.productDescription))
    return { valid: false, error: "productDescription contains invalid content" }

  if (typeof b.audience !== "string" || b.audience.trim().length === 0)
    return { valid: false, error: "audience is required" }
  if (b.audience.length > 500)
    return { valid: false, error: "audience must be 500 characters or fewer" }
  if (hasInjection(b.audience))
    return { valid: false, error: "audience contains invalid content" }

  if (typeof b.goal !== "string" || !ALLOWED_GOALS.includes(b.goal))
    return { valid: false, error: `goal must be one of: ${ALLOWED_GOALS.join(", ")}` }

  if (!Array.isArray(b.channels) || b.channels.length === 0)
    return { valid: false, error: "at least one channel is required" }
  const invalidChannels = (b.channels as unknown[]).filter((c) => !ALLOWED_CHANNELS.includes(c as string))
  if (invalidChannels.length > 0)
    return { valid: false, error: `invalid channels: ${invalidChannels.join(", ")}` }

  if (typeof b.tone !== "string" || !ALLOWED_TONES.includes(b.tone))
    return { valid: false, error: `tone must be one of: ${ALLOWED_TONES.join(", ")}` }

  return {
    valid: true,
    brief: {
      productName: b.productName.trim(),
      productDescription: b.productDescription.trim(),
      audience: b.audience.trim(),
      goal: b.goal,
      channels: b.channels as string[],
      tone: b.tone,
    },
  }
}
