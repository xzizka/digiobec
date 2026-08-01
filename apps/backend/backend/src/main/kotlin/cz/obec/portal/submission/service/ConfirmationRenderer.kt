package cz.obec.portal.submission.service

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import cz.obec.portal.submission.domain.FormDefinition
import cz.obec.portal.submission.domain.Submission
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

/**
 * Renders a [Submission] into human-readable confirmation data for the
 * PDF (XSL-FO) and the HTML confirmation page.
 *
 * Field labels come from the form's JSON Schema `title`s; enum values are
 * mapped to Czech display text; submitted values are escaped per target
 * format by the consumer ([PdfGenerationService] escapes XML, the HTML page
 * is built by [ConfirmationController]).
 */
@Service
class ConfirmationRenderer(
    private val objectMapper: ObjectMapper,
    @Value("\${portal.base-url:https://obec.cz}") private val baseUrl: String,
) {

    /** One rendered row of submitted form data: label → human value. */
    data class ConfirmationData(
        val trackingCode: String,
        val formTitle: String,
        val submittedAt: String,
        val verificationUrl: String,
        val rows: List<Pair<String, String>>,
    )

    private val czechFormatter: DateTimeFormatter =
        DateTimeFormatter.ofPattern("d. M. yyyy HH:mm", Locale.forLanguageTag("cs-CZ"))
            .withZone(ZoneId.of("Europe/Prague"))

    /** Verification URL that the QR code encodes. */
    fun verificationUrl(trackingCode: String): String = "$baseUrl/overeni/$trackingCode"

    /** Build the confirmation model for [submission]. */
    fun render(submission: Submission, form: FormDefinition): ConfirmationData {
        val schema = objectMapper.readTree(form.schema)
        val data = objectMapper.readTree(submission.formData)
        val labels = fieldLabels(schema)

        return ConfirmationData(
            trackingCode = submission.trackingCode,
            formTitle = form.titleCs,
            submittedAt = czechFormatter.format(submission.createdAt),
            verificationUrl = verificationUrl(submission.trackingCode),
            rows = renderRows(data, labels),
        )
    }

    private fun renderRows(data: JsonNode, labels: Map<String, String>): List<Pair<String, String>> {
        if (!data.isObject) return emptyList()
        return data.fields().asSequence().toList().map { (key, value) ->
            val label = labels[key] ?: key
            label to displayValue(key, value)
        }
    }

    private fun displayValue(key: String, value: JsonNode): String = when {
        value.isNull -> "—"
        value.isBoolean -> if (value.asBoolean()) "Ano" else "Ne"
        value.isTextual && key == "agreeTerms" -> if (value.asText() == "true") "Ano" else "Ne"
        value.isTextual -> ENUM_LABELS[key]?.get(value.asText()) ?: value.asText()
        value.isNumber -> value.asText()
        value.isArray -> value.mapNotNull { if (it.isTextual) it.asText() else it.toString() }
            .joinToString(", ")
        else -> value.asText()
    }

    private fun fieldLabels(schema: JsonNode): Map<String, String> {
        val properties = schema.path("properties")
        if (!properties.isObject) return emptyMap()
        val result = mutableMapOf<String, String>()
        properties.fields().forEach { (key, node) ->
            result[key] = node.path("title").asText(key)
        }
        return result
    }

    companion object {
        /** Czech labels for enum field values across all forms. */
        private val ENUM_LABELS: Map<String, Map<String, String>> = mapOf(
            "requestType" to mapOf(
                "info-document" to "Poskytnutí informace",
                "info-reuse" to "Opakované použití informace",
                "other" to "Jiná žádost",
            ),
            "deliveryMethod" to mapOf(
                "email" to "E-mail",
                "isds" to "Datová schránka",
                "mail" to "Poštou",
            ),
        )
    }
}
