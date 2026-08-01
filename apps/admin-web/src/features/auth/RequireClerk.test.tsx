import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import i18n from '../../i18n';
import { RequireClerk } from './RequireClerk';
import { useAuth } from './AuthProvider';

// See LoginPage.test.tsx - forces Czech regardless of jsdom's navigator locale.
beforeAll(() => i18n.changeLanguage('cs'));

vi.mock('./AuthProvider', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);

describe('RequireClerk', () => {
  it('shows a loading spinner while the silent-SSO check is in flight', () => {
    mockUseAuth.mockReturnValue({
      initializing: true,
      authenticated: false,
      username: null,
      hasRole: () => false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    const { container } = render(
      <RequireClerk>
        <p>protected content</p>
      </RequireClerk>,
    );

    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows the login page for unauthenticated visitors', () => {
    mockUseAuth.mockReturnValue({
      initializing: false,
      authenticated: false,
      username: null,
      hasRole: () => false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <RequireClerk>
        <p>protected content</p>
      </RequireClerk>,
    );

    expect(screen.getByRole('button', { name: /přihlásit se/i })).toBeInTheDocument();
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });

  it('shows an access-denied screen for authenticated users without the clerk role', () => {
    mockUseAuth.mockReturnValue({
      initializing: false,
      authenticated: true,
      username: 'petr.obcan',
      hasRole: () => false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <RequireClerk>
        <p>protected content</p>
      </RequireClerk>,
    );

    expect(screen.getByText(/nemá roli úředníka/i)).toBeInTheDocument();
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });

  it('renders protected content for authenticated clerks', () => {
    mockUseAuth.mockReturnValue({
      initializing: false,
      authenticated: true,
      username: 'jana.klerkova',
      hasRole: (role: string) => role === 'clerk',
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <RequireClerk>
        <p>protected content</p>
      </RequireClerk>,
    );

    expect(screen.getByText('protected content')).toBeInTheDocument();
  });
});
