package cz.obec.portal.ruian

import cz.obec.portal.ruian.client.CzechPointClient
import cz.obec.portal.ruian.domain.CzechPoint
import cz.obec.portal.ruian.domain.RuianAddress
import cz.obec.portal.ruian.service.AddressAutocompleteService
import cz.obec.portal.ruian.service.CzechPointLocatorService
import org.junit.jupiter.api.Test
import org.mockito.Mockito
import org.mockito.Mockito.`when`
import kotlin.math.abs
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue

class CzechPointLocatorServiceTest {

    private val czechPointClient = Mockito.mock(CzechPointClient::class.java)
    private val autocompleteService = Mockito.mock(AddressAutocompleteService::class.java)

    private fun service(): CzechPointLocatorService = CzechPointLocatorService(
        czechPointClient = czechPointClient,
        addressAutocompleteService = autocompleteService,
        osrmUrl = "http://127.0.0.1:1/unreachable",
    )

    private fun point(id: String, lat: Double, lon: Double) = CzechPoint(
        id = id,
        name = "Czech POINT $id",
        address = "Náměstí 1",
        lat = lat,
        lon = lon,
        openingHours = "Po-Pá 8:00-16:00",
        services = listOf("vypis-z-verejnych-registru"),
    )

    @Test
    fun `nearby returns points sorted by distance with walking time`() {
        val near = point("near", 49.9480, 13.8630)
        val far = point("far", 49.9520, 13.8680)
        `when`(czechPointClient.nearby(49.9455, 13.8586, 5000, 10))
            .thenReturn(listOf(far, near))

        val result = service().nearby(49.9455, 13.8586)

        assertEquals(listOf("near", "far"), result.map { it.id })
        assertTrue(result.first().distanceMeters!! < result.last().distanceMeters!!)
        assertTrue(result.first().walkingMinutes!! > 0)
        // Walking time derived from straight-line distance when OSRM is down.
        assertTrue(abs(result.first().distanceMeters!! - result.first().walkingMinutes!! * 80.0) < 200)
    }

    @Test
    fun `nearby respects radius and limit`() {
        `when`(czechPointClient.nearby(50.0, 14.4, 10_000, 20))
            .thenReturn(List(5) { i -> point("p$i", 50.0, 14.4) })

        val result = service().nearby(50.0, 14.4, radiusMeters = 10_000, limit = 20)

        assertEquals(5, result.size)
    }

    @Test
    fun `nearbyAddress geocodes the address and returns points`() {
        val geo = RuianAddress(
            addressCode = 1L,
            street = "Náměstí",
            number = "1",
            city = "Broumy",
            postalCode = "267 42",
            lat = 49.9455,
            lon = 13.8586,
        )
        `when`(autocompleteService.geocode("Náměstí 1 Broumy")).thenReturn(geo)
        `when`(czechPointClient.nearby(49.9455, 13.8586, 5000, 10))
            .thenReturn(listOf(point("a", 49.9460, 13.8590)))

        val result = service().nearbyAddress("Náměstí 1 Broumy")

        assertEquals(1, result.size)
        assertEquals("Czech POINT a", result.first().name)
    }

    @Test
    fun `nearbyAddress returns empty for unresolvable address`() {
        `when`(autocompleteService.geocode("Atlantida")).thenReturn(null)
        assertTrue(service().nearbyAddress("Atlantida").isEmpty())
    }

    @Test
    fun `haversine computes known distances`() {
        // ~111.19 km per degree of latitude.
        val distance = CzechPointLocatorService.haversineMeters(
            49.9455, 13.8586,
            49.9455 + 1.0, 13.8586,
        )
        assertTrue(abs(distance - 111_195) < 500)
    }
}
