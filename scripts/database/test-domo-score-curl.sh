#!/bin/bash

# Test Complete Domo Score Capture using curl
# This script tests if all 5 score components can be captured

BASE_URL="http://localhost:3000"
TEST_CONVERSATION_ID="test-complete-$(date +%s)"
TEST_DEMO_ID="8cc16f2d-b407-4895-9639-643d1a976da4"

echo "🧪 Starting Complete Domo Score Test"
echo "📋 Test Conversation ID: $TEST_CONVERSATION_ID"
echo "📋 Test Demo ID: $TEST_DEMO_ID"
echo ""

# Test 1: Video Tracking (Component 3/5)
echo "🎬 Testing Video Tracking (Component 3/5)..."
VIDEO_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/api/track-video-view" \
  -H "Content-Type: application/json" \
  -d "{
    \"conversation_id\": \"$TEST_CONVERSATION_ID\",
    \"demo_id\": \"$TEST_DEMO_ID\",
    \"video_title\": \"Workforce Planning: Planning and Executing in a Single System\"
  }")

VIDEO_CODE="${VIDEO_RESPONSE: -3}"
if [ "$VIDEO_CODE" = "200" ]; then
  echo "✅ Video tracking successful"
  VIDEO_SUCCESS=true
else
  echo "❌ Video tracking failed (HTTP $VIDEO_CODE)"
  echo "Response: ${VIDEO_RESPONSE%???}"
  VIDEO_SUCCESS=false
fi

echo ""

# Test 2: CTA Tracking (Component 4/5)
echo "🎯 Testing CTA Tracking (Component 4/5)..."
CTA_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/api/track-cta-click" \
  -H "Content-Type: application/json" \
  -d "{
    \"conversation_id\": \"$TEST_CONVERSATION_ID\",
    \"demo_id\": \"$TEST_DEMO_ID\",
    \"cta_url\": \"https://forms.workday.com/en-us/sales/adaptive-planning-free-trial/form.html\"
  }")

CTA_CODE="${CTA_RESPONSE: -3}"
if [ "$CTA_CODE" = "200" ]; then
  echo "✅ CTA tracking successful"
  CTA_SUCCESS=true
else
  echo "❌ CTA tracking failed (HTTP $CTA_CODE)"
  echo "Response: ${CTA_RESPONSE%???}"
  CTA_SUCCESS=false
fi

echo ""

# Test 3: Contact Qualification Webhook (Component 1/5)
echo "👤 Testing Contact Qualification Webhook (Component 1/5)..."
QUAL_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/api/webhook/qualification" \
  -H "Content-Type: application/json" \
  -d "{
    \"conversation_id\": \"$TEST_CONVERSATION_ID\",
    \"event_type\": \"conversation.objective.completed\",
    \"objective_name\": \"greeting_and_qualification\",
    \"output_variables\": {
      \"first_name\": \"Test\",
      \"last_name\": \"User\",
      \"email\": \"test@example.com\",
      \"position\": \"Software Engineer\"
    }
  }")

QUAL_CODE="${QUAL_RESPONSE: -3}"
if [ "$QUAL_CODE" = "200" ]; then
  echo "✅ Contact qualification successful"
  QUAL_SUCCESS=true
else
  echo "❌ Contact qualification failed (HTTP $QUAL_CODE)"
  echo "Response: ${QUAL_RESPONSE%???}"
  QUAL_SUCCESS=false
fi

echo ""

# Test 4: Product Interest Webhook (Component 2/5)
echo "🎯 Testing Product Interest Webhook (Component 2/5)..."
INTEREST_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/api/webhook/product-interest" \
  -H "Content-Type: application/json" \
  -d "{
    \"conversation_id\": \"$TEST_CONVERSATION_ID\",
    \"event_type\": \"conversation.objective.completed\",
    \"objective_name\": \"product_interest_discovery\",
    \"output_variables\": {
      \"primary_interest\": \"improving organization and efficiency\",
      \"pain_points\": [\"difficulty staying organized\", \"need better planning tools\"]
    }
  }")

INTEREST_CODE="${INTEREST_RESPONSE: -3}"
if [ "$INTEREST_CODE" = "200" ]; then
  echo "✅ Product interest discovery successful"
  INTEREST_SUCCESS=true
else
  echo "❌ Product interest discovery failed (HTTP $INTEREST_CODE)"
  echo "Response: ${INTEREST_RESPONSE%???}"
  INTEREST_SUCCESS=false
fi

echo ""

# Test 5: Video Showcase Webhook (Alternative method for Component 3/5)
echo "🎬 Testing Video Showcase Webhook (Alternative for Component 3/5)..."
VIDEO_WH_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/api/webhook/video-showcase" \
  -H "Content-Type: application/json" \
  -d "{
    \"conversation_id\": \"$TEST_CONVERSATION_ID\",
    \"event_type\": \"conversation.objective.completed\",
    \"objective_name\": \"demo_video_showcase\",
    \"output_variables\": {
      \"videos_shown\": [\"Workforce Planning: Planning and Executing in a Single System\"]
    }
  }")

VIDEO_WH_CODE="${VIDEO_WH_RESPONSE: -3}"
if [ "$VIDEO_WH_CODE" = "200" ]; then
  echo "✅ Video showcase webhook successful"
  VIDEO_WH_SUCCESS=true
else
  echo "❌ Video showcase webhook failed (HTTP $VIDEO_WH_CODE)"
  echo "Response: ${VIDEO_WH_RESPONSE%???}"
  VIDEO_WH_SUCCESS=false
fi

echo ""

# Summary
echo "📋 Test Results Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$VIDEO_SUCCESS" = true ]; then
  echo "🎬 Video Tracking:           ✅ PASS"
else
  echo "🎬 Video Tracking:           ❌ FAIL"
fi

if [ "$CTA_SUCCESS" = true ]; then
  echo "🎯 CTA Tracking:             ✅ PASS"
else
  echo "🎯 CTA Tracking:             ❌ FAIL"
fi

if [ "$QUAL_SUCCESS" = true ]; then
  echo "👤 Contact Qualification:    ✅ PASS"
else
  echo "👤 Contact Qualification:    ❌ FAIL"
fi

if [ "$INTEREST_SUCCESS" = true ]; then
  echo "🎯 Product Interest:         ✅ PASS"
else
  echo "🎯 Product Interest:         ❌ FAIL"
fi

if [ "$VIDEO_WH_SUCCESS" = true ]; then
  echo "🎬 Video Showcase Webhook:   ✅ PASS"
else
  echo "🎬 Video Showcase Webhook:   ❌ FAIL"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Count successes
TOTAL_PASSED=0
[ "$VIDEO_SUCCESS" = true ] && ((TOTAL_PASSED++))
[ "$CTA_SUCCESS" = true ] && ((TOTAL_PASSED++))
[ "$QUAL_SUCCESS" = true ] && ((TOTAL_PASSED++))
[ "$INTEREST_SUCCESS" = true ] && ((TOTAL_PASSED++))
[ "$VIDEO_WH_SUCCESS" = true ] && ((TOTAL_PASSED++))

echo ""
echo "🏆 Overall Result: $TOTAL_PASSED/5 components working"

if [ $TOTAL_PASSED -ge 4 ]; then
  echo "🎉 SUCCESS: Most/All Domo Score components can be captured!"
  echo "💡 The system is ready to capture complete conversation scores."
elif [ $TOTAL_PASSED -ge 2 ]; then
  echo "⚠️  PARTIAL SUCCESS: Some components need attention."
  echo "🔧 Check the failed components and their error messages above."
else
  echo "❌ FAILURE: Most components are not working."
  echo "🔧 Check server logs and API endpoints."
fi

echo ""
echo "📋 Test Conversation ID: $TEST_CONVERSATION_ID"
echo "💡 You can check this conversation in the reporting dashboard to verify the score calculation."
echo ""
echo "🔍 To verify the data was stored, run these SQL queries:"
echo "SELECT * FROM video_showcase_data WHERE conversation_id = '$TEST_CONVERSATION_ID';"
echo "SELECT * FROM cta_tracking WHERE conversation_id = '$TEST_CONVERSATION_ID';"
echo "SELECT * FROM qualification_data WHERE conversation_id = '$TEST_CONVERSATION_ID';"
echo "SELECT * FROM product_interest_data WHERE conversation_id = '$TEST_CONVERSATION_ID';"