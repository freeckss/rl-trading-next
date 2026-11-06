'use client';

import { useState } from 'react';
import type { VehicleUnit } from '@/types/database';
import { formatPHP } from '@/lib/calculator';
import { copyToClipboard } from '@/lib/clipboard';
import { getCodingDay } from '@/lib/business';
import {
  X,
  Copy,
  Check,
  Zap,
  DollarSign,
  CreditCard,
  Hash,
  ExternalLink,
} from 'lucide-react';

interface FbMarketplaceKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: VehicleUnit | null;
}

function generateCashCaption(unit: VehicleUnit): string {
  const coding = getCodingDay(unit.plate_ending);
  return `🚗 ${unit.year} ${unit.make} ${unit.model} ${unit.variant}
📍 RL Trading & SEat n Go Shuttle Services
MacArthur Highway, Pulung Bulu, Angeles City, Pampanga
(Beside Shell Station, in front of Motech Auto Center)

💰 CASH PRICE: ${formatPHP(unit.cash_price)}
(Negotiable upon personal viewing & inspection)

⚙️ VEHICLE SPECIFICATIONS:
• Transmission: ${unit.transmission}
• Fuel Type: ${unit.fuel}
• Mileage: ${unit.mileage.toLocaleString()} km
• Body Type: ${unit.body_type}
• Plate Ending: ${unit.plate_ending} • ${coding}
${unit.description_notes ? `\n📝 VEHICLE CONDITION & NOTES:\n${unit.description_notes}\n` : ''}
🛡️ PROFESSIONAL DEALERSHIP ASSURANCES:
✅ Guaranteed 100% Flood-Free
✅ Clean Legal Documents & LTO Verified
✅ Ready for Long Drive & Complete Inspection
✅ Complete Original Documents (OR/CR) Ready for Name Transfer
✅ Honest & Transparent Transactions

📞 DIRECT INQUIRIES & VIEWING APPOINTMENTS:
• Smart / Sun: 0923 730 9644
• Globe / Viber / WhatsApp: 0917 440 3909
• Viewing Hours: Monday – Saturday, 8:00 AM – 6:00 PM (Sunday viewings by appointment)
📍 Google Maps Link: https://maps.app.goo.gl/JFw6ufXYTxyfvWHk8`;
}

function generateFinancingCaption(unit: VehicleUnit): string {
  const coding = getCodingDay(unit.plate_ending);
  const dpText =
    unit.default_all_in_dp > 0
      ? formatPHP(unit.default_all_in_dp)
      : 'Inquire for Low DP Options';

  return `🚗 ${unit.year} ${unit.make} ${unit.model} ${unit.variant}
📍 RL Trading & SEat n Go Shuttle Services
MacArthur Highway, Pulung Bulu, Angeles City, Pampanga
(Beside Shell Station, in front of Motech Auto Center)

💰 PRICING & FINANCING:
• Cash Price: ${formatPHP(unit.cash_price)}
• Target All-In Downpayment: ${dpText}

⚡ FINANCING ASSISTANCE:
Flexible 2-year, 3-year, or 4-year financing terms available upon approval. Message us for customized computation breakdowns and application requirements!

⚙️ VEHICLE SPECIFICATIONS:
• Transmission: ${unit.transmission}
• Fuel Type: ${unit.fuel}
• Mileage: ${unit.mileage.toLocaleString()} km
• Plate Ending: ${unit.plate_ending} • ${coding}
${unit.description_notes ? `\n📝 VEHICLE CONDITION & NOTES:\n${unit.description_notes}\n` : ''}
🛡️ DEALERSHIP ASSURANCES:
✅ Guaranteed 100% Flood-Free
✅ Clean Legal Documents & LTO Verified
✅ Ready for Long Drive & Complete Inspection
✅ Bank Financing & Trade-In Assistance Provided

📞 MESSAGE US FOR ASSISTANCE:
• Smart / Sun: 0923 730 9644
• Globe / Viber / WhatsApp: 0917 440 3909
• Viewing Hours: Monday – Saturday, 8:00 AM – 6:00 PM (Sunday viewings by appointment)
📍 Google Maps Link: https://maps.app.goo.gl/JFw6ufXYTxyfvWHk8`;
}

function generateSeoTags(unit: VehicleUnit): string {
  const { year, make, model, variant, body_type, fuel, transmission } = unit;
  const tags = [
    `${make} ${model}`,
    `${model} Pampanga`,
    `used cars Angeles City`,
    `second hand cars Pampanga`,
    `RL Trading`,
    `${body_type} Angeles`,
    `cars for sale Clark`,
    `used cars San Fernando`,
    `pre owned cars Central Luzon`,
    `affordable cars Pampanga`,
    `${make} ${year}`,
    `${fuel} cars Angeles`,
    `${transmission} ${model}`,
    `${make} ${model} ${year}`,
    `SEat n Go Angeles`,
    `used ${body_type} Pampanga`,
    `cheap cars Angeles City`,
    `car dealership MacArthur Highway`,
    `${make} ${variant}`,
    `verified pre owned cars Pampanga`,
  ];
  return tags.join(', ');
}

type TabType = 'cash' | 'financing' | 'tags';

export default function FbMarketplaceKitModal({
  isOpen,
  onClose,
  unit,
}: FbMarketplaceKitModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('cash');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen || !unit) return null;

  const cashCaption = generateCashCaption(unit);
  const financingCaption = generateFinancingCaption(unit);
  const seoTags = generateSeoTags(unit);

  const handleCopy = async (text: string, key: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey(null);
      }, 2000);
    } else {
      alert('Failed to copy to clipboard.');
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl rounded-3xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 shadow-2xl my-8 text-zinc-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Zap className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Facebook Marketplace Automation Kit</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Ready to Post
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {unit.year} {unit.make} {unit.model} {unit.variant} • Instant 1-Click Copy
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-5 shrink-0 border-b border-zinc-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('cash')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'cash'
                ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Cash Listing Caption</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('financing')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'financing'
                ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Financing Caption</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tags')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'tags'
                ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>20 Local SEO Tags</span>
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1">
          {activeTab === 'cash' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400">
                  Full Cash Buyer Caption (with Emojis & Assurances)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(cashCaption, 'cash')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    copiedKey === 'cash'
                      ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                  }`}
                >
                  {copiedKey === 'cash' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Caption</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                readOnly
                value={cashCaption}
                rows={14}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs font-mono text-zinc-200 leading-relaxed focus:outline-none select-all"
              />
            </div>
          )}

          {activeTab === 'financing' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400">
                  Financing & Low Downpayment Promotion Caption
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(financingCaption, 'financing')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    copiedKey === 'financing'
                      ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                  }`}
                >
                  {copiedKey === 'financing' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Caption</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                readOnly
                value={financingCaption}
                rows={14}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs font-mono text-zinc-200 leading-relaxed focus:outline-none select-all"
              />
            </div>
          )}

          {activeTab === 'tags' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400">
                  20 High-Ranking Local Marketplace Search Tags
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(seoTags, 'tags')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    copiedKey === 'tags'
                      ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                  }`}
                >
                  {copiedKey === 'tags' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy 20 Tags</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                readOnly
                value={seoTags}
                rows={6}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs font-mono text-amber-400/90 leading-relaxed focus:outline-none select-all"
              />

              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
                <span className="font-semibold text-zinc-300 block">Pro Tip for Marketplace:</span>
                <p>
                  Paste these tags into the &quot;Tags&quot; field in Facebook Marketplace listing setup to ensure the listing ranks for buyers searching across Angeles City, San Fernando, Clark, and Pampanga.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-zinc-800 flex items-center justify-between shrink-0 mt-4">
          <a
            href="https://www.facebook.com/marketplace/create/vehicle"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold"
          >
            <span>Open Facebook Marketplace</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

