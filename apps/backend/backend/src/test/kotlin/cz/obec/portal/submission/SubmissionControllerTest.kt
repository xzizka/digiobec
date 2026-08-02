package cz.obec.portal.submission

import com.fasterxml.jackson.databind.ObjectMapper
import cz.obec.portal.submission.api.dto.SubmissionRequestDto
import cz.obec.portal.submission.api.dto.SubmissionResponseDto
import cz.obec.portal.submission.domain.SubmissionStatus
import cz.obec.portal.submission.service.SubmissionService
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.kotlin.any
import org.mockito.kotlin.eq
import org.mockito.kotlin.whenever
import org.springframework.data.domain.PageImpl
import org.springframework.data.web.config.EnableSpringDataWebSupport
import org.springframework.data.web.config.SpringDataJacksonConfiguration
import org.springframework.data.web.config.SpringDataWebSettings
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter
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
        submissionService = mock(SubmissionService::class.java)
        val controller = cz.obec.portal.submission.api.SubmissionController(submissionService)
        val settings = SpringDataWebSettings(EnableSpringDataWebSupport.PageSerializationMode.DIRECT)
        val objectMapper: com.fasterxml.jackson.databind.ObjectMapper = Jackson2ObjectMapperBuilder()
            .modules(
                com.fasterxml.jackson.datatype.jsr310.JavaTimeModule(),
                com.fasterxml.jackson.module.kotlin.KotlinModule.Builder().build(),
                SpringDataJacksonConfiguration.PageModule(settings),
            )
            .build()
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
            .setMessageConverters(MappingJackson2HttpMessageConverter(objectMapper))
            .build()
    }

    private fun sampleResponse(): SubmissionResponseDto = SubmissionResponseDto(
        id = "11111111-1111-1111-1111-111111111111",
        trackingCode = "2026-A7K3-9QXM-2FHT",
        formKey = "info-request",
        formData = """{"requesterName":"Anna Nováková"}""",
        status = SubmissionStatus.SUBMITTED,
        contactEmail = "anna@example.cz",
        contactPhone = null,
        submittedAt = Instant.parse("2026-08-01T10:00:00Z"),
    )

    @Test
    fun `submissions POST returns 201 with tracking code`() {
        val request = SubmissionRequestDto(
            formKey = "info-request",
            formData = """{"requesterName":"Anna Nováková"}""",
            contactEmail = "anna@example.cz",
        )
        whenever(submissionService.create(any(), eq("127.0.0.1")))
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
    fun `submissions POST returns 422 for validation failure`() {
        whenever(submissionService.create(any(), any()))
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
    fun `submissions by code returns submission`() {
        whenever(submissionService.findByTrackingCode("2026-A7K3-9QXM-2FHT"))
            .thenReturn(sampleResponse())

        mockMvc.perform(get("/api/submissions/2026-A7K3-9QXM-2FHT"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.trackingCode").value(sampleResponse().trackingCode))
            .andExpect(jsonPath("$.contactEmail").value("anna@example.cz"))
    }

    @Test
    fun `submissions by code returns 404 for unknown code`() {
        whenever(submissionService.findByTrackingCode("nope"))
            .thenThrow(ResponseStatusException(HttpStatus.NOT_FOUND, "Podání nenalezeno."))

        mockMvc.perform(get("/api/submissions/nope"))
            .andExpect(status().isNotFound)
    }

    @Test
    fun `submissions supports filtering and pagination`() {
        whenever(
            submissionService.search(
                status = SubmissionStatus.SUBMITTED,
                formKey = null,
                from = null,
                to = null,
                page = 0,
                size = 20,
            )
        ).thenReturn(PageImpl(listOf(sampleResponse())))

        mockMvc.perform(get("/api/submissions").param("status", "SUBMITTED").param("page", "0").param("size", "20"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.content[0].trackingCode").value(sampleResponse().trackingCode))
    }
}
