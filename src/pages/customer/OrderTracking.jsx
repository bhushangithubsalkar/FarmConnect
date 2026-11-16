import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Phone, ThermometerSnowflake, ArrowLeft, Loader2, ShoppingBag 
} from 'lucide-react';
import { db } from '../../services/firebase';
import { doc, onSnapshot, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

// Default demo order for fallback preview
const defaultDemoOrder = {
  id: "FC-89421",
  status: "In Transit",
  otp: "6482",
  eta: "Today by 5:30 PM",
  totalAmount: 158,
  items: [
    { name: "Nashik Red Vine Tomatoes", quantity: 1, unit: "kg", price: 32 },
    { name: "Hydro Baby Spinach", quantity: 2, unit: "bn", price: 24 },
    { name: "Shimla Green Capsicum", quantity: 1, unit: "kg", price: 58 }
  ],
  deliveryPartner: {
    name: "Rajesh Mandhare",
    rating: 4.9,
    deliveries: "1,240+",
    vehicle: "Cold-chain EV (Temp: 4.2°C)",
    phone: "+91 98765 43210"
  }
};

export default function OrderTracking({ onNavigate, orderId: propOrderId }) {
  const { orderId: paramOrderId } = useParams();
  const { currentUser } = useAuth();

  const [activeOrderId, setActiveOrderId] = useState(propOrderId || paramOrderId || null);
  const [order, setOrder] = useState(defaultDemoOrder);
  const [loading, setLoading] = useState(false);

  // Stages configuration
  const STAGES = [
    { key: 'Placed', label: '1. Placed', desc: 'Harvest request assigned' },
    { key: 'Harvested', label: '2. Harvested', desc: 'Direct from field' },
    { key: 'Departed Hub', label: '3. Departed Hub', desc: 'Cold-chain facility' },
    { key: 'In Transit', label: '4. On the Way', desc: 'Active refrigerated EV' },
    { key: 'Delivered', label: '5. Delivered', desc: 'Doorstep handover' }
  ];

  // Helper to determine current stage index
  const getStageIndex = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'placed':
      case 'order placed':
        return 0;
      case 'harvested':
        return 1;
      case 'departed hub':
      case 'departed':
        return 2;
      case 'in transit':
      case 'on the way':
        return 3;
      case 'delivered':
        return 4;
      default:
        return 0;
    }
  };

  // Find user's latest orders if no specific orderId is passed
  useEffect(() => {
    const fetchRecentOrders = async () => {
      try {
        let q;
        if (currentUser?.uid) {
          q = query(
            collection(db, "orders"),
            where("customerId", "==", currentUser.uid),
            limit(1)
          );
        } else {
          q = query(collection(db, "orders"), limit(1));
        }

        const snap = await getDocs(q);
        if (!snap.empty) {
          const firstDoc = snap.docs[0];
          setActiveOrderId(firstDoc.id);
        }
      } catch (err) {
        console.warn("Could not query recent orders:", err);
      }
    };

    if (!activeOrderId) {
      fetchRecentOrders();
    }
  }, [currentUser, activeOrderId]);

  // Real-time listener for current order
  useEffect(() => {
    if (!activeOrderId) return;

    let unsubscribe = () => {};

    try {
      unsubscribe = onSnapshot(doc(db, "orders", activeOrderId), (docSnap) => {
        if (docSnap.exists()) {
          setOrder({ id: docSnap.id, ...docSnap.data() });
        }
        setLoading(false);
      }, (err) => {
        console.warn("Snapshot listener error:", err);
      });
    } catch (e) {
      console.warn("Error setting order listener:", e);
    }

    return () => unsubscribe();
  }, [activeOrderId]);

  const currentStageIndex = getStageIndex(order?.status);

  return (
    <div className="min-h-screen bg-[#f7fcf9] font-sans text-gray-800 pb-12">
      <header className="bg-white border-b border-emerald-100 px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onNavigate('market')} 
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition"
            >
              <ArrowLeft className="h-4 w-4" /> Marketplace
            </button>
            <span className="text-gray-300">/</span>
            <span className="font-extrabold text-gray-900 text-sm sm:text-base">
              Tracking / <strong className="text-emerald-800">Order #{order ? order.id.slice(0, 8) : '...'}</strong>
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onNavigate('admin')}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
            >
              Admin Logistics Console →
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 pt-6 space-y-6">
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-emerald-100 shadow-sm flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
            <p className="text-xs font-bold text-gray-600">Connecting to live cold-chain telemetry...</p>
          </div>
        ) : (
          <>
            {/* Status Header Banner */}
            <div className="bg-[#00663b] rounded-3xl p-6 text-white shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="bg-emerald-500/80 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Live Stage: {order?.status || 'Placed'}
                </span>
                <h2 className="text-2xl font-black mt-1">Consignment #{order?.id?.slice(0, 8)}</h2>
                <p className="text-xs text-emerald-100 mt-0.5">
                  ETA: {order?.eta || 'Today by 5:30 PM'} • OTP for Delivery: <strong className="bg-black/30 px-2 py-0.5 rounded font-mono text-emerald-200 tracking-wider text-sm">{order?.otp || '5821'}</strong>
                </p>
              </div>
              <div className="bg-white/10 p-3 rounded-2xl border border-white/20 text-right">
                <p className="text-[10px] text-emerald-200 uppercase font-semibold">Total Consignment</p>
                <p className="text-xl font-black text-white">₹{order?.totalAmount || 0}</p>
              </div>
            </div>

            {/* Live 5-Stage Consignment Timeline */}
            <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <span>Live 5-Stage Consignment Timeline</span>
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                </h3>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  Real-time Firestore Sync
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {STAGES.map((st, idx) => {
                  const isDone = idx < currentStageIndex;
                  const isCurrent = idx === currentStageIndex;
                  const isPending = idx > currentStageIndex;

                  let borderClass = "border-gray-200 bg-gray-50 opacity-60";
                  if (isCurrent) {
                    borderClass = "border-2 border-emerald-600 bg-emerald-50 shadow-xs";
                  } else if (isDone) {
                    borderClass = "border border-emerald-200 bg-emerald-50/60";
                  }

                  return (
                    <div key={st.key} className={`p-3 rounded-2xl space-y-1 transition ${borderClass}`}>
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className={isCurrent ? "text-emerald-900 font-black" : isDone ? "text-emerald-700" : "text-gray-500"}>
                          {st.label}
                        </span>
                        {isDone && <span className="text-emerald-600 font-bold text-xs">✓</span>}
                        {isCurrent && <span className="animate-pulse text-emerald-700 font-extrabold">●</span>}
                        {isPending && <span className="text-gray-400">○</span>}
                      </div>
                      <p className={`text-[10px] ${isCurrent ? 'text-emerald-700 font-semibold' : 'text-gray-500'}`}>
                        {st.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cold-Chain Telemetry & Partner Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Telemetry card */}
              <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-xs space-y-3">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  <ThermometerSnowflake className="h-4 w-4 text-emerald-600" /> Cold-Chain Telemetry & Compliance
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-emerald-50 rounded-xl">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold">Pod Temp</p>
                    <p className="font-extrabold text-emerald-800 text-base mt-0.5">4.2°C</p>
                    <span className="text-[9px] text-emerald-600">Optimal (2-6°C)</span>
                  </div>
                  <div className="p-2.5 bg-emerald-50 rounded-xl">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold">Humidity</p>
                    <p className="font-extrabold text-emerald-800 text-base mt-0.5">88%</p>
                    <span className="text-[9px] text-emerald-600">Crisp Fresh</span>
                  </div>
                  <div className="p-2.5 bg-emerald-50 rounded-xl">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold">Transport</p>
                    <p className="font-extrabold text-emerald-800 text-base mt-0.5">EV #84</p>
                    <span className="text-[9px] text-emerald-600">Zero Emission</span>
                  </div>
                </div>
              </div>

              {/* Delivery Partner */}
              <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-xs flex flex-col justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg shrink-0">
                    RM
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">
                      {order?.deliveryPartner?.name || "Rajesh Mandhare"}
                    </h4>
                    <p className="text-xs text-gray-500">
                      ⭐ {order?.deliveryPartner?.rating || 4.9} • {order?.deliveryPartner?.deliveries || "1,240+"} deliveries
                    </p>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      {order?.deliveryPartner?.vehicle || "Cold-chain EV"}
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">Direct Rider Line:</span>
                  <a 
                    href={`tel:${order?.deliveryPartner?.phone || '9876543210'}`}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                  >
                    <Phone className="h-3 w-3" /> Call Partner
                  </a>
                </div>
              </div>
            </div>

            {/* Consignment Items Summary */}
            {order?.items && order.items.length > 0 && (
              <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-xs space-y-3">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  <ShoppingBag className="h-4 w-4 text-emerald-600" /> Baskets in Consignment
                </h4>
                <div className="divide-y divide-gray-100 text-xs">
                  {order.items.map((item, i) => (
                    <div key={i} className="py-2 flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-gray-800">{item.name || item.cropName}</span>
                        <span className="text-gray-400 ml-2">({item.farmerName || 'Partner Farm'})</span>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-500 mr-3">{item.quantity} {item.unit || 'kg'}</span>
                        <span className="font-bold text-gray-900">₹{(item.price || 0) * (item.quantity || 1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}