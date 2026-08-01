package cz.obec.portal.submission.domain

/**
 * A form definition usable by guest citizens. Loaded from classpath JSON
 * resources (see FormCatalogService). Municipal competence only — acts of an
 * obec I. typu (no ORP agendas).
 */
data class FormDefinition(
    val key: String,
    val titleCs: String,
    val titleEn: String,
    val descriptionCs: String,
    val descriptionEn: String,
    val department: String,
    val schema: String,
    val uiSchema: String,
) {
    /** Quick metadata accessor used by the catalog service. */
    fun toCatalogEntry(): FormCatalogEntry {
        return FormCatalogEntry(
            formKey = key,
            titleCs = titleCs,
            titleEn = titleEn,
            descriptionCs = descriptionCs,
            descriptionEn = descriptionEn,
            department = department,
        )
    }

    data class FormCatalogEntry(
        val formKey: String,
        val titleCs: String,
        val titleEn: String,
        val descriptionCs: String,
        val descriptionEn: String,
        val department: String,
    )
}
