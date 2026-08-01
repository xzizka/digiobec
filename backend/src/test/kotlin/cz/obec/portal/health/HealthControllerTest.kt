package cz.obec.portal.health

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.springframework.test.web.reactive.server.WebTestClient
import org.testcontainers.containers.GenericContainer
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import org.testcontainers.utility.DockerImageName

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient
class HealthControllerTest {

    @Container
    @JvmStatic
    val postgres: PostgreSQLContainer<*> = PostgreSQLContainer(DockerImageName.parse("postgres:16-alpine"))
        .withDatabaseName("obec_portal")
        .withUsername("portal")
        .withPassword("portal")

    @Container
    @JvmStatic
    val keycloak: GenericContainer<*> = GenericContainer(DockerImageName.parse("quay.io/keycloak/keycloak:26.0.0"))
        .withExposedPorts(8080)
        .withEnv("KC_BOOTSTRAP_ADMIN_USERNAME", "admin")
        .withEnv("KC_BOOTSTRAP_ADMIN_PASSWORD", "admin")
        .withEnv("KC_HEALTH_ENABLED", "true")
        .withEnv("KC_METRICS_ENABLED", "true")
        .withCommand("start-dev --import-realm --http-port=8080")
        .waitingFor(org.testcontainers.containers.wait.strategy.HttpWaitStrategy()
            .forPort(8080)
            .forPath("/health/ready")
            .forStatusCode(200))

    @Autowired
    lateinit var webTestClient: WebTestClient

    @DynamicPropertySource
    @JvmStatic
    fun dynamicProperties(registry: DynamicPropertyRegistry) {
        registry.add("spring.r2dbc.url") { "r2dbc:postgresql://${postgres.host}:${postgres.firstMappedPort}/${postgres.databaseName}" }
        registry.add("spring.r2dbc.username") { postgres.username }
        registry.add("spring.r2dbc.password") { postgres.password }
        registry.add("spring.liquibase.enabled") { "false" }
        registry.add("keycloak.issuer-uri") { "http://${keycloak.host}:${keycloak.firstMappedPort}/realms/obec" }
        registry.add("spring.security.oauth2.resourceserver.jwt.issuer-uri") { "http://${keycloak.host}:${keycloak.firstMappedPort}/realms/obec" }
    }

    @Test
    fun `health endpoint returns UP with db and keycloak components`() {
        webTestClient.get()
            .uri("/actuator/health")
            .accept(MediaType.APPLICATION_JSON)
            .exchange()
            .expectStatus().isOk
            .expectBody()
            .jsonPath("$.status").isEqualTo("UP")
            .jsonPath("$.components.db.status").isEqualTo("UP")
            .jsonPath("$.components.keycloak.status").isEqualTo("UP")
    }

    @Test
    fun `health endpoint includes build and git info`() {
        webTestClient.get()
            .uri("/actuator/health")
            .accept(MediaType.APPLICATION_JSON)
            .exchange()
            .expectStatus().isOk
            .expectBody()
            .jsonPath("$.build").exists()
            .jsonPath("$.git").exists()
            .jsonPath("$.uptime").exists()
    }
}