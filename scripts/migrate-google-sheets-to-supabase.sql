-- Migration Script: Move Google Sheets Data to Supabase
-- Purpose: Eliminate CORS issues and rate limiting by moving data to database
-- Run each section separately for safety

-- ===================================================================
-- SECTION 1: Create attack_status table
-- ===================================================================

BEGIN;

-- Create attack_status table
CREATE TABLE IF NOT EXISTS public.attack_status (
    id BIGSERIAL PRIMARY KEY,
    vessel_name TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('attacked', 'emergency')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_attack_status_vessel_name ON public.attack_status (vessel_name);
CREATE INDEX IF NOT EXISTS idx_attack_status_status ON public.attack_status (status);
CREATE INDEX IF NOT EXISTS idx_attack_status_updated_at ON public.attack_status (updated_at DESC);

-- Add RLS policies
ALTER TABLE public.attack_status ENABLE ROW LEVEL SECURITY;

-- Policy for reading attack status (public read access)
CREATE POLICY "Enable read access for all users" ON public.attack_status
    FOR SELECT USING (true);

-- Policy for updating attack status (authenticated users)
CREATE POLICY "Enable update access for authenticated users" ON public.attack_status
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy for inserting attack status (authenticated users)
CREATE POLICY "Enable insert access for authenticated users" ON public.attack_status
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

COMMIT;

-- ===================================================================
-- SECTION 2: Create incidents_reports table
-- ===================================================================

BEGIN;

-- Create incidents_reports table
CREATE TABLE IF NOT EXISTS public.incidents_reports (
    id BIGSERIAL PRIMARY KEY,
    datetime TIMESTAMPTZ NOT NULL,
    notes_published TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_incidents_reports_datetime ON public.incidents_reports (datetime DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_reports_created_at ON public.incidents_reports (created_at DESC);

-- Add RLS policies
ALTER TABLE public.incidents_reports ENABLE ROW LEVEL SECURITY;

-- Policy for reading incidents (public read access)
CREATE POLICY "Enable read access for all users" ON public.incidents_reports
    FOR SELECT USING (true);

-- Policy for updating incidents (authenticated users)
CREATE POLICY "Enable update access for authenticated users" ON public.incidents_reports
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy for inserting incidents (authenticated users)
CREATE POLICY "Enable insert access for authenticated users" ON public.incidents_reports
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

COMMIT;

-- ===================================================================
-- SECTION 3: Sample data insertion (run after getting data from Google Sheets)
-- ===================================================================

-- NOTE: Replace the sample data below with actual data from Google Sheets
-- This is just example structure

-- Sample attack status data (replace with actual Google Sheets data)
/*
INSERT INTO public.attack_status (vessel_name, status, created_at, updated_at)
VALUES 
    ('Estrella Y Manuel', 'attacked', NOW(), NOW()),
    ('Alma', 'emergency', NOW(), NOW()),
    ('Huga', 'attacked', NOW(), NOW())
ON CONFLICT (vessel_name) 
DO UPDATE SET 
    status = EXCLUDED.status,
    updated_at = NOW();
*/

-- Sample incidents data (replace with actual Google Sheets data)
/*
INSERT INTO public.incidents_reports (datetime, notes_published, created_at, updated_at)
VALUES 
    ('2024-01-15 14:30:00+00', 'Vessel Estrella Y Manuel reports attack at position 33.123, 34.456', NOW(), NOW()),
    ('2024-01-15 16:45:00+00', 'Emergency signal received from vessel Alma requesting immediate assistance', NOW(), NOW()),
    ('2024-01-15 18:20:00+00', 'Vessel Huga sustains damage, crew reports all safe', NOW(), NOW())
ON CONFLICT DO NOTHING;
*/

-- ===================================================================
-- SECTION 4: Verification queries
-- ===================================================================

-- Verify table creation
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('attack_status', 'incidents_reports');

-- Verify indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('attack_status', 'incidents_reports')
ORDER BY tablename, indexname;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('attack_status', 'incidents_reports')
ORDER BY tablename, policyname;

-- ===================================================================
-- SECTION 5: Data cleanup queries (optional)
-- ===================================================================

-- To clear all data if needed:
-- TRUNCATE TABLE public.attack_status RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE public.incidents_reports RESTART IDENTITY CASCADE;

-- To drop tables if needed (DANGER):
-- DROP TABLE IF EXISTS public.incidents_reports CASCADE;
-- DROP TABLE IF EXISTS public.attack_status CASCADE;
