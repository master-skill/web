import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(userRef);
        if (!docSnap.exists()) {
          await setDoc(userRef, {
            email: firebaseUser.email,
            tokens: 1,
          });
          setTokens(1);
        } else {
          setTokens(docSnap.data().tokens);
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  return (
    <AuthContext.Provider value={{ user, login, tokens, setTokens }}>
      {children}
    </AuthContext.Provider>
  );
}
