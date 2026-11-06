-- ==============================================================================
-- RL TRADING & SEAT N GO SHUTTLE SERVICES
-- PostgreSQL Database Schema & Row Level Security (RLS)
-- Angeles City, Pampanga
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. VEHICLE UNITS TABLE
CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  slug TEXT UNIQUE NOT NULL,
  year INTEGER NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  variant TEXT NOT NULL,
  transmission TEXT NOT NULL CHECK (transmission IN ('Automatic', 'Manual')),
  fuel TEXT NOT NULL CHECK (fuel IN ('Diesel', 'Gasoline')),
  mileage INTEGER NOT NULL CHECK (mileage >= 0),
  body_type TEXT NOT NULL CHECK (body_type IN ('Pickup', 'SUV', 'Sedan', 'Van', 'Hatchback')),
  plate_ending VARCHAR(2) NOT NULL,
  cash_price NUMERIC(12, 2) NOT NULL CHECK (cash_price >= 0),
  default_all_in_dp NUMERIC(12, 2) NOT NULL CHECK (default_all_in_dp >= 0),
  status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Pending', 'Sold')),
  fb_status TEXT NOT NULL DEFAULT 'Unlisted' CHECK (fb_status IN ('Listed', 'Unlisted')),
  boost_start TIMESTAMPTZ,
  boost_end TIMESTAMPTZ,
  last_relisted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Strict boost date pairing constraint
  CONSTRAINT check_boost_dates CHECK (
    (boost_start IS NULL AND boost_end IS NULL) OR 
    (boost_start IS NOT NULL AND boost_end IS NOT NULL AND boost_end >= boost_start)
  )
);

-- Indexes for fast showroom search and admin filtering
CREATE INDEX IF NOT EXISTS idx_units_status ON units(status);
CREATE INDEX IF NOT EXISTS idx_units_slug ON units(slug);
CREATE INDEX IF NOT EXISTS idx_units_make_model ON units(make, model);
CREATE INDEX IF NOT EXISTS idx_units_created_at ON units(created_at DESC);

-- 2. UNIT IMAGES TABLE
CREATE TABLE IF NOT EXISTS unit_images (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  unit_id TEXT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for ordering unit images
CREATE INDEX IF NOT EXISTS idx_unit_images_unit_id_order ON unit_images(unit_id, display_order ASC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on both tables
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_images ENABLE ROW LEVEL SECURITY;

-- UNITS POLICIES:
-- Public showroom visitors can view all units
CREATE POLICY "Allow public read access on units"
  ON units FOR SELECT
  USING (true);

-- Only authenticated dealership staff can insert, update, or delete units
CREATE POLICY "Allow authenticated insert on units"
  ON units FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on units"
  ON units FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on units"
  ON units FOR DELETE
  TO authenticated
  USING (true);

-- UNIT IMAGES POLICIES:
-- Public showroom visitors can view images
CREATE POLICY "Allow public read access on unit_images"
  ON unit_images FOR SELECT
  USING (true);

-- Only authenticated dealership staff can insert, update, or delete images
CREATE POLICY "Allow authenticated insert on unit_images"
  ON unit_images FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on unit_images"
  ON unit_images FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on unit_images"
  ON unit_images FOR DELETE
  TO authenticated
  USING (true);

-- ==============================================================================
-- STORAGE BUCKET CONFIGURATION (Supabase Storage)
-- ==============================================================================
-- In Supabase dashboard or via API, ensure the bucket 'vehicle-photos' is created:
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('vehicle-photos', 'vehicle-photos', true) 
-- ON CONFLICT (id) DO NOTHING;
--
-- Storage Policies for 'vehicle-photos':
-- CREATE POLICY "Allow public read on vehicle-photos"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'vehicle-photos');
--
-- CREATE POLICY "Allow authenticated uploads to vehicle-photos"
--   ON storage.objects FOR INSERT
--   TO authenticated
--   WITH CHECK (bucket_id = 'vehicle-photos');
--
-- CREATE POLICY "Allow authenticated delete from vehicle-photos"
--   ON storage.objects FOR DELETE
--   TO authenticated
--   USING (bucket_id = 'vehicle-photos');
