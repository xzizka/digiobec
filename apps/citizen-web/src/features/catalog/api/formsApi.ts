import { useQuery } from '@tanstack/react-query';
import httpClient from '../../../api/httpClient';
import type {
  FormCatalogEntry,
  FormDefinition,
  RawFormDefinitionResponse,
} from '../types/form';

/** `GET /api/forms` — catalog of guest-submittable municipal forms. */
export async function getFormCatalog(): Promise<FormCatalogEntry[]> {
  const { data } = await httpClient.get<FormCatalogEntry[]>('/forms');
  return data;
}

/**
 * `GET /api/forms/{key}` — JSON Schema + UI Schema for a single form.
 *
 * `schema`/`uiSchema` arrive as JSON-encoded strings (see
 * `RawFormDefinitionResponse` doc comment) and are parsed here so the rest
 * of the app only ever deals with real objects.
 */
export async function getFormDefinition(formKey: string): Promise<FormDefinition> {
  const { data } = await httpClient.get<RawFormDefinitionResponse>(
    `/forms/${encodeURIComponent(formKey)}`,
  );
  return {
    formKey: data.formKey,
    title: data.title,
    description: data.description,
    schema: JSON.parse(data.schema),
    uiSchema: JSON.parse(data.uiSchema),
  };
}

/** TanStack Query hook for the form catalog. */
export function useForms() {
  return useQuery({
    queryKey: ['forms-catalog'],
    queryFn: getFormCatalog,
  });
}

/** TanStack Query hook for a single form's definition. */
export function useFormDefinition(formKey: string | undefined) {
  return useQuery({
    queryKey: ['form-definition', formKey],
    queryFn: () => getFormDefinition(formKey as string),
    enabled: Boolean(formKey),
  });
}
