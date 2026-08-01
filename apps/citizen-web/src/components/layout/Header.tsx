import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Public top header: municipality name/logo, skip-link target anchor,
 * primary navigation (catalog / tracking), and a cs/en language switch.
 * Sticky, uses the shared Broumy theme tokens/classes.
 */
export function Header() {
  const { t, i18n } = useTranslation('common');
  const { t: tNav } = useTranslation('navigation');
  const location = useLocation();

  const navigation = [
    { href: '/', label: tNav('catalog') },
    { href: '/tracking', label: tNav('tracking') },
  ];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <header className="public-header">
      <a href="#main-content" className="skip-link">
        {t('skipToContent')}
      </a>
      <div className="public-header-inner">
        <Link to="/" className="public-header-brand" aria-label={t('appName')}>
          <img src="/favicon.svg" alt="" width={32} height={32} aria-hidden="true" />
          {t('appName')}
        </Link>

        <nav className="public-nav" aria-label={t('appName')}>
          {navigation.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              aria-current={location.pathname === item.href ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="public-lang-switch" role="group" aria-label={t('language')}>
          <button
            type="button"
            onClick={() => changeLanguage('cs')}
            aria-pressed={i18n.language.startsWith('cs')}
          >
            CS
          </button>
          <button
            type="button"
            onClick={() => changeLanguage('en')}
            aria-pressed={i18n.language.startsWith('en')}
          >
            EN
          </button>
        </div>
      </div>
    </header>
  );
}
