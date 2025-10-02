-- CLEAN WORKING VERSION: Latest vessel data function (completely unique names)
-- Run this in Supabase SQL Editor

BEGIN;

-- Drop any existing function
DROP FUNCTION IF EXISTS get_latest_vessel_data();

-- Create function with completely unique identifiers
CREATE OR REPLACE FUNCTION get_latest_vessel_data()
RETURNS TABLE(
  result_vessel_id BIGINT,
  result_gsf_vessel_id BIGINT,
  result_vessel_name TEXT,
  result_latitude NUMERIC,
  result_longitude NUMERIC,
  result_speed_knots NUMERIC,
  result_speed_kmh NUMERIC,
  result_course NUMERIC,
  result_timestamp_utc TIMESTAMPTZ,
  result_created_at TIMESTAMPTZ,
  result_origin TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_per_vessel AS (
    SELECT DISTINCT ON (vp.gsf_vessel_id) 
      vp.id as vessel_position_id,
      vp.gsf_vessel_id as gsf_vessel_id_value,
      v.name as vessel_name_value,
      vp.latitude as position_latitude,
      vp.longitude as position_longitude,
      vp.speed_knots as position_speed_knots,
      vp.speed_kmh as position_speed_kmh,
      vp.course as position_course,
      vp.timestamp_utc as position_timestamp_utc,
      vp.created_at as position_created_at,
      COALESCE(v.origin, 'unknown') as vessel_origin_value
    FROM vessel_positions vp
    JOIN vessels v ON v.gsf_id = vp.gsf_vessel_id
    WHERE v.status = 'active'
      AND vp.latitude IS NOT NULL 
      AND vp.longitude IS NOT NULL
    ORDER BY vp.gsf_vessel_id, vp.timestamp_utc DESC
  )
  SELECT 
    vessel_position_id as result_vessel_id,
    gsf_vessel_id_value as result_gsf_vessel_id,
    vessel_name_value as result_vessel_name,
    position_latitude as result_latitude,
    position_longitude as result_longitude,
    position_speed_knots as result_speed_knots,
    position_speed_kmh as result_speed_kmh,
    position_course as result_course,
    position_timestamp_utc as result_timestamp_utc,
    position_created_at as result_created_at,
    vessel_origin_value as result_origin
  FROM latest_per_vessel
  ORDER BY vessel_name_value;
END;
$$ LANGUAGE plpgsql;

COMMIT;
