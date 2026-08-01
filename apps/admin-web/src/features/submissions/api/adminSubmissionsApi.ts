import api from '../../../api/client';
import type {
  AdminSubmissionDetail,
  AdminSubmissionFilters,
  AdminSubmissionListItem,
  StateChangeRequest,
} from '../types/admin';
import type { SubmissionPage } from '../types/submission';

function toParams(filters: AdminSubmissionFilters): Record<string, unknown> {
  return {
    status: filters.status,
    formKey: filters.formKey || undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
    q: filters.q || undefined,
    page: filters.page ?? 0,
    size: filters.size ?? 20,
    sort: filters.sort ?? 'createdAt',
    direction: filters.direction ?? 'desc',
  };
}

/** GET /api/admin/submissions - paginated, filtered, sorted (ROLE_CLERK). */
export async function getAdminSubmissions(
  filters: AdminSubmissionFilters = {},
): Promise<SubmissionPage<AdminSubmissionListItem>> {
  const { data } = await api.get<SubmissionPage<AdminSubmissionListItem>>(
    '/api/admin/submissions',
    { params: toParams(filters), paramsSerializer: { indexes: null } },
  );
  return data;
}

/** GET /api/admin/submissions/{id} - full detail + audit history. */
export async function getAdminSubmission(id: string): Promise<AdminSubmissionDetail> {
  const { data } = await api.get<AdminSubmissionDetail>(`/api/admin/submissions/${id}`);
  return data;
}

/** PATCH /api/admin/submissions/{id}/state - server validates the transition. */
export async function changeSubmissionState(
  id: string,
  request: StateChangeRequest,
): Promise<AdminSubmissionDetail> {
  const { data } = await api.patch<AdminSubmissionDetail>(
    `/api/admin/submissions/${id}/state`,
    request,
  );
  return data;
}

/**
 * Downloads the streaming CSV export as a blob (via the shared `api` client
 * so the Authorization bearer header is attached - a plain `<a href>` to the
 * admin endpoint would 401 since it isn't a public route).
 */
export async function downloadAdminSubmissionsCsv(
  filters: AdminSubmissionFilters = {},
): Promise<Blob> {
  const { data } = await api.get<Blob>('/api/admin/submissions/export', {
    params: toParams(filters),
    paramsSerializer: { indexes: null },
    responseType: 'blob',
  });
  return data;
}
