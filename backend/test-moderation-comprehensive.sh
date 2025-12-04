#!/bin/bash

# Comprehensive Content Moderation System Tests
# Tests all 7 prohibited categories + pattern detection

TOKEN="eyJhbGciOiJIUzI1NiIsImtpZCI6ImlXQTR3N1YzK1QwMkRIV3QiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL21xZGVvanNwZ2lwa2Nja2h6ZnhuLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI3MTE1YzUzZi0zNTNlLTRmODAtYjQ1ZS01NjAzNTIxZjUyYjIiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYxODk0Mjc5LCJpYXQiOjE3NjE4OTA2NzksImVtYWlsIjoiaW5mb0Bnb3NwZWwtYWkudGVjaCIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJpbmZvQGdvc3BlbC1haS50ZWNoIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6Ikdvc3BlbCBBSSBXb3JrZXIiLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInJvbGUiOiJ3b3JrZXIiLCJzdWIiOiI3MTE1YzUzZi0zNTNlLTRmODAtYjQ1ZS01NjAzNTIxZjUyYjIifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc2MTg5MDY3OX1dLCJzZXNzaW9uX2lkIjoiNjIwNTExMTEtYzU1MC00YzA4LWFiYjQtMWY2ZWY3NDRkODc3IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.g9QkEt1-BNhBLaUyUXuT3bZUVsK6JDnyTJyMG4ovWZQ"

PASS_COUNT=0
FAIL_COUNT=0

function run_test() {
  local test_name="$1"
  local expected="$2"
  local payload="$3"

  echo "=== $test_name ==="

  RESPONSE=$(curl -s -X POST "http://localhost:3000/api/tasks" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload")

  case "$expected" in
    "ALLOW")
      if echo "$RESPONSE" | jq -e '.data.id' > /dev/null 2>&1; then
        STATUS=$(echo "$RESPONSE" | jq -r '.data.status')
        if [ "$STATUS" = "published" ]; then
          echo "✅ PASS: Task created and published"
          ((PASS_COUNT++))
        else
          echo "❌ FAIL: Task created but status is $STATUS (expected: published)"
          ((FAIL_COUNT++))
        fi
      else
        ERROR=$(echo "$RESPONSE" | jq -r '.error.message // .error // "Unknown error"')
        echo "❌ FAIL: Task not created - $ERROR"
        ((FAIL_COUNT++))
      fi
      ;;

    "BLOCK")
      if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
        REASON=$(echo "$RESPONSE" | jq -r '.reason // .error')
        echo "✅ PASS: Task blocked - $REASON"
        ((PASS_COUNT++))
      else
        echo "❌ FAIL: Task should have been blocked"
        ((FAIL_COUNT++))
      fi
      ;;

    "HOLD_FOR_REVIEW")
      if echo "$RESPONSE" | jq -e '.data.moderation_status' > /dev/null 2>&1; then
        MOD_STATUS=$(echo "$RESPONSE" | jq -r '.data.moderation_status')
        TASK_STATUS=$(echo "$RESPONSE" | jq -r '.data.status')
        if [ "$MOD_STATUS" = "under_review" ] || [ "$TASK_STATUS" = "pending_review" ]; then
          echo "✅ PASS: Task held for review (status: $TASK_STATUS, moderation: $MOD_STATUS)"
          ((PASS_COUNT++))
        else
          echo "❌ FAIL: Wrong status (task: $TASK_STATUS, mod: $MOD_STATUS)"
          ((FAIL_COUNT++))
        fi
      else
        ERROR=$(echo "$RESPONSE" | jq -r '.error.message // .error // "Unknown"')
        echo "❌ FAIL: Task should be held for review, got error: $ERROR"
        ((FAIL_COUNT++))
      fi
      ;;

    "WARN")
      if echo "$RESPONSE" | jq -e '.data.id' > /dev/null 2>&1; then
        WARNINGS=$(echo "$RESPONSE" | jq -r '.data.moderation_warnings // empty')
        if [ -n "$WARNINGS" ]; then
          echo "✅ PASS: Task created with warnings - $WARNINGS"
          ((PASS_COUNT++))
        else
          echo "⚠️  PARTIAL: Task created but no warnings found (may be ALLOW instead of WARN)"
          ((PASS_COUNT++))
        fi
      else
        echo "❌ FAIL: Task should be created with warning"
        ((FAIL_COUNT++))
      fi
      ;;
  esac

  echo ""
}

echo "========================================="
echo "  Comprehensive Moderation Tests"
echo "========================================="
echo ""

# ============================================
# CATEGORY 1: Illegal Drugs (CRITICAL - BLOCK)
# ============================================

run_test "1.1: Illegal Drugs - Explicit" "BLOCK" '{
  "title": "Need someone to deliver packages",
  "description": "Looking for courier to deliver cocaine packages across the city. Good pay.",
  "category": "Delivery",
  "amount": 500,
  "currency": "USD"
}'

run_test "1.2: Illegal Drugs - Coded" "BLOCK" '{
  "title": "Sell my products",
  "description": "Need help selling marijuana products at local events.",
  "category": "Sales",
  "amount": 200,
  "currency": "USD"
}'

# ============================================
# CATEGORY 2: Weapons & Violence (CRITICAL - BLOCK)
# ============================================

run_test "2.1: Weapons - Firearms" "BLOCK" '{
  "title": "Help me sell items",
  "description": "Need assistance selling firearms and ammunition online.",
  "category": "Sales",
  "amount": 100,
  "currency": "USD"
}'

run_test "2.2: Violence - Hiring" "BLOCK" '{
  "title": "Security job",
  "description": "Need someone to hurt a person who owes me money.",
  "category": "Security",
  "amount": 1000,
  "currency": "USD"
}'

# ============================================
# CATEGORY 3: Financial Fraud (CRITICAL - BLOCK)
# ============================================

run_test "3.1: Fraud - Bank Account" "BLOCK" '{
  "title": "Payment setup",
  "description": "Please provide your bank account number and routing number for payment.",
  "category": "Admin",
  "amount": 50,
  "currency": "USD"
}'

run_test "3.2: Fraud - Money Laundering" "BLOCK" '{
  "title": "Financial assistance",
  "description": "Need help with money laundering through cryptocurrency exchanges.",
  "category": "Finance",
  "amount": 5000,
  "currency": "USD"
}'

run_test "3.3: Fraud - Pyramid Scheme" "BLOCK" '{
  "title": "Recruitment task",
  "description": "Join our pyramid scheme and recruit 10 people. Easy money!",
  "category": "Recruitment",
  "amount": 100,
  "currency": "USD"
}'

# ============================================
# CATEGORY 4: Privacy Violations (CRITICAL - BLOCK)
# ============================================

run_test "4.1: Privacy - Hacking" "BLOCK" '{
  "title": "Technical help needed",
  "description": "Need someone to hack into my ex-partners email account.",
  "category": "Tech",
  "amount": 300,
  "currency": "USD"
}'

run_test "4.2: Privacy - Stalking" "BLOCK" '{
  "title": "Investigation task",
  "description": "Help me track someones location and daily activities for stalking purposes.",
  "category": "Research",
  "amount": 500,
  "currency": "USD"
}'

# ============================================
# CATEGORY 5: Child Safety (CRITICAL - BLOCK)
# ============================================

run_test "5.1: Child Safety" "BLOCK" '{
  "title": "Content review",
  "description": "Review and categorize content involving minors in inappropriate situations.",
  "category": "Content Review",
  "amount": 100,
  "currency": "USD"
}'

# ============================================
# CATEGORY 6: Extremism (CRITICAL - BLOCK)
# ============================================

run_test "6.1: Extremism - Terrorism" "BLOCK" '{
  "title": "Recruitment help",
  "description": "Help recruit members for our terrorist organization.",
  "category": "Recruitment",
  "amount": 1000,
  "currency": "USD"
}'

# ============================================
# CATEGORY 7: IP Violations (HIGH RISK - HOLD)
# ============================================

run_test "7.1: IP Violation - Piracy" "HOLD_FOR_REVIEW" '{
  "title": "Software distribution",
  "description": "Help me distribute pirated software and cracked games.",
  "category": "Distribution",
  "amount": 50,
  "currency": "USD"
}'

run_test "7.2: IP Violation - Counterfeit" "HOLD_FOR_REVIEW" '{
  "title": "Product sales",
  "description": "Sell counterfeit goods and fake designer products.",
  "category": "Sales",
  "amount": 200,
  "currency": "USD"
}'

# ============================================
# PATTERN DETECTION TESTS
# ============================================

run_test "8.1: External Contact - WhatsApp" "HOLD_FOR_REVIEW" '{
  "title": "Quick gig",
  "description": "Contact me on WhatsApp at +1234567890 for more details about the task.",
  "category": "General",
  "amount": 50,
  "currency": "USD"
}'

run_test "8.2: External Contact - Telegram" "HOLD_FOR_REVIEW" '{
  "title": "Urgent task",
  "description": "Message me on Telegram @username to discuss payment and details.",
  "category": "General",
  "amount": 100,
  "currency": "USD"
}'

run_test "8.3: Direct Payment Request" "HOLD_FOR_REVIEW" '{
  "title": "Task with bonus",
  "description": "I will pay you via PayPal directly, just need your email address.",
  "category": "General",
  "amount": 75,
  "currency": "USD"
}'

run_test "8.4: Urgency + External Contact" "HOLD_FOR_REVIEW" '{
  "title": "URGENT - NEED NOW!!!",
  "description": "Very urgent task! Contact me immediately on Signal for quick cash payment.",
  "category": "General",
  "amount": 200,
  "currency": "USD"
}'

run_test "8.5: Personal Information Request" "HOLD_FOR_REVIEW" '{
  "title": "Survey task",
  "description": "Please provide your full name, address, and phone number for verification.",
  "category": "Survey",
  "amount": 25,
  "currency": "USD"
}'

run_test "8.6: Multiple Suspicious Patterns" "HOLD_FOR_REVIEW" '{
  "title": "URGENT CASH NOW!!!",
  "description": "Contact me on WhatsApp ASAP! Will pay via Venmo. Need your email and phone number.",
  "category": "General",
  "amount": 500,
  "currency": "USD"
}'

# ============================================
# LEGITIMATE TASKS (SHOULD ALLOW)
# ============================================

run_test "9.1: Normal Translation Task" "ALLOW" '{
  "title": "Translate product description",
  "description": "Please translate our product description from English to Japanese. We need a natural and culturally appropriate translation.",
  "category": "Translation",
  "domain_type": "translation",
  "amount": 25,
  "currency": "USD"
}'

run_test "9.2: Normal AI Verification" "ALLOW" '{
  "title": "Review AI chatbot responses",
  "description": "Check if our chatbot provides accurate and helpful responses to customer questions.",
  "category": "AI Verification",
  "domain_type": "ai_verification",
  "amount": 30,
  "currency": "USD"
}'

run_test "9.3: Normal Data Collection" "ALLOW" '{
  "title": "Verify store hours",
  "description": "Visit local stores and verify their opening hours are correct on our map.",
  "category": "Data Collection",
  "domain_type": "physical_data",
  "amount": 15,
  "currency": "USD"
}'

run_test "9.4: Normal App Testing" "ALLOW" '{
  "title": "Test mobile app",
  "description": "Download our app and test the registration and checkout process. Report any bugs.",
  "category": "App Testing",
  "domain_type": "app_testing",
  "amount": 20,
  "currency": "USD"
}'

run_test "9.5: Generic Task" "ALLOW" '{
  "title": "Data entry work",
  "description": "Enter customer information from scanned forms into our spreadsheet.",
  "category": "Data Entry",
  "amount": 40,
  "currency": "USD"
}'

# ============================================
# EDGE CASES
# ============================================

run_test "10.1: Borderline - Security Research" "ALLOW" '{
  "title": "Security audit",
  "description": "Perform security testing on our website (authorized penetration testing).",
  "category": "Security",
  "amount": 200,
  "currency": "USD"
}'

run_test "10.2: Borderline - Game Items" "ALLOW" '{
  "title": "Gaming task",
  "description": "Help me collect in-game items and level up my character.",
  "category": "Gaming",
  "amount": 50,
  "currency": "USD"
}'

run_test "10.3: Borderline - Medicine (Legal)" "ALLOW" '{
  "title": "Pharmacy delivery",
  "description": "Deliver prescription medicine from pharmacy to customers (licensed).",
  "category": "Delivery",
  "amount": 30,
  "currency": "USD"
}'

# ============================================
# TEST SUMMARY
# ============================================

echo "========================================="
echo "  TEST SUMMARY"
echo "========================================="
echo "Total Tests: $((PASS_COUNT + FAIL_COUNT))"
echo "✅ Passed: $PASS_COUNT"
echo "❌ Failed: $FAIL_COUNT"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
  echo "🎉 All tests passed!"
  exit 0
else
  echo "⚠️  Some tests failed. Please review the results above."
  exit 1
fi
