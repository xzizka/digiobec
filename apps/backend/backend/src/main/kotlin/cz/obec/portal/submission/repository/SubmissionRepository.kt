package cz.obec.portal.submission.repository

import cz.obec.portal.submission.domain.Submission
import cz.obec.portal.submission.domain.SubmissionStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.util.Optional
import java.util.UUID

interface SubmissionRepository : JpaRepository<Submission, UUID> {

    fun findByTrackingCode(trackingCode: String): Optional<Submission>

    @Query(
        """SELECT s FROM Submission s
           WHERE (:status IS NULL OR s.status = :status)
             AND (:formKey IS NULL OR s.formKey = :formKey)
             AND (:from IS NULL OR s.createdAt >= :from)
             AND (:to IS NULL OR s.createdAt <= :to)
           ORDER BY s.createdAt DESC"""
    )
    fun search(
        @Param("status") status: SubmissionStatus?,
        @Param("formKey") formKey: String?,
        @Param("from") from: java.time.Instant?,
        @Param("to") to: java.time.Instant?,
        pageable: Pageable,
    ): Page<Submission>
}
