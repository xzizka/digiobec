package cz.obec.portal.health

import org.springframework.boot.actuate.health.Health
import org.springframework.boot.actuate.health.HealthIndicator
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import java.time.Duration

@Component
class KeycloakHealthIndicator : HealthIndicator {

    private val client = RestClient.create()

    override fun health(): Health {
        return try {
            val response = client.get()
                .uri("http://localhost:8080/health/ready")
                .retrieve()
                .toEntity(String::class.java)
            if (response.statusCode.is2xxSuccessful) {
                Health.up()
                    .withDetail("keycloak", "Identity Provider")
                    .withDetail("status", "UP")
                    .build()
            } else {
                Health.down()
                    .withDetail("keycloak", "Identity Provider")
                    .withDetail("status", "DOWN")
                    .withDetail("httpStatus", response.statusCode.value())
                    .build()
            }
        } catch (e: Exception) {
            Health.down()
                .withDetail("keycloak", "Identity Provider")
                .withDetail("status", "DOWN")
                .withException(e)
                .build()
        }
    }
}