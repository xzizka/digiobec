package cz.obec.portal.submission.api.dto

import com.fasterxml.jackson.databind.JsonNode
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class SubmissionRequestDto(
    @field:NotBlank
    @field:Size(max = 100)
    val formKey: String,

    /** Arbitrary form payload; validated against the form's JSON Schema. */
    @field:NotBlank
    val formData: String,

    @field:Size(max = 255)
    val contactEmail: String? = null,

    @field:Size(max = 50)
    val contactPhone: String? = null,
)
