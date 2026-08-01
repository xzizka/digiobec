package cz.obec.portal.ruian.api.dto

import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank

/** Request to locate Czech POINTs near a free-text address. */
data class GeocodeRequestDto(
    @field:NotBlank
    val query: String,

    @field:Min(500)
    @field:Max(10_000)
    val radius: Int = 5000,

    @field:Min(1)
    @field:Max(20)
    val limit: Int = 10,
)
