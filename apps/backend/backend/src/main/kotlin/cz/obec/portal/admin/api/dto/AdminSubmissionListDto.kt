package cz.obec.portal.admin.api.dto

import cz.obec.portal.admin.domain.SlaStatus
import cz.obec.portal.admin.domain.dueAt
import cz.obec.portal.admin.domain.slaStatusOf
import cz.obec.portal.submission.domain.Submission
import cz.obec.portal.submission.domain.SubmissionStatus
import java.time.Instant

/** One row of the admin submissions dashboard table. */
data class AdminSubmissionListDto(
    val id: String,
    val trackingCode: String,
    val formKey: String,
    val status: SubmissionStatus,
    val contactEmail: String?,
    val submittedAt: Instant,
    val slaStatus: SlaStatus,
    val dueAt: Instant?,
) {
    companion object {
        fun from(submission: Submission, now: Instant = Instant.now()): AdminSubmissionListDto {
            val sla = slaStatusOf(submission.status, submission.createdAt, now)
            return AdminSubmissionListDto(
                id = submission.id.toString(),
                trackingCode = submission.trackingCode,
                formKey = submission.formKey,
                status = submission.status,
                contactEmail = submission.contactEmail,
                submittedAt = submission.createdAt,
                slaStatus = sla,
                dueAt = if (sla == SlaStatus.CLOSED) null else dueAt(submission.createdAt),
            )
        }
    }
}
