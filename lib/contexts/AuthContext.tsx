"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, IdTokenResult } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "@/lib/firebase/clientApp";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  tokenResult: IdTokenResult | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  tokenResult: null,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tokenResult, setTokenResult] = useState<IdTokenResult | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
        try {
          const token = await user.getIdTokenResult();

          setTokenResult(token);
          setIsAdmin(token.claims.admin === true);
        } catch (error) {
          console.error("Error getting ID token:", error);
          setTokenResult(null);
          setIsAdmin(false);
        }
      } else {
        setTokenResult(null);
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, tokenResult }}>
      {children}
    </AuthContext.Provider>
  );
}
