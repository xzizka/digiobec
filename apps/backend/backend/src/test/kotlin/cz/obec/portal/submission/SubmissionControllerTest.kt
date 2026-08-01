package cz.obec.portal.submission

import com.fasterxml.jackson.databind.ObjectMapper
import cz.obec.portal.submission.api.dto.SubmissionRequestDto
import cz.obec.portal.submission.api.dto.SubmissionResponseDto
import cz.obec.portal.submission.domain.SubmissionStatus
import cz.obec.portal.submission.service.SubmissionService
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers
import org.mockito.ArgumentMatchers.eq
import org.mockito.Mockito
import org.mockito.Mockito.`when`
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.test.web.servlet.setup.MockMvcBuilders
import org.springframework.web.server.ResponseStatusException
import java.time.Instant

class SubmissionControllerTest {

    private lateinit var mockMvc: MockMvc
    private lateinit var submissionService: SubmissionService

    private val objectMapper = ObjectMapper()

    @BeforeEach
    fun setUp() {
        submissionService = Mockito.mock(SubmissionService::class.java)
        val controller = cz.obec.portal.submission.api.SubmissionController(submissionService)
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build()
    }

    private fun sampleResponse(): SubmissionResponseDto = SubmissionResponseDto(
        id = "11111111-1111-1111-1111-111111111111",
        trackingCode = "0000018b66a2-6f4e-4f3b-9b2e-000000000000",
        formKey = "info-request",
        formData = """{"requesterName":"Anna Nováková"}""",
        status = SubmissionStatus.SUBMITTED,
        contactEmail = "anna@example.cz",
        contactPhone = null,
        submittedAt = Instant.parse("2026-08-01T10:00:00Z"),
    )

    @Test
    fun `POST /api/submissions returns 201 with tracking code`() {
        val request = SubmissionRequestDto(
            formKey = "info-request",
            formData = """{"requesterName":"Anna Nováková"}""",
            contactEmail = "anna@example.cz",
        )
        `when`(submissionService.create(org.mockito.ArgumentMatchers.any(SubmissionRequestDto::class.java), eq("127.0.0.1")))
            .thenReturn(sampleResponse())

        mockMvc.perform(
            post("/api/submissions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.trackingCode").value(sampleResponse().trackingCode))
            .andExpect(jsonPath("$.status").value("SUBMITTED"))
            .andExpect(jsonPath("$.formKey").value("info-request"))
    }

    @Test
    fun `POST /api/submissions returns 422 for validation failure`() {
        `when`(submissionService.create(ArgumentMatchers.any(SubmissionRequestDto::class.java), ArgumentMatchers.anyString()))
            .thenThrow(ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "requesterName: Nesplňuje požadavky"))

        val request = SubmissionRequestDto(
            formKey = "info-request",
            formData = """{"requesterName":"A"}""",
        )
        mockMvc.perform(
            post("/api/submissions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
        )
            .andExpect(status().isUnprocessableEntity)
    }

    @Test
    fun `GET /api/submissions/{code} returns submission`() {
        `when`(submissionService.findByTrackingCode("0000018b66a2-6f4e-4f3b-9b2e-000000000000"))
            .thenReturn(sampleResponse())

        mockMvc.perform(get("/api/submissions/0000018b66a2-6f4e-4f3b-9b2e-000000000000"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.trackingCode").value(sampleResponse().trackingCode))
            .andExpect(jsonPath("$.contactEmail").value("anna@example.cz"))
    }

    @Test
    fun `GET /api/submissions/{code} returns 404 for unknown code`() {
        `when`(submissionService.findByTrackingCode("nope"))
            .thenThrow(ResponseStatusException(HttpStatus.NOT_FOUND, "Podání nenalezeno."))

        mockMvc.perform(get("/api/submissions/nope"))
            .andExpect(status().isNotFound)
    }

    @Test
    fun `GET /api/submissions supports filtering and pagination`() {
        // compile-time sanity: service.search signature exists
        val page = Mockito.mock(org.springframework.data.domain.Page::class.java)
        `when`(submissionService.search(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(),
            org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(),
            org.mockito.ArgumentMatchers.anyInt(), org.mockito.ArgumentMatchers.anyInt()))
            .thenReturn(page)

        mockMvc.perform(get("/api/submissions").param("status", "SUBMITTED").param("page", "0").param("size", "20"))
            .andExpect(status().isOk)
    }
}
