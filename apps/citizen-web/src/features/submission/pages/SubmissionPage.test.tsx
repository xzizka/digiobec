import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import i18n from '../../../i18n';
import { SubmissionPage } from './SubmissionPage';
import httpClient from '../../../api/httpClient';

beforeAll(() => i18n.changeLanguage('cs'));

async function expectNoA11yViolations(container: HTMLElement) {
  const results = await axe.run(container, { rules: { region: { enabled: false } } });
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toHaveLength(0);
}

// Spying on the shared axios instance (rather than mocking the api-layer
// module with a `{ ...actual, getFormDefinition: vi.fn() }` factory) avoids
// the ESM self-reference pitfall documented in FormCatalogPage.test.tsx:
// `useFormDefinition`'s internal call binds to the real module's own
// `getFormDefinition`, not to a re-exported mock. It also exercises the
// real `getFormDefinition`/`createSubmission` parsing logic (JSON.parse of
// the schema/uiSchema strings, JSON.stringify of the submitted values).
const getSpy = vi.spyOn(httpClient, 'get');
const postSpy = vi.spyOn(httpClient, 'post');

// Mirrors the real info-request form (forms/info-request/{schema,ui-schema}.json),
// verified live against the backend - including the RawFormDefinitionResponse
// shape where schema/uiSchema are JSON-encoded STRINGS, not nested objects.
const infoRequestSchema = {
  type: 'object',
  title: 'Žádost o informace',
  required: [
    'requesterName',
    'requesterContact',
    'requestType',
    'description',
    'deliveryMethod',
    'agreeTerms',
  ],
  properties: {
    requesterName: { type: 'string', title: 'Jméno a příjmení', minLength: 2, maxLength: 120 },
    requesterContact: {
      type: 'string',
      title: 'Kontakt (e-mail nebo telefon)',
      minLength: 5,
      maxLength: 255,
    },
    requestType: {
      type: 'string',
      title: 'Typ žádosti',
      enum: ['info-document', 'info-reuse', 'other'],
    },
    description: { type: 'string', title: 'Žádané informace', minLength: 10, maxLength: 5000 },
    deliveryMethod: {
      type: 'string',
      title: 'Způsob doručení',
      enum: ['email', 'isds', 'mail'],
    },
    dateNeeded: { type: 'string', title: 'Požadované datum (nepovinné)', format: 'date' },
    agreeTerms: {
      type: 'boolean',
      title: 'Souhlasím se zpracováním osobních údajů',
      const: true,
    },
  },
};

const infoRequestUiSchema = {
  requesterName: { 'ui:widget': 'text' },
  requesterContact: { 'ui:widget': 'text' },
  requestType: { 'ui:widget': 'select' },
  description: { 'ui:widget': 'textarea' },
  deliveryMethod: { 'ui:widget': 'select' },
  dateNeeded: {
    'ui:widget': 'date',
    'ui:condition': { field: 'requestType', value: 'info-document' },
  },
  agreeTerms: { 'ui:widget': 'checkbox' },
};

const rawFormDefinitionResponse = {
  formKey: 'info-request',
  title: { cs: 'Žádost o informace', en: 'Freedom of Information Request' },
  description: { cs: 'Podání žádosti dle zákona č. 106/1999 Sb.', en: '' },
  schema: JSON.stringify(infoRequestSchema),
  uiSchema: JSON.stringify(infoRequestUiSchema),
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/form/info-request']}>
        <Routes>
          <Route path="/form/:formKey" element={<SubmissionPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SubmissionPage', () => {
  beforeEach(() => {
    getSpy.mockReset();
    postSpy.mockReset();
    getSpy.mockResolvedValue({ data: rawFormDefinitionResponse });
  });

  it('renders the schema-driven form once the definition loads', async () => {
    renderPage();
    expect(await screen.findByLabelText(/Jméno a příjmení/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Kontakt \(e-mail nebo telefon\)/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Odeslat žádost' })).toBeInTheDocument();
    expect(getSpy).toHaveBeenCalledWith('/forms/info-request');
  });

  it('only shows the conditional dateNeeded field once requestType is info-document', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByLabelText(/Jméno a příjmení/);

    expect(screen.queryByLabelText(/Požadované datum/)).not.toBeInTheDocument();

    await user.selectOptions(
      screen.getByLabelText(/Typ žádosti/),
      screen.getByRole('option', { name: 'Poskytnutí informace' }),
    );

    expect(await screen.findByLabelText(/Požadované datum/)).toBeInTheDocument();
  });

  it('shows client-side validation errors and does not submit when required fields are empty', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByLabelText(/Jméno a příjmení/);

    await user.click(screen.getByRole('button', { name: 'Odeslat žádost' }));

    expect(
      await screen.findByText('Formulář obsahuje chyby. Opravte prosím zvýrazněná pole.'),
    ).toBeInTheDocument();
    expect(postSpy).not.toHaveBeenCalled();
  });

  async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText(/Jméno a příjmení/), 'Jan Novák');
    await user.type(screen.getByLabelText(/Kontakt \(e-mail nebo telefon\)/), 'jan@example.cz');
    await user.selectOptions(
      screen.getByLabelText(/Typ žádosti/),
      screen.getByRole('option', { name: 'Poskytnutí informace' }),
    );
    await user.type(
      screen.getByLabelText(/Žádané informace/),
      'Testovací žádost o poskytnutí informace ohledně územního plánu.',
    );
    await user.selectOptions(
      screen.getByLabelText(/Způsob doručení/),
      screen.getByRole('option', { name: 'E-mail' }),
    );
    await user.click(screen.getByLabelText(/Souhlasím se zpracováním/));
  }

  it('submits the form (JSON-stringified values) and shows the tracking code on success', async () => {
    const user = userEvent.setup();
    postSpy.mockResolvedValue({
      data: {
        id: '11111111-1111-1111-1111-111111111111',
        trackingCode: '2026-A7K3-9QXM-2FHT',
        formKey: 'info-request',
        formData: '{}',
        status: 'SUBMITTED',
        contactEmail: null,
        contactPhone: null,
        submittedAt: '2026-08-01T19:00:43.885Z',
      },
    });

    renderPage();
    await screen.findByLabelText(/Jméno a příjmení/);
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Odeslat žádost' }));

    await waitFor(() => expect(postSpy).toHaveBeenCalledTimes(1));
    const [url, body] = postSpy.mock.calls[0];
    expect(url).toBe('/submissions');
    expect(body).toMatchObject({ formKey: 'info-request' });
    expect(JSON.parse((body as { formData: string }).formData)).toMatchObject({
      requesterName: 'Jan Novák',
      requestType: 'info-document',
      agreeTerms: true,
    });

    expect(
      await screen.findByText('2026-A7K3-9QXM-2FHT'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Stáhnout potvrzení/ })).toHaveAttribute(
      'href',
      '/api/submissions/2026-A7K3-9QXM-2FHT/pdf',
    );
  });

  it('shows a generic error banner (not per-field detail) on a 422 response', async () => {
    const user = userEvent.setup();
    const axiosError = Object.assign(new Error('Request failed with status code 422'), {
      isAxiosError: true,
      response: { status: 422, data: { error: 'Unprocessable Entity' } },
    });
    postSpy.mockRejectedValue(axiosError);

    renderPage();
    await screen.findByLabelText(/Jméno a příjmení/);
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Odeslat žádost' }));

    const alert = await screen.findByRole('alert');
    expect(
      within(alert).getByText('Formulář obsahuje chyby. Opravte prosím zvýrazněná pole.'),
    ).toBeInTheDocument();
  });

  it('passes axe-core WCAG 2.1 AA checks', async () => {
    const { container } = renderPage();
    await screen.findByLabelText(/Jméno a příjmení/);
    await expectNoA11yViolations(container);
  });
});
