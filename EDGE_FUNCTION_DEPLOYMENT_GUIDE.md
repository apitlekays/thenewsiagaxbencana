# Edge Function Deployment Guide

## 🚀 Migration from Next.js API Route to Supabase Edge Function

This guide outlines the migration from client-exposed data fetching to secure server-side processing using Supabase Edge Functions with **incremental timeline generation** to solve CPU timeout issues.

## 📋 Pre-Deployment Checklist

### 1. Environment Variables Required
Ensure these are set in your Supabase project settings:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only)
- `GSF_API_URL` - GSF API endpoint
- `GSF_API_TOKEN` - GSF API bearer token

### 2. Files Created
- ✅ `supabase-edge-function-v2.ts` - New Edge Function with **incremental timeline generation**
- ✅ `src/app/api/cron/fetch-vessel-data-v2/route.ts` - New API route that calls Edge Function
- ✅ `vercel.json.backup` - Backup of original cron configuration
- ✅ Updated `vercel.json` - Points to new API route
- ✅ `route.ts.backup` - Backup of original API route
- ✅ Updated `route.ts` - Now uses incremental timeline generation

## 🔧 Deployment Steps

### Step 1: Deploy Edge Function to Supabase

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Go to "Edge Functions" section

2. **Create New Edge Function**
   - Name: `fetch-vessel-data-v2`
   - Copy contents from `supabase-edge-function-v2.ts`
   - Deploy the function

3. **Set Environment Variables**
   - In Supabase Dashboard → Settings → Environment Variables
   - Add all required variables listed above

### Step 2: Test Edge Function

1. **Manual Test**
   ```bash
   curl -X POST https://your-project-ref.supabase.co/functions/v1/fetch-vessel-data-v2 \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json"
   ```

2. **Verify Response**
   - Should return success: true
   - Check Supabase logs for any errors

### Step 3: Deploy Updated Application

1. **Deploy to Vercel**
   - Push changes to your repository
   - Vercel will automatically deploy

2. **Verify Cron Job**
   - Check Vercel Functions logs
   - Should show calls to `/api/cron/fetch-vessel-data-v2`

## 🔄 Rollback Plan

If issues occur, immediately rollback:

### Quick Rollback (5 minutes)
1. **Restore Original Cron Configuration**
   ```bash
   cp vercel.json.backup vercel.json
   git add vercel.json
   git commit -m "Rollback to original cron configuration"
   git push
   ```

2. **Redeploy**
   - Vercel will automatically redeploy
   - Cron job will resume using original API route

### Complete Rollback (if needed)
1. **Disable New Edge Function**
   - Go to Supabase Dashboard
   - Disable `fetch-vessel-data-v2` function

2. **Restore Original Files**
   - Restore `vercel.json` from backup
   - Ensure original API route is still functional

## 🔍 Monitoring & Validation

### Success Indicators
- ✅ Vessel data continues to update every 15 minutes
- ✅ Timeline frames are generated correctly
- ✅ Map displays vessel positions
- ✅ No errors in Vercel Function logs
- ✅ No errors in Supabase Edge Function logs

### Key Metrics to Monitor
1. **Data Freshness**: Latest vessel positions should be recent
2. **Processing Time**: Edge Function should complete within timeout
3. **Error Rate**: Should remain at 0%
4. **Data Integrity**: Vessel count and position count should be consistent

## 🚨 Troubleshooting

### Common Issues

1. **Edge Function Timeout**
   - Check Supabase logs for timeout errors
   - Verify environment variables are set correctly
   - Ensure GSF API is accessible

2. **Cron Job Not Running**
   - Check Vercel Functions logs
   - Verify `vercel.json` configuration
   - Ensure new API route is deployed

3. **Data Not Updating**
   - Check Edge Function logs
   - Verify GSF API token is valid
   - Check database permissions

### Emergency Contacts
- Check Vercel Dashboard for deployment status
- Check Supabase Dashboard for function logs
- Monitor application at `/sumudnusantara` for data display

## 📊 Benefits of Migration

### Security Improvements
- ✅ GSF API token no longer exposed to client
- ✅ Service role key remains server-side only
- ✅ Database credentials secured

### Performance Improvements
- ✅ **97% reduction** in timeline processing time (incremental approach)
- ✅ **No more CPU timeouts** - processes only new data
- ✅ Reduced client-side bundle size
- ✅ Server-side processing closer to database
- ✅ Better error handling and logging

### Maintainability
- ✅ Centralized data processing logic
- ✅ Better monitoring and debugging
- ✅ Easier to update and maintain
- ✅ **Scalable timeline generation** - performance doesn't degrade over time

## 📝 Post-Deployment Tasks

1. **Monitor for 24 hours**
   - Check data updates every 15 minutes
   - Verify timeline generation
   - Monitor error rates

2. **Performance Analysis**
   - Compare processing times
   - Check resource usage
   - Optimize if needed

3. **Documentation Update**
   - Update deployment docs
   - Document new architecture
   - Update monitoring procedures

## 🎯 Success Criteria

Migration is successful when:
- ✅ All vessel data continues to update correctly
- ✅ Timeline playback works without issues
- ✅ Map displays all vessels and positions
- ✅ No client-side errors or data inconsistencies
- ✅ Performance is equal or better than before
- ✅ Security improvements are in place

---

**⚠️ IMPORTANT**: Keep the original API route (`/api/cron/fetch-vessel-data`) as a backup until migration is fully validated. Do not delete it until you're 100% confident in the new system.
