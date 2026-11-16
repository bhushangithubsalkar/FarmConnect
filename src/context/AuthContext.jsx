import { createContext, useContext, useEffect, useState } from "react";
import { auth, db, storage } from "../services/firebase";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        return data;
      }
      return null;
    } catch (err) {
      console.error("Error fetching user profile:", err);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await fetchUserProfile(user.uid);
      } else {
        setCurrentUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Register user with Firestore profile & optional farmland photo upload
  const register = async ({ email, password, name, phone, role, farmlandFile }) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    let farmlandPhotoUrl = null;

    if (role === 'farmer' && farmlandFile) {
      try {
        const cleanFileName = farmlandFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const storageRef = ref(storage, `farmland_photos/${user.uid}_${Date.now()}_${cleanFileName}`);
        const snapshot = await uploadBytes(storageRef, farmlandFile);
        farmlandPhotoUrl = await getDownloadURL(snapshot.ref);
      } catch (storageErr) {
        console.warn("Storage upload failed or storage not configured. Continuing profile creation:", storageErr);
      }
    }

    const profile = {
      uid: user.uid,
      name: name || (role === 'farmer' ? "Farmer Partner" : "Valued Customer"),
      email,
      phone: phone || "",
      role: role || "customer",
      farmlandPhoto: farmlandPhotoUrl || null,
      createdAt: serverTimestamp()
    };

    await setDoc(doc(db, "users", user.uid), profile);
    setUserData(profile);
    setCurrentUser(user);
    return { user, profile };
  };

  // Sign in existing user
  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const profile = await fetchUserProfile(user.uid);
    return { user, profile };
  };

  // Sign out
  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setUserData(null);
  };

  const refreshUserData = async () => {
    if (currentUser) {
      return await fetchUserProfile(currentUser.uid);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      userData, 
      loading, 
      login, 
      register, 
      logout, 
      refreshUserData 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
