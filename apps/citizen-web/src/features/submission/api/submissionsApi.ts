import httpClient from '../../../api/httpClient';
import type { Submission, SubmissionRequest } from '../types/submission';

/**
 * `POST /api/submissions` — guest submission. `formValues` (the citizen's
 * answers, keyed by JSON Schema property name) is JSON-stringified into
 * `formData` per `SubmissionRequestDto`; the backend re-validates it
 * server-side against the same schema before persisting.
 */
export async function createSubmission(
  formKey: string,
  formValues: Record<string, unknown>,
): Promise<Submission> {
  const body: SubmissionRequest = {
    formKey,
    formData: JSON.stringify(formValues),
  };
  const { data } = await httpClient.post<Submission>('/submissions', body);
  return data;
}

/** `GET /api/submissions/{trackingCode}` — public lookup by tracking code. */
export async function getSubmission(trackingCode: string): Promise<Submission> {
  const { data } = await httpClient.get<Submission>(
    `/submissions/${encodeURIComponent(trackingCode)}`,
  );
  return data;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * `GET /api/submissions/{trackingCode}/pdf` — binary PDF/A-1b confirmation.
 * This endpoint requires no auth (tracking code = unguessable UUID v7), so a
 * plain anchor download works without an axios blob round-trip.
 */
export function confirmationPdfUrl(trackingCode: string): string {
  return `${API_BASE}/submissions/${encodeURIComponent(trackingCode)}/pdf`;
}
