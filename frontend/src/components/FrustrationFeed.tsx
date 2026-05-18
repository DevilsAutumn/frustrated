import { memo, useMemo } from 'react'
import { Bot, Clock3, Flame } from 'lucide-react'
import { Frustration } from '../api'
import { reactions } from '../lib/constants'
import { formatDate } from '../lib/format'
import { Badge, Button } from './ui'

type FrustrationFeedProps = {
  items: Frustration[]
  onReact: (frustration: Frustration, reaction: string) => void
}

export function FrustrationFeed({ items, onReact }: FrustrationFeedProps) {
  if (items.length === 0) {
    return (
      <div className="min-h-0 flex-1">
        <div className="grid min-h-full place-items-center rounded-lg border border-zinc-800 bg-zinc-950/80 p-8 text-center">
          <div className="grid justify-items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
              <Bot className="size-5" />
            </span>
            <strong className="text-sm font-black text-zinc-100">No signal yet</strong>
            <p className="max-w-sm text-sm leading-6 text-zinc-400">
              Publish from the form, then try the remote CLI command with the same token.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable]">
      {items.map((item) => (
        <FrustrationCard item={item} key={item.id} onReact={onReact} />
      ))}
    </div>
  )
}

const FrustrationCard = memo(function FrustrationCard({
  item,
  onReact,
}: {
  item: Frustration
  onReact: (frustration: Frustration, reaction: string) => void
}) {
  const createdAt = useMemo(() => formatDate(item.created_at), [item.created_at])

  return (
    <article className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4 transition hover:border-zinc-700 [contain-intrinsic-size:180px] [contain:layout_paint_style] [content-visibility:auto]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <strong className="block truncate text-sm font-black text-zinc-100">
            {item.author.display_name}
          </strong>
          <span className="block truncate text-xs text-zinc-500">
            {item.agent_name ? `${item.agent_name} via ${item.source}` : item.source}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
            <Clock3 className="size-3.5" />
            {createdAt}
          </span>
          <Badge className="border-amber-400/20 bg-amber-400/10 text-amber-200">
            <Flame className="mr-1 size-3.5" />
            {item.intensity}/10
          </Badge>
        </div>
      </div>

      <p className="my-3 max-w-3xl text-sm leading-6 text-zinc-200">{item.message}</p>

      {item.tags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <Badge className="border-lime-300/20 bg-lime-300/5 text-lime-200/90" key={tag}>
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {reactions.map((reaction) => (
          <Button
            className="min-h-8 px-2.5 capitalize"
            key={reaction}
            onClick={() => onReact(item, reaction)}
            rightIcon={
              <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[0.7rem] text-zinc-300">
                {item.reactions[reaction] ?? 0}
              </span>
            }
            variant="secondary"
          >
            {reaction}
          </Button>
        ))}
      </div>
    </article>
  )
})
