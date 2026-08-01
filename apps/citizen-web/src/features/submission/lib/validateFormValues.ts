import type { JsonSchema, JsonSchemaProperty, UiSchema } from '../../catalog/types/form';

export interface FieldError {
  field: string;
  message: string;
}

/**
 * A field is visible only if it has no `ui:condition`, or the condition's
 * target field currently equals the condition's value. Mirrors the mobile
 * app's `FormFieldSpec.isVisible` (Plan 03) so both clients hide/show
 * conditional fields (e.g. `dateNeeded`) identically.
 */
export function isFieldVisible(
  fieldKey: string,
  uiSchema: UiSchema,
  values: Record<string, unknown>,
): boolean {
  const condition = uiSchema[fieldKey]?.['ui:condition'];
  if (!condition) return true;
  const actual = values[condition.field];
  return String(actual ?? '') === String(condition.value);
}

function validateProperty(
  key: string,
  prop: JsonSchemaProperty,
  required: boolean,
  value: unknown,
): FieldError | null {
  if (prop.type === 'boolean') {
    if (prop.const === true && value !== true) {
      return { field: key, message: 'Toto pole musí být zaškrtnuto.' };
    }
    return null;
  }

  const raw = typeof value === 'string' ? value : value == null ? '' : String(value);
  const trimmed = raw.trim();

  if (required && trimmed.length === 0) {
    return { field: key, message: 'Toto pole je povinné.' };
  }
  if (trimmed.length === 0) {
    return null;
  }
  if (prop.enum && !prop.enum.includes(raw)) {
    return { field: key, message: 'Vyberte prosím platnou možnost.' };
  }
  if (typeof prop.minLength === 'number' && raw.length < prop.minLength) {
    return { field: key, message: `Minimální délka je ${prop.minLength} znaků.` };
  }
  if (typeof prop.maxLength === 'number' && raw.length > prop.maxLength) {
    return { field: key, message: `Maximální délka je ${prop.maxLength} znaků.` };
  }
  return null;
}

/**
 * Client-side mirror of the server's JSON Schema validation
 * (`FormValidationService`, backend) — gives citizens instant feedback
 * before the round-trip, exactly like the mobile app's local validation
 * mirror (Plan 03). The backend remains the source of truth: it re-validates
 * every submission regardless of what passed here.
 *
 * Hidden (conditionally-invisible) fields are skipped entirely, matching
 * `isFieldVisible` so e.g. `dateNeeded` is never flagged as required when
 * `requestType !== 'info-document'`.
 */
export function validateFormValues(
  schema: JsonSchema,
  uiSchema: UiSchema,
  values: Record<string, unknown>,
): FieldError[] {
  const required = new Set(schema.required ?? []);
  const errors: FieldError[] = [];

  for (const [key, prop] of Object.entries(schema.properties)) {
    if (!isFieldVisible(key, uiSchema, values)) continue;
    const error = validateProperty(key, prop, required.has(key), values[key]);
    if (error) errors.push(error);
  }

  return errors;
}
