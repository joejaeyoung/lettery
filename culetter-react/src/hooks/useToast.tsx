import { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react'

type ToastCtx = { show: (msg: string, duration?: number) => void }
const Ctx = createContext<ToastCtx | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState('')
  const [visible, setVisible] = useState(false)
  const timer = useRef<number | null>(null)

  const show = useCallback((m: string, duration = 2000) => {
    setMsg(m)
    setVisible(true)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setVisible(false), duration)
  }, [])

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div className={`toast${visible ? ' show' : ''}`}>{msg}</div>
    </Ctx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}
