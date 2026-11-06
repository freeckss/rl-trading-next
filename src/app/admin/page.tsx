import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { mockVehicleUnits } from '@/lib/mockUnits';
import type { VehicleUnit, UnitImage } from '@/types/database';
import AdminDashboardClient from '@/components/admin/AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.app_metadata?.role;

  // In production, enforce admin check. In local dev without active session, redirect to login unless mock data testing
  if (!user || role !== 'admin') {
    // If not authenticated admin, proxy and page redirect to login
    redirect('/admin/login');
  }

  let units: VehicleUnit[] = [];

  try {
    const { data, error } = await supabase
      .from('units')
      .select(`
        *,
        images:unit_images(*)
      `)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      if (process.env.NODE_ENV !== 'production' || process.env.USE_MOCK_DATA === 'true') {
        units = mockVehicleUnits;
      }
    } else {
      units = data.map((unit) => {
        const sortedImages = Array.isArray(unit.images)
          ? [...(unit.images as UnitImage[])].sort((a, b) => a.display_order - b.display_order)
          : [];

        return {
          ...unit,
          images: sortedImages,
        };
      });
    }
  } catch (err) {
    console.error('[AdminPage] Failed to fetch inventory:', err);
    if (process.env.NODE_ENV !== 'production' || process.env.USE_MOCK_DATA === 'true') {
      units = mockVehicleUnits;
    }
  }

  return (
    <AdminDashboardClient
      initialUnits={units}
      userEmail={user.email || 'admin@rltrading.ph'}
      serverTimestamp={Date.now()}
    />
  );
}
