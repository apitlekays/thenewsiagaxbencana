# Environment Variables Template

Last updated: 2025-01-19

## Required Environment Variables

Copy this template to `.env.local` for local development, and add these variables to your Vercel project settings for production.

### Supabase Configuration
```bash
# Supabase Project URL (public)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url

# Supabase Anonymous Key (public)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase Service Role Key (server-side only - keep secret!)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Supabase Edge Function URL (for server-to-server calls)
SUPABASE_EDGE_FUNCTION_URL=https://your-project-ref.supabase.co/functions/v1/fetch-vessel-data-v2
```

### GSF API Configuration
```bash
# GSF API Endpoint
GSF_API_URL=https://data.forensic-architecture.org/items/freedom_flotilla_vessels?limit=-1

# GSF API Authentication Token (keep secret!)
GSF_API_TOKEN=your_gsf_api_token
```

### Map Configuration
```bash
# Stadia Maps Style URL (public)
STADIA_MAPS_STYLE_URL=https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json
```

## Security Notes

⚠️ **IMPORTANT SECURITY CONSIDERATIONS:**

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Rotate exposed keys** - If any keys were previously exposed in the repository, rotate them immediately
3. **Service Role Key** - Only use server-side, never expose to client
4. **GSF API Token** - Keep secret, rotate regularly
5. **Vercel Environment Variables** - Set for both Preview and Production environments

## Setting Up Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable for **Production**, **Preview**, and **Development** environments
4. Redeploy your project after adding variables

## Local Development Setup

1. Copy this template to `.env.local`
2. Replace placeholder values with actual credentials
3. Run `npm run dev` to start development server

## Verification

After setting up environment variables:
- Visit `/debug` to verify Supabase connectivity
- Check Vercel function logs for successful cron executions
- Verify map loads correctly at `/sumudnusantara`
