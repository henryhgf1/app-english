import { useRef, useState, type ChangeEvent } from 'react'
import { Download, HardDriveDownload, Trash2, Upload } from 'lucide-react'
import { useSettings } from '../../app/settings-context'
import { useCards, useDecks, useNotes, useReviewLogs } from '../../hooks/useData'
import { downloadBackup, importBackup } from '../../lib/backup'
import { db } from '../../lib/db'

export default function SettingsPage() {
  const { settings, update } = useSettings()
  const decks = useDecks()
  const cards = useCards()
  const notes = useNotes()
  const logs = useReviewLogs()
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function notify(text: string) {
    setError('')
    setMessage(text)
    window.setTimeout(() => setMessage(''), 4000)
  }

  async function onImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setMessage('')
    setError('')
    if (!window.confirm('Importing replaces all current decks, cards, notes and review history. Continue?')) {
      event.target.value = ''
      return
    }
    try {
      await importBackup(await file.text())
      notify('Backup imported successfully.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not import this file.')
    }
    event.target.value = ''
  }

  async function resetAll() {
    if (!window.confirm('Delete ALL data from this device? This cannot be undone.')) return
    if (!window.confirm('Are you sure? Export a backup first if you want to keep your cards.')) return
    await db.transaction('rw', db.decks, db.cards, db.notes, db.reviewLogs, async () => {
      await db.decks.clear()
      await db.cards.clear()
      await db.notes.clear()
      await db.reviewLogs.clear()
    })
    update({ defaultDeckId: null })
    notify('All data removed.')
  }

  return (
    <div className="stack">
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <section className="card stack">
        <h2>Preferences</h2>
        <div className="grid grid-2">
          <div className="field">
            <label className="label" htmlFor="setting-theme">Theme</label>
            <select id="setting-theme" className="select" value={settings.theme} onChange={(event) => update({ theme: event.target.value as 'dark' | 'light' })}>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="setting-deck">Default deck</label>
            <select id="setting-deck" className="select" value={settings.defaultDeckId ?? 0} onChange={(event) => update({ defaultDeckId: Number(event.target.value) || null })}>
              <option value={0}>First deck</option>
              {decks.map((deck) => <option key={deck.id} value={deck.id}>{deck.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="setting-goal">Daily review goal</label>
            <input id="setting-goal" className="input" type="number" min={1} max={500} value={settings.dailyGoal} onChange={(event) => update({ dailyGoal: Math.max(1, Number(event.target.value)) })} />
            <span className="hint">Used as a reference in your study overview.</span>
          </div>
          <div className="field">
            <label className="label" htmlFor="setting-new">New cards per session</label>
            <input id="setting-new" className="input" type="number" min={1} max={200} value={settings.dailyNewCards} onChange={(event) => update({ dailyNewCards: Math.max(1, Number(event.target.value)) })} />
          </div>
        </div>
        <div className="field" style={{ maxWidth: 420 }}>
          <div className="spread">
            <label className="label" htmlFor="setting-rate">Voice speed</label>
            <span className="badge">{settings.ttsRate.toFixed(1)}x</span>
          </div>
          <input id="setting-rate" type="range" min={0.6} max={1.3} step={0.1} value={settings.ttsRate} onChange={(event) => update({ ttsRate: Number(event.target.value) })} />
          <span className="hint">Lower values help with connected speech.</span>
        </div>
      </section>

      <section className="card stack">
        <h2>Backup</h2>
        <p className="muted small" style={{ margin: 0 }}>
          Everything lives in this browser. Export a JSON file to keep a copy or move to another device.
        </p>
        <div className="row">
          <button className="btn btn-primary" onClick={() => { void downloadBackup(); notify('Backup downloaded.') }}>
            <Download size={16} /> Export JSON
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            <Upload size={16} /> Import JSON
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onImport} />
        </div>
        <div className="row" style={{ gap: 8 }}>
          <span className="badge">{decks.length} decks</span>
          <span className="badge">{cards.length} cards</span>
          <span className="badge">{notes.length} notes</span>
          <span className="badge">{logs.length} reviews</span>
        </div>
      </section>

      <section className="card stack">
        <h2>Storage</h2>
        <div className="alert alert-info row" style={{ margin: 0 }}>
          <HardDriveDownload size={18} />
          <span>This app works offline. Your data never leaves this device and there is no account or server.</span>
        </div>
        <div>
          <button className="btn btn-danger" onClick={resetAll}><Trash2 size={16} /> Delete all local data</button>
        </div>
      </section>
    </div>
  )
}
