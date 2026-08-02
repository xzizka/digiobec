package cz.obec.portal.submission.domain

import java.security.SecureRandom
import java.time.Instant
import java.time.ZoneId

/**
 * Public tracking code for a guest submission, in the form `YYYY-XXXX-XXXX-XXXX`
 * (e.g. `2026-A7K3-9QXM-2FHT`).
 *
 * This code is the ONLY thing protecting a guest submission: `GET /api/submissions/{code}`
 * returns the citizen's personal data with no authentication. It therefore has two hard
 * requirements that pull against each other:
 *
 *  * **Unguessable.** A sequential or date-derived number would let anyone enumerate every
 *    submission in the municipality. The 12 random characters carry 60 bits of entropy
 *    (32^12 ≈ 1.15e18), which keeps brute-force enumeration infeasible even without rate
 *    limiting — though rate limiting on the lookup endpoint is still tracked as a follow-up.
 *  * **Dictatable.** A citizen reads this off a PDF, types it into the tracking page, or
 *    reads it to a clerk over the phone. Seniors with low digital literacy are an explicit
 *    target group. Groups of four characters from an unambiguous alphabet are the point.
 *
 * The alphabet is Crockford Base32 — the digits plus uppercase letters, minus `I`, `L`, `O`
 * and `U`. `I`/`L` are dropped because they are misread as `1`, `O` because it is misread as
 * `0`, and `U` to avoid accidental profanity. [normalize] additionally *accepts* those
 * characters on input and folds them to the digit they resemble, so a citizen who writes
 * `O` where the code says `0` still finds their submission.
 *
 * The `YYYY` prefix is the submission year. It is not entropy — it is there so that codes
 * sort and file naturally, and so a clerk can tell at a glance which year a code belongs to
 * (relevant for retention periods). It is deliberately NOT derived from anything secret.
 */
object TrackingCode {

    /** Crockford Base32: no I, L, O, U. */
    private const val ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"

    private const val GROUP_SIZE = 4
    private const val RANDOM_GROUPS = 3
    private const val RANDOM_CHARS = GROUP_SIZE * RANDOM_GROUPS

    /** `YYYY` + 3 groups of 4, joined by hyphens. */
    const val LENGTH: Int = 4 + RANDOM_GROUPS * (1 + GROUP_SIZE)

    private val random = SecureRandom()

    /** Generates a new code for a submission created at [at] (defaults to now). */
    fun generate(at: Instant = Instant.now(), zone: ZoneId = ZoneId.of("Europe/Prague")): String {
        val year = at.atZone(zone).year
        val chars = CharArray(RANDOM_CHARS) { ALPHABET[random.nextInt(ALPHABET.length)] }
        val groups = (0 until RANDOM_GROUPS).joinToString("-") {
            String(chars, it * GROUP_SIZE, GROUP_SIZE)
        }
        return "$year-$groups"
    }

    /**
     * Folds user input to the canonical stored form, so lookups tolerate how people actually
     * type: lowercase, missing or extra hyphens, spaces, and the ambiguous characters the
     * alphabet excludes (`I`/`L` → `1`, `O` → `0`).
     *
     * Returns `null` when the input cannot be a tracking code at all, so callers can answer
     * 404 without touching the database.
     */
    fun normalize(input: String?): String? {
        if (input == null) return null
        val compact = buildString {
            for (raw in input.uppercase()) {
                when (raw) {
                    'I', 'L' -> append('1')
                    'O' -> append('0')
                    in '0'..'9', in 'A'..'Z' -> append(raw)
                    else -> Unit // drop hyphens, spaces, and anything else
                }
            }
        }
        if (compact.length != 4 + RANDOM_CHARS) return null
        val year = compact.substring(0, 4)
        if (!year.all { it.isDigit() }) return null
        val body = compact.substring(4)
        if (!body.all { it in ALPHABET }) return null
        val groups = (0 until RANDOM_GROUPS).joinToString("-") {
            body.substring(it * GROUP_SIZE, (it + 1) * GROUP_SIZE)
        }
        return "$year-$groups"
    }
}
