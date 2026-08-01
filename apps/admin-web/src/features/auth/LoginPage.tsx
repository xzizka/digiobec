import { LogIn, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BroumyButton } from '../../components/ui';
import { useAuth } from './AuthProvider';

/**
 * Branded splash screen shown to unauthenticated visitors. The actual
 * credential form lives on Keycloak's hosted login page (Authorization
 * Code + PKCE - a public SPA client must never collect passwords itself);
 * this page's job is just the "Přihlásit se" call-to-action plus messaging.
 */
export function LoginPage() {
  const { login } = useAuth();
  const { t } = useTranslation('auth');
  const { t: tCommon } = useTranslation('common');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="card max-w-md w-full">
        <div className="card-body text-center">
          <div className="w-14 h-14 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-7 h-7 text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">{t('loginTitle')}</h1>
          <p className="text-text-secondary mb-6">{tCommon('appName')}</p>
          <BroumyButton icon={<LogIn size={18} />} onClick={login} className="w-full">
            {t('loginButton')}
          </BroumyButton>
        </div>
      </div>
    </div>
  );
}
