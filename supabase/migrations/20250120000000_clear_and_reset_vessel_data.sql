-- Migration: Clear and Reset Vessel Data
-- This migration will completely clear existing vessel and position data
-- Run this before populating with fresh GSF API data

-- Step 1: Clear vessel_positions table (due to foreign key constraint)
DELETE FROM vessel_positions;

-- Step 2: Clear vessels table
DELETE FROM vessels;

-- Step 3: Reset sequences to start from 1
ALTER SEQUENCE vessels_id_seq RESTART WITH 1;
ALTER SEQUENCE vessel_positions_id_seq RESTART WITH 1;

-- Step 4: Add indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_vessel_positions_vessel_id ON vessel_positions(vessel_id);
CREATE INDEX IF NOT EXISTS idx_vessel_positions_timestamp ON vessel_positions(timestamp_utc);
CREATE INDEX IF NOT EXISTS idx_vessel_positions_gsf_vessel_id ON vessel_positions(gsf_vessel_id);
CREATE INDEX IF NOT EXISTS idx_vessels_gsf_id ON vessels(gsf_id);
CREATE INDEX IF NOT EXISTS idx_vessels_status ON vessels(status);

-- Step 5: Add unique constraint to prevent duplicate positions
ALTER TABLE vessel_positions 
ADD CONSTRAINT unique_vessel_position 
UNIQUE (gsf_vessel_id, timestamp_utc);
