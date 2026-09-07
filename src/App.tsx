import type { ReactElement } from 'react'
import { useRoute } from './routing/useRoute'
import { LandingPage } from './pages/LandingPage'
import { BoardPage } from './pages/BoardPage'

export default function App(): ReactElement {
  const route = useRoute()
  if (route.name === 'board') {
    return <BoardPage key={route.boardId} boardId={route.boardId} />
  }
  return <LandingPage />
}
