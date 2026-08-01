import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { BroumyInput } from '../../../components/ui/BroumyInput';
import { suggestAddresses } from '../api/addressApi';
import type { AddressSuggestion } from '../types/address';

export interface AddressAutocompleteProps {
  /** Accessible label for the search field. */
  label: string;
  /** Placeholder shown while the field is empty. */
  placeholder?: string;
  /** Called when a suggestion is chosen. */
  onSelect: (suggestion: AddressSuggestion) => void;
  /** Debounce delay before hitting the API. @default 300 */
  debounceMs?: number;
  /** Disable the field (e.g. while a form is submitting). */
  disabled?: boolean;
}

/**
 * Debounced RÚIAN typeahead with a keyboard-navigable listbox.
 *
 * Mirrors the mobile `AddressAutocompleteField`: waits `debounceMs` after the
 * last keystroke, aborts stale requests via `AbortController`, and on select
 * hands the full suggestion (street/number/city/psc/district/region) to the
 * caller so address form fields can be auto-filled.
 */
export function AddressAutocomplete({
  label,
  placeholder,
  onSelect,
  debounceMs = 300,
  disabled,
}: AddressAutocompleteProps) {
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
        hint={loading ? 'Vyhledávám…' : undefined}
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
                // onMouseDown fires before blur; prevents the listbox from closing early.
                event.preventDefault();
                pick(suggestion);
              }}
            >
              <span>{suggestion.label}</span>
              {suggestion.district && (
                <span className="address-autocomplete-subtitle">
                  {[suggestion.district, suggestion.region]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
