#!/bin/bash
# ============================================================
# Cloudflare WAF Rule — Block bot countries on ALL domains
# ============================================================
# Usage:
#   1. Set your Cloudflare API token and email below
#   2. Run: bash scripts/cloudflare-block-countries.sh
# ============================================================

# === CONFIG ===
CF_API_TOKEN="YOUR_CLOUDFLARE_GLOBAL_API_KEY"
CF_EMAIL="imperialmediaweb@gmail.com"      # Your Cloudflare email

RULE_NAME="Block bot countries"
EXPRESSION='(ip.geoip.country in {"SG" "VN" "HK" "MY" "ID" "BR" "IN" "PH" "TH" "PK" "BD" "NG" "CN"})'
ACTION="block"

# === GET ALL ZONES ===
echo "Fetching all zones from Cloudflare..."

PAGE=1
ZONES=()

while true; do
  RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?page=$PAGE&per_page=50&status=active" \
    -H "X-Auth-Email: $CF_EMAIL" \
    -H "X-Auth-Key: $CF_API_TOKEN" \
    -H "Content-Type: application/json")

  # Extract zone IDs and names
  ZONE_DATA=$(echo "$RESPONSE" | grep -o '"id":"[^"]*","name":"[^"]*"' | head -50)

  if [ -z "$ZONE_DATA" ]; then
    break
  fi

  while IFS= read -r line; do
    ZONE_ID=$(echo "$line" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    ZONE_NAME=$(echo "$line" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$ZONE_ID" ]; then
      ZONES+=("$ZONE_ID|$ZONE_NAME")
    fi
  done <<< "$ZONE_DATA"

  # Check if there are more pages
  TOTAL_PAGES=$(echo "$RESPONSE" | grep -o '"total_pages":[0-9]*' | cut -d: -f2)
  if [ "$PAGE" -ge "${TOTAL_PAGES:-1}" ]; then
    break
  fi
  PAGE=$((PAGE + 1))
done

echo "Found ${#ZONES[@]} zones."
echo ""

# === CREATE WAF RULE ON EACH ZONE ===
SUCCESS=0
FAILED=0

for ZONE_ENTRY in "${ZONES[@]}"; do
  ZONE_ID=$(echo "$ZONE_ENTRY" | cut -d'|' -f1)
  ZONE_NAME=$(echo "$ZONE_ENTRY" | cut -d'|' -f2)

  echo -n "  $ZONE_NAME ... "

  RESULT=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets/phases/http_request_firewall_custom/entrypoint" \
    -H "X-Auth-Email: $CF_EMAIL" \
    -H "X-Auth-Key: $CF_API_TOKEN" \
    -H "Content-Type: application/json" \
    --data "{
      \"rules\": [{
        \"expression\": \"$EXPRESSION\",
        \"action\": \"$ACTION\",
        \"description\": \"$RULE_NAME\",
        \"enabled\": true
      }]
    }" 2>&1)

  if echo "$RESULT" | grep -q '"success":true'; then
    echo "OK"
    SUCCESS=$((SUCCESS + 1))
  else
    # Try alternate API (update existing ruleset)
    RULESET_ID=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets" \
      -H "X-Auth-Email: $CF_EMAIL" \
      -H "X-Auth-Key: $CF_API_TOKEN" \
      -H "Content-Type: application/json" | grep -o '"id":"[^"]*".*"http_request_firewall_custom"' | head -1 | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

    if [ -n "$RULESET_ID" ]; then
      RESULT2=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets/$RULESET_ID/rules" \
        -H "X-Auth-Email: $CF_EMAIL" \
        -H "X-Auth-Key: $CF_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data "{
          \"expression\": \"$EXPRESSION\",
          \"action\": \"$ACTION\",
          \"description\": \"$RULE_NAME\",
          \"enabled\": true
        }" 2>&1)

      if echo "$RESULT2" | grep -q '"success":true'; then
        echo "OK (added to existing ruleset)"
        SUCCESS=$((SUCCESS + 1))
      else
        echo "FAILED"
        FAILED=$((FAILED + 1))
      fi
    else
      echo "FAILED"
      FAILED=$((FAILED + 1))
    fi
  fi

  # Rate limit — Cloudflare allows ~1200 req/5min
  sleep 0.5
done

echo ""
echo "============================================"
echo "Done! $SUCCESS succeeded, $FAILED failed."
echo "============================================"
