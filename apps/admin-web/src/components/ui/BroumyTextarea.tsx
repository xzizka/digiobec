import {
  forwardRef,
  useId,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';

export interface BroumyTextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  /** Accessible label rendered above the field. */
  label: string;
  /** Persistent helper text below the field. */
  hint?: ReactNode;
  /** Error text; when set the field switches to error styling. */
  error?: string;
  /** @default 4 */
  rows?: number;
  /** Extra className appended to the wrapper. */
  className?: string;
}

/**
 * Accessible Broumy textarea, matching `BroumyInput`'s token usage, a11y
 * wiring (`aria-describedby`/`aria-invalid`), and test conventions. Used for
 * multi-line fields such as the mandatory state-change comment.
 */
export const BroumyTextarea = forwardRef<HTMLTextAreaElement, BroumyTextareaProps>(
  function BroumyTextarea(
    {
      label,
      hint,
      error,
      rows = 4,
      id,
      className,
      disabled,
      readOnly,
      ...rest
    },
    ref,
  ) {
    const autoId = useId();
    const textareaId = id ?? autoId;
    const hintId = `${textareaId}-hint`;
    const errorId = `${textareaId}-error`;
    const describedBy = [
      error ? errorId : null,
      !error && hint ? hintId : null,
    ]
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
