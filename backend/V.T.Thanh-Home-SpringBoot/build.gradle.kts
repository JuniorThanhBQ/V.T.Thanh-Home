plugins {
	java
	id("org.springframework.boot") version "4.1.1"
	id("io.spring.dependency-management") version "1.1.7"
	id("com.diffplug.spotless") version "8.10.3"
	checkstyle
}

checkstyle {
    toolVersion = "10.12.4"
	isIgnoreFailures = false
}


group = "com.vtthanh"
version = "0.0.1-SNAPSHOT"

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
	implementation("org.springframework.boot:spring-boot-starter-actuator")
	implementation("org.springframework.boot:spring-boot-starter-data-jpa")
	implementation("org.springframework.boot:spring-boot-starter-webmvc")
	developmentOnly("org.springframework.boot:spring-boot-devtools")
	runtimeOnly("org.postgresql:postgresql")
	testImplementation("org.springframework.boot:spring-boot-starter-actuator-test")
	testImplementation("org.springframework.boot:spring-boot-starter-data-jpa-test")
	testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
	testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

configurations.all {
    resolutionStrategy.eachDependency {
        if (requested.group == "tools.jackson.core" || requested.group == "tools.jackson") {
            useVersion("3.1.7")
            because("Remediates CVE-2026-89407, CVE-2026-89425, CVE-2026-68497, CVE-2026-91776, and CVE-2026-91777")
        }
    }
}

dependencyLocking {
    lockAllConfigurations()
}

tasks.withType<Test> {
	useJUnitPlatform()
}

spotless {
	java {
		removeUnusedImports()
		trimTrailingWhitespace()
		endWithNewline()
	}
}
