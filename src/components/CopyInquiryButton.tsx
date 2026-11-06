'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import type { PublicVehicleUnit } from '@/types/database';
import { formatPHP } from '@/lib/calculator';

interface CopyInquiryButtonProps {
  unit: PublicVehicleUnit;
}

export default function CopyInquiryButton({ unit }: CopyInquiryButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const title = `${unit.year} ${unit.make} ${unit.model} ${unit.variant}`.trim();
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const dpText =
      unit.default_all_in_dp > 0
        ? `\n🎯 Target All-In Downpayment: ${formatPHP(unit.default_all_in_dp)}`
        : '';

    const textToCopy = `🚗 ${title}
💰 Cash Price: ${formatPHP(unit.cash_price)}${dpText}
⚙️ Specs: ${unit.transmission} • ${unit.fuel} • ${unit.mileage.toLocaleString('en-US')} km • Plate ending ${unit.plate_ending}
📍 RL Trading & SEat n Go Shuttle Services (MacArthur Hwy, Angeles City)
🔗 Unit Link: ${url}`;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy vehicle details:', err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`w-full py-3 px-4 rounded-xl font-semibold text-xs inline-flex items-center justify-center gap-2 transition-all duration-200 border ${
        copied
          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-md shadow-emerald-500/10'
          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border-zinc-700 hover:border-zinc-600'
      }`}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Copied! Ready to paste into Messenger</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4 text-amber-400" />
          <span>Copy Inquiry Details for Messenger</span>
        </>
      )}
    </button>
  );
}
