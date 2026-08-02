import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SubmissionsPage } from './SubmissionsPage';
import { getAdminSubmission, getAdminSubmissions } from '../features/submissions/api/adminSubmissionsApi';
import { getFormCatalog } from '../features/submissions/api/submissionsApi';

async function expectNoA11yViolations(container: HTMLElement) {
  const results = await axe.run(container, { rules: { region: { enabled: false } } });
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toHaveLength(0);
}

vi.mock('../features/submissions/api/adminSubmissionsApi', () => ({
  getAdminSubmissions: vi.fn(),
  getAdminSubmission: vi.fn(),
  changeSubmissionState: vi.fn(),
  downloadAdminSubmissionsCsv: vi.fn(),
}));

vi.mock('../features/submissions/api/submissionsApi', () => ({
  getFormCatalog: vi.fn(),
}));

const mockGetSubmissions = vi.mocked(getAdminSubmissions);
const mockGetSubmission = vi.mocked(getAdminSubmission);
const mockGetFormCatalog = vi.mocked(getFormCatalog);

function renderWithQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SubmissionsPage />
    </QueryClientProvider>,
  );
}

const sampleRow = {
  id: '11111111-1111-1111-1111-111111111111',
  trackingCode: '2026-A7K3-9QXM-2FHT',
  formKey: 'info-request',
  status: 'SUBMITTED' as const,
  contactEmail: 'anna@example.cz',
  submittedAt: '2026-08-01T10:00:00Z',
  slaStatus: 'OK' as const,
  dueAt: '2026-08-31T10:00:00Z',
};

const sampleDetail = {
  id: sampleRow.id,
  trackingCode: sampleRow.trackingCode,
  formKey: 'info-request',
  formData: '{"requesterName":"Anna Nováková"}',
  status: 'SUBMITTED' as const,
  contactEmail: 'anna@example.cz',
  contactPhone: null,
  submittedAt: '2026-08-01T10:00:00Z',
  updatedAt: '2026-08-01T10:00:00Z',
  slaStatus: 'OK' as const,
  dueAt: '2026-08-31T10:00:00Z',
  validNextStates: ['PROCESSING' as const],
  history: [],
  confirmationUrl: `/api/submissions/${sampleRow.trackingCode}/confirmation`,
  pdfUrl: `/api/submissions/${sampleRow.trackingCode}/pdf`,
};

describe('SubmissionsPage', () => {
  beforeEach(() => {
    mockGetSubmissions.mockReset();
    mockGetSubmission.mockReset();
    mockGetFormCatalog.mockReset();
    mockGetFormCatalog.mockResolvedValue([
      { formKey: 'info-request', title: { cs: 'Žádost o informace' }, description: { cs: '' }, department: '' },
    ]);
    mockGetSubmissions.mockResolvedValue({
      content: [sampleRow],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 20,
    });
  });

  it('passes axe-core WCAG 2.1 AA checks', async () => {
    const { container } = renderWithQueryClient();
    await screen.findByText(sampleRow.trackingCode);
    await expectNoA11yViolations(container);
  });

  it('renders the submissions table with SLA and status badges', async () => {
    renderWithQueryClient();

    const trackingCell = await screen.findByText(sampleRow.trackingCode);
    const row = trackingCell.closest('tr') as HTMLElement;

    expect(within(row).getByText('Přijato')).toBeInTheDocument();
    expect(within(row).getByText('V pořádku')).toBeInTheDocument();
    expect(within(row).getByText('Žádost o informace')).toBeInTheDocument();
  });

  it('re-queries with the selected status when a status filter checkbox is toggled', async () => {
    const user = userEvent.setup();
    renderWithQueryClient();
    await screen.findByText(sampleRow.trackingCode);

    const checkbox = screen.getByRole('checkbox', { name: /vyřízeno/i });
    await user.click(checkbox);

    await waitFor(() => {
      const calls = mockGetSubmissions.mock.calls;
      const lastCall = calls[calls.length - 1]?.[0];
      expect(lastCall?.status).toEqual(['COMPLETED']);
    });
  });

  it('opens the detail panel when a row is clicked', async () => {
    const user = userEvent.setup();
    mockGetSubmission.mockResolvedValue(sampleDetail);
    renderWithQueryClient();

    const row = await screen.findByText(sampleRow.trackingCode);
    await user.click(row);

    await waitFor(() => {
      expect(mockGetSubmission).toHaveBeenCalledWith(sampleRow.id);
    });
    expect(await screen.findByText('Historie stavů')).toBeInTheDocument();
  });

  it('offers the valid next state in the state-change modal', async () => {
    const user = userEvent.setup();
    mockGetSubmission.mockResolvedValue(sampleDetail);
    renderWithQueryClient();

    await user.click(await screen.findByText(sampleRow.trackingCode));
    await screen.findByText('Historie stavů');

    await user.click(screen.getByRole('button', { name: /změnit stav/i }));

    const dialog = screen.getByRole('dialog', { name: /změnit stav podání/i });
    const select = within(dialog).getByLabelText('Nový stav') as HTMLSelectElement;
    const optionValues = Array.from(select.options).map((o) => o.value);
    expect(optionValues).toContain('PROCESSING');
    expect(optionValues).not.toContain('COMPLETED');
  });
});
