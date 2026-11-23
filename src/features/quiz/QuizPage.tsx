import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, CircleHelp, RotateCcw, X } from 'lucide-react'
import SpeakButton from '../../components/SpeakButton'
import { useCards, useDecks } from '../../hooks/useData'
import type { Card } from '../../lib/types'

type QuizMode = 'multiple' | 'typing' | 'mixed'

interface Question {
  card: Card
  options: string[]
}

interface Answer {
  question: Question
  correct: boolean
  given: string
  typing: boolean
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export default function QuizPage() {
  const cards = useCards()
  const decks = useDecks()
  const [deckFilter, setDeckFilter] = useState(0)
  const [count, setCount] = useState(5)
  const [mode, setMode] = useState<QuizMode>('mixed')
  const [questions, setQuestions] = useState<Question[]>([])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [typed, setTyped] = useState('')
  const [checked, setChecked] = useState(false)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [finished, setFinished] = useState(false)

  const pool = useMemo(
    () => cards.filter((card) => !deckFilter || card.deckId === deckFilter),
    [cards, deckFilter],
  )
  const question: Question | undefined = questions[index]
  const isTyping = mode === 'typing' || (mode === 'mixed' && index % 2 === 1)

  function start() {
    const chosen = shuffle(pool).slice(0, count)
    if (!chosen.length) return
    const prepared = chosen.map((card) => {
      const distractors = shuffle(pool.filter((item) => item.id !== card.id && item.back !== card.back))
        .slice(0, 3)
        .map((item) => item.back)
      return { card, options: shuffle([card.back, ...distractors]) }
    })
    setQuestions(prepared)
    setIndex(0)
    setSelected(null)
    setTyped('')
    setChecked(false)
    setAnswers([])
    setFinished(false)
  }

  function check() {
    if (!question || checked) return
    const given = isTyping ? typed : (selected ?? '')
    const correct = isTyping
      ? normalize(given) === normalize(question.card.back)
      : given === question.card.back
    setAnswers((previous) => [...previous, { question, correct, given, typing: isTyping }])
    setChecked(true)
  }

  function next() {
    if (index + 1 >= questions.length) {
      setFinished(true)
      return
    }
    setIndex((previous) => previous + 1)
    setSelected(null)
    setTyped('')
    setChecked(false)
  }

  if (!questions.length) {
    return (
      <section className="card stack">
        <div className="card-header"><h2>Quiz settings</h2></div>
        <div className="grid grid-3">
          <div className="field">
            <label className="label" htmlFor="quiz-deck">Deck</label>
            <select id="quiz-deck" className="select" value={deckFilter} onChange={(event) => setDeckFilter(Number(event.target.value))}>
              <option value={0}>All decks</option>
              {decks.map((deck) => <option key={deck.id} value={deck.id}>{deck.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="quiz-count">Questions</label>
            <select id="quiz-count" className="select" value={count} onChange={(event) => setCount(Number(event.target.value))}>
              {[5, 10, 15, 20].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="quiz-mode">Mode</label>
            <select id="quiz-mode" className="select" value={mode} onChange={(event) => setMode(event.target.value as QuizMode)}>
              <option value="mixed">Mixed</option>
              <option value="multiple">Multiple choice</option>
              <option value="typing">Type the answer</option>
            </select>
          </div>
        </div>
        {pool.length < 4 && mode !== 'typing' && (
          <div className="alert alert-info">Add at least 4 cards for multiple choice, or choose “Type the answer”.</div>
        )}
        <div className="row">
          <button className="btn btn-primary" disabled={!pool.length} onClick={start}>Start quiz</button>
          <span className="hint">{pool.length} cards available in this deck.</span>
        </div>
        {!pool.length && <div className="empty-state"><CircleHelp size={28} /><p>No cards to quiz yet.</p><Link className="btn btn-primary" to="/add">Add cards</Link></div>}
      </section>
    )
  }

  if (finished) {
    const correct = answers.filter((answer) => answer.correct).length
    return (
      <section className="card stack">
        <div className="text-center">
          <h2 style={{ margin: 0 }}>{Math.round((correct / answers.length) * 100)}% correct</h2>
          <p className="muted">{correct} of {answers.length} right</p>
        </div>
        <div className="list">
          {answers.map((answer, position) => (
            <div className="list-row" key={position}>
              <div>
                <div className="row"><span className={answer.correct ? 'badge badge-primary' : 'badge badge-danger'}>{answer.correct ? <Check size={13} /> : <X size={13} />}</span><strong className="small">{answer.question.card.front}</strong></div>
                <div className="list-row-sub">Correct answer: {answer.question.card.back}</div>
                {!answer.correct && answer.given && <div className="hint">You answered: {answer.given}</div>}
                {answer.question.card.explanation && <div className="hint">{answer.question.card.explanation}</div>}
              </div>
              <SpeakButton text={answer.question.card.front} />
            </div>
          ))}
        </div>
        <div className="row" style={{ justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => setQuestions([])}><RotateCcw size={16} /> New quiz</button>
        </div>
      </section>
    )
  }

  return (
    <section className="card stack">
      <div className="spread">
        <span className="small muted">Question {index + 1} of {questions.length}</span>
        <span className="badge badge-primary">{isTyping ? 'Type the answer' : 'Multiple choice'}</span>
      </div>
      <div className="progress"><div className="progress-bar" style={{ width: `${(index / questions.length) * 100}%` }} /></div>

      {question && (
        <>
          <div className="text-center" style={{ padding: '22px 0' }}>
            <p className="muted small" style={{ marginBottom: 8 }}>What does this mean?</p>
            <h2 style={{ fontSize: '1.6rem', margin: 0 }}>{question.card.front}</h2>
            <div className="row" style={{ justifyContent: 'center', marginTop: 10 }}>
              <SpeakButton text={question.card.front} />
            </div>
          </div>

          {isTyping ? (
            <input
              className="input"
              value={typed}
              autoFocus
              disabled={checked}
              placeholder="Type the answer in English..."
              onChange={(event) => setTyped(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter' && !checked) check() }}
            />
          ) : (
            <div className="grid grid-2">
              {question.options.map((option, position) => {
                const isCorrect = option === question.card.back
                const isSelected = option === selected
                const className = checked && isCorrect ? 'btn-primary' : checked && isSelected ? 'btn-danger' : ''
                return (
                  <button key={`${option}-${position}`} className={`btn ${className}`} disabled={checked} onClick={() => setSelected(option)}>
                    {option}
                  </button>
                )
              })}
            </div>
          )}

          {checked && (
            <div className={`alert ${question.card.back && (isTyping ? normalize(typed) === normalize(question.card.back) : selected === question.card.back) ? 'alert-success' : 'alert-error'}`}>
              <strong>{question.card.back}</strong>
              {question.card.explanation && <div style={{ marginTop: 6 }}>{question.card.explanation}</div>}
              {question.card.example && <div style={{ marginTop: 4, fontStyle: 'italic' }}>“{question.card.example}”</div>}
            </div>
          )}

          <button
            className="btn btn-primary btn-block"
            disabled={!checked && (isTyping ? !typed.trim() : selected === null)}
            onClick={checked ? next : check}
          >
            {checked ? (index + 1 >= questions.length ? 'See results' : 'Next question') : 'Check answer'}
          </button>
        </>
      )}
    </section>
  )
}
