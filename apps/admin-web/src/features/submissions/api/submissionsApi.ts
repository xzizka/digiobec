import api from '../../../api/client'
import type { Submission, SubmissionPage } from '../types/submission'

export interface SubmissionFilters {
  status?: string
  formKey?: string
  page?: number
  size?: number
}

export interface FormCatalogEntry {
  formKey: string
  title: Record<string, string>
  description: Record<string, string>
  department: string
}

export async function getSubmissions(
  filters: SubmissionFilters = {},
): Promise<SubmissionPage<Submission>> {
  const { data } = await api.get<SubmissionPage<Submission>>(
    '/api/submissions',
    { params: filters },
  )
  return data
}

export async function getSubmission(
  trackingCode: string,
): Promise<Submission> {
  const { data } = await api.get<Submission>(
    `/api/submissions/${trackingCode}`,
  )
  return data
}

export async function getFormCatalog(): Promise<FormCatalogEntry[]> {
  const { data } = await api.get<FormCatalogEntry[]>('/api/forms')
  return data
}
