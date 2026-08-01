import type { SubmissionStatus } from './submission';

export type { SubmissionStatus };

/** Matches backend `SlaStatus` (cz.obec.portal.admin.domain.SlaStatus). */
export type SlaStatus = 'CLOSED' | 'OK' | 'DUE_THIS_WEEK' | 'DUE_TODAY' | 'OVERDUE';

/** One row of `GET /api/admin/submissions` (AdminSubmissionListDto). */
export interface AdminSubmissionListItem {
  id: string;
  trackingCode: string;
  formKey: string;
  status: SubmissionStatus;
  contactEmail: string | null;
  submittedAt: string;
  slaStatus: SlaStatus;
  dueAt: string | null;
}

/** One entry of a submission's status-change audit trail. */
export interface AuditEntry {
  clerkUsername: string;
  oldStatus: SubmissionStatus;
  newStatus: SubmissionStatus;
  comment: string;
  createdAt: string;
}

/** Full detail from `GET /api/admin/submissions/{id}` (AdminSubmissionDetailDto). */
export interface AdminSubmissionDetail {
  id: string;
  trackingCode: string;
  formKey: string;
  formData: string;
  status: SubmissionStatus;
  contactEmail: string | null;
  contactPhone: string | null;
  submittedAt: string;
  updatedAt: string;
  slaStatus: SlaStatus;
  dueAt: string | null;
  validNextStates: SubmissionStatus[];
  history: AuditEntry[];
  confirmationUrl: string;
  pdfUrl: string;
}

/** PATCH body for `/api/admin/submissions/{id}/state`. */
export interface StateChangeRequest {
  newState: SubmissionStatus;
  comment: string;
}

export interface AdminSubmissionFilters {
  status?: SubmissionStatus[];
  formKey?: string;
  from?: string;
  to?: string;
  q?: string;
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}
