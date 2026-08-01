import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';

export interface BroumyInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'size'> {
  label: string;
  hint?: ReactNode;
  error?: string;
  prefixIcon?: ReactNode;
  suffix?: ReactNode;
  /** @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Accessible Broumy text input (citizen-web copy of the admin-web component).
 * Wires `aria-describedby` to hint/error text and `aria-invalid` for
 * validation states; styling comes from the shared `.form-*` stylesheet.
 */
export const BroumyInput = forwardRef<HTMLInputElement, BroumyInputProps>(
  function BroumyInput(
    {
      label,
      hint,
      error,
      prefixIcon,
      suffix,
      size = 'md',
      id,
      className,
      disabled,
      readOnly,
      ...rest
    },
    ref,
  ) {
    const autoId = useId();
    const inputId = id ?? autoId;
    const hintId = `${inputId}-hint`;
    const errorId = `${inputId}-error`;
    const describedBy = [error ? errorId : null, !error && hint ? hintId : null]
      .filter(Boolean)
      .join(' ');

    const sizeClass = size === 'sm' ? 'form-input-sm' : size === 'lg' ? 'form-input-lg' : '';

    return (
      <div className={`form-group ${className ?? ''}`.trim()}>
        <label className="form-label" htmlFor={inputId}>
          {label}
        </label>
        <div className="form-control-wrap">
          {prefixIcon && (
            <span className="form-input-icon" aria-hidden="true">
              {prefixIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={[
              'form-input',
              sizeClass,
              error ? 'form-input-error' : '',
              prefixIcon ? 'form-input-has-icon' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy || undefined}
            disabled={disabled}
            readOnly={readOnly}
            {...rest}
          />
          {suffix && (
            <span className="form-input-suffix" aria-hidden="true">
              {suffix}
            </span>
          )}
        </div>
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
