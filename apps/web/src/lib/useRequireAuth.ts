"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";

/** Returns a guard: call it before an auth-only action; it redirects to /login when signed out. */
export function useRequireAuth() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  return useCallback(() => {
    if (user) return true;
    router.push(`/login?next=${encodeURIComponent(pathname)}`);
    return false;
  }, [user, router, pathname]);
}
