#!/usr/bin/env bash
set -eu

RUNNER_TEMP="${RUNNER_TEMP:-/tmp}"
TARGET_URL="${TARGET_URL:-https://www.juniorthanh.id.vn/}"
HTTP_STATUS=$(curl -s -L -o /dev/null -w "%{http_code}" --max-time 15 "$TARGET_URL") || HTTP_STATUS="000"

if [ "$HTTP_STATUS" = "200" ]; then
  COLOR="brightgreen"
  MESSAGE="200 OK"
elif [ "$HTTP_STATUS" -ge 300 ] 2>/dev/null && [ "$HTTP_STATUS" -lt 400 ] 2>/dev/null; then
  COLOR="yellow"
  MESSAGE="${HTTP_STATUS} Redirect"
elif [ "$HTTP_STATUS" = "000" ]; then
  COLOR="red"
  MESSAGE="Unreachable"
else
  COLOR="red"
  MESSAGE="${HTTP_STATUS} Error"
fi

cat <<EOF > "${RUNNER_TEMP}/status.json"
{
  "schemaVersion": 1,
  "label": "website",
  "message": "${MESSAGE}",
  "color": "${COLOR}"
}
EOF
