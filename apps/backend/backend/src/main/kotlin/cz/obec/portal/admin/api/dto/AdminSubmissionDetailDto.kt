package cz.obec.portal.admin.api.dto

import cz.obec.portal.admin.domain.AuditEntryView
import cz.obec.portal.admin.domain.SlaStatus
import cz.obec.portal.admin.domain.SubmissionStateMachine
import cz.obec.portal.admin.domain.dueAt
import cz.obec.portal.admin.domain.slaStatusOf
import cz.obec.portal.submission.domain.Submission
import cz.obec.portal.submission.domain.SubmissionStatus
import java.time.Instant

data class AuditEntryDto(
    val clerkUsername: String,
    val oldStatus: SubmissionStatus,
    val newStatus: SubmissionStatus,
    val comment: String,
    val createdAt: Instant,
) {
    companion object {
        fun from(entry: AuditEntryView) = AuditEntryDto(
            clerkUsername = entry.clerkUsername,
            oldStatus = entry.oldStatus,
            newStatus = entry.newStatus,
            comment = entry.comment,
            createdAt = entry.createdAt,
        )
    }
}

/** Full detail shown in the admin slide-over panel. */
data class AdminSubmissionDetailDto(
    val id: String,
    val trackingCode: String,
    val formKey: String,
    /** Raw JSON document — the client renders it read-only (key/value table). */
    val formData: String,
    val status: SubmissionStatus,
    val contactEmail: String?,
    val contactPhone: String?,
    val submittedAt: Instant,
    val updatedAt: Instant,
    val slaStatus: SlaStatus,
    val dueAt: Instant?,
    val validNextStates: List<SubmissionStatus>,
    val history: List<AuditEntryDto>,
    /** Path to the existing confirmation preview/PDF endpoints (Plan 05). */
    val confirmationUrl: String,
    val pdfUrl: String,
) {
    companion object {
        fun from(
            submission: Submission,
            history: List<AuditEntryView>,
            now: Instant = Instant.now(),
        ): AdminSubmissionDetailDto {
            val sla = slaStatusOf(submission.status, submission.createdAt, now)
            return AdminSubmissionDetailDto(
                id = submission.id.toString(),
                trackingCode = submission.trackingCode,
                formKey = submission.formKey,
                formData = submission.formData,
                status = submission.status,
                contactEmail = submission.contactEmail,
                contactPhone = submission.contactPhone,
                submittedAt = submission.createdAt,
                updatedAt = submission.updatedAt,
                slaStatus = sla,
                dueAt = if (sla == SlaStatus.CLOSED) null else dueAt(submission.createdAt),
                validNextStates = SubmissionStateMachine.validNextStates(submission.status).toList(),
                history = history.map { AuditEntryDto.from(it) },
                confirmationUrl = "/api/submissions/${submission.trackingCode}/confirmation",
                pdfUrl = "/api/submissions/${submission.trackingCode}/pdf",
            )
        }
    }
}
