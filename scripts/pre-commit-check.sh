#!/usr/bin/env bash
set -euo pipefail

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
