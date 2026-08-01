import { useState, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { useFormDefinition } from '../../catalog/api/formsApi';
import { createSubmission, confirmationPdfUrl } from '../api/submissionsApi';
import { validateFormValues } from '../lib/validateFormValues';
import { DynamicForm } from '../components/DynamicForm';
import { BroumyAlert } from '../../../components/ui';
import { normalizeApiError } from '../../../api/httpClient';
import type { Submission } from '../types/submission';

/**
 * Fetches the form's JSON Schema (`GET /api/forms/{formKey}`), renders it
 * via `DynamicForm`, validates client-side before submitting
 * (`POST /api/submissions`), and on success shows the tracking code +
 * confirmation PDF link + a link to look the submission up later. Handles
 * the two error shapes the backend actually returns (verified live): a
 * plain 422 with no field-level detail (form-level "please correct the
 * highlighted fields" message, since we cannot map it to a specific field),
 * and any other network/server failure.
 */
export function SubmissionPage() {
  const { formKey } = useParams<{ formKey: string }>();
  const { t } = useTranslation('submission');
  const { data: form, isLoading, isError: formLoadError } = useFormDefinition(formKey);

  const [values, setValues] = useState<Record<string, unknown>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formLevelError, setFormLevelError] = useState<string>();
  const [result, setResult] = useState<Submission | null>(null);

  const mutation = useMutation({
    mutationFn: () => createSubmission(formKey as string, values),
    onSuccess: (submission) => {
      setResult(submission);
      setFormLevelError(undefined);
    },
    onError: (error) => {
      const normalized = normalizeApiError(error);
      setFormLevelError(
        normalized.status === 422 ? t('validationError') : t('submitError'),
      );
    },
  });

  function handleChange(fieldKey: string, value: unknown) {
    setValues((prev) => ({ ...prev, [fieldKey]: value }));
    setFieldErrors((prev) => {
      if (!prev[fieldKey]) return prev;
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;

    const errors = validateFormValues(form.schema, form.uiSchema, values);
    if (errors.length > 0) {
      setFieldErrors(Object.fromEntries(errors.map((e) => [e.field, e.message])));
      setFormLevelError(t('validationError'));
      return;
    }

    setFieldErrors({});
    setFormLevelError(undefined);
    mutation.mutate();
  }

  if (isLoading) {
    return <p role="status" aria-live="polite">{t('loadingForm')}</p>;
  }

  if (formLoadError || !form) {
    return (
      <div>
        <BroumyAlert variant="error">{t('formNotFound')}</BroumyAlert>
        <Link to="/">{t('backToCatalog')}</Link>
      </div>
    );
  }

  if (result) {
    return (
      <div>
        <BroumyAlert variant="success" title={t('successTitle')}>
          {t('successBody')}
        </BroumyAlert>

        <p className="mt-lg">
          <span className="text-sm text-muted">{t('trackingCodeLabel')}</span>
          <br />
          <strong style={{ fontSize: 'var(--font-size-xl)' }}>{result.trackingCode}</strong>
        </p>

        <div className="d-flex gap-md mt-lg" style={{ flexWrap: 'wrap' }}>
          <a
            className="btn btn-primary"
            href={confirmationPdfUrl(result.trackingCode)}
            target="_blank"
            rel="noreferrer"
          >
            <span className="btn-label">{t('downloadPdf')}</span>
          </a>
          <Link
            className="btn btn-secondary"
            to={`/tracking/${encodeURIComponent(result.trackingCode)}`}
          >
            <span className="btn-label">{t('trackSubmission')}</span>
          </Link>
          <Link className="btn btn-outline" to="/">
            <span className="btn-label">{t('submitAnother')}</span>
          </Link>
        </div>
      </div>
    );
  }

  const lang = 'cs';
  const title = form.title[lang] ?? form.formKey;

  return (
    <div>
      <p>
        <Link to="/">{t('backToCatalog')}</Link>
      </p>
      <h1>{title}</h1>
      <p className="mb-lg">{form.description[lang]}</p>

      <DynamicForm
        schema={form.schema}
        uiSchema={form.uiSchema}
        values={values}
        errors={fieldErrors}
        formLevelError={formLevelError}
        submitting={mutation.isPending}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
