import { FormEvent } from 'react'
import { LogIn, Sparkles, UserPlus } from 'lucide-react'
import { AuthMode } from '../lib/constants'
import { Button, Panel, PanelHeader, TextField } from './ui'

type AuthPanelProps = {
  mode: AuthMode
  email: string
  password: string
  displayName: string
  busy: boolean
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onDisplayNameChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function AuthPanel({
  mode,
  email,
  password,
  displayName,
  busy,
  onEmailChange,
  onPasswordChange,
  onDisplayNameChange,
  onSubmit,
}: AuthPanelProps) {
  const isSignup = mode === 'signup'

  return (
    <Panel>
      <PanelHeader
        icon={<Sparkles className="size-4" />}
        title={isSignup ? 'Create workspace' : 'Welcome back'}
      >
        Start with a token, then let web, CLI, and MCP publish to the same feed.
      </PanelHeader>

      <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
        {isSignup && (
          <TextField
            autoComplete="name"
            label="Display name"
            onChange={(event) => onDisplayNameChange(event.currentTarget.value)}
            required
            value={displayName}
          />
        )}
        <TextField
          autoComplete="email"
          label="Email"
          onChange={(event) => onEmailChange(event.currentTarget.value)}
          required
          type="email"
          value={email}
        />
        <TextField
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          label="Password"
          minLength={8}
          onChange={(event) => onPasswordChange(event.currentTarget.value)}
          required
          type="password"
          value={password}
        />
        <Button
          className="mt-1 w-full"
          leftIcon={isSignup ? <UserPlus className="size-4" /> : <LogIn className="size-4" />}
          loading={busy}
          type="submit"
          variant="primary"
        >
          {isSignup ? 'Sign up' : 'Log in'}
        </Button>
      </form>
    </Panel>
  )
}
