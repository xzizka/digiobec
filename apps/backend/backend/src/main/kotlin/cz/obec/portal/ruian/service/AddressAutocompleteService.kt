package cz.obec.portal.ruian.service

import com.github.benmanes.caffeine.cache.Caffeine
import cz.obec.portal.ruian.client.RuianClient
import cz.obec.portal.ruian.domain.RuianAddress
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.time.Duration

/**
 * Address autocomplete proxy.
 *
 * Debouncing is performed client-side (300 ms); this service handles
 * caching (Caffeine, 10 min TTL) and resilience: when the RÚIAN API is
 * unreachable or not configured, a local mock dataset keeps the feature
 * working offline (the production fallback is a nightly PostgreSQL RÚIAN
 * import — not yet implemented, tracked as follow-up).
 */
@Service
class AddressAutocompleteService(
    private val ruianClient: RuianClient,
) {
    private val logger = LoggerFactory.getLogger(AddressAutocompleteService::class.java)

    private val cache = Caffeine.newBuilder()
        .maximumSize(1000)
        .expireAfterWrite(Duration.ofMinutes(10))
        .build<String, List<RuianAddress>>()

    /** Suggest up to [limit] addresses; cached per normalized query. */
    fun suggest(query: String, limit: Int = 10): List<RuianAddress> {
        val normalized = normalize(query)
        if (normalized.isEmpty()) return emptyList()

        return cache.get(normalized) {
            val live = ruianClient.suggest(query, limit)
            if (live.isNotEmpty()) {
                live.take(limit)
            } else {
                logger.debug("RÚIAN returned nothing for '{}', using local fallback", query)
                FALLBACK_ADDRESSES
                    .filter { normalize(it.label()).contains(normalized) }
                    .take(limit)
            }
        }
    }

    /** Best single match for a free-text address. */
    fun geocode(query: String): RuianAddress? = suggest(query, limit = 1).firstOrNull()

    companion object {
        /** Lowercase + diacritics-stripped form for diacritics-insensitive matching. */
        private fun normalize(text: String): String = text
            .trim()
            .lowercase()
            .replace("á", "a").replace("ä", "a")
            .replace("č", "c").replace("ć", "c")
            .replace("ď", "d")
            .replace("é", "e").replace("ě", "e").replace("ë", "e")
            .replace("í", "i").replace("ï", "i")
            .replace("ň", "n")
            .replace("ó", "o").replace("ö", "o")
            .replace("ř", "r")
            .replace("š", "s")
            .replace("ť", "t")
            .replace("ú", "u").replace("ů", "u").replace("ü", "u")
            .replace("ý", "y")
            .replace("ž", "z")

        /** Local demo dataset (Broumy + okolí Berouna) until RÚIAN import exists. */
        private val FALLBACK_ADDRESSES = listOf(
            RuianAddress(1L, "Náměstí", "1", "Broumy", "267 42", "Beroun", "Středočeský kraj", 49.9455, 13.8586),
            RuianAddress(2L, "Broumská", "2", "Broumy", "267 42", "Beroun", "Středočeský kraj", 49.9462, 13.8591),
            RuianAddress(3L, "Broumská", "14", "Broumy", "267 42", "Beroun", "Středočeský kraj", 49.9459, 13.8594),
            RuianAddress(4L, "U Hřiště", "8", "Broumy", "267 42", "Beroun", "Středočeský kraj", 49.9470, 13.8603),
            RuianAddress(5L, "Politických vězňů", "10", "Beroun", "266 01", "Beroun", "Středočeský kraj", 49.9643, 14.0726),
            RuianAddress(6L, "Václavské náměstí", "1", "Praha 1", "110 00", "Hlavní město Praha", "Hlavní město Praha", 50.0830, 14.4278),
            RuianAddress(7L, "Náměstí Republiky", "3", "Praha 1", "110 00", "Hlavní město Praha", "Hlavní město Praha", 50.0878, 14.4285),
        )
    }
}
