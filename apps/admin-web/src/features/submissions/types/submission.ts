export interface Submission {
  id: string
  trackingCode: string
  formKey: string
  formData: Record<string, unknown>
  status: SubmissionStatus
  contactEmail?: string | null
  contactPhone?: string | null
  submittedAt: string
}

// Matches backend cz.obec.portal.submission.domain.SubmissionStatus (Plan 06
// renamed IN_PROGRESS/APPROVED -> PROCESSING/COMPLETED and added NEEDS_INFO
// to match the clerk workflow: SUBMITTED -> PROCESSING -> COMPLETED/REJECTED/NEEDS_INFO).
export type SubmissionStatus =
  | 'SUBMITTED'
  | 'PROCESSING'
  | 'NEEDS_INFO'
  | 'COMPLETED'
  | 'REJECTED'

export interface SubmissionPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
