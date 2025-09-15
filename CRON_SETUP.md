# Vessel Data Fetching Cron Job Setup

This document explains how to set up automatic periodic fetching of vessel data from the GSF API using GitHub Actions.

## Overview

The system uses a Supabase Edge Function (`fetch-vessel-data`) that fetches vessel and position data from the GSF API and stores it in the Supabase database. To ensure the data stays current, this function needs to be called periodically.

## Architecture

```
GitHub Actions (Cron) → Supabase Edge Function → GSF API → Supabase Database
```

## Setup Instructions

### 1. Prerequisites

- GitHub repository with Actions enabled
- Supabase project with the `fetch-vessel-data` Edge Function deployed
- Supabase credentials (URL and Anon Key)

### 2. Quick Setup

Run the setup script from your project root:

```bash
./scripts/setup-github-actions.sh
```

This script will:
- Check if you're in a git repository
- Extract Supabase credentials from `.env.local`
- Provide step-by-step instructions for setting up GitHub secrets

### 3. Manual Setup

If you prefer to set up manually:

#### Step 1: Add GitHub Secrets

1. Go to your GitHub repository
2. Click on **Settings** tab
3. Click on **Secrets and variables** → **Actions**
4. Click **New repository secret** and add:

   **Secret Name:** `SUPABASE_URL`
   **Secret Value:** Your Supabase project URL (e.g., `https://your-project.supabase.co`)

   **Secret Name:** `SUPABASE_ANON_KEY`
   **Secret Value:** Your Supabase anon key

#### Step 2: Verify Workflow File

Ensure the workflow file exists at `.github/workflows/fetch-vessel-data.yml`. The workflow:
- Runs every 15 minutes (`*/15 * * * *`)
- Can be triggered manually
- Calls the `fetch-vessel-data` Edge Function
- Provides detailed logging

### 4. Testing

#### Manual Trigger

1. Go to **Actions** tab in your GitHub repository
2. Click on **Fetch Vessel Data** workflow
3. Click **Run workflow** button
4. Check the logs to ensure it's working

#### Verify Data Update

Check your Supabase database to confirm new data is being fetched:

```sql
SELECT MAX(updated_at) as last_vessel_update FROM vessels;
SELECT MAX(timestamp_utc) as last_position_update FROM vessel_positions;
```

## Configuration Options

### Frequency

The current setup fetches data every 15 minutes. To change this, modify the cron expression in `.github/workflows/fetch-vessel-data.yml`:

```yaml
schedule:
  - cron: '*/15 * * * *'  # Every 15 minutes
  - cron: '0 */1 * * *'  # Every hour
  - cron: '0 */6 * * *'  # Every 6 hours
```

### Edge Function URL

The workflow automatically constructs the Edge Function URL using:
```
${SUPABASE_URL}/functions/v1/fetch-vessel-data
```

## Monitoring

### GitHub Actions Logs

- Go to **Actions** tab in your repository
- Click on **Fetch Vessel Data** workflow runs
- Check logs for success/failure status
- Look for response summaries showing vessels and positions processed

### Supabase Logs

Check Edge Function logs in Supabase Dashboard:
1. Go to **Edge Functions** in your Supabase project
2. Click on `fetch-vessel-data`
3. Check the **Logs** tab for execution details

### Database Monitoring

Monitor data freshness:

```sql
-- Check last update times
SELECT 
  MAX(updated_at) as last_vessel_update,
  MAX(timestamp_utc) as last_position_update
FROM vessels v
JOIN vessel_positions vp ON v.gsf_id = vp.gsf_vessel_id;

-- Check data volume
SELECT COUNT(*) as total_positions FROM vessel_positions;
```

## Troubleshooting

### Common Issues

1. **Edge Function not found (404)**
   - Verify the Edge Function is deployed in Supabase
   - Check the function name matches exactly: `fetch-vessel-data`

2. **Authentication failed (401)**
   - Verify `SUPABASE_ANON_KEY` is correct
   - Ensure the key has proper permissions

3. **GSF API errors**
   - Check if `GSF_API_URL` and `GSF_API_TOKEN` are set in Supabase Edge Function environment
   - Verify the GSF API is accessible

4. **No data updates**
   - Check GitHub Actions logs for errors
   - Verify the cron schedule is working
   - Check Supabase Edge Function logs

### Debug Commands

```bash
# Test Edge Function manually
curl -X POST \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  "YOUR_SUPABASE_URL/functions/v1/fetch-vessel-data"

# Check recent data
curl -s "YOUR_API_URL/api/vessels" | jq '[.[] | .positions | max_by(.timestamp_utc) | .timestamp_utc] | max'
```

## Security Notes

- GitHub secrets are encrypted and only accessible to the repository
- The Supabase anon key is safe to use in GitHub Actions
- Edge Function uses service role key internally (not exposed to GitHub)

## Cost Considerations

- GitHub Actions: Free for public repositories, 2000 minutes/month for private
- Supabase Edge Functions: Check your plan limits
- GSF API: Check your API usage limits

## Alternative Solutions

If GitHub Actions doesn't work for your setup, consider:

1. **Vercel Cron Jobs** (if using Vercel)
2. **Railway Cron Jobs** (if using Railway)
3. **External cron services** (cron-job.org, etc.)
4. **Supabase pg_cron** (if available in your plan)

## Support

For issues with this setup:
1. Check GitHub Actions logs
2. Check Supabase Edge Function logs
3. Verify all environment variables are set correctly
4. Test the Edge Function manually first
