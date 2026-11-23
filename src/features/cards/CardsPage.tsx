import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import SpeakButton from '../../components/SpeakButton'
import TagInput from '../../components/TagInput'
import { useCards, useDecks } from '../../hooks/useData'
import { db } from '../../lib/db'
import type { Card, CardKind } from '../../lib/types'

export default function CardsPage() {
  const cards = useCards()
  const decks = useDecks()
  const [deckFilter, setDeckFilter] = useState(0)
  const [tagFilter, setTagFilter] = useState('')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Card | null>(null)
  const [form, setForm] = useState<Card | null>(null)

  const allTags = useMemo(() => [...new Set(cards.flatMap((card) => card.tags))].sort(), [cards])
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return cards
      .filter((card) => !deckFilter || card.deckId === deckFilter)
      .filter((card) => !tagFilter || card.tags.includes(tagFilter))
      .filter((card) => {
        if (!query) return true
        return [card.front, card.back, card.explanation, card.example, ...card.tags]
          .some((value) => value.toLowerCase().includes(query))
      })
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }, [cards, deckFilter, tagFilter, search])

  function openEdit(card: Card) {
    setEditing(card)
    setForm({ ...card, tags: [...card.tags] })
  }

  async function save() {
    if (!form?.id || !form.front.trim() || !form.back.trim()) return
    await db.cards.update(form.id, {
      deckId: form.deckId,
      kind: form.kind,
      front: form.front.trim(),
      back: form.back.trim(),
      explanation: form.explanation,
      ipa: form.ipa,
      example: form.example,
      phenomenon: form.phenomenon,
      tags: form.tags,
      updatedAt: Date.now(),
    })
    setEditing(null)
    setForm(null)
  }

  async function remove(card: Card) {
    if (!card.id || !window.confirm(`Delete the card "${card.front}"?`)) return
    await db.cards.delete(card.id)
  }

  return (
    <div className="stack">
      <section className="card">
        <div className="card-header">
          <div>
            <h2>All flashcards</h2>
            <p className="muted small" style={{ margin: 0 }}>{filtered.length} of {cards.length} cards shown</p>
          </div>
          <Link className="btn btn-primary" to="/add"><Plus size={16} /> Add card</Link>
        </div>
        <div className="grid grid-3">
          <div className="field">
            <label className="label" htmlFor="card-search">Search</label>
            <div className="row" style={{ flexWrap: 'nowrap' }}>
              <Search size={16} className="muted" />
              <input id="card-search" className="input" value={search} placeholder="word, meaning, tag..." onChange={(event) => setSearch(event.target.value)} />
            </div>
          </div>
          <div className="field">
            <label className="label" htmlFor="card-deck">Deck</label>
            <select id="card-deck" className="select" value={deckFilter} onChange={(event) => setDeckFilter(Number(event.target.value))}>
              <option value={0}>All decks</option>
              {decks.map((deck) => <option key={deck.id} value={deck.id}>{deck.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="card-tag">Tag</label>
            <select id="card-tag" className="select" value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
              <option value="">All tags</option>
              {allTags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <h3>No cards found</h3>
            <p>Try other filters, or add a new card.</p>
          </div>
        ) : (
          <div className="list">
            {filtered.map((card) => {
              const deck = decks.find((item) => item.id === card.deckId)
              return (
                <div className="list-row" key={card.id}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="row" style={{ gap: 8 }}>
                      <span className="list-row-title">{card.front}</span>
                      <SpeakButton text={card.front} />
                      <span className="badge">{card.kind === 'connected-speech' ? 'Connected speech' : card.kind}</span>
                      {deck && <span className="badge badge-primary" style={{ color: deck.color }}>{deck.name}</span>}
                    </div>
                    <div className="list-row-sub">{card.back}{card.ipa ? ` · ${card.ipa}` : ''}</div>
                    {card.tags.length > 0 && (
                      <div className="row" style={{ marginTop: 8 }}>
                        {card.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
                      </div>
                    )}
                    <div className="hint" style={{ marginTop: 6 }}>
                      Due {formatDistanceToNow(card.srs.dueAt, { addSuffix: true })}
                    </div>
                  </div>
                  <div className="row" style={{ gap: 2 }}>
                    <button className="btn btn-ghost btn-icon btn-sm" title="Edit card" onClick={() => openEdit(card)}><Pencil size={15} /></button>
                    <button className="btn btn-ghost btn-icon btn-sm" title="Delete card" onClick={() => remove(card)}><Trash2 size={15} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {editing && form && (
        <div className="modal-backdrop" onMouseDown={() => setEditing(null)}>
          <div className="modal stack" onMouseDown={(event) => event.stopPropagation()}>
            <div className="spread">
              <h2 style={{ margin: 0 }}>Edit card</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditing(null)}><X size={17} /></button>
            </div>
            <div className="grid grid-2">
              <div className="field">
                <label className="label" htmlFor="edit-deck">Deck</label>
                <select id="edit-deck" className="select" value={form.deckId} onChange={(event) => setForm({ ...form, deckId: Number(event.target.value) })}>
                  {decks.map((deck) => <option key={deck.id} value={deck.id}>{deck.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="edit-kind">Type</label>
                <select id="edit-kind" className="select" value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value as CardKind })}>
                  <option value="word">Word</option>
                  <option value="phrase">Phrase</option>
                  <option value="connected-speech">Connected speech</option>
                </select>
              </div>
            </div>
            <div className="grid grid-2">
              <div className="field">
                <label className="label" htmlFor="edit-front">Front</label>
                <input id="edit-front" className="input" value={form.front} onChange={(event) => setForm({ ...form, front: event.target.value })} />
              </div>
              <div className="field">
                <label className="label" htmlFor="edit-back">Back</label>
                <input id="edit-back" className="input" value={form.back} onChange={(event) => setForm({ ...form, back: event.target.value })} />
              </div>
            </div>
            <div className="field">
              <label className="label" htmlFor="edit-explanation">Explanation</label>
              <textarea id="edit-explanation" className="textarea" value={form.explanation} onChange={(event) => setForm({ ...form, explanation: event.target.value })} />
            </div>
            <div className="grid grid-3">
              <div className="field">
                <label className="label" htmlFor="edit-ipa">IPA</label>
                <input id="edit-ipa" className="input" value={form.ipa} onChange={(event) => setForm({ ...form, ipa: event.target.value })} />
              </div>
              <div className="field">
                <label className="label" htmlFor="edit-example">Example</label>
                <input id="edit-example" className="input" value={form.example} onChange={(event) => setForm({ ...form, example: event.target.value })} />
              </div>
              <div className="field">
                <label className="label" htmlFor="edit-phenomenon">Phenomenon</label>
                <input id="edit-phenomenon" className="input" value={form.phenomenon} onChange={(event) => setForm({ ...form, phenomenon: event.target.value })} />
              </div>
            </div>
            <div className="field">
              <label className="label">Tags</label>
              <TagInput value={form.tags} onChange={(tags) => setForm({ ...form, tags })} />
            </div>
            <button className="btn btn-primary btn-block" onClick={save}>Save changes</button>
          </div>
        </div>
      )}
    </div>
  )
}
