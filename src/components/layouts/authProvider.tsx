"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { getMe, getToken, isMeSuccess, logout } from "@/network/auth";
import PageLoader from "@/components/layouts/pageLoader";
import type { PublicUser } from "@/@types/database/users";

const AuthContext = createContext<PublicUser | null>(null);

// Gates the entire /app/** surface. On mount, checks the JWT cookie; if it's
// missing or the /api/auth/me probe rejects, the user is bounced to /login.
// Children only render once we have a confirmed user, so consumers can call
// useAuth() without null-checks.
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    let active = true;
    getMe()
      .then((res) => {
        if (!active) return;
        if (isMeSuccess(res)) {
          setUser(res.user);
        } else {
          logout();
          router.replace("/login");
        }
      })
      .catch(() => {
        // Transport/unexpected error — let the user retry from /login.
        if (active) router.replace("/login");
      });
    return () => {
      active = false;
    };
  }, [router]);

  if (!user) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <PageLoader size={8} />
      </div>
    );
  }

  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

export function useAuth(): PublicUser {
  const user = useContext(AuthContext);
  if (!user) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return user;
}
