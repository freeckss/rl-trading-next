import { Suspense } from 'react';
import { getAvailableUnits } from '@/lib/services/vehicleService';
import ShowroomCatalog from '@/components/ShowroomCatalog';
import {
  Car,
  MapPin,
  Phone,
  CheckCircle2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

async function CatalogSection() {
  const units = await getAvailableUnits();
  return <ShowroomCatalog initialUnits={units} />;
}

function CatalogSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-16 rounded-2xl bg-zinc-900/60 border border-zinc-800" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((n) => (
          <div key={n} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 h-96" />
        ))}
      </div>
    </div>
  );
}

export default function ShowroomPage() {

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-amber-500 selection:text-black">
      {/* Top Banner / Dealership Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo & Dealership Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-black shadow-md shadow-amber-500/20 font-black">
              <Car className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  RL Trading & SEat n Go
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Angeles City
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Pre-Owned Vehicle Dealership & Shuttle Services
              </p>
            </div>
          </div>

          {/* Location & Quick Contact Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            <a
              href="https://maps.app.goo.gl/JFw6ufXYTxyfvWHk8"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden lg:inline">MacArthur Hwy, Pulung Bulu, Angeles City</span>
              <span className="lg:hidden">Angeles City</span>
              <ExternalLink className="w-3 h-3 text-zinc-500" />
            </a>

            <div className="flex items-center gap-1.5">
              <a
                href="tel:09237309644"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors font-medium"
              >
                <Phone className="w-3 h-3 text-emerald-400" />
                <span>09237309644</span>
              </a>
              <a
                href="tel:09174403909"
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors font-medium"
              >
                <Phone className="w-3 h-3 text-emerald-400" />
                <span>09174403909</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Dealership Value Proposition */}
      <section className="relative border-b border-zinc-800/80 bg-gradient-to-b from-zinc-900/50 via-zinc-950 to-zinc-950 py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Premium Pre-Owned Quality • Tested & Flood-Free</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Verified Pre-Owned Cars & Flexible All-In Financing
            </h2>

            <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
              Explore our hand-picked inventory in Angeles City, Pampanga. Each unit undergoes complete mechanical inspection, legal verification, and title validation with hassle-free bank financing assistance.
            </p>

            {/* Trust Highlights Badges */}
            <div className="pt-2 flex flex-wrap gap-4 text-xs text-zinc-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>100% Not Flooded & Clean Titles</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Low All-In Downpayment Options</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Trade-in & Bank Financing Assistance</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Showroom Catalog Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 w-full">
        <Suspense fallback={<CatalogSkeleton />}>
          <CatalogSection />
        </Suspense>
      </section>

      {/* Dealership Footer & Visiting Info */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8 mt-12 text-zinc-400 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white text-sm">
                RL Trading & SEat n Go Shuttle Services
              </span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Serving vehicle buyers and passenger shuttle clients across Angeles City, Clark Freeport Zone, San Fernando, and Central Luzon with honest pricing and dependable transport solutions.
            </p>
          </div>

          {/* Showroom Location & Operating Hours */}
          <div className="space-y-2">
            <span className="font-bold text-white text-sm block">Showroom Location</span>
            <p className="text-xs text-zinc-400 leading-relaxed">
              MacArthur Highway, Pulung Bulu, Angeles City, Pampanga
              <br />
              <span className="text-zinc-500">(Beside Shell Station, in front of Motech Auto Center)</span>
            </p>
            <a
              href="https://maps.app.goo.gl/JFw6ufXYTxyfvWHk8"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-medium transition-colors pt-1"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Open in Google Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Contact Numbers */}
          <div className="space-y-2">
            <span className="font-bold text-white text-sm block">Direct Contact & Inquiries</span>
            <div className="space-y-1">
              <p>
                Globe / Viber / WhatsApp:{' '}
                <a href="tel:09174403909" className="text-zinc-200 hover:text-amber-400 font-semibold">
                  0917 440 3909
                </a>
              </p>
              <p>
                Smart / Sun:{' '}
                <a href="tel:09237309644" className="text-zinc-200 hover:text-amber-400 font-semibold">
                  0923 730 9644
                </a>
              </p>
            </div>
            <p className="text-zinc-500 text-[11px] pt-1">
              Viewing hours: Monday – Saturday, 8:00 AM – 6:00 PM. Sunday viewings by prior appointment.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-zinc-500 text-[11px]">
          <p>© 2026 RL Trading & SEat n Go Shuttle Services. All rights reserved.</p>
          <p>Angeles City, Pampanga • Pre-Owned Vehicles & Shuttle Transport</p>
        </div>
      </footer>
    </main>
  );
}
