import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfirmationDownload } from './components/ConfirmationDownload';
import { ConfirmationPreview } from './components/ConfirmationPreview';
import { downloadConfirmationPdf } from './api/confirmationsApi';

vi.mock('./api/confirmationsApi', () => ({
  downloadConfirmationPdf: vi.fn(),
  getConfirmation: vi.fn(),
  confirmationHtmlUrl: (code: string) =>
    `http://localhost:8081/api/submissions/${code}/confirmation`,
  confirmationPdfUrl: (code: string) =>
    `http://localhost:8081/api/submissions/${code}/pdf`,
}));

const mockDownload = vi.mocked(downloadConfirmationPdf);

describe('ConfirmationDownload', () => {
  beforeEach(() => {
    mockDownload.mockReset();
  });

  it('downloads the PDF and triggers a browser save', async () => {
    const user = userEvent.setup();
    mockDownload.mockResolvedValue(new Blob(['%PDF-1.4'], { type: 'application/pdf' }));

    render(<ConfirmationDownload trackingCode="TC-0001" />);

    await user.click(screen.getByRole('button', { name: /stáhnout pdf/i }));

    await waitFor(() => {
      expect(mockDownload).toHaveBeenCalledWith('TC-0001');
    });
  });

  it('shows an error alert when the download fails', async () => {
    const user = userEvent.setup();
    mockDownload.mockRejectedValue(new Error('boom'));

    render(<ConfirmationDownload trackingCode="TC-0001" />);

    await user.click(screen.getByRole('button', { name: /stáhnout pdf/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Stažení PDF se nezdařilo.',
      );
    });
  });
});

describe('ConfirmationPreview', () => {

  it('renders an iframe pointing at the confirmation HTML', () => {
    render(
      <ConfirmationPreview trackingCode="TC-0001" open onClose={() => {}} />,
    );

    const iframe = screen.getByTitle('Náhled potvrzení TC-0001') as HTMLIFrameElement;
    expect(iframe).toBeInTheDocument();
    expect(iframe.src).toContain(
      '/api/submissions/TC-0001/confirmation',
    );
    expect(
      screen.getByRole('button', { name: /tisknout/i }),
    ).toBeInTheDocument();
  });

  it('is not rendered when closed', () => {
    render(
      <ConfirmationPreview trackingCode="TC-0001" open={false} onClose={() => {}} />,
    );

    expect(screen.queryByTitle('Náhled potvrzení TC-0001')).not.toBeInTheDocument();
  });
});
