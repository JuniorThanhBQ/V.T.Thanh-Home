#!/usr/bin/env bash
set -euo pipefail

export MSYS_NO_PATHCONV=1
TRIVY_VERSION="${TRIVY_VERSION:-latest@sha256:2416d1f74045b57274df1a340eee6b510cacd73c66a6ccb8da092b117eb7d222}"
SEMGREP_VERSION="${SEMGREP_VERSION:-latest@sha256:529ee8a277ec8adc5b534d7c74eea0a47e9de21d62852b6ba7ac6ba9566845c3}"
ZAP_VERSION="${ZAP_VERSION:-latest@sha256:5ccfff9a411743ab2615136a2edd7416bec9ce41572fa94e935df38c14adb2b6}"

npm --prefix frontend/V.T.Thanh-Home-Angular audit --audit-level=high || {
  echo "Warning: High or critical vulnerabilities detected in frontend dependencies."
}

if command -v trivy >/dev/null 2>&1; then
  trivy fs --scanners vuln,misconfig --severity HIGH,CRITICAL backend/
elif command -v docker >/dev/null 2>&1; then
  docker run --rm -v "$(pwd):/project:ro" \
    "aquasec/trivy:${TRIVY_VERSION}" fs --scanners vuln,misconfig --severity HIGH,CRITICAL /project/backend
else
  echo "Notice: Trivy CLI or Docker not found."
fi

if command -v semgrep >/dev/null 2>&1; then
  semgrep scan --config auto --error backend/ frontend/
elif command -v docker >/dev/null 2>&1; then
  docker run --rm -v "$(pwd):/src:ro" \
    "semgrep/semgrep:${SEMGREP_VERSION}" semgrep scan --config auto --error backend/ frontend/
else
  echo "Notice: Semgrep CLI or Docker not found."
fi

TARGET_PORT="${TARGET_PORT:-${SERVER_PORT:-4200}}"
LOCAL_URL="http://localhost:${TARGET_PORT}"
if curl -s -f -o /dev/null --connect-timeout 2 "${LOCAL_URL}/actuator/health" 2>/dev/null || \
   curl -s -f -o /dev/null --connect-timeout 2 "${LOCAL_URL}" 2>/dev/null; then
  ZAP_TARGET_URL="http://host.docker.internal:${TARGET_PORT}"
  EXTRA_DOCKER_ARGS=()
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    EXTRA_DOCKER_ARGS+=(--add-host=host.docker.internal:host-gateway)
  fi
  mkdir -p backend/reports/zap
  set +e
  docker run --rm \
    "${EXTRA_DOCKER_ARGS[@]}" \
    -v "$(pwd)/backend/reports/zap:/zap/wrk/:rw" \
    "ghcr.io/zaproxy/zaproxy:${ZAP_VERSION}" \
    zap-baseline.py \
      -t "${ZAP_TARGET_URL}" \
      -r "zap-baseline-report.html" \
      -I
  ZAP_EXIT_CODE=$?
  set -e
  if [ $ZAP_EXIT_CODE -eq 0 ]; then
    echo "DAST scan completed: Zero security issues detected."
  elif [ $ZAP_EXIT_CODE -eq 1 ]; then
    echo "DAST scan completed: Minor warnings detected. Review backend/reports/zap/zap-baseline-report.html"
  else
    echo "DAST scan completed with exit code ${ZAP_EXIT_CODE}. Review backend/reports/zap/zap-baseline-report.html"
  fi
else
  echo "Notice: Backend is not running at ${LOCAL_URL}."
fi
