"use client";

import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";
import type { PublicDiaryEntry } from "@/lib/types";
import { DiaryCard } from "@/components/DiaryCard";

export default function PublicPage() {
  const [entries, setEntries] = useState<PublicDiaryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<PublicDiaryEntry[]>("/api/diaries/public")
      .then((data) => setEntries(data))
      .catch((err) => {
        setError(err instanceof Error ? err.message : "公開日記の取得に失敗しました");
      });
  }, []);

  return (
    <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">
      <h1 className="text-2xl font-bold">みんなの日記</h1>
      {error ? <p className="rounded bg-rose-100 px-3 py-2 text-rose-700">{error}</p> : null}
      {entries.map((entry) => (
        <DiaryCard key={entry.id} entry={entry} />
      ))}
    </main>
  );
}
