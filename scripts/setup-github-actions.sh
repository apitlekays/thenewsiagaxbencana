#!/bin/bash

# GitHub Actions Setup Script for Vessel Data Fetching
# This script helps you set up the required environment variables in your GitHub repository

echo "🚢 Setting up GitHub Actions for Vessel Data Fetching"
echo "=================================================="

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository. Please run this script from your project root."
    exit 1
fi

# Get repository information
REPO_URL=$(git remote get-url origin 2>/dev/null)
if [ -z "$REPO_URL" ]; then
    echo "❌ Error: No git remote found. Please add a GitHub remote."
    exit 1
fi

echo "📋 Repository: $REPO_URL"
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "📄 Found .env.local file"
    
    # Extract Supabase variables
    SUPABASE_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL" .env.local | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    SUPABASE_ANON_KEY=$(grep "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    
    if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_ANON_KEY" ]; then
        echo "✅ Found Supabase credentials in .env.local"
        echo ""
        echo "🔧 Next steps:"
        echo "1. Go to your GitHub repository: https://github.com/$(echo $REPO_URL | sed 's/.*github.com[:/]\([^.]*\).*/\1/')"
        echo "2. Click on 'Settings' tab"
        echo "3. Click on 'Secrets and variables' → 'Actions'"
        echo "4. Click 'New repository secret' and add these secrets:"
        echo ""
        echo "   Secret Name: SUPABASE_URL"
        echo "   Secret Value: $SUPABASE_URL"
        echo ""
        echo "   Secret Name: SUPABASE_ANON_KEY"
        echo "   Secret Value: $SUPABASE_ANON_KEY"
        echo ""
        echo "5. After adding the secrets, the workflow will automatically start running every 15 minutes"
        echo ""
        echo "🧪 To test manually:"
        echo "   - Go to 'Actions' tab in your repository"
        echo "   - Click on 'Fetch Vessel Data' workflow"
        echo "   - Click 'Run workflow' button"
    else
        echo "❌ Missing Supabase credentials in .env.local"
        echo "Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set"
    fi
else
    echo "❌ No .env.local file found"
    echo "Please create .env.local with your Supabase credentials:"
    echo ""
    echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key"
fi

echo ""
echo "📚 Additional Information:"
echo "- The workflow runs every 15 minutes"
echo "- You can manually trigger it from the GitHub Actions tab"
echo "- Check the logs in GitHub Actions to monitor the data fetching"
echo "- The Edge Function 'fetch-vessel-data' must be deployed and active in Supabase"
