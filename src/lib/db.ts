import Dexie, { type Table } from 'dexie'
import type { Card, CardInput, Deck, Note, ReviewLog } from './types'

class EnglishDatabase extends Dexie {
  decks!: Table<Deck, number>
  cards!: Table<Card, number>
  notes!: Table<Note, number>
  reviewLogs!: Table<ReviewLog, number>

  constructor() {
    super('english-flashcards')
    this.version(1).stores({
      decks: '++id, name, createdAt',
      cards: '++id, deckId, kind, front, dueAt, createdAt, *tags',
      notes: '++id, title, createdAt, updatedAt, *tags',
      reviewLogs: '++id, cardId, deckId, reviewedAt, grade',
    })

    this.on('populate', async () => {
      const now = Date.now()
      await this.decks.bulkAdd([
        { name: 'Vocabulary', description: 'New words and their meanings', color: '#2dd4bf', createdAt: now },
        { name: 'Connected Speech', description: 'Reductions, linking and elision', color: '#fbbf24', createdAt: now },
        { name: 'Grammar', description: 'Rules, patterns and examples', color: '#818cf8', createdAt: now },
      ])
    })
  }
}

export const db = new EnglishDatabase()

export function makeCard(input: CardInput, deckId: number): Card {
  const now = Date.now()
  return {
    deckId,
    kind: input.kind ?? 'word',
    front: input.front.trim(),
    back: input.back.trim(),
    explanation: (input.explanation ?? '').trim(),
    ipa: (input.ipa ?? '').trim(),
    example: (input.example ?? '').trim(),
    phenomenon: (input.phenomenon ?? '').trim(),
    tags: (input.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
    source: input.source ?? 'manual',
    createdAt: now,
    updatedAt: now,
    srs: { ease: 2.5, interval: 0, repetitions: 0, dueAt: now },
  }
}

export async function ensureDeckId(input: CardInput): Promise<number> {
  if (input.deckId) {
    const deck = await db.decks.get(input.deckId)
    if (deck?.id) return deck.id
  }
  if (input.deckName?.trim()) {
    const name = input.deckName.trim()
    const existing = await db.decks.where('name').equalsIgnoreCase(name).first()
    if (existing?.id) return existing.id
    return db.decks.add({
      name,
      description: '',
      color: '#38bdf8',
      createdAt: Date.now(),
    })
  }
  const first = await db.decks.orderBy('createdAt').first()
  if (first?.id) return first.id
  return db.decks.add({
    name: 'Vocabulary',
    description: '',
    color: '#2dd4bf',
    createdAt: Date.now(),
  })
}

export async function addCards(inputs: CardInput[]): Promise<number> {
  let added = 0
  for (const input of inputs) {
    const deckId = await ensureDeckId(input)
    await db.cards.add(makeCard(input, deckId))
    added++
  }
  return added
}

export async function deleteDeckCascade(deckId: number): Promise<void> {
  await db.transaction('rw', db.decks, db.cards, db.reviewLogs, async () => {
    const cardIds = await db.cards.where('deckId').equals(deckId).primaryKeys()
    await db.cards.where('deckId').equals(deckId).delete()
    await db.reviewLogs.where('cardId').anyOf(cardIds as number[]).delete()
    await db.decks.delete(deckId)
  })
}
