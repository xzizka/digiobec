// Matches backend cz.obec.portal.submission.domain.SubmissionStatus (same
// 5-state workflow introduced in Plan 06: SUBMITTED -> PROCESSING ->
// COMPLETED/REJECTED/NEEDS_INFO).
export type SubmissionStatus =
  | 'SUBMITTED'
  | 'PROCESSING'
  | 'NEEDS_INFO'
  | 'COMPLETED'
  | 'REJECTED';

/**
 * `SubmissionResponseDto` (backend). Verified live: `formData` is the raw
 * JSON string as stored (not a nested object) - parse it if the submitted
 * values need to be displayed.
 */
export interface Submission {
  id: string;
  trackingCode: string;
  formKey: string;
  formData: string;
  status: SubmissionStatus;
  contactEmail: string | null;
  contactPhone: string | null;
  submittedAt: string;
}

/** Body for `POST /api/submissions` (`SubmissionRequestDto`, backend). */
export interface SubmissionRequest {
  formKey: string;
  /** JSON-encoded form values, validated server-side against the form's JSON Schema. */
  formData: string;
  contactEmail?: string;
  contactPhone?: string;
}

/** Ordered progression used to render the public status timeline. */
export const STATUS_ORDER: SubmissionStatus[] = [
  'SUBMITTED',
  'PROCESSING',
  'COMPLETED',
];

/** Terminal/branch statuses rendered as an alternate final step. */
export const TERMINAL_BRANCH_STATUSES: SubmissionStatus[] = ['REJECTED', 'NEEDS_INFO'];
