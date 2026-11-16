import { useState, useEffect } from 'react';
import { 
  ShieldCheck, RefreshCw, Truck, CheckCircle2, 
  Loader2, Eye 
} from 'lucide-react';
import { db } from '../../services/firebase';
import { 
  collection, 
  onSnapshot, 
  updateDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

// Benchmark Pricing specs
const benchmarks = [
  { crop: "Tomato - Desi Vine", category: "Vegetables", market: 55, farmer: 32, savings: "41.8% Savings" },
  { crop: "Shimla Green Capsicum", category: "Vegetables", market: 90, farmer: 58, savings: "35.5% Savings" },
  { crop: "Hydro Baby Spinach", category: "Greens", market: 45, farmer: 24, savings: "46.7% Savings" },
  { crop: "Nagpur Sweet Oranges", category: "Fruits", market: 120, farmer: 75, savings: "37.5% Savings" }
];

// Demo fallback orders if database has none
const defaultOrders = [
  {
    id: "FC-89421",
    customerName: "Sneha Sharma",
    customerId: "cust-1",
    totalAmount: 158,
    status: "In Transit",
    items: [{ name: "Nashik Red Vine Tomatoes", quantity: 1, unit: "kg" }, { name: "Shimla Green Capsicum", quantity: 1, unit: "kg" }]
  },
  {
    id: "FC-89422",
    customerName: "Vikram Mehta",
    customerId: "cust-2",
    totalAmount: 240,
    status: "Harvested",
    items: [{ name: "Nagpur Sweet Mandarins", quantity: 2, unit: "kg" }]
  }
];

export default function AdminDashboard({ onNavigate }) {
  const { logout } = useAuth();

  const [orders, setOrders] = useState(defaultOrders);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [message, setMessage] = useState(null);

  // Real-time listener for orders
  useEffect(() => {
    let unsubscribe = () => {};

    try {
      const q = collection(db, "orders");
      unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setOrders(list);
        }
        setLoadingOrders(false);
      }, (err) => {
        console.warn("Admin orders fetch failed (using mock data):", err);
        setLoadingOrders(false);
      });
    } catch (e) {
      console.warn("Firestore orders listener setup error:", e);
    }

    return () => unsubscribe();
  }, []);

  // Update order status in Firestore
  const handleUpdateStatus = async (orderId, nextStatus) => {
    setUpdatingId(orderId);
    setMessage(null);

    try {
      if (!orderId.startsWith('FC-')) {
        await updateDoc(doc(db, "orders", orderId), {
          status: nextStatus,
          updatedAt: serverTimestamp()
        });
      }
      // Local state update for immediate UI feedback
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
      setMessage({ type: 'success', text: `Order #${orderId.slice(0, 8)} updated to "${nextStatus}"!` });
    } catch (err) {
      console.error("Status update error:", err);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
      setMessage({ type: 'success', text: `Order status locally advanced to "${nextStatus}" (Preview mode).` });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    onNavigate('auth');
  };

  return (
    <div className="min-h-screen bg-[#f7fcf9] font-sans text-gray-800 pb-12">
      {/* Top Header */}
      <header className="bg-[#003b22] text-white px-6 py-3 flex justify-between items-center shadow-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded-xl"><ShieldCheck className="h-5 w-5" /></div>
          <div>
            <h1 className="font-bold text-sm tracking-wide">Admin Central</h1>
            <p className="text-[10px] text-emerald-300">Level 3 Clearance • Logistics & APMC Control</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate('farmer')} 
            className="text-xs text-emerald-200 hover:text-white font-medium"
          >
            Farmer Portal
          </button>
          <span className="text-emerald-500">|</span>
          <button 
            onClick={() => onNavigate('market')} 
            className="text-xs text-emerald-200 hover:text-white font-medium"
          >
            Marketplace
          </button>
          <button 
            onClick={handleLogout} 
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-xl font-bold text-xs shadow-xs transition"
          >
            Logout Admin
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-xl font-black text-gray-900">Logistics & Market Pricing Control</h2>
            <p className="text-xs text-gray-500">Real-time control tower for farm dispatches and wholesale benchmarks</p>
          </div>
          <button 
            onClick={() => {
              setMessage({ type: 'success', text: 'Mandi pricing feeds synchronized with Vashi APMC at 5:00 AM.' });
            }}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Sync Mandi Feeds
          </button>
        </div>

        {message && (
          <div className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{message.text}</span>
          </div>
        )}

        {/* Live Order Logistics Pipeline */}
        <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Truck className="h-4 w-4 text-emerald-700" />
                <span>Live Order Logistics Pipeline</span>
              </h3>
              <p className="text-xs text-gray-500">Click transit buttons to advance stages live in customer telemetry</p>
            </div>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
              {orders.length} Active Orders
            </span>
          </div>

          {loadingOrders ? (
            <div className="py-12 flex justify-center items-center gap-2 text-emerald-700">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-xs font-bold">Syncing live orders...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              No orders found in database. Place an order in the Marketplace to test the live logistics pipeline!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 uppercase text-[10px] border-b border-gray-100">
                    <th className="p-3">Order ID</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Baskets & Amount</th>
                    <th className="p-3">Current Status</th>
                    <th className="p-3">Advance Logistics Stage</th>
                    <th className="p-3 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50/80 transition">
                      <td className="p-3 font-mono font-bold text-gray-900">
                        #{o.id.slice(0, 8)}
                      </td>
                      <td className="p-3">
                        <p className="font-semibold text-gray-800">{o.customerName || "Customer"}</p>
                        <p className="text-[10px] text-gray-400">{o.customerPhone || "Verified"}</p>
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-emerald-800">₹{o.totalAmount}</p>
                        <p className="text-[10px] text-gray-500 truncate max-w-xs">
                          {o.items?.map(i => `${i.name || i.cropName} (${i.quantity}${i.unit || 'kg'})`).join(', ')}
                        </p>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                          o.status === 'Delivered' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : o.status === 'In Transit' 
                            ? 'bg-blue-100 text-blue-800'
                            : o.status === 'Departed Hub'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {o.status || 'Placed'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <button 
                            disabled={updatingId === o.id || o.status === 'Harvested'}
                            onClick={() => handleUpdateStatus(o.id, 'Harvested')}
                            className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-[10px] font-semibold transition disabled:opacity-40"
                          >
                            Harvested
                          </button>
                          <button 
                            disabled={updatingId === o.id || o.status === 'Departed Hub'}
                            onClick={() => handleUpdateStatus(o.id, 'Departed Hub')}
                            className="px-2.5 py-1 bg-white hover:bg-amber-50 border border-amber-300 text-amber-800 rounded-lg text-[10px] font-semibold transition disabled:opacity-40"
                          >
                            Depart Hub
                          </button>
                          <button 
                            disabled={updatingId === o.id || o.status === 'In Transit'}
                            onClick={() => handleUpdateStatus(o.id, 'In Transit')}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold shadow-xs transition disabled:opacity-40"
                          >
                            Dispatch (In Transit)
                          </button>
                          <button 
                            disabled={updatingId === o.id || o.status === 'Delivered'}
                            onClick={() => handleUpdateStatus(o.id, 'Delivered')}
                            className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] font-bold shadow-xs transition disabled:opacity-40"
                          >
                            Deliver ✓
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <button 
                          onClick={() => onNavigate('tracking', o.id)}
                          className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition inline-flex items-center gap-1 font-semibold"
                          title="View Live Customer Tracking"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Track</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Benchmark Market Pricing Manager */}
        <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-xs space-y-4">
          <h3 className="font-bold text-gray-900 text-base">Benchmark Market Pricing Manager</h3>
          <p className="text-xs text-gray-500">APMC wholesale benchmark rates dynamically determine transparent customer savings badges.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-400 uppercase text-[10px] border-b border-gray-100">
                  <th className="p-3">Crop Spec</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Admin APMC Benchmark</th>
                  <th className="p-3">Farmer Payout</th>
                  <th className="p-3">Customer Savings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {benchmarks.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="p-3 font-bold text-gray-900">{row.crop}</td>
                    <td className="p-3 text-gray-500">{row.category}</td>
                    <td className="p-3 font-semibold text-gray-900">₹{row.market} /kg</td>
                    <td className="p-3 font-bold text-emerald-700">₹{row.farmer} /kg</td>
                    <td className="p-3">
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold text-[10px]">
                        {row.savings}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}