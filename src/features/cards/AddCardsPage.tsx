import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import TagInput from '../../components/TagInput'
import SpeakButton from '../../components/SpeakButton'
import { useDecks } from '../../hooks/useData'
import { addCards, db, makeCard } from '../../lib/db'
import { useSettings } from '../../app/settings-context'
import type { CardInput, CardKind } from '../../lib/types'
import BatchPanel from './BatchPanel'
import { parseCardInputs, parseLines } from './parseCards'
import { CARD_PROMPT } from './prompt'

type Tab = 'form' | 'json' | 'lines'

interface FormState {
  deckId: number
  kind: CardKind
  front: string
  back: string
  explanation: string
  ipa: string
  example: string
  phenomenon: string
  tags: string[]
}

const emptyForm = (deckId: number): FormState => ({
  deckId,
  kind: 'word',
  front: '',
  back: '',
  explanation: '',
  ipa: '',
  example: '',
  phenomenon: '',
  tags: [],
})

export default function AddCardsPage() {
  const decks = useDecks()
  const { settings } = useSettings()
  const [tab, setTab] = useState<Tab>('form')
  const [form, setForm] = useState<FormState>(emptyForm(0))
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [jsonText, setJsonText] = useState('')
  const [linesText, setLinesText] = useState('')
  const [pending, setPending] = useState<CardInput[]>([])
  const [batchDeckId, setBatchDeckId] = useState(0)
  const [batchError, setBatchError] = useState('')
  const [batchMessage, setBatchMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (form.deckId || !decks.length) return
    const preferred = decks.find((deck) => deck.id === settings.defaultDeckId) ?? decks[0]
    if (preferred?.id) setForm((current) => ({ ...current, deckId: preferred.id! }))
  }, [decks, form.deckId, settings.defaultDeckId])

  function patch(values: Partial<FormState>) {
    setForm((current) => ({ ...current, ...values }))
    setError('')
  }

  async function saveCard(stay: boolean) {
    const deckId = form.deckId || decks[0]?.id
    if (!form.front.trim() || !form.back.trim()) {
      setError('Front and back are required.')
      return
    }
    if (!deckId) {
      setError('Create a deck first.')
      return
    }
    await db.cards.add(makeCard(form, deckId))
    const deckName = decks.find((deck) => deck.id === deckId)?.name ?? 'deck'
    setMessage(`Card saved to ${deckName}.`)
    setError('')
    if (stay) {
      setForm((current) => ({ ...emptyForm(current.deckId), kind: current.kind }))
    } else {
      setForm(emptyForm(deckId))
    }
    window.setTimeout(() => setMessage(''), 3500)
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(CARD_PROMPT)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  function prepareCards(text: string, parser: (source: string) => CardInput[]) {
    setBatchError('')
    setBatchMessage('')
    try {
      setPending(parser(text))
    } catch (cause) {
      setPending([])
      setBatchError(cause instanceof Error ? cause.message : 'Could not read those cards.')
    }
  }

  async function saveBatch() {
    if (!pending.length) return
    setSaving(true)
    setBatchError('')
    try {
      const inputs = pending.map((input) => ({
        ...input,
        deckId: batchDeckId || input.deckId,
        source: 'import' as const,
      }))
      const count = await addCards(inputs)
      setBatchMessage(`${count} ${count === 1 ? 'card' : 'cards'} saved.`)
      setPending([])
      if (tab === 'json') setJsonText('')
      else setLinesText('')
      window.setTimeout(() => setBatchMessage(''), 3500)
    } catch (cause) {
      setBatchError(cause instanceof Error ? cause.message : 'Could not save cards.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="stack">
      <section className="card">
        <div className="card-header">
          <div>
            <h2>Add new flashcards</h2>
            <p className="muted small" style={{ margin: 0 }}>
              Ask any AI to generate cards for you, then paste them here. Nothing leaves your device.
            </p>
          </div>
          <button className="btn" onClick={copyPrompt}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy prompt'}
          </button>
        </div>
        <p className="hint" style={{ margin: 0 }}>
          The prompt asks the AI for a JSON array with the exact format this app accepts. Paste the answer in the “Paste JSON” tab.
        </p>
      </section>

      <div className="tabs" role="tablist">
        <button className={`tab${tab === 'form' ? ' tab-active' : ''}`} onClick={() => setTab('form')}>
          Quick form
        </button>
        <button className={`tab${tab === 'json' ? ' tab-active' : ''}`} onClick={() => setTab('json')}>
          Paste JSON
        </button>
        <button className={`tab${tab === 'lines' ? ' tab-active' : ''}`} onClick={() => setTab('lines')}>
          Simple lines
        </button>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {tab === 'form' && (
        <section className="card stack">
          <div className="grid grid-2">
            <div className="field">
              <label className="label" htmlFor="deck">Deck</label>
              <select
                id="deck"
                className="select"
                value={form.deckId}
                onChange={(event) => patch({ deckId: Number(event.target.value) })}
              >
                {decks.map((deck) => (
                  <option key={deck.id} value={deck.id}>{deck.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="kind">Card type</label>
              <select
                id="kind"
                className="select"
                value={form.kind}
                onChange={(event) => patch({ kind: event.target.value as CardKind })}
              >
                <option value="word">Word</option>
                <option value="phrase">Phrase</option>
                <option value="connected-speech">Connected speech</option>
              </select>
            </div>
          </div>

          <div className="grid grid-2">
            <div className="field">
              <div className="spread">
                <label className="label" htmlFor="front">Front</label>
                <SpeakButton text={form.front} />
              </div>
              <input
                id="front"
                className="input"
                value={form.front}
                placeholder="serendipity  /  going to → gonna"
                onChange={(event) => patch({ front: event.target.value })}
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="back">Back</label>
              <input
                id="back"
                className="input"
                value={form.back}
                placeholder="meaning or full form"
                onChange={(event) => patch({ back: event.target.value })}
              />
            </div>
          </div>

          <div className="field">
            <label className="label" htmlFor="explanation">Explanation (Portuguese)</label>
            <textarea
              id="explanation"
              className="textarea"
              value={form.explanation}
              placeholder="Explicação curta, em português..."
              onChange={(event) => patch({ explanation: event.target.value })}
            />
          </div>

          <div className="grid grid-3">
            <div className="field">
              <label className="label" htmlFor="ipa">IPA</label>
              <input id="ipa" className="input" value={form.ipa} placeholder="/ˌserənˈdɪpəti/" onChange={(event) => patch({ ipa: event.target.value })} />
            </div>
            <div className="field">
              <label className="label" htmlFor="example">Example (English)</label>
              <input id="example" className="input" value={form.example} placeholder="It was pure serendipity." onChange={(event) => patch({ example: event.target.value })} />
            </div>
            <div className="field">
              <label className="label" htmlFor="phenomenon">Phenomenon</label>
              <input id="phenomenon" className="input" value={form.phenomenon} placeholder="reduction, linking..." onChange={(event) => patch({ phenomenon: event.target.value })} />
            </div>
          </div>

          <div className="field">
            <label className="label">Tags</label>
            <TagInput value={form.tags} onChange={(tags) => patch({ tags })} />
          </div>

          <div className="row">
            <button className="btn btn-primary" onClick={() => saveCard(false)}>Save card</button>
            <button className="btn" onClick={() => saveCard(true)}>Save & add another</button>
          </div>
        </section>
      )}

      {batchError && <div className="alert alert-error">{batchError}</div>}
      {batchMessage && <div className="alert alert-success">{batchMessage}</div>}

      {tab === 'json' && (
        <section className="card stack">
          <h2>Paste JSON</h2>
          <div className="field">
            <label className="label" htmlFor="json-input">JSON array from your AI</label>
            <textarea
              id="json-input"
              className="textarea"
              style={{ minHeight: 180, fontFamily: 'ui-monospace, monospace', fontSize: '0.78rem' }}
              value={jsonText}
              placeholder={'[\n  { "front": "going to → gonna", "back": "going to", "kind": "connected-speech" }\n]'}
              onChange={(event) => setJsonText(event.target.value)}
            />
          </div>
          <div className="row">
            <button className="btn btn-primary" disabled={!jsonText.trim()} onClick={() => prepareCards(jsonText, parseCardInputs)}>
              Review cards
            </button>
            <span className="hint">Accepted: a JSON array, or an object like <code>{'{ "cards": [...] }'}</code>.</span>
          </div>
        </section>
      )}

      {tab === 'lines' && (
        <section className="card stack">
          <h2>Simple lines</h2>
          <div className="field">
            <label className="label" htmlFor="lines-input">One card per line</label>
            <textarea
              id="lines-input"
              className="textarea"
              style={{ minHeight: 160 }}
              value={linesText}
              placeholder={'serendipity | feeling that something good happened by chance\n going to → gonna | going to | Reduced form in fast speech'}
              onChange={(event) => setLinesText(event.target.value)}
            />
          </div>
          <div className="row">
            <button className="btn btn-primary" disabled={!linesText.trim()} onClick={() => prepareCards(linesText, parseLines)}>
              Review cards
            </button>
            <span className="hint">Use <code>front | back</code> or <code>front | back | explanation</code>.</span>
          </div>
        </section>
      )}

      {pending.length > 0 && (
        <BatchPanel
          inputs={pending}
          decks={decks}
          deckId={batchDeckId}
          onDeckChange={setBatchDeckId}
          onChange={setPending}
          onSave={saveBatch}
          saving={saving}
        />
      )}
    </div>
  )
}
