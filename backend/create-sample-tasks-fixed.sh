#!/bin/bash

# TaskBridge - Create Sample Tasks with Correct Schema

API_BASE_URL="http://localhost:3000/api"

if [ -z "$TOKEN" ]; then
  echo "❌ Error: TOKEN environment variable not set"
  exit 1
fi

echo "========================================="
echo "  Creating Sample Tasks"
echo "========================================="
echo ""

CREATED=0
FAILED=0

create_task() {
  local DATA="$1"
  local DESC="$2"

  RESP=$(curl -s -w "\nHTTP:%{http_code}" -X POST "$API_BASE_URL/tasks" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$DATA")

  CODE=$(echo "$RESP" | grep "^HTTP:" | cut -d: -f2)

  if [ "$CODE" = "201" ]; then
    echo "✅ $DESC"
    ((CREATED++))
  else
    echo "❌ $DESC (HTTP $CODE)"
    ((FAILED++))
  fi
}

# Translation tasks
create_task '{
  "title": "Japanese UI Translation Quality Check",
  "description": "Review AI-translated Japanese interface text for e-commerce mobile app. Check accuracy, naturalness, and cultural appropriateness.",
  "category": "Translation/Localization",
  "domain_type": "translation",
  "amount": 35.00,
  "currency": "USD",
  "deadline": "2025-11-20T23:59:59Z"
}' "Translation: Japanese UI Check"

create_task '{
  "title": "French Marketing Copy Localization Review",
  "description": "Evaluate AI-generated French marketing content for cultural sensitivity and local appeal targeting French-Canadian market.",
  "category": "Translation/Localization",
  "domain_type": "translation",
  "amount": 45.00,
  "currency": "USD",
  "deadline": "2025-11-18T23:59:59Z"
}' "Translation: French Marketing"

create_task '{
  "title": "Spanish Medical Terms Translation Verification",
  "description": "Verify accuracy of Spanish translations for medical terminology in health app. Critical focus on precision and patient safety.",
  "category": "Translation/Localization",
  "domain_type": "translation",
  "amount": 60.00,
  "currency": "USD",
  "deadline": "2025-11-25T23:59:59Z"
}' "Translation: Spanish Medical"

# AI Verification tasks
create_task '{
  "title": "AI Chatbot Response Bias Check - Healthcare",
  "description": "Review 50 AI-generated customer support responses for healthcare chatbot. Check for hallucinations, cultural biases, and appropriateness.",
  "category": "AI Verification",
  "domain_type": "ai_verification",
  "amount": 25.00,
  "currency": "USD",
  "deadline": "2025-11-17T23:59:59Z"
}' "AI Verification: Healthcare Chatbot"

create_task '{
  "title": "AI Content Moderation System Verification",
  "description": "Test AI content moderation system with edge cases. Evaluate false positives/negatives and cultural sensitivity across different languages.",
  "category": "AI Verification",
  "domain_type": "ai_verification",
  "amount": 30.00,
  "currency": "USD",
  "deadline": "2025-11-19T23:59:59Z"
}' "AI Verification: Content Moderation"

create_task '{
  "title": "AI-Generated Product Descriptions Quality Check",
  "description": "Verify 100 AI-generated product descriptions for e-commerce site. Check for factual accuracy, hallucinations, and appropriateness.",
  "category": "AI Verification",
  "domain_type": "ai_verification",
  "amount": 20.00,
  "currency": "USD",
  "deadline": "2025-11-16T23:59:59Z"
}' "AI Verification: Product Descriptions"

# Physical Data tasks
create_task '{
  "title": "Competitor Store Pricing Survey - Tokyo Shibuya",
  "description": "Visit 3 competitor stores in Shibuya district and photograph product pricing for specific items. GPS verification required.",
  "category": "Physical Data Collection",
  "domain_type": "physical_data",
  "amount": 15.00,
  "currency": "USD",
  "deadline": "2025-11-14T23:59:59Z"
}' "Physical: Tokyo Store Pricing"

create_task '{
  "title": "Restaurant Opening Hours Verification - Accra",
  "description": "Visit 5 restaurants in Accra and verify opening hours, menu availability, and customer traffic. Take photos of signage.",
  "category": "Physical Data Collection",
  "domain_type": "physical_data",
  "amount": 12.00,
  "currency": "USD",
  "deadline": "2025-11-15T23:59:59Z"
}' "Physical: Accra Restaurant Check"

create_task '{
  "title": "Retail Display Audit - Nairobi Shopping Mall",
  "description": "Visit shopping mall and photograph how products are displayed compared to competitors. Note shelf position, visibility, and pricing.",
  "category": "Physical Data Collection",
  "domain_type": "physical_data",
  "amount": 18.00,
  "currency": "USD",
  "deadline": "2025-11-16T23:59:59Z"
}' "Physical: Nairobi Retail Display"

# App Testing tasks
create_task '{
  "title": "Android Game Testing - Budget Phone Performance",
  "description": "Test mobile game on Android device with 2GB RAM or less. Report loading times, crashes, frame rate issues, and user experience.",
  "category": "Mobile App Testing",
  "domain_type": "app_testing",
  "amount": 12.00,
  "currency": "USD",
  "deadline": "2025-11-15T23:59:59Z"
}' "App Testing: Budget Android Game"

create_task '{
  "title": "iOS App Localization Testing - Japanese",
  "description": "Test iOS app in Japanese language mode. Check UI text display, date/time formatting, and cultural appropriateness.",
  "category": "Mobile App Testing",
  "domain_type": "app_testing",
  "amount": 15.00,
  "currency": "USD",
  "deadline": "2025-11-16T23:59:59Z"
}' "App Testing: iOS Japanese Localization"

create_task '{
  "title": "Mobile Game Tutorial Flow Testing",
  "description": "Test mobile game tutorial as a new player. Report clarity of instructions, difficulty curve, and any confusing elements.",
  "category": "Mobile App Testing",
  "domain_type": "app_testing",
  "amount": 10.00,
  "currency": "USD",
  "deadline": "2025-11-14T23:59:59Z"
}' "App Testing: Game Tutorial"

# Generic tasks
create_task '{
  "title": "Data Entry - 100 Business Cards to Spreadsheet",
  "description": "Transcribe information from 100 business card images into provided Google Sheets template. Required fields: name, company, email, phone, address.",
  "category": "Data Entry",
  "amount": 20.00,
  "currency": "USD",
  "deadline": "2025-11-15T23:59:59Z"
}' "Generic: Business Card Data Entry"

create_task '{
  "title": "Online Research - Competitor Analysis Summary",
  "description": "Research 5 competitor websites and compile feature comparison, pricing, and unique selling points. Deliver findings in structured format.",
  "category": "Research",
  "amount": 30.00,
  "currency": "USD",
  "deadline": "2025-11-17T23:59:59Z"
}' "Generic: Competitor Research"

create_task '{
  "title": "Social Media Content Moderation - 500 Posts",
  "description": "Review 500 user-generated posts for community guidelines violations. Flag inappropriate content, spam, and policy violations.",
  "category": "Content Moderation",
  "amount": 25.00,
  "currency": "USD",
  "deadline": "2025-11-14T23:59:59Z"
}' "Generic: Content Moderation"

create_task '{
  "title": "Audio Transcription - 30-minute Interview",
  "description": "Transcribe 30-minute interview recording to text. Timestamps every 5 minutes required. Clear audio, English language, business context.",
  "category": "Transcription",
  "amount": 15.00,
  "currency": "USD",
  "deadline": "2025-11-16T23:59:59Z"
}' "Generic: Audio Transcription"

create_task '{
  "title": "Product Image Background Removal - 50 Images",
  "description": "Remove backgrounds from 50 product images and replace with white background. Ensure clean edges and consistent quality.",
  "category": "Image Editing",
  "amount": 20.00,
  "currency": "USD",
  "deadline": "2025-11-18T23:59:59Z"
}' "Generic: Image Background Removal"

echo ""
echo "========================================="
echo "Summary: ✅ $CREATED created, ❌ $FAILED failed"
echo "========================================="
