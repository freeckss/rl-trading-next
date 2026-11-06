'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Database, UnitStatus, FbListingStatus, BodyType, TransmissionType, FuelType } from '@/types/database';
import { generateVehicleSlug } from '@/lib/slugs';

type UnitUpdatePayload = Database['public']['Tables']['units']['Update'];

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
export async function updateUnitStatus(unitId: string, status: UnitStatus) {
  const { supabase } = await verifyAdmin();

  const { error } = await supabase
    .from('units')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', unitId);

  if (error) {
    throw new Error(`Failed to update unit status: ${error.message}`);
  }

  revalidatePath('/admin');
  revalidatePath('/');
  return { success: true };
}

/**
 * Updates Facebook marketplace listing status (Listed, Unlisted).
 */
export async function updateUnitFbStatus(unitId: string, fb_status: FbListingStatus) {
  const { supabase } = await verifyAdmin();

  const updates: UnitUpdatePayload = {
    fb_status,
    updated_at: new Date().toISOString(),
  };

  // If relisting or listing for the first time, update timestamp
  if (fb_status === 'Listed') {
    updates.last_relisted_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('units')
    .update(updates)
    .eq('id', unitId);

  if (error) {
    throw new Error(`Failed to update Facebook listing status: ${error.message}`);
  }

  revalidatePath('/admin');
  return { success: true };
}

/**
 * Quick action to refresh/renew the Facebook Marketplace relist timer.
 */
export async function relistUnit(unitId: string) {
  const { supabase } = await verifyAdmin();

  const { error } = await supabase
    .from('units')
    .update({
      fb_status: 'Listed',
      last_relisted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', unitId);

  if (error) {
    throw new Error(`Failed to relist unit: ${error.message}`);
  }

  revalidatePath('/admin');
  return { success: true };
}

/**
 * Deletes a vehicle and cleans up its database record (Storage photos are handled by photo manager).
 */
export async function deleteUnit(unitId: string) {
  const { supabase } = await verifyAdmin();

  const { error } = await supabase
    .from('units')
    .delete()
    .eq('id', unitId);

  if (error) {
    throw new Error(`Failed to delete unit: ${error.message}`);
  }

  revalidatePath('/admin');
  revalidatePath('/');
  return { success: true };
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
 */
export async function saveVehicle(input: SaveVehicleInput) {
  const { supabase } = await verifyAdmin();

  const slug = generateVehicleSlug(
    input.year,
    input.make,
    input.model,
    input.variant,
    input.transmission,
    input.fuel
  );

  const payload = {
    slug,
    year: Number(input.year),
    make: input.make.trim(),
    model: input.model.trim(),
    variant: input.variant.trim(),
    transmission: input.transmission,
    fuel: input.fuel,
    mileage: Number(input.mileage),
    body_type: input.body_type,
    plate_ending: input.plate_ending.trim(),
    cash_price: Number(input.cash_price),
    default_all_in_dp: Number(input.default_all_in_dp),
    status: input.status,
    fb_status: input.fb_status,
    description_notes: input.description_notes ? input.description_notes.trim() : null,
    boost_start: input.boost_start || null,
    boost_end: input.boost_end || null,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    // Update existing vehicle
    const { error } = await supabase
      .from('units')
      .update(payload)
      .eq('id', input.id);

    if (error) {
      throw new Error(`Failed to update vehicle: ${error.message}`);
    }
  } else {
    // Insert new vehicle
    const { error } = await supabase
      .from('units')
      .insert({
        ...payload,
        last_relisted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

    if (error) {
      throw new Error(`Failed to create vehicle: ${error.message}`);
    }
  }

  revalidatePath('/admin');
  revalidatePath('/');
  return { success: true };
}
