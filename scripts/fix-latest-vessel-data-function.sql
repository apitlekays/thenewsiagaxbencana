-- Fix the latest vessel data function (remove dependency on non-existent gsf_vessels table)
-- Run this in Supabase SQL Editor

BEGIN;

-- Drop and recreate the function without gsf_vessels dependency
DROP FUNCTION IF EXISTS get_latest_vessel_data();

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
      vp.id as vessel_id,
      vp.gsf_vessel_id,
      v.name::TEXT as vessel_name,
      vp.latitude,
      vp.longitude,
      vp.speed_knots,
      vp.speed_kmh,
      vp.course,
      vp.timestamp_utc,
      vp.created_at,
      COALESCE(v.origin::TEXT, 'unknown') as origin
    FROM vessel_positions vp
    JOIN vessels v ON v.gsf_id = vp.gsf_vessel_id
    WHERE v.status = 'active'
      AND vp.latitude IS NOT NULL 
      AND vp.longitude IS NOT NULL
    ORDER BY vp.gsf_vessel_id, vp.timestamp_utc DESC
  )
  SELECT 
    vessel_id,
    gsf_vessel_id,
    vessel_name,
    latitude,
    longitude,
    speed_knots,
    speed_kmh,
    course,
    timestamp_utc,
    created_at,
    origin
  FROM latest_per_vessel
  ORDER BY vessel_name;
END;
$$ LANGUAGE plpgsql;

COMMIT;
