'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { VehicleUnit, BodyType } from '@/types/database';
import { formatPHP } from '@/lib/calculator';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Gauge,
  Fuel,
  Car,
  Camera,
  ChevronRight,
  X,
} from 'lucide-react';

interface ShowroomCatalogProps {
  initialUnits: VehicleUnit[];
}

const BODY_TYPES: Array<'All' | BodyType> = [
  'All',
  'Pickup',
  'SUV',
  'Sedan',
  'Van',
  'Hatchback',
];

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'mileage-asc';

export default function ShowroomCatalog({ initialUnits }: ShowroomCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBodyType, setSelectedBodyType] = useState<'All' | BodyType>('All');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Filter and sort units
  const filteredUnits = useMemo(() => {
    let result = [...initialUnits];

    // Search query filter
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((unit) => {
        const fullTitle = `${unit.year} ${unit.make} ${unit.model} ${unit.variant}`.toLowerCase();
        const specs = `${unit.transmission} ${unit.fuel} ${unit.body_type} ${unit.plate_ending}`.toLowerCase();
        return fullTitle.includes(query) || specs.includes(query);
      });
    }

    // Body type filter
    if (selectedBodyType !== 'All') {
      result = result.filter((unit) => unit.body_type === selectedBodyType);
    }

    // Sort order
    result.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.cash_price - b.cash_price;
        case 'price-desc':
          return b.cash_price - a.cash_price;
        case 'mileage-asc':
          return a.mileage - b.mileage;
        case 'newest':
        default:
          // Sort by year descending, then created_at descending
          if (b.year !== a.year) {
            return b.year - a.year;
          }
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [initialUnits, searchQuery, selectedBodyType, sortBy]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedBodyType('All');
    setSortBy('newest');
  };

  return (
    <section className="space-y-8">
      {/* Search, Filter Pills & Sort Bar */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-6 backdrop-blur-md space-y-4">
        {/* Search input and sort controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by make, model, variant, year, transmission..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-9 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/50 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative min-w-[200px]">
            <div className="relative">
              <ArrowUpDown className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sort vehicles"
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-8 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-amber-500/70 appearance-none cursor-pointer transition-colors"
              >
                <option value="newest">Newest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="mileage-asc">Lowest Mileage</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 text-xs">
                ▼
              </div>
            </div>
          </div>
        </div>

        {/* Body Type Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Type:</span>
          </span>
          {BODY_TYPES.map((type) => {
            const count =
              type === 'All'
                ? initialUnits.length
                : initialUnits.filter((u) => u.body_type === type).length;
            const isActive = selectedBodyType === type;

            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedBodyType(type)}
                className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all duration-200 shrink-0 border ${
                  isActive
                    ? 'bg-amber-500 text-black border-amber-400 font-semibold shadow-md shadow-amber-500/20'
                    : 'bg-zinc-950/60 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
                }`}
              >
                {type} <span className="opacity-70 text-[11px]">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Catalog Status Bar */}
      <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
        <span>
          Showing <strong className="text-zinc-200">{filteredUnits.length}</strong> of{' '}
          <strong className="text-zinc-200">{initialUnits.length}</strong> available vehicles
        </span>
        {(searchQuery || selectedBodyType !== 'All') && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Vehicles Grid */}
      {filteredUnits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center space-y-3 bg-zinc-900/30">
          <Car className="w-10 h-10 text-zinc-600 mx-auto" />
          <h3 className="text-lg font-semibold text-zinc-200">No vehicles match your criteria</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Try adjusting your search terms or selecting a different body type filter.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 text-xs font-medium text-white hover:bg-zinc-700 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUnits.map((unit, index) => {
            const primaryImage =
              unit.images && unit.images.length > 0 ? unit.images[0].image_url : null;
            const photoCount = unit.images?.length || 0;

            return (
              <article
                key={unit.id}
                className="group rounded-2xl border border-zinc-800 bg-zinc-900/70 hover:border-amber-500/40 hover:bg-zinc-900 transition-all duration-300 flex flex-col overflow-hidden shadow-lg hover:shadow-amber-500/5"
              >
                {/* Photo Container */}
                <Link
                  href={`/unit/${unit.slug}`}
                  className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-950 block"
                >
                  {primaryImage ? (
                    <Image
                      src={primaryImage}
                      alt={`${unit.year} ${unit.make} ${unit.model} ${unit.variant}`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority={index < 3}
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 gap-2 bg-zinc-950">
                      <Car className="w-12 h-12" />
                      <span className="text-xs">No Photo Available</span>
                    </div>
                  )}

                  {/* Badges Overlay */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-black/75 backdrop-blur-md text-white border border-white/10">
                      {unit.year}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
                      {unit.status}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-black/70 backdrop-blur-md text-zinc-300 border border-white/10">
                      {unit.body_type}
                    </span>
                    {photoCount > 0 && (
                      <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-black/70 backdrop-blur-md text-zinc-300 border border-white/10 inline-flex items-center gap-1">
                        <Camera className="w-3 h-3 text-amber-400" />
                        <span>{photoCount}</span>
                      </span>
                    )}
                  </div>
                </Link>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Make / Model / Variant */}
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                        <Link href={`/unit/${unit.slug}`}>
                          {unit.make} {unit.model}
                        </Link>
                      </h3>
                      <p className="text-xs text-zinc-400 line-clamp-1">{unit.variant}</p>
                    </div>

                    {/* Specs Pills */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300 mb-4">
                      <div className="flex items-center gap-1.5 bg-zinc-950/60 px-2.5 py-1.5 rounded-lg border border-zinc-800/80">
                        <Gauge className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate">{unit.mileage.toLocaleString('en-US')} km</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-zinc-950/60 px-2.5 py-1.5 rounded-lg border border-zinc-800/80">
                        <Fuel className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate">{unit.fuel}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-zinc-950/60 px-2.5 py-1.5 rounded-lg border border-zinc-800/80">
                        <Car className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate">{unit.transmission}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-zinc-950/60 px-2.5 py-1.5 rounded-lg border border-zinc-800/80">
                        <span className="text-zinc-500 font-mono text-[11px]">#</span>
                        <span className="truncate">Ending {unit.plate_ending}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Action */}
                  <div className="pt-4 border-t border-zinc-800">
                    <div className="space-y-1 mb-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs font-medium text-zinc-400">Cash Price:</span>
                        <span className="text-xl font-bold text-white tracking-tight">
                          {formatPHP(unit.cash_price)}
                        </span>
                      </div>
                      {unit.default_all_in_dp > 0 && (
                        <div className="flex items-baseline justify-between text-xs">
                          <span className="text-zinc-400">Target All-In DP:</span>
                          <span className="font-semibold text-amber-400">
                            {formatPHP(unit.default_all_in_dp)}
                          </span>
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/unit/${unit.slug}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-amber-500 hover:text-black font-semibold text-xs text-zinc-100 transition-all duration-200 group/btn"
                    >
                      <span>View Details & Inquire</span>
                      <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
