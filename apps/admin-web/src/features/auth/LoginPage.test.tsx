import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import i18n from '../../i18n';
import { LoginPage } from './LoginPage';
import { useAuth } from './AuthProvider';

// jsdom's default navigator language ("en-US") otherwise wins over the app's
// `fallbackLng: 'cs'` via i18next-browser-languagedetector, rendering
// English strings - force Czech so assertions match production's primary
// (and only fully-supported) locale.
beforeAll(() => i18n.changeLanguage('cs'));

async function expectNoA11yViolations(container: HTMLElement) {
  const results = await axe.run(container, { rules: { region: { enabled: false } } });
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toHaveLength(0);
}

vi.mock('./AuthProvider', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);

describe('LoginPage', () => {
  it('renders the login title and a call-to-action button', () => {
    mockUseAuth.mockReturnValue({
      initializing: false,
      authenticated: false,
      username: null,
      hasRole: () => false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(<LoginPage />);

    expect(
      screen.getByRole('heading', { name: /přihlášení do administrace/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /přihlásit se/i })).toBeInTheDocument();
  });

  it('redirects to Keycloak (calls login()) when the button is clicked', async () => {
    const login = vi.fn();
    mockUseAuth.mockReturnValue({
      initializing: false,
      authenticated: false,
      username: null,
      hasRole: () => false,
      login,
      logout: vi.fn(),
    });
    const user = userEvent.setup();

    render(<LoginPage />);
    await user.click(screen.getByRole('button', { name: /přihlásit se/i }));

    expect(login).toHaveBeenCalledTimes(1);
  });

  it('passes axe-core WCAG 2.1 AA checks', async () => {
    mockUseAuth.mockReturnValue({
      initializing: false,
      authenticated: false,
      username: null,
      hasRole: () => false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    const { container } = render(<LoginPage />);
    await expectNoA11yViolations(container);
  });
});
