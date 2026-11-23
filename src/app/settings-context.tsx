import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export interface Settings {
  theme: 'dark' | 'light'
  dailyGoal: number
  dailyNewCards: number
  ttsRate: number
  defaultDeckId: number | null
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  dailyGoal: 20,
  dailyNewCards: 10,
  ttsRate: 0.9,
  defaultDeckId: null,
}

const STORAGE_KEY = 'english-flashcards-settings'

interface SettingsContextValue {
  settings: Settings
  update: (patch: Partial<Settings>) => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    document.documentElement.dataset.theme = settings.theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content',
      settings.theme === 'dark' ? '#0f172a' : '#f8fafc',
    )
  }, [settings])

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      update: (patch) => setSettings((current) => ({ ...current, ...patch })),
    }),
    [settings],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) throw new Error('useSettings must be used inside SettingsProvider')
  return context
}
