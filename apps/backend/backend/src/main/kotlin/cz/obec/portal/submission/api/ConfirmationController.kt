package cz.obec.portal.submission.api

import cz.obec.portal.submission.api.dto.ConfirmationDto
import cz.obec.portal.submission.domain.TrackingCode
import cz.obec.portal.submission.repository.SubmissionRepository
import cz.obec.portal.submission.service.ConfirmationRenderer
import cz.obec.portal.submission.service.ConfirmationRenderer.ConfirmationData
import cz.obec.portal.submission.service.FormCatalogService
import cz.obec.portal.submission.service.PdfGenerationService
import cz.obec.portal.submission.service.QrCodeService
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.nio.charset.StandardCharsets

/**
 * Confirmation endpoints.
 *
 * `GET /api/submissions/{trackingCode}/confirmation` returns the human-readable
 * HTML page; `GET /api/submissions/{trackingCode}/pdf` returns the archived
 * PDF/A-1b document. Both are keyed by the unguessable tracking code only.
 */
@RestController
@RequestMapping("/api/submissions")
class ConfirmationController(
    private val submissionRepository: SubmissionRepository,
    private val formCatalogService: FormCatalogService,
    private val confirmationRenderer: ConfirmationRenderer,
    private val pdfGenerationService: PdfGenerationService,
    private val qrCodeService: QrCodeService,
) {

    /** HTML confirmation page (renders in the browser; print-to-PDF supported). */
    @GetMapping("/{trackingCode}/confirmation", produces = [MediaType.TEXT_HTML_VALUE])
    fun confirmation(@PathVariable trackingCode: String): ResponseEntity<String> {
        val html = buildHtml(confirmationData(trackingCode))
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType("text/html;charset=UTF-8"))
            .body(html)
    }

    /** JSON confirmation data (tracking code, form title, verification URL, rows). */
    @GetMapping("/{trackingCode}/confirmation", produces = [MediaType.APPLICATION_JSON_VALUE])
    fun confirmationJson(@PathVariable trackingCode: String): ResponseEntity<ConfirmationDto> {
        return ResponseEntity.ok(ConfirmationDto.from(confirmationData(trackingCode)))
    }

    /** Binary PDF/A-1b confirmation. */
    @GetMapping("/{trackingCode}/pdf")
    fun pdf(@PathVariable trackingCode: String): ResponseEntity<ByteArray> {
        val bytes = pdfGenerationService.render(confirmationData(trackingCode))
        return ResponseEntity.ok()
            .header(
                HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"potvrzeni-$trackingCode.pdf\"",
            )
            .contentType(MediaType.APPLICATION_PDF)
            .body(bytes)
    }

    private fun confirmationData(trackingCode: String): ConfirmationData {
        val submission = requireSubmission(trackingCode)
        return confirmationRenderer.render(submission, requireForm(submission))
    }

    private fun buildHtml(data: ConfirmationData): String {
        val qrBase64 = qrCodeService.pngBase64(data.verificationUrl, size = 220)

        val css = loadResource("templates/confirmation.css")
        val template = loadResource("templates/confirmation.html")
        val fieldRows = data.rows.joinToString("\n") { (label, value) ->
            "        <tr><th scope=\"row\">${htmlEscape(label)}</th><td>${htmlEscape(value)}</td></tr>"
        }

        return template
            .replace("{{css}}", css)
            .replace("{{trackingCode}}", htmlEscape(data.trackingCode))
            .replace("{{formTitle}}", htmlEscape(data.formTitle))
            .replace("{{submittedAt}}", htmlEscape(data.submittedAt))
            .replace("{{fieldRows}}", fieldRows)
            .replace("{{qrBase64}}", qrBase64)
            .replace("{{verificationUrl}}", htmlEscape(data.verificationUrl))
    }

    // Same input tolerance as the tracking lookup — a citizen following the verification URL
    // off a printed PDF may well retype it by hand.
    private fun requireSubmission(trackingCode: String) =
        TrackingCode.normalize(trackingCode)
            ?.let { submissionRepository.findByTrackingCode(it) }
            ?.orElseThrow { NotFound(trackingCode) }
            ?: throw NotFound(trackingCode)

    private fun requireForm(submission: cz.obec.portal.submission.domain.Submission): cz.obec.portal.submission.domain.FormDefinition =
        formCatalogService.findDefinition(submission.formKey)
            ?: throw IllegalStateException("Form definition '${submission.formKey}' not found")

    private fun loadResource(name: String): String =
        javaClass.classLoader.getResourceAsStream(name)!!.use {
            it.readBytes().toString(StandardCharsets.UTF_8)
        }

    /** Escapes user-supplied values for safe HTML rendering. */
    private fun htmlEscape(text: String): String = buildString(text.length) {
        text.forEach { c ->
            when (c) {
                '&' -> append("&amp;")
                '<' -> append("&lt;")
                '>' -> append("&gt;")
                '"' -> append("&quot;")
                '\'' -> append("&#39;")
                else -> append(c)
            }
        }
    }

    private class NotFound(trackingCode: String) :
        NoSuchElementException("Submission not found: $trackingCode")
}
