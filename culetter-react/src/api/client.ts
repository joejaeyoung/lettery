const BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8080/v1'

let refreshPromise: Promise<string> | null = null

function getToken(): string | null {
  return localStorage.getItem('culetter_access_token')
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem('culetter_refresh_token')
  if (!refreshToken) throw new Error('NO_REFRESH_TOKEN')

  const res = await fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.ok) throw new Error('REFRESH_FAILED')

  const newToken: string = json.data.accessToken
  localStorage.setItem('culetter_access_token', newToken)
  return newToken
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers as Record<string, string> | undefined),
  }
  const res = await fetch(`${BASE}${path}`, { ...init, headers })

  if (res.status === 401) {
    let newToken: string
    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => { refreshPromise = null })
      }
      newToken = await refreshPromise
    } catch {
      localStorage.removeItem('culetter_access_token')
      localStorage.removeItem('culetter_refresh_token')
      localStorage.removeItem('culetter_user')
      window.location.href = '/login'
      throw new Error('SESSION_EXPIRED')
    }
    const retryRes = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${newToken}` },
    })
    if (!retryRes.ok) {
      const errJson = await retryRes.json().catch(() => null)
      throw new Error(errJson?.error?.code ?? `HTTP_${retryRes.status}`)
    }
    const retryJson = await retryRes.json()
    if (!retryJson.ok) throw new Error(retryJson.error?.code ?? 'UNKNOWN_ERROR')
    return retryJson.data as T
  }

  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.error?.code ?? `HTTP_${res.status}`)
  }
  const json = await res.json()
  if (!json.ok) throw new Error(json.error?.code ?? 'UNKNOWN_ERROR')
  return json.data as T
}

export type UserDto = { id: number; nickname: string; email: string }
export type LoginData = { accessToken: string; refreshToken: string; user: UserDto }
export type SendLetterData = { id: number; shareToken: string; shareUrl: string; createdAt: string }
export type LetterData = {
  id: number
  template: { id: string; name: string; imageUrl: string }
  to: string
  body: string
  from: string
  sentAt: string
}

export const api = {
  kakaoLogin: (code: string) =>
    request<LoginData>(`/auth/kakao/callback?code=${encodeURIComponent(code)}`),

  sendLetter: (payload: { templateId: string; to: string; body: string; from: string; stickers: object[] }) =>
    request<SendLetterData>('/letters', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getLetter: (shareToken: string) =>
    request<LetterData>(`/letters/share/${shareToken}`),
}
