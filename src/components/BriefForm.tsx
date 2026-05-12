"use client"

import { useState } from "react"
import type { Brief, AgentResponse } from "@/types/campaign"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const CHANNELS = [
  { id: "social", label: "Social" },
  { id: "email", label: "Email" },
  { id: "display", label: "Display" },
  { id: "search", label: "Search" },
  { id: "content", label: "Content / SEO" },
  { id: "influencer", label: "Influencer" },
]

const EMPTY: Brief = {
  productName: "",
  productDescription: "",
  audience: "",
  goal: "",
  channels: [],
  tone: "",
}

function isComplete(f: Brief): boolean {
  return (
    f.productName.trim().length > 0 &&
    f.productDescription.trim().length > 0 &&
    f.audience.trim().length > 0 &&
    f.goal.length > 0 &&
    f.channels.length > 0 &&
    f.tone.length > 0
  )
}

interface Props {
  onResult: (result: AgentResponse, brief: Brief) => void
  initialValues?: Brief
}

export function BriefForm({ onResult, initialValues }: Props) {
  const [fields, setFields] = useState<Brief>(initialValues ?? EMPTY)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof Brief>(key: K, value: Brief[K]) {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  function toggleChannel(id: string, checked: boolean) {
    setFields((prev) => ({
      ...prev,
      channels: checked
        ? [...prev.channels, id]
        : prev.channels.filter((c) => c !== id),
    }))
  }

  async function submit() {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong. Please try again.")
        return
      }
      onResult(data as AgentResponse, fields)
    } catch {
      setError("Network error — check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    submit()
  }

  const valid = isComplete(fields)

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-md border-t-4 border-t-indigo-500 overflow-visible">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold">Campaign brief</CardTitle>
        <p className="text-sm text-muted-foreground">
          Fill in what you know — the more detail you provide, the sharper the campaign plan.
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Product</h3>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="productName" className="text-sm font-medium">
                Product name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="productName"
                placeholder="e.g. Notion for engineering teams"
                value={fields.productName}
                onChange={(e) => set("productName", e.target.value)}
                className="h-10"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="productDescription" className="text-sm font-medium">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="productDescription"
                placeholder="What it does, who makes it, what makes it different from alternatives"
                rows={3}
                value={fields.productDescription}
                onChange={(e) => set("productDescription", e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="audience" className="text-sm font-medium">
              Target audience <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="audience"
              placeholder="e.g. Senior engineers at Series B startups who manage their own tooling budget"
              rows={2}
              value={fields.audience}
              onChange={(e) => set("audience", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="goal" className="text-sm font-medium">
              Campaign goal <span className="text-destructive">*</span>
            </Label>
            <select
              id="goal"
              value={fields.goal}
              onChange={(e) => e.target.value && set("goal", e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 text-foreground"
            >
              <option value="" disabled>Select a goal…</option>
              <option value="awareness">Awareness</option>
              <option value="consideration">Consideration</option>
              <option value="conversion">Conversion</option>
              <option value="retention">Retention</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">
              Channels <span className="text-destructive">*</span>
              <span className="ml-1 font-normal text-muted-foreground">(select at least one)</span>
            </Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CHANNELS.map((ch) => (
                <div key={ch.id} className="flex items-center gap-2">
                  <Checkbox
                    id={ch.id}
                    checked={fields.channels.includes(ch.id)}
                    onCheckedChange={(checked) => toggleChannel(ch.id, Boolean(checked))}
                    className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                  />
                  <Label htmlFor={ch.id} className="font-normal cursor-pointer text-sm">
                    {ch.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tone" className="text-sm font-medium">
              Tone <span className="text-destructive">*</span>
            </Label>
            <select
              id="tone"
              value={fields.tone}
              onChange={(e) => e.target.value && set("tone", e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 text-foreground"
            >
              <option value="" disabled>Select a tone…</option>
              <option value="professional">Professional</option>
              <option value="playful">Playful</option>
              <option value="bold">Bold</option>
              <option value="friendly">Friendly</option>
              <option value="authoritative">Authoritative</option>
              <option value="empathetic">Empathetic</option>
            </select>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 flex items-start justify-between gap-3">
              <p className="text-sm text-red-700 leading-relaxed">{error}</p>
              <button
                type="button"
                onClick={() => submit()}
                className="shrink-0 text-xs font-semibold text-red-700 underline underline-offset-2 hover:text-red-900"
              >
                Try again
              </button>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
            disabled={!valid || isLoading}
          >
            {isLoading ? "Drafting your campaign…" : "Generate campaign plan"}
          </Button>

        </form>
      </CardContent>
    </Card>
  )
}
