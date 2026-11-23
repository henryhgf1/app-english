import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import type { Card, Deck, Note, ReviewLog } from '../lib/types'

export function useDecks(): Deck[] {
  return useLiveQuery(() => db.decks.orderBy('createdAt').toArray(), [], []) ?? []
}

export function useCards(deckId?: number): Card[] {
  return useLiveQuery(
    () => (deckId ? db.cards.where('deckId').equals(deckId).toArray() : db.cards.toArray()),
    [deckId],
    [],
  ) ?? []
}

export function useNotes(): Note[] {
  return useLiveQuery(() => db.notes.orderBy('updatedAt').reverse().toArray(), [], []) ?? []
}

export function useReviewLogs(): ReviewLog[] {
  return useLiveQuery(() => db.reviewLogs.orderBy('reviewedAt').reverse().toArray(), [], []) ?? []
}

export function useDueCards(now: number): Card[] {
  return useLiveQuery(() => db.cards.where('dueAt').belowOrEqual(now).toArray(), [now], []) ?? []
}
