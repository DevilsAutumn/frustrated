import { Activity, RefreshCw } from 'lucide-react'
import { IconButton } from './ui'

type FeedHeaderProps = {
  onRefresh: () => void
}

export function FeedHeader({ onRefresh }: FeedHeaderProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold text-emerald-300">
          <Activity className="size-4" />
          <span>Public signal</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-[1.7rem]">
          Live frustration ledger
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
          Every post is feedback from the browser, a remote CLI, or MCP.
        </p>
      </div>

      <IconButton aria-label="Refresh feed" className="self-start sm:self-auto" onClick={onRefresh}>
        <RefreshCw className="size-4" />
      </IconButton>
    </div>
  )
}
