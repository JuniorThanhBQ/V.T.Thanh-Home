#!/usr/bin/env bash
set -euo pipefail

RUN_FRONTEND=true
RUN_BACKEND=true

for arg in "$@"; do
  case "$arg" in
    --frontend|-f)
      RUN_FRONTEND=true
      RUN_BACKEND=false
      ;;
    --backend|-b)
      RUN_BACKEND=true
      RUN_FRONTEND=false
      ;;
  esac
done

if [ "$RUN_BACKEND" = true ]; then
  BACKEND_DIR="backend/V.T.Thanh-Home-SpringBoot"
  if [ -d "$BACKEND_DIR" ]; then
    if [ -f "$BACKEND_DIR/gradlew" ] && (command -v java >/dev/null 2>&1 || [ -n "${JAVA_HOME:-}" ]); then
      chmod +x "$BACKEND_DIR/gradlew" 2>/dev/null || true
      (cd "$BACKEND_DIR" && ./gradlew test --no-daemon)
    elif command -v cmd.exe >/dev/null 2>&1; then
      cmd.exe /c "cd $BACKEND_DIR && gradlew.bat test --no-daemon"
    else
      chmod +x "$BACKEND_DIR/gradlew" 2>/dev/null || true
      (cd "$BACKEND_DIR" && ./gradlew test --no-daemon)
    fi
  else
    echo "  ✖ Error: ${BACKEND_DIR} not found."
    exit 1
  fi
fi

if [ "$RUN_FRONTEND" = true ]; then
  FRONTEND_DIR="frontend/V.T.Thanh-Home-Angular"
  if [ -d "$FRONTEND_DIR" ]; then
    npm --prefix "$FRONTEND_DIR" test
  else
    echo "  ✖ Error: ${FRONTEND_DIR} not found."
    exit 1
  fi
fi
