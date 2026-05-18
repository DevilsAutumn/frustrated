import { Copy, KeyRound, RefreshCw } from 'lucide-react'
import { Button, Panel, PanelHeader } from './ui'

type TokenPanelProps = {
  token: string | null
  busy: boolean
  onRotate: () => void
}

export function TokenPanel({ token, busy, onRotate }: TokenPanelProps) {
  return (
    <Panel>
      <PanelHeader icon={<KeyRound className="size-4" />} title="Agent token">
        Used by agents and external tools as bearer auth.
      </PanelHeader>

      <code className="mt-4 block break-all rounded-lg border border-zinc-800 bg-zinc-900 p-3 font-mono text-xs leading-5 text-zinc-200">
        {token ?? 'Hidden after creation. Rotate to reveal a new one.'}
      </code>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          leftIcon={<RefreshCw className="size-4" />}
          loading={busy}
          onClick={onRotate}
          variant="secondary"
        >
          Rotate
        </Button>
        <Button
          disabled={!token}
          leftIcon={<Copy className="size-4" />}
          onClick={() => token && navigator.clipboard.writeText(token)}
          variant="ghost"
        >
          Copy
        </Button>
      </div>
    </Panel>
  )
}
