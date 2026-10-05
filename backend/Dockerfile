ARG ESCLIPSE_TEMURIN_JDK_VERSION=25-jdk-noble
ARG ESCLIPSE_TEMURIN_JRE_VERSION=25-jre-noble

FROM eclipse-temurin:${ESCLIPSE_TEMURIN_JDK_VERSION} AS builder

WORKDIR /workspace

COPY backend/V.T.Thanh-Home-SpringBoot/gradlew \
     backend/V.T.Thanh-Home-SpringBoot/gradlew.bat \
     backend/V.T.Thanh-Home-SpringBoot/settings.gradle.kts \
     backend/V.T.Thanh-Home-SpringBoot/build.gradle.kts \
     backend/V.T.Thanh-Home-SpringBoot/gradle.lockfile* ./
COPY backend/V.T.Thanh-Home-SpringBoot/gradle ./gradle

RUN sed -i 's/\r$//' ./gradlew && chmod +x ./gradlew && ./gradlew dependencies --no-daemon

COPY backend/V.T.Thanh-Home-SpringBoot/src ./src
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
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=́̀́́80.0 -XX:+UseContainerSupport"

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["curl", "-f", "http://localhost:8080/actuator/health"]

ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
