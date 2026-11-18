import { useState, useEffect } from 'react';
import { 
  ShoppingCart, Tractor, ArrowRight, Plus, Minus, Trash2, 
  Loader2, CheckCircle2, Sparkles, LogOut 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';

// Default seed products in case Firestore products collection is initially empty
const defaultProducts = [
  { id: "seed-1", name: "Nashik Red Vine Tomatoes", cropName: "Nashik Red Vine Tomatoes", farmer: "Ramesh Patel", farmerName: "Ramesh Patel", farmerId: "farmer-ramesh", location: "Green Valley Farm", price: 32, pricePerUnit: 32, marketPrice: 55, harvest: "Today 6:00 AM", unit: "kg" },
  { id: "seed-2", name: "Shimla Green Capsicum", cropName: "Shimla Green Capsicum", farmer: "Harish Deshmukh", farmerName: "Harish Deshmukh", farmerId: "farmer-harish", location: "Sahyadri Agro", price: 58, pricePerUnit: 58, marketPrice: 90, harvest: "Yesterday evening", unit: "kg" },
  { id: "seed-3", name: "Hydro Baby Spinach", cropName: "Hydro Baby Spinach", farmer: "Sunita Shinde", farmerName: "Sunita Shinde", farmerId: "farmer-sunita", location: "Shinde Hydro", price: 24, pricePerUnit: 24, marketPrice: 45, harvest: "4 hrs ago", unit: "bn" },
  { id: "seed-4", name: "Nagpur Sweet Mandarins", cropName: "Nagpur Sweet Mandarins", farmer: "Balasaheb Thorat", farmerName: "Balasaheb Thorat", farmerId: "farmer-balasaheb", location: "Thorat Orchards", price: 75, pricePerUnit: 75, marketPrice: 120, harvest: "Fresh Pick", unit: "kg" }
];

export default function Marketplace({ onNavigate }) {
  const { currentUser, userData, logout } = useAuth();

  const [products, setProducts] = useState(defaultProducts);
  const [loading, setLoading] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  // Cart state
  const [cart, setCart] = useState([
    { productId: "seed-1", name: "Nashik Red Vine Tomatoes", price: 32, marketPrice: 55, quantity: 1, unit: "kg", farmerId: "farmer-ramesh", farmerName: "Ramesh Patel" },
    { productId: "seed-3", name: "Hydro Baby Spinach", price: 24, marketPrice: 45, quantity: 2, unit: "bn", farmerId: "farmer-sunita", farmerName: "Sunita Shinde" },
    { productId: "seed-2", name: "Shimla Green Capsicum", price: 58, marketPrice: 90, quantity: 1, unit: "kg", farmerId: "farmer-harish", farmerName: "Harish Deshmukh" }
  ]);

  // Real-time listener for products collection
  useEffect(() => {
    let unsubscribe = () => {};

    try {
      unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              name: data.cropName || data.name,
              farmer: data.farmerName || "Local Verified Farmer",
              farmerId: data.farmerId || "demo-farmer",
              location: data.farmerLocation || "Green Valley Cluster",
              price: Number(data.pricePerUnit || data.price) || 40,
              marketPrice: Number(data.marketPrice) || Math.round((Number(data.pricePerUnit || data.price) || 40) * 1.4),
              harvest: data.harvestDate || "Fresh Pick Today",
              unit: data.unit || "kg"
            };
          });
          setProducts(items);
        }
        setLoading(false);
      }, (err) => {
        console.warn("Products snapshot error (using mock products):", err);
        setLoading(false);
      });
    } catch (e) {
      console.warn("Firestore collection error:", e);
    }

    return () => unsubscribe();
  }, []);

  // Cart operations
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, {
          productId: product.id,
          name: product.name,
          price: product.price,
          marketPrice: product.marketPrice,
          quantity: 1,
          unit: product.unit || "kg",
          farmerId: product.farmerId,
          farmerName: product.farmer
        }];
      }
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) => 
      prev.map(item => {
        if (item.productId === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean)
    );
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  // Cart totals
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPayable = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalMarketBenchmark = cart.reduce((sum, item) => sum + ((item.marketPrice || item.price * 1.35) * item.quantity), 0);
  const totalSavings = Math.max(0, totalMarketBenchmark - totalPayable);

  // Place Order with multi-vendor uniqueFarmerIds
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setOrdering(true);
    setOrderSuccess(null);

    // Extract unique farmerIds for multi-vendor querying
    const uniqueFarmerIds = [...new Set(cart.map(item => item.farmerId).filter(Boolean))];

    const orderData = {
      customerId: currentUser?.uid || "guest-customer",
      customerName: userData?.name || "Valued Customer",
      customerPhone: userData?.phone || "+91 (555) 234-5678",
      items: cart,
      farmerIds: uniqueFarmerIds.length > 0 ? uniqueFarmerIds : ["farmer-ramesh"],
      totalAmount: totalPayable,
      status: "Placed", // Stage 1 of 5
      otp: Math.floor(1000 + Math.random() * 9000).toString(),
      eta: "Today by 5:30 PM",
      deliveryPartner: {
        name: "Rajesh Mandhare",
        rating: 4.9,
        deliveries: "1,240+",
        vehicle: "Cold-chain EV (Temp: 4°C)",
        phone: "+91 98765 43210"
      },
      createdAt: serverTimestamp()
    };

    try {
      const docRef = await addDoc(collection(db, "orders"), orderData);
      setOrderSuccess(`Order placed! Order ID: #${docRef.id.slice(0, 8)}`);
      setCart([]);
      setTimeout(() => {
        onNavigate('tracking', docRef.id);
      }, 1000);
    } catch (err) {
      console.warn("Firestore addDoc order failed (creating local session order):", err);
      // Fallback for demo when unconfigured
      const localId = `FC-${Math.floor(10000 + Math.random() * 90000)}`;
      setOrderSuccess(`Order placed! Tracking ID: #${localId}`);
      setCart([]);
      setTimeout(() => {
        onNavigate('tracking', localId);
      }, 1000);
    } finally {
      setOrdering(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onNavigate('auth');
  };

  return (
    <div className="min-h-screen bg-[#f7fcf9] font-sans text-gray-800 pb-12">
      <header className="bg-white border-b border-emerald-100 px-6 py-3 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-700 text-white p-2 rounded-xl"><Tractor className="h-5 w-5" /></div>
            <div>
              <span className="font-extrabold text-gray-900 text-lg">CropConnect</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md ml-2">MARKETPLACE</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate('tracking')} 
              className="px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold border border-emerald-200 transition"
            >
              Live Order Tracking
            </button>
            <div className="flex items-center gap-2 bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs">
              <ShoppingCart className="h-4 w-4" /> {totalItemsCount} items
            </div>
            {currentUser ? (
              <button 
                onClick={handleLogout}
                className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button 
                onClick={() => onNavigate('auth')}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Catalog */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-2xl p-5 text-white flex justify-between items-center shadow-md">
            <div>
              <h2 className="text-lg font-black flex items-center gap-2">
                <span>Average 38.5% savings vs. Retail Mandis</span>
                <Sparkles className="h-4 w-4 text-emerald-300" />
              </h2>
              <p className="text-xs text-emerald-200 mt-0.5">Direct farm gate pricing • Verified cold-chain delivery</p>
            </div>
            <span className="bg-white/10 px-3 py-1 rounded-xl text-xs font-bold border border-white/20 whitespace-nowrap">
              {products.length} Fresh Batches
            </span>
          </div>

          {loading ? (
            <div className="py-16 flex justify-center items-center gap-2 text-emerald-700">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-xs font-bold">Loading live farm catalog...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map((p) => {
                const savingsPct = p.marketPrice > p.price 
                  ? Math.round(((p.marketPrice - p.price) / p.marketPrice) * 100) 
                  : 35;

                return (
                  <div key={p.id} className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-xs space-y-3 flex flex-col justify-between hover:shadow-md transition">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                          Save {savingsPct}% vs Market!
                        </span>
                        <span className="text-[10px] text-gray-400">{p.harvest}</span>
                      </div>
                      
                      <div className="h-28 bg-emerald-50/70 rounded-xl mb-3 flex flex-col items-center justify-center text-emerald-800 font-bold text-xs border border-emerald-100">
                        <Tractor className="h-6 w-6 text-emerald-600 mb-1" />
                        <span>{p.name}</span>
                        <span className="text-[10px] font-normal text-emerald-600">Fresh Harvest</span>
                      </div>

                      <h3 className="font-bold text-gray-900 text-base">{p.name}</h3>
                      <p className="text-xs text-gray-500">{p.farmer} • {p.location}</p>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="text-xl font-black text-gray-900">₹{p.price} <span className="text-xs font-normal text-gray-500">/{p.unit || 'kg'}</span></span>
                        <span className="text-xs text-gray-400 line-through ml-2">₹{p.marketPrice}</span>
                      </div>
                      <button 
                        onClick={() => addToCart(p)}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95"
                      >
                        Add to Basket
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Fresh Basket Sidebar */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs space-y-4 h-fit sticky top-20">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-900 text-base">Your Fresh Basket</h3>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
              {totalItemsCount} items
            </span>
          </div>

          {orderSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{orderSuccess} Redirecting to tracking...</span>
            </div>
          )}

          {cart.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-xs">
              Your basket is empty. Browse the harvest catalog and add fresh produce!
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.productId} className="flex justify-between items-center text-xs py-1.5 border-b border-gray-50">
                    <div className="truncate mr-2">
                      <p className="font-semibold text-gray-800 truncate">{item.name}</p>
                      <p className="text-[10px] text-gray-400">{item.farmerName} • ₹{item.price}/{item.unit}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center bg-gray-100 rounded-lg">
                        <button 
                          onClick={() => updateQuantity(item.productId, -1)}
                          className="p-1 hover:text-emerald-700"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-2 font-bold text-gray-800">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.productId, 1)}
                          className="p-1 hover:text-emerald-700"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="font-bold text-gray-900 w-12 text-right">₹{item.price * item.quantity}</span>
                      <button 
                        onClick={() => removeFromCart(item.productId)}
                        className="text-gray-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {totalSavings > 0 && (
                <div className="bg-emerald-50 p-2.5 rounded-xl text-xs text-emerald-800 flex justify-between font-semibold">
                  <span>Your Direct Farmer Savings</span>
                  <span>₹{totalSavings}</span>
                </div>
              )}

              <div className="pt-3 border-t border-gray-200 space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Subtotal</span>
                  <span>₹{totalPayable}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Cold-Chain Delivery</span>
                  <span className="text-emerald-700 font-semibold">FREE (Launch Offer)</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="font-black text-gray-900 text-base">Total Payable</span>
                  <span className="font-black text-emerald-800 text-xl">₹{totalPayable}</span>
                </div>
              </div>

              <button 
                onClick={handlePlaceOrder}
                disabled={ordering}
                className="w-full py-3.5 bg-[#00663b] hover:bg-[#005531] disabled:opacity-60 text-white font-bold rounded-xl shadow-md text-sm flex items-center justify-center gap-2 transition"
              >
                {ordering ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Writing order to Firestore...</span>
                  </>
                ) : (
                  <>
                    <span>Place Order (₹{totalPayable})</span> <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
