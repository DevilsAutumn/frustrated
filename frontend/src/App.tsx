import { FormEvent, useCallback, useEffect, useState } from 'react'
import { CircleAlert } from 'lucide-react'
import { api, Frustration, Stats, UserSession } from './api'
import { AuthPanel } from './components/AuthPanel'
import { ComposerPanel } from './components/ComposerPanel'
import { FeedHeader } from './components/FeedHeader'
import { FrustrationFeed } from './components/FrustrationFeed'
import { MetricsStrip } from './components/MetricsStrip'
import { TokenPanel } from './components/TokenPanel'
import { TopBar } from './components/TopBar'
import { AuthMode, sessionKey } from './lib/constants'
import { errorMessage } from './lib/format'

function storedToken() {
  return localStorage.getItem(sessionKey)
}

export function App() {
  const [sessionToken, setSessionToken] = useState<string | null>(storedToken)
  const [user, setUser] = useState<UserSession | null>(null)
  const [feed, setFeed] = useState<Frustration[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [authMode, setAuthMode] = useState<AuthMode>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [message, setMessage] = useState('')
  const [tags, setTags] = useState('llm, friction')
  const [intensity, setIntensity] = useState(6)
  const [visibleApiToken, setVisibleApiToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const loadPublicData = useCallback(async () => {
    const [feedResponse, statsResponse] = await Promise.all([api.feed(), api.stats()])
    setFeed(feedResponse.items)
    setStats(statsResponse)
  }, [])

  useEffect(() => {
    loadPublicData().catch((caught: unknown) => setError(errorMessage(caught)))
  }, [loadPublicData])

  useEffect(() => {
    if (!sessionToken) {
      setUser(null)
      return
    }
    api
      .me(sessionToken)
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(sessionKey)
        setSessionToken(null)
      })
  }, [sessionToken])

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const response =
        authMode === 'signup'
          ? await api.signup({ email, password, display_name: displayName })
          : await api.login({ email, password })
      localStorage.setItem(sessionKey, response.token)
      setSessionToken(response.token)
      setUser(response.user)
      setVisibleApiToken(response.user.api_token ?? null)
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  async function submitFrustration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!sessionToken) return
    setBusy(true)
    setError(null)
    try {
      await api.createFrustration(sessionToken, {
        message,
        source: 'web',
        intensity,
        tags: tags.split(',').map((tag) => tag.trim()),
      })
      setMessage('')
      await loadPublicData()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  async function rotateApiToken() {
    if (!sessionToken) return
    setBusy(true)
    setError(null)
    try {
      const response = await api.rotateToken(sessionToken)
      setVisibleApiToken(response.api_token)
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  function logout() {
    localStorage.removeItem(sessionKey)
    setSessionToken(null)
    setUser(null)
    setVisibleApiToken(null)
  }

  const reactTo = useCallback(async (frustration: Frustration, reaction: string) => {
    try {
      const nextReactions = await api.react(frustration.id, reaction)
      setFeed((items) =>
        items.map((item) =>
          item.id === frustration.id ? { ...item, reactions: nextReactions } : item,
        ),
      )
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }, [])

  return (
    <main className="h-dvh overflow-hidden bg-zinc-950 text-zinc-100 antialiased">
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <TopBar user={user} authMode={authMode} onAuthModeChange={setAuthMode} onLogout={logout} />

        {error && (
          <div
            className="mb-4 flex items-start gap-3 rounded-lg border border-red-900/70 bg-red-950/50 p-3 text-sm text-red-100"
            role="alert"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-red-300" />
            <div>
              <strong className="block font-semibold">Request failed</strong>
              <span className="text-red-200/90">{error}</span>
            </div>
          </div>
        )}

        <section className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[minmax(300px,360px)_minmax(0,1fr)]">
          <aside className="min-w-0 space-y-3 lg:sticky lg:top-4">
            {user ? (
              <>
                <ComposerPanel
                  message={message}
                  tags={tags}
                  intensity={intensity}
                  busy={busy}
                  onMessageChange={setMessage}
                  onTagsChange={setTags}
                  onIntensityChange={setIntensity}
                  onSubmit={submitFrustration}
                />
                <TokenPanel token={visibleApiToken} busy={busy} onRotate={rotateApiToken} />
              </>
            ) : (
              <AuthPanel
                mode={authMode}
                email={email}
                password={password}
                displayName={displayName}
                busy={busy}
                onEmailChange={setEmail}
                onPasswordChange={setPassword}
                onDisplayNameChange={setDisplayName}
                onSubmit={submitAuth}
              />
            )}
          </aside>

          <section className="flex min-h-0 min-w-0 flex-col">
            <FeedHeader onRefresh={loadPublicData} />
            <MetricsStrip stats={stats} />
            <FrustrationFeed items={feed} onReact={reactTo} />
          </section>
        </section>
      </div>
    </main>
  )
}
