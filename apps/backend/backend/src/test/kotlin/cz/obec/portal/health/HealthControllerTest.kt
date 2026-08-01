package cz.obec.portal.health

import io.kotest.assertions.matchers.shouldBe
import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.should
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.boot.info.BuildProperties
import org.springframework.boot.actuate.health.Health
import org.springframework.boot.actuate.health.Status
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import org.mockito.Mockito.`when`
import org.springframework.http.MediaType

@WebMvcTest(HealthController::class)
@TestPropertySource(properties = ["spring.liquibase.enabled=false"])
class HealthControllerTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @MockBean
    private lateinit var databaseHealthIndicator: DatabaseHealthIndicator

    @MockBean
    private lateinit var keycloakHealthIndicator: KeycloakHealthIndicator

    @MockBean
    private lateinit var buildProperties: BuildProperties

    @Test
    fun `GET /api/health returns UP when all dependencies are healthy`() {
        `when`(buildProperties.version).thenReturn("1.0.0-SNAPSHOT")
        `when`(databaseHealthIndicator.health()).thenReturn(Health.up().build())
        `when`(keycloakHealthIndicator.health()).thenReturn(Health.up().build())

        mockMvc.perform(get("/api/health").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.status").value("UP"))
            .andExpect(jsonPath("$.version").value("1.0.0-SNAPSHOT"))
            .andExpect(jsonPath("$.database").value("UP"))
            .andExpect(jsonPath("$.keycloak").value("UP"))
    }

    @Test
    fun `GET /api/health returns DOWN when database is down`() {
        `when`(buildProperties.version).thenReturn("1.0.0-SNAPSHOT")
        `when`(databaseHealthIndicator.health()).thenReturn(Health.down().build())
        `when`(keycloakHealthIndicator.health()).thenReturn(Health.up().build())

        mockMvc.perform(get("/api/health").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.status").value("DOWN"))
            .andExpect(jsonPath("$.database").value("DOWN"))
            .andExpect(jsonPath("$.keycloak").value("UP"))
    }

    @Test
    fun `GET /api/health returns DOWN when keycloak is down`() {
        `when`(buildProperties.version).thenReturn("1.0.0-SNAPSHOT")
        `when`(databaseHealthIndicator.health()).thenReturn(Health.up().build())
        `when`(keycloakHealthIndicator.health()).thenReturn(Health.down().build())

        mockMvc.perform(get("/api/health").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.status").value("DOWN"))
            .andExpect(jsonPath("$.database").value("UP"))
            .andExpect(jsonPath("$.keycloak").value("DOWN"))
    }
}