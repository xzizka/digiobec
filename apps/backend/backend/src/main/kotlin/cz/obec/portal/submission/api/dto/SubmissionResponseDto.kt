package cz.obec.portal.submission.api.dto

import cz.obec.portal.submission.domain.Submission
import cz.obec.portal.submission.domain.SubmissionStatus
import java.time.Instant

data class SubmissionResponseDto(
    val id: String,
    val trackingCode: String,
    val formKey: String,
    val formData: String,
    val status: SubmissionStatus,
    val contactEmail: String?,
    val contactPhone: String?,
    val submittedAt: Instant,
) {
    companion object {
        fun from(submission: Submission): SubmissionResponseDto {
            return SubmissionResponseDto(
                id = submission.id.toString(),
                trackingCode = submission.trackingCode,
                formKey = submission.formKey,
                formData = submission.formData,
                status = submission.status,
                contactEmail = submission.contactEmail,
                contactPhone = submission.contactPhone,
                submittedAt = submission.createdAt,
            )
        }
    }
}
