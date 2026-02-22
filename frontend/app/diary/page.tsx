"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { apiRequest } from "@/lib/api";
import { clearAuthToken, getAuthToken } from "@/lib/auth";
import type { DiaryEntry } from "@/lib/types";
import { DiaryCard } from "@/components/DiaryCard";

type DiaryForm = {
  date: string;
  weather: string;
  is_public: boolean;
  content: string;
  events: string;
  emotions: string;
  good_things: string;
  reflections: string;
  gratitude: string;
  tomorrow_goals: string;
  tomorrow_looking_forward: string;
  learnings: string;
  health_habits: string;
  today_in_one_word: string;
  image_url: string;
  image_name: string;
  audio_url: string;
  audio_name: string;
};

const defaultForm = (): DiaryForm => ({
  date: new Date().toISOString().slice(0, 10),
  weather: "",
  is_public: false,
  content: "",
  events: "",
  emotions: "",
  good_things: "",
  reflections: "",
  gratitude: "",
  tomorrow_goals: "",
  tomorrow_looking_forward: "",
  learnings: "",
  health_habits: "",
  today_in_one_word: "",
  image_url: "",
  image_name: "",
  audio_url: "",
  audio_name: "",
});

const weatherOptions = [
  { value: "", label: "未選択" },
  { value: "sunny", label: "☀️ 晴れ" },
  { value: "cloudy", label: "☁️ 曇り" },
  { value: "rainy", label: "🌧️ 雨" },
  { value: "snowy", label: "❄️ 雪" },
  { value: "stormy", label: "⛈️ 嵐" },
  { value: "foggy", label: "🌫️ 霧" },
  { value: "partly-cloudy", label: "⛅ 晴れ時々曇り" },
  { value: "windy", label: "💨 風が強い" },
];

export default function DiaryPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [form, setForm] = useState<DiaryForm>(defaultForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const currentToken = getAuthToken();
    if (!currentToken) {
      router.push("/login");
      return;
    }
    setToken(currentToken);
  }, [router]);

  const fetchDiaries = async (currentToken: string) => {
    const data = await apiRequest<DiaryEntry[]>("/api/diaries", { token: currentToken });
    setEntries(data);
  };

  useEffect(() => {
    if (!token) {
      return;
    }
    fetchDiaries(token).catch((err) => {
      setError(err instanceof Error ? err.message : "日記取得に失敗しました");
      clearAuthToken();
      router.push("/login");
    });
  }, [token, router]);

  const hasContent = useMemo(() => {
    return [
      form.content,
      form.events,
      form.emotions,
      form.good_things,
      form.reflections,
      form.gratitude,
      form.tomorrow_goals,
      form.tomorrow_looking_forward,
      form.learnings,
      form.health_habits,
      form.today_in_one_word,
    ].some((v) => v.trim().length > 0);
  }, [form]);

  const update = (key: keyof DiaryForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const uploadFile = async (e: ChangeEvent<HTMLInputElement>, kind: "image" | "audio") => {
    if (!token || !e.target.files?.[0]) {
      return;
    }
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append(kind, file);

    try {
      const data = await apiRequest<{ url: string; name: string }>(`/api/upload/${kind}`, {
        method: "POST",
        token,
        body: formData,
        isForm: true,
      });
      if (kind === "image") {
        update("image_url", data.url);
        update("image_name", data.name);
      } else {
        update("audio_url", data.url);
        update("audio_name", data.name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "アップロードに失敗しました");
    }
  };

  const submitDiary = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) {
      return;
    }
    setError(null);

    if (!hasContent) {
      setError("少なくとも1つの項目を入力してください");
      return;
    }

    setLoading(true);
    try {
      await apiRequest<DiaryEntry>("/api/diaries", {
        method: "POST",
        token,
        body: form,
      });
      setForm(defaultForm());
      await fetchDiaries(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (entry: DiaryEntry) => {
    if (!token) {
      return;
    }
    try {
      await apiRequest<{ id: string; is_public: boolean }>(`/api/diaries/${entry.id}/visibility`, {
        method: "PATCH",
        token,
        body: { is_public: !entry.is_public },
      });
      await fetchDiaries(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "公開設定の更新に失敗しました");
    }
  };

  const deleteDiary = async () => {
    if (!token || !confirmDeleteId) {
      return;
    }
    try {
      await apiRequest<{ message: string }>(`/api/diaries/${confirmDeleteId}`, {
        method: "DELETE",
        token,
      });
      setConfirmDeleteId(null);
      await fetchDiaries(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました");
    }
  };

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="mb-4 text-xl font-bold">マイ日記</h1>
        {error ? <p className="mb-3 rounded bg-rose-100 px-3 py-2 text-rose-700">{error}</p> : null}

        <form onSubmit={submitDiary} className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm">日付</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
                className="w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm">天気</label>
              <select
                value={form.weather}
                onChange={(e) => update("weather", e.target.value)}
              className="w-full rounded border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              >
                {weatherOptions.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <textarea
            placeholder="今日のことを書いてください..."
            value={form.content}
            onChange={(e) => update("content", e.target.value)}
            className="min-h-28 w-full rounded border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />

          {([
            ["events", "📝 出来事"],
            ["emotions", "💭 感情"],
            ["good_things", "😊 よかったこと"],
            ["reflections", "🤔 反省点"],
            ["gratitude", "🙏 感謝したこと"],
            ["tomorrow_goals", "🎯 明日の目標"],
            ["tomorrow_looking_forward", "✨ 明日の楽しみ"],
            ["learnings", "💡 学んだこと・気づき"],
            ["health_habits", "💪 健康・習慣"],
            ["today_in_one_word", "🏷️ 今日を一言で"],
          ] as const).map(([key, label]) => (
            <div key={key}>
              <label className="mb-1 block text-sm">{label}</label>
              <textarea
                value={form[key]}
                onChange={(e) => update(key, e.target.value)}
                className="min-h-20 w-full rounded border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </div>
          ))}

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm">画像（5MBまで）</label>
              <input type="file" accept="image/*" onChange={(e) => uploadFile(e, "image")} />
            </div>
            <div>
              <label className="mb-1 block text-sm">音声（10MBまで）</label>
              <input
                type="file"
                accept=".mp3,.wav,.ogg,.m4a,.aac,.webm,audio/*"
                onChange={(e) => uploadFile(e, "audio")}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={(e) => update("is_public", e.target.checked)}
            />
            この日記を公開する
          </label>

          <button
            type="submit"
            disabled={loading}
            className="rounded bg-sky-600 px-4 py-2 text-white hover:bg-sky-700 disabled:opacity-60"
          >
            {loading ? "保存中..." : "保存する"}
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">日記一覧</h2>
        {entries.map((entry) => (
          <DiaryCard
            key={entry.id}
            entry={entry}
            showActions
            onToggle={() => {
              void toggleVisibility(entry);
            }}
            onDelete={() => setConfirmDeleteId(entry.id)}
          />
        ))}
      </section>

      {confirmDeleteId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 dark:bg-zinc-900">
            <p className="mb-4">この日記を削除しますか？</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="rounded border border-zinc-300 px-3 py-1.5 dark:border-zinc-700"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => {
                  void deleteDiary();
                }}
                className="rounded bg-rose-600 px-3 py-1.5 text-white"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
