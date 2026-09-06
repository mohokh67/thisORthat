import type { ReactElement } from 'react'
import { useHashRoute } from './routing/useHashRoute'
import { LandingPage } from './pages/LandingPage'
import { BoardPage } from './pages/BoardPage'

export default function App(): ReactElement {
  const route = useHashRoute()
  if (route.name === 'board') {
    return <BoardPage key={route.boardId} boardId={route.boardId} />
  }
  return <LandingPage />
}
