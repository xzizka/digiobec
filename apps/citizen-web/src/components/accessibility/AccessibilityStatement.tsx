import { useTranslation } from 'react-i18next';

/**
 * FR-08.6: mandatory accessibility statement page (Prohlášení o
 * přístupnosti) per Zákon č. 99/2019 Sb. — covers the required content:
 * scope/legal basis, compliance status, statement preparation date, a
 * designated contact person for accessibility feedback, and the
 * enforcement-procedure contact. Linked from the footer on every page.
 */
export function AccessibilityStatement() {
  const { t } = useTranslation('accessibility');

  return (
    <article>
      <h1>{t('title')}</h1>
      <p className="mb-lg">{t('intro')}</p>

      <section className="mb-lg">
        <h2>{t('statusHeading')}</h2>
        <p>{t('statusBody')}</p>
      </section>

      <section className="mb-lg">
        <h2>{t('processedHeading')}</h2>
        <p>{t('processedBody')}</p>
      </section>

      <section className="mb-lg">
        <h2>{t('feedbackHeading')}</h2>
        <p>{t('feedbackBody')}</p>
        <p>
          <strong>{t('contactPersonLabel')}:</strong> {t('contactPersonValue')}
        </p>
      </section>

      <section>
        <h2>{t('enforcementHeading')}</h2>
        <p>{t('enforcementBody')}</p>
      </section>
    </article>
  );
}
