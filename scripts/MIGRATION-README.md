# Google Sheets to Supabase Migration Guide

This guide will help you migrate attack status and incidents data from Google Sheets to Supabase to eliminate CORS issues and rate limiting.

## Why Migrate?

- **CORS Issues**: Google Sheets CSV endpoints cause CORS errors under high traffic
- **Rate Limiting**: Google Sheets APIs have strict rate limits (429 errors)
- **Performance**: Direct database queries are faster than external API calls
- **Reliability**: Supabase provides better uptime and error handling

## Migration Steps

### Step 1: Export Data from Google Sheets

Run the data export script to extract data from Google Sheets:

```bash
cd scripts
node export-sheets-data.js
```

This will:
- Fetch data from both Google Sheets URLs
- Parse the CSV data
- Generate SQL INSERT statements
- Save output to `migration-attack-status.sql` and `migration-incidents.sql`

### Step 2: Create Tables in Supabase

In the Supabase SQL editor, run the table creation script:

```sql
-- Copy and paste the entire content of migrate-google-sheets-to-supabase.sql
-- This creates the attack_status and incidents_reports tables
```

### Step 3: Insert Data

Copy the generated SQL from Step 1 and run it in Supabase:

```sql
-- Run the attack status data SQL
-- Run the incidents data SQL
```

### Step 4: Update the Application

Replace the Google Sheets hooks with Supabase versions:

#### For Attack Status:
```typescript
// Replace this import:
import { useAttackStatus } from '@/hooks/useAttackStatus';

// With this:
import { useAttackStatusSupabase as useAttackStatus } from '@/hooks/useAttackStatusSupabase';
```

#### For Incidents:
```typescript
// Replace this import:
import { useIncidentsData } from '@/hooks/useIncidentsData';

// With this:
import { useIncidentsDataSupabase as useIncidentsData } from '@/hooks/useIncidentsDataSupabase';
```

### Step 5: Remove Google Sheets API Routes

Delete these files since they're no longer needed:
- `src/app/api/attack-status/route.ts`
- `src/app/api/incidents/route.ts`

## Data Structure

### Attack Status Table
```sql
CREATE TABLE attack_status (
    id BIGSERIAL PRIMARY KEY,
    vessel_name TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('attacked', 'emergency')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Incidents Reports Table
```sql
CREATE TABLE incidents_reports (
    id BIGSERIAL PRIMARY KEY,
    datetime TIMESTAMPTZ NOT NULL,
    notes_published TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Security (Row Level Security)

Both tables have RLS enabled with these policies:

- **Read Access**: Public (anyone can read)
- **Write Access**: Authenticated users only
- **Unique Constraints**: Attack status is unique by vessel name

## Testing

After migration, verify:

1. **Attack Status**: Check that attacked/emergency vessels show correct status
2. **Incidents**: Verify incidents drawer loads and displays data
3. **Real-time Updates**: Confirm both systems update in real-time
4. **Performance**: Check that app loads faster without CORS delays

## Monitoring

Monitor these metrics after migration:

- **Error Rates**: Should drop significantly
- **Load Times**: Should improve due to direct database access
- **API Calls**: Monitor Supabase usage vs Google Sheets limits
- **User Experience**: Verify no more CORS/rate limit errors

## Rollback Plan

If issues arise, you can:

1. **Temporary**: Re-enable Google Sheets hooks by reverting imports
2. **Permanent**: Restore Google Sheets API routes if needed

## Data Updates

For future data updates:

### Attack Status:
```sql
UPDATE attack_status 
SET status = 'emergency', updated_at = NOW() 
WHERE vessel_name = 'Vessel Name';
```

### Incidents:
```sql
INSERT INTO incidents_reports (datetime, notes_published) 
VALUES ('2024-01-15 14:30:00+00', 'New incident report');
```

## Benefits After Migration

- ✅ **No More CORS Issues**: Direct database access eliminates CORS errors
- ✅ **No Rate Limiting**: Supabase has much higher quotas
- ✅ **Better Performance**: Faster queries without external API calls
- ✅ **Improved Reliability**: Better error handling and retry logic
- ✅ **Real-time Updates**: Supabase real-time subscriptions work seamlessly
- ✅ **Easier Management**: Direct database access for data updates

## Support

If you encounter issues:

1. Check Supabase logs for database errors
2. Verify RLS policies are properly configured
3. Test with simple SQL queries in Supabase SQL editor
4. Check network connectivity and API keys

The migration eliminates the Google Sheets bottleneck and provides a more reliable, performant solution.
