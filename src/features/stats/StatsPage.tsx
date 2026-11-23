import { useMemo } from 'react'
import { isToday } from 'date-fns'
import { BarChart3 } from 'lucide-react'
import { useCards, useDecks, useReviewLogs } from '../../hooks/useData'
import { accuracy, computeStreak, reviewsByDay } from '../../lib/stats'

export default function StatsPage() {
  const logs = useReviewLogs()
  const cards = useCards()
  const decks = useDecks()

  const stats = useMemo(() => computeStreak(logs.map((log) => log.reviewedAt)), [logs])
  const todayCount = logs.filter((log) => isToday(log.reviewedAt)).length
  const weekly = useMemo(() => reviewsByDay(logs.map((log) => log.reviewedAt), 14), [logs])
  const heat = useMemo(() => reviewsByDay(logs.map((log) => log.reviewedAt), 84), [logs])
  const maxCount = Math.max(1, ...weekly.map((day) => day.count))

  return (
    <div className="stack">
      <section className="grid grid-4">
        <div className="card stat-card">
          <span className="stat-value">{stats.current}</span>
          <span className="stat-label">Current streak (days)</span>
        </div>
        <div className="card stat-card">
          <span className="stat-value">{stats.longest}</span>
          <span className="stat-label">Longest streak</span>
        </div>
        <div className="card stat-card">
          <span className="stat-value">{todayCount}</span>
          <span className="stat-label">Reviews today</span>
        </div>
        <div className="card stat-card">
          <span className="stat-value">{accuracy(logs)}%</span>
          <span className="stat-label">Confident answers</span>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h2>Reviews in the last 14 days</h2>
            <p className="muted small" style={{ margin: 0 }}>{logs.length} reviews recorded · {stats.activeDays} active days</p>
          </div>
          <BarChart3 size={20} className="muted" />
        </div>
        <div className="chart">
          {weekly.map((day) => (
            <div className="chart-col" key={day.key} title={`${day.key}: ${day.count} reviews`}>
              <div className="chart-bar" style={{ height: `${(day.count / maxCount) * 100}%`, opacity: day.count ? 1 : 0.25 }} />
              <span className="chart-label">{day.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Activity (last 12 weeks)</h2>
        <div className="heatmap">
          {heat.map((day) => (
            <div
              key={day.key}
              className={`heat-cell${day.count >= 4 ? ' heat-3' : day.count >= 2 ? ' heat-2' : day.count === 1 ? ' heat-1' : ''}`}
              title={`${day.key}: ${day.count} reviews`}
            />
          ))}
        </div>
      </section>

      <section className="card">
        <h2>By deck</h2>
        {decks.length === 0 ? (
          <p className="muted">No decks yet.</p>
        ) : (
          <div className="list">
            {decks.map((deck) => {
              const deckLogs = logs.filter((log) => log.deckId === deck.id)
              const deckCards = cards.filter((card) => card.deckId === deck.id).length
              return (
                <div className="list-row" key={deck.id}>
                  <div>
                    <div className="list-row-title" style={{ color: deck.color }}>{deck.name}</div>
                    <div className="list-row-sub">{deckCards} cards · {deckLogs.length} reviews</div>
                  </div>
                  <span className="badge badge-primary">{accuracy(deckLogs)}% confident</span>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
