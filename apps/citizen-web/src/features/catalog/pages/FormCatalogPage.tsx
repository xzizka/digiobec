import { useTranslation } from 'react-i18next';
import { useForms } from '../api/formsApi';
import { FormCard } from '../components/FormCard';
import { BroumyAlert, BroumyButton } from '../../../components/ui';

/**
 * Public form catalog: grid of `FormCard` for every guest-submittable
 * municipal act, with loading/error/empty states and full i18n.
 */
export function FormCatalogPage() {
  const { t } = useTranslation('catalog');
  const { t: tCommon } = useTranslation('common');
  const { data: forms, isLoading, isError, refetch } = useForms();

  return (
    <div>
      <h1>{t('title')}</h1>
      <p className="mb-lg">{t('subtitle')}</p>

      {isLoading && (
        <p role="status" aria-live="polite">
          {tCommon('loading')}
        </p>
      )}

      {isError && (
        <BroumyAlert variant="error" title={t('errorState')}>
          <BroumyButton variant="secondary" onClick={() => refetch()}>
            {tCommon('retry')}
          </BroumyButton>
        </BroumyAlert>
      )}

      {forms && forms.length === 0 && <p>{t('empty')}</p>}

      {forms && forms.length > 0 && (
        <div className="form-catalog-grid">
          {forms.map((entry) => (
            <FormCard key={entry.formKey} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
