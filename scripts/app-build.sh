#!/usr/bin/env bash
set -euo pipefail

BUILD_FRONTEND=true
BUILD_BACKEND=true
BUILD_DOCKER=false

for arg in "$@"; do
  case "$arg" in
    --frontend|-f)
      BUILD_FRONTEND=true
      BUILD_BACKEND=false
      ;;
    --backend|-b)
      BUILD_BACKEND=true
      BUILD_FRONTEND=false
      ;;
    --docker|-d)
      BUILD_DOCKER=true
      ;;
  esac
done

if [ "$BUILD_FRONTEND" = true ]; then
  FRONTEND_DIR="frontend/V.T.Thanh-Home-Angular"
  if [ -d "$FRONTEND_DIR" ]; then
    npm --prefix "$FRONTEND_DIR" run build
  else
    exit 1
  fi
fi

if [ "$BUILD_BACKEND" = true ]; then
  BACKEND_DIR="backend/V.T.Thanh-Home-SpringBoot"
  if [ -d "$BACKEND_DIR" ]; then
    if [ -f "$BACKEND_DIR/gradlew" ] && command -v bash >/dev/null 2>&1; then
      chmod +x "$BACKEND_DIR/gradlew" 2>/dev/null || true
      (cd "$BACKEND_DIR" && ./gradlew bootJar -x test --no-daemon)
    else
      cmd.exe /c "cd $BACKEND_DIR && gradlew.bat bootJar -x test --no-daemon"
    fi
  else
    echo "  ✖ Error: ${BACKEND_DIR} not found."
    exit 1
  fi
fi

if [ "$BUILD_DOCKER" = true ]; then
  docker build -t vtthanh-backend:latest -f backend/Dockerfile .
fi
