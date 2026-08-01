package cz.obec.portal.health

import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.info.BuildProperties
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.Instant

@RestController
@RequestMapping("/api/health")
class HealthController(
    private val databaseHealthIndicator: DatabaseHealthIndicator,
    private val keycloakHealthIndicator: KeycloakHealthIndicator,
    private val buildProperties: BuildProperties
) {

    data class HealthResponse(
        val status: String,
        val version: String,
        val timestamp: String,
        val database: String,
        val keycloak: String
    )

    @GetMapping
    fun health(): ResponseEntity<HealthResponse> {
        val dbHealth = databaseHealthIndicator.health()
        val kcHealth = keycloakHealthIndicator.health()

        val overallStatus = if (dbHealth.status == org.springframework.boot.actuate.health.Status.UP &&
                kcHealth.status == org.springframework.boot.actuate.health.Status.UP) "UP" else "DOWN"

        return ResponseEntity.ok(HealthResponse(
            status = overallStatus,
            version = buildProperties.version,
            timestamp = Instant.now().toString(),
            database = dbHealth.status.name(),
            keycloak = kcHealth.status.name()
        ))
    }
}