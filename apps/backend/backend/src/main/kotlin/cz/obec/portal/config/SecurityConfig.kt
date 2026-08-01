package cz.obec.portal.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.invoke
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter
import org.springframework.security.web.SecurityFilterChain

/**
 * Bearer-JWT security for the admin API. Public (guest) endpoints stay open
 * (form catalog, submission create/lookup, confirmation/PDF, RÚIAN/Czech
 * POINT, health, OpenAPI); everything under the admin submissions path
 * (see [authorizeHttpRequests] below) requires the Keycloak realm role
 * `clerk` (T-06-01, T-06-02).
 */
@Configuration
@EnableMethodSecurity
class SecurityConfig {

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http {
            csrf { disable() }
            sessionManagement { sessionCreationPolicy = SessionCreationPolicy.STATELESS }
            authorizeHttpRequests {
                authorize("/api/admin/**", hasRole("CLERK"))
                authorize(anyRequest, permitAll)
            }
            oauth2ResourceServer {
                jwt {
                    jwtAuthenticationConverter = keycloakJwtAuthenticationConverter()
                }
            }
        }
        return http.build()
    }

    /**
     * Keycloak puts realm roles under the `realm_access.roles` claim rather
     * than the `scope`/`scp` claim Spring maps by default — translate them
     * into `ROLE_*` authorities (e.g. "clerk" -> ROLE_CLERK).
     */
    private fun keycloakJwtAuthenticationConverter(): JwtAuthenticationConverter {
        val defaultConverter = JwtGrantedAuthoritiesConverter()
        val converter = JwtAuthenticationConverter()
        converter.setJwtGrantedAuthoritiesConverter { jwt: Jwt ->
            val realmRoles = extractRealmRoles(jwt)
            defaultConverter.convert(jwt).orEmpty() + realmRoles
        }
        return converter
    }

    @Suppress("UNCHECKED_CAST")
    private fun extractRealmRoles(jwt: Jwt): List<GrantedAuthority> {
        val realmAccess = jwt.getClaim<Map<String, Any>>("realm_access") ?: return emptyList()
        val roles = realmAccess["roles"] as? Collection<String> ?: return emptyList()
        return roles.map { SimpleGrantedAuthority("ROLE_${it.uppercase()}") }
    }
}
