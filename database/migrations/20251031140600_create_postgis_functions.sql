-- TaskBridge v2.0 Migration
-- Phase 6: Create PostGIS Geospatial Functions
-- Created: 2025-10-31

-- Note: PostGIS extension must be enabled first (20251031140000_enable_extensions.sql)

-- ========================================
-- FUNCTION: tasks_within_radius
-- ========================================
-- Find physical data collection tasks within a specified radius

CREATE OR REPLACE FUNCTION tasks_within_radius(
  target_lng FLOAT,
  target_lat FLOAT,
  radius_meters INT
)
RETURNS SETOF tasks
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM tasks
  WHERE domain_type = 'physical_data'
    AND physical_location IS NOT NULL
    AND ST_DWithin(
      physical_location::geography,
      ST_MakePoint(target_lng, target_lat)::geography,
      radius_meters
    )
  ORDER BY physical_location <-> ST_MakePoint(target_lng, target_lat)::geometry;
$$;

COMMENT ON FUNCTION tasks_within_radius IS 'Find physical tasks within specified radius, ordered by distance';

-- ========================================
-- FUNCTION: workers_within_radius
-- ========================================
-- Find workers within a specified radius of a location

CREATE OR REPLACE FUNCTION workers_within_radius(
  target_lng FLOAT,
  target_lat FLOAT,
  radius_meters INT
)
RETURNS TABLE (
  worker_id UUID,
  user_id UUID,
  tier INTEGER,
  average_rating DECIMAL(3,2),
  distance_meters FLOAT,
  location_updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    w.id AS worker_id,
    w.user_id,
    w.tier,
    w.average_rating,
    ST_Distance(
      w.current_location::geography,
      ST_MakePoint(target_lng, target_lat)::geography
    ) AS distance_meters,
    w.location_updated_at
  FROM workers w
  WHERE w.current_location IS NOT NULL
    AND ST_DWithin(
      w.current_location::geography,
      ST_MakePoint(target_lng, target_lat)::geography,
      radius_meters
    )
  ORDER BY distance_meters ASC;
$$;

COMMENT ON FUNCTION workers_within_radius IS 'Find workers within specified radius with distance calculation';

-- ========================================
-- FUNCTION: calculate_distance_meters
-- ========================================
-- Calculate distance between two GPS coordinates

CREATE OR REPLACE FUNCTION calculate_distance_meters(
  lng1 FLOAT,
  lat1 FLOAT,
  lng2 FLOAT,
  lat2 FLOAT
)
RETURNS FLOAT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ST_Distance(
    ST_MakePoint(lng1, lat1)::geography,
    ST_MakePoint(lng2, lat2)::geography
  );
$$;

COMMENT ON FUNCTION calculate_distance_meters IS 'Calculate distance in meters between two GPS coordinates';

-- ========================================
-- FUNCTION: verify_gps_location
-- ========================================
-- Verify if a submission location is within acceptable range of task location

CREATE OR REPLACE FUNCTION verify_gps_location(
  p_task_id UUID,
  p_submission_lng FLOAT,
  p_submission_lat FLOAT
)
RETURNS TABLE (
  verified BOOLEAN,
  distance_meters FLOAT,
  within_radius BOOLEAN,
  max_radius INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_task_location GEOGRAPHY(POINT, 4326);
  v_verification_radius INTEGER;
  v_distance FLOAT;
BEGIN
  -- Get task location and verification radius
  SELECT
    physical_location,
    COALESCE(physical_verification_radius, 100)
  INTO v_task_location, v_verification_radius
  FROM tasks
  WHERE id = p_task_id;

  -- If task has no location requirement, verification passes
  IF v_task_location IS NULL THEN
    RETURN QUERY SELECT TRUE, 0::FLOAT, TRUE, 0;
    RETURN;
  END IF;

  -- Calculate distance
  v_distance := ST_Distance(
    v_task_location::geography,
    ST_MakePoint(p_submission_lng, p_submission_lat)::geography
  );

  -- Return verification result
  RETURN QUERY SELECT
    (v_distance <= v_verification_radius),
    v_distance,
    (v_distance <= v_verification_radius),
    v_verification_radius;
END;
$$;

COMMENT ON FUNCTION verify_gps_location IS 'Verify if submission GPS location is within task required radius';

-- ========================================
-- FUNCTION: detect_gps_spoofing
-- ========================================
-- Basic GPS spoofing detection (checks for impossible travel speed)

CREATE OR REPLACE FUNCTION detect_gps_spoofing(
  p_worker_id UUID,
  p_new_lng FLOAT,
  p_new_lat FLOAT,
  p_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  spoofing_suspected BOOLEAN,
  reason TEXT,
  travel_speed_kmh FLOAT,
  time_diff_seconds FLOAT
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_last_location GEOGRAPHY(POINT, 4326);
  v_last_timestamp TIMESTAMP WITH TIME ZONE;
  v_distance_meters FLOAT;
  v_time_diff_seconds FLOAT;
  v_speed_kmh FLOAT;
  v_max_reasonable_speed_kmh FLOAT := 120; -- Max reasonable speed (car on highway)
BEGIN
  -- Get worker's last known location
  SELECT current_location, location_updated_at
  INTO v_last_location, v_last_timestamp
  FROM workers
  WHERE id = p_worker_id;

  -- If no previous location, can't detect spoofing
  IF v_last_location IS NULL THEN
    RETURN QUERY SELECT FALSE, 'No previous location data'::TEXT, 0::FLOAT, 0::FLOAT;
    RETURN;
  END IF;

  -- Calculate distance and time difference
  v_distance_meters := ST_Distance(
    v_last_location::geography,
    ST_MakePoint(p_new_lng, p_new_lat)::geography
  );

  v_time_diff_seconds := EXTRACT(EPOCH FROM (p_timestamp - v_last_timestamp));

  -- Avoid division by zero
  IF v_time_diff_seconds <= 0 THEN
    RETURN QUERY SELECT TRUE, 'Invalid timestamp (not after previous location)'::TEXT, 0::FLOAT, v_time_diff_seconds;
    RETURN;
  END IF;

  -- Calculate speed (km/h)
  v_speed_kmh := (v_distance_meters / 1000.0) / (v_time_diff_seconds / 3600.0);

  -- Check if speed is unreasonably high
  IF v_speed_kmh > v_max_reasonable_speed_kmh THEN
    RETURN QUERY SELECT
      TRUE,
      format('Travel speed (%s km/h) exceeds reasonable maximum (%s km/h)',
             ROUND(v_speed_kmh::numeric, 2),
             v_max_reasonable_speed_kmh),
      v_speed_kmh,
      v_time_diff_seconds;
  ELSE
    RETURN QUERY SELECT FALSE, 'Location change is reasonable'::TEXT, v_speed_kmh, v_time_diff_seconds;
  END IF;
END;
$$;

COMMENT ON FUNCTION detect_gps_spoofing IS 'Detect potential GPS spoofing based on impossible travel speed';

-- ========================================
-- FUNCTION: update_worker_location
-- ========================================
-- Update worker location with spoofing detection

CREATE OR REPLACE FUNCTION update_worker_location(
  p_worker_id UUID,
  p_lng FLOAT,
  p_lat FLOAT
)
RETURNS TABLE (
  success BOOLEAN,
  spoofing_detected BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_spoofing_result RECORD;
BEGIN
  -- Check for GPS spoofing
  SELECT * INTO v_spoofing_result
  FROM detect_gps_spoofing(p_worker_id, p_lng, p_lat);

  -- If spoofing suspected, don't update location
  IF v_spoofing_result.spoofing_suspected THEN
    RETURN QUERY SELECT
      FALSE,
      TRUE,
      v_spoofing_result.reason;
    RETURN;
  END IF;

  -- Update worker location
  UPDATE workers
  SET
    current_location = ST_MakePoint(p_lng, p_lat)::geography,
    location_updated_at = NOW(),
    updated_at = NOW()
  WHERE id = p_worker_id;

  RETURN QUERY SELECT TRUE, FALSE, 'Location updated successfully'::TEXT;
END;
$$;

COMMENT ON FUNCTION update_worker_location IS 'Update worker location with automatic spoofing detection';

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- List all PostGIS functions
SELECT
  proname AS function_name,
  pg_get_function_arguments(oid) AS arguments
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'tasks_within_radius',
    'workers_within_radius',
    'calculate_distance_meters',
    'verify_gps_location',
    'detect_gps_spoofing',
    'update_worker_location'
  )
ORDER BY proname;

-- Test distance calculation
SELECT calculate_distance_meters(
  139.6917, 35.6895,  -- Tokyo (lng, lat)
  -0.1278, 51.5074    -- London (lng, lat)
) AS tokyo_to_london_meters;

-- Verify PostGIS is working
SELECT PostGIS_Full_Version();
