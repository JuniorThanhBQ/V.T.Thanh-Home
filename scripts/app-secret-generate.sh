#!/usr/bin/env bash
set -euo pipefail

if [ -c /dev/urandom ]; then
  DB_PASSWORD=$(head -c 256 /dev/urandom | LC_ALL=C tr -dc 'A-Za-z0-9' | head -c 32 || true)
else
  DB_PASSWORD=$(openssl rand -hex 16)
fi

if command -v openssl >/dev/null 2>&1; then
  JWT_SECRET=$(openssl rand -base64 64 | tr -d '\r\n')
else
  JWT_SECRET=$(python -c "import secrets; print(secrets.token_urlsafe(64))")
fi

echo "POSTGRES_PASSWORD=${DB_PASSWORD}"
echo "JWT_SECRET_KEY=${JWT_SECRET}"
