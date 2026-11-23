import type { CardInput, CardKind } from '../../lib/types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function toTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((tag): tag is string => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean)
  }
  if (typeof value === 'string') {
    return value.split(',').map((tag) => tag.trim()).filter(Boolean)
  }
  return []
}

function normalizeCard(value: unknown, index: number): CardInput {
  if (!isRecord(value)) throw new Error(`Card ${index + 1} is not an object.`)
  const front = text(value.front)
  const back = text(value.back)
  if (!front || !back) throw new Error(`Card ${index + 1} needs both "front" and "back".`)
  const kind: CardKind = value.kind === 'phrase' || value.kind === 'connected-speech' ? value.kind : 'word'
  return {
    deckName: text(value.deckName) || undefined,
    kind,
    front,
    back,
    explanation: text(value.explanation),
    ipa: text(value.ipa),
    example: text(value.example),
    phenomenon: text(value.phenomenon),
    tags: toTags(value.tags),
  }
}

export function parseCardInputs(source: string): CardInput[] {
  let data: unknown
  try {
    data = JSON.parse(source)
  } catch {
    throw new Error('That is not valid JSON. Check brackets, quotes and trailing commas.')
  }
  const items = Array.isArray(data)
    ? data
    : isRecord(data) && Array.isArray(data.cards)
      ? data.cards
      : null
  if (!items) throw new Error('Expected a JSON array of cards, or an object with a "cards" array.')
  if (items.length === 0) throw new Error('No cards found in the JSON.')
  return items.map(normalizeCard)
}

export function parseLines(source: string): CardInput[] {
  const lines = source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  if (!lines.length) throw new Error('Add at least one line.')
  return lines.map((line, index) => {
    const [front, back, explanation] = line.split('|').map((part) => part.trim())
    if (!front || !back) throw new Error(`Line ${index + 1} must be "front | back".`)
    return { kind: 'word' as CardKind, front, back, explanation: explanation ?? '', tags: [] }
  })
}
