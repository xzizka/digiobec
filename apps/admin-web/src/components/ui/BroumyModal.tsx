import {
  useEffect,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

export interface BroumyModalProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'title'> {
  /** Whether the modal is open. */
  open: boolean;
  /** Called when the user requests closing (backdrop, Escape, close button). */
  onClose: () => void;
  /** Modal heading; announced as the dialog title. */
  title?: string;
  /** Modal body content. */
  children: ReactNode;
  /** Optional footer actions. */
  footer?: ReactNode;
  /** @default false — allow dismissing via backdrop/Escape. */
  dismissible?: boolean;
  /** Extra className appended to the dialog panel. */
  className?: string;
}

/**
 * Accessible Broumy modal dialog.
 *
 * Focus is trapped inside while open, focus returns to the opener on close,
 * `aria-modal` + labelled title are wired, and Escape closes when dismissible.
 */
export function BroumyModal({
  open,
  onClose,
  title,
  children,
  footer,
  dismissible = false,
  className,
  ...rest
}: BroumyModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current =
      document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusables = dialog?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusables?.[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !dialog) return;
      const list = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute('disabled'));
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [open, dismissible, onClose]);

  if (!open) return null;

  return (
    <div className="broumy-modal-root">
      <button
        type="button"
        aria-label="Zavřít dialog"
        tabIndex={-1}
        className="broumy-modal-backdrop"
        onClick={() => {
          if (dismissible) onClose();
        }}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`broumy-modal ${className ?? ''}`.trim()}
        {...rest}
      >
        {title && <h2 className="broumy-modal-title">{title}</h2>}
        <div className="broumy-modal-body">{children}</div>
        {footer && <div className="broumy-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
