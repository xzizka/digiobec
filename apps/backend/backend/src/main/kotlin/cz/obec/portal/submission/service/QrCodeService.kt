package cz.obec.portal.submission.service

import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.qrcode.QRCodeWriter
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel
import org.springframework.stereotype.Service
import java.awt.image.BufferedImage
import java.io.ByteArrayOutputStream
import javax.imageio.ImageIO

/**
 * ZXing-based QR code generator.
 *
 * Produces a PNG (300 DPI equivalent, `size` px) encoding the verification URL
 * of a confirmation. The PNG bytes are embedded directly into the XSL-FO via a
 * `data:image/png;base64,` URI and into the HTML confirmation page.
 */
@Service
class QrCodeService {

    /** Render [content] as a PNG byte array. */
    fun png(content: String, size: Int = 300): ByteArray {
        require(size in 64..1024) { "QR size must be between 64 and 1024 px" }
        require(content.isNotBlank()) { "QR content must not be blank" }

        val hints: Map<EncodeHintType, Any> = mapOf(
            EncodeHintType.ERROR_CORRECTION to ErrorCorrectionLevel.M,
            EncodeHintType.MARGIN to 1,
            EncodeHintType.CHARACTER_SET to "UTF-8",
        )
        val matrix = QRCodeWriter().encode(content, BarcodeFormat.QR_CODE, size, size, hints)

        val image = BufferedImage(size, size, BufferedImage.TYPE_INT_RGB)
        for (x in 0 until size) {
            for (y in 0 until size) {
                image.setRGB(x, y, if (matrix.get(x, y)) 0x000000 else 0xFFFFFF)
            }
        }

        return ByteArrayOutputStream().use { out ->
            ImageIO.write(image, "png", out)
            out.toByteArray()
        }
    }

    /** Same as [png] but base64-encoded for embedding into HTML/FO. */
    fun pngBase64(content: String, size: Int = 300): String =
        java.util.Base64.getEncoder().encodeToString(png(content, size))
}
