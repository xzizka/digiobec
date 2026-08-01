package cz.obec.portal.admin.api.dto

import cz.obec.portal.submission.domain.SubmissionStatus
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size

/**
 * PATCH body for a clerk-driven status change. A comment is mandatory —
 * it becomes part of the immutable audit trail entry (T-06-03).
 */
data class StateChangeRequestDto(
    @field:NotNull
    val newState: SubmissionStatus,

    @field:NotBlank
    @field:Size(min = 5, max = 2000)
    val comment: String,
)
