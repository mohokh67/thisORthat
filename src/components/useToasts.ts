import { useCallback, useRef, useState } from 'react'

export interface Toast {
  id: number
  message: string
}

const DISMISS_AFTER_MS = 4000

/** Transient, self-dismissing status messages. */
export function useToasts(): { toasts: Toast[]; pushToast: (message: string) => void } {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const pushToast = useCallback((message: string) => {
    const id = nextId.current
    nextId.current += 1
    setToasts((current) => [...current, { id, message }])
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, DISMISS_AFTER_MS)
  }, [])

  return { toasts, pushToast }
}
