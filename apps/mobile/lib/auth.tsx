import type { LoginInput, PublicUser, RegisterInput } from "@vidora/shared";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, tokenStore } from "./api";

type AuthState = {
  user: PublicUser | null;
  ready: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: PublicUser) => void;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (await tokenStore.load()) {
          const r = await api.me();
          if (r.user) setUser(r.user);
          else await tokenStore.clear();
        }
      } catch {
        // offline or server down: stay signed out for now
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const r = await api.login(input);
    await tokenStore.save(r.token);
    setUser(r.user);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const r = await api.register(input);
    await tokenStore.save(r.token);
    setUser(r.user);
  }, []);

  const logout = useCallback(async () => {
    await tokenStore.clear();
    setUser(null);
  }, []);

  return <Ctx.Provider value={{ user, ready, login, register, logout, setUser }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
