import { Volume2 } from 'lucide-react'
import { useSettings } from '../app/settings-context'
import { speak } from '../lib/speech'

interface SpeakButtonProps {
  text: string
  title?: string
}

export default function SpeakButton({ text, title = 'Pronounce (English)' }: SpeakButtonProps) {
  const { settings } = useSettings()
  return (
    <button
      type="button"
      className="btn btn-ghost btn-icon btn-sm"
      title={title}
      disabled={!text.trim()}
      onClick={() => speak(text, settings.ttsRate)}
    >
      <Volume2 size={16} />
    </button>
  )
}
