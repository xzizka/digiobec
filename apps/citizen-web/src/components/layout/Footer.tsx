import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Public footer: contacts, quick links, and the FR-08.6 accessibility
 * statement link (mandatory on every page per Zákon č. 99/2019 Sb.).
 */
export function Footer() {
  const { t } = useTranslation('footer');

  return (
    <footer className="public-footer">
      <div className="public-footer-inner">
        <div>
          <h2 className="text-lg font-semibold mb-sm">{t('contactTitle')}</h2>
          <p>{t('contactAddress')}</p>
          <p>
            <a href={`mailto:${t('contactEmail')}`}>{t('contactEmail')}</a>
          </p>
          <p>
            <a href={`tel:${t('contactPhone').replace(/\s+/g, '')}`}>{t('contactPhone')}</a>
          </p>
        </div>

        <nav aria-label={t('linksTitle')}>
          <h2 className="text-lg font-semibold mb-sm">{t('linksTitle')}</h2>
          <ul className="public-footer-links">
            <li>
              <Link to="/tracking">{t('tracking')}</Link>
            </li>
            <li>
              <Link to="/pristupnost">{t('accessibility')}</Link>
            </li>
          </ul>
        </nav>
      </div>
      <p className="text-sm mt-lg text-center">
        {t('copyright', { year: new Date().getFullYear() })}
      </p>
    </footer>
  );
}
