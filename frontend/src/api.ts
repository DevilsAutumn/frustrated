export type PublicUser = {
  id: string
  display_name: string
}

export type Frustration = {
  id: string
  message: string
  source: string
  intensity: number
  tags: string[]
  agent_name: string | null
  created_at: string
  author: PublicUser
  reactions: Record<string, number>
}

export type UserSession = {
  id: string
  email: string
  display_name: string
  api_token?: string | null
}

export type Stats = {
  total_frustrations: number
  total_users: number
  average_intensity: number
  top_tags: [string, number][]
}

type RequestOptions = {
  token?: string | null
  method?: string
  body?: unknown
}

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`
  }

  const response = await fetch(path, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail || `Request failed with ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export const api = {
  signup: (body: { email: string; password: string; display_name: string }) =>
    apiRequest<{ user: UserSession; token: string }>('/api/auth/signup', {
      method: 'POST',
      body,
    }),
  login: (body: { email: string; password: string }) =>
    apiRequest<{ user: UserSession; token: string }>('/api/auth/login', {
      method: 'POST',
      body,
    }),
  me: (token: string) => apiRequest<UserSession>('/api/me', { token }),
  rotateToken: (token: string) =>
    apiRequest<{ api_token: string }>('/api/me/api-token', { method: 'POST', token }),
  feed: () => apiRequest<{ items: Frustration[] }>('/api/frustrations'),
  stats: () => apiRequest<Stats>('/api/stats'),
  createFrustration: (
    token: string,
    body: { message: string; source: string; intensity: number; tags: string[] },
  ) =>
    apiRequest<Frustration>('/api/frustrations', {
      method: 'POST',
      token,
      body,
    }),
  react: (id: string, reaction: string) =>
    apiRequest<Record<string, number>>(`/api/frustrations/${id}/reactions`, {
      method: 'POST',
      body: { reaction },
    }),
}
