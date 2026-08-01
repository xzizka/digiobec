package cz.obec.portal.submission.service

import cz.obec.portal.submission.api.dto.SubmissionRequestDto
import cz.obec.portal.submission.api.dto.SubmissionResponseDto
import cz.obec.portal.submission.domain.Submission
import cz.obec.portal.submission.domain.SubmissionStatus
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
        val submission = submissionRepository.findByTrackingCode(code)
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

    /** Time-ordered unguessable tracking code (UUID v7 flavour). */
    private fun newTrackingCode(): String {
        val now = Instant.now().toEpochMilli()
        val uuid = UUID.randomUUID()
        return java.lang.String.format(
            "%013x-%s",
            now,
            uuid.toString().substring(0, 23),
        )
    }
}
