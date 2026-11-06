'use client';

import { Printer } from 'lucide-react';

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
    >
      <Printer className="w-4 h-4 text-black" />
      <span>Print Windshield Sheet</span>
    </button>
  );
}

