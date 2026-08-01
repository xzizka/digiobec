import Keycloak from 'keycloak-js';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { setAuthToken } from './authToken';

export interface AuthContextValue {
  /** True once Keycloak's initial (silent SSO) check has completed. */
  initializing: boolean;
  authenticated: boolean;
  /** `preferred_username` from the parsed token, or null when unauthenticated. */
  username: string | null;
  /** Realm role check (e.g. `hasRole('clerk')`). */
  hasRole: (role: string) => boolean;
  /** Redirects to Keycloak's hosted login page (Authorization Code + PKCE). */
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'portal',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'admin-web',
};

/** Minimum validity (seconds) the access token must have; refreshed if below. */
const TOKEN_MIN_VALIDITY_SECONDS = 30;
/** How often to proactively check/refresh the token while the app is open. */
const TOKEN_REFRESH_INTERVAL_MS = 20_000;

/**
 * Wraps the app in a Keycloak (OIDC, Authorization Code + PKCE) session.
 *
 * - `onLoad: 'check-sso'` silently detects an existing SSO session via a
 *   hidden iframe (`public/silent-check-sso.html`) without forcing a
 *   redirect for guests who haven't logged in yet.
 * - The access token is kept in memory only (module-level `authToken`
 *   holder), never in `localStorage`/`sessionStorage` - reduces XSS token
 *   theft blast radius (T-06-01).
 * - A periodic timer proactively refreshes the token before it expires
 *   (5 min access token lifespan per the realm config), so a clerk mid-task
 *   isn't abruptly logged out.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const keycloakRef = useRef<Keycloak | null>(null);
  if (!keycloakRef.current) {
    keycloakRef.current = new Keycloak(keycloakConfig);
  }

  const [initializing, setInitializing] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const kc = keycloakRef.current!;

    const syncFromToken = () => {
      setAuthToken(kc.token ?? null);
      setUsername(kc.tokenParsed?.preferred_username ?? null);
    };

    kc.onAuthSuccess = syncFromToken;
    kc.onAuthRefreshSuccess = syncFromToken;
    kc.onAuthLogout = () => {
      setAuthenticated(false);
      setAuthToken(null);
      setUsername(null);
    };
    kc.onTokenExpired = () => {
      kc.updateToken(TOKEN_MIN_VALIDITY_SECONDS).catch(() => {
        // Refresh token also expired/invalid - only real recovery is a fresh login.
        kc.login();
      });
    };

    kc.init({
      onLoad: 'check-sso',
      pkceMethod: 'S256',
      silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
    })
      .then((isAuthenticated) => {
        setAuthenticated(isAuthenticated);
        if (isAuthenticated) syncFromToken();
      })
      .catch(() => {
        setAuthenticated(false);
      })
      .finally(() => setInitializing(false));

    const refreshInterval = window.setInterval(() => {
      kc.updateToken(TOKEN_MIN_VALIDITY_SECONDS).catch(() => {
        /* onTokenExpired above handles the hard-failure path */
      });
    }, TOKEN_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(refreshInterval);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      initializing,
      authenticated,
      username,
      hasRole: (role: string) => keycloakRef.current?.hasRealmRole(role) ?? false,
      login: () => {
        keycloakRef.current?.login();
      },
      logout: () => {
        keycloakRef.current?.logout({ redirectUri: window.location.origin });
      },
    }),
    [initializing, authenticated, username],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Co-locating the consumer hook with its Provider/Context is the standard React Context pattern.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
