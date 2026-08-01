import { useId, useState, type ReactNode } from 'react';

export interface BroumyTooltipProps {
  /** Tooltip text shown on focus/hover. */
  content: string;
  /** Element that triggers the tooltip. */
  children: ReactNode;
  /** Optional placement; defaults to top. */
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Accessible Broumy tooltip.
 *
 * Opens on keyboard focus and hover, and the content is exposed to screen
 * readers via `aria-describedby`.
 */
export function BroumyTooltip({
  content,
  children,
  placement = 'top',
}: BroumyTooltipProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="broumy-tooltip-wrap"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <span aria-describedby={visible ? id : undefined}>
        {children}
      </span>
      {visible && (
        <span
          id={id}
          role="tooltip"
          className={`broumy-tooltip broumy-tooltip-${placement}`}
        >
          {content}
        </span>
      )}
    </span>
  );
}
