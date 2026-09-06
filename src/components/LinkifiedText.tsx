import { Fragment, type ReactElement } from 'react'
import { linkify } from '../lib/linkify'

/** Renders note text with line breaks preserved and bare URLs made clickable. */
export function LinkifiedText({ text }: { text: string }): ReactElement {
  return (
    <span className="note-text">
      {linkify(text).map((segment, index) =>
        segment.type === 'link' ? (
          <a key={index} href={segment.href} target="_blank" rel="noopener noreferrer">
            {segment.value}
          </a>
        ) : (
          <Fragment key={index}>{segment.value}</Fragment>
        ),
      )}
    </span>
  )
}
