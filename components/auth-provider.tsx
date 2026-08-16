"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useLayoutEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  kyc_status: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook para usar useLayoutEffect no cliente e useEffect no servidor
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function AuthProvider({ children }: { children: ReactNode }) {
  // Inicializar estados sincronamente do localStorage se disponível
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem("auth-user");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return null;
        }
      }
    }
    return null;
  });
  
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("auth-token");
    }
    return null;
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Usar useLayoutEffect para garantir que roda antes do paint
  useIsomorphicLayoutEffect(() => {
    const storedToken = localStorage.getItem("auth-token");
    const storedUser = localStorage.getItem("auth-user");

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        
        // Também setar cookie para o servidor (SameSite=None; Secure para funcionar no iframe do preview e cross-site)
        document.cookie = `auth-token=${storedToken}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=none; secure`;
      } catch {
        // Token inválido, limpar
        localStorage.removeItem("auth-token");
        localStorage.removeItem("auth-user");
        setToken(null);
        setUser(null);
      }
    }
    
    setIsLoading(false);
  }, []);

  // Verificar se está em rota protegida sem autenticação
  useEffect(() => {
    if (!isLoading && !token && pathname?.startsWith("/dashboard")) {
      router.push("/auth/login");
    }
  }, [isLoading, token, pathname, router]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("auth-token", newToken);
    localStorage.setItem("auth-user", JSON.stringify(newUser));
    document.cookie = `auth-token=${newToken}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=none; secure`;
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("auth-token");
    localStorage.removeItem("auth-user");
    document.cookie = "auth-token=; path=/; max-age=0";
    setToken(null);
    setUser(null);
    router.push("/auth/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
