import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Brain, RotateCcw } from 'lucide-react'
import SpeakButton from '../../components/SpeakButton'
import { useSettings } from '../../app/settings-context'
import { useCards, useDecks } from '../../hooks/useData'
import { db } from '../../lib/db'
import { describeInterval, schedule } from '../../lib/srs'
import { stopSpeech } from '../../lib/speech'
import type { Card, Grade } from '../../lib/types'

interface Result {
  card: Card
  grade: Grade
  interval: number
}

const grades: { grade: Grade; label: string; className: string }[] = [
  { grade: 'again', label: 'Again', className: 'btn-danger' },
  { grade: 'hard', label: 'Hard', className: '' },
  { grade: 'good', label: 'Good', className: 'btn-primary' },
  { grade: 'easy', label: 'Easy', className: 'btn-primary' },
]

export default function ReviewPage() {
  const cards = useCards()
  const decks = useDecks()
  const { settings } = useSettings()
  const [selectedDeck, setSelectedDeck] = useState(0)
  const [session, setSession] = useState<Card[] | null>(null)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [results, setResults] = useState<Result[]>([])
  const [repeats, setRepeats] = useState<Record<number, number>>({})
  const [finished, setFinished] = useState(false)
  const [saving, setSaving] = useState(false)

  const now = Date.now()
  const dueCards = useMemo(
    () => cards.filter((card) => card.srs.dueAt <= now && (!selectedDeck || card.deckId === selectedDeck)),
    [cards, selectedDeck, now],
  )
  const newDue = dueCards.filter((card) => card.srs.repetitions === 0 && card.srs.interval === 0).length
  const current = session?.[index]
  const progress = session ? Math.round((results.length / session.length) * 100) : 0

  useEffect(() => () => stopSpeech(), [])

  function startSession() {
    const overdue = dueCards.filter((card) => card.srs.repetitions > 0 || card.srs.interval > 0)
    const fresh = dueCards.filter((card) => card.srs.repetitions === 0 && card.srs.interval === 0).slice(0, settings.dailyNewCards)
    const queue = [...overdue, ...fresh]
    if (!queue.length) return
    setSession(queue)
    setIndex(0)
    setFlipped(false)
    setResults([])
    setRepeats({})
    setFinished(false)
  }

  async function grade(gradeValue: Grade) {
    if (!current?.id || !session || saving) return
    const cardId: number = current.id
    setSaving(true)
    stopSpeech()
    const reviewedAt = Date.now()
    const nextSrs = schedule(current.srs, gradeValue, reviewedAt)
    await db.cards.update(cardId, { srs: nextSrs, updatedAt: reviewedAt })
    await db.reviewLogs.add({
      cardId,
      deckId: current.deckId,
      reviewedAt,
      grade: gradeValue,
      intervalBefore: current.srs.interval,
      intervalAfter: nextSrs.interval,
    })
    setResults((previous) => [...previous, { card: current, grade: gradeValue, interval: nextSrs.interval }])
    setFlipped(false)

    const wasLast = index + 1 >= session.length
    const repeatCount = repeats[current.id] ?? 0
    if (gradeValue === 'again' && repeatCount < 2) {
      setRepeats((previous) => ({ ...previous, [cardId]: repeatCount + 1 }))
      setSession((previous) => {
        if (!previous) return previous
        const copy = [...previous]
        copy.splice(Math.min(index + 3, copy.length), 0, current)
        return copy
      })
    }
    setIndex((previous) => previous + 1)
    if (wasLast) setFinished(true)
    setSaving(false)
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!session || finished || saving) return
      if (event.code === 'Space') {
        event.preventDefault()
        setFlipped((previous) => !previous)
      }
      if (flipped) {
        const shortcut = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(event.code)
        if (shortcut >= 0) void grade(grades[shortcut].grade)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  if (!session) {
    return (
      <div className="stack">
        <section className="card">
          <div className="card-header"><h2>Start a review session</h2></div>
          <div className="grid grid-2">
            <div className="field">
              <label className="label" htmlFor="review-deck">Deck</label>
              <select id="review-deck" className="select" value={selectedDeck} onChange={(event) => setSelectedDeck(Number(event.target.value))}>
                <option value={0}>All decks</option>
                {decks.map((deck) => <option key={deck.id} value={deck.id}>{deck.name}</option>)}
              </select>
            </div>
            <div className="field">
              <span className="label">Due now</span>
              <div className="row" style={{ height: 40, gap: 8 }}>
                <span className="badge badge-primary">{dueCards.length} total</span>
                <span className="badge badge-warn">{newDue} new</span>
              </div>
            </div>
          </div>
          {dueCards.length === 0 ? (
            <div className="empty-state">
              <Brain size={30} />
              <h3 style={{ marginTop: 12 }}>All caught up!</h3>
              <p>No cards are due right now. Come back later or add new cards.</p>
              <Link className="btn btn-primary" to="/add">Add cards</Link>
            </div>
          ) : (
            <div className="row" style={{ marginTop: 18 }}>
              <button className="btn btn-primary" onClick={startSession}>Start reviewing {Math.min(dueCards.length, dueCards.length - newDue + settings.dailyNewCards)} cards</button>
              <span className="hint">New cards per session: {settings.dailyNewCards} (change in Settings)</span>
            </div>
          )}
        </section>
      </div>
    )
  }

  if (finished) {
    const correct = results.filter((result) => result.grade === 'good' || result.grade === 'easy').length
    return (
      <section className="card stack text-center">
        <div style={{ fontSize: '2.4rem' }}>🎉</div>
        <h2 style={{ margin: 0 }}>Session complete</h2>
        <p className="muted" style={{ margin: 0 }}>{results.length} reviews · {correct} answered confidently</p>
        <div className="grid grid-4">
          {grades.map(({ grade, label }) => (
            <div className="card stat-card" key={grade}>
              <span className="stat-value">{results.filter((result) => result.grade === grade).length}</span>
              <span className="stat-label">{label}</span>
            </div>
          ))}
        </div>
        <div className="row" style={{ justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => { setSession(null); setFinished(false) }}><RotateCcw size={16} /> Study again</button>
          <Link className="btn" to="/">Dashboard</Link>
        </div>
      </section>
    )
  }

  return (
    <div className="stack">
      <section className="card">
        <div className="spread" style={{ marginBottom: 10 }}>
          <span className="small muted">Card {index + 1} of {session.length}</span>
          <span className="small muted">{progress}%</span>
        </div>
        <div className="progress"><div className="progress-bar" style={{ width: `${progress}%` }} /></div>
      </section>

      {current && (
        <section className="stack">
          <div
            className="flashcard-wrap"
            style={{ height: 320 }}
            onClick={() => { stopSpeech(); setFlipped((previous) => !previous) }}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => { if (event.key === 'Enter') setFlipped((previous) => !previous) }}
          >
            <div className={`flashcard${flipped ? ' flashcard-flipped' : ''}`} style={{ height: '100%' }}>
              <div className="flashcard-face flashcard-front">
                <span className="badge badge-primary">{current.kind === 'connected-speech' ? 'Connected speech' : current.kind}</span>
                <p className="flashcard-front-text">{current.front}</p>
                <SpeakButton text={current.front} />
                <span className="flashcard-hint">Click to reveal · Space to flip</span>
              </div>
              <div className="flashcard-face flashcard-back">
                <p className="flashcard-back-text">{current.back}</p>
                {current.ipa && <p className="muted">{current.ipa}</p>}
                {current.explanation && <p className="small">{current.explanation}</p>}
                {current.example && <p className="small muted" style={{ fontStyle: 'italic' }}>“{current.example}”</p>}
                {current.phenomenon && <span className="badge badge-warn">{current.phenomenon}</span>}
                <div className="row"><SpeakButton text={current.example || current.back} /></div>
                <span className="flashcard-hint">1 Again · 2 Hard · 3 Good · 4 Easy</span>
              </div>
            </div>
          </div>

          {flipped ? (
            <div className="grid grid-4">
              {grades.map(({ grade, label, className }, position) => (
                <button
                  key={grade}
                  className={`btn ${className} btn-block`}
                  disabled={saving}
                  onClick={() => gradeCard(grade)}
                  title={`Shortcut: ${position + 1}`}
                >
                  <span>{label}</span>
                  <span className="tiny">{describeInterval(schedule(current.srs, grade).interval)}</span>
                </button>
              ))}
            </div>
          ) : (
            <button className="btn btn-primary btn-block" onClick={() => setFlipped(true)}>Show answer</button>
          )}
        </section>
      )}
    </div>
  )

  async function gradeCard(value: Grade) {
    await grade(value)
  }
}
