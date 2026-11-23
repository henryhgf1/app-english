export const CARD_PROMPT = `You are creating flashcards for a Brazilian student learning English.

Rules:
- Return ONLY a valid JSON array. No markdown, no commentary.
- Write "explanation" in Brazilian Portuguese. Write "example" and "front"/"back" in English.
- Each item must have exactly these keys:
  {
    "kind": "word" | "phrase" | "connected-speech",
    "front": "the word, phrase or reduced form",
    "back": "meaning or full form in English",
    "ipa": "IPA transcription (empty string if not useful)",
    "phenomenon": "reduction | linking | elision | assimilation | contraction (empty string if not connected speech)",
    "explanation": "short explanation in Portuguese",
    "example": "natural example sentence in English",
    "tags": ["lowercase tags"]
  }
- For connected speech (e.g. "going to → gonna", "want to → wanna", "a lot of → alotta"), use kind "connected-speech", put the reduced spoken form in "front" and the full form in "back", and always fill "phenomenon".
- Keep explanations concise (1-3 sentences).

Example output:
[
  {
    "kind": "connected-speech",
    "front": "going to → gonna",
    "back": "going to",
    "ipa": "/ˈɡənə/",
    "phenomenon": "reduction",
    "explanation": "Em fala rápida, 'going to' perde o /g/ e as vogais viram um schwa. Soa como 'gonna'.",
    "example": "I'm gonna call you tomorrow.",
    "tags": ["connected-speech", "reduction", "future"]
  }
]

Now create flashcards for: `
