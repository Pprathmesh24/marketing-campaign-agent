// The system prompt's JSON examples and lib/validateOutput.ts must stay
// in sync with these types — they are the single source of truth for the
// data contract between the form, the API route, and the Claude response.

export type Brief = {
  productName: string
  productDescription: string
  audience: string
  goal: string
  channels: string[]
  tone: string
}

export type CampaignPlan = {
  insight: string                  // 1-2 sentence audience truth the campaign is built on
  concept: {
    name: string                   // memorable campaign name
    bigIdea: string                // the core creative idea in one sentence
  }
  headlines: string[]              // 3-5 sample headlines that express the concept
  channelPlan: Array<{
    channel: string                // matches a value from Brief.channels
    angle: string                  // the specific message angle for this channel
    format: string                 // e.g. "15s video", "carousel", "newsletter"
  }>
  metrics: string[]                // 3-4 measurable KPIs
  risks: string[]                  // 2-3 things to watch / potential failure modes
}

export type AgentResponse =
  | { mode: "plan"; data: CampaignPlan }
  | { mode: "clarify"; questions: string[] }
