package cz.obec.portal.submission.domain

/**
 * Static description of a form field, extracted from the JSON Schema +
 * UI Schema of a form definition. Kept as a plain value object; actual
 * validation happens against the raw JSON Schema string.
 */
data class FormField(
    val key: String,
    val label: String,
    val type: FieldType,
    val required: Boolean,
    val format: String? = null,
    val pattern: String? = null,
    val minLength: Int? = null,
    val maxLength: Int? = null,
    val options: List<String> = emptyList(),
    val placeholder: String? = null,
    val dependsOn: Map<String, Any?>? = null,
) {
    enum class FieldType {
        TEXT, SELECT, DATE, CHECKBOX, TEXTAREA
    }
}
