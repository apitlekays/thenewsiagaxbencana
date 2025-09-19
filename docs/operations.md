# Operations Guide

Last updated: 2025-01-19

## Data Ingestion Pipeline

### Overview
The application fetches vessel data from the GSF API every 15 minutes and stores it in Supabase. This process is automated via Vercel cron jobs.

### Components

#### 1. Vercel Cron Job
- **Schedule**: Every 15 minutes (`*/15 * * * *`)
- **Target**: `/api/cron/fetch-vessel-data`
- **Configuration**: Defined in `vercel.json`

#### 2. Next.js API Route
- **File**: `src/app/api/cron/fetch-vessel-data/route.ts`
- **Function**: Calls Supabase Edge Function with service role key
- **Error Handling**: Returns JSON response with success/error status

#### 3. Supabase Edge Function
- **Name**: `fetch-vessel-data`
- **Source**: Reference implementation in `supabase-edge-function.ts.txt`
- **Function**: 
  - Fetches data from GSF API
  - Parses vessel positions from JSON strings
  - Upserts vessels table (marks missing vessels as decommissioned)
  - Inserts vessel positions with proper vessel ID linking
  - Uses composite unique constraints to prevent duplicates

### Data Flow
```
GSF API → Supabase Edge Function → Supabase Database
    ↑                                    ↓
Vercel Cron → Next.js API Route → Realtime Updates → Frontend
```

### Monitoring & Troubleshooting

#### Success Indicators
- Vercel cron logs show successful API calls
- Supabase logs show Edge Function executions
- Frontend map displays vessel markers
- Dashboard shows updated vessel counts

#### Common Issues
1. **GSF API Rate Limits**: Edge Function includes error handling and retry logic
2. **Supabase Connection**: Check service role key and project URL
3. **RLS Policies**: Ensure public read access is enabled for vessels/positions tables
4. **Cron Failures**: Check Vercel project settings and environment variables

#### Debugging Steps
1. Check Vercel function logs for cron execution
2. Visit `/debug` page to verify Supabase connectivity
3. Check Supabase Edge Function logs for GSF API responses
4. Verify environment variables are set correctly

### Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (for Edge Function)
- `GSF_API_URL`: GSF API endpoint URL
- `GSF_API_TOKEN`: GSF API authentication token

⚠️ **SECURITY UPDATE**: All credentials have been moved to environment variables. See `docs/environment-variables.md` for setup guide.

### Database Schema
- **vessels**: Main vessel registry with current status and position
- **vessel_positions**: Historical position data with timestamps
- **user_roles**: Admin user management
- **incidents**: Incident tracking (if applicable)

### Security Considerations
- Service role key should only be used server-side
- GSF API token should be rotated regularly
- RLS policies prevent unauthorized data access
- Admin functions require proper authentication
