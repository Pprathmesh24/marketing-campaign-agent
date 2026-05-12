"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  questions: string[]
  onReset: () => void
}

export function Clarification({ questions, onReset }: Props) {
  return (
    <div className="flex flex-col gap-6">

      <div className="rounded-xl bg-slate-900 text-white px-6 py-6 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Before we plan</p>
          <h2 className="text-xl font-bold">A few things before we plan</h2>
          <p className="text-sm text-slate-300 leading-relaxed mt-1">
            The brief needs a bit more detail to produce a useful campaign plan.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="shrink-0 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          Edit brief
        </Button>
      </div>

      <Card className="shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Clarifying questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-col gap-4">
            {questions.map((q, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="text-indigo-500 font-semibold shrink-0 w-5 text-right">{i + 1}.</span>
                <span className="leading-relaxed text-slate-700">{q}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Button
        onClick={onReset}
        className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
      >
        Update brief and try again
      </Button>

    </div>
  )
}
