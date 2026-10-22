#!/usr/bin/env bash
set -eu

RUNNER_TEMP="${RUNNER_TEMP:-/tmp}"
VIRUS_TOTAL_KEY="${VIRUS_TOTAL_KEY:-}"

TARGETS=("https://vtthanh-home-angular.vercel.app/" "https://www.juniorthanh.id.vn/")
STATUS_MSG="safe"
BADGE_COLOR="brightgreen"

if [ -z "$VIRUS_TOTAL_KEY" ]; then
  STATUS_MSG="key missing"
  BADGE_COLOR="inactive"
else
  for URL in "${TARGETS[@]}"; do
    URL_ID=$(python3 -c "import base64, sys; print(base64.urlsafe_b64encode(sys.argv[1].encode()).decode().rstrip('='))" "$URL")
    RESPONSE=$(curl -s --request GET \
      --url "https://www.virustotal.com/api/v3/urls/${URL_ID}" \
      --header "x-apikey: ${VIRUS_TOTAL_KEY}" \
      --header "accept: application/json")

    MALICIOUS=$(echo "$RESPONSE" | jq -r '.data.attributes.last_analysis_stats.malicious // -1')
    SUSPICIOUS=$(echo "$RESPONSE" | jq -r '.data.attributes.last_analysis_stats.suspicious // -1')

    if [ "$MALICIOUS" -gt 0 ] || [ "$SUSPICIOUS" -gt 0 ]; then
      STATUS_MSG="flagged"
      BADGE_COLOR="red"
      break
    elif [ "$MALICIOUS" -eq -1 ]; then
      STATUS_MSG="unrated"
      BADGE_COLOR="yellow"
    fi
  done
fi

cat <<EOF > "${RUNNER_TEMP}/security-status.json"
{
  "schemaVersion": 1,
  "label": "security",
  "message": "${STATUS_MSG}",
  "color": "${BADGE_COLOR}"
}
EOF
