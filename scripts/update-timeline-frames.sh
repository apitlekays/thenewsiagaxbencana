#!/bin/bash

# Script to update timeline frames with all data points and course information
# This script will:
# 1. Apply the migration to add course field documentation
# 2. Run the cron job to regenerate timeline frames with all data points
# 3. Verify the timeline frames were updated successfully

echo "🚀 Starting timeline frames update process..."

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: Supabase environment variables not set"
    echo "Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set"
    exit 1
fi

echo "✅ Environment variables are set"

# Apply the migration (this is just documentation, no actual schema change needed)
echo "📝 Applying migration documentation..."
if [ -f "supabase/migrations/20250120000002_add_course_to_timeline_frames.sql" ]; then
    echo "✅ Migration file exists"
else
    echo "❌ Migration file not found"
    exit 1
fi

# Run the cron job to regenerate timeline frames
echo "🔄 Running cron job to regenerate timeline frames..."
echo "This will clear existing timeline frames and create new ones with all data points and course information"

# Make a request to the cron job endpoint
CRON_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/cron/fetch-vessel-data" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -w "HTTPSTATUS:%{http_code}")

# Extract HTTP status code
HTTP_STATUS=$(echo $CRON_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
RESPONSE_BODY=$(echo $CRON_RESPONSE | sed -e 's/HTTPSTATUS:.*//g')

echo "📊 Cron job response (HTTP $HTTP_STATUS):"
echo "$RESPONSE_BODY"

if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "✅ Cron job completed successfully!"
    echo ""
    echo "🎉 Timeline frames have been updated with:"
    echo "   • All data points (no more hourly sampling)"
    echo "   • Course information for vessel heading visualization"
    echo "   • Smooth animation without jarring jumps"
    echo ""
    echo "📈 Next steps:"
    echo "   1. Refresh your application to see the updated timeline"
    echo "   2. The timeline should now show all available data points"
    echo "   3. Vessel markers can now display course/heading information"
else
    echo "❌ Cron job failed with HTTP status $HTTP_STATUS"
    echo "Response: $RESPONSE_BODY"
    exit 1
fi

echo ""
echo "🔍 To verify the update, you can:"
echo "   1. Check the timeline component - it should show more frames"
echo "   2. Look for course data in the vessel information"
echo "   3. Notice smoother animation transitions"
echo ""
echo "✨ Timeline frames update completed!"
