import React from 'react';
import { CheckCircle2, Phone } from 'lucide-react';

export default function OrderTracking({ onNavigate }) {
  return (
    <div className="min-h-screen bg-[#f7fcf9] font-sans text-gray-800 pb-12">
      <header className="bg-white border-b border-emerald-100 px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span className="font-extrabold text-gray-900 text-base">FarmConnect / Tracking / <strong className="text-emerald-800">Order #FC-89421</strong></span>
          <button onClick={() => onNavigate('market')} className="text-xs font-bold text-emerald-700 hover:underline">← Marketplace</button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 pt-6 space-y-6">
        <div className="bg-[#00663b] rounded-3xl p-6 text-white shadow-md flex justify-between items-center">
          <div>
            <span className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">In Transit • On the Way</span>
            <h2 className="text-2xl font-black mt-1">Order #FC-89421</h2>
            <p className="text-xs text-emerald-100 mt-0.5">ETA: Today by 5:30 PM • OTP: <strong className="bg-black/20 px-2 py-0.5 rounded">6482</strong></p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs space-y-4">
          <h3 className="font-bold text-gray-900 text-base">Live Consignment Timeline</h3>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <div className="border border-emerald-200 bg-emerald-50/60 p-3 rounded-2xl space-y-1">
              <div className="flex justify-between items-center text-emerald-700 font-bold text-xs"><span>1. Placed</span><span>✓</span></div>
              <p className="text-[10px] text-gray-500">May 18 • 9:15 AM</p>
            </div>
            <div className="border border-emerald-200 bg-emerald-50/60 p-3 rounded-2xl space-y-1">
              <div className="flex justify-between items-center text-emerald-700 font-bold text-xs"><span>2. Harvested</span><span>✓</span></div>
              <p className="text-[10px] text-gray-500">May 18 • 11:30 AM</p>
            </div>
            <div className="border border-emerald-200 bg-emerald-50/60 p-3 rounded-2xl space-y-1">
              <div className="flex justify-between items-center text-emerald-700 font-bold text-xs"><span>3. Departed Hub</span><span>✓</span></div>
              <p className="text-[10px] text-gray-500">May 18 • 1:45 PM</p>
            </div>
            <div className="border-2 border-emerald-600 bg-emerald-50 p-3 rounded-2xl space-y-1 shadow-xs">
              <div className="flex justify-between items-center text-emerald-800 font-black text-xs"><span>4. On the Way</span><span className="animate-pulse">⚡</span></div>
              <p className="text-[10px] text-emerald-700 font-bold">ETA 42m</p>
            </div>
            <div className="border border-gray-200 bg-gray-50 p-3 rounded-2xl space-y-1 opacity-60">
              <div className="flex justify-between items-center text-gray-600 font-bold text-xs"><span>5. Delivered</span><span>○</span></div>
              <p className="text-[10px] text-gray-400">5:30 PM</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-xs flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg">RM</div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Rajesh Mandhare (Top Rated Delivery Partner)</h4>
              <p className="text-xs text-gray-500">⭐ 4.9 • 1,240+ deliveries • Cold-chain verified EV</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs">
            <Phone className="h-3.5 w-3.5" /> Call Rajesh
          </button>
        </div>
      </div>
    </div>
  );
}