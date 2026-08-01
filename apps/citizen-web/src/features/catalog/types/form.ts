/** `GET /api/forms` catalog entry. Matches `FormCatalogEntryDto` (backend). */
export interface FormCatalogEntry {
  formKey: string;
  title: Record<string, string>;
  description: Record<string, string>;
  department: string;
}

export type JsonSchemaFieldType = 'string' | 'boolean' | 'number' | 'integer';

/** A single JSON Schema (draft-07) property, as used by the form definitions. */
export interface JsonSchemaProperty {
  type: JsonSchemaFieldType;
  title?: string;
  minLength?: number;
  maxLength?: number;
  enum?: string[];
  const?: unknown;
  format?: string;
}

export interface JsonSchema {
  type: 'object';
  title?: string;
  required?: string[];
  properties: Record<string, JsonSchemaProperty>;
}

export type UiWidget = 'text' | 'textarea' | 'select' | 'date' | 'checkbox' | 'address';

export interface UiFieldCondition {
  field: string;
  value: unknown;
}

export interface UiFieldConfig {
  'ui:widget'?: UiWidget;
  'ui:autofocus'?: boolean;
  'ui:placeholder'?: string;
  'ui:condition'?: UiFieldCondition;
}

export type UiSchema = Record<string, UiFieldConfig>;

/**
 * Raw wire shape of `GET /api/forms/{key}`. Verified live against the
 * backend: `schema` and `uiSchema` are JSON-encoded STRINGS (the backend's
 * `FormDefinition.schema`/`uiSchema` are stored as compact JSON text and
 * Jackson serializes a `String` property as a quoted/escaped JSON string,
 * not as a nested object) - they must be `JSON.parse`d client-side. See
 * `formsApi.getFormDefinition` for the parsing step.
 */
export interface RawFormDefinitionResponse {
  formKey: string;
  title: Record<string, string>;
  description: Record<string, string>;
  schema: string;
  uiSchema: string;
}

/** Parsed, ready-to-render form definition. */
export interface FormDefinition {
  formKey: string;
  title: Record<string, string>;
  description: Record<string, string>;
  schema: JsonSchema;
  uiSchema: UiSchema;
}
