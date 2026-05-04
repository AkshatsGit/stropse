import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signup(email, password, name, username) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    const userData = {
      uid: cred.user.uid,
      name,
      username,
      email,
      bio: '',
      profilePicture: '',
      friends: [],
      friendRequests: [],
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), userData);
    return cred;
  }

  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    // Create Firestore profile if first time
    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    if (!snap.exists()) {
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        name: cred.user.displayName || 'Player',
        username: cred.user.email.split('@')[0],
        email: cred.user.email,
        bio: '',
        profilePicture: cred.user.photoURL || '',
        friends: [],
        friendRequests: [],
        createdAt: serverTimestamp(),
      });
    }
    return cred;
  }

  async function logout() {
    return signOut(auth);
  }

  async function fetchUserProfile(uid) {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      setUserProfile({ id: snap.id, ...snap.data() });
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchUserProfile(firebaseUser.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const value = {
    user,
    userProfile,
    setUserProfile,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    refreshProfile: () => user && fetchUserProfile(user.uid),
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
