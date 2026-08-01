package cz.obec.portal.admin.api.dto

import cz.obec.portal.admin.domain.SlaStatus
import cz.obec.portal.admin.domain.slaStatusOf
import cz.obec.portal.submission.domain.Submission
import java.time.Instant

/**
 * One CSV row. Decoupled from [Submission] so [cz.obec.portal.admin.service.CsvExportService]
 * is unit-testable without a persistence context.
 */
data class CsvExportDto(
    val trackingCode: String,
    val formKey: String,
    val status: String,
    val contactEmail: String,
    val contactPhone: String,
    val submittedAt: Instant,
    val slaStatus: SlaStatus,
) {
    companion object {
        fun from(submission: Submission, now: Instant = Instant.now()): CsvExportDto = CsvExportDto(
            trackingCode = submission.trackingCode,
            formKey = submission.formKey,
            status = submission.status.name,
            contactEmail = submission.contactEmail ?: "",
            contactPhone = submission.contactPhone ?: "",
            submittedAt = submission.createdAt,
            slaStatus = slaStatusOf(submission.status, submission.createdAt, now),
        )
    }
}
