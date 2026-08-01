import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import i18n from '../../../i18n';
import { FormCatalogPage } from './FormCatalogPage';
import httpClient from '../../../api/httpClient';

// jsdom's default navigator language ("en-US") otherwise wins over the
// app's `fallbackLng: 'cs'` via i18next-browser-languagedetector, rendering
// English strings - force Czech so assertions match the primary locale
// (mirrors apps/admin-web/src/features/auth/LoginPage.test.tsx, Plan 06).
beforeAll(() => i18n.changeLanguage('cs'));

async function expectNoA11yViolations(container: HTMLElement) {
  const results = await axe.run(container, { rules: { region: { enabled: false } } });
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toHaveLength(0);
}

// Mocking at the httpClient boundary (rather than re-exporting `getFormCatalog`
// from a `vi.mock('../api/formsApi', ...)` factory) avoids a real ESM
// self-reference pitfall: `useForms`'s internal call to `getFormCatalog`
// binds to the *actual* module's own top-level function, not to a mock
// re-exported alongside `...actual` - so overriding just the named export
// silently has no effect on calls made from within the same module.
// Spying on the shared axios instance's `.get` sidesteps that entirely.
const getSpy = vi.spyOn(httpClient, 'get');

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <FormCatalogPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const sampleEntry = {
  formKey: 'info-request',
  title: { cs: 'Žádost o informace', en: 'Freedom of Information Request' },
  description: { cs: 'Podání žádosti o informace.', en: 'Submit an information request.' },
  department: 'Podatelna',
};

describe('FormCatalogPage', () => {
  beforeEach(() => {
    getSpy.mockReset();
  });

  it('renders the catalog of forms once loaded', async () => {
    getSpy.mockResolvedValue({ data: [sampleEntry] });
    renderPage();

    expect(await screen.findByText('Žádost o informace')).toBeInTheDocument();
    expect(screen.getByText('Podání žádosti o informace.')).toBeInTheDocument();
    expect(screen.getByText(/Podatelna/)).toBeInTheDocument();
    expect(getSpy).toHaveBeenCalledWith('/forms');
  });

  it('shows the empty state when the catalog has no forms', async () => {
    getSpy.mockResolvedValue({ data: [] });
    renderPage();

    expect(
      await screen.findByText('Aktuálně nejsou k dispozici žádné formuláře.'),
    ).toBeInTheDocument();
  });

  it('shows an error state with a retry button on failure', async () => {
    getSpy.mockRejectedValueOnce(new Error('network down'));
    getSpy.mockResolvedValueOnce({ data: [sampleEntry] });
    renderPage();

    expect(
      await screen.findByText('Nepodařilo se načíst katalog formulářů.'),
    ).toBeInTheDocument();
    const retryButton = screen.getByRole('button', { name: 'Zkusit znovu' });

    retryButton.click();

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledTimes(2);
    });
    expect(await screen.findByText('Žádost o informace')).toBeInTheDocument();
  });

  it('passes axe-core WCAG 2.1 AA checks', async () => {
    getSpy.mockResolvedValue({ data: [sampleEntry] });
    const { container } = renderPage();
    await screen.findByText('Žádost o informace');
    await expectNoA11yViolations(container);
  });
});
