package cz.obec.portal.submission.service

import cz.obec.portal.submission.api.dto.SubmissionRequestDto
import cz.obec.portal.submission.api.dto.SubmissionResponseDto
import cz.obec.portal.submission.domain.Submission
import cz.obec.portal.submission.domain.SubmissionStatus
import cz.obec.portal.submission.domain.TrackingCode
import cz.obec.portal.submission.repository.SubmissionRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.Instant
import java.util.UUID

@Service
class SubmissionService(
    private val submissionRepository: SubmissionRepository,
    private val formCatalogService: FormCatalogService,
    private val formValidationService: FormValidationService,
) {

    @Transactional
    fun create(request: SubmissionRequestDto, clientIp: String?): SubmissionResponseDto {
        val definition = formCatalogService.findDefinition(request.formKey)
            ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Neznámý formulář: ${request.formKey}")

        val validation = formValidationService.validate(definition, request.formData)
        if (!validation.valid) {
            val details = validation.errors.joinToString("; ") { "${it.field}: ${it.message}" }
            throw ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, details)
        }

        val submission = Submission(
            trackingCode = newTrackingCode(),
            formKey = request.formKey,
            formData = request.formData,
            contactEmail = request.contactEmail?.trim()?.ifEmpty { null },
            contactPhone = request.contactPhone?.trim()?.ifEmpty { null },
            clientIp = clientIp,
        )
        return SubmissionResponseDto.from(submissionRepository.save(submission))
    }

    @Transactional(readOnly = true)
    fun findByTrackingCode(code: String): SubmissionResponseDto {
        // Tolerate how citizens actually type the code off a PDF or over the phone —
        // lowercase, spaces instead of hyphens, O for 0. Unparseable input is a 404, not a
        // database round-trip.
        val normalized = TrackingCode.normalize(code)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Podání nenalezeno.")
        val submission = submissionRepository.findByTrackingCode(normalized)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Podání nenalezeno.") }
        return SubmissionResponseDto.from(submission)
    }

    @Transactional(readOnly = true)
    fun search(
        status: SubmissionStatus? = null,
        formKey: String? = null,
        from: Instant? = null,
        to: Instant? = null,
        page: Int = 0,
        size: Int = 20,
    ): Page<SubmissionResponseDto> {
        val pageable: Pageable = PageRequest.of(page, size)
        return submissionRepository.search(status, formKey, from, to, pageable)
            .map { SubmissionResponseDto.from(it) }
    }

    /**
     * Generates a citizen-facing tracking code, retrying on the (astronomically unlikely)
     * chance of colliding with an existing one. The unique index on `tracking_code` is the
     * real guarantee; this just avoids surfacing a constraint violation as a 500.
     */
    private fun newTrackingCode(): String {
        repeat(MAX_TRACKING_CODE_ATTEMPTS) {
            val candidate = TrackingCode.generate()
            if (submissionRepository.findByTrackingCode(candidate).isEmpty) return candidate
        }
        throw IllegalStateException(
            "Nepodařilo se vygenerovat unikátní sledovací kód po $MAX_TRACKING_CODE_ATTEMPTS pokusech.",
        )
    }

    private companion object {
        const val MAX_TRACKING_CODE_ATTEMPTS = 5
    }
}
