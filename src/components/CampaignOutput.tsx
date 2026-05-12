"use client"

import { useState } from "react"
import type { CampaignPlan } from "@/types/campaign"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toMarkdown } from "@/lib/exporters"

interface Props {
  plan: CampaignPlan
  onReset: () => void
}

export function CampaignOutput({ plan, onReset }: Props) {
  const [copied, setCopied] = useState<"json" | "markdown" | null>(null)

  function copy(type: "json" | "markdown") {
    const text =
      type === "json"
        ? JSON.stringify({ mode: "plan", data: plan }, null, 2)
        : toMarkdown(plan)
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="flex flex-col gap-6">

      <div className="rounded-xl bg-slate-900 text-white px-6 py-6 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Campaign concept</p>
          <h2 className="text-2xl font-bold leading-tight">{plan.concept.name}</h2>
          <p className="text-sm text-slate-300 leading-relaxed mt-1">{plan.concept.bigIdea}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="shrink-0 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          New brief
        </Button>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => copy("markdown")}
          className="text-xs"
        >
          {copied === "markdown" ? "Copied!" : "Copy as Markdown"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => copy("json")}
          className="text-xs"
        >
          {copied === "json" ? "Copied!" : "Copy as JSON"}
        </Button>
      </div>

      <Card className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Audience insight
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-amber-900 dark:text-amber-200">{plan.insight}</p>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Headlines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-col gap-2">
            {plan.headlines.map((h, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="text-indigo-400 font-semibold shrink-0 w-5 text-right">{i + 1}.</span>
                <span className="leading-relaxed">{h}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Channel plan
        </h3>
        {plan.channelPlan.map((ch) => (
          <Card key={ch.channel} className="border-l-4 border-l-indigo-500 rounded-l-none shadow-none">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-semibold capitalize text-slate-800 dark:text-slate-200">
                {ch.channel}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 pt-0">
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{ch.angle}</p>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-medium">Format:</span> {ch.format}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {plan.metrics.map((m, i) => (
                <li key={i} className="flex gap-2 text-sm text-emerald-900 dark:text-emerald-200">
                  <span className="text-emerald-400 shrink-0 font-bold">—</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-orange-50/50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-orange-700 dark:text-orange-400">
              Risks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {plan.risks.map((r, i) => (
                <li key={i} className="flex gap-2 text-sm text-orange-900 dark:text-orange-200">
                  <span className="text-orange-400 shrink-0 font-bold">—</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
