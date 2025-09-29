-- Database Optimization Script for Vessel Positions
-- Created: $(date)
-- Purpose: Fix timeout issues in useGroupedVesselPositions hook

-- ===================================================================
-- CRITICAL: Add missing indexes for timeout prevention
-- ===================================================================

-- 1. Composite index for vessel grouping queries (handles the timeout query)
-- This index supports: WHERE queries + ORDER BY timestamp_utc + LIMIT operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vessel_positions_timestamp_desc 
ON public.vessel_positions (timestamp_utc DESC);

-- 2. Optimized composite index for vessel-specific queries
-- Supports filtering by vessel + ordering by timestamp
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vessel_positions_gsf_timestamp_desc 
ON public.vessel_positions (gsf_vessel_id, timestamp_utc DESC);

-- 3. Partial index for active vessel positions only
-- Significantly reduces index size for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vessel_positions_recent_active 
ON public.vessel_positions (gsf_vessel_id, timestamp_utc DESC) 
WHERE timestamp_utc >= '2025-09-01'::timestamptz;

-- ===================================================================
-- PERFORMANCE OPTIMIZATION: Improve existing indexes
-- ===================================================================

-- 4. Improve vessels table query performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vessels_status_name 
ON public.vessels (status, name) 
WHERE status = 'active';

-- 5. Covering index for position queries (includes all needed columns)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vessel_positions_covering 
ON public.vessel_positions (
  gsf_vessel_id, 
  timestamp_utc DESC, 
  latitude, 
  longitude, 
  speed_knots, 
  speed_kmh, 
  course
);

-- ===================================================================
-- CLEANUP: Remove duplicate/inefficient indexes
-- ===================================================================

-- Check for duplicate indexes before removal (manual review needed)
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'vessel_positions'
ORDER BY indexname;

-- Note: Review manually before dropping duplicates:
-- - vessel_positions_unique vs unique_vessel_position (both exist)
-- - Consider dropping idx_vessel_positions_timestamp if timestamp_desc is better

-- ===================================================================
-- VACUUM AND STATS UPDATE
-- ===================================================================

-- Update table statistics for query planner
ANALYZE vessel_positions;
ANALYZE vessels;

-- Optional: Aggressive cleanup for heavily modified tables
-- VACUUM ANALYZE vessel_positions;

-- ===================================================================
-- VERIFICATION QUERIES
-- ===================================================================

-- Verify index usage with EXPLAIN analysis
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM vessel_positions 
ORDER BY timestamp_utc DESC 
LIMIT 1000;

-- Check index sizes
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(schemaname||'.'||indexname)) as size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'vessel_positions'
ORDER BY pg_relation_size(schemaname||'.'||indexname) DESC;
