package cz.obec.portal.health

import org.springframework.boot.actuate.health.HealthEndpoint
import org.springframework.boot.info.BuildProperties
import org.springframework.boot.info.GitProperties
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import reactor.core.publisher.Mono

@RestController
@RequestMapping("/actuator/health", produces = [MediaType.APPLICATION_JSON_VALUE])
class HealthController(
    private val healthEndpoint: HealthEndpoint,
    private val buildProperties: BuildProperties?,
    private val gitProperties: GitProperties?,
) {

    @GetMapping
    fun health(): Mono<Map<String, Any>> {
        return Mono.fromCallable { healthEndpoint.health() }
            .map { health ->
                val components = mutableMapOf<String, Any>()
                health.components.forEach { (name, component) ->
                    components[name] = mapOf(
                        "status" to component.status.code,
                        "details" to component.details,
                    )
                }

                val result = mutableMapOf<String, Any>(
                    "status" to health.status.code,
                    "components" to components,
                )

                // Add build info
                buildProperties?.let {
                    result["build"] = mapOf(
                        "version" to it.version,
                        "artifact" to it.artifact,
                        "group" to it.group,
                        "time" to it.time.toString(),
                    )
                }

                // Add git info
                gitProperties?.let {
                    result["git"] = mapOf(
                        "commit" to it.get("commit.id.abbrev"),
                        "branch" to it.get("branch"),
                        "commitTime" to it.get("commit.time"),
                    )
                }

                // Add uptime
                val runtime = Runtime.getRuntime()
                result["uptime"] = mapOf(
                    "totalMemory" to runtime.totalMemory(),
                    "freeMemory" to runtime.freeMemory(),
                    "maxMemory" to runtime.maxMemory(),
                    "availableProcessors" to runtime.availableProcessors(),
                )

                result
            }
    }
}