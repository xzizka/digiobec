package cz.obec.portal.admin.service

import cz.obec.portal.admin.api.dto.CsvExportDto
import org.springframework.stereotype.Service
import java.io.BufferedWriter
import java.io.OutputStream
import java.io.OutputStreamWriter
import java.nio.charset.StandardCharsets
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import java.util.Locale
import java.util.stream.Stream

/**
 * Hand-written streaming CSV writer — no CSV library dependency is added
 * (T-06-SC: avoids introducing a new, unreviewed npm/pub-equivalent package
 * for a task this small). Writes directly to the response [OutputStream] as
 * rows are pulled from the DB [Stream], so a 10k+ row export never holds the
 * full result set in memory (T-06-05).
 */
@Service
class CsvExportService {

    companion object {
        /** Excel-on-Windows-with-Czech-locale default: semicolon field separator. */
        private const val DELIMITER = ';'
        private val UTF8_BOM = byteArrayOf(0xEF.toByte(), 0xBB.toByte(), 0xBF.toByte())
        private val CZECH_DATE_FORMAT: DateTimeFormatter =
            DateTimeFormatter.ofPattern("dd. MM. yyyy HH:mm", Locale.of("cs", "CZ"))

        private val HEADER = listOf(
            "Číslo podání",
            "Formulář",
            "Stav",
            "Kontaktní e-mail",
            "Kontaktní telefon",
            "Odesláno",
            "SLA",
        )
    }

    /**
     * Writes the UTF-8 BOM, header row, then every row from [rows] as it is
     * pulled from the cursor. Caller is responsible for closing [rows] (via
     * try-with-resources / `.use`) inside the same read-only transaction that
     * produced the stream.
     */
    fun writeCsv(rows: Stream<CsvExportDto>, out: OutputStream) {
        out.write(UTF8_BOM)
        val writer = BufferedWriter(OutputStreamWriter(out, StandardCharsets.UTF_8))
        writer.write(HEADER.joinToString(DELIMITER.toString()) { escape(it) })
        writer.newLine()
        rows.use { stream ->
            stream.forEach { row ->
                writer.write(toCsvLine(row))
                writer.newLine()
                writer.flush()
            }
        }
        writer.flush()
    }

    private fun toCsvLine(row: CsvExportDto): String = listOf(
        row.trackingCode,
        row.formKey,
        statusLabel(row.status),
        row.contactEmail,
        row.contactPhone,
        CZECH_DATE_FORMAT.format(row.submittedAt.atZone(ZoneOffset.UTC)),
        slaLabel(row.slaStatus),
    ).joinToString(DELIMITER.toString()) { escape(it) }

    private fun statusLabel(status: String): String = when (status) {
        "SUBMITTED" -> "Přijato"
        "PROCESSING" -> "Zpracovává se"
        "NEEDS_INFO" -> "Čeká na doplnění"
        "COMPLETED" -> "Vyřízeno"
        "REJECTED" -> "Zamítnuto"
        else -> status
    }

    private fun slaLabel(sla: cz.obec.portal.admin.domain.SlaStatus): String = when (sla) {
        cz.obec.portal.admin.domain.SlaStatus.CLOSED -> "Uzavřeno"
        cz.obec.portal.admin.domain.SlaStatus.OK -> "V pořádku"
        cz.obec.portal.admin.domain.SlaStatus.DUE_THIS_WEEK -> "Termín tento týden"
        cz.obec.portal.admin.domain.SlaStatus.DUE_TODAY -> "Termín dnes"
        cz.obec.portal.admin.domain.SlaStatus.OVERDUE -> "Po termínu"
    }

    /** RFC 4180: quote a field if it contains the delimiter, a quote, or a newline. */
    private fun escape(field: String): String {
        val needsQuoting = field.contains(DELIMITER) || field.contains('"') || field.contains('\n') || field.contains('\r')
        return if (needsQuoting) "\"${field.replace("\"", "\"\"")}\"" else field
    }
}
