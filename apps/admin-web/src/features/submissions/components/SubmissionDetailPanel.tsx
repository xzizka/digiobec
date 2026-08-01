import { useState } from 'react';
import { Eye, RefreshCw, X } from 'lucide-react';
import { BroumyButton } from '../../../components/ui';
import { useAdminSubmissionDetail } from '../hooks/useSubmissions';
import { ConfirmationDownload } from './ConfirmationDownload';
import { ConfirmationPreview } from './ConfirmationPreview';
import { StateChangeModal } from './StateChangeModal';
import type { SlaStatus, SubmissionStatus } from '../types/admin';

const STATUS_LABEL: Record<SubmissionStatus, string> = {
  SUBMITTED: 'Přijato',
  PROCESSING: 'Zpracovává se',
  NEEDS_INFO: 'Čeká na doplnění',
  COMPLETED: 'Vyřízeno',
  REJECTED: 'Zamítnuto',
};

const SLA_LABEL: Record<SlaStatus, string> = {
  CLOSED: 'Uzavřeno',
  OK: 'V pořádku',
  DUE_THIS_WEEK: 'Termín tento týden',
  DUE_TODAY: 'Termín dnes',
  OVERDUE: 'Po termínu',
};

const STATUS_BADGE_CLASS: Record<SubmissionStatus, string> = {
  SUBMITTED: 'badge-info',
  PROCESSING: 'badge-primary',
  NEEDS_INFO: 'badge-warning',
  COMPLETED: 'badge-success',
  REJECTED: 'badge-error',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('cs-CZ', { dateStyle: 'medium', timeStyle: 'short' });
}

function parseFormData(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Ano' : 'Ne';
  return String(value);
}

interface SubmissionDetailPanelProps {
  submissionId: string;
  onClose: () => void;
  onAnnounce: (message: string) => void;
}

/**
 * Slide-over detail panel: tracking code, read-only form data, status
 * history (audit trail), and the existing Plan 05 confirmation preview/
 * download. `aria-modal` + focus-friendly close button; Escape closes via
 * the same key handling pattern as `BroumyModal`.
 */
export function SubmissionDetailPanel({
  submissionId,
  onClose,
  onAnnounce,
}: SubmissionDetailPanelProps) {
  const { data, isLoading, isError, refetch } = useAdminSubmissionDetail(submissionId);
  const [stateModalOpen, setStateModalOpen] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={data ? `Detail podání ${data.trackingCode}` : 'Detail podání'}
    >
      <button
        type="button"
        className="fixed inset-0 bg-black/40"
        aria-label="Zavřít detail"
        onClick={onClose}
      />
      <aside className="relative w-full max-w-lg h-full bg-surface shadow-xl overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text-primary">
            {data ? `Podání ${data.trackingCode}` : 'Detail podání'}
          </h2>
          <button
            type="button"
            className="p-2 rounded-md text-text-secondary hover:bg-surface-hover"
            onClick={onClose}
            aria-label="Zavřít"
          >
            <X size={20} />
          </button>
        </div>

        {isLoading && <p>Načítám detail…</p>}

        {isError && (
          <div>
            <p className="mb-2">Nepodařilo se načíst detail podání.</p>
            <BroumyButton onClick={() => refetch()}>Zkusit znovu</BroumyButton>
          </div>
        )}

        {data && (
          <>
            <dl className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <dt className="font-medium">Formulář</dt>
                <dd>{data.formKey}</dd>
              </div>
              <div>
                <dt className="font-medium">Stav</dt>
                <dd>
                  <span className={`badge ${STATUS_BADGE_CLASS[data.status]}`}>
                    {STATUS_LABEL[data.status]}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="font-medium">Odesláno</dt>
                <dd>{formatDate(data.submittedAt)}</dd>
              </div>
              <div>
                <dt className="font-medium">SLA</dt>
                <dd>{SLA_LABEL[data.slaStatus]}</dd>
              </div>
              <div>
                <dt className="font-medium">Kontaktní e-mail</dt>
                <dd>{data.contactEmail ?? '—'}</dd>
              </div>
              <div>
                <dt className="font-medium">Kontaktní telefon</dt>
                <dd>{data.contactPhone ?? '—'}</dd>
              </div>
            </dl>

            <div className="flex gap-2 mb-6 flex-wrap">
              {data.validNextStates.length > 0 && (
                <BroumyButton
                  icon={<RefreshCw size={16} />}
                  onClick={() => setStateModalOpen(true)}
                >
                  Změnit stav
                </BroumyButton>
              )}
              <BroumyButton
                variant="secondary"
                icon={<Eye size={16} />}
                onClick={() => setConfirmationOpen(true)}
              >
                Náhled potvrzení
              </BroumyButton>
              <ConfirmationDownload trackingCode={data.trackingCode} />
            </div>

            <h3 className="font-medium mb-2">Obsah podání</h3>
            <div className="table-responsive mb-6">
              <table className="table">
                <thead>
                  <tr>
                    <th>Pole</th>
                    <th>Hodnota</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(parseFormData(data.formData)).map(([key, value]) => (
                    <tr key={key}>
                      <td>{key}</td>
                      <td>{formatValue(value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="font-medium mb-2">Historie stavů</h3>
            {data.history.length === 0 ? (
              <p className="text-text-secondary">Zatím žádné změny stavu.</p>
            ) : (
              <ol className="space-y-3">
                {data.history.map((entry, idx) => (
                  <li key={idx} className="border-l-2 border-primary pl-3">
                    <p className="font-medium">
                      {STATUS_LABEL[entry.oldStatus]} → {STATUS_LABEL[entry.newStatus]}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {entry.clerkUsername} · {formatDate(entry.createdAt)}
                    </p>
                    <p className="text-sm">{entry.comment}</p>
                  </li>
                ))}
              </ol>
            )}

            <StateChangeModal
              submissionId={data.id}
              trackingCode={data.trackingCode}
              validNextStates={data.validNextStates}
              open={stateModalOpen}
              onClose={() => setStateModalOpen(false)}
              onSuccess={onAnnounce}
            />
            <ConfirmationPreview
              trackingCode={data.trackingCode}
              open={confirmationOpen}
              onClose={() => setConfirmationOpen(false)}
            />
          </>
        )}
      </aside>
    </div>
  );
}
