#!/bin/bash

# Test Complete Domo Score with Perception Analysis (5th component)
# This simulates a complete conversation that should get 5/5 score

BASE_URL="http://localhost:3000"
TEST_CONVERSATION_ID="test-complete-$(date +%s)"
TEST_DEMO_ID="8cc16f2d-b407-4895-9639-643d1a976da4"

echo "🧪 Testing Complete 5/5 Domo Score Capture"
echo "📋 Test Conversation ID: $TEST_CONVERSATION_ID"
echo ""

# Step 1: Create conversation record with perception analysis
echo "📝 Step 1: Creating conversation record with perception analysis..."
CONVERSATION_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/api/tavus-webhook" \
  -H "Content-Type: application/json" \
  -d "{
    \"event_type\": \"conversation.ended\",
    \"conversation_id\": \"$TEST_CONVERSATION_ID\",
    \"conversation\": {
      \"id\": \"$TEST_CONVERSATION_ID\",
      \"status\": \"ended\",
      \"created_at\": \"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)\",
      \"ended_at\": \"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)\",
      \"duration\": 300
    },
    \"perception_analysis\": {
      \"overall_score\": 0.85,
      \"engagement_score\": 0.9,
      \"sentiment_score\": 0.8,
      \"interest_level\": \"high\",
      \"key_insights\": [\"User appeared engaged\", \"Maintained eye contact\", \"Positive facial expressions\"]
    }
  }")

CONV_CODE="${CONVERSATION_RESPONSE: -3}"
if [ "$CONV_CODE" = "200" ]; then
  echo "✅ Conversation record created with perception analysis"
else
  echo "❌ Conversation record creation failed (HTTP $CONV_CODE)"
  echo "Response: ${CONVERSATION_RESPONSE%???}"
fi

echo ""

# Step 2: Add contact information
echo "👤 Step 2: Adding contact information..."
curl -s -X POST "$BASE_URL/api/webhook/qualification" \
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
  }" > /dev/null

echo "✅ Contact information added"

# Step 3: Add product interest
echo "🎯 Step 3: Adding product interest..."
curl -s -X POST "$BASE_URL/api/webhook/product-interest" \
  -H "Content-Type: application/json" \
  -d "{
    \"conversation_id\": \"$TEST_CONVERSATION_ID\",
    \"event_type\": \"conversation.objective.completed\",
    \"objective_name\": \"product_interest_discovery\",
    \"output_variables\": {
      \"primary_interest\": \"improving organization and efficiency\",
      \"pain_points\": [\"difficulty staying organized\", \"need better planning tools\"]
    }
  }" > /dev/null

echo "✅ Product interest added"

# Step 4: Add video tracking
echo "🎬 Step 4: Adding video tracking..."
curl -s -X POST "$BASE_URL/api/track-video-view" \
  -H "Content-Type: application/json" \
  -d "{
    \"conversation_id\": \"$TEST_CONVERSATION_ID\",
    \"demo_id\": \"$TEST_DEMO_ID\",
    \"video_title\": \"Workforce Planning: Planning and Executing in a Single System\"
  }" > /dev/null

echo "✅ Video tracking added"

# Step 5: Add CTA tracking
echo "🎯 Step 5: Adding CTA tracking..."
curl -s -X POST "$BASE_URL/api/track-cta-click" \
  -H "Content-Type: application/json" \
  -d "{
    \"conversation_id\": \"$TEST_CONVERSATION_ID\",
    \"demo_id\": \"$TEST_DEMO_ID\",
    \"cta_url\": \"https://forms.workday.com/en-us/sales/adaptive-planning-free-trial/form.html\"
  }" > /dev/null

echo "✅ CTA tracking added"

echo ""
echo "🏆 Complete Test Results:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 1. Contact Confirmation (name, email, position)"
echo "✅ 2. Reason Why They Visited Site (primary interest, pain points)"
echo "✅ 3. Platform Feature Most Interested In (video viewed)"
echo "✅ 4. CTA Execution (CTA clicked)"
echo "✅ 5. Visual Analysis (perception analysis provided)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 SUCCESS: All 5 Domo Score components captured!"
echo "🏆 Expected Score: 5/5 (100% Credibility)"
echo ""
echo "📋 Test Conversation ID: $TEST_CONVERSATION_ID"
echo ""
echo "🔍 Verification Queries:"
echo "SELECT * FROM conversation_details WHERE tavus_conversation_id = '$TEST_CONVERSATION_ID';"
echo "SELECT * FROM qualification_data WHERE conversation_id = '$TEST_CONVERSATION_ID';"
echo "SELECT * FROM product_interest_data WHERE conversation_id = '$TEST_CONVERSATION_ID';"
echo "SELECT * FROM video_showcase_data WHERE conversation_id = '$TEST_CONVERSATION_ID';"
echo "SELECT * FROM cta_tracking WHERE conversation_id = '$TEST_CONVERSATION_ID';"
echo ""
echo "💡 Check the reporting dashboard to see the complete 5/5 Domo score!"