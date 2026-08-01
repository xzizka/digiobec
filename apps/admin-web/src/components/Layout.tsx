import { Link, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, FileText, Settings, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { t, i18n, ready } = useTranslation('common')
  const { t: tNav } = useTranslation('navigation')
  const location = useLocation()

  const navigation = [
    { name: tNav('dashboard'), href: '/', icon: LayoutDashboard },
    { name: tNav('submissions'), href: '/submissions', icon: FileText },
    { name: tNav('settings'), href: '/settings', icon: Settings },
  ]

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label={t('common.navigation')}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          <Link to="/" className="font-semibold text-lg text-primary" aria-label={`${t('common.appName')} - ${tNav('dashboard')}`}>
            {t('common.appName')}
          </Link>
          <button
            className="lg:hidden p-2 rounded-md text-text-secondary hover:bg-surface-hover"
            onClick={() => setSidebarOpen(false)}
            aria-label={t('common.close')}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-1" role="navigation" aria-label={t('common.navigation')}>
          {navigation.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-text-primary hover:bg-surface-hover hover:text-primary transition-colors ${
                location.pathname === item.href ? 'bg-primary/10 text-primary' : ''
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={20} aria-hidden="true" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-text-secondary">{t('common.language')}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => changeLanguage('cs')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                i18n.language === 'cs'
                  ? 'bg-primary text-text-on-primary'
                  : 'bg-surface-hover text-text-primary hover:bg-surface-active'
              }`}
              aria-pressed={i18n.language === 'cs'}
            >
              🇨🇿 Česky
            </button>
            <button
              onClick={() => changeLanguage('en')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                i18n.language === 'en'
                  ? 'bg-primary text-text-on-primary'
                  : 'bg-surface-hover text-text-primary hover:bg-surface-active'
              }`}
              aria-pressed={i18n.language === 'en'}
            >
              🇬🇧 English
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:pl-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-surface border-b border-border flex items-center justify-between px-4 lg:px-8">
          <button
            className="lg:hidden p-2 rounded-md text-text-secondary hover:bg-surface-hover"
            onClick={() => setSidebarOpen(true)}
            aria-label={t('common.openMenu')}
            aria-expanded={sidebarOpen}
            aria-controls="sidebar"
          >
            <Menu size={24} />
          </button>

          <div className="flex-1 lg:flex-none" />

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-text-secondary">
              <span>{t('common.clerk')}</span>
            </div>
            <button
              className="p-2 rounded-md text-text-secondary hover:bg-surface-hover hover:text-primary"
              aria-label={tNav('logout')}
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto" role="main">
          <a href="#main-content" className="skip-link">
            {t('common.skipToContent')}
          </a>
          <Outlet />
        </main>
      </div>
    </div>
  )
}