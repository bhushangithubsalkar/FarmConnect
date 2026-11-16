import React from 'react';
import { ShoppingCart, Tractor, ArrowRight } from 'lucide-react';

export default function Marketplace({ onNavigate }) {
  const products = [
    { name: "Nashik Red Vine Tomatoes", farmer: "Ramesh Patel", location: "Green Valley Farm", price: 32, marketPrice: 55, savings: "42% vs Market!", harvest: "Today 6:00 AM" },
    { name: "Shimla Green Capsicum", farmer: "Harish Deshmukh", location: "Sahyadri Agro", price: 58, marketPrice: 90, savings: "36% vs Market!", harvest: "Yesterday evening" },
    { name: "Hydro Baby Spinach", farmer: "Sunita Shinde", location: "Shinde Hydro", price: 24, marketPrice: 45, savings: "46% vs Market!", harvest: "4 hrs ago" },
    { name: "Nagpur Sweet Mandarins", farmer: "Balasaheb Thorat", location: "Thorat Orchards", price: 75, marketPrice: 120, savings: "38% vs Market!", harvest: "Fresh Pick" }
  ];

  return (
    <div className="min-h-screen bg-[#f7fcf9] font-sans text-gray-800 pb-12">
      <header className="bg-white border-b border-emerald-100 px-6 py-3 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-700 text-white p-2 rounded-xl"><Tractor className="h-5 w-5" /></div>
            <span className="font-extrabold text-gray-900 text-lg">FarmConnect</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('tracking')} className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200">Track Order #FC-89421</button>
            <div className="flex items-center gap-2 bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold">
              <ShoppingCart className="h-4 w-4" /> 3 items
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-2xl p-5 text-white flex justify-between items-center shadow-md">
            <div>
              <h2 className="text-lg font-black">Average 38.5% savings vs. Retail Mandis</h2>
              <p className="text-xs text-emerald-200 mt-0.5">Verified at Vashi APMC at 5:00 AM</p>
            </div>
            <span className="bg-white/10 px-3 py-1 rounded-xl text-xs font-bold border border-white/20">6 Producers Ready</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map((p, idx) => (
              <div key={idx} className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-lg">Save {p.savings}</span>
                    <span className="text-[10px] text-gray-400">{p.harvest}</span>
                  </div>
                  <div className="h-28 bg-emerald-50 rounded-xl mb-3 flex items-center justify-center text-emerald-700 font-bold text-xs">
                    Produce Photo
                  </div>
                  <h3 className="font-bold text-gray-900 text-base">{p.name}</h3>
                  <p className="text-xs text-gray-500">{p.farmer} • {p.location}</p>
                </div>
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-xl font-black text-gray-900">₹{p.price} <span className="text-xs font-normal text-gray-500">/kg</span></span>
                    <span className="text-xs text-gray-400 line-through ml-2">₹{p.marketPrice}</span>
                  </div>
                  <button className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs">Add to Basket</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs space-y-4 h-fit sticky top-20">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-900 text-base">Your Fresh Basket</h3>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">3 items</span>
          </div>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between"><span>Nashik Red Vine Tomatoes (1kg)</span><span className="font-semibold text-gray-900">₹32</span></div>
            <div className="flex justify-between"><span>Hydro Baby Spinach (2bn)</span><span className="font-semibold text-gray-900">₹48</span></div>
            <div className="flex justify-between"><span>Shimla Green Capsicum (1kg)</span><span className="font-semibold text-gray-900">₹58</span></div>
          </div>
          <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
            <span className="font-black text-gray-900 text-base">Total Payable</span>
            <span className="font-black text-emerald-800 text-xl">₹158</span>
          </div>
          <button onClick={() => onNavigate('tracking')} className="w-full py-3.5 bg-[#00663b] text-white font-bold rounded-xl shadow-md text-sm flex items-center justify-center gap-2">
            <span>Place Order</span> <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}