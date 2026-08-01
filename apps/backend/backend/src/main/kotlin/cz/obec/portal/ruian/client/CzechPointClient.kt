package cz.obec.portal.ruian.client

import cz.obec.portal.ruian.domain.CzechPoint
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.web.reactive.function.client.WebClient

/**
 * WebClient wrapper for the Czech POINT locator API.
 *
 * `GET /v1/points?lat={lat}&lon={lon}&radius={meters}&limit={n}` with the API
 * key in the `X-Api-Key` header. Returns the nearest assisted service points
 * ordered by distance.
 */
@Component
class CzechPointClient(
    @Value("\${czech-point.api-url:https://czechpoint.gov.cz/api}") private val apiUrl: String,
    @Value("\${czech-point.api-key:}") private val apiKey: String,
) {
    private val logger = LoggerFactory.getLogger(CzechPointClient::class.java)

    private val webClient: WebClient = WebClient.builder()
        .baseUrl(apiUrl)
        .defaultHeader("X-Api-Key", apiKey)
        .defaultHeader("Accept", "application/json")
        .build()

    /** Nearest [limit] Czech POINTs within [radiusMeters] of (lat, lon). */
    fun nearby(lat: Double, lon: Double, radiusMeters: Int = 5000, limit: Int = 10): List<CzechPoint> {
        return try {
            webClient.get()
                .uri { ub ->
                    ub.path("/v1/points")
                        .queryParam("lat", lat)
                        .queryParam("lon", lon)
                        .queryParam("radius", radiusMeters)
                        .queryParam("limit", limit)
                        .build()
                }
                .retrieve()
                .bodyToMono(CzechPointResponse::class.java)
                .block()
                ?.data?.mapNotNull { it.toDomain() }
                .orEmpty()
        } catch (e: Exception) {
            logger.warn("Czech POINT nearby failed (lat={}, lon={}), using fallback", lat, lon, e)
            emptyList()
        }
    }

    private data class CzechPointResponse(val data: List<PointItem>? = emptyList())

    private data class PointItem(
        val id: String? = null,
        val nazev: String? = null,
        val adresa: String? = null,
        val lat: Double? = null,
        val lon: Double? = null,
        val oteciraci_doba: String? = null,
        val sluzby: List<String>? = emptyList(),
    ) {
        fun toDomain(): CzechPoint? {
            val name = nazev ?: return null
            val lat = lat ?: return null
            val lon = lon ?: return null
            return CzechPoint(
                id = id ?: name,
                name = name,
                address = adresa ?: "",
                lat = lat,
                lon = lon,
                openingHours = oteciraci_doba,
                services = sluzby ?: emptyList(),
            )
        }
    }
}
