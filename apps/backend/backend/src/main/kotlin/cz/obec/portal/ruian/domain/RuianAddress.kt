package cz.obec.portal.ruian.domain

/**
 * A single Czech address record as returned by the RÚIAN (ČÚZK) registry.
 * Field names match the mobile/admin DTOs so suggestions map 1:1 into
 * form fields (street, number, city, postal code, district, region).
 */
data class RuianAddress(
    val addressCode: Long? = null,
    val street: String? = null,
    val number: String? = null,
    val city: String,
    val postalCode: String? = null,
    val district: String? = null,
    val region: String? = null,
    val lat: Double? = null,
    val lon: Double? = null,
) {
    /** Human-readable one-line rendering, e.g. "Václavské náměstí 1, Praha 1". */
    fun label(): String {
        val streetPart = listOfNotNull(street, number).joinToString(" ").ifEmpty { city }
        return listOfNotNull(streetPart, postalCode?.let { "$city $it" } ?: city)
            .distinct()
            .joinToString(", ")
    }
}
