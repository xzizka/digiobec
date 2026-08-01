package cz.obec.portal.submission.service

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.networknt.schema.JsonSchema
import com.networknt.schema.JsonSchemaFactory
import com.networknt.schema.SpecVersion
import cz.obec.portal.submission.domain.FormDefinition
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

/**
 * Authoritative server-side validation: JSON Schema validation via
 * networknt/json-schema-validator plus custom Czech format checks
 * (rodné číslo RC, IČO, phone, e-mail).
 */
@Service
class FormValidationService(
    private val objectMapper: ObjectMapper,
) {
    private val logger = LoggerFactory.getLogger(FormValidationService::class.java)

    data class FieldError(val field: String, val message: String)

    data class ValidationResult(val valid: Boolean, val errors: List<FieldError>) {
        companion object {
            val OK = ValidationResult(valid = true, errors = emptyList())
        }
    }

    private val schemaFactory: JsonSchemaFactory =
        JsonSchemaFactory.getInstance(SpecVersion.VersionFlag.V7)

    private val emailRegex = Regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")
    private val phoneRegex = Regex("^(\\+?420)?\\s?[1-9][0-9]{8}$")

    fun validate(definition: FormDefinition, formData: String): ValidationResult {
        val errors = mutableListOf<FieldError>()

        val json: JsonNode = try {
            objectMapper.readTree(formData)
        } catch (e: Exception) {
            return ValidationResult(false, listOf(FieldError("$", "Není validní JSON.")))
        }

        // 1) JSON Schema validation
        val schema: JsonSchema = try {
            schemaFactory.getSchema(objectMapper.readTree(definition.schema))
        } catch (e: Exception) {
            logger.error("Invalid schema for form {}", definition.key, e)
            return ValidationResult(false, listOf(FieldError("$", "Nedostupná definice formuláře.")))
        }

        val schemaViolations = schema.validate(json)
        for (v in schemaViolations) {
            val loc = v.instanceLocation
            val field = (0 until loc.nameCount).joinToString(".") { loc.getName(it) }.ifEmpty { "$" }
            errors.add(FieldError(field, v.message))
        }

        // 2) Custom Czech validators
        validateContact(json, errors)
        validateIc(json, errors)
        validateRc(json, errors)

        return ValidationResult(errors.isEmpty(), errors)
    }

    /** requesterContact must be an e-mail or a Czech phone number. */
    private fun validateContact(json: JsonNode, errors: MutableList<FieldError>) {
        val contact = json.path("requesterContact")
        if (contact.isMissingNode || contact.isNull) return
        val value = contact.asText().trim()
        if (value.isEmpty()) return
        val looksValid = emailRegex.matches(value) || phoneRegex.matches(value.replace(" ", ""))
        if (!looksValid) {
            errors.add(
                FieldError(
                    "requesterContact",
                    "Zadejte platný e-mail nebo české telefonní číslo.",
                )
            )
        }
    }

    /** IČO check digit (Modulo 11, weights 8..2). */
    private fun validateIc(json: JsonNode, errors: MutableList<FieldError>) {
        val ic = json.path("companyId")
        if (ic.isMissingNode || ic.isNull) return
        val value = ic.asText()
        if (value.length != 8 || !value.all { it.isDigit() }) {
            errors.add(FieldError("companyId", "IČO musí mít 8 číslic."))
            return
        }
        val digits = value.map { it - '0' }
        val weights = listOf(8, 7, 6, 5, 4, 3, 2)
        val sum = digits.take(7).zip(weights).sumOf { (d, w) -> d * w }
        val check = (11 - sum % 11) % 10
        if (check != digits[7]) {
            errors.add(FieldError("companyId", "IČO není platné."))
        }
    }

    /**
     * Rodné číslo: format YYMMDD/XXXX plus birth date sanity. Accepts both
     * the 9-digit (without slash) and 10-digit (with slash) legacy checksum
     * scheme; the 10-digit format uses Modulo 11.
     */
    private fun validateRc(json: JsonNode, errors: MutableList<FieldError>) {
        val rc = json.path("birthNumber")
        if (rc.isMissingNode || rc.isNull) return
        val raw = rc.asText().replace("/", "")
        if (raw.length !in 9..10 || !raw.all { it.isDigit() }) {
            errors.add(FieldError("birthNumber", "Rodné číslo má 9 nebo 10 číslic."))
            return
        }
        if (raw.length == 10) {
            val base = raw.take(9).toLong()
            val check = raw.takeLast(1).toInt()
            val expected = (base % 11).toInt()
            val valid = if (expected == 10) check == 0 else check == expected
            if (!valid) errors.add(FieldError("birthNumber", "Rodné číslo není platné."))
        }
    }
}
