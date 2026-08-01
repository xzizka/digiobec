package cz.obec.portal.health

import io.r2dbc.spi.ConnectionFactory
import org.springframework.boot.actuate.health.Health
import org.springframework.boot.actuate.health.ReactiveHealthIndicator
import org.springframework.stereotype.Component
import reactor.core.publisher.Mono

@Component
class DatabaseHealthIndicator(
    private val connectionFactory: ConnectionFactory,
) : ReactiveHealthIndicator {

    override fun health(): Mono<Health> {
        return connectionFactory.create()
            .flatMap { connection ->
                connection.createStatement("SELECT 1")
                    .execute()
                    .flatMap { result ->
                        result.map { row, _ -> row.get(0, Int::class.java) }
                            .single()
                            .then(Mono.just(connection))
                    }
                    .doFinally { connection.close() }
            }
            .map { Health.up().withDetail("database", "PostgreSQL").build() }
            .onErrorResume { ex ->
                Mono.just(Health.down(ex)
                    .withDetail("database", "PostgreSQL")
                    .withDetail("error", ex.message)
                    .build())
            }
    }
}