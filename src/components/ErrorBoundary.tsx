import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/** Last-resort guard: a render-time throw shows a recovery screen, not a blank page. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(error, info)
  }

  render(): ReactNode {
    if (!this.state.error) {
      return this.props.children
    }
    return (
      <main className="app-shell">
        <h1>Something went wrong</h1>
        <p className="muted">
          Try reloading. If a link brought you here, it may be broken.
        </p>
        <button
          type="button"
          onClick={() => {
            window.location.href = '/'
          }}
        >
          Back to start
        </button>
      </main>
    )
  }
}
