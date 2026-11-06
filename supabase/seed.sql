-- ==============================================================================
-- RL TRADING & SEAT N GO SHUTTLE SERVICES
-- Idempotent Database Seed Script
-- Initial Pre-Owned Vehicles & Showcase Photos
-- Location: MacArthur Highway, Pulung Bulu, Angeles City, Pampanga
-- ==============================================================================

-- 1. SEED UNITS TABLE
INSERT INTO units (
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
  fb_status,
  boost_start,
  boost_end,
  last_relisted_at,
  description_notes,
  created_at,
  updated_at
) VALUES
(
  'unit-toyota-hilux-2019',
  '2019-toyota-hilux-2-4-g-conquest-at',
  2019,
  'Toyota',
  'Hilux',
  '2.4 G Conquest',
  'Automatic',
  'Diesel',
  48500,
  'Pickup',
  '8',
  1000000.00,
  500000.00,
  'Available',
  'Listed',
  NULL,
  NULL,
  '2026-11-01T08:00:00Z',
  'First owner, top-of-the-line Conquest variant in Nebula Blue Metallic. Complete service records, thick tires, roller lid bed cover, cold dual AC, 100% not flooded.',
  '2026-10-15T09:30:00Z',
  '2026-10-15T09:30:00Z'
),
(
  'unit-nissan-teana-2014',
  '2014-nissan-teana-2-5-v6-at',
  2014,
  'Nissan',
  'Teana',
  '2.5 V6',
  'Automatic',
  'Gasoline',
  68200,
  'Sedan',
  '2',
  375000.00,
  133200.00,
  'Available',
  'Listed',
  NULL,
  NULL,
  '2026-11-03T10:00:00Z',
  'Executive luxury sedan with silky smooth 2.5L V6 engine. Full leather upholstery, sunroof, power seats, cold climate control. Flawless ride and quiet cabin.',
  '2026-10-20T11:00:00Z',
  '2026-10-20T11:00:00Z'
),
(
  'unit-toyota-vios-2018',
  '2018-toyota-vios-1-3-e-at',
  2018,
  'Toyota',
  'Vios',
  '1.3 E',
  'Automatic',
  'Gasoline',
  52100,
  'Sedan',
  '5',
  430000.00,
  120000.00,
  'Available',
  'Listed',
  NULL,
  NULL,
  '2026-11-05T07:45:00Z',
  'Highly economical daily commuter car. Dual VVT-i 1.3L engine, smooth CVT transmission, ice cold air conditioning, well-kept interior, complete LTO papers ready for transfer.',
  '2026-10-28T14:15:00Z',
  '2026-10-28T14:15:00Z'
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  year = EXCLUDED.year,
  make = EXCLUDED.make,
  model = EXCLUDED.model,
  variant = EXCLUDED.variant,
  transmission = EXCLUDED.transmission,
  fuel = EXCLUDED.fuel,
  mileage = EXCLUDED.mileage,
  body_type = EXCLUDED.body_type,
  plate_ending = EXCLUDED.plate_ending,
  cash_price = EXCLUDED.cash_price,
  default_all_in_dp = EXCLUDED.default_all_in_dp,
  status = EXCLUDED.status,
  fb_status = EXCLUDED.fb_status,
  boost_start = EXCLUDED.boost_start,
  boost_end = EXCLUDED.boost_end,
  last_relisted_at = EXCLUDED.last_relisted_at,
  description_notes = EXCLUDED.description_notes,
  updated_at = NOW();

-- 2. SEED UNIT IMAGES TABLE
INSERT INTO unit_images (
  id,
  unit_id,
  image_url,
  storage_path,
  display_order,
  created_at
) VALUES
(
  'img-hilux-1',
  'unit-toyota-hilux-2019',
  'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=1200&q=80',
  'units/unit-toyota-hilux-2019/conquest-front.webp',
  1,
  '2026-10-15T09:30:00Z'
),
(
  'img-hilux-2',
  'unit-toyota-hilux-2019',
  'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
  'units/unit-toyota-hilux-2019/conquest-side.webp',
  2,
  '2026-10-15T09:31:00Z'
),
(
  'img-teana-1',
  'unit-nissan-teana-2014',
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
  'units/unit-nissan-teana-2014/teana-profile.webp',
  1,
  '2026-10-20T11:00:00Z'
),
(
  'img-vios-1',
  'unit-toyota-vios-2018',
  'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
  'units/unit-toyota-vios-2018/vios-front.webp',
  1,
  '2026-10-28T14:15:00Z'
)
ON CONFLICT (id) DO UPDATE SET
  unit_id = EXCLUDED.unit_id,
  image_url = EXCLUDED.image_url,
  storage_path = EXCLUDED.storage_path,
  display_order = EXCLUDED.display_order;

