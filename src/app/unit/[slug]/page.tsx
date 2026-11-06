export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getAvailableUnits, getUnitByIdOrSlug } from '@/lib/services/vehicleService';
import { formatPHP } from '@/lib/calculator';
import PhotoGallery from '@/components/PhotoGallery';
import CopyInquiryButton from '@/components/CopyInquiryButton';
import type { UnitStatus } from '@/types/database';
import { getCodingDay } from '@/lib/business';
import {
  Car,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Phone,
  Tag,
  Clock,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';

interface VehicleDetailPageProps {
  params: Promise<{ slug: string }>;
}

function getStatusBadgeStyle(status: UnitStatus) {
  switch (status) {
    case 'Available':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'Pending':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'Sold':
      return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    default:
      return 'bg-zinc-800 text-zinc-400 border-zinc-700';
  }
}

export async function generateStaticParams() {
  const units = await getAvailableUnits();
  if (units.length === 0) {
    // Return sample slugs for build-time validation under Cache Components when building without a live database
    return [
      { slug: '2019-toyota-hilux-2-4-g-conquest-at' },
      { slug: '2014-nissan-teana-2-5-v6-at' },
      { slug: '2018-toyota-vios-1-3-e-at' },
    ];
  }
  return units.map((u) => ({ slug: u.slug }));
}

export async function generateMetadata({ params }: VehicleDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const unit = await getUnitByIdOrSlug(slug);

  if (!unit) {
    return {
      title: 'Vehicle Not Found | RL Trading',
      description: 'The requested pre-owned vehicle listing could not be found.',
      robots: {
        index: false,
      },
    };
  }

  const title = `${unit.year} ${unit.make} ${unit.model} ${unit.variant} | RL Trading Angeles City`;
  const primaryPhoto = unit.images && unit.images.length > 0 ? unit.images[0].image_url : undefined;
  const dpText =
    unit.default_all_in_dp > 0 ? ` | Target All-In DP: ${formatPHP(unit.default_all_in_dp)}` : '';
  const specsText = `Cash Price: ${formatPHP(unit.cash_price)}${dpText} • ${unit.transmission} • ${unit.fuel} • ${unit.mileage.toLocaleString('en-US')} km • Plate Ending ${unit.plate_ending}.`;

  let description: string;
  if (unit.status === 'Sold') {
    description = `SOLD — ${specsText} RL Trading & SEat n Go, MacArthur Hwy, Pulung Bulu, Angeles City, Pampanga.`;
  } else if (unit.status === 'Pending') {
    description = `RESERVED — ${specsText} RL Trading & SEat n Go, MacArthur Hwy, Pulung Bulu, Angeles City, Pampanga.`;
  } else {
    description = `${specsText} Available at RL Trading & SEat n Go, MacArthur Hwy, Pulung Bulu, Angeles City, Pampanga.`;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `/unit/${unit.slug}`,
      images: primaryPhoto
        ? [
            {
              url: primaryPhoto,
              alt: `${unit.year} ${unit.make} ${unit.model} ${unit.variant}`,
            },
          ]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: primaryPhoto ? [primaryPhoto] : [],
    },
  };
}

async function VehicleDetailContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const unit = await getUnitByIdOrSlug(slug);

  // Clean, branded empty-state if the vehicle was not found or is unavailable
  if (!unit) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center px-4 py-16 text-center">
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-amber-400 mb-4 shadow-xl">
          <Car className="w-12 h-12" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Vehicle Not Available
        </h1>
        <p className="text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
          This vehicle listing may have been sold, unlisted, or the link may be outdated. Explore our currently available vehicles in our Angeles City showroom.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs inline-flex items-center gap-2 transition-colors shadow-lg shadow-amber-500/20"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Return to Buyer Showroom</span>
        </Link>
      </main>
    );
  }

  const title = `${unit.year} ${unit.make} ${unit.model}`;
  const codingDay = getCodingDay(unit.plate_ending);

  return (
    <main
      className={`min-h-screen bg-zinc-950 text-zinc-100 flex flex-col ${
        unit.status === 'Sold' ? 'pb-12' : 'pb-24 md:pb-12'
      } selection:bg-amber-500 selection:text-black`}
    >
      {/* Top Header / Breadcrumb Navigation */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-amber-400 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to All Showroom Units</span>
          </Link>

          <div className="flex items-center gap-2 text-xs">
            <span className="hidden sm:inline-block text-zinc-500">RL Trading & SEat n Go</span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getStatusBadgeStyle(
                unit.status
              )}`}
            >
              {unit.status}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full flex-1">
        {/* Prominent Status Banner for Sold and Pending */}
        {unit.status !== 'Available' && (
          <div
            className={`mb-6 p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              unit.status === 'Sold'
                ? 'bg-zinc-900 border-zinc-700/80 text-zinc-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  unit.status === 'Sold'
                    ? 'bg-zinc-800 text-zinc-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {unit.status === 'Sold' ? (
                  <Car className="w-5 h-5" />
                ) : (
                  <Clock className="w-5 h-5" />
                )}
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white">
                  {unit.status === 'Sold'
                    ? 'This unit has been sold'
                    : 'This unit is reserved — pending sale'}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {unit.status === 'Sold'
                    ? 'This vehicle listing is archived and is no longer available for purchase.'
                    : 'A buyer has placed a deposit on this unit. You may still inquire in case the transaction does not push through.'}
                </p>
              </div>
            </div>

            <Link
              href="/"
              className={`px-4 py-2.5 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-1.5 shrink-0 transition-colors ${
                unit.status === 'Sold'
                  ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
              }`}
            >
              <span>View available units</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Title & Headline */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-500 text-black">
              {unit.year}
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
              {unit.body_type}
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
              Coding: {codingDay}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 mt-1 font-medium">{unit.variant}</p>
        </div>

        {/* 2-Column Layout: Photo Gallery (Left) & Pricing / Inquiries (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: 40-Photo Gallery & Vehicle Description */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">
            {/* Multi-Photo Gallery with Full-Screen Lightbox */}
            <PhotoGallery images={unit.images} unitTitle={`${title} ${unit.variant}`} />

            {/* Complete Specifications Grid */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-400" />
                <span>Vehicle Specifications</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                  <span className="text-zinc-500 block mb-0.5">Transmission</span>
                  <span className="font-semibold text-zinc-200">{unit.transmission}</span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                  <span className="text-zinc-500 block mb-0.5">Fuel Type</span>
                  <span className="font-semibold text-zinc-200">{unit.fuel}</span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                  <span className="text-zinc-500 block mb-0.5">Odometer Mileage</span>
                  <span className="font-semibold text-zinc-200">
                    {unit.mileage.toLocaleString('en-US')} km
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                  <span className="text-zinc-500 block mb-0.5">Body Configuration</span>
                  <span className="font-semibold text-zinc-200">{unit.body_type}</span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                  <span className="text-zinc-500 block mb-0.5">Plate Ending</span>
                  <span className="font-semibold text-zinc-200">
                    {unit.plate_ending} · {codingDay}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                  <span className="text-zinc-500 block mb-0.5">Unit Status</span>
                  <span className={`font-semibold ${unit.status === 'Available' ? 'text-emerald-400' : 'text-zinc-400'}`}>
                    {unit.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Dealer Notes & Vehicle Description */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Car className="w-4 h-4 text-amber-400" />
                <span>Vehicle Details & Condition Notes</span>
              </h2>

              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                {unit.description_notes ||
                  'No additional condition notes specified for this vehicle. Contact our showroom team for complete maintenance history.'}
              </p>
            </div>
          </div>

          {/* Right Column: Pricing Card, Custom Financing Note & Inquiries */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-20">
            {/* Primary Pricing Card */}
            <div className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 via-zinc-900/90 to-zinc-950 p-6 space-y-5 shadow-2xl">
              <div>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                  Dealership Cash Price
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {formatPHP(unit.cash_price)}
                </div>
              </div>

              {unit.default_all_in_dp > 0 && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                  <span className="text-xs font-medium text-amber-400/90 block">
                    Target All-In Downpayment:
                  </span>
                  <div className="text-2xl font-bold text-amber-400">
                    {formatPHP(unit.default_all_in_dp)}
                  </div>
                  <p className="text-[11px] text-zinc-400 pt-1 leading-snug">
                    *Includes estimated bank processing fee and unit downpayment. Subject to bank approval.
                  </p>
                </div>
              )}

              {/* Flexible Financing Notice */}
              <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs space-y-1 text-zinc-400">
                <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Flexible Bank Financing Available</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  We work with major Philippine auto financing banks (24, 36, or 48 months terms). Message us for a personalized monthly amortization computation matching your target downpayment.
                </p>
              </div>

              {/* Copy Inquiry & Call Buttons (Hidden for Sold units) */}
              {unit.status !== 'Sold' && (
                <>
                  <CopyInquiryButton unit={unit} />

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href="tel:09237309644"
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-emerald-950/40"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Smart</span>
                    </a>
                    <a
                      href="tel:09174403909"
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-emerald-950/40"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Globe</span>
                    </a>
                  </div>
                </>
              )}
            </div>

            {/* Showroom Location & Visiting Hours Card */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4 text-xs">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>Showroom Location & Viewings</span>
              </h3>

              <div className="space-y-1.5 text-zinc-300 leading-relaxed">
                <p className="font-semibold text-white">RL Trading & SEat n Go Shuttle Services</p>
                <p className="text-zinc-400">
                  MacArthur Highway, Pulung Bulu, Angeles City, Pampanga
                </p>
                <p className="text-zinc-500 text-[11px]">
                  Landmark: Beside Shell Gas Station, directly in front of Motech Auto Center.
                </p>
              </div>

              <div className="space-y-1 pt-2 border-t border-zinc-800/80 text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Monday – Saturday: 8:00 AM – 6:00 PM</span>
                </div>
                <div className="text-zinc-500 pl-5 text-[11px]">
                  Sunday viewings available by appointment.
                </div>
              </div>

              <a
                href="https://maps.app.goo.gl/JFw6ufXYTxyfvWHk8"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-colors border border-zinc-700"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Bottom Action Bar (Hidden for Sold units) */}
      {unit.status !== 'Sold' && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 p-3 shadow-2xl flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[11px] text-zinc-400 block truncate">Cash Price:</span>
            <span className="text-base font-bold text-white truncate block">
              {formatPHP(unit.cash_price)}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="tel:09237309644"
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 active:bg-emerald-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-md"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Dealership</span>
            </a>
          </div>
        </div>
      )}
    </main>
  );
}

function VehicleDetailSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-950 p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-zinc-900 rounded-lg" />
      <div className="h-12 w-96 bg-zinc-900 rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 xl:col-span-8 aspect-[16/10] bg-zinc-900 rounded-2xl" />
        <div className="lg:col-span-5 xl:col-span-4 h-96 bg-zinc-900 rounded-2xl" />
      </div>
    </div>
  );
}

export default function VehicleDetailPage({ params }: VehicleDetailPageProps) {
  return (
    <Suspense fallback={<VehicleDetailSkeleton />}>
      <VehicleDetailContent params={params} />
    </Suspense>
  );
}
