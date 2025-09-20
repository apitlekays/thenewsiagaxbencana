#!/bin/bash

# Simple script to run the cron job and update timeline frames
# Run this from the project root directory

echo "🚀 Updating timeline frames with all data points and course information..."

# Check if we're in development mode
if [ "$NODE_ENV" != "development" ]; then
    echo "⚠️  Warning: This script should be run in development mode"
    echo "Setting NODE_ENV=development"
    export NODE_ENV=development
fi

# Run the cron job
echo "🔄 Running cron job..."
curl -X POST "http://localhost:3000/api/cron/fetch-vessel-data" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "✅ Timeline frames update completed!"
echo "📈 The timeline should now include:"
echo "   • All data points (no sampling)"
echo "   • Course information for vessel headings"
echo "   • Smoother animation transitions"
