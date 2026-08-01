import {
  forwardRef,
  useId,
  type SelectHTMLAttributes,
} from 'react';

export interface BroumySelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface BroumySelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  /** Accessible label rendered above the select. */
  label: string;
  /** Options to render. */
  options: BroumySelectOption[];
  /** Persistent helper text below the select. */
  hint?: string;
  /** Error text; when set the select switches to error styling. */
  error?: string;
  /** Placeholder shown when no value is selected. */
  placeholder?: string;
  /** Extra className appended to the wrapper. */
  className?: string;
}

/**
 * Accessible Broumy select.
 *
 * Wires `aria-describedby` to hint/error text and `aria-invalid` for error
 * state. Styling comes from the shared `.form-*` stylesheet.
 */
export const BroumySelect = forwardRef<HTMLSelectElement, BroumySelectProps>(
  function BroumySelect(
    {
      label,
      options,
      hint,
      error,
      placeholder,
      id,
      className,
      disabled,
      ...rest
    },
    ref,
  ) {
    const autoId = useId();
    const selectId = id ?? autoId;
    const hintId = `${selectId}-hint`;
    const errorId = `${selectId}-error`;
    const describedBy = [error ? errorId : null, !error && hint ? hintId : null]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={`form-group ${className ?? ''}`.trim()}>
        <label className="form-label" htmlFor={selectId}>
          {label}
        </label>
        <select
          ref={ref}
          id={selectId}
          className={[
            'form-input',
            'form-select',
            error ? 'form-input-error' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          disabled={disabled}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        {error ? (
          <span id={errorId} className="form-error" role="alert">
            {error}
          </span>
        ) : hint ? (
          <span id={hintId} className="form-hint">
            {hint}
          </span>
        ) : null}
      </div>
    );
  },
);
