import type { CampaignPlan } from "@/types/campaign"

export function toMarkdown(plan: CampaignPlan): string {
  const lines: string[] = []

  lines.push(`# ${plan.concept.name}`)
  lines.push("")
  lines.push(`*${plan.concept.bigIdea}*`)
  lines.push("")

  lines.push("## Audience Insight")
  lines.push("")
  lines.push(plan.insight)
  lines.push("")

  lines.push("## Headlines")
  lines.push("")
  plan.headlines.forEach((h, i) => lines.push(`${i + 1}. ${h}`))
  lines.push("")

  lines.push("## Channel Plan")
  lines.push("")
  plan.channelPlan.forEach((ch) => {
    lines.push(`### ${ch.channel}`)
    lines.push("")
    lines.push(ch.angle)
    lines.push("")
    lines.push(`**Format:** ${ch.format}`)
    lines.push("")
  })

  lines.push("## Metrics")
  lines.push("")
  plan.metrics.forEach((m) => lines.push(`- ${m}`))
  lines.push("")

  lines.push("## Risks")
  lines.push("")
  plan.risks.forEach((r) => lines.push(`- ${r}`))

  return lines.join("\n")
}
