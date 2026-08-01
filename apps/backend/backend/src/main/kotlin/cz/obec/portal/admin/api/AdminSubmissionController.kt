package cz.obec.portal.admin.api

import cz.obec.portal.admin.api.dto.AdminSubmissionDetailDto
import cz.obec.portal.admin.api.dto.AdminSubmissionListDto
import cz.obec.portal.admin.api.dto.StateChangeRequestDto
import cz.obec.portal.admin.service.AdminSubmissionService
import cz.obec.portal.submission.domain.SubmissionStatus
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody
import java.time.Instant
import java.time.format.DateTimeFormatter
import java.util.UUID

/**
 * Clerk-only admin API (`ROLE_CLERK`, enforced by `SecurityConfig` and
 * `@PreAuthorize` in depth). Guest-facing endpoints (everything under
 * `/api/submissions`) stay separate and public.
 */
@RestController
@RequestMapping("/api/admin/submissions")
@PreAuthorize("hasRole('CLERK')")
class AdminSubmissionController(
    private val adminSubmissionService: AdminSubmissionService,
) {

    @GetMapping
    fun search(
        @RequestParam(required = false) status: List<SubmissionStatus>? = null,
        @RequestParam(required = false) formKey: String? = null,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) from: Instant? = null,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) to: Instant? = null,
        @RequestParam(required = false) q: String? = null,
        @RequestParam(defaultValue = "0") page: Int = 0,
        @RequestParam(defaultValue = "20") size: Int = 20,
        @RequestParam(defaultValue = "createdAt") sort: String = "createdAt",
        @RequestParam(defaultValue = "desc") direction: String = "desc",
    ): ResponseEntity<Page<AdminSubmissionListDto>> {
        val result = adminSubmissionService.search(status, formKey, from, to, q, page, size, sort, direction)
        return ResponseEntity.ok(result)
    }

    @GetMapping("/{id}")
    fun detail(@PathVariable id: UUID): ResponseEntity<AdminSubmissionDetailDto> {
        return ResponseEntity.ok(adminSubmissionService.findById(id))
    }

    @PatchMapping("/{id}/state")
    fun changeState(
        @PathVariable id: UUID,
        @Valid @RequestBody request: StateChangeRequestDto,
        authentication: JwtAuthenticationToken,
    ): ResponseEntity<AdminSubmissionDetailDto> {
        val jwt: Jwt = authentication.token
        return ResponseEntity.ok(adminSubmissionService.changeState(id, request, jwt))
    }

    /**
     * Streaming CSV export (T-06-05). `StreamingResponseBody#writeTo` runs on
     * Spring MVC's async-dispatch thread after this method returns — see the
     * kdoc on `AdminSubmissionService.exportCsv` for why that method (not
     * this one) carries the `@Transactional` boundary. The 60s ceiling on how
     * long the write may run is enforced globally via
     * `spring.mvc.async.request-timeout` in `application.yml`.
     */
    @GetMapping("/export")
    fun export(
        @RequestParam(required = false) status: List<SubmissionStatus>? = null,
        @RequestParam(required = false) formKey: String? = null,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) from: Instant? = null,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) to: Instant? = null,
        @RequestParam(required = false) q: String? = null,
    ): ResponseEntity<StreamingResponseBody> {
        val filename = "submissions-${DateTimeFormatter.ISO_LOCAL_DATE.format(java.time.LocalDate.now())}.csv"
        val body = StreamingResponseBody { out ->
            adminSubmissionService.exportCsv(status, formKey, from, to, q, out)
        }
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"$filename\"")
            .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
            .body(body)
    }
}
