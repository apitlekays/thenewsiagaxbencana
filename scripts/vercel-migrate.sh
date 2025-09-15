#!/bin/bash

# Vercel Migration Quick Start Script
# This script helps you quickly migrate to Vercel

echo "🚀 Vercel Migration Quick Start"
echo "=============================="

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository. Please run this script from your project root."
    exit 1
fi

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "✅ Vercel CLI is ready"

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel:"
    vercel login
fi

echo "✅ Logged in to Vercel"

# Check if project is already linked
if [ -f ".vercel/project.json" ]; then
    echo "📁 Project is already linked to Vercel"
    echo "Current project: $(cat .vercel/project.json | jq -r '.name')"
else
    echo "🔗 Linking project to Vercel..."
    vercel link
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Set environment variables in Vercel dashboard:"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY" 
echo "   - NEXT_PUBLIC_APP_VERSION"
echo ""
echo "2. Deploy to Vercel:"
echo "   vercel --prod"
echo ""
echo "3. Or deploy from Vercel dashboard by pushing to GitHub"
echo ""
echo "📚 For detailed instructions, see VERCEL_MIGRATION.md"
