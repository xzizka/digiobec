import { forwardRef, useId, type SelectHTMLAttributes } from 'react';

export interface BroumySelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface BroumySelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  label: string;
  options: BroumySelectOption[];
  hint?: string;
  error?: string;
  placeholder?: string;
  className?: string;
}

/** Accessible Broumy select (citizen-web copy of the admin-web component). */
export const BroumySelect = forwardRef<HTMLSelectElement, BroumySelectProps>(
  function BroumySelect(
    { label, options, hint, error, placeholder, id, className, disabled, ...rest },
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
          className={['form-input', 'form-select', error ? 'form-input-error' : '']
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
