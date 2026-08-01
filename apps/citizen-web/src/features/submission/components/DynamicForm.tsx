import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { JsonSchema, UiSchema } from '../../catalog/types/form';
import { isFieldVisible } from '../lib/validateFormValues';
import { FormFieldRenderer } from './FormFieldRenderer';
import { BroumyAlert, BroumyButton } from '../../../components/ui';

export interface DynamicFormProps {
  schema: JsonSchema;
  uiSchema: UiSchema;
  values: Record<string, unknown>;
  errors: Record<string, string>;
  /** Set when the last submit attempt failed validation (client or server). */
  formLevelError?: string;
  submitting: boolean;
  onChange: (fieldKey: string, value: unknown) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

/**
 * Schema-driven form: renders one `FormFieldRenderer` per JSON Schema
 * property (in schema order), skipping fields whose `ui:condition` is not
 * currently satisfied (e.g. `dateNeeded` only shows when
 * `requestType === 'info-document'`). Combines client-side validation
 * (`validateFormValues`, mirroring the server's rules for instant feedback)
 * with server-side field errors surfaced back from the failed submission.
 */
export function DynamicForm({
  schema,
  uiSchema,
  values,
  errors,
  formLevelError,
  submitting,
  onChange,
  onSubmit,
}: DynamicFormProps) {
  const { t } = useTranslation('submission');
  const requiredFields = new Set(schema.required ?? []);

  return (
    <form onSubmit={onSubmit} noValidate aria-label={schema.title}>
      {formLevelError && (
        <BroumyAlert variant="error" className="mb-md">
          {formLevelError}
        </BroumyAlert>
      )}

      {Object.entries(schema.properties)
        .filter(([key]) => isFieldVisible(key, uiSchema, values))
        .map(([key, property]) => (
          <FormFieldRenderer
            key={key}
            fieldKey={key}
            property={property}
            uiConfig={uiSchema[key]}
            required={requiredFields.has(key)}
            value={values[key]}
            error={errors[key]}
            onChange={onChange}
          />
        ))}

      <BroumyButton type="submit" loading={submitting} disabled={submitting}>
        {submitting ? t('submitting') : t('submit')}
      </BroumyButton>
    </form>
  );
}
