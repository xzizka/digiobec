package cz.obec.portal.admin.service

import cz.obec.portal.admin.api.dto.AdminSubmissionDetailDto
import cz.obec.portal.admin.api.dto.AdminSubmissionListDto
import cz.obec.portal.admin.api.dto.AuditEntryDto
import cz.obec.portal.admin.api.dto.CsvExportDto
import cz.obec.portal.admin.api.dto.StateChangeRequestDto
import cz.obec.portal.admin.domain.AuditEntryView
import cz.obec.portal.admin.domain.SubmissionAuditLog
import cz.obec.portal.admin.domain.SubmissionStateMachine
import cz.obec.portal.admin.repository.AdminSubmissionRepository
import cz.obec.portal.admin.repository.SubmissionAuditLogRepository
import cz.obec.portal.submission.domain.SubmissionStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.io.OutputStream
import java.time.Instant
import java.util.UUID

/**
 * Business logic for the clerk admin dashboard: filtered/paginated search,
 * detail + audit history lookup, and state-machine-validated status changes
 * (T-06-02, T-06-03).
 */
@Service
class AdminSubmissionService(
    private val submissionRepository: AdminSubmissionRepository,
    private val auditLogRepository: SubmissionAuditLogRepository,
    private val csvExportService: CsvExportService,
) {

    @Transactional(readOnly = true)
    fun search(
        statuses: List<SubmissionStatus>?,
        formKey: String?,
        from: Instant?,
        to: Instant?,
        query: String?,
        page: Int,
        size: Int,
        sortBy: String,
        sortDirection: String,
    ): Page<AdminSubmissionListDto> {
        val sort = Sort.by(
            if (sortDirection.equals("asc", ignoreCase = true)) Sort.Direction.ASC else Sort.Direction.DESC,
            sortableProperty(sortBy),
        )
        val pageable: Pageable = PageRequest.of(page, size, sort)
        val now = Instant.now()
        return submissionRepository.search(statuses, formKey, from, to, query?.trim()?.ifEmpty { null }, pageable)
            .map { AdminSubmissionListDto.from(it, now) }
    }

    @Transactional(readOnly = true)
    fun findById(id: UUID): AdminSubmissionDetailDto {
        val submission = submissionRepository.findById(id)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Podání nenalezeno.") }
        val history = auditLogRepository.findBySubmissionIdOrderByCreatedAtDesc(id)
            .map {
                AuditEntryView(
                    clerkUsername = it.clerkUsername,
                    oldStatus = it.oldStatus,
                    newStatus = it.newStatus,
                    comment = it.comment,
                    createdAt = it.createdAt,
                )
            }
        return AdminSubmissionDetailDto.from(submission, history)
    }

    /**
     * Validates the transition server-side (never trusts the client beyond
     * "which state do you want"), applies it, and appends an immutable audit
     * log row with the authenticated clerk's identity from the JWT.
     */
    @Transactional
    fun changeState(id: UUID, request: StateChangeRequestDto, jwt: Jwt): AdminSubmissionDetailDto {
        val submission = submissionRepository.findById(id)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Podání nenalezeno.") }

        if (!SubmissionStateMachine.isValidTransition(submission.status, request.newState)) {
            throw ResponseStatusException(
                HttpStatus.CONFLICT,
                "Neplatný přechod stavu: ${submission.status} -> ${request.newState}. " +
                    "Povolené přechody: ${SubmissionStateMachine.validNextStates(submission.status)}",
            )
        }

        val clerkId = jwt.subject ?: "unknown"
        val clerkUsername = jwt.getClaimAsString("preferred_username") ?: clerkId

        val updated = submission.copy(status = request.newState)
        submissionRepository.save(updated)

        auditLogRepository.save(
            SubmissionAuditLog(
                submissionId = submission.id,
                clerkId = clerkId,
                clerkUsername = clerkUsername,
                oldStatus = submission.status,
                newStatus = request.newState,
                comment = request.comment,
            ),
        )

        return findById(id)
    }

    /**
     * Streams the filtered result set straight into [out] as CSV (T-06-05:
     * no in-memory buffering of the full row set).
     *
     * IMPORTANT: this method itself must carry `@Transactional` — not just
     * the repository's `streamForExport` query method — because
     * `StreamingResponseBody#writeTo` runs on Spring MVC's async-dispatch
     * thread, *after* the controller method that kicked off the response has
     * already returned. If only the repository method were transactional,
     * its transaction (and the JDBC cursor backing the `Stream`) would close
     * the instant that single call returned, before a single row had been
     * written. Annotating this wrapping method keeps the transaction open for
     * the whole write, however/whenever it is invoked.
     */
    @Transactional(readOnly = true)
    fun exportCsv(
        statuses: List<SubmissionStatus>?,
        formKey: String?,
        from: Instant?,
        to: Instant?,
        query: String?,
        out: OutputStream,
    ) {
        val now = Instant.now()
        val stream = submissionRepository
            .streamForExport(statuses, formKey, from, to, query?.trim()?.ifEmpty { null })
            .map { CsvExportDto.from(it, now) }
        csvExportService.writeCsv(stream, out)
    }

    private fun sortableProperty(sortBy: String): String = when (sortBy) {
        "trackingCode", "formKey", "status", "createdAt" -> sortBy
        "submittedAt" -> "createdAt"
        else -> "createdAt"
    }
}
