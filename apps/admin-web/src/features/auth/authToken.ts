/**
 * Module-level holder for the current Keycloak access token.
 *
 * `AuthProvider` is the only writer (on init and on every silent refresh);
 * `api/client.ts`'s request interceptor is the only reader, attaching the
 * bearer header to every outgoing request. Kept as a plain module (not
 * React state) so the axios client - instantiated once at import time,
 * outside any component - can read the latest token without needing to be
 * re-created or threaded through props.
 */
let currentToken: string | null = null;

export function setAuthToken(token: string | null): void {
  currentToken = token;
}

export function getAuthToken(): string | null {
  return currentToken;
}
