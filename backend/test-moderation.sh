#!/bin/bash

# Test token
TOKEN="eyJhbGciOiJIUzI1NiIsImtpZCI6ImlXQTR3N1YzK1QwMkRIV3QiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL21xZGVvanNwZ2lwa2Nja2h6ZnhuLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI3MTE1YzUzZi0zNTNlLTRmODAtYjQ1ZS01NjAzNTIxZjUyYjIiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYxODk0Mjc5LCJpYXQiOjE3NjE4OTA2NzksImVtYWlsIjoiaW5mb0Bnb3NwZWwtYWkudGVjaCIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJpbmZvQGdvc3BlbC1haS50ZWNoIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6Ikdvc3BlbCBBSSBXb3JrZXIiLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInJvbGUiOiJ3b3JrZXIiLCJzdWIiOiI3MTE1YzUzZi0zNTNlLTRmODAtYjQ1ZS01NjAzNTIxZjUyYjIifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc2MTg5MDY3OX1dLCJzZXNzaW9uX2lkIjoiNjIwNTExMTEtYzU1MC00YzA4LWFiYjQtMWY2ZWY3NDRkODc3IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.g9QkEt1-BNhBLaUyUXuT3bZUVsK6JDnyTJyMG4ovWZQ"

echo "========================================="
echo "  Content Moderation System Tests"
echo "========================================="
echo ""

echo "=== Test 1: Normal Task (Should ALLOW) ==="
RESPONSE=$(curl -s -X POST "http://localhost:3000/api/tasks" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"title":"Translate product description","description":"Please translate our product description from English to Japanese. We need a natural translation.","category":"Translation","domain_type":"translation","amount":25,"currency":"USD"}')

echo "$RESPONSE" | jq .
if echo "$RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
  echo "✅ PASS: Task created"
else
  echo "❌ FAIL: Task not created"
fi
echo ""

echo "=== Test 2: Critical Violation - Bank Account (Should BLOCK) ==="
RESPONSE=$(curl -s -X POST "http://localhost:3000/api/tasks" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"title":"Payment information needed","description":"Please provide your bank account number and credit card details for payment processing.","category":"Data Entry","amount":50,"currency":"USD"}')

echo "$RESPONSE" | jq .
if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  echo "✅ PASS: Task blocked"
else
  echo "❌ FAIL: Task should have been blocked"
fi
echo ""

echo "=== Test 3: High Risk - External Contact (Should HOLD_FOR_REVIEW) ==="
RESPONSE=$(curl -s -X POST "http://localhost:3000/api/tasks" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"title":"Quick task urgent","description":"Contact me on WhatsApp for more details. Payment via PayPal.","category":"General","amount":100,"currency":"USD"}')

echo "$RESPONSE" | jq .
STATUS=$(echo "$RESPONSE" | jq -r '.status // empty')
MOD_STATUS=$(echo "$RESPONSE" | jq -r '.moderation_status // empty')
if [ "$STATUS" = "pending_review" ] || [ "$MOD_STATUS" = "under_review" ]; then
  echo "✅ PASS: Task held for review"
else
  echo "❌ FAIL: Task not held for review (status: $STATUS, moderation: $MOD_STATUS)"
fi
echo ""

echo "========================================="
echo "  Test Complete"
echo "========================================="
