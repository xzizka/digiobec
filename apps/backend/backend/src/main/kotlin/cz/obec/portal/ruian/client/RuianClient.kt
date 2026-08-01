package cz.obec.portal.ruian.client

import cz.obec.portal.ruian.domain.RuianAddress
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.web.reactive.function.client.WebClient

/**
 * WebClient wrapper for the RÚIAN (ČÚZK) REST API.
 *
 * `GET /v1/adresy?cast={query}&limit=10` with the API key sent in the
 * `X-Api-Key` header. Responses are validated against the expected shape;
 * anything unexpected is treated as an empty result rather than being
 * propagated, keeping the autocomplete endpoint resilient.
 */
@Component
class RuianClient(
    @Value("\${ruian.api-url:https://api.ruian.cz}") private val apiUrl: String,
    @Value("\${ruian.api-key:}") private val apiKey: String,
) {
    private val logger = LoggerFactory.getLogger(RuianClient::class.java)

    private val webClient: WebClient = WebClient.builder()
        .baseUrl(apiUrl)
        .defaultHeader("X-Api-Key", apiKey)
        .defaultHeader("Accept", "application/json")
        .build()

    /** Suggest up to [limit] addresses matching [query] (street/city prefix). */
    fun suggest(query: String, limit: Int = 10): List<RuianAddress> {
        if (query.isBlank()) return emptyList()
        return try {
            webClient.get()
                .uri { ub ->
                    ub.path("/v1/adresy")
                        .queryParam("cast", query.trim())
                        .queryParam("limit", limit)
                        .build()
                }
                .retrieve()
                .bodyToMono(RuianResponse::class.java)
                .block()
                ?.data?.mapNotNull { it.toDomain() }
                .orEmpty()
        } catch (e: Exception) {
            logger.warn("RÚIAN suggest failed (query={}), using fallback", query, e)
            emptyList()
        }
    }

    /** Geocode a free-text address to the best matching record. */
    fun geocode(query: String): RuianAddress? = suggest(query, limit = 1).firstOrNull()

    private data class RuianResponse(val data: List<RuianItem>? = emptyList())

    private data class RuianItem(
        val adresni_misto: Long? = null,
        val nazev_ulice: String? = null,
        val cislo_domovni: String? = null,
        val cislo_orientacni: String? = null,
        val nazev_obce: String? = null,
        val psc: String? = null,
        val nazev_okresu: String? = null,
        val nazev_kraje: String? = null,
        val souradnice_x: Double? = null,
        val souradnice_y: Double? = null,
    ) {
        fun toDomain(): RuianAddress? {
            val city = nazev_obce ?: return null
            val lat = souradnice_x
            val lon = souradnice_y
            return RuianAddress(
                addressCode = adresni_misto,
                street = nazev_ulice,
                number = listOfNotNull(cislo_domovni, cislo_orientacni).joinToString("/").ifEmpty { null },
                city = city,
                postalCode = psc,
                district = nazev_okresu,
                region = nazev_kraje,
                lat = lat,
                lon = lon,
            )
        }
    }
}
