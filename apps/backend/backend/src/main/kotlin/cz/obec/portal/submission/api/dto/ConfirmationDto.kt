package cz.obec.portal.submission.api.dto

import cz.obec.portal.submission.service.ConfirmationRenderer.ConfirmationData

/** JSON view of a confirmation: exposed for the mobile and admin web clients. */
data class ConfirmationDto(
    val trackingCode: String,
    val formTitle: String,
    val submittedAt: String,
    val verificationUrl: String,
    val rows: List<ConfirmationRowDto>,
) {
    companion object {
        fun from(data: ConfirmationData): ConfirmationDto = ConfirmationDto(
            trackingCode = data.trackingCode,
            formTitle = data.formTitle,
            submittedAt = data.submittedAt,
            verificationUrl = data.verificationUrl,
            rows = data.rows.map { (label, value) -> ConfirmationRowDto(label, value) },
        )
    }
}

data class ConfirmationRowDto(
    val label: String,
    val value: String,
)
