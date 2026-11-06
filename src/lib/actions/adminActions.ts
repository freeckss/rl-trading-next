'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type {
  Database,
  UnitStatus,
  FbListingStatus,
  BodyType,
  TransmissionType,
  FuelType,
  VehicleUnit,
  UnitImage,
} from '@/types/database';
import { generateVehicleSlug } from '@/lib/slugs';

type UnitUpdatePayload = Database['public']['Tables']['units']['Update'];

export type ActionResponse<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

/**
 * Verify administrator privileges before executing mutations.
 */
async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.app_metadata?.role;
  if (!user || role !== 'admin') {
    throw new Error('Unauthorized: Administrator privileges required.');
  }

  return { supabase, user };
}

/**
 * Updates vehicle status (Available, Pending, Sold).
 */
export async function updateUnitStatus(
  unitId: string,
  status: UnitStatus
): Promise<ActionResponse> {
  try {
    const { supabase } = await verifyAdmin();

    if (!unitId || !unitId.trim()) {
      return { success: false, error: 'Unit ID is required.' };
    }
    if (!['Available', 'Pending', 'Sold'].includes(status)) {
      return { success: false, error: `Invalid status: ${status}` };
    }

    const { error } = await supabase
      .from('units')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', unitId);

    if (error) {
      return { success: false, error: `Failed to update status: ${error.message}` };
    }

    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update unit status.',
    };
  }
}

/**
 * Updates Facebook marketplace listing status (Listed, Unlisted).
 */
export async function updateUnitFbStatus(
  unitId: string,
  fb_status: FbListingStatus
): Promise<ActionResponse> {
  try {
    const { supabase } = await verifyAdmin();

    if (!unitId || !unitId.trim()) {
      return { success: false, error: 'Unit ID is required.' };
    }
    if (!['Listed', 'Unlisted'].includes(fb_status)) {
      return { success: false, error: `Invalid FB listing status: ${fb_status}` };
    }

    const updates: UnitUpdatePayload = {
      fb_status,
      updated_at: new Date().toISOString(),
    };

    if (fb_status === 'Listed') {
      updates.last_relisted_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('units')
      .update(updates)
      .eq('id', unitId);

    if (error) {
      return { success: false, error: `Failed to update Facebook listing: ${error.message}` };
    }

    revalidatePath('/admin');
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update Facebook status.',
    };
  }
}

/**
 * Quick action to refresh/renew the Facebook Marketplace relist timer.
 */
export async function relistUnit(unitId: string): Promise<ActionResponse> {
  try {
    const { supabase } = await verifyAdmin();

    if (!unitId || !unitId.trim()) {
      return { success: false, error: 'Unit ID is required.' };
    }

    const { error } = await supabase
      .from('units')
      .update({
        fb_status: 'Listed',
        last_relisted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', unitId);

    if (error) {
      return { success: false, error: `Failed to relist unit: ${error.message}` };
    }

    revalidatePath('/admin');
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to relist unit.',
    };
  }
}

/**
 * Deletes a vehicle with full cascade cleanup: removes associated photos from
 * Supabase Storage ('vehicle-photos') before deleting the database row.
 */
export async function deleteUnit(unitId: string): Promise<ActionResponse> {
  try {
    const { supabase } = await verifyAdmin();

    if (!unitId || !unitId.trim()) {
      return { success: false, error: 'Vehicle ID is required.' };
    }

    // 1. Query all storage paths for this vehicle's photos
    const { data: images, error: imagesError } = await supabase
      .from('unit_images')
      .select('storage_path')
      .eq('unit_id', unitId);

    if (imagesError) {
      console.warn(`[deleteUnit] Failed to fetch image storage paths: ${imagesError.message}`);
    }

    // 2. Delete vehicle row from units table first (cascades to unit_images in DB)
    const { error: deleteError } = await supabase
      .from('units')
      .delete()
      .eq('id', unitId);

    if (deleteError) {
      return { success: false, error: `Failed to delete vehicle record: ${deleteError.message}` };
    }

    // 3. Delete physical image files from Supabase Storage (if files exist in bucket)
    const storagePaths = (images || [])
      .map((img) => img.storage_path)
      .filter((path): path is string => Boolean(path && path.trim()));

    if (storagePaths.length > 0) {
      const { error: storageRemoveError } = await supabase.storage
        .from('vehicle-photos')
        .remove(storagePaths);

      if (storageRemoveError) {
        console.warn(
          `[deleteUnit] Storage cleanup failed for ${unitId}:`,
          storageRemoveError.message
        );
      }
    }

    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to delete vehicle.',
    };
  }
}

export interface SaveVehicleInput {
  id?: string;
  year: number;
  make: string;
  model: string;
  variant: string;
  transmission: TransmissionType;
  fuel: FuelType;
  mileage: number;
  body_type: BodyType;
  plate_ending: string;
  cash_price: number;
  default_all_in_dp: number;
  status: UnitStatus;
  fb_status: FbListingStatus;
  description_notes: string;
  boost_start?: string | null;
  boost_end?: string | null;
}

/**
 * Saves (inserts or updates) a vehicle record in the `units` table.
 *
 * IMMUTABLE SLUG RULE:
 * - On INSERT: Generates a collision-proof slug with a 5-char random suffix.
 * - On UPDATE: NEVER regenerates or overwrites the slug, preserving external links and QR codes.
 */
export async function saveVehicle(
  input: SaveVehicleInput
): Promise<ActionResponse<VehicleUnit>> {
  try {
    const { supabase } = await verifyAdmin();

    // Server-side input validation
    if (!input.make || !input.make.trim()) {
      return { success: false, error: 'Vehicle make is required.' };
    }
    if (!input.model || !input.model.trim()) {
      return { success: false, error: 'Vehicle model is required.' };
    }
    if (!input.variant || !input.variant.trim()) {
      return { success: false, error: 'Vehicle variant is required.' };
    }
    if (!input.plate_ending || !input.plate_ending.trim()) {
      return { success: false, error: 'Plate ending number is required.' };
    }

    const year = Number(input.year);
    if (isNaN(year) || year < 1990 || year > 2035) {
      return { success: false, error: 'Year must be a valid number between 1990 and 2035.' };
    }

    const cashPrice = Number(input.cash_price);
    if (isNaN(cashPrice) || cashPrice <= 0) {
      return { success: false, error: 'Cash price must be greater than zero.' };
    }

    const defaultAllInDp = Number(input.default_all_in_dp);
    if (isNaN(defaultAllInDp) || defaultAllInDp < 0) {
      return { success: false, error: 'Target all-in downpayment cannot be negative.' };
    }

    const mileage = Number(input.mileage);
    if (isNaN(mileage) || mileage < 0) {
      return { success: false, error: 'Mileage must be a non-negative number.' };
    }

    const commonPayload = {
      year,
      make: input.make.trim(),
      model: input.model.trim(),
      variant: input.variant.trim(),
      transmission: input.transmission,
      fuel: input.fuel,
      mileage,
      body_type: input.body_type,
      plate_ending: input.plate_ending.trim(),
      cash_price: cashPrice,
      default_all_in_dp: defaultAllInDp,
      status: input.status,
      fb_status: input.fb_status,
      description_notes: input.description_notes ? input.description_notes.trim() : null,
      boost_start: input.boost_start || null,
      boost_end: input.boost_end || null,
      updated_at: new Date().toISOString(),
    };

    if (input.id) {
      // UPDATE: Exclude slug to guarantee immutability
      const { data, error } = await supabase
        .from('units')
        .update(commonPayload)
        .eq('id', input.id)
        .select('*, images:unit_images(*)')
        .single();

      if (error) {
        return { success: false, error: `Failed to update vehicle: ${error.message}` };
      }

      const sortedImages = Array.isArray(data.images)
        ? [...(data.images as UnitImage[])].sort((a, b) => a.display_order - b.display_order)
        : [];

      const savedUnit: VehicleUnit = {
        ...data,
        images: sortedImages,
      };

      revalidatePath('/admin');
      revalidatePath('/');
      return { success: true, data: savedUnit };
    } else {
      // INSERT: Generate immutable, collision-proof slug with random suffix
      const slug = generateVehicleSlug(year, input.make, input.model, input.variant);

      const { data, error } = await supabase
        .from('units')
        .insert({
          ...commonPayload,
          slug,
          last_relisted_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        })
        .select('*, images:unit_images(*)')
        .single();

      if (error) {
        return { success: false, error: `Failed to create vehicle: ${error.message}` };
      }

      const sortedImages = Array.isArray(data.images)
        ? [...(data.images as UnitImage[])].sort((a, b) => a.display_order - b.display_order)
        : [];

      const savedUnit: VehicleUnit = {
        ...data,
        images: sortedImages,
      };

      revalidatePath('/admin');
      revalidatePath('/');
      return { success: true, data: savedUnit };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to save vehicle.',
    };
  }
}
