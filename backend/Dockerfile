ARG TEMURIN_JDK_VERSION=25-jdk-noble@sha256:7247bd8d2aeec64efe908dc72396d88101417d24ce3642703728382d96afb965
ARG TEMURIN_JRE_VERSION=25-jre-noble@sha256:2ef7a81085e0502d7d4ff7e7c0257b6d4f46433f8ea6021180aa3c8a2b9ca3ec

FROM eclipse-temurin:${TEMURIN_JDK_VERSION} AS builder

WORKDIR /workspace

COPY backend/V.T.Thanh-Home-SpringBoot/gradlew \
     backend/V.T.Thanh-Home-SpringBoot/gradlew.bat \
     backend/V.T.Thanh-Home-SpringBoot/settings.gradle.kts \
     backend/V.T.Thanh-Home-SpringBoot/build.gradle.kts \
     backend/V.T.Thanh-Home-SpringBoot/gradle.lockfile* ./
COPY backend/V.T.Thanh-Home-SpringBoot/gradle ./gradle

RUN sed -i 's/\r$//' ./gradlew && chmod +x ./gradlew && ./gradlew resolveProductionDependencies --no-daemon

COPY backend/V.T.Thanh-Home-SpringBoot/src/main ./src/main
RUN ./gradlew bootJar -x test --no-daemon

WORKDIR /workspace/extracted
RUN java -Djarmode=tools -jar /workspace/build/libs/app.jar extract --layers --destination .

FROM eclipse-temurin:${TEMURIN_JRE_VERSION} AS runtime

WORKDIR /application

# hadolint ignore=DL3008
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd --gid 1001 spring && \
    useradd --uid 1001 --gid 1001 --no-create-home --shell /bin/false spring

COPY --from=builder --chown=1001:1001 /workspace/extracted/dependencies/ ./
COPY --from=builder --chown=1001:1001 /workspace/extracted/spring-boot-loader/ ./
COPY --from=builder --chown=1001:1001 /workspace/extracted/snapshot-dependencies/ ./
COPY --from=builder --chown=1001:1001 /workspace/extracted/application/ ./

USER 1001:1001

EXPOSE 8080
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=70.0 -XX:TieredStopAtLevel=1"

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["sh", "-c", "curl -fsS --max-time 3 http://127.0.0.1:${PORT:-${SERVER_PORT:-8080}}/actuator/health"]

ENTRYPOINT ["sh", "-c", "export SERVER_PORT=\"${PORT:-${SERVER_PORT:-8080}}\"; exec java -jar app.jar \"$@\"", "--"]
