-- ==============================================================================
-- RL TRADING & SEAT N GO SHUTTLE SERVICES
-- PostgreSQL Database Schema & Row Level Security (RLS)
-- Angeles City, Pampanga
-- ==============================================================================

-- Trigger function to automatically maintain updated_at timestamps
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Strict boost date pairing constraint
  CONSTRAINT check_boost_dates CHECK (
    (boost_start IS NULL AND boost_end IS NULL) OR 
    (boost_start IS NOT NULL AND boost_end IS NOT NULL AND boost_end >= boost_start)
  )
);

-- Trigger for automated updated_at timestamping
DROP TRIGGER IF EXISTS update_units_updated_at ON units;
CREATE TRIGGER update_units_updated_at
  BEFORE UPDATE ON units
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Indexes for fast showroom search and admin filtering
-- Note: 'slug' already has an automatic unique btree index via its UNIQUE constraint.
CREATE INDEX IF NOT EXISTS idx_units_status ON units(status);
CREATE INDEX IF NOT EXISTS idx_units_make_model ON units(make, model);
CREATE INDEX IF NOT EXISTS idx_units_created_at ON units(created_at DESC);

-- 2. UNIT IMAGES TABLE
CREATE TABLE IF NOT EXISTS unit_images (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  unit_id TEXT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Composite uniqueness constraint preventing duplicate ordering per unit
  CONSTRAINT unique_unit_image_order UNIQUE (unit_id, display_order)
);

-- Index for ordering unit images
CREATE INDEX IF NOT EXISTS idx_unit_images_unit_id_order ON unit_images(unit_id, display_order ASC);

-- 3. SECURE PUBLIC VIEW
-- Exposes customer-facing columns only (omitting internal marketing fields: fb_status, boost_start, boost_end, and last_relisted_at)
CREATE OR REPLACE VIEW public_units AS
SELECT
  id,
  slug,
  year,
  make,
  model,
  variant,
  transmission,
  fuel,
  mileage,
  body_type,
  plate_ending,
  cash_price,
  default_all_in_dp,
  status,
  description_notes,
  created_at,
  updated_at
FROM units;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on both tables
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_images ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- UNITS TABLE POLICIES
-- ------------------------------------------------------------------------------

-- Public showroom visitors can view all units
DROP POLICY IF EXISTS "Allow public read access on units" ON units;
CREATE POLICY "Allow public read access on units"
  ON units FOR SELECT
  USING (true);

-- Only authenticated administrators can insert units
DROP POLICY IF EXISTS "Allow admin insert on units" ON units;
CREATE POLICY "Allow admin insert on units"
  ON units FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Only authenticated administrators can update units
DROP POLICY IF EXISTS "Allow admin update on units" ON units;
CREATE POLICY "Allow admin update on units"
  ON units FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Only authenticated administrators can delete units
DROP POLICY IF EXISTS "Allow admin delete on units" ON units;
CREATE POLICY "Allow admin delete on units"
  ON units FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ------------------------------------------------------------------------------
-- UNIT IMAGES TABLE POLICIES
-- ------------------------------------------------------------------------------

-- Public showroom visitors can view images
DROP POLICY IF EXISTS "Allow public read access on unit_images" ON unit_images;
CREATE POLICY "Allow public read access on unit_images"
  ON unit_images FOR SELECT
  USING (true);

-- Only authenticated administrators can insert unit images
DROP POLICY IF EXISTS "Allow admin insert on unit_images" ON unit_images;
CREATE POLICY "Allow admin insert on unit_images"
  ON unit_images FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Only authenticated administrators can update unit images
DROP POLICY IF EXISTS "Allow admin update on unit_images" ON unit_images;
CREATE POLICY "Allow admin update on unit_images"
  ON unit_images FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Only authenticated administrators can delete unit images
DROP POLICY IF EXISTS "Allow admin delete on unit_images" ON unit_images;
CREATE POLICY "Allow admin delete on unit_images"
  ON unit_images FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ==============================================================================
-- STORAGE BUCKET CONFIGURATION (Supabase Storage)
-- ==============================================================================

-- Create the public bucket for vehicle photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-photos', 'vehicle-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Public can view photos in the vehicle-photos bucket
DROP POLICY IF EXISTS "Allow public read on vehicle-photos" ON storage.objects;
CREATE POLICY "Allow public read on vehicle-photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vehicle-photos');

-- Only authenticated administrators can upload photos to vehicle-photos
DROP POLICY IF EXISTS "Allow admin upload to vehicle-photos" ON storage.objects;
CREATE POLICY "Allow admin upload to vehicle-photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'vehicle-photos' AND
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Only authenticated administrators can update photos in vehicle-photos
DROP POLICY IF EXISTS "Allow admin update to vehicle-photos" ON storage.objects;
CREATE POLICY "Allow admin update to vehicle-photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'vehicle-photos' AND
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    bucket_id = 'vehicle-photos' AND
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Only authenticated administrators can delete photos from vehicle-photos
DROP POLICY IF EXISTS "Allow admin delete from vehicle-photos" ON storage.objects;
CREATE POLICY "Allow admin delete from vehicle-photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'vehicle-photos' AND
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
