package cz.obec.portal.health

import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.actuate.health.Health
import org.springframework.boot.actuate.health.HealthIndicator
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

@Component
class DatabaseHealthIndicator(
    private val jdbcTemplate: JdbcTemplate
) : HealthIndicator {

    override fun health(): Health {
        return try {
            jdbcTemplate.queryForObject("SELECT 1", Int::class.java)
            Health.up()
                .withDetail("database", "PostgreSQL")
                .withDetail("status", "UP")
                .build()
        } catch (e: Exception) {
            Health.down()
                .withDetail("database", "PostgreSQL")
                .withDetail("status", "DOWN")
                .withException(e)
                .build()
        }
    }
}