#!/usr/bin/env bash
set -euo pipefail

BACKEND_DIR="backend/V.T.Thanh-Home-SpringBoot"

if [ ! -d "$BACKEND_DIR" ]; then
  echo "Error: Backend directory '$BACKEND_DIR' not found."
  exit 1
fi

cd "$BACKEND_DIR"
if [ -f "./gradlew" ] && (command -v java >/dev/null 2>&1 || [ -n "${JAVA_HOME:-}" ]); then
  chmod +x ./gradlew 2>/dev/null || true
  ./gradlew dependencies --write-locks --no-daemon
elif command -v cmd.exe >/dev/null 2>&1; then
  cmd.exe /c "gradlew.bat dependencies --write-locks --no-daemon"
else
  chmod +x ./gradlew 2>/dev/null || true
  ./gradlew dependencies --write-locks --no-daemon
fi
