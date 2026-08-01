package cz.obec.portal.submission.service

import cz.obec.portal.submission.service.ConfirmationRenderer.ConfirmationData
import org.apache.fop.apps.FOUserAgent
import org.apache.fop.apps.Fop
import org.apache.fop.apps.FopConfParser
import org.apache.fop.apps.FopFactory
import org.apache.fop.apps.MimeConstants
import org.slf4j.LoggerFactory
import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Service
import java.io.File
import java.io.StringReader
import java.nio.charset.StandardCharsets
import java.nio.file.Files
import javax.xml.transform.TransformerFactory
import javax.xml.transform.sax.SAXResult
import javax.xml.transform.stream.StreamSource

/**
 * Renders the XSL-FO confirmation template to a PDF/A-1b document.
 *
 * DejaVu fonts are copied from the classpath to a temp directory so FOP can
 * register them (CJK/Latin-2 Czech glyphs are covered). The PDF/A-1b profile
 * is activated through the `pdf-a-mode` renderer option (FOP ≥ 2.9).
 */
@Service
class PdfGenerationService(
    private val qrCodeService: QrCodeService,
) {
    private val logger = LoggerFactory.getLogger(PdfGenerationService::class.java)

    private val fopFactory: FopFactory by lazy { buildFopFactory() }

    /** Generate the PDF/A-1b confirmation for [data]. */
    fun render(data: ConfirmationData): ByteArray {
        val qrBase64 = qrCodeService.pngBase64(data.verificationUrl, size = 300)
        val fo = loadTemplate("confirmation.fo.xml")
            .replace("{{trackingCode}}", xmlEscape(data.trackingCode))
            .replace("{{formTitle}}", xmlEscape(data.formTitle))
            .replace("{{submittedAt}}", xmlEscape(data.submittedAt))
            .replace("{{verificationUrl}}", xmlEscape(data.verificationUrl))
            .replace("{{qrBase64}}", qrBase64)
            .replace("{{fieldRows}}", data.rows.joinToString("\n") { (label, value) -> fieldRow(label, value) })

        val baos = java.io.ByteArrayOutputStream()
        val userAgent: FOUserAgent = fopFactory.newFOUserAgent()
        userAgent.rendererOptions["pdf-a-mode"] = "PDF/A-1b"
        userAgent.rendererOptions["version"] = "1.4"

        val fop: Fop = fopFactory.newFop(MimeConstants.MIME_PDF, userAgent, baos)
        val transformer = TransformerFactory.newInstance().newTransformer()
        transformer.transform(StreamSource(StringReader(fo)), SAXResult(fop.defaultHandler))
        return baos.toByteArray()
    }

    private fun fieldRow(label: String, value: String): String {
        val escapedLabel = xmlEscape(label)
        val escapedValue = xmlEscape(value)
        return """
            <fo:table-row>
              <fo:table-cell>
                <fo:block font-weight="bold">$escapedLabel</fo:block>
              </fo:table-cell>
              <fo:table-cell>
                <fo:block>$escapedValue</fo:block>
              </fo:table-cell>
            </fo:table-row>
        """.trimIndent()
    }

    private fun loadTemplate(name: String): String =
        ClassPathResource("templates/$name").inputStream.use {
            it.readBytes().toString(StandardCharsets.UTF_8)
        }

    private fun buildFopFactory(): FopFactory {
        val fontDir = Files.createTempDirectory("portal-fonts").toFile()
        copyFont(fontDir, "DejaVuSans.ttf")
        copyFont(fontDir, "DejaVuSans-Bold.ttf")
        copyFont(fontDir, "DejaVuSansMono.ttf")

        val fontUrl = { name: String -> fontDir.resolve(name).toURI().toURL().toString() }
        val config = """
            <fop version="1.0">
              <renderers>
                <renderer mime="application/pdf">
                  <fonts>
                    <font embed-url="${fontUrl("DejaVuSans.ttf")}">
                      <font-triplet name="DejaVu Sans" style="normal" weight="normal"/>
                    </font>
                    <font embed-url="${fontUrl("DejaVuSans-Bold.ttf")}">
                      <font-triplet name="DejaVu Sans" style="normal" weight="bold"/>
                      <font-triplet name="DejaVu Sans" style="italic" weight="bold"/>
                    </font>
                    <font embed-url="${fontUrl("DejaVuSansMono.ttf")}">
                      <font-triplet name="DejaVu Sans Mono" style="normal" weight="normal"/>
                      <font-triplet name="DejaVu Sans Mono" style="normal" weight="bold"/>
                    </font>
                  </fonts>
                </renderer>
              </renderers>
            </fop>
        """.trimIndent()

        val parser = FopConfParser(config.byteInputStream(), File(".").toURI())
        return parser.getFopFactoryBuilder().build()
    }

    private fun copyFont(dir: File, name: String) {
        ClassPathResource("fonts/$name").inputStream.use { input ->
            Files.copy(input, dir.toPath().resolve(name))
        }
    }

    companion object {
        /** Minimal XML escaping for user-provided values injected into the FO. */
        fun xmlEscape(text: String): String = buildString(text.length) {
            text.forEach { c ->
                when (c) {
                    '&' -> append("&amp;")
                    '<' -> append("&lt;")
                    '>' -> append("&gt;")
                    '"' -> append("&quot;")
                    '\'' -> append("&apos;")
                    else -> append(c)
                }
            }
        }
    }
}
