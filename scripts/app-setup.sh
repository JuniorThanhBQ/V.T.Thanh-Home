#!/usr/bin/env bash
set -euo pipefail

check_tool() {
  local name="$1"
  local cmd="$2"
  if command -v "$cmd" >/dev/null 2>&1; then
    echo "$name is installed."
  else
    echo "Error: $name ($cmd) is missing. Please install it before continuing."
    exit 1
  fi
}

check_tool "Java JDK" "java"
check_tool "Node.js" "node"
check_tool "npm" "npm"
check_tool "Docker" "docker"
check_tool "Git" "git"

JAVA_VER=$(java -version 2>&1 | head -n 1 | awk -F '"' '{print $2}')
echo "  ℹ Active Java Version: $JAVA_VER"


if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
  else
    touch .env
  fi

  if [ -f "scripts/app-secret-generate.sh" ]; then
    bash scripts/app-secret-generate.sh
  fi
fi

if [ -d "frontend/V.T.Thanh-Home-Angular" ]; then
  npm --prefix frontend/V.T.Thanh-Home-Angular install
else
  echo "Error: frontend/V.T.Thanh-Home-Angular directory not found."
  exit 1
fi

chmod +x backend/V.T.Thanh-Home-SpringBoot/gradlew 2>/dev/null || true

if command -v pre-commit >/dev/null 2>&1; then
  pre-commit install
else
  echo "Notice: 'pre-commit' not found. Please run uv sync --all-packages"
fi
