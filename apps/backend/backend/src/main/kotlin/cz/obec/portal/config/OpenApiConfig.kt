package cz.obec.portal.config

import io.swagger.v3.oas.models.Components
import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Info
import io.swagger.v3.oas.models.info.License
import io.swagger.v3.oas.models.security.SecurityRequirement
import io.swagger.v3.oas.models.security.SecurityScheme
import io.swagger.v3.oas.models.servers.Server
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class OpenApiConfig {

    @Bean
    fun openAPI(): OpenAPI {
        return OpenAPI()
            .info(Info()
                .title("Municipal Citizen Portal API")
                .version("1.0.0")
                .description("API pro občanský portál obce - agendy, platby, komunikace")
                .license(License().name("Proprietary").url("https://obec.cz/license"))
            )
            .servers(listOf(
                Server().url("http://localhost:8081").description("Development server"),
                Server().url("https://api.obec.cz").description("Production server")
            ))
            .components(Components()
                .addSecuritySchemes("bearerAuth", SecurityScheme()
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description("OIDC token from Keycloak (Phase 2+)"))
            )
            .addSecurityItem(SecurityRequirement().addList("bearerAuth"))
            .tags(
                io.swagger.v3.oas.models.tags.Tag().name("health").description("Health check endpoints"),
                io.swagger.v3.oas.models.tags.Tag().name("submissions").description("Guest submissions and forms"),
                io.swagger.v3.oas.models.tags.Tag().name("admin").description("Admin web endpoints")
            )
    }
}