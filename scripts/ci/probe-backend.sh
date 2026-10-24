#!/usr/bin/env bash
set -eu

RUNNER_TEMP="${RUNNER_TEMP:-/tmp}"
BACKEND_URL="${BACKEND_URL:-https://vtthanh-backend-latest.onrender.com/actuator/health}"
HTTP_STATUS_BACKEND=$(curl -s -L -o /dev/null -w "%{http_code}" --max-time 45 "$BACKEND_URL") || HTTP_STATUS_BACKEND="000"

if [ "$HTTP_STATUS_BACKEND" = "200" ]; then
  COLOR_BACKEND="brightgreen"
  MESSAGE_BACKEND="200 OK"
elif [ "$HTTP_STATUS_BACKEND" -ge 300 ] 2>/dev/null && [ "$HTTP_STATUS_BACKEND" -lt 400 ] 2>/dev/null; then
  COLOR_BACKEND="yellow"
  MESSAGE_BACKEND="${HTTP_STATUS_BACKEND} Redirect"
elif [ "$HTTP_STATUS_BACKEND" = "000" ]; then
  COLOR_BACKEND="red"
  MESSAGE_BACKEND="Unreachable"
else
  COLOR_BACKEND="red"
  MESSAGE_BACKEND="${HTTP_STATUS_BACKEND} Error"
fi

cat <<EOF > "${RUNNER_TEMP}/backend-status.json"
{
  "schemaVersion": 1,
  "label": "backend",
  "message": "${MESSAGE_BACKEND}",
  "color": "${COLOR_BACKEND}"
}
EOF
