import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  changeSubmissionState,
  getAdminSubmission,
  getAdminSubmissions,
} from '../api/adminSubmissionsApi';
import type { AdminSubmissionFilters, StateChangeRequest } from '../types/admin';

/** Server-side paginated/filtered/sorted admin submissions list. */
export function useAdminSubmissions(filters: AdminSubmissionFilters) {
  return useQuery({
    queryKey: ['admin-submissions', filters],
    queryFn: () => getAdminSubmissions(filters),
    placeholderData: (previousData) => previousData,
  });
}

/** Full detail (form data, SLA, valid next states, audit history) for one submission. */
export function useAdminSubmissionDetail(id: string | null) {
  return useQuery({
    queryKey: ['admin-submission', id],
    queryFn: () => getAdminSubmission(id as string),
    enabled: id !== null,
  });
}

/**
 * Submits a validated state change. On success, invalidates both the list
 * (so SLA badges/status columns refresh) and the detail (so the audit
 * history + valid-next-states reflect the new state immediately).
 */
export function useChangeSubmissionState(id: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: StateChangeRequest) => changeSubmissionState(id as string, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-submission', id] });
    },
  });
}
