import { createContext, useContext, useState, type ReactNode } from "react";
import type { AuthResponse, PublicUser } from "@/lib/api";

type AuthState = {
  user: PublicUser | null;
  token: string | null;
  setSession: (res: AuthResponse) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const setSession = (res: AuthResponse) => {
    setUser(res.user);
    setToken(res.token);
  };
  const logout = () => {
    setUser(null);
    setToken(null);
  };

  const value: AuthState = { user, token, setSession, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth AuthProvider içinde kullanılmalı");
  return ctx;
}