package cz.obec.portal.submission

import cz.obec.portal.submission.domain.FormDefinition
import cz.obec.portal.submission.domain.Submission
import cz.obec.portal.submission.repository.SubmissionRepository
import cz.obec.portal.submission.service.ConfirmationRenderer
import cz.obec.portal.submission.service.FormCatalogService
import cz.obec.portal.submission.service.PdfGenerationService
import cz.obec.portal.submission.service.QrCodeService
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.kotlin.any
import org.mockito.kotlin.eq
import org.mockito.kotlin.whenever
import org.springframework.data.web.config.EnableSpringDataWebSupport
import org.springframework.data.web.config.SpringDataJacksonConfiguration
import org.springframework.data.web.config.SpringDataWebSettings
import org.springframework.http.MediaType
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.content
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.header
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.test.web.servlet.setup.MockMvcBuilders
import java.util.Optional

class ConfirmationControllerTest {

    private lateinit var mockMvc: MockMvc
    private lateinit var submissionRepository: SubmissionRepository
    private lateinit var formCatalogService: FormCatalogService
    private lateinit var confirmationRenderer: ConfirmationRenderer
    private lateinit var pdfGenerationService: PdfGenerationService
    private lateinit var qrCodeService: QrCodeService

    private val trackingCode = "2026-A7K3-9QXM-2FHT"

    @BeforeEach
    fun setUp() {
        submissionRepository = mock(SubmissionRepository::class.java)
        formCatalogService = mock(FormCatalogService::class.java)
        confirmationRenderer = mock(ConfirmationRenderer::class.java)
        pdfGenerationService = mock(PdfGenerationService::class.java)
        qrCodeService = mock(QrCodeService::class.java)

        val controller = cz.obec.portal.submission.api.ConfirmationController(
            submissionRepository,
            formCatalogService,
            confirmationRenderer,
            pdfGenerationService,
            qrCodeService,
        )
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
                org.springframework.http.converter.StringHttpMessageConverter(),
                org.springframework.http.converter.ByteArrayHttpMessageConverter(),
            )
            .build()

        whenever(submissionRepository.findByTrackingCode(trackingCode))
            .thenReturn(
                Optional.of(
                    Submission(trackingCode = trackingCode, formKey = "info-request", formData = "{}")
                )
            )
        whenever(formCatalogService.findDefinition(any()))
            .thenReturn(mock(FormDefinition::class.java))
        whenever(confirmationRenderer.render(any(), any())).thenReturn(
            ConfirmationRenderer.ConfirmationData(
                trackingCode = trackingCode,
                formTitle = "Žádost o informace",
                submittedAt = "1. 8. 2026 14:32",
                verificationUrl = "https://obec.cz/overeni/$trackingCode",
                rows = listOf("Typ žádosti" to "Poskytnutí informace"),
            )
        )
    }

    @Test
    fun `confirmation HTML endpoint returns page with tracking code`() {
        whenever(qrCodeService.pngBase64(any(), eq(220))).thenReturn("aW1hZ2U=")

        mockMvc.perform(
            get("/api/submissions/$trackingCode/confirmation")
                .accept(MediaType.TEXT_HTML)
        )
            .andExpect(status().isOk)
            .andExpect(content().contentType("text/html;charset=UTF-8"))
            .andExpect(content().string(org.hamcrest.Matchers.containsString(trackingCode)))
            .andExpect(content().string(org.hamcrest.Matchers.containsString("aW1hZ2U=")))
    }

    @Test
    fun `confirmation JSON endpoint returns structured data`() {
        mockMvc.perform(
            get("/api/submissions/$trackingCode/confirmation")
                .accept(MediaType.APPLICATION_JSON)
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.trackingCode").value(trackingCode))
            .andExpect(jsonPath("$.formTitle").value("Žádost o informace"))
            .andExpect(jsonPath("$.verificationUrl").value("https://obec.cz/overeni/$trackingCode"))
            .andExpect(jsonPath("$.rows[0].label").value("Typ žádosti"))
            .andExpect(jsonPath("$.rows[0].value").value("Poskytnutí informace"))
    }

    @Test
    fun `pdf endpoint returns binary pdf with content disposition`() {
        val pdfBytes = byteArrayOf(0x25, 0x50, 0x44, 0x46) // %PDF
        whenever(pdfGenerationService.render(any())).thenReturn(pdfBytes)

        mockMvc.perform(get("/api/submissions/$trackingCode/pdf"))
            .andExpect(status().isOk)
            .andExpect(header().string("Content-Disposition", "attachment; filename=\"potvrzeni-$trackingCode.pdf\""))
            .andExpect(content().contentType(MediaType.APPLICATION_PDF))
            .andExpect(content().bytes(pdfBytes))
    }
}
