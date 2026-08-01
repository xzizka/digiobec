package cz.obec.portal.admin.domain

import cz.obec.portal.submission.domain.SubmissionStatus

/**
 * Server-side state machine for clerk-driven transitions (T-06-02 Tampering
 * mitigation: only these transitions are ever accepted, regardless of what a
 * client requests).
 */
object SubmissionStateMachine {

    private val transitions: Map<SubmissionStatus, Set<SubmissionStatus>> = mapOf(
        SubmissionStatus.SUBMITTED to setOf(SubmissionStatus.PROCESSING),
        SubmissionStatus.PROCESSING to setOf(
            SubmissionStatus.COMPLETED,
            SubmissionStatus.REJECTED,
            SubmissionStatus.NEEDS_INFO,
        ),
        SubmissionStatus.NEEDS_INFO to setOf(
            SubmissionStatus.PROCESSING,
            SubmissionStatus.REJECTED,
        ),
        SubmissionStatus.COMPLETED to emptySet(),
        SubmissionStatus.REJECTED to emptySet(),
    )

    fun validNextStates(current: SubmissionStatus): Set<SubmissionStatus> =
        transitions[current].orEmpty()

    fun isValidTransition(from: SubmissionStatus, to: SubmissionStatus): Boolean =
        to in validNextStates(from)
}

/**
 * A single entry in a submission's status-change history, as shown to the
 * clerk (read model over [cz.obec.portal.admin.domain.SubmissionAuditLog]).
 */
data class AuditEntryView(
    val clerkUsername: String,
    val oldStatus: SubmissionStatus,
    val newStatus: SubmissionStatus,
    val comment: String,
    val createdAt: java.time.Instant,
)
