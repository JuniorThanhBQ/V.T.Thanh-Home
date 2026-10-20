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

FRONTEND_PORT="${FRONTEND_PORT:-4200}"
BACKEND_PORT="${BACKEND_PORT:-${SERVER_PORT:-8080}}"
ZAP_HOST_INTERNAL="${ZAP_HOST_INTERNAL:-host.docker.internal}"

EXTRA_DOCKER_ARGS=()
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
  EXTRA_DOCKER_ARGS+=(--add-host=host.docker.internal:host-gateway)
fi

mkdir -p reports/zap
mkdir -p backend/reports/zap

if curl -s -f -o /dev/null --connect-timeout 2 "http://localhost:${FRONTEND_PORT}/" 2>/dev/null; then
  echo "Starting OWASP ZAP DAST scan for Angular Frontend (http://localhost:${FRONTEND_PORT})..."
  set +e
  docker run --rm \
    "${EXTRA_DOCKER_ARGS[@]}" \
    -e ZAP_TARGET_TYPE="frontend" \
    -v "$(pwd)/reports/zap:/zap/wrk/:rw" \
    -v "$(pwd)/scripts/zap-hooks.py:/zap/zap-hooks.py:ro" \
    "ghcr.io/zaproxy/zaproxy:${ZAP_VERSION}" \
    zap-baseline.py \
      -t "http://${ZAP_HOST_INTERNAL}:${FRONTEND_PORT}" \
      --hook /zap/zap-hooks.py \
      -r "zap-frontend-report.html" \
      -J "zap-frontend-report.json" \
      -j
  ZAP_FE_EXIT=$?
  set -e
  cp -f reports/zap/zap-frontend-report.html backend/reports/zap/ 2>/dev/null || true
  if [ $ZAP_FE_EXIT -eq 0 ]; then
    echo "Frontend DAST scan completed: No FAIL or WARN alerts in the scanned scope."
  elif [ $ZAP_FE_EXIT -eq 1 ]; then
    echo "Frontend DAST scan found FAIL alerts. Review reports/zap/zap-frontend-report.html"
  elif [ $ZAP_FE_EXIT -eq 2 ]; then
    echo "Frontend DAST scan completed with WARN alerts. Review reports/zap/zap-frontend-report.html"
  else
    echo "Frontend DAST scan exited with code ${ZAP_FE_EXIT}. Review reports/zap/zap-frontend-report.html"
  fi
else
  echo "Notice: Frontend is not running at http://localhost:${FRONTEND_PORT}. Skipping frontend ZAP scan."
fi

if curl -s -f -o /dev/null --connect-timeout 2 "http://localhost:${BACKEND_PORT}/actuator/health" 2>/dev/null || \
   curl -s -f -o /dev/null --connect-timeout 2 "http://localhost:${BACKEND_PORT}/" 2>/dev/null; then
  echo "Starting OWASP ZAP DAST scan for Spring Boot Backend API (http://localhost:${BACKEND_PORT})..."
  set +e
  docker run --rm \
    "${EXTRA_DOCKER_ARGS[@]}" \
    -e ZAP_TARGET_TYPE="backend" \
    -v "$(pwd)/reports/zap:/zap/wrk/:rw" \
    -v "$(pwd)/scripts/zap-hooks.py:/zap/zap-hooks.py:ro" \
    "ghcr.io/zaproxy/zaproxy:${ZAP_VERSION}" \
    zap-baseline.py \
      -t "http://${ZAP_HOST_INTERNAL}:${BACKEND_PORT}" \
      --hook /zap/zap-hooks.py \
      -r "zap-backend-report.html" \
      -J "zap-backend-report.json"
  ZAP_BE_EXIT=$?
  set -e
  cp -f reports/zap/zap-backend-report.html backend/reports/zap/ 2>/dev/null || true
  if [ $ZAP_BE_EXIT -eq 0 ]; then
    echo "Backend DAST scan completed: No FAIL or WARN alerts in the scanned scope."
  elif [ $ZAP_BE_EXIT -eq 1 ]; then
    echo "Backend DAST scan found FAIL alerts. Review reports/zap/zap-backend-report.html"
  elif [ $ZAP_BE_EXIT -eq 2 ]; then
    echo "Backend DAST scan completed with WARN alerts. Review reports/zap/zap-backend-report.html"
  else
    echo "Backend DAST scan exited with code ${ZAP_BE_EXIT}. Review reports/zap/zap-backend-report.html"
  fi
else
  echo "Notice: Backend is not running at http://localhost:${BACKEND_PORT}. Skipping backend ZAP scan."
fi
