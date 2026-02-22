import type { DiaryEntry } from "@/lib/types";

export type DiaryForm = {
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

export const weatherOptions = [
  { value: "", label: "未選択" },
  { value: "sunny", label: "☀️ 晴れ" },
  { value: "cloudy", label: "☁️ 曇り" },
  { value: "rainy", label: "🌧️ 雨" },
  { value: "snowy", label: "❄️ 雪" },
  { value: "stormy", label: "⛈️ 嵐" },
  { value: "foggy", label: "🌫️ 霧" },
  { value: "partly-cloudy", label: "⛅ 晴れ時々曇り" },
  { value: "windy", label: "💨 風が強い" },
] as const;

export const defaultDiaryForm = (): DiaryForm => ({
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

export const entryToDiaryForm = (entry: DiaryEntry): DiaryForm => ({
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
