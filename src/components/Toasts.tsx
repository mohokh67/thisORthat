import type { ReactElement } from 'react'
import type { Toast } from './useToasts'

export function Toasts({ toasts }: { toasts: Toast[] }): ReactElement {
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast">
          {toast.message}
        </div>
      ))}
    </div>
  )
}
