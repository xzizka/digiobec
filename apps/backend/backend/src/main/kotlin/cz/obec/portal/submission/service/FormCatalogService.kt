package cz.obec.portal.submission.service

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import cz.obec.portal.submission.domain.FormDefinition
import org.springframework.core.io.Resource
import org.springframework.core.io.support.PathMatchingResourcePatternResolver
import org.springframework.stereotype.Service
import org.slf4j.LoggerFactory

/**
 * Loads form definitions packaged on the classpath (`forms/<key>/{meta,schema,ui-schema}.json`)
 * and exposes the catalog of municipal acts. Only acts within the competence of an
 * obec I. typu are published; ORP/state agendas are excluded by construction.
 */
@Service
class FormCatalogService(
    private val objectMapper: ObjectMapper,
) {
    private val logger = LoggerFactory.getLogger(FormCatalogService::class.java)

    private val definitions: Map<String, FormDefinition> by lazy {
        loadDefinitions()
    }

    fun findDefinition(key: String): FormDefinition? = definitions[key]

    fun catalog(): List<FormDefinition.FormCatalogEntry> =
        definitions.values.map { it.toCatalogEntry() }.sortedBy { it.formKey }

    private fun loadDefinitions(): Map<String, FormDefinition> {
        val resolver = PathMatchingResourcePatternResolver()
        val resources: Array<Resource> = resolver.getResources("classpath:forms/*/meta.json")
        val result = LinkedHashMap<String, FormDefinition>()

        for (meta in resources) {
            try {
                val dir = meta.url.toString().substringBeforeLast('/')
                val key = dir.substringAfterLast('/')
                val metaNode: JsonNode = objectMapper.readTree(meta.inputStream)
                val schema = resolveResource(dir, "schema.json")
                val uiSchema = resolveResource(dir, "ui-schema.json")

                val definition = FormDefinition(
                    key = metaNode.path("key").asText(key),
                    titleCs = metaNode.path("titleCs").asText(key),
                    titleEn = metaNode.path("titleEn").asText(key),
                    descriptionCs = metaNode.path("descriptionCs").asText(""),
                    descriptionEn = metaNode.path("descriptionEn").asText(""),
                    department = metaNode.path("department").asText("Podatelna"),
                    schema = objectMapper.writeValueAsString(objectMapper.readTree(schema)),
                    uiSchema = objectMapper.writeValueAsString(objectMapper.readTree(uiSchema)),
                )
                result[key] = definition
            } catch (e: Exception) {
                logger.error("Failed to load form definition from {}", meta, e)
            }
        }

        if (result.isEmpty()) {
            logger.warn("No form definitions found on classpath under forms/*/")
        }
        return result
    }

    private fun resolveResource(dir: String, name: String): String {
        val resource = PathMatchingResourcePatternResolver().getResource("$dir/$name")
        require(resource.exists()) { "Missing form resource $dir/$name" }
        return resource.inputStream.use { it.readBytes().toString(Charsets.UTF_8) }
    }
}
