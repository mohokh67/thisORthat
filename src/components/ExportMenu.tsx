import { useEffect, useRef, useState, type ReactElement } from 'react'

export type ExportFormat = 'markdown' | 'json'

interface ExportMenuProps {
  onExport: (format: ExportFormat) => void
}

/** Header "Export" button with a small Markdown / JSON dropdown. */
export function ExportMenu({ onExport }: ExportMenuProps): ReactElement {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const choose = (format: ExportFormat) => {
    setOpen(false)
    onExport(format)
  }

  return (
    <div className="export-menu" ref={rootRef}>
      <button
        type="button"
        className="export-button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        Export
      </button>
      {open && (
        <div className="export-menu-list" role="menu">
          <button type="button" role="menuitem" onClick={() => choose('markdown')}>
            Markdown
          </button>
          <button type="button" role="menuitem" onClick={() => choose('json')}>
            JSON
          </button>
        </div>
      )}
    </div>
  )
}
