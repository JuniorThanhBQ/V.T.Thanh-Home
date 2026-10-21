#!/usr/bin/env bash
set -euo pipefail

BACKEND_DIR="backend/V.T.Thanh-Home-SpringBoot"
FRONTEND_DIR="frontend/V.T.Thanh-Home-Angular"
if [ -d "$BACKEND_DIR" ]; then
  if [ -f "$BACKEND_DIR/gradlew" ] && (command -v java >/dev/null 2>&1 || [ -n "${JAVA_HOME:-}" ]); then
    chmod +x "$BACKEND_DIR/gradlew" 2>/dev/null || true
    (cd "$BACKEND_DIR" && ./gradlew spotlessCheck checkstyleMain --no-daemon)
  elif command -v cmd.exe >/dev/null 2>&1; then
    cmd.exe /c "cd $BACKEND_DIR && gradlew.bat spotlessCheck checkstyleMain --no-daemon"
  else
    chmod +x "$BACKEND_DIR/gradlew" 2>/dev/null || true
    (cd "$BACKEND_DIR" && ./gradlew spotlessCheck checkstyleMain --no-daemon)
  fi
else
  echo "  ✖ Error: ${BACKEND_DIR} not found."
  exit 1
fi

if [ -d "$FRONTEND_DIR" ]; then
  (
    cd "$FRONTEND_DIR"
    npx prettier --check "src/**/*.{ts,html,css,scss,json,md,yml,yaml}"
    npm run lint
  )
else
  echo "  ✖ Error: ${FRONTEND_DIR} not found."
  exit 1
fi
