#!/bin/bash

TOKEN="eyJhbGciOiJIUzI1NiIsImtpZCI6ImlXQTR3N1YzK1QwMkRIV3QiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL21xZGVvanNwZ2lwa2Nja2h6ZnhuLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI3MTE1YzUzZi0zNTNlLTRmODAtYjQ1ZS01NjAzNTIxZjUyYjIiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYyMDAwNDgxLCJpYXQiOjE3NjE5OTY4ODEsImVtYWlsIjoiaW5mb0Bnb3NwZWwtYWkudGVjaCIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJpbmZvQGdvc3BlbC1haS50ZWNoIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6Ikdvc3BlbCBBSSBXb3JrZXIiLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInJvbGUiOiJ3b3JrZXIiLCJzdWIiOiI3MTE1YzUzZi0zNTNlLTRmODAtYjQ1ZS01NjAzNTIxZjUyYjIifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc2MTk5Njg4MX1dLCJzZXNzaW9uX2lkIjoiNjRmZmJjYjYtYjVjZS00OTkyLTk5M2MtMTljMjBiYmYwNGIxIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.a5MO8e9olu0B-i5yBdEEPTxVMZtQ_Rt-N1ufzoPgJHU"

echo "Creating app_testing tasks..."
echo ""

curl -s -X POST "http://localhost:3000/api/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Android Game Testing - Budget Phone Performance",
    "description": "Test mobile game on Android device with 2GB RAM or less. Report loading times, crashes, frame rate issues.",
    "category": "Mobile App Testing",
    "domain_type": "app_testing",
    "amount": 12.00,
    "currency": "USD",
    "deadline": "2025-11-20T23:59:59Z"
  }' | jq -r 'if .success then "✅ " + .data.title else "❌ Error" end'

curl -s -X POST "http://localhost:3000/api/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "iOS App Localization Testing - Japanese",
    "description": "Test iOS app in Japanese language mode. Check UI text display, date/time formatting, and cultural appropriateness.",
    "category": "Mobile App Testing",
    "domain_type": "app_testing",
    "amount": 15.00,
    "currency": "USD",
    "deadline": "2025-11-20T23:59:59Z"
  }' | jq -r 'if .success then "✅ " + .data.title else "❌ Error" end'

curl -s -X POST "http://localhost:3000/api/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mobile Game Tutorial Flow Testing",
    "description": "Test mobile game tutorial as a new player. Report clarity of instructions, difficulty curve, and confusing elements.",
    "category": "Mobile App Testing",
    "domain_type": "app_testing",
    "amount": 10.00,
    "currency": "USD",
    "deadline": "2025-11-20T23:59:59Z"
  }' | jq -r 'if .success then "✅ " + .data.title else "❌ Error" end'

echo ""
echo "✅ App testing tasks created!"
