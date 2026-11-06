export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import QRCode from 'qrcode';
import { createClient } from '@/lib/supabase/server';
import { mockVehicleUnits } from '@/lib/mockUnits';
import type { VehicleUnit } from '@/types/database';
import { formatPHP } from '@/lib/calculator';
import PrintButton from '@/components/admin/PrintButton';
import { ChevronLeft, Car, MapPin, Phone, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface PrintPageProps {
  params: Promise<{ id: string }>;
}

function getCodingDay(plateEnding: string): string {
  const lastDigit = plateEnding.trim().slice(-1);
  switch (lastDigit) {
    case '1':
    case '2':
      return 'Monday Coding (1, 2)';
    case '3':
    case '4':
      return 'Tuesday Coding (3, 4)';
    case '5':
    case '6':
      return 'Wednesday Coding (5, 6)';
    case '7':
    case '8':
      return 'Thursday Coding (7, 8)';
    case '9':
    case '0':
      return 'Friday Coding (9, 0)';
    default:
      return 'No Coding Restriction';
  }
}

export default async function PrintWindshieldPage({ params }: PrintPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Verify Admin Session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.role !== 'admin') {
    if (process.env.NODE_ENV === 'production') {
      redirect('/admin/login');
    }
  }

  let unit: VehicleUnit | null = null;

  try {
    const { data, error } = await supabase
      .from('units')
      .select('*, images:unit_images(*)')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      if (process.env.NODE_ENV !== 'production' || process.env.USE_MOCK_DATA === 'true') {
        unit = mockVehicleUnits.find((u) => u.id === id) || null;
      }
    } else {
      unit = data as VehicleUnit;
    }
  } catch {
    if (process.env.NODE_ENV !== 'production' || process.env.USE_MOCK_DATA === 'true') {
      unit = mockVehicleUnits.find((u) => u.id === id) || null;
    }
  }

  if (!unit) {
    notFound();
  }

  // Site URL validation
  if (!process.env.NEXT_PUBLIC_SITE_URL && process.env.NODE_ENV === 'production') {
    console.error(
      '[PrintWindshieldPage] WARNING: NEXT_PUBLIC_SITE_URL is not defined in production. Windshield QR codes may encode fallback domain rather than live production domain.'
    );
  }

  // Generate dynamic QR code encoding the public showroom listing URL (large size for windshield scanning)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rltrading.vercel.app';
  const canonicalUrl = `${siteUrl}/unit/${unit.slug}`;
  const qrCodeDataUrl = await QRCode.toDataURL(canonicalUrl, {
    width: 320,
    margin: 1,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });

  const codingInfo = getCodingDay(unit.plate_ending);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-900 print:bg-white print:text-black">
      {/* Top Action Bar (Hidden on Print) */}
      <div className="print:hidden border-b border-zinc-800 bg-zinc-900/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Return to Admin Command Center</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400 hidden sm:inline">
              Optimized for A4 / Letter Windshield Display
            </span>
            <PrintButton />
          </div>
        </div>
      </div>

      {/* Main Print Container (A4 / Letter single-page portrait layout: fits ~90% of page without page 2 overflow) */}
      <main className="max-w-4xl mx-auto p-4 sm:p-6 print:p-0 print:max-w-none print:h-screen print:flex print:flex-col print:justify-between">
        <div className="bg-white text-black border-4 border-black rounded-3xl print:rounded-none p-6 sm:p-7 print:p-5 shadow-2xl print:shadow-none flex-1 flex flex-col justify-between space-y-4 print:space-y-0">
          {/* Dealership Header */}
          <header className="border-b-4 border-black pb-4 text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <Car className="w-7 h-7 text-black shrink-0" />
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                RL Trading & SEat n Go Shuttle Services
              </h1>
            </div>
            <p className="text-xs sm:text-sm font-bold tracking-wide uppercase text-zinc-700">
              Quality Pre-Owned Vehicle Dealership & Passenger Shuttle Services
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-0.5 text-xs font-semibold text-zinc-600 pt-0.5">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                MacArthur Highway, Pulung Bulu, Angeles City, Pampanga (Beside Shell Station)
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                0917 440 3909 / 0923 730 9644
              </span>
            </div>
          </header>

          {/* Big Bold Vehicle Title */}
          <section className="text-center space-y-1 py-1">
            <span className="inline-block px-3 py-0.5 rounded-full bg-black text-white text-[11px] font-black uppercase tracking-wider">
              {unit.body_type} • Pre-Owned Certified
            </span>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight leading-none uppercase text-black">
              {unit.year} {unit.make} {unit.model}
            </h2>
            <p className="text-xl sm:text-2xl font-extrabold text-zinc-800 tracking-tight">
              {unit.variant}
            </p>
          </section>

          {/* Pricing Box: Cash Price & Target Downpayment */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Cash Price Banner */}
            <div className="border-4 border-black rounded-2xl p-5 text-center bg-zinc-50 flex flex-col justify-center">
              <span className="text-xs font-black uppercase tracking-widest text-zinc-600 mb-0.5">
                Cash Price (Negotiable)
              </span>
              <div className="text-4xl sm:text-5xl font-black text-black tracking-tight">
                {formatPHP(unit.cash_price)}
              </div>
              <span className="text-[11px] font-semibold text-zinc-600 mt-1">
                Complete Documents • Transfer Assistance Included
              </span>
            </div>

            {/* Target All-In Downpayment Box */}
            <div className="border-4 border-black rounded-2xl p-5 text-center bg-black text-white flex flex-col justify-center">
              <span className="text-xs font-black uppercase tracking-widest text-amber-400 mb-0.5">
                Target All-In Downpayment
              </span>
              <div className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                {unit.default_all_in_dp > 0
                  ? formatPHP(unit.default_all_in_dp)
                  : 'Flexible DP'}
              </div>
              <span className="text-[11px] font-semibold text-zinc-300 mt-1">
                Flexible 2-year, 3-year, or 4-year financing terms available upon approval
              </span>
            </div>
          </section>

          {/* 4-Column Specs Grid */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center border-y-4 border-black py-3">
            <div className="border-r-2 last:border-r-0 border-zinc-300 p-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
                Transmission
              </span>
              <span className="text-base sm:text-lg font-black text-black">{unit.transmission}</span>
            </div>

            <div className="border-r-2 last:border-r-0 border-zinc-300 p-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
                Fuel Type
              </span>
              <span className="text-base sm:text-lg font-black text-black">{unit.fuel}</span>
            </div>

            <div className="border-r-2 last:border-r-0 border-zinc-300 p-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
                Mileage
              </span>
              <span className="text-base sm:text-lg font-black text-black">
                {unit.mileage.toLocaleString()} km
              </span>
            </div>

            <div className="p-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
                Plate Ending
              </span>
              <span className="text-base sm:text-lg font-black text-black">
                Ending {unit.plate_ending}
              </span>
              <span className="text-[10px] font-bold text-zinc-600 block">
                {codingInfo}
              </span>
            </div>
          </section>

          {/* Bottom QR Code & Assurance Section */}
          <section className="flex flex-col sm:flex-row items-center gap-5 pt-1">
            {/* Dynamic QR Code (Enlarged 190px–200px for easy windshield scanning) */}
            <div className="shrink-0 border-4 border-black rounded-2xl p-2 bg-white flex flex-col items-center text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCodeDataUrl}
                alt={`QR code for ${unit.year} ${unit.make} ${unit.model}`}
                className="w-48 h-48 sm:w-50 sm:h-50 object-contain"
              />
              <span className="text-[10px] font-mono text-zinc-700 mt-1 max-w-[190px] truncate">
                {canonicalUrl.replace('https://', '')}
              </span>
            </div>

            {/* Scan Directions & Dealership Guarantees */}
            <div className="space-y-2.5 flex-1 text-left">
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-black bg-zinc-200 px-2 py-0.5 rounded">
                  <ShieldCheck className="w-3.5 h-3.5 text-black" />
                  Scan with Phone Camera
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-black mt-1">
                  Scan to View Complete HD Photo Gallery, Full Vehicle Specs & Online Inventory
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Point your phone&apos;s camera at the QR code to open the vehicle page with complete interior/exterior photo walkarounds, legal verification details, and online catalog.
                </p>
              </div>

              {/* Guarantees Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs font-bold text-zinc-800 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
                  <span>Guaranteed 100% Flood-Free</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
                  <span>Clean Legal Documents & LTO Verified</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
                  <span>Ready for Long Drive & Complete Inspection</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
                  <span>Trade-In & Bank Financing Assistance</span>
                </div>
              </div>
            </div>
          </section>

          {/* Footer Contact Strip */}
          <footer className="border-t-2 border-black pt-2 flex flex-col sm:flex-row items-center justify-between text-[11px] font-bold text-zinc-600 gap-1 shrink-0">
            <div>
              Viewing Hours: Mon – Sat 8:00 AM – 6:00 PM • Sunday viewings by appointment
            </div>
            <div>
              Direct Lines: 0917 440 3909 / 0923 730 9644
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
