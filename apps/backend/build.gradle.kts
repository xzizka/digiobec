plugins {
    id("org.springframework.boot") version "3.3.2" apply false
    id("io.spring.dependency-management") version "1.1.6" apply false
    id("org.jetbrains.kotlin.jvm") version "1.9.24" apply false
    id("org.jetbrains.kotlin.plugin.spring") version "1.9.24" apply false
    // Generates a synthetic no-arg constructor for @Entity/@Embeddable/@MappedSuperclass
    // classes. Without this, Kotlin never exposes a no-arg constructor for entities like
    // Submission (data class with non-default-valued properties), and Hibernate 6's
    // EntityInstantiatorPojoStandard fails on every row it tries to materialize with
    // "No default constructor for entity" - i.e. every SELECT that returns >=1 row.
    id("org.jetbrains.kotlin.plugin.jpa") version "1.9.24" apply false
}

group = "cz.obec.portal"
version = "1.0.0-SNAPSHOT"

repositories {
    mavenCentral()
    maven { url = uri("https://repo.spring.io/milestone") }
    maven { url = uri("https://repo.spring.io/snapshot") }
}