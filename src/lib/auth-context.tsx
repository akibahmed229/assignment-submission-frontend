"use client"

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { AuthResponse, Role } from "./types";
import { useRouter } from "next/navigation";
import { api } from "./api";
import { endpoints } from "./endpoints";

interface AuthUser {
  userId: string;
  fullName: string,
  email: string,
  role: Role
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void
}

const AuthContext = createContext < AuthContextValue | null > (null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState < AuthUser | null > (null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) setUser(JSON.parse(raw));

    setLoading(false);
  }, [])

  async function login(email: string, password: string) {
    const res = await api.post < AuthResponse > (endpoints.login, { email, password });
    const authUser: AuthUser = { userId: res.userId, fullName: res.fullName, email: res.email, role: res.role };

    localStorage.setItem("token", res.token);
    localStorage.setItem("user", JSON.stringify(authUser));

    setUser(authUser);
    router.push("/dashboard");
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    router.push("/login");
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");

  return ctx;
}
