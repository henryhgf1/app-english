type PlaceholderProps = {
  title: string
  description: string
}

export function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <section className="card empty-state">
      <h2>{title}</h2>
      <p>{description}</p>
      <span className="badge">Coming soon</span>
    </section>
  )
}

export const DashboardPage = () => (
  <Placeholder title="Dashboard" description="Your study overview will appear here." />
)
export const AddCardsPage = () => (
  <Placeholder title="Add cards" description="Create cards manually or paste JSON from your AI." />
)
export const DecksPage = () => (
  <Placeholder title="Decks" description="Organize your cards into decks." />
)
export const ReviewPage = () => (
  <Placeholder title="Review" description="Spaced repetition sessions will appear here." />
)
export const NotesPage = () => (
  <Placeholder title="Notes" description="Markdown notes with tags and search." />
)
export const QuizPage = () => (
  <Placeholder title="Quiz" description="Test yourself with generated questions." />
)
export const StatsPage = () => (
  <Placeholder title="Stats" description="Streaks and progress charts will appear here." />
)
export const SettingsPage = () => (
  <Placeholder title="Settings" description="Preferences and JSON backup." />
)
