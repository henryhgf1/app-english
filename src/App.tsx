import { HashRouter, Route, Routes } from 'react-router-dom'
import AppShell from './app/AppShell'
import { SettingsProvider } from './app/settings-context'
import {
  AddCardsPage,
  DashboardPage,
  DecksPage,
  NotesPage,
  QuizPage,
  ReviewPage,
  SettingsPage,
  StatsPage,
} from './app/placeholders'

export default function App() {
  return (
    <SettingsProvider>
      <HashRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/add" element={<AddCardsPage />} />
            <Route path="/decks" element={<DecksPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </AppShell>
      </HashRouter>
    </SettingsProvider>
  )
}
