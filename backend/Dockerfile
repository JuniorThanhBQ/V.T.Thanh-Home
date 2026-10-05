ARG ESCLIPSE_TEMURIN_JDK_VERSION=26-jdk-noble@sha256:3c5ccd0bde683b3d760127a75189c0d9ad7b80de53ebb184ef3e525dd44c2c94
ARG ESCLIPSE_TEMURIN_JRE_VERSION=26-jre-noble@sha256:3ed5e2e03c80f8a4901f81ef30e7becd19012e32ab6e036b255ee52fdcabac30

FROM eclipse-temurin:${ESCLIPSE_TEMURIN_JDK_VERSION} AS builder

WORKDIR /workspace

COPY gradlew gradlew.bat settings.gradle.kts build.gradle.kts ./
COPY gradle ./gradle

RUN chmod +x ./gradlew && ./gradlew dependencies --no-daemon

COPY src ./src
RUN ./gradlew bootJar -x test --no-daemon

WORKDIR /workspace/extracted
RUN java -Djarmode=tools -jar /workspace/build/libs/*.jar extract --layers --launcher || \
    java -Djarmode=layertools -jar /workspace/build/libs/*.jar extract


FROM eclipse-temurin:${ESCLIPSE_TEMURIN_JRE_VERSION} AS runtime

WORKDIR /application
# hadolint ignore=DL3008
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
RUN groupadd --gid 1001 spring && \
    useradd --uid 1001 --gid 1001 --no-create-home --shell /bin/false spring

COPY --from=builder /workspace/extracted/dependencies/ ./
COPY --from=builder /workspace/extracted/spring-boot-loader/ ./
COPY --from=builder /workspace/extracted/snapshot-dependencies/ ./
COPY --from=builder /workspace/extracted/application/ ./

RUN chown -R 1001:1001 /application
USER 1001:1001

EXPOSE 8080
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75.0 -XX:+UseContainerSupport"
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["curl", "-f", "http://localhost:8080/actuator/health"]

ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
