"use client"

import { useState } from "react"
import type { AgentResponse, Brief } from "@/types/campaign"
import { BriefForm } from "@/components/BriefForm"
import { CampaignOutput } from "@/components/CampaignOutput"
import { Clarification } from "@/components/Clarification"

export function CampaignApp() {
  const [result, setResult] = useState<AgentResponse | null>(null)
  const [lastBrief, setLastBrief] = useState<Brief | null>(null)

  function handleResult(response: AgentResponse, brief: Brief) {
    setLastBrief(brief)
    setResult(response)
  }

  if (result?.mode === "plan") {
    return (
      <CampaignOutput
        plan={result.data}
        onReset={() => { setResult(null); setLastBrief(null) }}
      />
    )
  }

  if (result?.mode === "clarify") {
    return (
      <Clarification
        questions={result.questions}
        onReset={() => setResult(null)}
      />
    )
  }

  return <BriefForm onResult={handleResult} initialValues={lastBrief ?? undefined} />
}
