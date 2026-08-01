package cz.obec.portal.ruian.api

import cz.obec.portal.ruian.api.dto.AddressSuggestionDto
import cz.obec.portal.ruian.api.dto.CzechPointDto
import cz.obec.portal.ruian.api.dto.GeocodeRequestDto
import cz.obec.portal.ruian.service.AddressAutocompleteService
import cz.obec.portal.ruian.service.CzechPointLocatorService
import jakarta.validation.Valid
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import org.springframework.http.ResponseEntity
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

/** RÚIAN address autocomplete + Czech POINT locator endpoints. */
@RestController
@RequestMapping("/api")
@Validated
class AddressController(
    private val addressAutocompleteService: AddressAutocompleteService,
    private val czechPointLocatorService: CzechPointLocatorService,
) {

    /** `GET /api/addresses/suggest?q={query}` — debounced on the client (300 ms). */
    @GetMapping("/addresses/suggest")
    fun suggest(
        @RequestParam q: String,
        @RequestParam(defaultValue = "10") @Min(1) @Max(25) limit: Int,
    ): ResponseEntity<List<AddressSuggestionDto>> {
        val suggestions = addressAutocompleteService.suggest(q, limit)
            .map { AddressSuggestionDto.from(it) }
        return ResponseEntity.ok(suggestions)
    }

    /** `GET /api/czech-points/nearby?lat={lat}&lon={lon}` — nearest assisted points. */
    @GetMapping("/czech-points/nearby")
    fun nearby(
        @RequestParam lat: Double,
        @RequestParam lon: Double,
        @RequestParam(defaultValue = "5000") @Min(500) @Max(10_000) radius: Int,
        @RequestParam(defaultValue = "10") @Min(1) @Max(20) limit: Int,
    ): ResponseEntity<List<CzechPointDto>> {
        val points = czechPointLocatorService.nearby(lat, lon, radius, limit)
            .map { CzechPointDto.from(it) }
        return ResponseEntity.ok(points)
    }

    /** `POST /api/czech-points/nearby-address` — locate near a free-text address. */
    @PostMapping("/czech-points/nearby-address")
    fun nearbyAddress(
        @Valid @RequestBody request: GeocodeRequestDto,
    ): ResponseEntity<List<CzechPointDto>> {
        val points = czechPointLocatorService.nearbyAddress(
            request.query,
            request.radius,
            request.limit,
        ).map { CzechPointDto.from(it) }
        return ResponseEntity.ok(points)
    }
}
