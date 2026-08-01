import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';
import { BroumyButton, type BroumyButtonVariant } from '../components/ui/BroumyButton';

async function expectNoA11yViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: { region: { enabled: false } },
  });
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toHaveLength(
    0,
  );
}

describe('BroumyButton', () => {
  it('renders label and fires onClick', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<BroumyButton onClick={onClick}>Odeslat</BroumyButton>);

    const button = screen.getByRole('button', { name: /odeslat/i });
    expect(button).toBeInTheDocument();
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop set', () => {
    render(<BroumyButton disabled>Neaktivní</BroumyButton>);
    const button = screen.getByRole('button', { name: /neaktivní/i });
    expect(button).toBeDisabled();
  });

  it('exposes loading state and disables interaction', () => {
    render(<BroumyButton loading>Ukládám</BroumyButton>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('renders each variant', () => {
    const { rerender } = render(<BroumyButton variant="primary">A</BroumyButton>);
    const classByVariant: Record<string, string> = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      outline: 'btn-outline',
      ghost: 'btn-ghost',
      destructive: 'btn-danger',
    };
    for (const [variant, expected] of Object.entries(classByVariant)) {
      rerender(
        <BroumyButton variant={variant as BroumyButtonVariant}>A</BroumyButton>,
      );
      expect(screen.getByRole('button')).toHaveClass(expected);
    }
  });

  it('passes axe-core WCAG 2.1 AA checks', async () => {
    const { container } = render(<BroumyButton>Odeslat</BroumyButton>);
    await expectNoA11yViolations(container);
  });
});
