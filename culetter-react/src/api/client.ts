const BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8080/v1'

function getToken(): string | null {
  return localStorage.getItem('culetter_access_token')
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers as Record<string, string> | undefined),
  }
  const res = await fetch(`${BASE}${path}`, { ...init, headers })
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
