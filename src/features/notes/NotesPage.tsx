import { useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { FilePlus2, Pencil, Search, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import TagInput from '../../components/TagInput'
import { useNotes } from '../../hooks/useData'
import { db } from '../../lib/db'
import type { Note } from '../../lib/types'

interface Draft {
  title: string
  content: string
  tags: string[]
}

const emptyDraft = (): Draft => ({ title: '', content: '', tags: [] })

export default function NotesPage() {
  const notes = useNotes()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [view, setView] = useState<'edit' | 'preview'>('edit')
  const [saved, setSaved] = useState('')

  const allTags = useMemo(() => [...new Set(notes.flatMap((note) => note.tags))].sort(), [notes])
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return notes
      .filter((note) => !tagFilter || note.tags.includes(tagFilter))
      .filter((note) => !query || [note.title, note.content, ...note.tags].some((value) => value.toLowerCase().includes(query)))
  }, [notes, search, tagFilter])

  function select(note: Note) {
    setSelectedId(note.id ?? null)
    setDraft({ title: note.title, content: note.content, tags: [...note.tags] })
    setView('edit')
    setSaved('')
  }

  function createNote() {
    setSelectedId(null)
    setDraft(emptyDraft())
    setView('edit')
    setSaved('')
  }

  async function save() {
    if (!draft || !draft.title.trim()) return
    const now = Date.now()
    if (selectedId) {
      await db.notes.update(selectedId, { ...draft, title: draft.title.trim(), updatedAt: now })
    } else {
      const id = await db.notes.add({ ...draft, title: draft.title.trim(), createdAt: now, updatedAt: now })
      setSelectedId(id)
    }
    setSaved('Saved')
    window.setTimeout(() => setSaved(''), 2500)
  }

  async function remove() {
    if (!selectedId || !window.confirm('Delete this note?')) return
    await db.notes.delete(selectedId)
    setSelectedId(null)
    setDraft(null)
  }

  return (
    <div className="notes-layout">
      <section className="card stack">
        <div className="spread">
          <h2 style={{ margin: 0 }}>Notes</h2>
          <button className="btn btn-primary btn-sm" onClick={createNote}><FilePlus2 size={15} /> New</button>
        </div>
        <div className="field">
          <div className="row" style={{ flexWrap: 'nowrap' }}>
            <Search size={16} className="muted" />
            <input className="input" value={search} placeholder="Search notes..." onChange={(event) => setSearch(event.target.value)} />
          </div>
        </div>
        {allTags.length > 0 && (
          <select className="select" value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
            <option value="">All tags</option>
            {allTags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
          </select>
        )}
        <div className="list">
          {filtered.length === 0 && <p className="muted small text-center">No notes found.</p>}
          {filtered.map((note) => (
            <button
              key={note.id}
              className="list-row"
              style={{ textAlign: 'left', cursor: 'pointer', background: selectedId === note.id ? 'var(--surface-3)' : undefined, width: '100%' }}
              onClick={() => select(note)}
            >
              <div style={{ minWidth: 0 }}>
                <div className="list-row-title">{note.title}</div>
                <div className="list-row-sub" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
                  {note.content.replace(/[#*`>]/g, '').slice(0, 70) || 'Empty note'}
                </div>
                <div className="hint" style={{ marginTop: 5 }}>{formatDistanceToNow(note.updatedAt, { addSuffix: true })}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="card stack">
        {!draft ? (
          <div className="empty-state">
            <Pencil size={28} />
            <h3 style={{ marginTop: 12 }}>Select or create a note</h3>
            <p>Write grammar rules, examples, vocabulary insights — in Markdown.</p>
            <button className="btn btn-primary" onClick={createNote}>New note</button>
          </div>
        ) : (
          <>
            <div className="spread">
              <div className="tabs" style={{ margin: 0, width: 220 }}>
                <button className={`tab${view === 'edit' ? ' tab-active' : ''}`} onClick={() => setView('edit')}>Edit</button>
                <button className={`tab${view === 'preview' ? ' tab-active' : ''}`} onClick={() => setView('preview')}>Preview</button>
              </div>
              <div className="row">
                {saved && <span className="badge badge-primary">{saved}</span>}
                {selectedId && <button className="btn btn-ghost btn-icon btn-sm" title="Delete note" onClick={remove}><Trash2 size={16} /></button>}
                <button className="btn btn-primary btn-sm" onClick={save}>Save</button>
              </div>
            </div>
            <input
              className="input"
              style={{ fontSize: '1.05rem', fontWeight: 600 }}
              value={draft.title}
              placeholder="Note title"
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            />
            <TagInput value={draft.tags} onChange={(tags) => setDraft({ ...draft, tags })} placeholder="Tags: grammar, listening, phrasal-verbs" />
            {view === 'edit' ? (
              <textarea
                className="textarea"
                style={{ minHeight: 420, fontFamily: 'ui-monospace, monospace', fontSize: '0.82rem' }}
                value={draft.content}
                placeholder={'## Phrasal verbs\n\n**look up** = search for information\n\n- I had to *look it up*.\n- `look up` is separable.'}
                onChange={(event) => setDraft({ ...draft, content: event.target.value })}
              />
            ) : (
              <div className="card markdown" style={{ minHeight: 420, background: 'var(--surface-2)', boxShadow: 'none' }}>
                {draft.content ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft.content}</ReactMarkdown> : <p className="muted">Nothing to preview yet.</p>}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
