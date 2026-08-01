import api from '../../../api/client';
import type { ConfirmationDto } from '../types/confirmation';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8081';

/** HTML confirmation page (mirrors the PDF) — used by the preview iframe. */
export function confirmationHtmlUrl(trackingCode: string): string {
  return `${API_BASE}/api/submissions/${encodeURIComponent(trackingCode)}/confirmation`;
}

/** Binary PDF/A-1b confirmation file. */
export function confirmationPdfUrl(trackingCode: string): string {
  return `${API_BASE}/api/submissions/${encodeURIComponent(trackingCode)}/pdf`;
}

export async function getConfirmation(
  trackingCode: string,
): Promise<ConfirmationDto> {
  const { data } = await api.get<ConfirmationDto>(
    `/api/submissions/${encodeURIComponent(trackingCode)}/confirmation`,
  );
  return data;
}

/** Downloads the PDF bytes so the caller can trigger a browser save. */
export async function downloadConfirmationPdf(
  trackingCode: string,
): Promise<Blob> {
  const { data } = await api.get<Blob>(
    `/api/submissions/${encodeURIComponent(trackingCode)}/pdf`,
    { responseType: 'blob' },
  );
  return data;
}
