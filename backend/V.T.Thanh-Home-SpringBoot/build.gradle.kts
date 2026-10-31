plugins {
	java
	id("org.springframework.boot") version "4.1.1"
	id("io.spring.dependency-management") version "1.1.7"
	id("com.diffplug.spotless") version "8.10.4"
	id("com.autonomousapps.dependency-analysis") version "3.19.2"
	checkstyle
}

checkstyle {
    toolVersion = "10.12.4"
	isIgnoreFailures = false
}

group = "com.vtthanh"
version = "1.0.2"

dependencyAnalysis {
    issues {
        all {
            onAny {
                severity("warn")
            }
        }
    }
}

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(25)
	}
}

repositories {
	mavenCentral()
}

extra["tomcat.version"] = "11.0.25"

dependencies {
	implementation("io.sentry:sentry-spring-boot-4-starter:8.61.1")
	implementation("org.springframework.boot:spring-boot-starter-actuator")
	implementation("org.springframework.boot:spring-boot-starter-data-jpa")
	implementation("org.springframework.boot:spring-boot-starter-webmvc")
	implementation("org.springframework.boot:spring-boot-starter-flyway")
	implementation("org.flywaydb:flyway-database-postgresql")
	implementation("org.springframework.boot:spring-boot-starter-security")
	developmentOnly("org.springframework.boot:spring-boot-devtools")
	runtimeOnly("org.postgresql:postgresql")
	testImplementation("org.springframework.boot:spring-boot-starter-actuator-test")
	testImplementation("org.springframework.boot:spring-boot-starter-security-test")
	testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

configurations.named("checkstyle") {
    exclude(group = "com.google.collections", module = "google-collections")
    resolutionStrategy.eachDependency {
        if (requested.group == "com.google.guava" && requested.name == "guava") {
            useVersion("33.7.2-jre")
            because("Remediates CVE-2026-102554 in the Checkstyle dependency graph")
        }
    }
}

configurations.all {
    resolutionStrategy.eachDependency {
        if (requested.group == "tools.jackson.core" || requested.group == "tools.jackson") {
            useVersion("3.1.7")
            because("Remediates CVE-2026-89407, CVE-2026-89425, CVE-2026-68497, CVE-2026-91776, and CVE-2026-91777")
        }
        if (requested.group == "commons-beanutils" && requested.name == "commons-beanutils") {
            useVersion("1.11.0")
            because("Remediates CVE-2025-48734")
        }
        if (requested.group == "org.codehaus.plexus" && requested.name == "plexus-utils") {
            useVersion("3.6.1")
            because("Remediates CVE-2025-67030")
        }
    }
}

dependencyLocking {
    lockAllConfigurations()
}

tasks.withType<Test> {
	useJUnitPlatform()
}

tasks.bootJar {
    archiveFileName.set("app.jar")
}

tasks.register("resolveProductionDependencies") {
    doLast {
        configurations.compileClasspath.get().resolve()
        configurations.runtimeClasspath.get().resolve()
    }
}

spotless {
	java {
		removeUnusedImports()
		trimTrailingWhitespace()
		endWithNewline()
	}
}
