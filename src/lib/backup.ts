import { db } from './db'
import type { BackupData, Card, Deck, Note, ReviewLog } from './types'

const BACKUP_VERSION = 1

export async function exportBackup(): Promise<BackupData> {
  const [decks, cards, notes, reviewLogs] = await Promise.all([
    db.decks.toArray(),
    db.cards.toArray(),
    db.notes.toArray(),
    db.reviewLogs.toArray(),
  ])
  return { version: BACKUP_VERSION, exportedAt: Date.now(), decks, cards, notes, reviewLogs }
}

export function downloadBackup() {
  return exportBackup().then((data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const date = new Date(data.exportedAt).toISOString().slice(0, 10)
    link.href = url
    link.download = `english-flashcards-${date}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asArray(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`Invalid backup: "${field}" must be an array.`)
  return value
}

function normalizeDeck(value: unknown): Deck {
  if (!isRecord(value) || typeof value.name !== 'string' || !value.name.trim()) {
    throw new Error('Invalid backup: a deck is missing its name.')
  }
  return {
    id: typeof value.id === 'number' ? value.id : undefined,
    name: value.name,
    description: typeof value.description === 'string' ? value.description : '',
    color: typeof value.color === 'string' ? value.color : '#2dd4bf',
    createdAt: typeof value.createdAt === 'number' ? value.createdAt : Date.now(),
  }
}

function normalizeCard(value: unknown): Card {
  if (!isRecord(value) || typeof value.front !== 'string' || typeof value.back !== 'string') {
    throw new Error('Invalid backup: a card is missing front or back.')
  }
  if (typeof value.deckId !== 'number') throw new Error('Invalid backup: a card is missing its deck.')
  const srs = isRecord(value.srs) ? value.srs : {}
  const now = Date.now()
  return {
    id: typeof value.id === 'number' ? value.id : undefined,
    deckId: value.deckId,
    kind: value.kind === 'phrase' || value.kind === 'connected-speech' ? value.kind : 'word',
    front: value.front,
    back: value.back,
    explanation: typeof value.explanation === 'string' ? value.explanation : '',
    ipa: typeof value.ipa === 'string' ? value.ipa : '',
    example: typeof value.example === 'string' ? value.example : '',
    phenomenon: typeof value.phenomenon === 'string' ? value.phenomenon : '',
    tags: Array.isArray(value.tags) ? value.tags.filter((tag): tag is string => typeof tag === 'string') : [],
    source: value.source === 'import' ? 'import' : 'manual',
    createdAt: typeof value.createdAt === 'number' ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : now,
    srs: {
      ease: typeof srs.ease === 'number' ? srs.ease : 2.5,
      interval: typeof srs.interval === 'number' ? srs.interval : 0,
      repetitions: typeof srs.repetitions === 'number' ? srs.repetitions : 0,
      dueAt: typeof srs.dueAt === 'number' ? srs.dueAt : now,
      lastReviewedAt: typeof srs.lastReviewedAt === 'number' ? srs.lastReviewedAt : undefined,
    },
  }
}

function normalizeNote(value: unknown): Note {
  if (!isRecord(value) || typeof value.title !== 'string' || typeof value.content !== 'string') {
    throw new Error('Invalid backup: a note is missing its title or content.')
  }
  const now = Date.now()
  return {
    id: typeof value.id === 'number' ? value.id : undefined,
    title: value.title,
    content: value.content,
    tags: Array.isArray(value.tags) ? value.tags.filter((tag): tag is string => typeof tag === 'string') : [],
    createdAt: typeof value.createdAt === 'number' ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : now,
  }
}

function normalizeLog(value: unknown): ReviewLog {
  if (!isRecord(value) || typeof value.cardId !== 'number' || typeof value.reviewedAt !== 'number') {
    throw new Error('Invalid backup: a review log is incomplete.')
  }
  return {
    id: typeof value.id === 'number' ? value.id : undefined,
    cardId: value.cardId,
    deckId: typeof value.deckId === 'number' ? value.deckId : 0,
    reviewedAt: value.reviewedAt,
    grade: value.grade === 'again' || value.grade === 'hard' || value.grade === 'good' || value.grade === 'easy'
      ? value.grade
      : 'good',
    intervalBefore: typeof value.intervalBefore === 'number' ? value.intervalBefore : 0,
    intervalAfter: typeof value.intervalAfter === 'number' ? value.intervalAfter : 0,
  }
}

export function parseBackup(text: string): BackupData {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Invalid JSON file.')
  }
  if (!isRecord(parsed)) throw new Error('Invalid backup file.')
  if (parsed.version !== BACKUP_VERSION) throw new Error(`Unsupported backup version. Expected version ${BACKUP_VERSION}.`)

  const decks = asArray(parsed.decks, 'decks').map(normalizeDeck)
  const cards = asArray(parsed.cards, 'cards').map(normalizeCard)
  const notes = asArray(parsed.notes, 'notes').map(normalizeNote)
  const reviewLogs = asArray(parsed.reviewLogs, 'reviewLogs').map(normalizeLog)

  const deckIds = new Set(decks.map((deck) => deck.id))
  for (const card of cards) {
    if (card.id === undefined || deckIds.has(card.deckId)) continue
    throw new Error('Invalid backup: a card references a deck that does not exist.')
  }

  return { version: BACKUP_VERSION, exportedAt: Date.now(), decks, cards, notes, reviewLogs }
}

function withoutMissingId<T extends { id?: number }>(item: T): T {
  if (item.id !== undefined) return item
  const copy = { ...item }
  delete copy.id
  return copy
}

export async function importBackup(text: string): Promise<void> {
  const data = parseBackup(text)
  await db.transaction('rw', db.decks, db.cards, db.notes, db.reviewLogs, async () => {
    await db.decks.clear()
    await db.cards.clear()
    await db.notes.clear()
    await db.reviewLogs.clear()
    await db.decks.bulkAdd(data.decks.map(withoutMissingId))
    await db.cards.bulkAdd(data.cards.map(withoutMissingId))
    await db.notes.bulkAdd(data.notes.map(withoutMissingId))
    await db.reviewLogs.bulkAdd(data.reviewLogs.map(withoutMissingId))
  })
}
