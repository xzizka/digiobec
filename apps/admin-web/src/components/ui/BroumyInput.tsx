import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';

export interface BroumyInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'size'> {
  /** Accessible label rendered above the field. */
  label: string;
  /** Persistent helper text below the field. */
  hint?: ReactNode;
  /** Error text; when set the field switches to error styling. */
  error?: string;
  /** Optional leading icon. */
  prefixIcon?: ReactNode;
  /** Optional trailing content (e.g. a reveal button). */
  suffix?: ReactNode;
  /** @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  /** Extra className appended to the wrapper. */
  className?: string;
}

/**
 * Accessible Broumy text input.
 *
 * Wires `aria-describedby` to hint/error text so screen readers announce both,
 * and uses `aria-invalid` for validation states. All styling comes from the
 * shared `.form-*` stylesheet and token CSS variables.
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
    const describedBy = [
      error ? errorId : null,
      !error && hint ? hintId : null,
    ]
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
