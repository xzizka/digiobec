package cz.obec.portal.admin.repository

import cz.obec.portal.submission.domain.Submission
import cz.obec.portal.submission.domain.SubmissionStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.jpa.repository.QueryHints
import org.springframework.data.repository.query.Param
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID
import java.util.stream.Stream
import jakarta.persistence.QueryHint

/**
 * Admin-facing queries over [Submission]: multi-status filter, free-text
 * tracking-code search, and a cursor-backed [Stream] for CSV export
 * (T-06-05 — avoids loading the full result set into memory).
 */
interface AdminSubmissionRepository : JpaRepository<Submission, UUID> {

    @Query(
        """SELECT s FROM Submission s
           WHERE (:#{#statuses == null || #statuses.isEmpty()} = true OR s.status IN :statuses)
             AND (:#{#formKey == null} = true OR s.formKey = :formKey)
             AND (:#{#from == null} = true OR s.createdAt >= :from)
             AND (:#{#to == null} = true OR s.createdAt <= :to)
             AND (:#{#query == null} = true OR LOWER(s.trackingCode) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%'))
                  OR LOWER(COALESCE(s.contactEmail, '')) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%')))"""
    )
    fun search(
        @Param("statuses") statuses: List<SubmissionStatus>?,
        @Param("formKey") formKey: String?,
        @Param("from") from: Instant?,
        @Param("to") to: Instant?,
        @Param("query") query: String?,
        pageable: Pageable,
    ): Page<Submission>

    /**
     * Same filter as [search] but as a lazily-fetched [Stream] for streaming
     * CSV export. Must be called within a read-only transaction so the
     * underlying JDBC cursor stays open while the caller writes each row.
     */
    @QueryHints(QueryHint(name = "org.hibernate.fetchSize", value = "200"))
    @Query(
        """SELECT s FROM Submission s
           WHERE (:#{#statuses == null || #statuses.isEmpty()} = true OR s.status IN :statuses)
             AND (:#{#formKey == null} = true OR s.formKey = :formKey)
             AND (:#{#from == null} = true OR s.createdAt >= :from)
             AND (:#{#to == null} = true OR s.createdAt <= :to)
             AND (:#{#query == null} = true OR LOWER(s.trackingCode) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%'))
                  OR LOWER(COALESCE(s.contactEmail, '')) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%')))
           ORDER BY s.createdAt DESC"""
    )
    @Transactional(readOnly = true)
    fun streamForExport(
        @Param("statuses") statuses: List<SubmissionStatus>?,
        @Param("formKey") formKey: String?,
        @Param("from") from: Instant?,
        @Param("to") to: Instant?,
        @Param("query") query: String?,
    ): Stream<Submission>
}
