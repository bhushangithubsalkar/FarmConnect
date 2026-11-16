import { useState, useEffect } from 'react';
import { 
  Tractor, DollarSign, Plus, Trash2, 
  Loader2, CheckCircle2, AlertCircle, ShoppingBag 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';

// Initial seed products for demo fallback
const defaultInventory = [
  { id: "seed-1", cropName: "Desi Vine Tomatoes", batch: "Batch #VN-2025-08", pricePerUnit: 38, marketPrice: 55, quantity: 320, unit: "kg", harvestDate: "Today 6:00 AM", status: "In Stock", farmerId: "demo" },
  { id: "seed-2", cropName: "Shimla Green Capsicum", batch: "Batch #SH-2025-02", pricePerUnit: 65, marketPrice: 90, quantity: 140, unit: "kg", harvestDate: "Yesterday", status: "Selling Fast", farmerId: "demo" },
  { id: "seed-3", cropName: "Baby Spinach (Palak)", batch: "Batch #PL-2025-11", pricePerUnit: 25, marketPrice: 45, quantity: 85, unit: "bdl", harvestDate: "Today", status: "Re-stock needed", farmerId: "demo" },
  { id: "seed-4", cropName: "Nagpur Sweet Oranges", batch: "Batch #NG-2025-01", pricePerUnit: 90, marketPrice: 120, quantity: 450, unit: "kg", harvestDate: "2 days ago", status: "Ample Stock", farmerId: "demo" }
];

export default function FarmerDashboard({ onNavigate }) {
  const { currentUser, userData, logout } = useAuth();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'inventory' | 'orders'

  // Listings state
  const [listings, setListings] = useState(defaultInventory);
  const [farmerOrders, setFarmerOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  // New Harvest Form State
  const [cropName, setCropName] = useState('Nagpur Mandarin Supreme');
  const [category, setCategory] = useState('Fruits');
  const [pricePerUnit, setPricePerUnit] = useState('88');
  const [mandiAvg, setMandiAvg] = useState('82');
  const [quantity, setQuantity] = useState('350');
  const [unit, setUnit] = useState('kg');

  // Real-time listener for Farmer's products
  useEffect(() => {
    let unsubscribeProducts = () => {};
    let unsubscribeOrders = () => {};

    try {
      const currentFarmerId = currentUser?.uid;
      let prodQuery;

      if (currentFarmerId) {
        prodQuery = query(collection(db, "products"), where("farmerId", "==", currentFarmerId));
      } else {
        prodQuery = collection(db, "products");
      }

      unsubscribeProducts = onSnapshot(prodQuery, (snapshot) => {
        if (!snapshot.empty) {
          const prods = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setListings(prods);
        }
        setLoading(false);
      }, (err) => {
        console.warn("Firestore products fetch failed (using fallback items):", err);
        setLoading(false);
      });

      // Orders query with multi-vendor farmerIds array-contains
      if (currentFarmerId) {
        const orderQuery = query(collection(db, "orders"), where("farmerIds", "array-contains", currentFarmerId));
        unsubscribeOrders = onSnapshot(orderQuery, (snapshot) => {
          const orders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setFarmerOrders(orders);
        }, (err) => {
          console.warn("Orders fetch failed or index building:", err);
        });
      }

    } catch (e) {
      console.warn("Error setting up listeners:", e);
    }

    return () => {
      unsubscribeProducts();
      unsubscribeOrders();
    };
  }, [currentUser]);

  // Handle List New Harvest submission
  const handleListHarvest = async (e) => {
    e.preventDefault();
    if (!cropName.trim() || !pricePerUnit || !quantity) {
      setActionMessage({ type: 'error', text: 'Please fill all required harvest fields.' });
      return;
    }

    setSubmitting(true);
    setActionMessage(null);

    const priceNum = parseFloat(pricePerUnit) || 0;
    const mandiNum = parseFloat(mandiAvg) || Math.round(priceNum * 1.35);
    const qtyNum = parseFloat(quantity) || 0;
    const randomBatch = `Batch #${cropName.substring(0, 2).toUpperCase()}-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`;

    const newProduct = {
      farmerId: currentUser?.uid || "ramesh-patel-uid",
      farmerName: userData?.name || "Ramesh Patel",
      farmerLocation: userData?.location || "Green Valley Farm, Nashik",
      cropName: cropName.trim(),
      category,
      pricePerUnit: priceNum,
      marketPrice: mandiNum,
      quantity: qtyNum,
      unit,
      batch: randomBatch,
      status: "In Stock",
      harvestDate: "Fresh Harvest (Today)",
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, "products"), newProduct);
      setActionMessage({ type: 'success', text: `"${cropName}" successfully published to Marketplace!` });
      // Reset form fields
      setCropName('');
      setPricePerUnit('');
      setQuantity('');
    } catch (err) {
      console.error("Error listing harvest:", err);
      // Fallback local update if offline or keys pending
      setListings(prev => [{ id: `local-${Date.now()}`, ...newProduct }, ...prev]);
      setActionMessage({ type: 'success', text: `"${cropName}" listed in field inventory (Offline/Local preview)!` });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete product listing
  const handleDeleteProduct = async (id) => {
    try {
      if (!id.startsWith('seed-') && !id.startsWith('local-')) {
        await deleteDoc(doc(db, "products", id));
      }
      setListings(prev => prev.filter(item => item.id !== id));
      setActionMessage({ type: 'success', text: 'Listing removed from marketplace.' });
    } catch (err) {
      console.error("Delete error:", err);
      setListings(prev => prev.filter(item => item.id !== id));
    }
  };

  // Calculations for Overview Metrics
  const activeCount = listings.length;
  const totalStockKg = listings.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const estMarketValue = listings.reduce((sum, item) => sum + ((Number(item.pricePerUnit) || 0) * (Number(item.quantity) || 0)), 0);

  const handleLogout = async () => {
    await logout();
    onNavigate('auth');
  };

  return (
    <div className="min-h-screen bg-[#f7fcf9] font-sans text-gray-800">
      <header className="bg-white border-b border-emerald-100 px-6 py-3 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-700 text-white p-2 rounded-xl"><Tractor className="h-5 w-5" /></div>
          <div>
            <span className="font-bold text-gray-900 text-base">FarmConnect</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md ml-2">FARMER PORTAL</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-gray-900">{userData?.name || "Ramesh Patel"}</p>
            <p className="text-[10px] text-emerald-700 flex items-center justify-end gap-1">
              <span>✓</span> {userData?.farmlandPhoto ? 'Verified Farmland Grower' : 'Verified Grower • Green Valley'}
            </p>
          </div>
          <button 
            onClick={handleLogout} 
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-700 transition"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs space-y-1">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${activeTab === 'overview' ? 'bg-emerald-700 text-white shadow-xs' : 'text-gray-700 hover:bg-emerald-50'}`}
            >
              <Tractor className="h-4 w-4" /> Overview & Listings
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition ${activeTab === 'orders' ? 'bg-emerald-700 text-white shadow-xs' : 'text-gray-700 hover:bg-emerald-50'}`}
            >
              <span className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-emerald-500" /> Incoming Orders</span>
              {farmerOrders.length > 0 && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  {farmerOrders.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => onNavigate('market')} 
              className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-2"
            >
              <ShoppingBag className="h-4 w-4 text-emerald-600" /> Customer Marketplace →
            </button>
          </div>

          {/* List New Harvest Form */}
          <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-emerald-600" /> List New Harvest
              </h3>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">APMC Sync On</span>
            </div>

            {actionMessage && (
              <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${actionMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {actionMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                <span>{actionMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleListHarvest} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Crop / Produce Name</label>
                <input 
                  type="text" 
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  placeholder="e.g. Organic Nashik Tomatoes"
                  required
                  className="w-full p-2.5 bg-gray-50 border border-emerald-100 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Produce Category</label>
                <div className="grid grid-cols-3 gap-1 text-[11px] font-semibold text-center cursor-pointer">
                  {['Vegetables', 'Fruits', 'Greens'].map((cat) => (
                    <div 
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`py-1.5 rounded-lg transition ${category === cat ? 'bg-emerald-700 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {cat}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Selling Price (₹)</label>
                  <input 
                    type="number" 
                    value={pricePerUnit}
                    onChange={(e) => setPricePerUnit(e.target.value)}
                    required
                    placeholder="88"
                    className="w-full p-2.5 bg-gray-50 border border-emerald-100 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Mandi Benchmark (₹)</label>
                  <input 
                    type="number" 
                    value={mandiAvg}
                    onChange={(e) => setMandiAvg(e.target.value)}
                    placeholder="82"
                    className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs text-gray-600" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Total Available</label>
                  <input 
                    type="number" 
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    placeholder="350"
                    className="w-full p-2.5 bg-gray-50 border border-emerald-100 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Unit</label>
                  <select 
                    value={unit} 
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-emerald-100 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="kg">kg</option>
                    <option value="bdl">bundle</option>
                    <option value="box">crate/box</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-[#00663b] text-white font-bold rounded-xl text-xs shadow-md hover:bg-[#005531] disabled:opacity-60 transition flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Publishing to Firestore...</span>
                  </>
                ) : (
                  <span>Publish Harvest Listing</span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
              <p className="text-[10px] uppercase font-bold text-gray-400">Active Listings</p>
              <h4 className="text-2xl font-black text-gray-900 mt-1">{activeCount} <span className="text-xs font-normal text-gray-500">Crops</span></h4>
              <p className="text-[10px] text-emerald-700 mt-1">Live in marketplace</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
              <p className="text-[10px] uppercase font-bold text-gray-400">Inventory Stock</p>
              <h4 className="text-2xl font-black text-gray-900 mt-1">{totalStockKg.toLocaleString()} <span className="text-xs font-normal text-gray-500">units</span></h4>
              <p className="text-[10px] text-gray-400 mt-1">Freshly harvested</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
              <p className="text-[10px] uppercase font-bold text-gray-400">Est. Inventory Value</p>
              <h4 className="text-2xl font-black text-emerald-800 mt-1">₹{estMarketValue.toLocaleString()}</h4>
              <p className="text-[10px] text-emerald-700 mt-1">Direct farmer payout</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
              <p className="text-[10px] uppercase font-bold text-gray-400">Incoming Orders</p>
              <h4 className="text-2xl font-black text-gray-900 mt-1">{farmerOrders.length} <span className="text-xs font-normal text-gray-500">orders</span></h4>
              <p className="text-[10px] text-amber-600 mt-1">Cold-chain logistics ready</p>
            </div>
          </div>

          {activeTab === 'overview' && (
            <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Active Field Inventory</h3>
                  <p className="text-xs text-gray-500">Managed in real-time from Firestore `products`</p>
                </div>
                <button 
                  onClick={() => onNavigate('market')} 
                  className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition"
                >
                  View Customer View
                </button>
              </div>

              {loading ? (
                <div className="py-12 flex justify-center items-center text-emerald-700 gap-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-xs font-bold">Syncing live inventory...</span>
                </div>
              ) : listings.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  No active harvest listings. Use the form on the left to add your first harvest!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {listings.map((item) => (
                    <div key={item.id} className="border border-emerald-100 rounded-2xl p-4 bg-white shadow-xs space-y-3 relative group">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                            {item.batch || "Harvest Batch"}
                          </span>
                          <h4 className="font-bold text-gray-900 text-base mt-1">{item.cropName || item.name}</h4>
                          <p className="text-[11px] text-gray-400">{item.harvestDate || "Freshly Harvested"}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-extrabold text-emerald-700">₹{item.pricePerUnit || item.price} <span className="text-xs font-normal text-gray-400">/ {item.unit || 'kg'}</span></span>
                          {item.marketPrice && (
                            <p className="text-[10px] text-gray-400">APMC: ₹{item.marketPrice}</p>
                          )}
                        </div>
                      </div>

                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="bg-emerald-600 h-full rounded-full" style={{ width: '75%' }}></div>
                      </div>

                      <div className="flex justify-between items-center text-xs text-gray-500 pt-1">
                        <span>Stock Available: <strong className="text-emerald-800">{item.quantity} {item.unit || 'kg'}</strong></span>
                        <button 
                          onClick={() => handleDeleteProduct(item.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition"
                          title="Remove listing"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Incoming Produce Orders</h3>
                  <p className="text-xs text-gray-500">Orders filtered by your Farmer ID across multi-vendor baskets</p>
                </div>
                <button 
                  onClick={() => onNavigate('admin')} 
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold"
                >
                  Admin Logistics Hub →
                </button>
              </div>

              {farmerOrders.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs border border-dashed border-gray-200 rounded-2xl">
                  No orders have been placed for your produce yet. When customers order in the Marketplace, your consignments will appear here!
                </div>
              ) : (
                <div className="space-y-3">
                  {farmerOrders.map((order) => (
                    <div key={order.id} className="p-4 border border-emerald-100 rounded-2xl bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-sm">Order #{order.id.slice(0, 8)}</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">
                            {order.status || 'Placed'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Customer: {order.customerName || "Fresh Customer"}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Items: {order.items?.map(i => `${i.name || i.cropName} (${i.quantity || 1}${i.unit || 'kg'})`).join(', ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-extrabold text-emerald-800">₹{order.totalAmount}</p>
                        <button 
                          onClick={() => onNavigate('tracking', order.id)}
                          className="mt-1 text-xs text-emerald-700 font-bold hover:underline"
                        >
                          View Live Tracking →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}