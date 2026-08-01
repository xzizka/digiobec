import type { HTMLAttributes, ReactNode } from 'react';

export type BroumyCardVariant = 'elevated' | 'outlined' | 'filled';

export interface BroumyCardProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'className'> {
  /** Card body content. */
  children: ReactNode;
  /** Optional card heading; rendered as an `<h3>`. */
  title?: string;
  /** @default 'elevated' */
  variant?: BroumyCardVariant;
  /** Optional click handler; makes the card a real `<button>`. */
  onPress?: () => void;
  /** Extra className appended to the card. */
  className?: string;
}

const VARIANT_CLASS: Record<BroumyCardVariant, string> = {
  elevated: 'broumy-card broumy-card-elevated',
  outlined: 'broumy-card broumy-card-outlined',
  filled: 'broumy-card broumy-card-filled',
};

/**
 * Accessible Broumy card.
 *
 * Non-interactive cards render a semantic `<article>`; when `onPress` is set
 * the card renders a real `<button>` so it is natively keyboard-operable and
 * announced with the correct role by screen readers.
 */
export function BroumyCard({
  children,
  title,
  variant = 'elevated',
  onPress,
  className,
  ...rest
}: BroumyCardProps) {
  const interactive = onPress != null;
  const cardClass = `${VARIANT_CLASS[variant]} ${className ?? ''}`.trim();

  const content = (
    <>
      {title && <h3 className="broumy-card-title">{title}</h3>}
      <div className="broumy-card-body">{children}</div>
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        className={cardClass}
        onClick={onPress}
        {...(rest as HTMLAttributes<HTMLButtonElement>)}
      >
        {content}
      </button>
    );
  }

  return (
    <article className={cardClass} {...rest}>
      {content}
    </article>
  );
}
