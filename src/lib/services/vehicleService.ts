import { createClient } from '@/lib/supabase/server';
import { mockVehicleUnits } from '@/lib/mockUnits';
import type { VehicleUnit, UnitImage } from '@/types/database';

/**
 * Fetches all available vehicle units with their associated images ordered by display_order.
 * Gracefully falls back to mockVehicleUnits if the database is empty, unreachable, or unconfigured.
 */
export async function getAvailableUnits(): Promise<VehicleUnit[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('units')
      .select(`
        *,
        images:unit_images(*)
      `)
      .eq('status', 'Available')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      if (error) {
        console.warn('[vehicleService.getAvailableUnits] Supabase notice:', error.message);
      }
      return mockVehicleUnits.filter((u) => u.status === 'Available');
    }

    // Ensure unit images are cleanly sorted by display_order ASC
    const mappedUnits: VehicleUnit[] = data.map((unit) => {
      const sortedImages = Array.isArray(unit.images)
        ? [...(unit.images as UnitImage[])].sort((a, b) => a.display_order - b.display_order)
        : [];

      return {
        ...unit,
        images: sortedImages,
      };
    });

    return mappedUnits;
  } catch (err) {
    console.warn(
      '[vehicleService.getAvailableUnits] Falling back to mock data:',
      err instanceof Error ? err.message : String(err)
    );
    return mockVehicleUnits.filter((u) => u.status === 'Available');
  }
}

/**
 * Fetches a single vehicle unit by its UUID/ID or URL slug, with ordered images.
 * Gracefully falls back to mockVehicleUnits if not found in the database.
 */
export async function getUnitByIdOrSlug(identifier: string): Promise<VehicleUnit | null> {
  const safeIdentifier = identifier.trim();
  if (!safeIdentifier) return null;

  try {
    const supabase = await createClient();

    // Query by slug first
    let { data, error } = await supabase
      .from('units')
      .select(`
        *,
        images:unit_images(*)
      `)
      .eq('slug', safeIdentifier)
      .maybeSingle();

    // If not found by slug, attempt lookup by ID
    if (!data && !error) {
      const byId = await supabase
        .from('units')
        .select(`
          *,
          images:unit_images(*)
        `)
        .eq('id', safeIdentifier)
        .maybeSingle();

      data = byId.data;
      error = byId.error;
    }

    if (error || !data) {
      if (error) {
        console.warn('[vehicleService.getUnitByIdOrSlug] Supabase notice:', error.message);
      }
      const mock = mockVehicleUnits.find(
        (u) => u.slug === safeIdentifier || u.id === safeIdentifier
      );
      return mock || null;
    }

    const sortedImages = Array.isArray(data.images)
      ? [...(data.images as UnitImage[])].sort((a, b) => a.display_order - b.display_order)
      : [];

    return {
      ...data,
      images: sortedImages,
    };
  } catch (err) {
    console.warn(
      '[vehicleService.getUnitByIdOrSlug] Falling back to mock data:',
      err instanceof Error ? err.message : String(err)
    );
    const mock = mockVehicleUnits.find(
      (u) => u.slug === safeIdentifier || u.id === safeIdentifier
    );
    return mock || null;
  }
}

