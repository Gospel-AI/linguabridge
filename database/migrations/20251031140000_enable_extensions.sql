-- TaskBridge v2.0 Migration
-- Phase 0: Enable Required Extensions
-- Created: 2025-10-31

-- ========================================
-- ENABLE POSTGIS EXTENSION
-- ========================================
-- PostGIS is required for geospatial features in Physical Data Collection domain

CREATE EXTENSION IF NOT EXISTS postgis;

-- Verify PostGIS version
SELECT PostGIS_Version();

-- ========================================
-- ENABLE PG_CRON EXTENSION
-- ========================================
-- pg_cron is required for automated worker tier management

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check installed extensions
SELECT extname, extversion FROM pg_extension
WHERE extname IN ('postgis', 'pg_cron');

-- Verify PostGIS spatial_ref_sys table
SELECT COUNT(*) as srid_count FROM spatial_ref_sys;

-- Show cron jobs (should be empty initially)
SELECT * FROM cron.job;
