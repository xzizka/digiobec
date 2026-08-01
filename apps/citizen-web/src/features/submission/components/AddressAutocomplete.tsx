import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import httpClient from '../../../api/httpClient';
import { BroumyInput } from '../../../components/ui';

export interface AddressSuggestion {
  id: number | null;
  label: string;
  street: string | null;
  number: string | null;
  city: string;
  postalCode: string | null;
  district: string | null;
  region: string | null;
  lat: number | null;
  lon: number | null;
}

async function suggestAddresses(
  q: string,
  limit = 10,
  signal?: AbortSignal,
): Promise<AddressSuggestion[]> {
  const { data } = await httpClient.get<AddressSuggestion[]>('/addresses/suggest', {
    params: { q, limit },
    signal,
  });
  return data;
}

export interface AddressAutocompleteProps {
  label: string;
  placeholder?: string;
  onSelect: (suggestion: AddressSuggestion) => void;
  /** @default 300 */
  debounceMs?: number;
  disabled?: boolean;
}

/**
 * Debounced RÚIAN typeahead (`GET /api/addresses/suggest`) with a
 * keyboard-navigable listbox. Mirrors admin-web's `AddressAutocomplete`
 * (Plan 04) exactly: 300ms debounce, `AbortController` cancels stale
 * requests, ARIA combobox pattern. Wired into `FormFieldRenderer` for any
 * form field with `ui:widget: "address"`; the current demo form
 * (info-request) has no address field, so this component - like its
 * admin-web counterpart - is built and unit-tested but not yet exercised by
 * a live form; it activates automatically the moment a future form schema
 * declares one.
 */
export function AddressAutocomplete({
  label,
  placeholder,
  onSelect,
  debounceMs = 300,
  disabled,
}: AddressAutocompleteProps) {
  const { t } = useTranslation('submission');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const abortRef = useRef<AbortController | null>(null);
  const listboxIdRef = useRef(`address-listbox-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    const timer = window.setTimeout(() => {
      suggestAddresses(trimmed, 10, controller.signal)
        .then((results) => {
          setSuggestions(results);
          setOpen(results.length > 0);
          setActiveIndex(-1);
        })
        .catch((error) => {
          if ((error as Error).name !== 'AbortError') {
            setSuggestions([]);
            setOpen(false);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, debounceMs);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, debounceMs]);

  function pick(suggestion: AddressSuggestion) {
    setQuery(suggestion.label);
    setSuggestions([]);
    setOpen(false);
    onSelect(suggestion);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      pick(suggestions[activeIndex]);
    } else if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  const activeSuggestion = activeIndex >= 0 ? suggestions[activeIndex] : null;

  return (
    <div>
      <BroumyInput
        label={label}
        placeholder={placeholder}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={onKeyDown}
        disabled={disabled}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxIdRef.current}
        aria-activedescendant={
          activeSuggestion ? `${listboxIdRef.current}-${activeIndex}` : undefined
        }
        hint={loading ? t('addressSearching') : undefined}
      />

      {open && suggestions.length > 0 && (
        <ul
          id={listboxIdRef.current}
          role="listbox"
          aria-label={label}
          className="address-autocomplete-listbox"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id ?? suggestion.label}
              id={`${listboxIdRef.current}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={[
                'address-autocomplete-option',
                index === activeIndex ? 'address-autocomplete-option-active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onMouseDown={(event) => {
                event.preventDefault();
                pick(suggestion);
              }}
            >
              <span>{suggestion.label}</span>
              {suggestion.district && (
                <span className="address-autocomplete-subtitle">
                  {[suggestion.district, suggestion.region].filter(Boolean).join(', ')}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
