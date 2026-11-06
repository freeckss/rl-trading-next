import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { mockVehicleUnits } from '@/lib/mockUnits';
import type { VehicleUnit, PublicVehicleUnit, UnitImage } from '@/types/database';

/**
 * Check whether fallback to mock data is permitted.
 * Strict safeguard: ONLY allows fallback in non-production environments OR when
 * explicitly enabled via USE_MOCK_DATA="true". Never serves mock data in production.
 */
function shouldFallbackToMock(): boolean {
  if (process.env.USE_MOCK_DATA === 'true') {
    return true;
  }
  return process.env.NODE_ENV !== 'production';
}

/**
 * Formats mock units into the secure PublicVehicleUnit shape (omitting internal marketing fields).
 */
function toPublicUnit(unit: VehicleUnit): PublicVehicleUnit {
  return {
    id: unit.id,
    slug: unit.slug,
    year: unit.year,
    make: unit.make,
    model: unit.model,
    variant: unit.variant,
    transmission: unit.transmission,
    fuel: unit.fuel,
    mileage: unit.mileage,
    body_type: unit.body_type,
    plate_ending: unit.plate_ending,
    cash_price: unit.cash_price,
    default_all_in_dp: unit.default_all_in_dp,
    status: unit.status,
    description_notes: unit.description_notes,
    created_at: unit.created_at,
    updated_at: unit.updated_at,
    images: unit.images,
  };
}

function getMockPublicUnits(): PublicVehicleUnit[] {
  return mockVehicleUnits
    .filter((u) => u.status === 'Available')
    .map(toPublicUnit);
}

function getMockPublicUnitByIdOrSlug(identifier: string): PublicVehicleUnit | null {
  const found = mockVehicleUnits.find(
    (u) => u.slug === identifier || u.id === identifier
  );
  if (!found) return null;
  return toPublicUnit(found);
}

/**
 * Fetches all available vehicle units for public display from the `public_units` view,
 * queries and merges their ordered photos from `unit_images`.
 *
 * In production: returns empty array [] on query failure or zero results.
 * In development: falls back to mock data if the database is unreachable or unseeded.
 */
export async function getAvailableUnits(): Promise<PublicVehicleUnit[]> {
  try {
    const supabase = await createClient();

    // Query the customer-facing public_units view
    const { data: unitsData, error: unitsError } = await supabase
      .from('public_units')
      .select('*')
      .eq('status', 'Available')
      .order('created_at', { ascending: false });

    if (unitsError) {
      console.error('[vehicleService.getAvailableUnits] Supabase view error:', unitsError.message);
      if (shouldFallbackToMock()) {
        return getMockPublicUnits();
      }
      return [];
    }

    if (!unitsData || unitsData.length === 0) {
      if (shouldFallbackToMock()) {
        return getMockPublicUnits();
      }
      return [];
    }

    // Retrieve photos for all fetched units
    const unitIds = unitsData.map((u) => u.id);
    const { data: imagesData, error: imagesError } = await supabase
      .from('unit_images')
      .select('*')
      .in('unit_id', unitIds)
      .order('display_order', { ascending: true });

    if (imagesError) {
      console.warn('[vehicleService.getAvailableUnits] Failed to fetch unit_images:', imagesError.message);
    }

    // Group images by unit_id
    const imagesByUnitId = new Map<string, UnitImage[]>();
    if (imagesData) {
      for (const img of imagesData) {
        const existing = imagesByUnitId.get(img.unit_id) || [];
        existing.push(img);
        imagesByUnitId.set(img.unit_id, existing);
      }
    }

    // Merge images into the public vehicle records
    return unitsData.map((unit) => ({
      ...unit,
      images: imagesByUnitId.get(unit.id) || [],
    }));
  } catch (err) {
    console.error(
      '[vehicleService.getAvailableUnits] Unexpected error:',
      err instanceof Error ? err.message : String(err)
    );
    if (shouldFallbackToMock()) {
      return getMockPublicUnits();
    }
    return [];
  }
}

/**
 * Fetches a single vehicle unit by its UUID/ID or URL slug from `public_units`,
 * queries and merges its ordered photos from `unit_images`.
 *
 * Wrapped in React cache() to deduplicate identical calls between generateMetadata and the page component.
 * In production: returns null on failure or zero results.
 * In development: falls back to mock data if not found in database.
 */
export const getUnitByIdOrSlug = cache(
  async (identifier: string): Promise<PublicVehicleUnit | null> => {
    const safeIdentifier = identifier.trim();
    if (!safeIdentifier) return null;

    try {
      const supabase = await createClient();

      // Query public_units by slug first
      let { data: unitData, error: unitError } = await supabase
        .from('public_units')
        .select('*')
        .eq('slug', safeIdentifier)
        .maybeSingle();

      // If not found by slug, attempt lookup by ID
      if (!unitData && !unitError) {
        const byId = await supabase
          .from('public_units')
          .select('*')
          .eq('id', safeIdentifier)
          .maybeSingle();

        unitData = byId.data;
        unitError = byId.error;
      }

      if (unitError) {
        console.error('[vehicleService.getUnitByIdOrSlug] Supabase view error:', unitError.message);
        if (shouldFallbackToMock()) {
          return getMockPublicUnitByIdOrSlug(safeIdentifier);
        }
        return null;
      }

      if (!unitData) {
        if (shouldFallbackToMock()) {
          return getMockPublicUnitByIdOrSlug(safeIdentifier);
        }
        return null;
      }

      // Fetch ordered images for this unit
      const { data: imagesData, error: imagesError } = await supabase
        .from('unit_images')
        .select('*')
        .eq('unit_id', unitData.id)
        .order('display_order', { ascending: true });

      if (imagesError) {
        console.warn('[vehicleService.getUnitByIdOrSlug] Failed to fetch unit_images:', imagesError.message);
      }

      return {
        ...unitData,
        images: imagesData || [],
      };
    } catch (err) {
      console.error(
        '[vehicleService.getUnitByIdOrSlug] Unexpected error:',
        err instanceof Error ? err.message : String(err)
      );
      if (shouldFallbackToMock()) {
        return getMockPublicUnitByIdOrSlug(safeIdentifier);
      }
      return null;
    }
  }
);
