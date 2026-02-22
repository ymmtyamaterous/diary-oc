"use client";

import { useState } from "react";

import type { DiaryFieldKey, DiaryFieldSettings } from "@/lib/types";
import {
  DIARY_FIELD_ITEMS,
  loadDiaryFieldSettings,
  saveDiaryFieldSettings,
} from "@/lib/settings";

export default function SettingsPage() {
  const [settings, setSettings] = useState<DiaryFieldSettings>(() => loadDiaryFieldSettings());
  const [saved, setSaved] = useState(false);

  const toggle = (key: DiaryFieldKey) => {
    setSaved(false);
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const save = () => {
    saveDiaryFieldSettings(settings);
    setSaved(true);
  };

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-5 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
        <h1 className="text-xl font-bold">設定</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          日記フォームの表示項目を個別に切り替えられます。
        </p>

        <div className="mt-5 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">日記フォームの表示項目</h2>
          {DIARY_FIELD_ITEMS.map((item) => (
            <label key={item.key} className="flex items-center gap-3 rounded border border-zinc-200 px-3 py-2 dark:border-zinc-700">
              <input
                type="checkbox"
                checked={settings[item.key]}
                onChange={() => toggle(item.key)}
                className="h-4 w-4"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            className="rounded bg-sky-600 px-4 py-2 text-white hover:bg-sky-700"
          >
            設定を保存する
          </button>
          {saved ? <span className="text-sm text-emerald-600 dark:text-emerald-400">保存しました</span> : null}
        </div>
      </section>
    </main>
  );
}
