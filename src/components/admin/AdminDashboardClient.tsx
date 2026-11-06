'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { VehicleUnit, UnitStatus, FbListingStatus } from '@/types/database';
import { formatPHP } from '@/lib/calculator';
import { createClient } from '@/lib/supabase/client';
import {
  updateUnitStatus,
  updateUnitFbStatus,
  relistUnit,
  deleteUnit,
} from '@/lib/actions/adminActions';
import VehicleFormModal from '@/components/admin/VehicleFormModal';
import PhotoManagerModal from '@/components/admin/PhotoManagerModal';
import {
  Car,
  Plus,
  Search,
  ExternalLink,
  LogOut,
  Camera,
  Edit2,
  Trash2,
  RefreshCw,
  Sparkles,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Loader2,
  Share2,
} from 'lucide-react';

interface AdminDashboardClientProps {
  initialUnits: VehicleUnit[];
  userEmail: string;
  serverTimestamp?: number;
}

export default function AdminDashboardClient({
  initialUnits,
  userEmail,
  serverTimestamp,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const [units, setUnits] = useState<VehicleUnit[]>(initialUnits);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedUnitForEdit, setSelectedUnitForEdit] = useState<VehicleUnit | null>(null);

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedUnitForPhotos, setSelectedUnitForPhotos] = useState<VehicleUnit | null>(null);

  // Calculate Dealership KPIs
  const totalUnits = units.length;
  const availableUnits = units.filter((u) => u.status === 'Available').length;
  const pendingUnits = units.filter((u) => u.status === 'Pending').length;
  const soldUnits = units.filter((u) => u.status === 'Sold').length;
  const totalAvailableValuation = units
    .filter((u) => u.status === 'Available')
    .reduce((sum, u) => sum + Number(u.cash_price), 0);

  // Handle Logout
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  // Inline Status Change
  const handleStatusChange = async (unitId: string, newStatus: UnitStatus) => {
    setUpdatingId(unitId);
    try {
      await updateUnitStatus(unitId, newStatus);
      setUnits((prev) =>
        prev.map((u) => (u.id === unitId ? { ...u, status: newStatus } : u))
      );
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Inline FB Status Change
  const handleFbStatusToggle = async (unitId: string, currentStatus: FbListingStatus) => {
    setUpdatingId(unitId);
    const newStatus: FbListingStatus = currentStatus === 'Listed' ? 'Unlisted' : 'Listed';
    try {
      await updateUnitFbStatus(unitId, newStatus);
      setUnits((prev) =>
        prev.map((u) =>
          u.id === unitId
            ? {
                ...u,
                fb_status: newStatus,
                last_relisted_at:
                  newStatus === 'Listed' ? new Date().toISOString() : u.last_relisted_at,
              }
            : u
        )
      );
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update Facebook status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Quick Relist
  const handleRelist = async (unitId: string) => {
    setUpdatingId(unitId);
    try {
      await relistUnit(unitId);
      const now = new Date().toISOString();
      setUnits((prev) =>
        prev.map((u) =>
          u.id === unitId ? { ...u, fb_status: 'Listed', last_relisted_at: now } : u
        )
      );
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to relist unit.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Delete Unit
  const handleDeleteUnit = async (unit: VehicleUnit) => {
    const confirmName = `${unit.year} ${unit.make} ${unit.model}`;
    if (!confirm(`Are you sure you want to permanently delete ${confirmName}?`)) return;

    setUpdatingId(unit.id);
    try {
      await deleteUnit(unit.id);
      setUnits((prev) => prev.filter((u) => u.id !== unit.id));
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete vehicle.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Relist Timer Badge calculation
  const getRelistBadge = (lastRelistedAt: string) => {
    const lastDate = new Date(lastRelistedAt);
    const baseTime = serverTimestamp ?? 0;
    const diffDays =
      baseTime > 0 && !isNaN(lastDate.getTime())
        ? Math.max(0, Math.floor((baseTime - lastDate.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

    if (diffDays < 7) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
          {diffDays}d ago (Active)
        </span>
      );
    } else if (diffDays <= 20) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
          {diffDays}d ago (Renew)
        </span>
      );
    } else {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 whitespace-nowrap">
          {diffDays}d ago (Relist!)
        </span>
      );
    }
  };

  // Filtered inventory list
  const filteredUnits = units.filter((u) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const searchString = `${u.year} ${u.make} ${u.model} ${u.variant} ${u.plate_ending} ${u.status} ${u.body_type}`.toLowerCase();
    return searchString.includes(query);
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-amber-500 selection:text-black">
      {/* Admin Top Navigation Bar */}
      <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-black font-black shadow-md shadow-amber-500/20">
              <Car className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  RL Trading Command Center
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                  Admin
                </span>
              </div>
              <p className="text-xs text-zinc-400">{userEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
            >
              <span>Public Showroom</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* Top Dealership KPI Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span>Total Lot Units</span>
              <Car className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="text-2xl font-extrabold text-white">{totalUnits}</div>
            <span className="text-[11px] text-zinc-500">Registered on lot</span>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-1">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-medium">
              <span>Active Available</span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-400">{availableUnits}</div>
            <span className="text-[11px] text-zinc-400">Ready for buyers</span>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-1">
            <div className="flex items-center justify-between text-amber-400 text-xs font-medium">
              <span>In Negotiation</span>
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-amber-400">{pendingUnits}</div>
            <span className="text-[11px] text-zinc-400">Pending / Reserved</span>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span>Sold Units</span>
              <DollarSign className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="text-2xl font-extrabold text-zinc-300">{soldUnits}</div>
            <span className="text-[11px] text-zinc-500">Transferred</span>
          </div>

          <div className="col-span-2 lg:col-span-1 rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900/80 to-zinc-950 p-4 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span>Active Valuation</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-extrabold text-white truncate">
              {formatPHP(totalAvailableValuation)}
            </div>
            <span className="text-[11px] text-zinc-500">Sum of cash prices</span>
          </div>
        </section>

        {/* Action Controls & Table Filter Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search lot inventory by year, make, model, plate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedUnitForEdit(null);
              setIsFormModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-bold text-xs shadow-lg shadow-amber-500/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vehicle to Lot</span>
          </button>
        </div>

        {/* Inventory Management Table */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/80 text-zinc-400 uppercase font-semibold text-[11px] tracking-wider">
                  <th className="py-3 px-4">Vehicle Unit</th>
                  <th className="py-3 px-4">Pricing</th>
                  <th className="py-3 px-4">Showroom Status</th>
                  <th className="py-3 px-4">FB Marketplace</th>
                  <th className="py-3 px-4">Relist Timer</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 text-zinc-200">
                {filteredUnits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-500 text-xs">
                      No vehicles found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredUnits.map((unit) => {
                    const primaryImage =
                      unit.images && unit.images.length > 0 ? unit.images[0].image_url : null;
                    const photoCount = unit.images?.length || 0;
                    const isRowBusy = updatingId === unit.id;

                    return (
                      <tr
                        key={unit.id}
                        className="hover:bg-zinc-800/30 transition-colors group"
                      >
                        {/* Vehicle Info & Cover Image */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-zinc-950 shrink-0 border border-zinc-800">
                              {primaryImage ? (
                                <Image
                                  src={primaryImage}
                                  alt={unit.model}
                                  fill
                                  sizes="64px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                  <Car className="w-5 h-5" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 font-bold text-white text-sm truncate">
                                <span>
                                  {unit.year} {unit.make} {unit.model}
                                </span>
                              </div>
                              <div className="text-zinc-400 text-xs truncate">{unit.variant}</div>
                              <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                                <span>{unit.body_type}</span>
                                <span>•</span>
                                <span>{unit.transmission}</span>
                                <span>•</span>
                                <span>Ending {unit.plate_ending}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Cash Price & Target Downpayment */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-white text-sm">
                            {formatPHP(unit.cash_price)}
                          </div>
                          {unit.default_all_in_dp > 0 && (
                            <div className="text-[11px] text-amber-400 font-semibold">
                              DP: {formatPHP(unit.default_all_in_dp)}
                            </div>
                          )}
                          <div className="text-[10px] text-zinc-500">
                            {unit.mileage.toLocaleString()} km
                          </div>
                        </td>

                        {/* Showroom Status Selector */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <select
                            value={unit.status}
                            disabled={isRowBusy}
                            onChange={(e) =>
                              handleStatusChange(unit.id, e.target.value as UnitStatus)
                            }
                            aria-label={`Change status for ${unit.year} ${unit.make} ${unit.model}`}
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold border cursor-pointer focus:outline-none transition-colors ${
                              unit.status === 'Available'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : unit.status === 'Pending'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                            }`}
                          >
                            <option value="Available">Available</option>
                            <option value="Pending">Pending</option>
                            <option value="Sold">Sold</option>
                          </select>
                        </td>

                        {/* Facebook Marketplace Status Toggle */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <button
                            type="button"
                            disabled={isRowBusy}
                            onClick={() => handleFbStatusToggle(unit.id, unit.fb_status)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all inline-flex items-center gap-1.5 ${
                              unit.fb_status === 'Listed'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20'
                                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                            }`}
                          >
                            <Share2 className="w-3 h-3" />
                            <span>{unit.fb_status}</span>
                          </button>
                        </td>

                        {/* Relist Timer Badge & Fast Relist Action */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getRelistBadge(unit.last_relisted_at)}
                            <button
                              type="button"
                              disabled={isRowBusy}
                              onClick={() => handleRelist(unit.id)}
                              title="Reset Facebook relist timer to today"
                              className="p-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                            >
                              <RefreshCw className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* Row Action Buttons */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUnitForPhotos(unit);
                                setIsPhotoModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors text-xs font-semibold border border-zinc-700"
                            >
                              <Camera className="w-3.5 h-3.5 text-amber-400" />
                              <span>Photos ({photoCount})</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUnitForEdit(unit);
                                setIsFormModalOpen(true);
                              }}
                              title="Edit vehicle specs & pricing"
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors border border-zinc-700"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              disabled={isRowBusy}
                              onClick={() => handleDeleteUnit(unit)}
                              title="Delete vehicle record"
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-600 text-zinc-400 hover:text-white transition-colors border border-zinc-700"
                            >
                              {isRowBusy ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Vehicle Create / Edit Modal */}
      <VehicleFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        unit={selectedUnitForEdit}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* 40-Photo WebP Uploader Modal */}
      <PhotoManagerModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        unit={selectedUnitForPhotos}
        onPhotosUpdated={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
