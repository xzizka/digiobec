import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import i18n from '../../../i18n';
import { TrackingPage } from './TrackingPage';
import httpClient from '../../../api/httpClient';

beforeAll(() => i18n.changeLanguage('cs'));

async function expectNoA11yViolations(container: HTMLElement) {
  const results = await axe.run(container, { rules: { region: { enabled: false } } });
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toHaveLength(0);
}

// Spying on the shared axios instance (see FormCatalogPage.test.tsx for why
// this is preferred over mocking the api-layer module directly: it avoids
// an ESM self-reference pitfall where a hook's internal call to a sibling
// named export does not see a `{ ...actual, foo: vi.fn() }` override).
const getSpy = vi.spyOn(httpClient, 'get');

const TRACKING_CODE = '0019fbeb336ed-770cb9a5-2a4e-48d5-8f9d';

const formCatalog = [
  {
    formKey: 'info-request',
    title: { cs: 'Žádost o informace', en: 'Freedom of Information Request' },
    description: { cs: '', en: '' },
    department: 'Podatelna',
  },
];

function mockSubmission(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: '1',
    trackingCode: TRACKING_CODE,
    formKey: 'info-request',
    formData: '{}',
    status: 'SUBMITTED',
    contactEmail: null,
    contactPhone: null,
    submittedAt: '2026-08-01T19:00:43.885Z',
    ...overrides,
  };
}

function renderAt(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/tracking" element={<TrackingPage />} />
          <Route path="/tracking/:code" element={<TrackingPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TrackingPage', () => {
  beforeEach(() => {
    getSpy.mockReset();
    getSpy.mockImplementation(async (url: string) => {
      if (url === '/forms') return { data: formCatalog };
      throw new Error(`unexpected GET ${url}`);
    });
  });

  it('looks up a tracking code passed directly in the URL and renders the status timeline', async () => {
    getSpy.mockImplementation(async (url: string) => {
      if (url === '/forms') return { data: formCatalog };
      if (url === `/submissions/${TRACKING_CODE}`) {
        return { data: mockSubmission({ status: 'PROCESSING' }) };
      }
      throw new Error(`unexpected GET ${url}`);
    });

    renderAt(`/tracking/${TRACKING_CODE}`);

    expect(await screen.findByText('Žádost o informace')).toBeInTheDocument();
    expect(screen.getByText('Zpracovává se')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Stáhnout potvrzení/ })).toHaveAttribute(
      'href',
      `/api/submissions/${TRACKING_CODE}/pdf`,
    );
  });

  it('navigates to /tracking/:code when a code is entered manually', async () => {
    const user = userEvent.setup();
    getSpy.mockImplementation(async (url: string) => {
      if (url === '/forms') return { data: formCatalog };
      if (url === `/submissions/${TRACKING_CODE}`) return { data: mockSubmission() };
      throw new Error(`unexpected GET ${url}`);
    });

    renderAt('/tracking');
    await user.type(screen.getByLabelText('Sledovací kód'), TRACKING_CODE);
    await user.click(screen.getByRole('button', { name: 'Zjistit stav' }));

    await waitFor(() =>
      expect(getSpy).toHaveBeenCalledWith(`/submissions/${TRACKING_CODE}`),
    );
    expect(await screen.findByText('Podáno')).toBeInTheDocument();
  });

  it('shows a not-found error for an unknown tracking code', async () => {
    const axiosError = Object.assign(new Error('Request failed with status code 404'), {
      isAxiosError: true,
      response: { status: 404, data: { error: 'Not Found' } },
    });
    getSpy.mockImplementation(async (url: string) => {
      if (url === '/forms') return { data: formCatalog };
      throw axiosError;
    });

    renderAt('/tracking/does-not-exist');

    expect(
      await screen.findByText(
        'Podání s tímto sledovacím kódem nebylo nalezeno. Zkontrolujte prosím kód a zkuste to znovu.',
      ),
    ).toBeInTheDocument();
  });

  it('passes axe-core WCAG 2.1 AA checks', async () => {
    getSpy.mockImplementation(async (url: string) => {
      if (url === '/forms') return { data: formCatalog };
      if (url === `/submissions/${TRACKING_CODE}`) {
        return { data: mockSubmission({ status: 'COMPLETED' }) };
      }
      throw new Error(`unexpected GET ${url}`);
    });
    const { container } = renderAt(`/tracking/${TRACKING_CODE}`);
    await screen.findByText('Vyřízeno');
    await expectNoA11yViolations(container);
  });
});
