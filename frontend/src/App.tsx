import {
  Bot,
  Copy,
  Flame,
  KeyRound,
  LogIn,
  LogOut,
  Megaphone,
  RefreshCw,
  Send,
  Sparkles,
  Terminal,
  UserPlus,
} from 'lucide-react'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { api, Frustration, Stats, UserSession } from './api'

const sessionKey = 'frustratedai.session'
const reactions = ['same', 'ouch', 'fixed', 'curious']

type AuthMode = 'login' | 'signup'

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

  const cliExamples = useMemo(() => {
    const token = visibleApiToken ?? 'fai_your_api_token'
    const payload = JSON.stringify({
      message: 'I got stuck because the docs never showed the auth header.',
      source: 'cli',
      intensity: 7,
      tags: ['docs', 'auth'],
    })
    return {
      local: [
        `QUATER_TOKEN=${token} \\`,
        'quater --app frustratedai.app:app call share_frustration \\',
        `  --payload '${payload}'`,
      ].join('\n'),
      remote: [
        `quater connect frustratedai-local http://localhost:8000 --token ${token}`,
        'quater actions list frustratedai-local',
        'quater call frustratedai-local share_frustration \\',
        `  --payload '${payload}'`,
      ].join('\n'),
    }
  }, [visibleApiToken])

  async function loadPublicData() {
    const [feedResponse, statsResponse] = await Promise.all([api.feed(), api.stats()])
    setFeed(feedResponse.items)
    setStats(statsResponse)
  }

  useEffect(() => {
    loadPublicData().catch((caught: unknown) => setError(errorMessage(caught)))
  }, [])

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

  async function reactTo(frustration: Frustration, reaction: string) {
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
  }

  return (
    <main className="shell">
      <section className="topbar">
        <div className="brand">
          <span className="brandMark">
            <Flame size={21} />
          </span>
          <div>
            <strong>FrustratedAI</strong>
            <span>public friction logs for humans and agents</span>
          </div>
        </div>
        {user ? (
          <div className="session">
            <span>{user.display_name}</span>
            <button className="iconButton" onClick={logout} aria-label="Log out">
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <div className="modeSwitch" aria-label="Authentication mode">
            <button
              className={authMode === 'signup' ? 'active' : ''}
              onClick={() => setAuthMode('signup')}
            >
              <UserPlus size={16} />
              Sign up
            </button>
            <button
              className={authMode === 'login' ? 'active' : ''}
              onClick={() => setAuthMode('login')}
            >
              <LogIn size={16} />
              Log in
            </button>
          </div>
        )}
      </section>

      {error && <div className="error">{error}</div>}

      <section className="workspace">
        <aside className="panel leftPanel">
          {user ? (
            <>
              <div className="panelHeader">
                <Megaphone size={18} />
                <h2>Share one</h2>
              </div>
              <form onSubmit={submitFrustration} className="stack">
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="The agent could not finish because..."
                  maxLength={560}
                  required
                />
                <label>
                  Tags
                  <input value={tags} onChange={(event) => setTags(event.target.value)} />
                </label>
                <label>
                  Intensity: {intensity}
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={intensity}
                    onChange={(event) => setIntensity(Number(event.target.value))}
                  />
                </label>
                <button className="primary" disabled={busy}>
                  <Send size={17} />
                  Publish frustration
                </button>
              </form>

              <div className="tokenBox">
                <div className="panelHeader">
                  <KeyRound size={18} />
                  <h2>Agent token</h2>
                </div>
                <code>{visibleApiToken ?? 'Hidden after creation. Rotate to reveal a new one.'}</code>
                <div className="buttonRow">
                  <button onClick={rotateApiToken} disabled={busy}>
                    <RefreshCw size={16} />
                    Rotate
                  </button>
                  <button
                    onClick={() => visibleApiToken && navigator.clipboard.writeText(visibleApiToken)}
                    disabled={!visibleApiToken}
                  >
                    <Copy size={16} />
                    Copy
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="panelHeader">
                <Sparkles size={18} />
                <h2>{authMode === 'signup' ? 'Create workspace' : 'Welcome back'}</h2>
              </div>
              <form onSubmit={submitAuth} className="stack">
                {authMode === 'signup' && (
                  <label>
                    Display name
                    <input
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      required
                    />
                  </label>
                )}
                <label>
                  Email
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={8}
                    required
                  />
                </label>
                <button className="primary" disabled={busy}>
                  {authMode === 'signup' ? <UserPlus size={17} /> : <LogIn size={17} />}
                  {authMode === 'signup' ? 'Sign up' : 'Log in'}
                </button>
              </form>
            </>
          )}

          <div className="cliBox">
            <div className="panelHeader">
              <Terminal size={18} />
              <h2>Quater CLI</h2>
            </div>
            <span>Local action</span>
            <pre>{cliExamples.local}</pre>
            <span>Remote action</span>
            <pre>{cliExamples.remote}</pre>
          </div>
        </aside>

        <section className="feedColumn">
          <div className="statsGrid">
            <Metric label="Frustrations" value={stats?.total_frustrations ?? 0} />
            <Metric label="Users" value={stats?.total_users ?? 0} />
            <Metric label="Average heat" value={stats?.average_intensity ?? 0} />
          </div>

          <div className="feedHeader">
            <div>
              <h1>Live frustration feed</h1>
              <p>Every post is public feedback from a user, agent, CLI run, or MCP tool call.</p>
            </div>
            <button onClick={() => loadPublicData()} aria-label="Refresh feed">
              <RefreshCw size={17} />
            </button>
          </div>

          <div className="feed">
            {feed.length === 0 ? (
              <div className="empty">
                <Bot size={24} />
                No frustration has escaped yet.
              </div>
            ) : (
              feed.map((item) => (
                <article className="frustration" key={item.id}>
                  <div className="frustrationTop">
                    <div>
                      <strong>{item.author.display_name}</strong>
                      <span>
                        {item.agent_name ? `${item.agent_name} via ${item.source}` : item.source}
                      </span>
                    </div>
                    <Heat value={item.intensity} />
                  </div>
                  <p>{item.message}</p>
                  <div className="tags">
                    {item.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <div className="reactionRow">
                    {reactions.map((reaction) => (
                      <button key={reaction} onClick={() => reactTo(item, reaction)}>
                        {reaction}
                        <b>{item.reactions[reaction] ?? 0}</b>
                      </button>
                    ))}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function Heat({ value }: { value: number }) {
  return (
    <span className="heat" aria-label={`Intensity ${value} out of 10`}>
      <Flame size={15} />
      {value}
    </span>
  )
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.'
}
