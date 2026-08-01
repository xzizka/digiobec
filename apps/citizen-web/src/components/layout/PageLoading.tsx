import { useTranslation } from 'react-i18next';

/** Route-level Suspense fallback shown while a lazy page chunk loads. */
export function PageLoading() {
  const { t } = useTranslation('common');
  return (
    <div role="status" aria-live="polite" className="p-lg text-center">
      {t('loading')}
    </div>
  );
}
