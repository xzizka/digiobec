import { useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getSubmission, confirmationPdfUrl } from '../api/trackingApi';
import { SubmissionStatusTimeline } from '../components/SubmissionStatusTimeline';
import { BroumyAlert, BroumyButton, BroumyInput } from '../../../components/ui';
import { normalizeApiError } from '../../../api/httpClient';
import { useForms } from '../../catalog/api/formsApi';

/**
 * Tracking-code lookup: `GET /api/submissions/{trackingCode}` → status
 * timeline + submitted-at + PDF confirmation download. Works both as a
 * direct link (`/tracking/:code`, e.g. bookmarked from the confirmation
 * screen) and as a manual lookup form (`/tracking`) for a citizen who
 * copied the code down separately.
 */
export function TrackingPage() {
  const { code } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('tracking');
  const { t: tCommon } = useTranslation('common');
  const [inputValue, setInputValue] = useState(code ?? '');
  const { data: forms } = useForms();

  const { data, error, isFetching } = useQuery({
    queryKey: ['submission-tracking', code],
    queryFn: () => getSubmission(code as string),
    enabled: Boolean(code),
    retry: false,
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    navigate(`/tracking/${encodeURIComponent(trimmed)}`);
  }

  const normalizedError = error ? normalizeApiError(error) : null;
  const formTitle = data
    ? (forms?.find((f) => f.formKey === data.formKey)?.title.cs ?? data.formKey)
    : null;

  return (
    <div>
      <h1>{t('title')}</h1>
      <p className="mb-lg">{t('subtitle')}</p>

      <form
        onSubmit={handleSubmit}
        className="d-flex gap-md mb-lg"
        style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}
      >
        <div style={{ minWidth: '18rem' }}>
          <BroumyInput
            label={t('inputLabel')}
            placeholder={t('inputPlaceholder')}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
          />
        </div>
        <BroumyButton type="submit">{t('lookupButton')}</BroumyButton>
      </form>

      {isFetching && (
        <p role="status" aria-live="polite">
          {tCommon('loading')}
        </p>
      )}

      {normalizedError && (
        <BroumyAlert variant="error">
          {normalizedError.status === 404 ? t('notFoundError') : t('genericError')}
        </BroumyAlert>
      )}

      {data && (
        <div>
          <dl>
            <dt className="font-medium">{t('formLabel')}</dt>
            <dd className="mb-sm">{formTitle}</dd>
            <dt className="font-medium">{t('submittedAtLabel')}</dt>
            <dd className="mb-lg">{new Date(data.submittedAt).toLocaleString('cs-CZ')}</dd>
          </dl>

          <h2>{t('statusHeading')}</h2>
          <SubmissionStatusTimeline status={data.status} />

          <a
            className="btn btn-primary mt-lg"
            href={confirmationPdfUrl(data.trackingCode)}
            target="_blank"
            rel="noreferrer"
          >
            <span className="btn-label">{t('downloadPdf')}</span>
          </a>
        </div>
      )}
    </div>
  );
}
