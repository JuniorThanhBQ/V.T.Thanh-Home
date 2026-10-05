#!/usr/bin/env bash
set -euo pipefail

if ! command -v pre-commit >/dev/null 2>&1; then
  echo "Error: pre-commit is not installed."
  exit 1
fi

UPDATE_HOOKS=false
for arg in "$@"; do
  if [ "$arg" == "--update" ] || [ "$arg" == "-u" ]; then
    UPDATE_HOOKS=true
  fi
done

if [ "$UPDATE_HOOKS" = true ]; then
  pre-commit autoupdate
fi
pre-commit run --all-files
