package cz.obec.portal.admin.domain

import cz.obec.portal.submission.domain.SubmissionStatus
import java.time.Instant
import java.time.ZoneOffset
import java.time.temporal.ChronoUnit

/** SLA risk badge shown on the admin dashboard. */
enum class SlaStatus {
    /** Terminal state (COMPLETED/REJECTED) — no SLA risk to track. */
    CLOSED,
    OK,
    DUE_THIS_WEEK,
    DUE_TODAY,
    OVERDUE,
}

/**
 * Czech administrative procedure default deadline (Sect. 71 Administrative
 * Procedure Code — 30 days for a straightforward decision). Configurable per
 * form in a later phase; a single default keeps this plan's scope contained.
 */
const val DEFAULT_SLA_DAYS: Long = 30L

fun dueAt(createdAt: Instant): Instant = createdAt.plus(DEFAULT_SLA_DAYS, ChronoUnit.DAYS)

fun slaStatusOf(status: SubmissionStatus, createdAt: Instant, now: Instant = Instant.now()): SlaStatus {
    if (status == SubmissionStatus.COMPLETED || status == SubmissionStatus.REJECTED) {
        return SlaStatus.CLOSED
    }
    val due = dueAt(createdAt)
    if (due.isBefore(now)) return SlaStatus.OVERDUE

    val today = now.atZone(ZoneOffset.UTC).toLocalDate()
    val dueDate = due.atZone(ZoneOffset.UTC).toLocalDate()
    if (dueDate == today) return SlaStatus.DUE_TODAY
    if (!dueDate.isAfter(today.plusDays(7))) return SlaStatus.DUE_THIS_WEEK
    return SlaStatus.OK
}
