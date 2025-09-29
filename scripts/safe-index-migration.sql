-- Safe Migration Script for Index Optimization
-- Purpose: Apply indexes without production downtime
-- Run each section separately with verification

-- ===================================================================
-- SECTION 1: Create critical indexes (safe, concurrent)
-- ===================================================================

BEGIN;

-- Monitor progress
SELECT 
  'Index creation started at: ' || now() as start_time,
  'Current vessel_positions count: ' || COUNT(*) as row_count
FROM vessel_positions;

-- Most critical index for the timeout fix
CREATE INDEX CONCURRENTLY idx_vessel_positions_recent_data
ON public.vessel_positions (timestamp_utc DESC, gsf_vessel_id, latitude, longitude, speed_knots, course);

-- Wait for completion (check in another session)
SELECT pg_size_pretty(pg_relation_size('idx_vessel_positions_recent_data')) as new_index_size;

COMMIT;

-- ===================================================================
-- SECTION 2: Verify index performance (run separately)
-- ===================================================================

-- Test the actual problematic query with EXPLAIN
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT 
  vp.id, 
  vp.vessel_id, 
  vp.gsf_vessel_id, 
  vp.latitude, 
  vp.longitude, 
  vp.speed_kmh, 
  vp.speed_knots, 
  vp.course, 
  vp.timestamp_utc, 
  vp.created_at
FROM vessel_positions vp
ORDER BY vp.timestamp_utc ASC
LIMIT 50000;

-- Benchmark: Compare query times before/after
SELECT 
  'Query test passed at: ' || now() as verification_time,
  'Rows in result: ' || COUNT(*) as test_row_count
FROM (
  SELECT * FROM vessel_positions 
  ORDER BY timestamp_utc ASC 
  LIMIT 1000
) test_limit;

-- ===================================================================
-- SECTION 3: Cleanup old data (if needed)
-- ===================================================================

-- Optional: Archive old data to improve performance
-- Note: Only run if data retention allows

/*
BEGIN;

-- Create archive table for positions older than 30 days
CREATE TABLE IF NOT EXISTS vessel_positions_archive (
  LIKE vessel_positions INCLUDING ALL
);

-- Move old data (adjust date as needed)
INSERT INTO vessel_positions_archive 
SELECT * FROM vessel_positions 
WHERE timestamp_utc < NOW() - INTERVAL '30 days';

-- Delete moved data
DELETE FROM vessel_positions 
WHERE timestamp_utc < NOW() - INTERVAL '30 days';

-- Verify cleanup
SELECT 
  'Remaining positions count: ' || COUNT(*) as current_count,
  'Archived positions: ' || (SELECT COUNT(*) FROM vessel_positions_archive) as archived_count
FROM vessel_positions;

COMMIT;
*/

-- ===================================================================
-- SECTION 4: Performance monitoring setup
-- ===================================================================

-- Enable slow query logging (Supabase dashboard setting)
-- Useful for monitoring query performance

-- Create a function to check query performance
CREATE OR REPLACE FUNCTION analyze_vessel_positions_performance()
RETURNS TABLE (
  query_info text,
  execution_info text
) AS $$
DECLARE
  start_time timestamp;
  end_time timestamp;
BEGIN
  start_time := clock_timestamp();
  
  PERFORM * FROM vessel_positions 
  ORDER BY timestamp_utc DESC 
  LIMIT 100;
  
  end_time := clock_timestamp();
  
  RETURN QUERY SELECT 
    'Vessel positions query'::text,
    'Execution time: ' || (end_time - start_time)::text;
END;
$$ LANGUAGE plpgsql;

-- Test the performance function
SELECT * FROM analyze_vessel_positions_performance();

-- ===================================================================
-- SECTION 5: Final verification
-- ===================================================================

-- Recheck all indexes
SELECT 
  indexname,
  indexdef,
  pg_size_pretty(pg_relation_size(schemaname||'.'||indexname)) as size
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'vessel_positions'
ORDER BY pg_relation_size(schemaname||'.'||indexname) DESC;

-- Final table statistics
SELECT 
  'Final table size: ' || pg_size_pretty(pg_total_relation_size('vessel_positions')) as size_info,
  'Earliest position: ' || MIN(timestamp_utc)::text as data_range_start,
  'Latest position: ' || MAX(timestamp_utc)::text as data_range_end
FROM vessel_positions;
