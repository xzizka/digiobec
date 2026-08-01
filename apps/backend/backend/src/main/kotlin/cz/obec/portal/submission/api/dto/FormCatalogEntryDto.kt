package cz.obec.portal.submission.api.dto

import cz.obec.portal.submission.domain.FormDefinition

data class FormCatalogEntryDto(
    val formKey: String,
    val title: Map<String, String>,
    val description: Map<String, String>,
    val department: String,
) {
    companion object {
        fun from(entry: FormDefinition.FormCatalogEntry): FormCatalogEntryDto {
            return FormCatalogEntryDto(
                formKey = entry.formKey,
                title = mapOf("cs" to entry.titleCs, "en" to entry.titleEn),
                description = mapOf("cs" to entry.descriptionCs, "en" to entry.descriptionEn),
                department = entry.department,
            )
        }
    }
}
