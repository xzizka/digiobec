import { LogOut, ShieldOff } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { BroumyAlert, BroumyButton } from '../../components/ui';
import { useAuth } from './AuthProvider';
import { LoginPage } from './LoginPage';

interface RequireClerkProps {
  children: ReactNode;
}

/**
 * Route guard: shows a loading state during the silent-SSO check, the
 * login splash for guests, an "access denied" screen for authenticated
 * non-clerks, and the protected app for clerks. Mirrors the backend's
 * `ROLE_CLERK` gate so the UI never even attempts calls a 403 would refuse.
 */
export function RequireClerk({ children }: RequireClerkProps) {
  const { initializing, authenticated, hasRole, logout } = useAuth();
  const { t: tCommon } = useTranslation('common');
  const { t: tNav } = useTranslation('navigation');

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return <LoginPage />;
  }

  if (!hasRole('clerk')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="card max-w-md w-full">
          <div className="card-body text-center">
            <div className="w-14 h-14 mx-auto mb-4 bg-error/10 rounded-full flex items-center justify-center">
              <ShieldOff className="w-7 h-7 text-error" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-bold text-text-primary mb-2">{tCommon('forbidden')}</h1>
            <div className="mb-4">
              <BroumyAlert variant="error">
                Váš účet nemá roli úředníka (clerk). Přihlaste se prosím jiným účtem.
              </BroumyAlert>
            </div>
            <BroumyButton variant="secondary" icon={<LogOut size={16} />} onClick={logout}>
              {tNav('logout')}
            </BroumyButton>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
