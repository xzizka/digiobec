package cz.obec.portal.admin

import cz.obec.portal.admin.api.AdminSubmissionController
import cz.obec.portal.admin.api.dto.AdminSubmissionDetailDto
import cz.obec.portal.admin.api.dto.AdminSubmissionListDto
import cz.obec.portal.admin.api.dto.StateChangeRequestDto
import cz.obec.portal.admin.domain.SlaStatus
import cz.obec.portal.admin.service.AdminSubmissionService
import cz.obec.portal.submission.domain.SubmissionStatus
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
import org.springframework.http.MediaType
import org.springframework.http.converter.StringHttpMessageConverter
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.asyncDispatch
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.content
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.header
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.request
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.test.web.servlet.setup.MockMvcBuilders
import org.springframework.web.server.ResponseStatusException
import org.springframework.http.HttpStatus
import java.time.Instant
import java.util.UUID

class AdminSubmissionControllerTest {

    private lateinit var mockMvc: MockMvc
    private lateinit var adminSubmissionService: AdminSubmissionService

    private val objectMapper = com.fasterxml.jackson.databind.ObjectMapper()
    private val submissionId = UUID.fromString("22222222-2222-2222-2222-222222222222")

    private val clerkJwt: Jwt = Jwt.withTokenValue("token-value")
        .header("alg", "none")
        .claim("sub", "clerk-uuid-1")
        .claim("preferred_username", "jana.klerkova")
        .claim("realm_access", mapOf("roles" to listOf("clerk")))
        .build()

    private val clerkAuth = JwtAuthenticationToken(clerkJwt, listOf(SimpleGrantedAuthority("ROLE_CLERK")))

    @BeforeEach
    fun setUp() {
        adminSubmissionService = mock(AdminSubmissionService::class.java)
        val controller = AdminSubmissionController(adminSubmissionService)
        val settings = SpringDataWebSettings(EnableSpringDataWebSupport.PageSerializationMode.DIRECT)
        val mapper: com.fasterxml.jackson.databind.ObjectMapper = Jackson2ObjectMapperBuilder()
            .modules(
                com.fasterxml.jackson.datatype.jsr310.JavaTimeModule(),
                com.fasterxml.jackson.module.kotlin.KotlinModule.Builder().build(),
                SpringDataJacksonConfiguration.PageModule(settings),
            )
            .build()
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
            .setMessageConverters(
                MappingJackson2HttpMessageConverter(mapper),
                StringHttpMessageConverter(),
            )
            .build()
    }

    private fun sampleListDto() = AdminSubmissionListDto(
        id = submissionId.toString(),
        trackingCode = "0000018b66a2-6f4e-4f3b-9b2e-000000000000",
        formKey = "info-request",
        status = SubmissionStatus.SUBMITTED,
        contactEmail = "anna@example.cz",
        submittedAt = Instant.parse("2026-08-01T10:00:00Z"),
        slaStatus = SlaStatus.OK,
        dueAt = Instant.parse("2026-08-31T10:00:00Z"),
    )

    private fun sampleDetailDto(status: SubmissionStatus = SubmissionStatus.PROCESSING) = AdminSubmissionDetailDto(
        id = submissionId.toString(),
        trackingCode = "0000018b66a2-6f4e-4f3b-9b2e-000000000000",
        formKey = "info-request",
        formData = """{"requesterName":"Anna Nováková"}""",
        status = status,
        contactEmail = "anna@example.cz",
        contactPhone = null,
        submittedAt = Instant.parse("2026-08-01T10:00:00Z"),
        updatedAt = Instant.parse("2026-08-01T11:00:00Z"),
        slaStatus = SlaStatus.OK,
        dueAt = Instant.parse("2026-08-31T10:00:00Z"),
        validNextStates = listOf(SubmissionStatus.COMPLETED, SubmissionStatus.REJECTED, SubmissionStatus.NEEDS_INFO),
        history = emptyList(),
        confirmationUrl = "/api/submissions/0000018b66a2-6f4e-4f3b-9b2e-000000000000/confirmation",
        pdfUrl = "/api/submissions/0000018b66a2-6f4e-4f3b-9b2e-000000000000/pdf",
    )

    @Test
    fun `search returns paginated filtered list with sla status`() {
        whenever(
            adminSubmissionService.search(
                statuses = eq(listOf(SubmissionStatus.SUBMITTED)),
                formKey = eq(null),
                from = eq(null),
                to = eq(null),
                query = eq(null),
                page = eq(0),
                size = eq(20),
                sortBy = eq("createdAt"),
                sortDirection = eq("desc"),
            )
        ).thenReturn(PageImpl(listOf(sampleListDto())))

        mockMvc.perform(
            get("/api/admin/submissions")
                .param("status", "SUBMITTED")
                .principal(clerkAuth)
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.content[0].trackingCode").value(sampleListDto().trackingCode))
            .andExpect(jsonPath("$.content[0].slaStatus").value("OK"))
    }

    @Test
    fun `detail returns submission with valid next states and history`() {
        whenever(adminSubmissionService.findById(submissionId)).thenReturn(sampleDetailDto())

        mockMvc.perform(get("/api/admin/submissions/$submissionId").principal(clerkAuth))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.status").value("PROCESSING"))
            .andExpect(jsonPath("$.validNextStates[0]").value("COMPLETED"))
            .andExpect(jsonPath("$.confirmationUrl").value(sampleDetailDto().confirmationUrl))
    }

    @Test
    fun `state change with valid transition returns updated detail`() {
        val request = StateChangeRequestDto(newState = SubmissionStatus.COMPLETED, comment = "Vyřízeno, odesláno poštou.")
        whenever(adminSubmissionService.changeState(eq(submissionId), any(), any()))
            .thenReturn(sampleDetailDto(status = SubmissionStatus.COMPLETED))

        mockMvc.perform(
            patch("/api/admin/submissions/$submissionId/state")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .principal(clerkAuth)
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.status").value("COMPLETED"))
    }

    @Test
    fun `state change with invalid transition returns 409`() {
        val request = StateChangeRequestDto(newState = SubmissionStatus.COMPLETED, comment = "Přeskočení zpracování.")
        whenever(adminSubmissionService.changeState(eq(submissionId), any(), any()))
            .thenThrow(ResponseStatusException(HttpStatus.CONFLICT, "Neplatný přechod stavu"))

        mockMvc.perform(
            patch("/api/admin/submissions/$submissionId/state")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .principal(clerkAuth)
        )
            .andExpect(status().isConflict)
    }

    @Test
    fun `state change without comment fails validation`() {
        val invalidJson = """{"newState":"COMPLETED","comment":""}"""

        mockMvc.perform(
            patch("/api/admin/submissions/$submissionId/state")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson)
                .principal(clerkAuth)
        )
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `export streams csv with content disposition header`() {
        whenever(
            adminSubmissionService.exportCsv(any(), any(), any(), any(), any(), any())
        ).thenAnswer { invocation ->
            val out = invocation.getArgument<java.io.OutputStream>(5)
            out.write("﻿Číslo podání;Formulář\r\n".toByteArray(Charsets.UTF_8))
            null
        }

        val mvcResult = mockMvc.perform(get("/api/admin/submissions/export").principal(clerkAuth))
            .andExpect(request().asyncStarted())
            .andReturn()

        mockMvc.perform(asyncDispatch(mvcResult))
            .andExpect(status().isOk)
            .andExpect(content().contentTypeCompatibleWith(MediaType.parseMediaType("text/csv")))
            .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.startsWith("attachment; filename=\"submissions-")))
    }
}
