package cz.obec.portal.admin

import cz.obec.portal.admin.api.dto.CsvExportDto
import cz.obec.portal.admin.domain.SlaStatus
import cz.obec.portal.admin.service.CsvExportService
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.io.ByteArrayOutputStream
import java.nio.charset.StandardCharsets
import java.time.Instant

class CsvExportServiceTest {

    private val service = CsvExportService()

    private fun row(
        trackingCode: String = "2026-A7K3-9QXM-2FHT",
        contactEmail: String = "anna@example.cz",
        sla: SlaStatus = SlaStatus.OK,
        submittedAt: Instant = Instant.parse("2026-08-01T10:30:00Z"),
    ) = CsvExportDto(
        trackingCode = trackingCode,
        formKey = "info-request",
        status = "SUBMITTED",
        contactEmail = contactEmail,
        contactPhone = "",
        submittedAt = submittedAt,
        slaStatus = sla,
    )

    @Test
    fun `writes UTF-8 BOM followed by header and rows`() {
        val out = ByteArrayOutputStream()
        service.writeCsv(listOf(row()).stream(), out)

        val bytes = out.toByteArray()
        assertEquals(0xEF.toByte(), bytes[0])
        assertEquals(0xBB.toByte(), bytes[1])
        assertEquals(0xBF.toByte(), bytes[2])

        val text = String(bytes, 3, bytes.size - 3, StandardCharsets.UTF_8)
        val lines = text.trim().lines()
        assertEquals("Číslo podání;Formulář;Stav;Kontaktní e-mail;Kontaktní telefon;Odesláno;SLA", lines[0])
        assertTrue(lines[1].startsWith("2026-A7K3-9QXM-2FHT;info-request;Přijato;anna@example.cz"))
    }

    @Test
    fun `formats submitted date in Czech dd MM yyyy HH mm`() {
        val out = ByteArrayOutputStream()
        service.writeCsv(listOf(row(submittedAt = Instant.parse("2026-08-01T10:30:00Z"))).stream(), out)

        val text = String(out.toByteArray(), StandardCharsets.UTF_8)
        assertTrue(text.contains("01. 08. 2026 10:30"), "Expected Czech date format in: $text")
    }

    @Test
    fun `translates sla status to Czech label`() {
        val out = ByteArrayOutputStream()
        service.writeCsv(listOf(row(sla = SlaStatus.OVERDUE)).stream(), out)

        val text = String(out.toByteArray(), StandardCharsets.UTF_8)
        assertTrue(text.contains("Po termínu"), "Expected overdue label in: $text")
    }

    @Test
    fun `escapes fields containing the delimiter or quotes`() {
        val out = ByteArrayOutputStream()
        service.writeCsv(
            listOf(row(contactEmail = "weird;name\"with\"quotes@example.cz")).stream(),
            out,
        )

        val text = String(out.toByteArray(), StandardCharsets.UTF_8)
        assertTrue(
            text.contains("\"weird;name\"\"with\"\"quotes@example.cz\""),
            "Expected RFC4180-escaped field in: $text",
        )
    }

    @Test
    fun `streams multiple rows without buffering the whole result in a collection first`() {
        val out = ByteArrayOutputStream()
        val rows = (1..500).asSequence().map { i -> row(trackingCode = "code-$i") }
        service.writeCsv(rows.asStream(), out)

        val text = String(out.toByteArray(), StandardCharsets.UTF_8)
        // header + 500 data rows
        assertEquals(501, text.trim().lines().size)
    }
}

private fun <T> Sequence<T>.asStream(): java.util.stream.Stream<T> =
    java.util.stream.StreamSupport.stream(this.asIterable().spliterator(), false)
