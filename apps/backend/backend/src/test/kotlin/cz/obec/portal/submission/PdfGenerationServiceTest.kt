package cz.obec.portal.submission

import cz.obec.portal.submission.service.ConfirmationRenderer.ConfirmationData
import cz.obec.portal.submission.service.PdfGenerationService
import cz.obec.portal.submission.service.QrCodeService
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.nio.charset.StandardCharsets

class PdfGenerationServiceTest {

    private val service = PdfGenerationService(QrCodeService())

    private val data = ConfirmationData(
        trackingCode = "0190abcd-1234-5678-9abc-def012345678",
        formTitle = "Žádost o informace",
        submittedAt = "1. 8. 2026 14:32",
        verificationUrl = "https://obec.cz/overeni/0190abcd-1234-5678-9abc-def012345678",
        rows = listOf(
            "Jméno a příjmení" to "Anna Nováková",
            "Typ žádosti" to "Poskytnutí informace",
            "Žádané informace" to "Rozpočet obce za rok 2025",
            "Souhlasím se zpracováním osobních údajů" to "Ano",
        ),
    )

    @Test
    fun `renders a pdf with the expected header`() {
        val pdf = service.render(data)

        assertTrue(pdf.size > 500)
        val header = String(pdf, 0, 8, StandardCharsets.ISO_8859_1)
        assertTrue(header.startsWith("%PDF"))
        assertTrue(header.contains("1.4"))
    }

    @Test
    fun `pdf declares the pdfa-1b profile`() {
        val pdf = service.render(data)

        val asLatin = String(pdf, StandardCharsets.ISO_8859_1)
        // PDF/A requires an OutputIntent with the sRGB output profile.
        assertTrue(asLatin.contains("/OutputIntent"), "missing /OutputIntent")
        assertTrue(asLatin.contains("sRGB"), "missing sRGB profile reference")
    }

    @Test
    fun `pdf contains the tracking code metadata`() {
        val pdf = service.render(data)

        val asLatin = String(pdf, StandardCharsets.ISO_8859_1)
        assertTrue(asLatin.contains("0190abcd-1234-5678-9abc-def012345678"))
    }

    @Test
    fun `pdf embeds the qr code image`() {
        val pdf = service.render(data)

        // A PNG image in the PDF shows up as a "PNG" IHDR image stream.
        val asLatin = String(pdf, StandardCharsets.ISO_8859_1)
        assertTrue(asLatin.contains("/XObject"), "missing image XObject")
        assertFalse(asLatin.contains("data:image"), "data URI must not leak into PDF")
    }

    @Test
    fun `user text is xml-escaped before injection`() {
        val hostile = ConfirmationData(
            trackingCode = data.trackingCode,
            formTitle = "Žádost <script>alert(1)</script>",
            submittedAt = data.submittedAt,
            verificationUrl = data.verificationUrl,
            rows = listOf("Poznámka" to "A & B < C"),
        )

        // Must not blow up FOP; escaping keeps the XML well-formed.
        val pdf = service.render(hostile)
        assertTrue(pdf.size > 500)
    }
}
