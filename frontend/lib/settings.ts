import type { DiaryFieldKey, DiaryFieldSettings } from "@/lib/types";

export const DIARY_FIELD_SETTINGS_KEY = "diary-field-settings";

export const DIARY_FIELD_ITEMS: ReadonlyArray<{ key: DiaryFieldKey; label: string }> = [
  { key: "events", label: "📝 出来事" },
  { key: "emotions", label: "💭 感情" },
  { key: "good_things", label: "😊 よかったこと" },
  { key: "reflections", label: "🤔 反省点" },
  { key: "gratitude", label: "🙏 感謝したこと" },
  { key: "tomorrow_goals", label: "🎯 明日の目標" },
  { key: "tomorrow_looking_forward", label: "✨ 明日の楽しみ" },
  { key: "learnings", label: "💡 学んだこと・気づき" },
  { key: "health_habits", label: "💪 健康・習慣チェック" },
  { key: "today_in_one_word", label: "🏷️ 今日を一言で" },
];

export function getDefaultDiaryFieldSettings(): DiaryFieldSettings {
  return {
    events: true,
    emotions: true,
    good_things: true,
    reflections: true,
    gratitude: true,
    tomorrow_goals: true,
    tomorrow_looking_forward: true,
    learnings: true,
    health_habits: true,
    today_in_one_word: true,
  };
}

export function loadDiaryFieldSettings(): DiaryFieldSettings {
  if (typeof window === "undefined") {
    return getDefaultDiaryFieldSettings();
  }

  const defaults = getDefaultDiaryFieldSettings();
  const raw = localStorage.getItem(DIARY_FIELD_SETTINGS_KEY);
  if (!raw) {
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<Record<DiaryFieldKey, unknown>>;
    const merged: DiaryFieldSettings = { ...defaults };

    for (const item of DIARY_FIELD_ITEMS) {
      if (typeof parsed[item.key] === "boolean") {
        merged[item.key] = parsed[item.key] as boolean;
      }
    }

    return merged;
  } catch {
    return defaults;
  }
}

export function saveDiaryFieldSettings(settings: DiaryFieldSettings): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(DIARY_FIELD_SETTINGS_KEY, JSON.stringify(settings));
}
