# Set your token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2MWQxNDU1Zi0yYmM2LTRhMWItOTJmZS03OWM2ZWJlMDA0MGUiLCJlbWFpbCI6ImFkbWluQGJsdWViZXJyeWhpbGxzbXVubmFyLmluIiwicm9sZSI6Ik1BTkFHRVIiLCJpYXQiOjE3NzM4OTE0NTAsImV4cCI6MTc3NDQ5NjI1MH0.iq3x4KaOD_FF6oqESzoMiBilJ8tyXqDBiIZiw7wRriU"

# Test 1: Get all rooms
echo "🏨 ROOMS:"
curl http://localhost:4000/api/v1/rooms \
  -H "Authorization: Bearer $TOKEN" | jq

echo -e "\n👥 GUESTS:"
curl http://localhost:4000/api/v1/guests \
  -H "Authorization: Bearer $TOKEN" | jq

echo -e "\n📅 BOOKINGS:"
curl http://localhost:4000/api/v1/bookings \
  -H "Authorization: Bearer $TOKEN" | jq