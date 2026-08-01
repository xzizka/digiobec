import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import { BroumyInput } from '../components/ui/BroumyInput';

async function expectNoA11yViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: { region: { enabled: false } },
  });
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toHaveLength(
    0,
  );
}

describe('BroumyInput', () => {
  it('renders label linked to input and accepts typing', async () => {
    const user = userEvent.setup();
    render(<BroumyInput label="Jméno" />);

    const input = screen.getByLabelText(/jméno/i);
    expect(input).toBeInTheDocument();
    await user.type(input, 'Anna');
    expect(input).toHaveValue('Anna');
  });

  it('associates hint text via aria-describedby', () => {
    render(<BroumyInput label="Email" hint="Zadejte platnou e-mailovou adresu." />);

    const input = screen.getByLabelText(/email/i);
    const hint = screen.getByText(/platnou e-mailovou adresu/i);
    expect(input).toHaveAttribute('aria-describedby', hint.id);
  });

  it('switches to error styling and replaces hint', () => {
    render(
      <BroumyInput
        label="Email"
        hint="Nápověda"
        error="Pole je povinné"
      />,
    );

    const input = screen.getByLabelText(/email/i);
    const error = screen.getByRole('alert');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveClass('form-input-error');
    expect(input).toHaveAttribute('aria-describedby', error.id);
    expect(screen.queryByText('Nápověda')).not.toBeInTheDocument();
  });

  it('passes axe-core WCAG 2.1 AA checks in error state', async () => {
    const { container } = render(
      <BroumyInput label="Email" error="Pole je povinné" />,
    );
    await expectNoA11yViolations(container);
  });
});
