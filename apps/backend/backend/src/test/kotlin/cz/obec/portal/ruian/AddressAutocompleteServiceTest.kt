package cz.obec.portal.ruian

import cz.obec.portal.ruian.client.RuianClient
import cz.obec.portal.ruian.domain.RuianAddress
import cz.obec.portal.ruian.service.AddressAutocompleteService
import org.junit.jupiter.api.Test
import org.mockito.Mockito
import org.mockito.Mockito.times
import org.mockito.Mockito.verify
import org.mockito.Mockito.`when`
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue

class AddressAutocompleteServiceTest {

    private val ruianClient = Mockito.mock(RuianClient::class.java)

    private fun service() = AddressAutocompleteService(ruianClient)

    private fun address(city: String = "Broumy") = RuianAddress(
        addressCode = 1L,
        street = "Náměstí",
        number = "1",
        city = city,
        postalCode = "267 42",
        district = "Beroun",
        region = "Středočeský kraj",
        lat = 49.9455,
        lon = 13.8586,
    )

    @Test
    fun `suggest returns client results when available`() {
        `when`(ruianClient.suggest("Broumy", 10)).thenReturn(listOf(address()))
        val result = service().suggest("Broumy")
        assertEquals(1, result.size)
        assertEquals("Broumy", result.first().city)
    }

    @Test
    fun `suggest caches repeated identical queries`() {
        `when`(ruianClient.suggest("Broumy", 10)).thenReturn(listOf(address()))
        val svc = service()
        svc.suggest("Broumy")
        svc.suggest("Broumy")
        verify(ruianClient, times(1)).suggest("Broumy", 10)
    }

    @Test
    fun `suggest falls back to local dataset when client returns nothing`() {
        `when`(ruianClient.suggest("broumy", 10)).thenReturn(emptyList())
        val result = service().suggest("broumy")
        assertTrue(result.isNotEmpty())
        assertTrue(result.all { it.city.contains("Broumy", ignoreCase = true) })
    }

    @Test
    fun `suggest is case and whitespace insensitive for fallback`() {
        `when`(ruianClient.suggest("  VACLAVSKE  ", 10)).thenReturn(emptyList())
        val result = service().suggest("  VACLAVSKE  ")
        assertTrue(result.isNotEmpty())
        assertTrue(result.first().label().contains("Václavské náměstí"))
    }

    @Test
    fun `suggest returns empty for blank query`() {
        assertEquals(emptyList<RuianAddress>(), service().suggest("   "))
    }

    @Test
    fun `geocode returns best single match`() {
        `when`(ruianClient.suggest("Náměstí 1 Broumy", 1))
            .thenReturn(listOf(address()))
        val result = service().geocode("Náměstí 1 Broumy")
        assertEquals("Broumy", result?.city)
        assertEquals(13.8586, result?.lon)
    }
}
