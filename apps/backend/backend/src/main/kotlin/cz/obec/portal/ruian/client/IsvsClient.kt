package cz.obec.portal.ruian.client

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.web.reactive.function.client.WebClient

/**
 * Client for the ISVS (Informační systémy veřejné správy) services catalog.
 *
 * Provides the vocabulary of Czech POINT service types used to filter/label
 * the services offered at a point. The external ISVS registry is not yet
 * reachable from the demo environment, so a static vocabulary acts as a
 * fallback (mock) until the registry API is wired up.
 */
@Component
class IsvsClient(
    @Value("\${isvs.api-url:}") private val apiUrl: String,
) {
    private val webClient: WebClient? = apiUrl
        .takeIf { it.isNotBlank() }
        ?.let { url ->
            WebClient.builder()
                .baseUrl(url)
                .defaultHeader("Accept", "application/json")
                .build()
        }

    /** Service type identifiers recognized by Czech POINT. */
    fun supportedServiceTypes(): List<String> = DEFAULT_SERVICE_TYPES

    /** Fetch the ISVS registry when configured; falls back to the default set. */
    fun fetchServiceCatalog(): List<String> {
        val client = webClient ?: return DEFAULT_SERVICE_TYPES
        return try {
            val payload = client.get()
                .uri("/v1/sluzby")
                .retrieve()
                .bodyToMono(Map::class.java)
                .block()
            val services = (payload?.get("sluzby") as? List<*>)?.filterIsInstance<String>()
            services?.takeIf { it.isNotEmpty() } ?: DEFAULT_SERVICE_TYPES
        } catch (e: Exception) {
            DEFAULT_SERVICE_TYPES
        }
    }

    companion object {
        private val DEFAULT_SERVICE_TYPES = listOf(
            "zivotni-situace",
            "vypis-z-verejnych-registru",
            "vypis-z-obchodniho-rejstriku",
            "vypis-z-rejstriku-trestu",
            "vypis-z-katastru-nemovitosti",
            "podatelna",
            "autorizovana-konverze",
        )
    }
}
