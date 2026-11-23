import { Check, Trash2 } from 'lucide-react'
import SpeakButton from '../../components/SpeakButton'
import type { CardInput, Deck } from '../../lib/types'

interface BatchPanelProps {
  inputs: CardInput[]
  decks: Deck[]
  deckId: number
  onDeckChange: (id: number) => void
  onChange: (inputs: CardInput[]) => void
  onSave: () => void
  saving: boolean
}

const kindLabels: Record<string, string> = {
  word: 'Word',
  phrase: 'Phrase',
  'connected-speech': 'Connected speech',
}

export default function BatchPanel({
  inputs,
  decks,
  deckId,
  onDeckChange,
  onChange,
  onSave,
  saving,
}: BatchPanelProps) {
  function patch(index: number, values: Partial<CardInput>) {
    onChange(inputs.map((input, i) => (i === index ? { ...input, ...values } : input)))
  }

  return (
    <section className="card stack">
      <div className="spread">
        <div>
          <h2 style={{ margin: 0 }}>Review {inputs.length} {inputs.length === 1 ? 'card' : 'cards'}</h2>
          <p className="muted small" style={{ margin: 0 }}>Edit anything before saving. Nothing is stored yet.</p>
        </div>
        <span className="badge badge-primary">Ready to import</span>
      </div>

      <div className="field" style={{ maxWidth: 320 }}>
        <label className="label" htmlFor="batch-deck">Save to deck</label>
        <select id="batch-deck" className="select" value={deckId} onChange={(event) => onDeckChange(Number(event.target.value))}>
          <option value={0}>From JSON / first deck</option>
          {decks.map((deck) => (
            <option key={deck.id} value={deck.id}>{deck.name}</option>
          ))}
        </select>
      </div>

      <div className="list">
        {inputs.map((input, index) => (
          <div className="list-row" key={`${input.front}-${index}`} style={{ alignItems: 'flex-start' }}>
            <div style={{ flex: 1, display: 'grid', gap: 8 }}>
              <div className="row" style={{ gap: 8 }}>
                <span className="badge">{index + 1}</span>
                <span className="badge badge-primary">{kindLabels[input.kind ?? 'word']}</span>
                {input.deckName && <span className="badge badge-warn">{input.deckName}</span>}
                {input.tags?.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
              </div>
              <div className="grid grid-2">
                <div className="row" style={{ flexWrap: 'nowrap' }}>
                  <input className="input" value={input.front} aria-label={`Front ${index + 1}`} onChange={(event) => patch(index, { front: event.target.value })} />
                  <SpeakButton text={input.front} />
                </div>
                <input className="input" value={input.back} aria-label={`Back ${index + 1}`} onChange={(event) => patch(index, { back: event.target.value })} />
              </div>
              <input
                className="input"
                value={input.explanation ?? ''}
                placeholder="Explanation (optional)"
                aria-label={`Explanation ${index + 1}`}
                onChange={(event) => patch(index, { explanation: event.target.value })}
              />
            </div>
            <button
              className="btn btn-ghost btn-icon btn-sm"
              title="Remove card"
              onClick={() => onChange(inputs.filter((_, i) => i !== index))}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {inputs.length === 0 ? (
        <button className="btn" disabled>Preview is empty</button>
      ) : (
        <button className="btn btn-primary btn-block" onClick={onSave} disabled={saving}>
          {saving ? <span className="spinner" /> : <Check size={17} />}
          {saving ? 'Saving...' : `Save ${inputs.length} ${inputs.length === 1 ? 'card' : 'cards'}`}
        </button>
      )}
    </section>
  )
}
