package cz.obec.portal

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.ExchangeStrategies

@SpringBootApplication
class ObecPortalApplication

fun main(args: Array<String>) {
    runApplication<ObecPortalApplication>(*args)
}

@Configuration
class WebClientConfig {

    @Bean
    fun webClient(): WebClient {
        return WebClient.builder()
            .exchangeStrategies(ExchangeStrategies.builder()
                .codecs { it.defaultCodecs().maxInMemorySize(1024 * 1024) }
                .build())
            .build()
    }
}