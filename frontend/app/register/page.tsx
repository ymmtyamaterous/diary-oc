"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { apiRequest } from "@/lib/api";
import { setAuthToken, setUserCache } from "@/lib/auth";
import type { AuthResponseData } from "@/lib/types";

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password !== passwordConfirm) {
      setError("パスワード確認が一致しません");
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest<AuthResponseData>("/api/auth/register", {
        method: "POST",
        body: {
          display_name: displayName,
          email,
          password,
        },
      });
      setAuthToken(data.token);
      setUserCache(JSON.stringify(data.user));
      router.push("/diary");
    } catch (err) {
      setError(err instanceof Error ? err.message : "登録に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto mt-10 w-full max-w-md px-4">
      <h1 className="mb-6 text-2xl font-bold">新規登録</h1>
      {error ? <p className="mb-4 rounded bg-rose-100 px-3 py-2 text-rose-700">{error}</p> : null}
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <label className="mb-1 block text-sm">表示名</label>
          <input
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
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
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm">パスワード確認</label>
          <input
            type="password"
            required
            minLength={8}
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-sky-600 px-4 py-2 text-white hover:bg-sky-700 disabled:opacity-70"
        >
          {loading ? "登録中..." : "登録する"}
        </button>
      </form>
      <p className="mt-4 text-sm">
        すでにアカウントをお持ちの方は <Link href="/login" className="text-sky-600">ログインはこちら</Link>
      </p>
    </main>
  );
}
