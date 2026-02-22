"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { apiRequest } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import {
  DIARY_FIELD_ITEMS,
  getDefaultDiaryFieldSettings,
  loadDiaryFieldSettings,
} from "@/lib/settings";
import type { DiaryEntry, DiaryFieldSettings } from "@/lib/types";

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
  const [form, setForm] = useState<DiaryForm>(defaultForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldSettings] = useState<DiaryFieldSettings>(() => {
    if (typeof window === "undefined") {
      return getDefaultDiaryFieldSettings();
    }
    return loadDiaryFieldSettings();
  });

  useEffect(() => {
    const currentToken = getAuthToken();
    if (!currentToken) {
      router.push("/login");
      return;
    }
    setToken(currentToken);
  }, [router]);

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

  const visibleFieldItems = useMemo(() => {
    return DIARY_FIELD_ITEMS.filter((item) => fieldSettings[item.key]);
  }, [fieldSettings]);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-5 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">マイ日記登録</h1>
          <Link
            href="/diary/list"
            className="rounded bg-zinc-700 px-3 py-1.5 text-sm text-white hover:bg-zinc-800 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            日記一覧を見る
          </Link>
        </div>
        {error ? <p className="mb-3 rounded bg-rose-100 px-3 py-2 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">{error}</p> : null}

        <form onSubmit={submitDiary} className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200">日付</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
                className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200">天気</label>
              <select
                value={form.weather}
                onChange={(e) => update("weather", e.target.value)}
                className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
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
            className="min-h-28 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />

          {visibleFieldItems.map((item) => (
            <div key={item.key}>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200">{item.label}</label>
              <textarea
                value={form[item.key]}
                onChange={(e) => update(item.key, e.target.value)}
                className="min-h-20 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
            </div>
          ))}

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200">画像（5MBまで）</label>
              <input
                className="w-full cursor-pointer rounded-md border border-zinc-300 bg-white p-2 text-sm text-zinc-700 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-sky-600 file:px-3 file:py-1.5 file:font-medium file:text-white hover:file:bg-sky-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
                type="file"
                accept="image/*"
                onChange={(e) => uploadFile(e, "image")}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200">音声（10MBまで）</label>
              <input
                className="w-full cursor-pointer rounded-md border border-zinc-300 bg-white p-2 text-sm text-zinc-700 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-emerald-600 file:px-3 file:py-1.5 file:font-medium file:text-white hover:file:bg-emerald-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
                type="file"
                accept=".mp3,.wav,.ogg,.m4a,.aac,.webm,audio/*"
                onChange={(e) => uploadFile(e, "audio")}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
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
    </main>
  );
}
