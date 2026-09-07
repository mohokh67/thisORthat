import type { AnchorHTMLAttributes, MouseEvent, ReactElement, ReactNode } from 'react'
import { navigate } from '../routing/useRoute'

type LinkProps = {
  to: string
  children: ReactNode
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>

/**
 * Internal navigation. Renders a real `<a href>` so cmd/ctrl-click and
 * middle-click still open a new tab; a plain left-click is intercepted and
 * routed through `navigate` to avoid a full page reload.
 */
export function Link({ to, children, onClick, ...rest }: LinkProps): ReactElement {
  function handleClick(event: MouseEvent<HTMLAnchorElement>): void {
    onClick?.(event)
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }
    event.preventDefault()
    navigate(to)
  }

  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  )
}
