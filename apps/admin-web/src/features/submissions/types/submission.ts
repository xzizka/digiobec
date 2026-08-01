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

export type SubmissionStatus =
  | 'SUBMITTED'
  | 'IN_PROGRESS'
  | 'APPROVED'
  | 'REJECTED'

export interface SubmissionPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
