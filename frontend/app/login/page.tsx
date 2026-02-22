"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { apiRequest } from "@/lib/api";
import { setAuthToken, setUserCache } from "@/lib/auth";
import type { AuthResponseData } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiRequest<AuthResponseData>("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      setAuthToken(data.token);
      setUserCache(JSON.stringify(data.user));
      router.push("/diary");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ログインに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto mt-10 w-full max-w-md px-4">
      <h1 className="mb-6 text-2xl font-bold">ログイン</h1>
      {error ? <p className="mb-4 rounded bg-rose-100 px-3 py-2 text-rose-700">{error}</p> : null}
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <label className="mb-1 block text-sm">メールアドレス</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm">パスワード</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-sky-600 px-4 py-2 text-white hover:bg-sky-700 disabled:opacity-70"
        >
          {loading ? "ログイン中..." : "ログイン"}
        </button>
      </form>
      <p className="mt-4 text-sm">
        アカウントをお持ちでない方は <Link href="/register" className="text-sky-600">新規登録はこちら</Link>
      </p>
    </main>
  );
}
