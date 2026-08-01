package cz.obec.portal.admin.repository

import cz.obec.portal.admin.domain.SubmissionAuditLog
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface SubmissionAuditLogRepository : JpaRepository<SubmissionAuditLog, UUID> {

    fun findBySubmissionIdOrderByCreatedAtDesc(submissionId: UUID): List<SubmissionAuditLog>
}
