// Tracking re-uses the submission feature's API (same backend resource,
// `GET /api/submissions/{trackingCode}` and its PDF endpoint) - re-exported
// here so the tracking feature has its own stable import surface without
// duplicating the axios call.
export { getSubmission, confirmationPdfUrl } from '../../submission/api/submissionsApi';
export type { Submission, SubmissionStatus } from '../../submission/types/submission';
