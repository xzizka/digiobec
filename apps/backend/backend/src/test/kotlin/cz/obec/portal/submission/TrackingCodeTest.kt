package cz.obec.portal.submission

import cz.obec.portal.submission.domain.TrackingCode
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.time.Instant
import java.time.ZoneId

class TrackingCodeTest {

    private val prague = ZoneId.of("Europe/Prague")

    @Test
    fun `generates the documented citizen-facing shape`() {
        val code = TrackingCode.generate(Instant.parse("2026-08-02T10:15:00Z"), prague)

        assertThat(code).matches("""2026-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}""")
        assertThat(code).hasSize(TrackingCode.LENGTH)
        assertThat(TrackingCode.LENGTH).isEqualTo(19)
    }

    @Test
    fun `uses the submission year in the local timezone`() {
        // 31 Dec 23:30 UTC is already 1 Jan in Prague — the code must say 2027, because the
        // year is what a clerk files the submission under.
        val code = TrackingCode.generate(Instant.parse("2026-12-31T23:30:00Z"), prague)

        assertThat(code).startsWith("2027-")
    }

    @Test
    fun `never emits characters that are misread when dictated`() {
        // I and L look like 1, O looks like 0, U risks accidental profanity.
        val body = (1..300)
            .map { TrackingCode.generate() }
            .joinToString("") { it.substringAfter('-').replace("-", "") }

        assertThat(body).doesNotContain("I").doesNotContain("L")
        assertThat(body).doesNotContain("O").doesNotContain("U")
    }

    @Test
    fun `does not repeat itself`() {
        // 60 bits of entropy: a collision in 2000 draws would indicate a broken generator,
        // not bad luck.
        val codes = (1..2000).map { TrackingCode.generate() }.toSet()

        assertThat(codes).hasSize(2000)
    }

    @Test
    fun `normalize accepts the canonical form unchanged`() {
        assertThat(TrackingCode.normalize("2026-A7K3-9QXM-2FHT")).isEqualTo("2026-A7K3-9QXM-2FHT")
    }

    @Test
    fun `normalize tolerates how citizens actually type the code`() {
        val canonical = "2026-A7K3-9QXM-2FHT"

        // lowercase, spaces instead of hyphens, run together, padded
        assertThat(TrackingCode.normalize("2026-a7k3-9qxm-2fht")).isEqualTo(canonical)
        assertThat(TrackingCode.normalize("2026 A7K3 9QXM 2FHT")).isEqualTo(canonical)
        assertThat(TrackingCode.normalize("2026A7K39QXM2FHT")).isEqualTo(canonical)
        assertThat(TrackingCode.normalize("  2026-A7K3-9QXM-2FHT  ")).isEqualTo(canonical)
    }

    @Test
    fun `normalize folds the ambiguous characters the alphabet excludes`() {
        // Someone reading "0" off a PDF may well write "O"; "1" may be written "I" or "l".
        assertThat(TrackingCode.normalize("2026-O7K3-9QXM-2FHT")).isEqualTo("2026-07K3-9QXM-2FHT")
        assertThat(TrackingCode.normalize("2026-A7K3-9QXM-2FHI")).isEqualTo("2026-A7K3-9QXM-2FH1")
        assertThat(TrackingCode.normalize("2026-A7K3-9QXM-2FHl")).isEqualTo("2026-A7K3-9QXM-2FH1")
    }

    @Test
    fun `normalize rejects input that cannot be a tracking code`() {
        assertThat(TrackingCode.normalize(null)).isNull()
        assertThat(TrackingCode.normalize("")).isNull()
        assertThat(TrackingCode.normalize("2026-A7K3-9QXM")).isNull() // too short
        assertThat(TrackingCode.normalize("2026-A7K3-9QXM-2FHT-XXXX")).isNull() // too long
        assertThat(TrackingCode.normalize("ABCD-A7K3-9QXM-2FHT")).isNull() // year not numeric
        assertThat(TrackingCode.normalize("2026-A7K3-9QXM-2FHU")).isNull() // U is not in the alphabet
        // The old 37-char UUID-flavoured format must not resolve any more.
        assertThat(TrackingCode.normalize("0019fc13036ae-26818013-41ab-472d-aee8")).isNull()
    }

    @Test
    fun `generated codes survive a normalize round-trip`() {
        repeat(200) {
            val code = TrackingCode.generate()
            assertThat(TrackingCode.normalize(code)).isEqualTo(code)
            assertThat(TrackingCode.normalize(code.lowercase().replace("-", " "))).isEqualTo(code)
        }
    }
}
