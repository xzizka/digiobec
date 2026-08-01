package cz.obec.portal.submission.api

import cz.obec.portal.submission.api.dto.SubmissionRequestDto
import cz.obec.portal.submission.api.dto.SubmissionResponseDto
import cz.obec.portal.submission.domain.SubmissionStatus
import cz.obec.portal.submission.service.SubmissionService
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.Instant

@RestController
@RequestMapping("/api/submissions")
class SubmissionController(
    private val submissionService: SubmissionService,
) {

    /** Guest submission. Validated server-side; returns 201 + tracking code. */
    @PostMapping
    fun create(
        @Valid @RequestBody request: SubmissionRequestDto,
        httpRequest: HttpServletRequest,
    ): ResponseEntity<SubmissionResponseDto> {
        val result = submissionService.create(request, httpRequest.remoteAddr)
        return ResponseEntity.status(HttpStatus.CREATED).body(result)
    }

    /** Public lookup by tracking code. */
    @GetMapping("/{trackingCode}")
    fun get(@PathVariable trackingCode: String): ResponseEntity<SubmissionResponseDto> {
        return ResponseEntity.ok(submissionService.findByTrackingCode(trackingCode))
    }

    /** Admin list with filtering + server-side pagination. */
    @GetMapping
    fun search(
        @RequestParam(required = false) status: SubmissionStatus? = null,
        @RequestParam(required = false) formKey: String? = null,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) from: Instant? = null,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) to: Instant? = null,
        @RequestParam(defaultValue = "0") page: Int = 0,
        @RequestParam(defaultValue = "20") size: Int = 20,
    ): ResponseEntity<Page<SubmissionResponseDto>> {
        val result = submissionService.search(status, formKey, from, to, page, size)
        return ResponseEntity.ok(result)
    }
}
