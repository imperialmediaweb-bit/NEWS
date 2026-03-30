#!/bin/bash
# ============================================
# Add www CNAME -> Railway for ALL Cloudflare zones
# Run this on YOUR computer (not in Claude Code)
# ============================================

CF_TOKEN="cfut_mdpbugMeG4WyqUffXs0W8Gyj37ogB9deSG2w0Yi2d65832ac"
RAILWAY="news-copy-production-12db.up.railway.app"

echo "=== Cloudflare: Add www CNAME to all zones ==="
echo ""

# Fetch all zones (page 1)
PAGE=1
TOTAL=1

while [ "$PAGE" -le "$TOTAL" ]; do
  RESPONSE=$(curl -s "https://api.cloudflare.com/client/v4/zones?per_page=50&page=$PAGE" \
    -H "Authorization: Bearer $CF_TOKEN" \
    -H "Content-Type: application/json")

  TOTAL=$(echo "$RESPONSE" | python3 -c "
import sys, json, math
d = json.load(sys.stdin)
info = d.get('result_info', {})
print(math.ceil(info.get('total_count', 0) / max(info.get('per_page', 50), 1)))
" 2>/dev/null)

  echo "$RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for z in data.get('result', []):
    print(z['id'] + '|' + z['name'])
" 2>/dev/null | while IFS='|' read -r ZID DOMAIN; do
    echo "--- $DOMAIN ---"

    # Check existing www records (CNAME or A)
    for TYPE in CNAME A AAAA; do
      OLD=$(curl -s "https://api.cloudflare.com/client/v4/zones/$ZID/dns_records?type=$TYPE&name=www.$DOMAIN" \
        -H "Authorization: Bearer $CF_TOKEN")
      OLD_IDS=$(echo "$OLD" | python3 -c "
import sys, json
for r in json.load(sys.stdin).get('result', []):
    print(r['id'])
" 2>/dev/null)
      for RID in $OLD_IDS; do
        echo "  Deleting old $TYPE record $RID..."
        curl -s -X DELETE "https://api.cloudflare.com/client/v4/zones/$ZID/dns_records/$RID" \
          -H "Authorization: Bearer $CF_TOKEN" > /dev/null
      done
    done

    # Create new www CNAME -> Railway
    RESULT=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZID/dns_records" \
      -H "Authorization: Bearer $CF_TOKEN" \
      -H "Content-Type: application/json" \
      --data "{\"type\":\"CNAME\",\"name\":\"www\",\"content\":\"$RAILWAY\",\"ttl\":1,\"proxied\":true}")

    OK=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('success',False))" 2>/dev/null)
    if [ "$OK" = "True" ]; then
      echo "  www.$DOMAIN -> $RAILWAY  [OK]"
    else
      ERR=$(echo "$RESULT" | python3 -c "
import sys, json
errs = json.load(sys.stdin).get('errors', [])
print(errs[0].get('message','unknown') if errs else 'unknown')
" 2>/dev/null)
      echo "  www.$DOMAIN  [FAILED: $ERR]"
    fi
  done

  PAGE=$((PAGE + 1))
done

echo ""
echo "=== DONE! All www CNAMEs point to Railway ==="
