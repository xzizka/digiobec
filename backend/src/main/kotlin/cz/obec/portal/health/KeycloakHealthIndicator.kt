package cz.obec.portal.health

import org.springframework.boot.actuate.health.Health
import org.springframework.boot.actuate.health.ReactiveHealthIndicator
import org.springframework.stereotype.Component
import org.springframework.web.reactive.function.client.WebClient
import reactor.core.publisher.Mono
import java.time.Duration

@Component
class KeycloakHealthIndicator(
    private val webClient: WebClient,
) : ReactiveHealthIndicator {

    override fun health(): Mono<Health> {
        val issuerUri = System.getenv("KEYCLOAK_ISSUER_URI") ?: "http://keycloak:8080/realms/obec"
        val wellKnownUrl = "$issuerUri/.well-known/openid-configuration"

        return webClient.get()
            .uri(wellKnownUrl)
            .retrieve()
            .toEntity(String::class.java)
            .timeout(Duration.ofSeconds(5))
            .map { response ->
                if (response.statusCode.is2xxSuccessful) {
                    Health.up()
                        .withDetail("keycloak", "Available")
                        .withDetail("issuer", issuerUri)
                        .build()
                } else {
                    Health.down()
                        .withDetail("keycloak", "Unavailable")
                        .withDetail("status", response.statusCode.value())
                        .build()
                }
            }
            .onErrorResume { ex ->
                Mono.just(Health.down(ex)
                    .withDetail("keycloak", "Unavailable")
                    .withDetail("error", ex.message)
                    .withDetail("issuer", issuerUri)
                    .build())
            }
    }
}