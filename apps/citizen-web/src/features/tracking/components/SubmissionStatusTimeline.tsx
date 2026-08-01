import { useTranslation } from 'react-i18next';
import type { SubmissionStatus } from '../api/trackingApi';

export interface SubmissionStatusTimelineProps {
  status: SubmissionStatus;
}

/**
 * Public status timeline (SUBMITTED → …). The public
 * `GET /api/submissions/{trackingCode}` endpoint only exposes the current
 * status (not a timestamped per-transition audit trail — that lives in the
 * clerk-only `/api/admin/**` audit log, Plan 06), so this renders an
 * accessible ordered-list stepper through the possible states rather than a
 * dated history: steps before the current status are "done", the matching
 * step is "current", the rest are "pending". REJECTED/NEEDS_INFO replace
 * the terminal COMPLETED step when applicable.
 */
export function SubmissionStatusTimeline({ status }: SubmissionStatusTimelineProps) {
  const { t } = useTranslation('tracking');

  const path: SubmissionStatus[] =
    status === 'REJECTED'
      ? ['SUBMITTED', 'PROCESSING', 'REJECTED']
      : status === 'NEEDS_INFO'
        ? ['SUBMITTED', 'PROCESSING', 'NEEDS_INFO']
        : ['SUBMITTED', 'PROCESSING', 'COMPLETED'];

  const currentIndex = path.indexOf(status);

  return (
    <ol className="status-timeline" aria-label={t('statusHeading')}>
      {path.map((step, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isRejected = step === 'REJECTED' && isCurrent;
        const stateClass = isRejected
          ? 'status-timeline-step-rejected'
          : isDone
            ? 'status-timeline-step-done'
            : isCurrent
              ? 'status-timeline-step-current'
              : 'status-timeline-step-pending';

        return (
          <li
            key={step}
            className={`status-timeline-step ${stateClass}`}
            aria-current={isCurrent ? 'step' : undefined}
          >
            <span className="status-timeline-marker" aria-hidden="true" />
            <span className="status-timeline-label">{t(`status.${step}`)}</span>
          </li>
        );
      })}
    </ol>
  );
}
