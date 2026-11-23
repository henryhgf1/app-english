import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  BarChart3,
  BookOpen,
  Brain,
  CircleHelp,
  CreditCard,
  Download,
  LayoutDashboard,
  Layers,
  Moon,
  PlusCircle,
  RefreshCw,
  Settings as SettingsIcon,
  Sun,
  X,
} from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useSettings } from './settings-context'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const navigation = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/add', label: 'Add cards', icon: PlusCircle },
  { to: '/decks', label: 'Decks', icon: Layers },
  { to: '/cards', label: 'Cards', icon: CreditCard },
  { to: '/review', label: 'Review', icon: Brain },
  { to: '/notes', label: 'Notes', icon: BookOpen },
  { to: '/quiz', label: 'Quiz', icon: CircleHelp },
  { to: '/stats', label: 'Stats', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export default function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { settings, update } = useSettings()
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissUpdate, setDismissUpdate] = useState(false)
  const { needRefresh, updateServiceWorker } = useRegisterSW()

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  const current = navigation.find((item) => item.to === location.pathname)
  const title = current?.label ?? 'Dashboard'

  async function installApp() {
    if (!installEvent) return
    await installEvent.prompt()
    await installEvent.userChoice
    setInstallEvent(null)
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">A</div>
          <div>
            <strong>English</strong>
            <span>Flashcards</span>
          </div>
        </div>
        <nav className="nav" aria-label="Main navigation">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' nav-item-active' : ''}`}
            >
              <Icon size={19} strokeWidth={1.9} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">Local-first. No account. No cloud.</div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div>
            <h1>{title}</h1>
            <p className="topbar-subtitle">Your English, one card at a time.</p>
          </div>
          <div className="topbar-actions">
            {installEvent && (
              <button className="btn btn-ghost" onClick={installApp} title="Install app">
                <Download size={17} /> <span className="hide-small">Install</span>
              </button>
            )}
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => update({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
              title={settings.theme === 'dark' ? 'Light theme' : 'Dark theme'}
            >
              {settings.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>
        <main className="page">{children}</main>
      </div>

      {needRefresh && !dismissUpdate && (
        <div className="update-toast" role="status">
          <RefreshCw size={18} />
          <span>New version available.</span>
          <button className="btn btn-primary btn-sm" onClick={() => updateServiceWorker(true)}>
            Reload
          </button>
          <button className="btn btn-icon btn-sm" onClick={() => setDismissUpdate(true)} title="Dismiss">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
