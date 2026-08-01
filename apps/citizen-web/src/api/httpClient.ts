import axios, { type AxiosError } from 'axios';

/**
 * Shared axios instance for all public citizen-web API calls.
 *
 * `baseURL` defaults to `/api` (same-origin): in dev, `vite.config.ts`
 * proxies `/api/**` to the backend on `localhost:8081`; in production the
 * static build is served behind a reverse proxy that forwards `/api/**` to
 * the backend. Both paths avoid a cross-origin request entirely, so no
 * CORS configuration is required on the backend for this app (T-07-06).
 */
const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export interface NormalizedApiError {
  /** HTTP status code, or `null` if the request never reached the server. */
  status: number | null;
  /** Best-effort human-readable message extracted from the response body. */
  message: string;
  /** Field name, when the backend's joined "field: message; ..." string exposes one. */
  field?: string;
}

/**
 * Normalizes any error thrown by an axios call into `{status, message, field?}`.
 *
 * The backend's public submission endpoint throws a plain
 * `ResponseStatusException(UNPROCESSABLE_ENTITY, "field: message; field2: msg2")`
 * server-side. Verified live against a running backend: Spring Boot's default
 * error body does NOT include a `message` key unless
 * `server.error.include-message` is set (it isn't) - a 422 response body is
 * just `{"timestamp","status","error":"Unprocessable Entity","path"}`. The
 * plan's assumption of a structured `{field, message}` error DTO from the
 * backend does not hold; callers should treat `status === 422` as "the form
 * has validation errors" and show a generic message rather than relying on
 * `field`/`message` being populated with anything user-facing.
 */
export function normalizeApiError(error: unknown): NormalizedApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;
    const status = axiosError.response?.status ?? null;
    const data = axiosError.response?.data;
    const rawMessage =
      (typeof data === 'string' ? data : undefined) ??
      data?.message ??
      data?.error ??
      axiosError.message;

    // Best-effort: if the backend ever does surface "field: message; ..."
    // (e.g. a future structured error DTO), extract the first field name.
    const firstSegment = rawMessage?.split(';')[0]?.trim();
    const fieldMatch = firstSegment?.match(/^([a-zA-Z0-9_.$]+):\s*(.+)$/);

    return {
      status,
      message: rawMessage || 'Nastala neočekávaná chyba.',
      field: fieldMatch?.[1],
    };
  }
  return { status: null, message: 'Nastala neočekávaná chyba.' };
}

export default httpClient;
