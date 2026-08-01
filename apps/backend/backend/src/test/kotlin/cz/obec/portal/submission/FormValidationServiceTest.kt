package cz.obec.portal.submission

import com.fasterxml.jackson.databind.ObjectMapper
import cz.obec.portal.submission.domain.FormDefinition
import cz.obec.portal.submission.service.FormValidationService
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class FormValidationServiceTest {

    private lateinit var service: FormValidationService
    private lateinit var definition: FormDefinition

    private val objectMapper = ObjectMapper()

    @BeforeEach
    fun setUp() {
        service = FormValidationService(objectMapper)
        definition = FormDefinition(
            key = "info-request",
            titleCs = "Žádost o informace",
            titleEn = "Freedom of Information Request",
            descriptionCs = "",
            descriptionEn = "",
            department = "Podatelna",
            schema = """
                {
                  "type": "object",
                  "required": ["requesterName", "requesterContact", "requestType", "description", "deliveryMethod", "agreeTerms"],
                  "properties": {
                    "requesterName": {"type": "string", "minLength": 2, "maxLength": 120},
                    "requesterContact": {"type": "string", "minLength": 5, "maxLength": 255},
                    "requestType": {"type": "string", "enum": ["info-document", "info-reuse", "other"]},
                    "description": {"type": "string", "minLength": 10, "maxLength": 5000},
                    "deliveryMethod": {"type": "string", "enum": ["email", "isds", "mail"]},
                    "dateNeeded": {"type": "string", "format": "date"},
                    "agreeTerms": {"type": "boolean", "const": true}
                  }
                }
            """.trimIndent(),
            uiSchema = "{}",
        )
    }

    private fun payload(
        name: String = "Anna Nováková",
        contact: String = "anna@example.cz",
        requestType: String = "info-document",
        description: String = "Žádám o kopii územního rozhodnutí.",
        delivery: String = "email",
        dateNeeded: String? = "2026-09-01",
        agree: Boolean = true,
    ): String {
        val map = linkedMapOf<String, Any?>(
            "requesterName" to name,
            "requesterContact" to contact,
            "requestType" to requestType,
            "description" to description,
            "deliveryMethod" to delivery,
            "dateNeeded" to dateNeeded,
            "agreeTerms" to agree,
        )
        return objectMapper.writeValueAsString(map)
    }

    @Test
    fun `valid payload passes`() {
        val result = service.validate(definition, payload())
        assertTrue(result.valid, "expected valid, got ${result.errors}")
    }

    @Test
    fun `missing required field fails with field-level error`() {
        val bad = payload(name = "A")
        val result = service.validate(definition, bad)
        assertFalse(result.valid)
        assertTrue(result.errors.any { it.field.contains("requesterName") })
    }

    @Test
    fun `invalid enum value fails`() {
        val result = service.validate(definition, payload(requestType = "unknown"))
        assertFalse(result.valid)
        assertTrue(result.errors.any { it.field.contains("requestType") })
    }

    @Test
    fun `invalid contact (not email or phone) fails`() {
        val result = service.validate(definition, payload(contact = "ahoj"))
        assertFalse(result.valid)
        assertTrue(result.errors.any { it.field == "requesterContact" })
    }

    @Test
    fun `valid czech phone passes`() {
        val result = service.validate(definition, payload(contact = "+420 603 123 456"))
        assertTrue(result.valid, "expected valid, got ${result.errors}")
    }

    @Test
    fun `agreeTerms false fails via const`() {
        val result = service.validate(definition, payload(agree = false))
        assertFalse(result.valid)
        assertTrue(result.errors.any { it.field.contains("agreeTerms") })
    }

    @Test
    fun `valid ICO passes and invalid ICO fails`() {
        val schemaWithIc = definition.copy(
            schema = """
                {
                  "type": "object",
                  "required": ["companyId"],
                  "properties": {"companyId": {"type": "string", "minLength": 8, "maxLength": 8}}
                }
            """.trimIndent()
        )
        val valid = service.validate(schemaWithIc, """{"companyId":"27082440"}""")
        assertTrue(valid.valid, "expected valid IČO, got ${valid.errors}")

        val invalid = service.validate(schemaWithIc, """{"companyId":"12345678"}""")
        assertFalse(invalid.valid)
        assertTrue(invalid.errors.any { it.field == "companyId" })
    }

    @Test
    fun `invalid JSON payload rejected`() {
        val result = service.validate(definition, "{not json")
        assertFalse(result.valid)
    }

    @Test
    fun `dateNeeded not required when requestType is other`() {
        val result = service.validate(definition, payload(requestType = "other", dateNeeded = null))
        assertTrue(result.valid, "expected valid, got ${result.errors}")
    }
}
