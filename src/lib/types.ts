export type CardKind = 'word' | 'phrase' | 'connected-speech'
export type Grade = 'again' | 'hard' | 'good' | 'easy'

export interface Srs {
  ease: number
  interval: number
  repetitions: number
  dueAt: number
  lastReviewedAt?: number
}

export interface Deck {
  id?: number
  name: string
  description: string
  color: string
  createdAt: number
}

export interface Card {
  id?: number
  deckId: number
  kind: CardKind
  front: string
  back: string
  explanation: string
  ipa: string
  example: string
  phenomenon: string
  tags: string[]
  source: 'manual' | 'import'
  createdAt: number
  updatedAt: number
  srs: Srs
}

export interface Note {
  id?: number
  title: string
  content: string
  tags: string[]
  createdAt: number
  updatedAt: number
}

export interface ReviewLog {
  id?: number
  cardId: number
  deckId: number
  reviewedAt: number
  grade: Grade
  intervalBefore: number
  intervalAfter: number
}

export interface CardInput {
  deckId?: number
  deckName?: string
  kind?: CardKind
  front: string
  back: string
  explanation?: string
  ipa?: string
  example?: string
  phenomenon?: string
  tags?: string[]
}

export interface BackupData {
  version: 1
  exportedAt: number
  decks: Deck[]
  cards: Card[]
  notes: Note[]
  reviewLogs: ReviewLog[]
}
