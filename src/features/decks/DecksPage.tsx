import { useState } from 'react'
import { Layers, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useCards, useDecks } from '../../hooks/useData'
import { db, deleteDeckCascade } from '../../lib/db'
import type { Deck } from '../../lib/types'
import { useSettings } from '../../app/settings-context'

const colors = ['#2dd4bf', '#fbbf24', '#818cf8', '#f472b6', '#38bdf8', '#4ade80']

const emptyDeck = (): Deck => ({ name: '', description: '', color: colors[0], createdAt: Date.now() })

export default function DecksPage() {
  const decks = useDecks()
  const cards = useCards()
  const { settings, update } = useSettings()
  const [editing, setEditing] = useState<Deck | null>(null)
  const [form, setForm] = useState<Deck>(emptyDeck())
  const [error, setError] = useState('')

  function openNew() {
    setForm(emptyDeck())
    setEditing({ ...emptyDeck(), id: -1 })
    setError('')
  }

  function openEdit(deck: Deck) {
    setForm({ ...deck })
    setEditing(deck)
    setError('')
  }

  async function save() {
    if (!form.name.trim()) {
      setError('Deck name is required.')
      return
    }
    const payload = { ...form, name: form.name.trim(), description: form.description.trim() }
    if (editing?.id && editing.id > 0) {
      await db.decks.update(editing.id, payload)
    } else {
      const id = await db.decks.add({ ...payload, createdAt: Date.now() })
      if (settings.defaultDeckId === null) update({ defaultDeckId: id })
    }
    setEditing(null)
  }

  async function remove(deck: Deck) {
    if (!deck.id) return
    const count = cards.filter((card) => card.deckId === deck.id).length
    const warning = count
      ? `Delete "${deck.name}" and its ${count} ${count === 1 ? 'card' : 'cards'}? This cannot be undone.`
      : `Delete "${deck.name}"?`
    if (!window.confirm(warning)) return
    await deleteDeckCascade(deck.id)
    if (settings.defaultDeckId === deck.id) update({ defaultDeckId: null })
  }

  return (
    <div className="stack">
      <section className="card">
        <div className="card-header">
          <div>
            <h2>Your decks</h2>
            <p className="muted small" style={{ margin: 0 }}>{decks.length} {decks.length === 1 ? 'deck' : 'decks'} · {cards.length} {cards.length === 1 ? 'card' : 'cards'}</p>
          </div>
          <button className="btn btn-primary" onClick={openNew}><Plus size={16} /> New deck</button>
        </div>

        {decks.length === 0 ? (
          <div className="empty-state">
            <Layers size={30} />
            <h3 style={{ marginTop: 12 }}>No decks yet</h3>
            <p>Create a deck to organize your flashcards.</p>
          </div>
        ) : (
          <div className="grid grid-3">
            {decks.map((deck) => {
              const deckCards = cards.filter((card) => card.deckId === deck.id)
              return (
                <div className="card" key={deck.id} style={{ borderTop: `3px solid ${deck.color}` }}>
                  <div className="spread">
                    <h3 style={{ margin: 0 }}>{deck.name}</h3>
                    <div className="row" style={{ gap: 2 }}>
                      <button className="btn btn-ghost btn-icon btn-sm" title="Edit deck" onClick={() => openEdit(deck)}><Pencil size={15} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" title="Delete deck" onClick={() => remove(deck)}><Trash2 size={15} /></button>
                    </div>
                  </div>
                  <p className="muted small" style={{ margin: '8px 0 14px', minHeight: 32 }}>
                    {deck.description || 'No description'}
                  </p>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="badge">{deckCards.length} {deckCards.length === 1 ? 'card' : 'cards'}</span>
                    {settings.defaultDeckId === deck.id && <span className="badge badge-primary">Default</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {editing && (
        <div className="modal-backdrop" onMouseDown={() => setEditing(null)}>
          <div className="modal stack" onMouseDown={(event) => event.stopPropagation()}>
            <div className="spread">
              <h2 style={{ margin: 0 }}>{editing.id && editing.id > 0 ? 'Edit deck' : 'New deck'}</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditing(null)}><X size={17} /></button>
            </div>
            <div className="field">
              <label className="label" htmlFor="deck-name">Name</label>
              <input id="deck-name" className="input" value={form.name} autoFocus onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </div>
            <div className="field">
              <label className="label" htmlFor="deck-description">Description</label>
              <input id="deck-description" className="input" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </div>
            <div className="field">
              <span className="label">Color</span>
              <div className="row">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm({ ...form, color })}
                    title={color}
                    style={{
                      width: 30, height: 30, borderRadius: '50%', border: form.color === color ? '3px solid var(--text)' : '2px solid transparent',
                      background: color, cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <button className="btn btn-primary btn-block" onClick={save}>Save deck</button>
          </div>
        </div>
      )}
    </div>
  )
}
