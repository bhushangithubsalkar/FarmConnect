import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Helper to get or create an Auth user
async function getOrCreateAuthUser(email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    console.log(`Created new Auth user for ${email} (UID: ${cred.user.uid})`);
    return cred.user;
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      console.log(`Signed into existing Auth user for ${email} (UID: ${cred.user.uid})`);
      return cred.user;
    }
    throw err;
  }
}

async function seedData() {
  console.log('--- Starting FarmConnect Firebase Seeding ---');

  // 1. Seed Users (Admin, Farmers, Customer)
  console.log('\n[1/3] Provisioning Authentication & User Profiles...');

  const userDefinitions = [
    {
      email: 'admin@farmconnect.com',
      password: 'AdminPassword123!',
      name: 'Operations Admin',
      phone: '+91 99999 00000',
      role: 'admin',
      location: 'Central Control Hub, Mumbai'
    },
    {
      email: 'ramesh.patel@farmconnect.com',
      password: 'FarmerPass123!',
      name: 'Ramesh Patel',
      phone: '(555) 234-5678',
      role: 'farmer',
      location: 'Green Valley Farm, Nashik',
      farmlandPhoto: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800'
    },
    {
      email: 'harish.deshmukh@farmconnect.com',
      password: 'FarmerPass123!',
      name: 'Harish Deshmukh',
      phone: '+91 98765 43211',
      role: 'farmer',
      location: 'Sahyadri Agro, Pune',
      farmlandPhoto: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800'
    },
    {
      email: 'sunita.shinde@farmconnect.com',
      password: 'FarmerPass123!',
      name: 'Sunita Shinde',
      phone: '+91 98765 43212',
      role: 'farmer',
      location: 'Shinde Hydro, Satara',
      farmlandPhoto: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800'
    },
    {
      email: 'balasaheb.thorat@farmconnect.com',
      password: 'FarmerPass123!',
      name: 'Balasaheb Thorat',
      phone: '+91 98765 43213',
      role: 'farmer',
      location: 'Thorat Orchards, Nagpur',
      farmlandPhoto: 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=800'
    },
    {
      email: 'customer@farmconnect.com',
      password: 'CustomerPass123!',
      name: 'Sneha Sharma',
      phone: '+91 98111 22233',
      role: 'customer',
      location: 'B-402, Green Meadows, Mumbai'
    }
  ];

  const seededUsers = {};

  for (const def of userDefinitions) {
    const authUser = await getOrCreateAuthUser(def.email, def.password);
    const profile = {
      uid: authUser.uid,
      name: def.name,
      email: def.email,
      phone: def.phone,
      role: def.role,
      location: def.location,
      farmlandPhoto: def.farmlandPhoto || null,
      createdAt: serverTimestamp()
    };
    await setDoc(doc(db, 'users', authUser.uid), profile);
    seededUsers[def.email] = { ...profile, uid: authUser.uid };
    console.log(`Saved user document in Firestore: users/${authUser.uid} (${def.role})`);
  }

  // 2. Seed Produce Listings (products collection)
  console.log('\n[2/3] Seeding Farmer Produce Listings...');

  const rameshUid = seededUsers['ramesh.patel@farmconnect.com'].uid;
  const harishUid = seededUsers['harish.deshmukh@farmconnect.com'].uid;
  const sunitaUid = seededUsers['sunita.shinde@farmconnect.com'].uid;
  const balasahebUid = seededUsers['balasaheb.thorat@farmconnect.com'].uid;

  const productListings = [
    {
      farmerId: rameshUid,
      farmerName: 'Ramesh Patel',
      farmerLocation: 'Green Valley Farm, Nashik',
      cropName: 'Nashik Red Vine Tomatoes',
      category: 'Vegetables',
      pricePerUnit: 32,
      marketPrice: 55,
      quantity: 320,
      unit: 'kg',
      batch: 'Batch #VN-2025-08',
      harvestDate: 'Today 6:00 AM',
      status: 'In Stock',
      createdAt: serverTimestamp()
    },
    {
      farmerId: harishUid,
      farmerName: 'Harish Deshmukh',
      farmerLocation: 'Sahyadri Agro, Pune',
      cropName: 'Shimla Green Capsicum',
      category: 'Vegetables',
      pricePerUnit: 58,
      marketPrice: 90,
      quantity: 140,
      unit: 'kg',
      batch: 'Batch #SH-2025-02',
      harvestDate: 'Yesterday evening',
      status: 'Selling Fast',
      createdAt: serverTimestamp()
    },
    {
      farmerId: sunitaUid,
      farmerName: 'Sunita Shinde',
      farmerLocation: 'Shinde Hydro, Satara',
      cropName: 'Hydro Baby Spinach',
      category: 'Greens',
      pricePerUnit: 24,
      marketPrice: 45,
      quantity: 85,
      unit: 'bn',
      batch: 'Batch #PL-2025-11',
      harvestDate: '4 hrs ago',
      status: 'Re-stock needed',
      createdAt: serverTimestamp()
    },
    {
      farmerId: balasahebUid,
      farmerName: 'Balasaheb Thorat',
      farmerLocation: 'Thorat Orchards, Nagpur',
      cropName: 'Nagpur Sweet Mandarins',
      category: 'Fruits',
      pricePerUnit: 75,
      marketPrice: 120,
      quantity: 450,
      unit: 'kg',
      batch: 'Batch #NG-2025-01',
      harvestDate: 'Fresh Pick Today',
      status: 'Ample Stock',
      createdAt: serverTimestamp()
    },
    {
      farmerId: rameshUid,
      farmerName: 'Ramesh Patel',
      farmerLocation: 'Green Valley Farm, Nashik',
      cropName: 'Desi Vine Tomatoes',
      category: 'Vegetables',
      pricePerUnit: 38,
      marketPrice: 55,
      quantity: 500,
      unit: 'kg',
      batch: 'Batch #VN-2025-09',
      harvestDate: 'Today 5:30 AM',
      status: 'In Stock',
      createdAt: serverTimestamp()
    },
    {
      farmerId: sunitaUid,
      farmerName: 'Sunita Shinde',
      farmerLocation: 'Shinde Hydro, Satara',
      cropName: 'Fresh Organic Coriander',
      category: 'Greens',
      pricePerUnit: 15,
      marketPrice: 28,
      quantity: 120,
      unit: 'bn',
      batch: 'Batch #CR-2025-04',
      harvestDate: 'Today 6:15 AM',
      status: 'In Stock',
      createdAt: serverTimestamp()
    }
  ];

  const seededProducts = [];
  for (const prod of productListings) {
    const docRef = await addDoc(collection(db, 'products'), prod);
    seededProducts.push({ id: docRef.id, ...prod });
    console.log(`Added product listing: "${prod.cropName}" (ID: ${docRef.id})`);
  }

  // 3. Seed Consignment Orders (orders collection)
  console.log('\n[3/3] Seeding Multi-Vendor Orders with Cold-Chain Telemetry...');

  const customerUid = seededUsers['customer@farmconnect.com'].uid;

  const orders = [
    {
      customerId: customerUid,
      customerName: 'Sneha Sharma',
      customerPhone: '+91 98111 22233',
      items: [
        {
          productId: seededProducts[0].id,
          cropName: 'Nashik Red Vine Tomatoes',
          name: 'Nashik Red Vine Tomatoes',
          price: 32,
          quantity: 1,
          unit: 'kg',
          farmerId: rameshUid,
          farmerName: 'Ramesh Patel'
        },
        {
          productId: seededProducts[2].id,
          cropName: 'Hydro Baby Spinach',
          name: 'Hydro Baby Spinach',
          price: 24,
          quantity: 2,
          unit: 'bn',
          farmerId: sunitaUid,
          farmerName: 'Sunita Shinde'
        },
        {
          productId: seededProducts[1].id,
          cropName: 'Shimla Green Capsicum',
          name: 'Shimla Green Capsicum',
          price: 58,
          quantity: 1,
          unit: 'kg',
          farmerId: harishUid,
          farmerName: 'Harish Deshmukh'
        }
      ],
      farmerIds: [rameshUid, sunitaUid, harishUid],
      totalAmount: 138,
      status: 'In Transit', // Stage 4 of 5
      otp: '6482',
      eta: 'Today by 5:30 PM',
      deliveryPartner: {
        name: 'Rajesh Mandhare',
        rating: 4.9,
        deliveries: '1,240+',
        vehicle: 'Cold-chain EV (Temp: 4.2°C)',
        phone: '+91 98765 43210'
      },
      createdAt: serverTimestamp()
    },
    {
      customerId: customerUid,
      customerName: 'Vikram Mehta',
      customerPhone: '+91 98222 33344',
      items: [
        {
          productId: seededProducts[3].id,
          cropName: 'Nagpur Sweet Mandarins',
          name: 'Nagpur Sweet Mandarins',
          price: 75,
          quantity: 2,
          unit: 'kg',
          farmerId: balasahebUid,
          farmerName: 'Balasaheb Thorat'
        }
      ],
      farmerIds: [balasahebUid],
      totalAmount: 150,
      status: 'Harvested', // Stage 2 of 5
      otp: '3914',
      eta: 'Tomorrow by 11:00 AM',
      deliveryPartner: {
        name: 'Rajesh Mandhare',
        rating: 4.9,
        deliveries: '1,240+',
        vehicle: 'Cold-chain EV (Temp: 4.0°C)',
        phone: '+91 98765 43210'
      },
      createdAt: serverTimestamp()
    }
  ];

  for (const order of orders) {
    const orderDoc = await addDoc(collection(db, 'orders'), order);
    console.log(`Created Order #${orderDoc.id.slice(0, 8)} (${order.status}) for ${order.customerName}`);
  }

  console.log('\n All data has been successfully pushed into Firebase!');
  console.log('\n--- Login Credentials Seeded ---');
  console.log('• Admin:    admin@farmconnect.com       / AdminPassword123!');
  console.log('• Farmer:   ramesh.patel@farmconnect.com / FarmerPass123!');
  console.log('• Customer: customer@farmconnect.com     / CustomerPass123!');
  console.log('--------------------------------\n');
  process.exit(0);
}

seedData().catch(err => {
  console.error('Fatal Seeding Error:', err);
  process.exit(1);
});
