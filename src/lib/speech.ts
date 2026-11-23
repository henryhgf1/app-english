export function speak(text: string, rate = 0.9): boolean {
  if (!('speechSynthesis' in window) || !text.trim()) return false
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = rate
  utterance.pitch = 1
  const voices = window.speechSynthesis.getVoices()
  const preferred = voices.find((voice) => voice.lang.startsWith('en') && /google us english|samantha|aria|jenny/i.test(voice.name))
  const englishVoice = preferred ?? voices.find((voice) => voice.lang.startsWith('en'))
  if (englishVoice) utterance.voice = englishVoice
  window.speechSynthesis.speak(utterance)
  return true
}

export function stopSpeech(): void {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}
