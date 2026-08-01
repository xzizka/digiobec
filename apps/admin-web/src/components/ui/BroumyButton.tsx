import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
  useMemo,
} from 'react';

export type BroumyButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive';

export interface BroumyButtonProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'type' | 'className'
  > {
  /** Visible label or arbitrary content. */
  children: ReactNode;
  /** @default 'primary' */
  variant?: BroumyButtonVariant;
  /** @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  /** Renders a loading spinner and disables interaction. */
  loading?: boolean;
  /** Native submit/reset/button type. */
  type?: 'button' | 'submit' | 'reset';
  /** Optional leading icon node. */
  icon?: ReactNode;
  /** Overrides the accessible name; otherwise derived from children. */
  'aria-label'?: string;
  /** Optional extra className appended to the base button classes. */
  className?: string;
}

const SIZE_CLASS: Record<string, string> = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
};

const VARIANT_CLASS: Record<string, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
  destructive: 'btn-danger',
};

/**
 * Accessible Broumy button.
 *
 * Variants: primary, secondary, outline, ghost, destructive. Renders with the
 * shared `.btn` stylesheet and exposes loading state, focus visibility and a
 * correct accessible name via `aria-label` when provided.
 */
export const BroumyButton = forwardRef<HTMLButtonElement, BroumyButtonProps>(
  function BroumyButton(
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      type = 'button',
      icon,
      disabled,
      className,
      ...rest
    },
      ref,
  ) {
    const classes = useMemo(
      () =>
        ['btn', VARIANT_CLASS[variant], SIZE_CLASS[size], className]
          .filter(Boolean)
          .join(' '),
      [variant, size, className],
    );

    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        aria-disabled={disabled || undefined}
        {...rest}
      >
        {loading ? (
          <span className="btn-spinner" aria-hidden="true" />
        ) : (
          icon && (
            <span className="btn-icon" aria-hidden="true">
              {icon}
            </span>
          )
        )}
        <span className="btn-label">{children}</span>
      </button>
    );
  },
);
