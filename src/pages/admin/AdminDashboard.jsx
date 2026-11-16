import React from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';

export default function AdminDashboard({ onNavigate }) {
  const benchmarkRows = [
    { crop: "Tomato - Desi Vine", category: "Vegetables", market: 55, farmer: 32, savings: "41.8% Savings" },
    { crop: "Shimla Green Capsicum", category: "Vegetables", market: 90, farmer: 58, savings: "35.5% Savings" },
    { crop: "Hydro Baby Spinach", category: "Greens", market: 45, farmer: 24, savings: "46.7% Savings" },
    { crop: "Nagpur Sweet Oranges", category: "Fruits", market: 120, farmer: 75, savings: "37.5% Savings" }
  ];

  return (
    <div className="min-h-screen bg-[#f7fcf9] font-sans text-gray-800">
      <header className="bg-[#003b22] text-white px-6 py-3 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded-xl"><ShieldCheck className="h-5 w-5" /></div>
          <div>
            <h1 className="font-bold text-sm tracking-wide">Admin Central</h1>
            <p className="text-[10px] text-emerald-300">Level 3 Clearance</p>
          </div>
        </div>
        <button onClick={() => onNavigate('auth')} className="px-3 py-1.5 bg-red-600 rounded-xl font-bold text-xs">Logout Admin</button>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black text-gray-900">Logistics & Market Pricing Control</h2>
          <button className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2">
            <RefreshCw className="h-3.5 w-3.5" /> Sync Mandi Feeds
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-xs space-y-4">
          <h3 className="font-bold text-gray-900 text-base">Benchmark Market Pricing Manager</h3>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-400 uppercase text-[10px] border-b border-gray-100">
                <th className="p-3">Crop Spec</th>
                <th className="p-3">Category</th>
                <th className="p-3">Admin Benchmark</th>
                <th className="p-3">Farmer Payout</th>
                <th className="p-3">Customer Savings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {benchmarkRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="p-3 font-bold text-gray-900">{row.crop}</td>
                  <td className="p-3 text-gray-500">{row.category}</td>
                  <td className="p-3 font-semibold text-gray-900">₹{row.market}</td>
                  <td className="p-3 font-bold text-emerald-700">₹{row.farmer}</td>
                  <td className="p-3"><span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold text-[10px]">{row.savings}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}