'use client';

import { useState } from 'react';
import type {
  VehicleUnit,
  BodyType,
  TransmissionType,
  FuelType,
  UnitStatus,
  FbListingStatus,
} from '@/types/database';
import { saveVehicle } from '@/lib/actions/adminActions';
import { generateVehicleSlug } from '@/lib/slugs';
import { isoToDateTimeLocal, dateTimeLocalToIso } from '@/lib/dates';
import { X, Loader2, Save, Car, AlertCircle } from 'lucide-react';

interface VehicleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: VehicleUnit | null;
  onSuccess: (savedUnit?: VehicleUnit) => void;
}

const BODY_TYPES: BodyType[] = ['Pickup', 'SUV', 'Sedan', 'Van', 'Hatchback'];
const TRANSMISSIONS: TransmissionType[] = ['Automatic', 'Manual'];
const FUELS: FuelType[] = ['Diesel', 'Gasoline'];
const STATUSES: UnitStatus[] = ['Available', 'Pending', 'Sold'];
const FB_STATUSES: FbListingStatus[] = ['Listed', 'Unlisted'];

function VehicleFormDialog({
  onClose,
  unit,
  onSuccess,
}: Omit<VehicleFormModalProps, 'isOpen'>) {
  const [year, setYear] = useState<number>(unit?.year ?? 2024);
  const [make, setMake] = useState(unit?.make ?? 'Toyota');
  const [model, setModel] = useState(unit?.model ?? '');
  const [variant, setVariant] = useState(unit?.variant ?? '');
  const [transmission, setTransmission] = useState<TransmissionType>(
    unit?.transmission ?? 'Automatic'
  );
  const [fuel, setFuel] = useState<FuelType>(unit?.fuel ?? 'Diesel');
  const [mileage, setMileage] = useState<number>(unit?.mileage ?? 50000);
  const [bodyType, setBodyType] = useState<BodyType>(unit?.body_type ?? 'Pickup');
  const [plateEnding, setPlateEnding] = useState(unit?.plate_ending ?? '');
  const [cashPrice, setCashPrice] = useState<number>(unit?.cash_price ?? 1000000);
  const [defaultAllInDp, setDefaultAllInDp] = useState<number>(
    unit?.default_all_in_dp ?? 300000
  );
  const [status, setStatus] = useState<UnitStatus>(unit?.status ?? 'Available');
  const [fbStatus, setFbStatus] = useState<FbListingStatus>(unit?.fb_status ?? 'Listed');
  const [descriptionNotes, setDescriptionNotes] = useState(unit?.description_notes ?? '');
  const [boostStart, setBoostStart] = useState(() => isoToDateTimeLocal(unit?.boost_start));
  const [boostEnd, setBoostEnd] = useState(() => isoToDateTimeLocal(unit?.boost_end));

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If editing an existing unit, display its permanent immutable slug; if new, preview generated slug
  const canonicalSlug = unit
    ? unit.slug
    : generateVehicleSlug(year, make, model, variant, 'auto');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      if (!make.trim() || !model.trim() || !variant.trim() || !plateEnding.trim()) {
        throw new Error('Please fill out all required vehicle identifiers.');
      }

      const result = await saveVehicle({
        id: unit?.id,
        year,
        make,
        model,
        variant,
        transmission,
        fuel,
        mileage,
        body_type: bodyType,
        plate_ending: plateEnding,
        cash_price: cashPrice,
        default_all_in_dp: defaultAllInDp,
        status,
        fb_status: fbStatus,
        description_notes: descriptionNotes,
        boost_start: dateTimeLocalToIso(boostStart),
        boost_end: dateTimeLocalToIso(boostEnd),
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      onSuccess(result.data);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save vehicle.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 shadow-2xl my-8 text-zinc-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {unit ? `Edit: ${unit.year} ${unit.make} ${unit.model}` : 'Add New Inventory Vehicle'}
              </h2>
              <p className="text-xs text-zinc-400">
                Configure specs, pricing, and marketplace flags for this lot unit
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Row 1: Year, Make, Model, Variant */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300 block">Year</label>
              <input
                type="number"
                min={1990}
                max={2035}
                required
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300 block">Make</label>
              <input
                type="text"
                required
                placeholder="Toyota, Nissan..."
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300 block">Model</label>
              <input
                type="text"
                required
                placeholder="Hilux, Vios, Teana..."
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300 block">Variant</label>
              <input
                type="text"
                required
                placeholder="2.4 G Conquest, 1.3 E..."
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Row 2: Transmission, Fuel, Body Type, Plate Ending */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300 block">Transmission</label>
              <select
                value={transmission}
                onChange={(e) => setTransmission(e.target.value as TransmissionType)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                {TRANSMISSIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300 block">Fuel</label>
              <select
                value={fuel}
                onChange={(e) => setFuel(e.target.value as FuelType)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                {FUELS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300 block">Body Type</label>
              <select
                value={bodyType}
                onChange={(e) => setBodyType(e.target.value as BodyType)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                {BODY_TYPES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300 block">Plate Ending</label>
              <input
                type="text"
                maxLength={2}
                required
                placeholder="8"
                value={plateEnding}
                onChange={(e) => setPlateEnding(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Row 3: Mileage, Cash Price, Target All-In DP */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300 block">Mileage (km)</label>
              <input
                type="number"
                min={0}
                required
                value={mileage}
                onChange={(e) => setMileage(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300 block">Cash Price (₱)</label>
              <input
                type="number"
                min={1}
                step={1}
                required
                value={cashPrice}
                onChange={(e) => setCashPrice(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300 block">
                Target All-In DP (₱)
              </label>
              <input
                type="number"
                min={0}
                step={1}
                required
                value={defaultAllInDp}
                onChange={(e) => setDefaultAllInDp(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-amber-400 font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Row 4: Dealership Status & Facebook Marketplace Status */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300 block">Showroom Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as UnitStatus)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300 block">FB Marketplace</label>
              <select
                value={fbStatus}
                onChange={(e) => setFbStatus(e.target.value as FbListingStatus)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                {FB_STATUSES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300 block">Boost Start (PH Time)</label>
              <input
                type="datetime-local"
                value={boostStart}
                onChange={(e) => setBoostStart(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300 block">Boost End (PH Time)</label>
              <input
                type="datetime-local"
                value={boostEnd}
                onChange={(e) => setBoostEnd(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Generated Slug Indicator */}
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs text-zinc-400">
            <span className="text-zinc-500 block mb-0.5">
              {unit ? 'Permanent Canonical URL Slug (Immutable):' : 'Generated Canonical URL Slug (with collision-proof suffix):'}
            </span>
            <code className="text-amber-400/90 font-mono text-[11px] break-all">
              /unit/{canonicalSlug}
            </code>
          </div>

          {/* Description Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-300 block">
              Condition & Description Notes
            </label>
            <textarea
              rows={3}
              placeholder="First owner, cold AC, complete documents, key features..."
              value={descriptionNotes}
              onChange={(e) => setDescriptionNotes(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-bold text-xs inline-flex items-center gap-2 transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Saving Vehicle...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{unit ? 'Update Vehicle Record' : 'Create Vehicle'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VehicleFormModal({
  isOpen,
  onClose,
  unit,
  onSuccess,
}: VehicleFormModalProps) {
  if (!isOpen) return null;

  return (
    <VehicleFormDialog
      key={unit ? unit.id : 'new-vehicle'}
      onClose={onClose}
      unit={unit}
      onSuccess={onSuccess}
    />
  );
}
