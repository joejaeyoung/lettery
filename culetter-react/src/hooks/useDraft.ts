const KEY = 'culetter_draft'

export type Draft = {
  to: string
  text: string
  from: string
  bgSrc: string
  savedAt: string
}

export function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveDraft(d: Omit<Draft, 'savedAt'>) {
  localStorage.setItem(KEY, JSON.stringify({ ...d, savedAt: new Date().toISOString() }))
}

export function clearDraft() {
  localStorage.removeItem(KEY)
}
