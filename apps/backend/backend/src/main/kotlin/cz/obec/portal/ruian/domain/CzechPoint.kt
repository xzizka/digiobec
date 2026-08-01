package cz.obec.portal.ruian.domain

/**
 * A Czech POINT assisted service point (Czech POINT / Czech POINT@office)
 * returned by the Czech POINT locator. `distanceMeters` and `walkingMinutes`
 * are populated by [cz.obec.portal.ruian.service.CzechPointLocatorService].
 */
data class CzechPoint(
    val id: String,
    val name: String,
    val address: String,
    val lat: Double,
    val lon: Double,
    val distanceMeters: Double? = null,
    val walkingMinutes: Int? = null,
    val openingHours: String? = null,
    val services: List<String> = emptyList(),
)
