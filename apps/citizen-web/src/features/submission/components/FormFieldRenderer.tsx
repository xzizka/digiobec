import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import type { JsonSchemaProperty, UiFieldConfig, UiWidget } from '../../catalog/types/form';
import { BroumyInput, BroumySelect, BroumyTextarea } from '../../../components/ui';
import { AddressAutocomplete, type AddressSuggestion } from './AddressAutocomplete';

export interface FormFieldRendererProps {
  fieldKey: string;
  property: JsonSchemaProperty;
  uiConfig: UiFieldConfig | undefined;
  required: boolean;
  value: unknown;
  error?: string;
  onChange: (fieldKey: string, value: unknown) => void;
}

/**
 * A few enum values in the demo `info-request` form read better with a
 * proper label than their raw wire value (mirrors the labels the backend's
 * own confirmation renderer uses in `ConfirmationRenderer.kt`). Falls back
 * to the raw value for anything not listed here, so future forms/enum
 * values never render blank.
 */
const ENUM_LABELS: Record<string, string> = {
  'info-document': 'Poskytnutí informace',
  'info-reuse': 'Další využití informace',
  other: 'Jiné',
  email: 'E-mail',
  isds: 'Datová schránka',
  mail: 'Poštou',
};

function widgetFor(uiConfig: UiFieldConfig | undefined, property: JsonSchemaProperty): UiWidget {
  const widget = uiConfig?.['ui:widget'];
  if (widget) return widget;
  if (property.type === 'boolean') return 'checkbox';
  if (property.enum) return 'select';
  return 'text';
}

/**
 * Field factory: maps a JSON Schema property + UI Schema hint to the
 * correct Broumy input (text/textarea/select/date/checkbox/address).
 * Wires `aria-describedby`/`aria-invalid` via the underlying Broumy*
 * component and a required marker on the label.
 */
export function FormFieldRenderer({
  fieldKey,
  property,
  uiConfig,
  required,
  value,
  error,
  onChange,
}: FormFieldRendererProps) {
  const { t } = useTranslation('submission');
  const checkboxId = useId();
  const widget = widgetFor(uiConfig, property);
  const label = required
    ? `${property.title ?? fieldKey} ${t('requiredMarker')}`
    : property.title ?? fieldKey;

  switch (widget) {
    case 'textarea':
      return (
        <BroumyTextarea
          label={label}
          value={(value as string) ?? ''}
          error={error}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          maxLength={property.maxLength}
        />
      );

    case 'select':
      return (
        <BroumySelect
          label={label}
          value={(value as string) ?? ''}
          error={error}
          placeholder="Vyberte možnost"
          options={(property.enum ?? []).map((option) => ({
            value: option,
            label: ENUM_LABELS[option] ?? option,
          }))}
          onChange={(e) => onChange(fieldKey, e.target.value)}
        />
      );

    case 'date':
      return (
        <BroumyInput
          label={label}
          type="date"
          value={(value as string) ?? ''}
          error={error}
          onChange={(e) => onChange(fieldKey, e.target.value)}
        />
      );

    case 'checkbox':
      return (
        <div className="form-check">
          <input
            id={checkboxId}
            type="checkbox"
            className="form-check-input"
            checked={value === true}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${checkboxId}-error` : undefined}
            onChange={(e) => onChange(fieldKey, e.target.checked)}
          />
          <label htmlFor={checkboxId} className="form-check-label">
            {label}
          </label>
          {error && (
            <span id={`${checkboxId}-error`} className="form-error" role="alert">
              {error}
            </span>
          )}
        </div>
      );

    case 'address':
      return (
        <AddressAutocomplete
          label={label}
          placeholder={t('addressLookupPlaceholder')}
          onSelect={(suggestion: AddressSuggestion) => onChange(fieldKey, suggestion.label)}
        />
      );

    case 'text':
    default:
      // Note: `ui:condition`/other ui: hints are honored, but `ui:autofocus`
      // is intentionally NOT applied - jsx-a11y/no-autofocus flags
      // programmatic autofocus as harmful for screen-reader and low-vision
      // users (it silently moves focus away from the page landmarks).
      return (
        <BroumyInput
          label={label}
          value={(value as string) ?? ''}
          error={error}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          placeholder={uiConfig?.['ui:placeholder']}
          maxLength={property.maxLength}
        />
      );
  }
}
