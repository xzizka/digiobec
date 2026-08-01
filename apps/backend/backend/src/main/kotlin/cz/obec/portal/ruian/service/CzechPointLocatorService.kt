package cz.obec.portal.ruian.service

import cz.obec.portal.ruian.client.CzechPointClient
import cz.obec.portal.ruian.domain.CzechPoint
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

/**
 * Finds the nearest assisted Czech POINT service points.
 *
 * Given lat/lon (or a free-text address that is geocoded through RÚIAN),
 * queries the Czech POINT API and enriches each point with a walking time
 * estimate (OSRM routing when reachable, straight-line fallback otherwise).
 */
@Service
class CzechPointLocatorService(
    private val czechPointClient: CzechPointClient,
    private val addressAutocompleteService: AddressAutocompleteService,
    @Value("\${osrm.api-url:https://router.project-osrm.org}") private val osrmUrl: String,
) {
    private val logger = LoggerFactory.getLogger(CzechPointLocatorService::class.java)

    /** Overridable in tests to avoid real network calls. */
    internal lateinit var osrmClient: WebClient

    init {
        osrmClient = WebClient.builder().baseUrl(osrmUrl).build()
    }

    /** Nearest Czech POINTs around a coordinate. */
    fun nearby(lat: Double, lon: Double, radiusMeters: Int = 5000, limit: Int = 10): List<CzechPoint> =
        czechPointClient.nearby(lat, lon, radiusMeters, limit)
            .map { it.copy(distanceMeters = haversineMeters(lat, lon, it.lat, it.lon)) }
            .sortedBy { it.distanceMeters }
            .take(limit)
            .map { it.copy(walkingMinutes = walkingMinutes(lat, lon, it)) }

    /** Nearest Czech POINTs around a free-text address (geocoded via RÚIAN). */
    fun nearbyAddress(query: String, radiusMeters: Int = 5000, limit: Int = 10): List<CzechPoint> {
        val address = addressAutocompleteService.geocode(query)
            ?: return emptyList()
        val lat = address.lat ?: return emptyList()
        val lon = address.lon ?: return emptyList()
        return nearby(lat, lon, radiusMeters, limit)
    }

    /** Walking minutes via OSRM; straight-line estimate when routing is unavailable. */
    private fun walkingMinutes(lat: Double, lon: Double, point: CzechPoint): Int? {
        val direct = try {
            osrmClient.get()
                .uri { ub ->
                    ub.path("/route/v1/walking/{o_lon},{o_lat};{d_lon},{d_lat}")
                        .queryParam("overview", "false")
                        .build(lon, lat, point.lon, point.lat)
                }
                .retrieve()
                .bodyToMono(RouteResponse::class.java)
                .block()
        } catch (e: Exception) {
            logger.debug("OSRM unavailable, falling back to straight-line estimate", e)
            null
        }
        val seconds = direct?.routes?.firstOrNull()?.duration
        if (seconds != null) {
            return (seconds / 60.0).let { if (it < 1) 1 else it.toInt() }
        }
        val distance = point.distanceMeters ?: haversineMeters(lat, lon, point.lat, point.lon)
        return (distance / WALKING_SPEED_M_PER_MIN).let { if (it < 1) 1 else it.toInt() }
    }

    private data class RouteResponse(val routes: List<Route>? = null)
    private data class Route(val duration: Double? = null)

    companion object {
        private const val WALKING_SPEED_M_PER_MIN = 80.0 // ~4.8 km/h
        private const val EARTH_RADIUS_M = 6_371_000.0

        /** Great-circle distance in meters. */
        fun haversineMeters(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
            val dLat = Math.toRadians(lat2 - lat1)
            val dLon = Math.toRadians(lon2 - lon1)
            val a = sin(dLat / 2) * sin(dLat / 2) +
                cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) * sin(dLon / 2) * sin(dLon / 2)
            val c = 2 * atan2(sqrt(a), sqrt(1 - a))
            return EARTH_RADIUS_M * c
        }
    }
}
