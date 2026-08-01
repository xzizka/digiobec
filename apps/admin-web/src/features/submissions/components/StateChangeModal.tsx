import { useState, type FormEvent } from 'react';
import { BroumyAlert, BroumyButton, BroumyModal, BroumySelect, BroumyTextarea } from '../../../components/ui';
import { useChangeSubmissionState } from '../hooks/useSubmissions';
import type { SubmissionStatus } from '../types/admin';

const STATUS_LABEL: Record<SubmissionStatus, string> = {
  SUBMITTED: 'Přijato',
  PROCESSING: 'Zpracovává se',
  NEEDS_INFO: 'Čeká na doplnění',
  COMPLETED: 'Vyřízeno',
  REJECTED: 'Zamítnuto',
};

const MIN_COMMENT_LENGTH = 5;

interface StateChangeModalProps {
  submissionId: string;
  trackingCode: string;
  validNextStates: SubmissionStatus[];
  open: boolean;
  onClose: () => void;
  /** Called after a successful transition, with a human-readable announcement for screen readers. */
  onSuccess: (announcement: string) => void;
}

/**
 * Modal for a clerk-driven status change. The server is the single source
 * of truth for which transitions are valid (T-06-02) - this UI only ever
 * offers `validNextStates` from the last-loaded detail, and still surfaces
 * a 409 from the server gracefully if the state moved on since.
 */
export function StateChangeModal({
  submissionId,
  trackingCode,
  validNextStates,
  open,
  onClose,
  onSuccess,
}: StateChangeModalProps) {
  const [newState, setNewState] = useState<SubmissionStatus | ''>('');
  const [comment, setComment] = useState('');
  const [commentTouched, setCommentTouched] = useState(false);
  const mutation = useChangeSubmissionState(submissionId);

  const commentError =
    commentTouched && comment.trim().length < MIN_COMMENT_LENGTH
      ? `Komentář musí mít alespoň ${MIN_COMMENT_LENGTH} znaků.`
      : undefined;

  const handleClose = () => {
    setNewState('');
    setComment('');
    setCommentTouched(false);
    mutation.reset();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setCommentTouched(true);
    if (!newState || comment.trim().length < MIN_COMMENT_LENGTH) return;

    const result = await mutation.mutateAsync({ newState, comment: comment.trim() });
    onSuccess(`Stav podání ${trackingCode} změněn na ${STATUS_LABEL[result.status]}.`);
    handleClose();
  };

  return (
    <BroumyModal
      open={open}
      onClose={handleClose}
      dismissible
      title={`Změnit stav podání ${trackingCode}`}
      footer={
        <>
          <BroumyButton variant="secondary" onClick={handleClose}>
            Zrušit
          </BroumyButton>
          <BroumyButton
            type="submit"
            form="state-change-form"
            loading={mutation.isPending}
            disabled={!newState}
          >
            Uložit
          </BroumyButton>
        </>
      }
    >
      <form id="state-change-form" onSubmit={handleSubmit}>
        <BroumySelect
          label="Nový stav"
          placeholder="Vyberte nový stav"
          value={newState}
          onChange={(e) => setNewState(e.target.value as SubmissionStatus)}
          options={validNextStates.map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
          required
        />
        <div className="mt-4">
          <BroumyTextarea
            label="Komentář (povinné, uloží se do auditní stopy)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onBlur={() => setCommentTouched(true)}
            error={commentError}
            rows={4}
            required
          />
        </div>
        {mutation.isError && (
          <div className="mt-4">
            <BroumyAlert variant="error">
              {(mutation.error as { response?: { data?: { message?: string } } })?.response?.data
                ?.message ?? 'Změnu stavu se nepodařilo uložit. Zkuste to prosím znovu.'}
            </BroumyAlert>
          </div>
        )}
      </form>
    </BroumyModal>
  );
}
