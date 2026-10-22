#!/usr/bin/env bash
set -eu

RUNNER_TEMP="${RUNNER_TEMP:-/tmp}"
REPO="${GITHUB_REPO:-${GITHUB_REPOSITORY}}"
TOKEN="${GITHUB_TOKEN}"

git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"

git fetch origin badges:badges 2>/dev/null || true
git checkout --orphan badges 2>/dev/null || git checkout badges
git rm -rf . >/dev/null 2>&1 || true

cp "${RUNNER_TEMP}/status.json" status.json
cp "${RUNNER_TEMP}/backend-status.json" backend-status.json
cp "${RUNNER_TEMP}/security-status.json" security-status.json
cp "${RUNNER_TEMP}/cloudflare-status.json" cloudflare-status.json

git add status.json backend-status.json security-status.json cloudflare-status.json
git commit -m "chore(uptime): update status badges [skip ci]" || exit 0
git push "https://x-access-token:${TOKEN}@github.com/${REPO}.git" badges --force
