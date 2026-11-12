#!/bin/sh
# Calls the local API with a bearer token you supply. Nothing in this file is a credential.
if [ -z "$TOKEN" ]; then
  echo "Set TOKEN to a current staff bearer token, then run this script again." >&2
  exit 1
fi

api="${API_ORIGIN:-http://127.0.0.1:4000}"

echo "ROOMS:"
curl --fail-with-body "$api/api/v1/rooms" -H "Authorization: Bearer $TOKEN"

echo ""
echo "GUESTS:"
curl --fail-with-body "$api/api/v1/guests" -H "Authorization: Bearer $TOKEN"

echo ""
echo "BOOKINGS:"
curl --fail-with-body "$api/api/v1/bookings" -H "Authorization: Bearer $TOKEN"
echo ""
