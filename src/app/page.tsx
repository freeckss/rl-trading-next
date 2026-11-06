import { mockVehicleUnits } from '@/lib/mockUnits';
import { formatPHP } from '@/lib/calculator';
import { Car, MapPin, Phone, ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top Banner / Dealership Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Car className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-white">
                RL Trading & SEat n Go
              </h1>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Shuttle Services & Pre-Owned Vehicle Dealership
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-300">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Pulung Bulu, Angeles City, Pampanga</span>
            </span>
            <span className="flex items-center gap-1.5 text-zinc-400">
              <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>09237309644 / 09174403909</span>
            </span>
          </div>
        </div>
      </header>

      {/* Hero / Placeholder Section */}
      <section className="max-w-6xl mx-auto px-4 py-10 w-full flex-1">
        <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900/60 to-zinc-950 p-6 sm:p-8 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Stage 1 Seed Preview • Angeles City Inventory</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Quality Pre-Owned Vehicles
          </h2>
          <p className="text-sm text-zinc-400 mt-1 max-w-xl">
            Clean title, tested units, bank financing options with low all-in downpayment.
            Showroom loading below from our verified mock inventory.
          </p>
        </div>

        {/* Inventory List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Featured Units ({mockVehicleUnits.length})
            </h3>
            <span className="text-xs text-zinc-500">Live Showroom in Prep</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockVehicleUnits.map((unit) => (
              <div
                key={unit.id}
                className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 hover:border-zinc-700 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      {unit.year}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {unit.status}
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                    {unit.make} {unit.model}
                  </h4>
                  <p className="text-xs text-zinc-400 mb-3">{unit.variant}</p>

                  <div className="flex flex-wrap gap-1.5 text-[11px] text-zinc-400 mb-4">
                    <span className="bg-zinc-800/80 px-2 py-0.5 rounded">
                      {unit.transmission}
                    </span>
                    <span className="bg-zinc-800/80 px-2 py-0.5 rounded">
                      {unit.fuel}
                    </span>
                    <span className="bg-zinc-800/80 px-2 py-0.5 rounded">
                      {unit.body_type}
                    </span>
                    <span className="bg-zinc-800/80 px-2 py-0.5 rounded">
                      Plate: {unit.plate_ending}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800/80">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-zinc-400">Cash Price:</span>
                    <span className="text-base font-bold text-white">
                      {formatPHP(unit.cash_price)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-xs text-zinc-400">All-In DP:</span>
                    <span className="text-xs font-semibold text-amber-400">
                      {formatPHP(unit.default_all_in_dp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 py-6 text-center text-xs text-zinc-500">
        <p>
          RL Trading & SEat n Go Shuttle Services • MacArthur Highway, Pulung Bulu,
          Angeles City, Pampanga
        </p>
      </footer>
    </main>
  );
}
