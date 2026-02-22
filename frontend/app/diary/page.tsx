"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { apiFileUrl, apiRequest } from "@/lib/api";
import { clearAuthToken, getAuthToken } from "@/lib/auth";
import {
  DIARY_FIELD_ITEMS,
  getDefaultDiaryFieldSettings,
  loadDiaryFieldSettings,
} from "@/lib/settings";
import type { DiaryEntry, DiaryFieldSettings } from "@/lib/types";
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

const entryToForm = (entry: DiaryEntry): DiaryForm => ({
  date: entry.date,
  weather: entry.weather ?? "",
  is_public: entry.is_public,
  content: entry.content ?? "",
  events: entry.events ?? "",
  emotions: entry.emotions ?? "",
  good_things: entry.good_things ?? "",
  reflections: entry.reflections ?? "",
  gratitude: entry.gratitude ?? "",
  tomorrow_goals: entry.tomorrow_goals ?? "",
  tomorrow_looking_forward: entry.tomorrow_looking_forward ?? "",
  learnings: entry.learnings ?? "",
  health_habits: entry.health_habits ?? "",
  today_in_one_word: entry.today_in_one_word ?? "",
  image_url: entry.image_url ?? "",
  image_name: entry.image_name ?? "",
  audio_url: entry.audio_url ?? "",
  audio_name: entry.audio_name ?? "",
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

const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

const toDateKey = (value: string): string => {
  return value.split("T")[0] ?? value;
};

export default function DiaryPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [form, setForm] = useState<DiaryForm>(defaultForm());
  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [editForm, setEditForm] = useState<DiaryForm>(defaultForm());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
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

  const hasEditContent = useMemo(() => {
    return [
      editForm.content,
      editForm.events,
      editForm.emotions,
      editForm.good_things,
      editForm.reflections,
      editForm.gratitude,
      editForm.tomorrow_goals,
      editForm.tomorrow_looking_forward,
      editForm.learnings,
      editForm.health_habits,
      editForm.today_in_one_word,
    ].some((v) => v.trim().length > 0);
  }, [editForm]);

  const visibleFieldItems = useMemo(() => {
    return DIARY_FIELD_ITEMS.filter((item) => fieldSettings[item.key]);
  }, [fieldSettings]);

  const entryCountByDate = useMemo(() => {
    return entries.reduce<Record<string, number>>((acc, entry) => {
      const dateKey = toDateKey(entry.date);
      acc[dateKey] = (acc[dateKey] ?? 0) + 1;
      return acc;
    }, {});
  }, [entries]);

  const calendarCells = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<string | null> = [];

    for (let i = 0; i < firstDay; i += 1) {
      cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
    }
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [calendarDate]);

  const filteredEntries = useMemo(() => {
    if (!selectedDate) {
      return entries;
    }
    return entries.filter((entry) => toDateKey(entry.date) === selectedDate);
  }, [entries, selectedDate]);

  const update = (key: keyof DiaryForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateEdit = (key: keyof DiaryForm, value: string | boolean) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  const uploadFile = async (
    e: ChangeEvent<HTMLInputElement>,
    kind: "image" | "audio",
    target: "create" | "edit",
  ) => {
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
        if (target === "create") {
          update("image_url", data.url);
          update("image_name", data.name);
        } else {
          updateEdit("image_url", data.url);
          updateEdit("image_name", data.name);
        }
      } else {
        if (target === "create") {
          update("audio_url", data.url);
          update("audio_name", data.name);
        } else {
          updateEdit("audio_url", data.url);
          updateEdit("audio_name", data.name);
        }
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

  const openEditModal = (entry: DiaryEntry) => {
    setEditingEntry(entry);
    setEditForm(entryToForm(entry));
    setError(null);
  };

  const closeEditModal = () => {
    setEditingEntry(null);
    setEditForm(defaultForm());
  };

  const moveCalendarMonth = (offset: number) => {
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const submitEditDiary = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || !editingEntry) {
      return;
    }
    setError(null);

    if (!hasEditContent) {
      setError("少なくとも1つの項目を入力してください");
      return;
    }

    setEditLoading(true);
    try {
      const originalImageName = editingEntry.image_name;
      const originalAudioName = editingEntry.audio_name;

      await apiRequest<DiaryEntry>(`/api/diaries/${editingEntry.id}`, {
        method: "PUT",
        token,
        body: editForm,
      });

      const fileDeleteTasks: Promise<unknown>[] = [];
      if (originalImageName && originalImageName !== editForm.image_name) {
        fileDeleteTasks.push(
          apiRequest<{ message: string }>(`/api/files/${encodeURIComponent(originalImageName)}`, {
            method: "DELETE",
            token,
          }),
        );
      }
      if (originalAudioName && originalAudioName !== editForm.audio_name) {
        fileDeleteTasks.push(
          apiRequest<{ message: string }>(`/api/files/${encodeURIComponent(originalAudioName)}`, {
            method: "DELETE",
            token,
          }),
        );
      }
      if (fileDeleteTasks.length > 0) {
        await Promise.allSettled(fileDeleteTasks);
      }

      await fetchDiaries(token);
      closeEditModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新に失敗しました");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-5 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
        <h1 className="mb-4 text-xl font-bold text-zinc-900 dark:text-zinc-100">マイ日記</h1>
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
                onChange={(e) => uploadFile(e, "image", "create")}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200">音声（10MBまで）</label>
              <input
                className="w-full cursor-pointer rounded-md border border-zinc-300 bg-white p-2 text-sm text-zinc-700 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-emerald-600 file:px-3 file:py-1.5 file:font-medium file:text-white hover:file:bg-emerald-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
                type="file"
                accept=".mp3,.wav,.ogg,.m4a,.aac,.webm,audio/*"
                onChange={(e) => uploadFile(e, "audio", "create")}
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

      <section className="space-y-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">カレンダー</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => moveCalendarMonth(-1)}
                className="rounded border border-zinc-300 px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                aria-label="前の月"
              >
                ←
              </button>
              <p className="min-w-24 text-center text-sm font-medium text-zinc-700 dark:text-zinc-200">
                {calendarDate.getFullYear()}年{calendarDate.getMonth() + 1}月
              </p>
              <button
                type="button"
                onClick={() => moveCalendarMonth(1)}
                className="rounded border border-zinc-300 px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                aria-label="次の月"
              >
                →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-500 dark:text-zinc-400">
            {weekDays.map((weekDay) => (
              <p key={weekDay} className="py-1 font-medium">
                {weekDay}
              </p>
            ))}
            {calendarCells.map((dateKey, idx) => {
              if (!dateKey) {
                return <div key={`empty-${idx}`} className="h-16 rounded bg-zinc-50 dark:bg-zinc-950" />;
              }

              const count = entryCountByDate[dateKey] ?? 0;
              const isSelected = selectedDate === dateKey;

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => setSelectedDate((prev) => (prev === dateKey ? null : dateKey))}
                  className={`h-16 rounded border p-1 text-left align-top ${
                    isSelected
                      ? "border-sky-500 bg-sky-100 dark:border-sky-400 dark:bg-sky-900/40"
                      : "border-zinc-200 bg-white hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                  }`}
                >
                  <p className="text-xs text-zinc-700 dark:text-zinc-200">{Number(dateKey.slice(8, 10))}</p>
                  {count > 0 ? (
                    <p className="mt-1 text-[11px] font-medium text-sky-700 dark:text-sky-300">{count}件</p>
                  ) : (
                    <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">-</p>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between text-sm">
            <p className="text-zinc-700 dark:text-zinc-200">
              {selectedDate ? `${selectedDate} の日記を表示中` : "全ての日記を表示中"}
            </p>
            {selectedDate ? (
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                フィルター解除
              </button>
            ) : null}
          </div>
        </div>

        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">日記一覧</h2>
        {filteredEntries.length === 0 ? (
          <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            該当する日記はありません。
          </p>
        ) : null}
        {filteredEntries.map((entry) => (
          <DiaryCard
            key={entry.id}
            entry={entry}
            showActions
            onEdit={() => openEditModal(entry)}
            onToggle={() => {
              void toggleVisibility(entry);
            }}
            onDelete={() => setConfirmDeleteId(entry.id)}
          />
        ))}
      </section>

      {confirmDeleteId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
            <p className="mb-4 text-zinc-900 dark:text-zinc-100">この日記を削除しますか？</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="rounded border border-zinc-300 px-3 py-1.5 text-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
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

      {editingEntry ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-5 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
            <h3 className="mb-4 text-lg font-semibold">日記を編集</h3>
            <form onSubmit={submitEditDiary} className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200">日付</label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => updateEdit("date", e.target.value)}
                    className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200">天気</label>
                  <select
                    value={editForm.weather}
                    onChange={(e) => updateEdit("weather", e.target.value)}
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
                value={editForm.content}
                onChange={(e) => updateEdit("content", e.target.value)}
                className="min-h-28 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />

              {visibleFieldItems.map((item) => (
                <div key={item.key}>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200">{item.label}</label>
                  <textarea
                    value={editForm[item.key]}
                    onChange={(e) => updateEdit(item.key, e.target.value)}
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
                    onChange={(e) => uploadFile(e, "image", "edit")}
                  />
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    新しい画像を選択しない場合、現在の画像がそのまま保存されます。
                  </p>
                  {editForm.image_url ? (
                    <div className="mt-2 rounded border border-zinc-200 p-2 dark:border-zinc-700">
                      <p className="mb-2 text-xs text-zinc-600 dark:text-zinc-300">
                        現在の画像: {editForm.image_name || "保存済み画像"}
                      </p>
                      {apiFileUrl(editForm.image_url) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={apiFileUrl(editForm.image_url) ?? undefined}
                          alt="現在の画像"
                          className="max-h-40 w-full rounded object-cover"
                        />
                      ) : null}
                      <button
                        type="button"
                        onClick={() => {
                          updateEdit("image_url", "");
                          updateEdit("image_name", "");
                        }}
                        className="mt-2 rounded border border-rose-300 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-950/40"
                      >
                        画像を外す
                      </button>
                    </div>
                  ) : null}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200">音声（10MBまで）</label>
                  <input
                    className="w-full cursor-pointer rounded-md border border-zinc-300 bg-white p-2 text-sm text-zinc-700 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-emerald-600 file:px-3 file:py-1.5 file:font-medium file:text-white hover:file:bg-emerald-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
                    type="file"
                    accept=".mp3,.wav,.ogg,.m4a,.aac,.webm,audio/*"
                    onChange={(e) => uploadFile(e, "audio", "edit")}
                  />
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    新しい音声を選択しない場合、現在の音声がそのまま保存されます。
                  </p>
                  {editForm.audio_url ? (
                    <div className="mt-2 rounded border border-zinc-200 p-2 dark:border-zinc-700">
                      <p className="mb-2 text-xs text-zinc-600 dark:text-zinc-300">
                        現在の音声: {editForm.audio_name || "保存済み音声"}
                      </p>
                      {apiFileUrl(editForm.audio_url) ? (
                        <audio controls className="w-full">
                          <source src={apiFileUrl(editForm.audio_url) ?? undefined} />
                        </audio>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => {
                          updateEdit("audio_url", "");
                          updateEdit("audio_name", "");
                        }}
                        className="mt-2 rounded border border-rose-300 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-950/40"
                      >
                        音声を外す
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
                <input
                  type="checkbox"
                  checked={editForm.is_public}
                  onChange={(e) => updateEdit("is_public", e.target.checked)}
                />
                この日記を公開する
              </label>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded border border-zinc-300 px-3 py-1.5 text-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="rounded bg-sky-600 px-4 py-2 text-white hover:bg-sky-700 disabled:opacity-60"
                >
                  {editLoading ? "保存中..." : "保存する"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
