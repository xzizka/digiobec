package cz.obec.portal.submission.api

import cz.obec.portal.submission.api.dto.FormCatalogEntryDto
import cz.obec.portal.submission.service.FormCatalogService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/forms")
class FormController(
    private val formCatalogService: FormCatalogService,
) {

    /** Catalog of municipal acts within obec I. typu competence. */
    @GetMapping
    fun catalog(): ResponseEntity<List<FormCatalogEntryDto>> {
        val entries = formCatalogService.catalog()
            .map { FormCatalogEntryDto.from(it) }
        return ResponseEntity.ok(entries)
    }

    /** JSON Schema + UI Schema for a single form. */
    @GetMapping("/{key}")
    fun form(@PathVariable key: String): ResponseEntity<Map<String, Any>> {
        val definition = formCatalogService.findDefinition(key)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(
            mapOf(
                "formKey" to definition.key,
                "title" to mapOf("cs" to definition.titleCs, "en" to definition.titleEn),
                "description" to mapOf("cs" to definition.descriptionCs, "en" to definition.descriptionEn),
                "schema" to definition.schema,
                "uiSchema" to definition.uiSchema,
            )
        )
    }
}
