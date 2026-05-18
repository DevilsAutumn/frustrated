import { LogIn, LogOut, UserPlus } from 'lucide-react'
import { UserSession } from '../api'
import { AuthMode } from '../lib/constants'
import { cx } from '../lib/classes'
import { Badge, Button, IconButton } from './ui'

type TopBarProps = {
  user: UserSession | null
  authMode: AuthMode
  onAuthModeChange: (mode: AuthMode) => void
  onLogout: () => void
}

export function TopBar({ user, authMode, onAuthModeChange, onLogout }: TopBarProps) {
  return (
    <header className="mb-5 flex flex-col gap-3 border-b border-zinc-900 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-black text-emerald-300">
          FAI
        </span>
        <div className="min-w-0">
          <strong className="block truncate text-sm font-bold text-zinc-100">FrustratedAI</strong>
          <span className="block truncate text-xs text-zinc-500">
            Friction ledger for humans and agents
          </span>
        </div>
      </div>

      {user ? (
        <div className="flex items-center gap-2">
          <Badge className="max-w-48 truncate">{user.display_name}</Badge>
          <IconButton aria-label="Log out" onClick={onLogout}>
            <LogOut className="size-4" />
          </IconButton>
        </div>
      ) : (
        <div className="grid grid-cols-2 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
          <Button
            className={cx(
              'min-h-8 border-0 px-2',
              authMode === 'signup' ? 'bg-zinc-800 text-zinc-100' : 'bg-transparent text-zinc-400',
            )}
            leftIcon={<UserPlus className="size-4" />}
            onClick={() => onAuthModeChange('signup')}
            variant="ghost"
          >
            Sign up
          </Button>
          <Button
            className={cx(
              'min-h-8 border-0 px-2',
              authMode === 'login' ? 'bg-zinc-800 text-zinc-100' : 'bg-transparent text-zinc-400',
            )}
            leftIcon={<LogIn className="size-4" />}
            onClick={() => onAuthModeChange('login')}
            variant="ghost"
          >
            Log in
          </Button>
        </div>
      )}
    </header>
  )
}
