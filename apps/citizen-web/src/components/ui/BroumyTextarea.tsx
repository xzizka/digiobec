import {
  forwardRef,
  useId,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';

export interface BroumyTextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  label: string;
  hint?: ReactNode;
  error?: string;
  /** @default 4 */
  rows?: number;
  className?: string;
}

/** Accessible Broumy textarea (citizen-web copy of the admin-web component). */
export const BroumyTextarea = forwardRef<HTMLTextAreaElement, BroumyTextareaProps>(
  function BroumyTextarea(
    { label, hint, error, rows = 4, id, className, disabled, readOnly, ...rest },
    ref,
  ) {
    const autoId = useId();
    const textareaId = id ?? autoId;
    const hintId = `${textareaId}-hint`;
    const errorId = `${textareaId}-error`;
    const describedBy = [error ? errorId : null, !error && hint ? hintId : null]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={`form-group ${className ?? ''}`.trim()}>
        <label className="form-label" htmlFor={textareaId}>
          {label}
        </label>
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={['form-input', error ? 'form-input-error' : ''].filter(Boolean).join(' ')}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          disabled={disabled}
          readOnly={readOnly}
          {...rest}
        />
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
