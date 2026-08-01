package cz.obec.portal.ruian.api.dto

import cz.obec.portal.ruian.domain.CzechPoint

/** A Czech POINT point as returned to map/list UIs. */
data class CzechPointDto(
    val id: String,
    val name: String,
    val address: String,
    val lat: Double,
    val lon: Double,
    val distanceMeters: Double?,
    val walkingMinutes: Int?,
    val openingHours: String?,
    val services: List<String>,
) {
    companion object {
        fun from(point: CzechPoint): CzechPointDto = CzechPointDto(
            id = point.id,
            name = point.name,
            address = point.address,
            lat = point.lat,
            lon = point.lon,
            distanceMeters = point.distanceMeters,
            walkingMinutes = point.walkingMinutes,
            openingHours = point.openingHours,
            services = point.services,
        )
    }
}
