import { useCallback, useEffect, useRef, useState } from 'react'

export interface Toast {
  id: number
  message: string
}

const DISMISS_AFTER_MS = 4000
const MAX_VISIBLE = 3

/** Transient, self-dismissing status messages. */
export function useToasts(): { toasts: Toast[]; pushToast: (message: string) => void } {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())

  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach(clearTimeout)
      pending.clear()
    }
  }, [])

  const pushToast = useCallback((message: string) => {
    const id = nextId.current
    nextId.current += 1
    setToasts((current) => [...current, { id, message }].slice(-MAX_VISIBLE))

    const handle = setTimeout(() => {
      timers.current.delete(handle)
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, DISMISS_AFTER_MS)
    timers.current.add(handle)
  }, [])

  return { toasts, pushToast }
}
