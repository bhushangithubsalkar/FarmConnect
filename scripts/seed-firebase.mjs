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

// Helper to authenticate or register user
async function authenticateUser(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  } catch (err) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        return cred.user;
      } catch (createErr) {
        if (createErr.code === 'auth/email-already-in-use') {
          // If already in use with different pass, sign in with fallback or retry
          throw createErr;
        }
        throw createErr;
      }
    }
    throw err;
  }
}

async function seedData() {
  console.log('====================================================');
  console.log('   FarmConnect: Pushing All Existing Data to Firebase');
  console.log('====================================================\n');

  // --- Step 1: User Accounts & Profiles ---
  console.log('[1/3] Provisioning Authentication & Firestore Users...');

  const usersConfig = [
    {
      email: 'admin@farmconnect.com',
      password: 'AdminPassword123!',
      name: 'Operations Admin',
      phone: '+91 99999 00000',
      role: 'admin',
      location: 'Central APMC Logistics Hub, Vashi, Navi Mumbai'
    },
    {
      email: 'farmer.ramesh@farmconnect.com',
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

  for (const cfg of usersConfig) {
    const user = await authenticateUser(cfg.email, cfg.password);
    const profile = {
      uid: user.uid,
      name: cfg.name,
      email: cfg.email,
      phone: cfg.phone,
      role: cfg.role,
      location: cfg.location,
      farmlandPhoto: cfg.farmlandPhoto || null,
      createdAt: serverTimestamp()
    };
    await setDoc(doc(db, 'users', user.uid), profile);
    seededUsers[cfg.email] = { ...profile, uid: user.uid, password: cfg.password };
    console.log(`  ✓ Profile saved: ${cfg.email} (${cfg.role.toUpperCase()}) -> UID: ${user.uid}`);
  }

  // --- Step 2: Push Produce Listings to products collection ---
  console.log('\n[2/3] Publishing Farmer Harvest Listings to products collection...');

  const farmerProducts = [
    {
      farmerEmail: 'farmer.ramesh@farmconnect.com',
      items: [
        {
          cropName: 'Nashik Red Vine Tomatoes',
          category: 'Vegetables',
          pricePerUnit: 32,
          marketPrice: 55,
          quantity: 320,
          unit: 'kg',
          batch: 'Batch #VN-2025-08',
          harvestDate: 'Today 6:00 AM',
          status: 'In Stock'
        },
        {
          cropName: 'Desi Vine Tomatoes',
          category: 'Vegetables',
          pricePerUnit: 38,
          marketPrice: 55,
          quantity: 500,
          unit: 'kg',
          batch: 'Batch #VN-2025-09',
          harvestDate: 'Today 5:30 AM',
          status: 'In Stock'
        }
      ]
    },
    {
      farmerEmail: 'harish.deshmukh@farmconnect.com',
      items: [
        {
          cropName: 'Shimla Green Capsicum',
          category: 'Vegetables',
          pricePerUnit: 58,
          marketPrice: 90,
          quantity: 140,
          unit: 'kg',
          batch: 'Batch #SH-2025-02',
          harvestDate: 'Yesterday evening',
          status: 'Selling Fast'
        }
      ]
    },
    {
      farmerEmail: 'sunita.shinde@farmconnect.com',
      items: [
        {
          cropName: 'Hydro Baby Spinach',
          category: 'Greens',
          pricePerUnit: 24,
          marketPrice: 45,
          quantity: 85,
          unit: 'bn',
          batch: 'Batch #PL-2025-11',
          harvestDate: '4 hrs ago',
          status: 'Re-stock needed'
        },
        {
          cropName: 'Fresh Organic Coriander',
          category: 'Greens',
          pricePerUnit: 15,
          marketPrice: 28,
          quantity: 120,
          unit: 'bn',
          batch: 'Batch #CR-2025-04',
          harvestDate: 'Today 6:15 AM',
          status: 'In Stock'
        }
      ]
    },
    {
      farmerEmail: 'balasaheb.thorat@farmconnect.com',
      items: [
        {
          cropName: 'Nagpur Sweet Mandarins',
          category: 'Fruits',
          pricePerUnit: 75,
          marketPrice: 120,
          quantity: 450,
          unit: 'kg',
          batch: 'Batch #NG-2025-01',
          harvestDate: 'Fresh Pick Today',
          status: 'Ample Stock'
        }
      ]
    }
  ];

  const createdProducts = [];

  for (const group of farmerProducts) {
    const farmer = seededUsers[group.farmerEmail];
    // Authenticate as this farmer to push their listings
    await signInWithEmailAndPassword(auth, farmer.email, farmer.password);

    for (const item of group.items) {
      const prodDoc = await addDoc(collection(db, 'products'), {
        ...item,
        farmerId: farmer.uid,
        farmerName: farmer.name,
        farmerLocation: farmer.location,
        createdAt: serverTimestamp()
      });
      createdProducts.push({ id: prodDoc.id, ...item, farmerId: farmer.uid, farmerName: farmer.name });
      console.log(`  ✓ Product listed: "${item.cropName}" by ${farmer.name} (Doc: ${prodDoc.id})`);
    }
  }

  // --- Step 3: Push Orders to orders collection ---
  console.log('\n[3/3] Creating Consignment Orders with Multi-Vendor Routing...');

  const customer = seededUsers['customer@farmconnect.com'];
  await signInWithEmailAndPassword(auth, customer.email, customer.password);

  const ramesh = seededUsers['farmer.ramesh@farmconnect.com'];
  const harish = seededUsers['harish.deshmukh@farmconnect.com'];
  const sunita = seededUsers['sunita.shinde@farmconnect.com'];
  const balasaheb = seededUsers['balasaheb.thorat@farmconnect.com'];

  const order1 = {
    customerId: customer.uid,
    customerName: customer.name,
    customerPhone: customer.phone,
    items: [
      {
        productId: createdProducts[0]?.id || 'prod-1',
        name: 'Nashik Red Vine Tomatoes',
        cropName: 'Nashik Red Vine Tomatoes',
        price: 32,
        quantity: 1,
        unit: 'kg',
        farmerId: ramesh.uid,
        farmerName: ramesh.name
      },
      {
        productId: createdProducts[3]?.id || 'prod-3',
        name: 'Hydro Baby Spinach',
        cropName: 'Hydro Baby Spinach',
        price: 24,
        quantity: 2,
        unit: 'bn',
        farmerId: sunita.uid,
        farmerName: sunita.name
      },
      {
        productId: createdProducts[2]?.id || 'prod-2',
        name: 'Shimla Green Capsicum',
        cropName: 'Shimla Green Capsicum',
        price: 58,
        quantity: 1,
        unit: 'kg',
        farmerId: harish.uid,
        farmerName: harish.name
      }
    ],
    farmerIds: [ramesh.uid, sunita.uid, harish.uid],
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
  };

  const order2 = {
    customerId: customer.uid,
    customerName: 'Vikram Mehta',
    customerPhone: '+91 98222 33344',
    items: [
      {
        productId: createdProducts[5]?.id || 'prod-5',
        name: 'Nagpur Sweet Mandarins',
        cropName: 'Nagpur Sweet Mandarins',
        price: 75,
        quantity: 2,
        unit: 'kg',
        farmerId: balasaheb.uid,
        farmerName: balasaheb.name
      }
    ],
    farmerIds: [balasaheb.uid],
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
  };

  const oDoc1 = await addDoc(collection(db, 'orders'), order1);
  console.log(`  ✓ Order #1 created: #${oDoc1.id.slice(0, 8)} (${order1.status} - ₹${order1.totalAmount})`);

  const oDoc2 = await addDoc(collection(db, 'orders'), order2);
  console.log(`  ✓ Order #2 created: #${oDoc2.id.slice(0, 8)} (${order2.status} - ₹${order2.totalAmount})`);

  console.log('\n====================================================');
  console.log('   🎉 ALL DATA SUCCESSFULLY PUSHED TO FIREBASE!     ');
  console.log('====================================================');
  console.log('\n🔑 Ready-to-Use Login Credentials:');
  console.log('----------------------------------------------------');
  console.log('👑 Admin Portal:');
  console.log('   Email:    admin@farmconnect.com');
  console.log('   Password: AdminPassword123!\n');
  console.log('🚜 Farmer Portal (Ramesh Patel):');
  console.log('   Email:    farmer.ramesh@farmconnect.com');
  console.log('   Password: FarmerPass123!\n');
  console.log('🛒 Customer Marketplace (Sneha Sharma):');
  console.log('   Email:    customer@farmconnect.com');
  console.log('   Password: CustomerPass123!');
  console.log('----------------------------------------------------\n');

  process.exit(0);
}

seedData().catch(err => {
  console.error('\n❌ Seeding Error:', err);
  process.exit(1);
});

