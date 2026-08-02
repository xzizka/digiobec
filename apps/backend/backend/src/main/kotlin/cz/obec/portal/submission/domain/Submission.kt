package cz.obec.portal.submission.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.time.Instant
import java.util.UUID

/**
 * A guest citizen submission. `formData` is a validated JSONB blob shaped by
 * the JSON Schema of the referenced form definition.
 */
@Entity
@Table(name = "submission", indexes = [
    Index(name = "idx_submission_tracking_code", columnList = "tracking_code", unique = true),
    Index(name = "idx_submission_status", columnList = "status"),
    Index(name = "idx_submission_created_at", columnList = "created_at"),
])
data class Submission(
    @Id
    @Column(nullable = false, updatable = false)
    val id: UUID = UUID.randomUUID(),

    /**
     * Public, unguessable, citizen-facing code in the form `YYYY-XXXX-XXXX-XXXX`.
     * See [TrackingCode] — it is the sole access credential for a guest submission.
     */
    @Column(name = "tracking_code", nullable = false, unique = true, updatable = false, length = 50)
    val trackingCode: String,

    /** References the form definition key, e.g. "info-request". */
    @Column(name = "form_key", nullable = false, length = 100)
    val formKey: String,

    /**
     * Arbitrary validated JSON document matching the form's JSON Schema.
     *
     * `@JdbcTypeCode(SqlTypes.JSON)` is required here — without it Hibernate
     * binds this as a plain varchar parameter, which Postgres accepts on
     * INSERT (implicit unknown->jsonb cast) but rejects on UPDATE with
     * "column form_data is of type jsonb but expression is of type character
     * varying". That silently broke every subsequent status change (T-06-02).
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "form_data", nullable = false, columnDefinition = "jsonb")
    val formData: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    val status: SubmissionStatus = SubmissionStatus.SUBMITTED,

    @Column(name = "contact_email", length = 255)
    val contactEmail: String? = null,

    @Column(name = "contact_phone", length = 50)
    val contactPhone: String? = null,

    /** Client IP for audit (no PII, aggregate only). */
    @Column(name = "client_ip", length = 45)
    val clientIp: String? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),
) {
    @PrePersist
    @PreUpdate
    fun touch() {
        updatedAt = Instant.now()
    }
}
