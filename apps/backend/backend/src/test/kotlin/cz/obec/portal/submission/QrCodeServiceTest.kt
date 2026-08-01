package cz.obec.portal.submission

import com.google.zxing.BinaryBitmap
import com.google.zxing.client.j2se.BufferedImageLuminanceSource
import com.google.zxing.common.HybridBinarizer
import com.google.zxing.qrcode.QRCodeReader
import cz.obec.portal.submission.service.QrCodeService
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.io.ByteArrayInputStream
import javax.imageio.ImageIO

class QrCodeServiceTest {

    private val service = QrCodeService()

    @Test
    fun `qr png is a valid png image`() {
        val png = service.png("https://obec.cz/overeni/test-code")

        assertTrue(png.isNotEmpty())
        // PNG signature: 89 50 4E 47
        assertEquals(0x89.toByte(), png[0])
        assertEquals('P'.code.toByte(), png[1])
        assertEquals('N'.code.toByte(), png[2])
        assertEquals('G'.code.toByte(), png[3])
    }

    @Test
    fun `qr decodes back to the verification url`() {
        val url = "https://obec.cz/overeni/0190abcd-1234-5678"
        val png = service.png(url, size = 320)

        val decoded = decode(png)

        assertEquals(url, decoded)
    }

    @Test
    fun `pngBase64 is the base64 form of png`() {
        val url = "https://obec.cz/overeni/qr-base64"
        val encoded = service.pngBase64(url, size = 128)

        val decoded = java.util.Base64.getDecoder().decode(encoded)

        assertTrue(decoded.contentEquals(service.png(url, size = 128)))
    }

    private fun decode(png: ByteArray): String {
        val image = ImageIO.read(ByteArrayInputStream(png))
        require(image != null) { "Failed to read QR PNG" }
        val source = BufferedImageLuminanceSource(image)
        val bitmap = BinaryBitmap(HybridBinarizer(source))
        return QRCodeReader().decode(bitmap).text
    }
}
