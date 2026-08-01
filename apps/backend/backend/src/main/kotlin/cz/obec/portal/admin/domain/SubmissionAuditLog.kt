package cz.obec.portal.admin.domain

import cz.obec.portal.submission.domain.SubmissionStatus
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

/**
 * Immutable, append-only audit trail entry for a clerk-driven status change
 * (T-06-03 Repudiation mitigation). Never updated or deleted after insert.
 */
@Entity
@Table(
    name = "submission_audit_log",
    indexes = [
        Index(name = "idx_audit_submission_id", columnList = "submission_id"),
        Index(name = "idx_audit_created_at", columnList = "created_at"),
    ],
)
data class SubmissionAuditLog(
    @Id
    @Column(nullable = false, updatable = false)
    val id: UUID = UUID.randomUUID(),

    @Column(name = "submission_id", nullable = false, updatable = false)
    val submissionId: UUID,

    /** Keycloak `sub` claim of the clerk who made the change. */
    @Column(name = "clerk_id", nullable = false, updatable = false, length = 100)
    val clerkId: String,

    /** Keycloak `preferred_username` claim, for human-readable audit display. */
    @Column(name = "clerk_username", nullable = false, updatable = false, length = 255)
    val clerkUsername: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "old_status", nullable = false, updatable = false, length = 30)
    val oldStatus: SubmissionStatus,

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, updatable = false, length = 30)
    val newStatus: SubmissionStatus,

    @Column(nullable = false, updatable = false, columnDefinition = "text")
    val comment: String,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),
)
