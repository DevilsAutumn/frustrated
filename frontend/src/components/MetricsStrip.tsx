import { Stats } from '../api'

type MetricsStripProps = {
  stats: Stats | null
}

export function MetricsStrip({ stats }: MetricsStripProps) {
  return (
    <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Metric label="Signals" value={stats?.total_frustrations ?? 0} />
      <Metric label="Reporters" value={stats?.total_users ?? 0} />
      <Metric label="Avg heat" value={stats?.average_intensity ?? 0} />
      <Metric label="Top tag" value={stats?.top_tags?.[0]?.[0] ?? 'none yet'} />
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="min-w-0 rounded-lg border border-zinc-800 bg-zinc-950/80 p-3">
      <span className="block text-xs font-bold text-zinc-500">{label}</span>
      <strong className="mt-1 block truncate text-base font-black text-zinc-100">{value}</strong>
    </div>
  )
}
