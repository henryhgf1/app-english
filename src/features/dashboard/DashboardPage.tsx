import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { isToday } from 'date-fns'
import { ArrowRight, Brain, FilePlus2, Flame, Layers, NotebookPen } from 'lucide-react'
import { useCards, useReviewLogs } from '../../hooks/useData'
import { computeStreak, reviewsByDay } from '../../lib/stats'

export default function DashboardPage() {
  const cards = useCards()
  const logs = useReviewLogs()
  const now = Date.now()
  const due = cards.filter((card) => card.srs.dueAt <= now)
  const streak = useMemo(() => computeStreak(logs.map((log) => log.reviewedAt)), [logs])
  const today = logs.filter((log) => isToday(log.reviewedAt)).length
  const week = useMemo(() => reviewsByDay(logs.map((log) => log.reviewedAt), 7), [logs])
  const max = Math.max(1, ...week.map((day) => day.count))

  return (
    <div className="stack">
      <section className="card" style={{ background: 'linear-gradient(120deg, color-mix(in srgb, var(--primary) 16%, var(--surface)), var(--surface))' }}>
        <div className="spread">
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: 6 }}>Ready to practice?</h2>
            <p className="muted" style={{ margin: 0 }}>
              {due.length ? `${due.length} ${due.length === 1 ? 'card is' : 'cards are'} waiting for you.` : 'Nothing due right now — nice work!'}
            </p>
          </div>
          <Link className="btn btn-primary" to="/review"><Brain size={17} /> Review now</Link>
        </div>
      </section>

      <section className="grid grid-4">
        <div className="card stat-card"><span className="stat-value">{due.length}</span><span className="stat-label">Due cards</span></div>
        <div className="card stat-card"><span className="stat-value">{cards.length}</span><span className="stat-label">Total cards</span></div>
        <div className="card stat-card"><span className="stat-value">{streak.current} <Flame size={18} color="var(--accent)" /></span><span className="stat-label">Day streak</span></div>
        <div className="card stat-card"><span className="stat-value">{today}</span><span className="stat-label">Reviews today</span></div>
      </section>

      <section className="grid grid-2">
        <div className="card">
          <h2>Quick actions</h2>
          <div className="stack">
            <Link className="list-row" to="/add">
              <span className="row"><FilePlus2 size={18} className="muted" /><span className="list-row-title">Add flashcards</span></span>
              <ArrowRight size={16} className="muted" />
            </Link>
            <Link className="list-row" to="/notes">
              <span className="row"><NotebookPen size={18} className="muted" /><span className="list-row-title">Write a note</span></span>
              <ArrowRight size={16} className="muted" />
            </Link>
            <Link className="list-row" to="/decks">
              <span className="row"><Layers size={18} className="muted" /><span className="list-row-title">Manage decks</span></span>
              <ArrowRight size={16} className="muted" />
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2>This week</h2><Link className="small" to="/stats">See stats →</Link></div>
          <div className="chart">
            {week.map((day) => (
              <div className="chart-col" key={day.key} title={`${day.key}: ${day.count}`}>
                <div className="chart-bar" style={{ height: `${(day.count / max) * 100}%`, opacity: day.count ? 1 : 0.25 }} />
                <span className="chart-label">{day.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
