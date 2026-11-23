import { lazy, Suspense } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import AppShell from './app/AppShell'
import { SettingsProvider } from './app/settings-context'
import AddCardsPage from './features/cards/AddCardsPage'
import CardsPage from './features/cards/CardsPage'
import DecksPage from './features/decks/DecksPage'
import ReviewPage from './features/review/ReviewPage'
import QuizPage from './features/quiz/QuizPage'
import DashboardPage from './features/dashboard/DashboardPage'
import StatsPage from './features/stats/StatsPage'
import { SettingsPage } from './app/placeholders'

const NotesPage = lazy(() => import('./features/notes/NotesPage'))

export default function App() {
  return (
    <SettingsProvider>
      <HashRouter>
        <AppShell>
          <Suspense fallback={<div className="card muted">Loading...</div>}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/add" element={<AddCardsPage />} />
              <Route path="/decks" element={<DecksPage />} />
              <Route path="/cards" element={<CardsPage />} />
              <Route path="/review" element={<ReviewPage />} />
              <Route path="/notes" element={<NotesPage />} />
              <Route path="/quiz" element={<QuizPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </Suspense>
        </AppShell>
      </HashRouter>
    </SettingsProvider>
  )
}
