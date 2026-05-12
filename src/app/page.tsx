import { CampaignApp } from "@/components/CampaignApp"

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-2xl flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <span className="inline-flex w-fit items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 tracking-wide uppercase">
            AI-powered
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Marketing Brief{" "}
            <span className="text-indigo-600">→</span>{" "}
            Campaign Agent
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Powered by Claude. Fill in a brief and get a structured campaign
            plan — or targeted questions if more detail is needed.
          </p>
        </div>

        <CampaignApp />
      </div>
    </main>
  )
}
