-- ==============================================
-- NAVIONICS MALFUNCTION DATA CLEANUP SCRIPT
-- ==============================================
-- 
-- Purpose: Remove vessel position data that was corrupted due to Navionics malfunction
-- Date: 2025-10-01
-- Issue: Vessels "jumped" to inland coordinates (Egypt mainland) instead of staying at sea
-- 
-- Affected Coordinates:
-- - Latitude: 32.2-32.4 (should be around 31.5 for Mediterranean operations)
-- - Longitude: 31.5-31.7 (should be around 34.4 for Gaza area)
-- - These coordinates are deep in Egypt's mainland, not at sea
--
-- Records to Clean:
-- - vessel_positions: 62 affected records
-- - vessels: 45 affected records
-- 
-- WARNING: This script will permanently delete malfunction data
-- Review the coordinates and time range before executing
-- 
-- ==============================================

-- ==============================================
-- SECTION 1: BACKUP QUERY (Run this first to backup affected data)
-- ==============================================
-- Uncomment and run this section first to create backups

/*
-- Backup affected vessel_positions records
CREATE TABLE vessel_positions_malfunction_backup AS
SELECT vp.*, v.name as vessel_name
FROM vessel_positions vp
JOIN vessels v ON vp.vessel_id = v.id
WHERE 
    vp.created_at >= NOW() - INTERVAL '15 minutes'
    AND (
        vp.latitude > 32.2 
        OR vp.longitude < 32.0
        OR vp.latitude < 30.0
        OR vp.longitude > 36.0
    );

-- Backup affected vessels records
CREATE TABLE vessels_malfunction_backup AS
SELECT *
FROM vessels v
WHERE 
    v.updated_at >= NOW() - INTERVAL '15 minutes'
    AND (
        v.latitude > 32.2 
        OR v.longitude < 32.0
        OR v.latitude < 30.0
        OR v.longitude > 36.0
    );
*/

-- ==============================================
-- SECTION 2: VERIFICATION QUERIES
-- ==============================================
-- Run these to verify the data before deletion

-- Check vessel_positions malfunction data
SELECT 
    'vessel_positions' as table_name,
    COUNT(*) as affected_records,
    MIN(vp.created_at) as earliest_created,
    MAX(vp.created_at) as latest_created,
    STRING_AGG(DISTINCT v.name, ', ') as affected_vessels
FROM vessel_positions vp
JOIN vessels v ON vp.vessel_id = v.id
WHERE 
    vp.created_at >= NOW() - INTERVAL '15 minutes'
    AND (
        vp.latitude > 32.2 
        OR vp.longitude < 32.0
        OR vp.latitude < 30.0
        OR vp.longitude > 36.0
    );

-- Check vessels table malfunction data
SELECT 
    'vessels' as table_name,
    COUNT(*) as affected_records,
    MIN(v.updated_at) as earliest_updated,
    MAX(v.updated_at) as latest_updated,
    STRING_AGG(DISTINCT v.name, ', ') as affected_vessels
FROM vessels v
WHERE 
    v.updated_at >= NOW() - INTERVAL '15 minutes'
    AND (
        v.latitude > 32.2 
        OR v.longitude < 32.0
        OR v.latitude < 30.0
        OR v.longitude > 36.0
    );

-- Sample of malfunction coordinates
SELECT 
    v.name,
    vp.latitude,
    vp.longitude,
    vp.timestamp_utc,
    vp.created_at,
    -- Calculate distance from Gaza port (should be ~270km for inland positions)
    SQRT(
        POWER((vp.latitude::float - 31.522727) * 111.32, 2) + 
        POWER((vp.longitude::float - 34.431667) * 111.32 * COS(RADIANS(31.522727)), 2)
    ) as distance_from_gaza_km
FROM vessel_positions vp
JOIN vessels v ON vp.vessel_id = v.id
WHERE 
    vp.created_at >= NOW() - INTERVAL '15 minutes'
    AND (
        vp.latitude > 32.2 
        OR vp.longitude < 32.0
    )
ORDER BY vp.created_at DESC
LIMIT 10;

-- ==============================================
-- SECTION 3: CLEANUP OPERATIONS
-- ==============================================
-- Execute these to remove the malfunction data

-- Delete malfunction records from vessel_positions table
DELETE FROM vessel_positions 
WHERE id IN (
    SELECT vp.id
    FROM vessel_positions vp
    JOIN vessels v ON vp.vessel_id = v.id
    WHERE 
        vp.created_at >= NOW() - INTERVAL '15 minutes'
        AND (
            vp.latitude > 32.2 
            OR vp.longitude < 32.0
            OR vp.latitude < 30.0
            OR vp.longitude > 36.0
        )
);

-- Reset vessel positions to their last known good positions
-- This will set the vessels back to their previous valid coordinates
UPDATE vessels 
SET 
    latitude = (
        SELECT vp.latitude 
        FROM vessel_positions vp 
        WHERE vp.vessel_id = vessels.id 
        AND vp.created_at < NOW() - INTERVAL '15 minutes'
        AND vp.latitude <= 32.2 
        AND vp.longitude >= 32.0
        AND vp.latitude >= 30.0
        AND vp.longitude <= 36.0
        ORDER BY vp.created_at DESC 
        LIMIT 1
    ),
    longitude = (
        SELECT vp.longitude 
        FROM vessel_positions vp 
        WHERE vp.vessel_id = vessels.id 
        AND vp.created_at < NOW() - INTERVAL '15 minutes'
        AND vp.latitude <= 32.2 
        AND vp.longitude >= 32.0
        AND vp.latitude >= 30.0
        AND vp.longitude <= 36.0
        ORDER BY vp.created_at DESC 
        LIMIT 1
    ),
    timestamp_utc = (
        SELECT vp.timestamp_utc 
        FROM vessel_positions vp 
        WHERE vp.vessel_id = vessels.id 
        AND vp.created_at < NOW() - INTERVAL '15 minutes'
        AND vp.latitude <= 32.2 
        AND vp.longitude >= 32.0
        AND vp.latitude >= 30.0
        AND vp.longitude <= 36.0
        ORDER BY vp.created_at DESC 
        LIMIT 1
    ),
    updated_at = NOW()
WHERE 
    updated_at >= NOW() - INTERVAL '15 minutes'
    AND (
        latitude > 32.2 
        OR longitude < 32.0
        OR latitude < 30.0
        OR longitude > 36.0
    );

-- ==============================================
-- SECTION 4: VERIFICATION AFTER CLEANUP
-- ==============================================
-- Run these to verify the cleanup was successful

-- Check if any malfunction data remains in vessel_positions
SELECT 
    COUNT(*) as remaining_malfunction_records
FROM vessel_positions vp
JOIN vessels v ON vp.vessel_id = v.id
WHERE 
    vp.created_at >= NOW() - INTERVAL '15 minutes'
    AND (
        vp.latitude > 32.2 
        OR vp.longitude < 32.0
        OR vp.latitude < 30.0
        OR vp.longitude > 36.0
    );

-- Check if any malfunction data remains in vessels table
SELECT 
    COUNT(*) as remaining_malfunction_records
FROM vessels v
WHERE 
    v.updated_at >= NOW() - INTERVAL '15 minutes'
    AND (
        v.latitude > 32.2 
        OR v.longitude < 32.0
        OR v.latitude < 30.0
        OR v.longitude > 36.0
    );

-- Show current vessel positions (should be back to sea coordinates)
SELECT 
    v.name,
    v.latitude,
    v.longitude,
    v.timestamp_utc,
    v.updated_at,
    -- Calculate distance from Gaza port (should be reasonable for sea operations)
    SQRT(
        POWER((v.latitude::float - 31.522727) * 111.32, 2) + 
        POWER((v.longitude::float - 34.431667) * 111.32 * COS(RADIANS(31.522727)), 2)
    ) as distance_from_gaza_km
FROM vessels v
WHERE v.status = 'active'
ORDER BY v.updated_at DESC
LIMIT 20;

-- ==============================================
-- SECTION 5: ROLLBACK INSTRUCTIONS (if needed)
-- ==============================================
-- If you need to rollback the cleanup, uncomment and run:

/*
-- Restore from backup tables (if you created them)
INSERT INTO vessel_positions 
SELECT * FROM vessel_positions_malfunction_backup;

INSERT INTO vessels 
SELECT * FROM vessels_malfunction_backup;

-- Drop backup tables after successful rollback
DROP TABLE IF EXISTS vessel_positions_malfunction_backup;
DROP TABLE IF EXISTS vessels_malfunction_backup;
*/

-- ==============================================
-- EXECUTION SUMMARY
-- ==============================================
-- 
-- 1. Run SECTION 2 (Verification Queries) to confirm the data
-- 2. Optionally run SECTION 1 (Backup) to create backups
-- 3. Run SECTION 3 (Cleanup Operations) to remove malfunction data
-- 4. Run SECTION 4 (Verification After Cleanup) to confirm success
-- 
-- Expected Results:
-- - vessel_positions: 62 records deleted
-- - vessels: 45 records updated with last known good positions
-- - All vessels should return to valid sea coordinates
-- - Pathways should no longer show lines going inland
-- 
-- ==============================================
