#!/bin/bash

# Test script to manually trigger the vessel data fetch
# This helps verify the Edge Function is working before setting up the cron job

echo "🧪 Testing Vessel Data Fetch Edge Function"
echo "=========================================="

# Load environment variables
if [ -f ".env.local" ]; then
    export $(grep -v '^#' .env.local | xargs)
    echo "✅ Loaded environment variables from .env.local"
else
    echo "❌ No .env.local file found"
    exit 1
fi

# Check required variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ Missing Supabase credentials"
    exit 1
fi

# Construct Edge Function URL
EDGE_FUNCTION_URL="${NEXT_PUBLIC_SUPABASE_URL}/functions/v1/fetch-vessel-data"

echo "📡 Calling Edge Function: $EDGE_FUNCTION_URL"
echo ""

# Call the Edge Function
echo "🚀 Starting data fetch..."
RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json" \
    "$EDGE_FUNCTION_URL")

# Extract HTTP status code and response body
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | head -n -1)

echo "📊 Response Status: $HTTP_CODE"
echo "📋 Response Body:"
echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"

echo ""

if [ "$HTTP_CODE" -eq 200 ]; then
    echo "✅ Edge Function call successful!"
    
    # Parse and display summary
    VESSELS_PROCESSED=$(echo "$RESPONSE_BODY" | jq -r '.summary.vesselsProcessed // "N/A"')
    POSITIONS_PROCESSED=$(echo "$RESPONSE_BODY" | jq -r '.summary.positionsProcessed // "N/A"')
    ERRORS=$(echo "$RESPONSE_BODY" | jq -r '.summary.errors // "N/A"')
    
    echo "📈 Summary:"
    echo "   Vessels processed: $VESSELS_PROCESSED"
    echo "   Positions processed: $POSITIONS_PROCESSED"
    echo "   Errors: $ERRORS"
    
    if [ "$ERRORS" != "0" ] && [ "$ERRORS" != "N/A" ]; then
        echo "⚠️  There were errors during processing. Check the response body above."
    fi
    
    echo ""
    echo "🔍 Verifying data update..."
    
    # Check if we can query the API to see updated data
    API_URL="http://localhost:3000/api/vessels"
    if curl -s "$API_URL" > /dev/null 2>&1; then
        LATEST_TIMESTAMP=$(curl -s "$API_URL" | jq -r '[.[] | .positions | max_by(.timestamp_utc) | .timestamp_utc] | max')
        echo "📅 Latest position timestamp: $LATEST_TIMESTAMP"
    else
        echo "⚠️  Could not verify data update (API not accessible)"
    fi
    
else
    echo "❌ Edge Function call failed!"
    echo "Check the response above for error details."
    exit 1
fi

echo ""
echo "🎉 Test completed successfully!"
echo "You can now proceed with setting up the GitHub Actions cron job."
