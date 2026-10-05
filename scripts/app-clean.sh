#!/usr/bin/env bash
set -euo pipefail

DEEP_CLEAN=false
for arg in "$@"; do
  if [ "$arg" == "--all" ] || [ "$arg" == "-a" ]; then
    DEEP_CLEAN=true
  fi
done

BACKEND_DIR="backend/V.T.Thanh-Home-SpringBoot"
if [ -d "$BACKEND_DIR" ]; then
  if [ -f "$BACKEND_DIR/gradlew" ]; then
    (cd "$BACKEND_DIR" && ./gradlew clean --no-daemon 2>/dev/null || true)
  fi

  rm -rf "$BACKEND_DIR/.gradle"
  rm -rf "$BACKEND_DIR/out"
  rm -rf "$BACKEND_DIR/build"
fi

FRONTEND_DIR="frontend/V.T.Thanh-Home-Angular"
if [ -d "$FRONTEND_DIR" ]; then
  rm -rf "$FRONTEND_DIR/dist"
  rm -rf "$FRONTEND_DIR/.angular/cache"
  rm -rf "$FRONTEND_DIR/.vite"
  rm -rf "$FRONTEND_DIR/coverage"

  if [ "$DEEP_CLEAN" = true ]; then
    rm -rf "$FRONTEND_DIR/node_modules"
  fi
fi

find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true
find . -type f -name "*.pyo" -delete 2>/dev/null || true

if [ "$DEEP_CLEAN" = true ] && [ -d ".venv" ]; then
  rm -rf .venv
fi

rm -rf reports/zap
rm -rf backend/reports
find . -type f -name "Thumbs.db" -delete 2>/dev/null || true
