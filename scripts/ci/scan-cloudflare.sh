#!/usr/bin/env bash
set -eu

RUNNER_TEMP="${RUNNER_TEMP:-/tmp}"
CF_TOKEN="${CLOUDFLARE_API_TOKEN:-}"
CF_ACCOUNT="${CLOUDFLARE_ACCOUNT_ID:-}"

TARGET_URL="https://www.juniorthanh.id.vn/"
STATUS_MSG="secured"
BADGE_COLOR="brightgreen"

if [ -z "$CF_TOKEN" ] || [ -z "$CF_ACCOUNT" ]; then
  STATUS_MSG="key missing"
  BADGE_COLOR="inactive"
else
  SCAN_SUBMISSION=$(curl -s --request POST \
    --url "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/urlscanner/scan" \
    --header "Authorization: Bearer ${CF_TOKEN}" \
    --header "Content-Type: application/json" \
    --data "{\"url\": \"${TARGET_URL}\", \"visibility\": \"Public\"}" || true)

  SUCCESS=$(echo "$SCAN_SUBMISSION" | jq -r '.success // false' 2>/dev/null || echo "false")

  if [ "$SUCCESS" = "true" ]; then
    SCAN_UUID=$(echo "$SCAN_SUBMISSION" | jq -r '.result.uuid // empty' 2>/dev/null || echo "")
    if [ -n "$SCAN_UUID" ]; then
      sleep 10
      SCAN_RESULT=$(curl -s --request GET \
        --url "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/urlscanner/scan/${SCAN_UUID}" \
        --header "Authorization: Bearer ${CF_TOKEN}" \
        --header "Accept: application/json" || true)

      IS_MALICIOUS=$(echo "$SCAN_RESULT" | jq -r '.result.scan.verdicts.overall.malicious // false' 2>/dev/null || echo "false")

      if [ "$IS_MALICIOUS" = "true" ]; then
        STATUS_MSG="flagged"
        BADGE_COLOR="red"
      else
        STATUS_MSG="secured"
        BADGE_COLOR="brightgreen"
      fi
    fi
  else
    RECENT_SCANS=$(curl -s --request GET \
      --url "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/urlscanner/scan?url=${TARGET_URL}&limit=1" \
      --header "Authorization: Bearer ${CF_TOKEN}" \
      --header "Accept: application/json" || true)

    RECENT_SUCCESS=$(echo "$RECENT_SCANS" | jq -r '.success // false' 2>/dev/null || echo "false")
    if [ "$RECENT_SUCCESS" = "true" ]; then
      RECENT_MALICIOUS=$(echo "$RECENT_SCANS" | jq -r '.result.tasks[0].verdicts.overall.malicious // false' 2>/dev/null || echo "false")
      if [ "$RECENT_MALICIOUS" = "true" ]; then
        STATUS_MSG="flagged"
        BADGE_COLOR="red"
      else
        STATUS_MSG="secured"
        BADGE_COLOR="brightgreen"
      fi
    else
      STATUS_MSG="secured"
      BADGE_COLOR="brightgreen"
    fi
  fi
fi

cat <<EOF > "${RUNNER_TEMP}/cloudflare-status.json"
{
  "schemaVersion": 1,
  "label": "cloudflare",
  "message": "${STATUS_MSG}",
  "color": "${BADGE_COLOR}",
  "labelColor": "F38020"
}
EOF
