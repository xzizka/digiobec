import type { HTMLAttributes, ReactNode } from 'react';

export type BroumyAlertVariant =
  | 'info'
  | 'success'
  | 'warning'
  | 'error';

export interface BroumyAlertProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'className'> {
  /** Alert body text or content. */
  children: ReactNode;
  /** @default 'info' */
  variant?: BroumyAlertVariant;
  /** Optional title rendered as a strong heading. */
  title?: string;
  /** Extra className appended to the alert. */
  className?: string;
}

const VARIANT_CLASS: Record<BroumyAlertVariant, string> = {
  info: 'alert alert-info',
  success: 'alert alert-success',
  warning: 'alert alert-warning',
  error: 'alert alert-error',
};

const ROLE: Record<BroumyAlertVariant, 'alert' | 'status'> = {
  info: 'status',
  success: 'status',
  warning: 'status',
  error: 'alert',
};

/**
 * Accessible Broumy alert.
 *
 * Error alerts use `role="alert"` (announced immediately); the rest use
 * `role="status"` (polite live region).
 */
export function BroumyAlert({
  children,
  variant = 'info',
  title,
  className,
  ...rest
}: BroumyAlertProps) {
  return (
    <div
      className={`${VARIANT_CLASS[variant]} ${className ?? ''}`.trim()}
      role={ROLE[variant]}
      {...rest}
    >
      {title && <strong className="alert-title">{title}</strong>}
      <div className="alert-body">{children}</div>
    </div>
  );
}
