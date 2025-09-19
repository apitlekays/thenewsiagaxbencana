# Data Reset and Population Guide

This guide will help you completely reset your Supabase database and populate it with fresh data from the GSF API.

## Prerequisites

1. **Environment Variables**: Make sure you have these set in your `.env.local` file:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   GSF_API_URL=your_gsf_api_url
   GSF_API_TOKEN=your_gsf_api_token
   ```

2. **Supabase CLI**: Install and configure Supabase CLI if you haven't already:
   ```bash
   npm install -g supabase
   supabase login
   ```

## Step-by-Step Process

### Step 1: Clear Existing Data

**Option A: Using Supabase Migration (Recommended)**
```bash
# Apply the migration to clear all data
supabase db push
```

**Option B: Manual SQL (if migration doesn't work)**
```sql
-- Run this in your Supabase SQL editor
DELETE FROM vessel_positions;
DELETE FROM vessels;
ALTER SEQUENCE vessels_id_seq RESTART WITH 1;
ALTER SEQUENCE vessel_positions_id_seq RESTART WITH 1;
```

### Step 2: Populate Fresh Data

**Option A: Using the Script (Recommended)**
```bash
# Run the population script
npm run populate-data
```

**Option B: Using the Cron Job**
```bash
# Start your Next.js development server
npm run dev

# In another terminal, trigger the cron job
npm run fetch-data
```

### Step 3: Verify Data

Check your Supabase dashboard to verify:
- All vessels are populated
- Position data is complete
- Latest timestamps are current

## Scripts Available

- `npm run populate-data` - Populate data using the comprehensive script
- `npm run fetch-data` - Trigger the cron job to fetch data
- `npm run reset-data` - Complete reset and population (if you have the reset script)

## Expected Results

After successful completion, you should see:
- **50+ vessels** in the vessels table
- **15,000+ position records** in vessel_positions table
- **Complete date coverage** from September 1st to September 19th, 2025
- **All vessels marked as 'active'** status

## Troubleshooting

### Common Issues

1. **Environment Variables Missing**
   - Check your `.env.local` file
   - Ensure all required variables are set

2. **Permission Errors**
   - Make sure you're using the service role key, not the anon key
   - Check RLS policies if you have them enabled

3. **GSF API Errors**
   - Verify your GSF API credentials
   - Check if the API endpoint is accessible

4. **Database Connection Issues**
   - Verify your Supabase URL and keys
   - Check if your Supabase project is active

### Verification Queries

Run these queries in your Supabase SQL editor to verify the data:

```sql
-- Check vessel count
SELECT COUNT(*) as vessel_count FROM vessels WHERE status = 'active';

-- Check position count
SELECT COUNT(*) as position_count FROM vessel_positions;

-- Check date range
SELECT 
  MIN(timestamp_utc) as earliest,
  MAX(timestamp_utc) as latest
FROM vessel_positions;

-- Check vessels with positions
SELECT 
  v.name,
  COUNT(vp.id) as position_count
FROM vessels v
LEFT JOIN vessel_positions vp ON v.id = vp.vessel_id
WHERE v.status = 'active'
GROUP BY v.id, v.name
ORDER BY position_count DESC;
```

## Ongoing Maintenance

After the initial population, your cron job should maintain the data:

1. **Cron Job**: Runs automatically to fetch new data
2. **Edge Function**: Processes and stores the data
3. **Monitoring**: Check logs for any errors

## Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify all environment variables are correct
3. Ensure your Supabase project has the correct permissions
4. Check the GSF API status and credentials
