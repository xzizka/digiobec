import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AddressAutocomplete } from './components/AddressAutocomplete';
import type { AddressSuggestion } from './types/address';

const suggestion: AddressSuggestion = {
  id: 1,
  label: 'Broumská 2, Broumy 267 42',
  street: 'Broumská',
  number: '2',
  city: 'Broumy',
  postalCode: '267 42',
  district: 'Beroun',
  region: 'Středočeský kraj',
  lat: 49.9462,
  lon: 13.8591,
};

vi.mock('./api/addressApi', () => ({
  suggestAddresses: vi.fn(),
}));

import { suggestAddresses } from './api/addressApi';

const mockSuggest = vi.mocked(suggestAddresses);

describe('AddressAutocomplete', () => {
  beforeEach(() => {
    mockSuggest.mockReset();
  });

  it('shows suggestions after the debounce when the user types', async () => {
    const user = userEvent.setup();
    mockSuggest.mockResolvedValue([suggestion]);

    render(<AddressAutocomplete label="Adresa" onSelect={() => {}} />);

    await user.type(screen.getByLabelText(/adresa/i), 'Broumska');

    await waitFor(() => {
      expect(screen.getByRole('option')).toHaveTextContent(suggestion.label);
    });
    expect(mockSuggest).toHaveBeenCalledWith(
      'Broumska',
      10,
      expect.anything(),
    );
  });

  it('does not query for short or blank input', async () => {
    const user = userEvent.setup();
    render(<AddressAutocomplete label="Adresa" onSelect={() => {}} />);

    await user.type(screen.getByLabelText(/adresa/i), 'B');
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(mockSuggest).not.toHaveBeenCalled();
  });

  it('selecting a suggestion reports it and fills the field', async () => {
    const user = userEvent.setup();
    mockSuggest.mockResolvedValue([suggestion]);
    const onSelect = vi.fn();

    render(<AddressAutocomplete label="Adresa" onSelect={onSelect} />);

    await user.type(screen.getByLabelText(/adresa/i), 'Broumska');
    await user.click(await screen.findByRole('option'));

    expect(onSelect).toHaveBeenCalledWith(suggestion);
    expect(screen.getByLabelText(/adresa/i)).toHaveValue(suggestion.label);
  });

  it('supports keyboard navigation and Enter to select', async () => {
    const user = userEvent.setup();
    mockSuggest.mockResolvedValue([suggestion]);
    const onSelect = vi.fn();

    render(<AddressAutocomplete label="Adresa" onSelect={onSelect} />);

    const input = screen.getByLabelText(/adresa/i);
    await user.type(input, 'Broumska');
    await screen.findByRole('option');
    await user.keyboard('{ArrowDown}{Enter}');

    expect(onSelect).toHaveBeenCalledWith(suggestion);
  });
});
