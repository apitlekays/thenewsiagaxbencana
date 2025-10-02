-- FINAL WORKING VERSION: Latest vessel data function (zero column conflicts)
-- Run this in Supabase SQL Editor

BEGIN;

-- Drop any existing function
DROP FUNCTION IF EXISTS get_latest_vessel_data();

-- Create function with zero ambiguous column references
CREATE OR REPLACE FUNCTION get_latest_vessel_data()
RETURNS TABLE(
  vessel_id BIGINT,
  gsf_vessel_id BIGINT,
  vessel_name TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  speed_knots NUMERIC,
  speed_kmh NUMERIC,
  course NUMERIC,
  timestamp_utc TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  origin TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_per_vessel AS (
    SELECT DISTINCT ON (vp.gsf_vessel_id) 
      vp.id as pos_table_id,
      vp.gsf_vessel_id,
      v.name as vessel_table_name,
      vp.latitude,
      vp.longitude,
      vp.speed_knots,
      vp.speed_kmh,
      vp.course,
      vp.timestamp_utc,
      vp.created_at,
      COALESCE(v.origin, 'unknown') as vessel_table_origin
    FROM vessel_positions vp
    JOIN vessels v ON v.gsf_id = vp.gsf_vessel_id
    WHERE v.status = 'active'
      AND vp.latitude IS NOT NULL 
      AND vp.longitude IS NOT NULL
    ORDER BY vp.gsf_vessel_id, vp.timestamp_utc DESC
  )
  SELECT 
    pos_table_id as vessel_id,
    gsf_vessel_id,
    vessel_table_name as vessel_name,
    latitude,
    longitude,
    speed_knots,
    speed_kmh,
    course,
    timestamp_utc,
    created_at,
    vessel_table_origin as origin
  FROM latest_per_vessel
  ORDER BY vessel_table_name;
END;
$$ LANGUAGE plpgsql;

COMMIT;
