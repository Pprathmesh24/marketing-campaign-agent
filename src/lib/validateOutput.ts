import type { AgentResponse, CampaignPlan } from "@/types/campaign"

function isCampaignPlan(val: unknown): val is CampaignPlan {
  if (!val || typeof val !== "object" || Array.isArray(val)) return false
  const v = val as Record<string, unknown>

  if (typeof v.insight !== "string") return false

  if (!v.concept || typeof v.concept !== "object" || Array.isArray(v.concept)) return false
  const concept = v.concept as Record<string, unknown>
  if (typeof concept.name !== "string" || typeof concept.bigIdea !== "string") return false

  if (!Array.isArray(v.headlines) || v.headlines.length === 0) return false
  if (!v.headlines.every((h) => typeof h === "string")) return false

  if (!Array.isArray(v.channelPlan) || v.channelPlan.length === 0) return false
  if (!v.channelPlan.every((cp) => {
    if (!cp || typeof cp !== "object" || Array.isArray(cp)) return false
    const c = cp as Record<string, unknown>
    return typeof c.channel === "string" && typeof c.angle === "string" && typeof c.format === "string"
  })) return false

  if (!Array.isArray(v.metrics)) return false
  if (!v.metrics.every((m) => typeof m === "string")) return false

  if (!Array.isArray(v.risks)) return false
  if (!v.risks.every((r) => typeof r === "string")) return false

  return true
}

export function isAgentResponse(val: unknown): val is AgentResponse {
  if (!val || typeof val !== "object" || Array.isArray(val)) return false
  const v = val as Record<string, unknown>

  if (v.mode === "plan") return isCampaignPlan(v.data)

  if (v.mode === "clarify") {
    return (
      Array.isArray(v.questions) &&
      v.questions.length > 0 &&
      v.questions.every((q) => typeof q === "string")
    )
  }

  return false
}
