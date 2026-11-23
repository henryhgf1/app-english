import { useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

export default function TagInput({ value, onChange, placeholder = 'Add a tag and press Enter' }: TagInputProps) {
  const [draft, setDraft] = useState('')

  function addTag() {
    const tag = draft.trim().replace(/^#/, '')
    if (tag && !value.some((item) => item.toLowerCase() === tag.toLowerCase())) {
      onChange([...value, tag])
    }
    setDraft('')
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addTag()
    }
    if (event.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div>
      {value.length > 0 && (
        <div className="row" style={{ marginBottom: 8 }}>
          {value.map((tag) => (
            <span className="tag" key={tag}>
              {tag}
              <button
                type="button"
                className="btn btn-icon btn-sm"
                style={{ width: 18, height: 18, padding: 0, border: 0, background: 'transparent' }}
                onClick={() => onChange(value.filter((item) => item !== tag))}
                title={`Remove ${tag}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        className="input"
        value={draft}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={addTag}
      />
    </div>
  )
}
