package cz.obec.portal.ruian.api.dto

import cz.obec.portal.ruian.domain.RuianAddress

/** Autocomplete suggestion that maps 1:1 into address form fields. */
data class AddressSuggestionDto(
    val id: Long?,
    val label: String,
    val street: String?,
    val number: String?,
    val city: String,
    val postalCode: String?,
    val district: String?,
    val region: String?,
    val lat: Double?,
    val lon: Double?,
) {
    companion object {
        fun from(address: RuianAddress): AddressSuggestionDto = AddressSuggestionDto(
            id = address.addressCode,
            label = address.label(),
            street = address.street,
            number = address.number,
            city = address.city,
            postalCode = address.postalCode,
            district = address.district,
            region = address.region,
            lat = address.lat,
            lon = address.lon,
        )
    }
}
