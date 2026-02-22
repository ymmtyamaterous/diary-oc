"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { apiRequest } from "@/lib/api";
import { clearAuthToken, getAuthToken, setUserCache } from "@/lib/auth";
import type { User } from "@/lib/types";

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return localStorage.getItem("theme") === "dark";
  });
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      return;
    }

    apiRequest<User>("/api/auth/me", { token })
      .then((me) => {
        setUser(me);
        setUserCache(JSON.stringify(me));
      })
      .catch(() => {
        clearAuthToken();
        setUser(null);
      });
  }, [pathname]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-bold text-sky-600 dark:text-sky-400">
          Diary Open Close
        </Link>

        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/diary"
            className="rounded-md px-3 py-1.5 text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            📝 マイ日記
          </Link>
          <Link
            href="/public"
            className="rounded-md px-3 py-1.5 text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            🌍 みんなの日記
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-md px-3 py-1.5 text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
            aria-label="テーマ切替"
          >
            {isDark ? "☀️" : "🌙"}
          </button>
          {user ? (
            <div className="flex items-center gap-2 rounded-md border border-zinc-200 px-2 py-1 dark:border-zinc-800">
              <span className="max-w-24 truncate font-medium text-zinc-800 dark:text-zinc-100">{user.display_name}</span>
              <button
                type="button"
                onClick={logout}
                className="rounded bg-rose-500 px-2 py-1 text-xs text-white hover:bg-rose-600"
              >
                ログアウト
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded bg-sky-600 px-3 py-1.5 text-white hover:bg-sky-700"
            >
              ログイン
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
