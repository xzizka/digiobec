package cz.obec.portal.submission.domain

/**
 * Submission lifecycle. Admin (clerk) state machine, enforced in
 * `AdminSubmissionService`: SUBMITTED -> PROCESSING -> COMPLETED / REJECTED / NEEDS_INFO,
 * NEEDS_INFO -> PROCESSING / REJECTED. COMPLETED and REJECTED are terminal.
 */
enum class SubmissionStatus {
    SUBMITTED,
    PROCESSING,
    NEEDS_INFO,
    COMPLETED,
    REJECTED,
}
